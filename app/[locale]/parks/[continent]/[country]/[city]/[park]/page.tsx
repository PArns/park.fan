import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternateLanguages, SITE_URL } from '@/i18n/config';
import { buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { translateCountry, translateContinent } from '@/lib/i18n/helpers';
import { notFound, permanentRedirect } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { getParkByGeoPath } from '@/lib/api/parks';
import { getBestDaysCalendarSeed } from '@/lib/api/integrated-calendar';
import { getCalendarWindow } from '@/lib/hooks/use-calendar-window';
import { catchNonFatal } from '@/lib/api/client';
import { getGlossaryTerms } from '@/lib/glossary/translations';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import type { Locale } from '@/i18n/config';
import { WeatherCard } from '@/components/parks/weather-card';
import { WeatherNowcastBanner } from '@/components/parks/weather-nowcast-banner';
import { WeatherWarningBanner } from '@/components/parks/weather-warning-banner';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import {
  ParkStructuredData,
  BreadcrumbStructuredData,
  ShowsStructuredData,
} from '@/components/seo/structured-data';
import { FAQStructuredData } from '@/components/seo/faq-structured-data';
import { ParkFAQSection } from '@/components/faq/park-faq-section';
import type { Metadata } from 'next';
import { ParkBackground } from '@/components/parks/park-background';
import { ParkFavoriteButton } from '@/components/parks/park-favorite-button';
import { ShareButtons } from '@/components/common/share-buttons';
import { getParkBackgroundImage } from '@/lib/utils/park-assets';
import { PageContainer } from '@/components/common/page-container';
import { GlassCard } from '@/components/common/glass-card';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { findParkPageRedirect, findRelocatedParkRedirect } from '@/lib/utils/redirect-utils';
import { stripNewPrefix } from '@/lib/utils';
import { LiveParkData } from '@/components/parks/live-park-data';
import { ParkHeaderStats } from '@/components/parks/park-header-stats';
import { HeaderHolidayPanel } from '@/components/parks/header-holiday-panel';
import { ParkBestDaysSection } from '@/components/parks/park-best-days-section';
import { ParkStatsSection } from '@/components/parks/park-stats-section';
import { NearbyParksSection } from '@/components/parks/nearby-parks-section';
import { ContributeBanner } from '@/components/contribute/contribute-banner';
import { buildContributeHref } from '@/lib/contribute/prefill';
import { groupAttractionsByLand } from '@/lib/utils/park-utils';
import { generateParkBreadcrumbs } from '@/lib/utils/breadcrumb-utils';
import { translateGeoSlug } from '@/lib/utils/geo-translate';

interface ParkPageProps {
  params: Promise<{
    locale: string;
    continent: string;
    country: string;
    city: string;
    park: string;
  }>;
}

// FULLY DYNAMIC (force-dynamic) — rendered per request, so NO per-URL ISR shell write across the
// catalog × 6 locales. Cache Components is off; the structure (header, attraction wait-time
// overview incl. every attraction name/link, FAQ, JSON-LD) AND — when its cache is warm — the
// best-days section render server-side into the first HTML from the data-cached snapshots
// (getParkByGeoPath / getBestDaysCalendarSeed; the seed is timeout-guarded so a cold calendar
// fill can never block TTFB). Live status/wait times, weather nowcast and historical stats are
// client-loaded (React Query) and stream in afterwards.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: ParkPageProps): Promise<Metadata> {
  const { continent, country, city, park: parkSlug, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo.parks' });
  const tGlobal = await getTranslations({ locale, namespace: 'seo.global' });
  const tGeo = await getTranslations({ locale, namespace: 'geo' });
  const tNotFound = await getTranslations({ locale, namespace: 'seo.notFound' });
  const tImageAlt = await getTranslations({ locale, namespace: 'seo.imageAlt' });

  // If this is a malformed URL (e.g. .../efteling/villa-volta), avoid calling the API
  const redirectUrl = await findParkPageRedirect(continent, country, city, parkSlug);
  if (redirectUrl) {
    return {
      title: tNotFound('park'),
      alternates: { canonical: `${SITE_URL}/${locale}${redirectUrl}` },
    };
  }

  const park = await catchNonFatal(getParkByGeoPath(continent, country, city, parkSlug));

  if (!park) {
    // Stale geo segments (re-slugged/relocated city)? Point canonical at the
    // park's current path — the page body issues the actual 308.
    const relocatedUrl = await findRelocatedParkRedirect(continent, country, city, parkSlug);
    if (relocatedUrl) {
      return {
        title: tNotFound('park'),
        alternates: { canonical: `${SITE_URL}/${locale}${relocatedUrl}` },
      };
    }
    return { title: tNotFound('park') };
  }

  const ogImageUrl = getOgImageUrl([locale, continent, country, city, parkSlug]);
  const parkName = stripNewPrefix(park.name);

  const cityName = park.city || city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ');
  const countryName = translateCountry(tGeo, country, locale, park.country ?? undefined);

  const parkNameLower = parkName.toLowerCase();
  const cityNameLower = cityName.toLowerCase();
  const cityInParkName =
    parkNameLower.includes(cityNameLower) ||
    cityNameLower
      .split(/\s+/)
      .some((word) => word.length > 3 && parkNameLower.split(/\s+/).includes(word));
  const titleKey = cityInParkName ? 'titleTemplateNoCity' : 'titleTemplate';
  const title = cityInParkName
    ? t(titleKey, { park: parkName })
    : t(titleKey, { park: parkName, city: cityName });

  const descriptionKey = cityInParkName
    ? 'metaDescriptionTemplateNoCity'
    : 'metaDescriptionTemplate';
  const description = cityInParkName
    ? t(descriptionKey, { park: parkName })
    : t(descriptionKey, { park: parkName, city: cityName });

  const keywords = [
    parkName,
    `${parkName} ${cityName}`,
    `${parkName} ${countryName}`,
    `${parkName} ${t('keywordWaitTimes')}`,
    `${parkName} ${t('keywordCrowdCalendar')}`,
    `${parkName} ${t('keywordBestTime')}`,
    cityName,
    countryName,
    tGlobal('keywords'),
  ].join(', ');

  return {
    title,
    description,
    keywords,
    ...buildOpenGraphMetadata({
      locale,
      title,
      description,
      url: `${SITE_URL}/${locale}/parks/${continent}/${country}/${city}/${parkSlug}`,
      ogImageUrl,
      imageAlt: tImageAlt('park', { park: parkName }),
    }),
    alternates: {
      canonical: `${SITE_URL}/${locale}/parks/${continent}/${country}/${city}/${parkSlug}`,
      languages: {
        ...generateAlternateLanguages(
          (l) => `/${l}/parks/${continent}/${country}/${city}/${parkSlug}`
        ),
        'x-default': `${SITE_URL}/en/parks/${continent}/${country}/${city}/${parkSlug}`,
      },
    },
  };
}

// force-dynamic (see the `export const dynamic` above): the structure (header, attraction
// wait-time overview, FAQ, JSON-LD) renders server-side into the first HTML — content-first —
// from the data-cached park snapshot (getParkByGeoPath); the best-days section additionally
// seeds from the data-cached calendar (timeout-guarded, see below). The LIVE values and the
// historical stats stay CLIENT-loaded (React Query → CDN-cached /api routes) and trickle in
// behind the SSR content, so their cold/slow fetches never block this page's TTFB.
export default async function ParkPage({ params }: ParkPageProps) {
  const { locale, continent, country, city, park: parkSlug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('parks');
  const tCommon = await getTranslations('common');
  const tGeo = await getTranslations('geo');
  const tSeo = await getTranslations('seo.parks');

  // Check for malformed URLs first (e.g. /parks/europe/netherlands/efteling/villa-volta
  // where "efteling" is the park and "villa-volta" is an attraction). Redirect before
  // calling the API to avoid 404s on the backend.
  const redirectUrl = await findParkPageRedirect(continent, country, city, parkSlug);
  if (redirectUrl) {
    permanentRedirect(`/${locale}${redirectUrl}`);
  }

  // Best-days calendar SEED: fired in parallel with the park fetch below. It reads the
  // `unstable_cache` snapshot (BEST_DAYS_REVALIDATE) (getBestDaysCalendar, SWR + `best-days:<slug>` tag) and gives up
  // after a short timeout on a cold cache MISS (the raw calendar can take 10–20s of backend
  // compute and must never block this dynamic page's TTFB — `after()` keeps the abandoned fill
  // running so the NEXT request is warm). The seed feeds the SSR render of the best-days
  // section + the crowd FAQ/JSON-LD; the deferred CLIENT queries (React Query → CDN-cached
  // `/api/parks/.../calendar` + `/stats`, `useLoadLast`-gated) still load exactly as before and
  // replace the seed once they settle — the loading-priority REQUIREMENT is untouched.
  // The month-aligned window keeps the cache key stable for a whole calendar month. ONE
  // per-request clock read serves both the window and every seed-rendered "today" derivation
  // (safe: the page is force-dynamic, nothing here is statically cached).
  const seedNow = new Date();
  const seedNowMs = seedNow.getTime();
  const calendarWindow = getCalendarWindow(seedNow);
  const bestDaysSeedPromise = getBestDaysCalendarSeed(
    continent,
    country,
    city,
    parkSlug,
    calendarWindow
  );

  // Fetch park data and holidays (holidays are optional)
  const park = await catchNonFatal(getParkByGeoPath(continent, country, city, parkSlug));

  if (!park) {
    // The park slug is stable across API geo re-slugs (bruhl → bruehl etc.).
    // If it exists under different geo segments, 308 to the canonical path so
    // Google transfers the old URL's signals instead of dropping a 404.
    const relocatedUrl = await findRelocatedParkRedirect(continent, country, city, parkSlug);
    if (relocatedUrl) {
      permanentRedirect(`/${locale}${relocatedUrl}`);
    }
    notFound();
  }

  const bestDaysSeed = await bestDaysSeedPromise;

  // Historical stats are still loaded CLIENT-side only (React Query → the CDN-cached `/stats`
  // route, `useLoadLast`-gated): the 2-year aggregate is the other slow cold-compute response,
  // and the best-days section renders its calendar-based fallback until it lands.

  // Glossary terms for the (client) FAQ section. This is a small static-content lookup (no fetch,
  // no clock) so it's safe to load in the static shell; the client FAQ tree highlights terms from
  // these props instead of awaiting them itself.
  const glossaryTerms = await getGlossaryTerms(locale as Locale);
  const glossarySegment = GLOSSARY_SEGMENTS[locale as Locale];
  const faqGlossaryTerms = glossaryTerms.map((term) => ({
    id: term.id,
    name: term.name,
    shortDefinition: term.shortDefinition,
    slug: term.slug,
    aliases: term.aliases,
  }));

  // Nowcast (rain/storm warnings) is intentionally NOT fetched in the static shell. Its `'use cache'`
  // fill can time out during prerender (the nowcast endpoint is the slowest park dependency), which
  // FAILS the park page's static prerender and makes Next fall back to dynamic rendering for the whole
  // route — served `no-store`, so the CDN never caches it and every request hits the function (the
  // root cause of the park-route ISR write churn). Both consumers (WeatherNowcastBanner, WeatherCard)
  // already fetch the nowcast client-side via useWeatherNowcast, so no SSR seed is needed.

  // Historical stats (2-year aggregate) feed only the below-the-fold stats + best-days sections and
  // are likewise loaded CLIENT-side (useParkHistoricalStats → the `/api/parks/.../stats` CDN-cached
  // route), so the slow cold-compute response never blocks or poisons the static shell.

  // Group attractions by land
  const otherAttractionsLabel = t('otherAttractions');
  const attractionsByLand = groupAttractionsByLand(park.attractions || [], otherAttractionsLabel);
  const landNames = Object.keys(attractionsByLand).sort((a, b) => {
    // Put "Other Attractions" at the end
    if (a === otherAttractionsLabel) return 1;
    if (b === otherAttractionsLabel) return -1;
    return a.localeCompare(b);
  });

  // Format names for breadcrumb - use actual names from park data (proper umlauts)
  const continentName = translateContinent(tGeo, continent, locale);
  const countryName = translateCountry(tGeo, country, locale, park.country ?? undefined);
  const cityName = park.city || city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ');

  // Today's schedule is picked CLIENT-side inside <ParkHeaderStats> (from the browser clock in the
  // park's timezone) — the full day-stable park.schedule is handed down instead of a server-derived
  // "today" entry, so the shell never reads the server clock.
  const parkName = stripNewPrefix(park.name);

  // Construct breadcrumbs using utility
  const tNav = await getTranslations('navigation');
  const { breadcrumbs, currentPage: parkCurrentPage } = generateParkBreadcrumbs({
    continent,
    country,
    city,
    continentName,
    countryName,
    cityName,
    parkName,
    homeLabel: tCommon('home'),
    continentsLabel: tNav('continents'),
  });

  const parkBgImage = getParkBackgroundImage(parkSlug);
  // OG card is only a fallback for the JSON-LD image when the park has no real photo.
  const ogImageUrl = getOgImageUrl([locale, continent, country, city, parkSlug]);

  return (
    <>
      {/* No manual <link rel="preload"> here: it pointed at the RAW /images/parks/.../background.jpg,
          but <ParkBackground> renders it through next/image (/_next/image?…&q=90). The raw preload
          was never the LCP resource — it just downloaded the full-size original in parallel,
          competing for bandwidth with the optimized image. next/image's `priority` already preloads
          the correct optimized rendition. */}
      <ParkBackground imageSrc={parkBgImage} alt={parkName} />

      <PageContainer>
        <ParkStructuredData
          park={park}
          url={`${SITE_URL}/${locale}/parks/${continent}/${country}/${city}/${parkSlug}`}
          description={tSeo('metaDescriptionTemplate', { park: parkName, city: cityName })}
          locale={locale}
          ogImageUrl={ogImageUrl}
        />
        <BreadcrumbStructuredData breadcrumbs={breadcrumbs} locale={locale} />
        {park.shows && park.shows.length > 0 && (
          <ShowsStructuredData shows={park.shows} park={park} />
        )}
        <FAQStructuredData
          park={park}
          locale={locale}
          nowMs={seedNowMs}
          calendarSeed={
            bestDaysSeed
              ? { days: bestDaysSeed.days, timezone: bestDaysSeed.meta.timezone }
              : null
          }
        />

        {/* Breadcrumb — visible nav streams (next-intl links are dynamic under Cache
            Components); the BreadcrumbList JSON-LD above stays in the static shell for SEO. */}
        <Suspense fallback={<div className="h-6" />}>
          <BreadcrumbNav breadcrumbs={breadcrumbs} currentPage={parkCurrentPage} />
        </Suspense>

        <article itemScope itemType="https://schema.org/ThemePark">
          {/* Park Header */}
          <div className="mb-8">
            <GlassCard variant="medium">
              {/* Title row: park name + location on the left, favourite button pinned top-right. */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* The wait-times keyword lives INSIDE the h1 (same size + color as the
                      park name, only lighter weight) so the target term "{park} Wartezeiten"
                      reads as one unified heading — the single strongest on-page signal for
                      the "<park> wartezeiten" query. */}
                  <h1 className="mb-2 text-3xl font-bold md:text-4xl">
                    {parkName} <span className="font-normal">– {t('h1Suffix')}</span>
                  </h1>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-3">
                    <address className="flex items-center gap-1 not-italic">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                      <span>{cityName}</span>,{' '}
                      <span>{translateGeoSlug(tGeo, 'countries', country, countryName)}</span>
                    </address>
                  </div>
                </div>
                {park.id && <ParkFavoriteButton parkId={park.id} />}
              </div>

              {/* Board row: today's stats board + the neighbouring-holidays column side by side, top-
                  aligned so the holiday caption lines up with STATUS (not the header top). On < lg the
                  holiday context has no right column and stacks under the intro instead. */}
              <div className="flex flex-wrap items-stretch gap-4">
                <div className="min-w-0 flex-1">
                  {/* At-a-glance "now vs. AI forecast" strip — live status/crowd next to
                      today's predicted crowd (the forecast column loads last per the
                      loading-priority rule; it shares the calendar query with the best-days
                      section below). */}
                  <ParkHeaderStats
                    initialData={park}
                    continent={continent}
                    country={country}
                    city={city}
                    parkSlug={parkSlug}
                  />
                  {/* Keyword-rich, server-rendered intro — gives Google crawlable topical
                      text with the exact "Wartezeiten im {park}" phrase + "heute" that the
                      live (client-streamed) grid doesn't provide as static text. */}
                  <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-relaxed">
                    {t('intro', { park: parkName, city: cityName })}
                  </p>
                </div>
                {/* Neighbouring-holidays context — ONE instance for all breakpoints (it used to be
                    rendered twice, `lg:hidden` + `hidden lg:block`, duplicating its text in the HTML
                    and its hydration cost). Below lg it wraps to a full-width band row under the
                    intro (top hairline); on lg+ it becomes the right-hand column beside the board —
                    full-height left divider + `mt-5 pt-4` matching the stats band's top rule, so its
                    caption sits at the SAME height as STATUS. Not a floating card. Collapses to
                    nothing when no influencing holidays apply. */}
                <HeaderHolidayPanel
                  initialData={park}
                  continent={continent}
                  country={country}
                  city={city}
                  parkSlug={parkSlug}
                  className="border-border/50 w-full border-t pt-4 lg:mt-5 lg:w-64 lg:shrink-0 lg:self-stretch lg:border-t-0 lg:border-l lg:pl-5 xl:w-72"
                />
              </div>
            </GlassCard>
          </div>

          {/* Official severe-weather warnings (DWD / MeteoAlarm) — shown above the
              self-derived nowcast banner since they carry authoritative severity. */}
          <Suspense fallback={null}>
            <WeatherWarningBanner
              continent={continent}
              country={country}
              city={city}
              parkSlug={parkSlug}
              initialData={null}
              className="mb-6"
            />
          </Suspense>

          {/* Weather nowcast banner (rain / storm / hail / thunderstorm) — client live query,
              streamed as a dynamic hole under Cache Components. */}
          <Suspense fallback={null}>
            <WeatherNowcastBanner
              continent={continent}
              country={country}
              city={city}
              parkSlug={parkSlug}
              initialData={null}
              className="mb-6"
            />
          </Suspense>

          {/* Weather — client live nowcast query, streamed as a dynamic hole. Today's schedule,
              status and opening hours now live in the <ParkHeaderStats> board up in the header,
              so there's no separate schedule card here (no duplication). */}
          {park.weather?.current && (
            <div className="mb-8">
              <Suspense fallback={null}>
                <WeatherCard
                  weather={park.weather}
                  nowcast={null}
                  continent={continent}
                  country={country}
                  city={city}
                  parkSlug={parkSlug}
                  latitude={park.latitude}
                  longitude={park.longitude}
                  timezone={park.timezone}
                  schedule={park.schedule}
                  className="border-primary/10"
                />
              </Suspense>
            </div>
          )}

          {/* Live Park Data (Status + Tabs with auto-refresh) */}
          <LiveParkData
            initialData={park}
            continent={continent}
            country={country}
            city={city}
            parkSlug={parkSlug}
            landNames={landNames}
            attractionsByLand={attractionsByLand}
            bestDaysSlot={
              <ParkBestDaysSection
                key="best-days"
                continent={continent}
                country={country}
                city={city}
                parkSlug={parkSlug}
                timezone={park.timezone}
                hasOperatingSchedule={park.hasOperatingSchedule}
                parkName={parkName}
                locale={locale}
                initialCalendar={bestDaysSeed}
                seedNowMs={seedNowMs}
              />
            }
          />

          {/* Nearby Parks — streamed (geo proximity lookup + live park cards) */}
          {park.latitude != null && park.longitude != null && (
            <Suspense fallback={null}>
              <NearbyParksSection
                parkId={park.id}
                lat={park.latitude}
                lng={park.longitude}
                className="mt-8"
              />
            </Suspense>
          )}

          {/* Historical statistics — loaded client-side (CDN-cached /stats route); a skeleton
              shows until the cold/slow stats response lands, so it never blocks the static shell. */}
          <ParkStatsSection
            continent={continent}
            country={country}
            city={city}
            parkSlug={parkSlug}
            locale={locale}
          />

          {/* FAQ Section — Q0–Q6 render from the park snapshot, Q1 (today's hours) + the
              calendar-derived Q7 render server-side from the seed/server clock; the deferred
              client calendar fetch upgrades Q7 after mount. */}
          <Separator className="my-8" />
          <ParkFAQSection
            park={park}
            locale={locale}
            continent={continent}
            country={country}
            city={city}
            parkSlug={parkSlug}
            glossaryTerms={faqGlossaryTerms}
            glossarySegment={glossarySegment}
            initialCalendar={bestDaysSeed}
            seedNowMs={seedNowMs}
          />

          <Separator className="my-8" />
          <ShareButtons
            url={`${SITE_URL}/${locale}/parks/${continent}/${country}/${city}/${parkSlug}`}
            title={park.name}
          />

          {/* Invite visitors to contribute their own photos of this park */}
          <ContributeBanner
            className="mt-8"
            href={
              park.id
                ? buildContributeHref({
                    type: 'park',
                    id: park.id,
                    name: parkName,
                    slug: parkSlug,
                    url: `/parks/${continent}/${country}/${city}/${parkSlug}`,
                    country: park.country ?? undefined,
                  })
                : undefined
            }
          />
        </article>
      </PageContainer>
    </>
  );
}
