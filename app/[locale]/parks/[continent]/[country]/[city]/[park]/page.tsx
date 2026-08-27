import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternateLanguages, SITE_URL } from '@/i18n/config';
import {
  buildOpenGraphMetadata,
  fitWithin,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from '@/lib/utils/metadata';
import { translateCountry, translateContinent } from '@/lib/i18n/helpers';
import { notFound, permanentRedirect } from 'next/navigation';
import { assertServableRoute, isServableRoute } from '@/lib/utils/route-guards';
import { MapPin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { getParkByGeoPath, getParkSeasons, leanParkForParkShell } from '@/lib/api/parks';
import { getBestDaysCalendarSeed } from '@/lib/api/integrated-calendar';
import { catchNonFatal } from '@/lib/api/client';
import { getGlossaryTerms } from '@/lib/glossary/translations';
import { filterMatchableTerms } from '@/lib/glossary/parse-segments';
import { buildParkFaqItems } from '@/lib/faq/park-faq';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import type { Locale } from '@/i18n/config';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import {
  ParkStructuredData,
  BreadcrumbStructuredData,
  ShowsStructuredData,
} from '@/components/seo/structured-data';
import { FAQStructuredData } from '@/components/seo/faq-structured-data';
import { ParkFAQSection } from '@/components/faq/park-faq-section';
import type { Metadata } from 'next';
import { objectPositionForSrc } from '@/lib/media/focus';
import { getMediaAltBySrc } from '@/lib/media/text';
import { ParkBackground } from '@/components/parks/park-background';
import { ParkFavoriteButton } from '@/components/parks/park-favorite-button';
import { ParkDistance } from '@/components/common/park-distance';
import { ShareButtons } from '@/components/common/share-buttons';
import { getParkBackgroundImage } from '@/lib/utils/park-assets';
import { PageContainer } from '@/components/common/page-container';
import { GlassCard } from '@/components/common/glass-card';
import { getOgImageUrl } from '@/lib/utils/og-image';
import {
  findParkPageRedirect,
  findRelocatedParkRedirect,
  findRenamedParkRedirect,
} from '@/lib/utils/redirect-utils';
import { stripNewPrefix } from '@/lib/utils';
import { LiveParkData } from '@/components/parks/live-park-data';
import { ParkTodayPanel } from '@/components/parks/park-today-panel';
import { ParkStatsSection } from '@/components/parks/park-stats-section';
import { ParkInfoCard } from '@/components/parks/park-info-card';
import { ParkQuickLinks } from '@/components/parks/park-quick-links';
import { ParkSeasonsCard } from '@/components/parks/park-seasons-card';
import { ParkPurchasesCard } from '@/components/parks/park-purchases-card';
import { NoLiveWaitTimesNotice } from '@/components/parks/no-live-wait-times-notice';
import { hasReadableWaitTimes, noLiveWaitTimesReason } from '@/lib/utils/live-wait-times';
import { NearbyParksSection } from '@/components/parks/nearby-parks-section';
import { ParkBlogPostsSection } from '@/components/parks/blog-posts-sections';
import { ContributeBanner } from '@/components/contribute/contribute-banner';
import { PreferredSourcePrompt } from '@/components/common/preferred-source-prompt';
import { buildContributeHref } from '@/lib/contribute/prefill';
import { groupAttractionsByLand } from '@/lib/utils/park-utils';
import { generateParkBreadcrumbs } from '@/lib/utils/breadcrumb-utils';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { RouteMessages } from '@/i18n/route-messages';
import { applyParkSimulation, parseParkSimulation } from '@/lib/parks/park-simulation';
import { ParkSimulationNotice } from '@/components/parks/park-simulation-notice';

interface ParkPageProps {
  params: Promise<{
    locale: string;
    continent: string;
    country: string;
    city: string;
    park: string;
  }>;
  /** Only `?state=` is read, and only off production — the dev/preview park-state simulation
   *  (`lib/parks/park-simulation.ts`). `generateMetadata` deliberately does not take it: a
   *  simulated page must never produce different metadata from the real one. */
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
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
  if (!isServableRoute(locale, continent, country, city, parkSlug)) return {};
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

  // The API 301s a renamed park's old path and `fetch` follows it, so we can be holding a park
  // whose canonical path differs from the one requested. Point the canonical at the real path —
  // the page body issues the matching 308.
  const renamedUrl = findRenamedParkRedirect(park, { continent, country, city, parkSlug });
  if (renamedUrl) {
    return {
      title: tNotFound('park'),
      alternates: { canonical: `${SITE_URL}/${locale}${renamedUrl}` },
    };
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
  // Long park names ("Fantawild Oriental Heritage Mianyang") push the templated title past the
  // ~60 chars Google shows, clipping the very keyword the template exists for. Fall back to the
  // bare "<park> Wait Times LIVE" form, and to the city-less copy for the snippet.
  const title = fitWithin(
    MAX_TITLE_LENGTH,
    cityInParkName
      ? t(titleKey, { park: parkName })
      : t(titleKey, { park: parkName, city: cityName }),
    t('titleTemplateShort', { park: parkName })
  );

  const descriptionKey = cityInParkName
    ? 'metaDescriptionTemplateNoCity'
    : 'metaDescriptionTemplate';
  const description = fitWithin(
    MAX_DESCRIPTION_LENGTH,
    cityInParkName
      ? t(descriptionKey, { park: parkName })
      : t(descriptionKey, { park: parkName, city: cityName }),
    t('metaDescriptionTemplateNoCity', { park: parkName })
  );

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
export default async function ParkPage({ params, searchParams }: ParkPageProps) {
  const { locale, continent, country, city, park: parkSlug } = await params;
  const simScenarios = parseParkSimulation((await searchParams)?.state as string | undefined);
  assertServableRoute(locale, continent, country, city, parkSlug);
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

  // Best-days SEED: fired here but DELIBERATELY NOT awaited on the render's critical path — it is
  // consumed only inside <Suspense> boundaries below (the best-days section + the FAQ JSON-LD), so
  // it STREAMS in and never gates TTFB. This is the fix for the cold-start latency regression: a
  // cold `/best-days` fetch can be ~0.4–1s (occasionally slower than the park fetch), and awaiting
  // it inline added that to first-byte. Now the shell (H1, attraction overview, header, FAQ base)
  // flushes at park-fetch speed and the seeded best-days HTML arrives a beat later in the same
  // stream — crawlers still receive it in the final document. The client queries (React Query,
  // `useLoadLast`-gated) still replace the seed on the client as before. `getBestDaysCalendarSeed`
  // keeps a timeout + `after()` so a hung backend can't hold the stream open and the fill still
  // warms the data cache. ONE per-request clock read serves every seed-rendered "today" derivation.
  const seedNow = new Date();
  const seedNowMs = seedNow.getTime();
  const bestDaysSeedPromise = getBestDaysCalendarSeed(continent, country, city, parkSlug);

  // Started here, awaited at the bottom of the fetch block: it is a small,
  // day-cached list and the page has no reason to serialise it behind the park.
  const seasonsPromise = getParkSeasons(continent, country, city, parkSlug);

  // Fetch park data and holidays (holidays are optional). `leanParkForParkShell` strips the two
  // per-attraction fields only the ride page renders (typicalWaits, rideProfile) — ~11 KB of this
  // park's 33 KB attraction list that nothing here reads. The live poll returns them regardless.
  const parkFull = await catchNonFatal(getParkByGeoPath(continent, country, city, parkSlug));
  const parkLean = parkFull ? leanParkForParkShell(parkFull) : parkFull;
  // Dev/preview only, and a no-op with no `?state=` — see `lib/parks/park-simulation.ts` for why
  // this one fabricates data where `?sim=` refuses to.
  const park = parkLean ? applyParkSimulation(parkLean, simScenarios) : parkLean;
  const seasons = await seasonsPromise;

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

  // The park exists but under a different path than requested: an upstream rename regenerated
  // its slug and the API answered our request for the OLD path with a 301 that `fetch` followed
  // silently. Without this the park would render at two URLs with the stale one canonical, and
  // the redirect's ranking transfer would never reach the browser or Googlebot.
  const renamedUrl = findRenamedParkRedirect(park, { continent, country, city, parkSlug });
  if (renamedUrl) {
    permanentRedirect(`/${locale}${renamedUrl}`);
  }

  // NOTE: bestDaysSeedPromise is intentionally NOT awaited here — see the comment where it's
  // created. It is passed to the <Suspense>-wrapped FAQ JSON-LD + best-days slot below so it
  // streams instead of blocking TTFB.

  // Historical stats are still loaded CLIENT-side only (React Query → the CDN-cached `/stats`
  // route, `useLoadLast`-gated): the 2-year aggregate is the other slow cold-compute response,
  // and the best-days section renders its calendar-based fallback until it lands.

  // Glossary terms for the (client) FAQ section. This is a small static-content lookup (no fetch,
  // no clock) so it's safe to load in the static shell; the client FAQ tree highlights terms from
  // these props instead of awaiting them itself.
  //
  // Narrowed to the terms the FAQ text can actually link before it crosses the client boundary —
  // <ParkFAQSection> is a Client Component, so anything handed to it is serialized into the page.
  // The full dictionary was 61.2 KB (18.0 KB brotli, a quarter of this page's transfer) so that a
  // few paragraphs could link a handful of terms. Same reasoning as leanParkForShell in
  // lib/api/parks.ts: pass what is read, not what is available.
  const glossaryTerms = await getGlossaryTerms(locale as Locale);
  const glossarySegment = GLOSSARY_SEGMENTS[locale as Locale];
  const tFaq = await getTranslations('seo.faq');
  // Corpus = every string the FAQ can render. Q0–Q6 are built here exactly as the client builds
  // them; Q7 (least crowded) only appears after the client's calendar fetch, so its RAW ICU
  // templates stand in — they carry all the literal text, and the values interpolated into them
  // (weekday names, the park name, hours) are covered by the items above. A superset is required:
  // a term missing from the corpus would silently stop being linked.
  const faqCorpus = [
    ...buildParkFaqItems(
      park,
      locale,
      tFaq as Parameters<typeof buildParkFaqItems>[2],
      tGeo as Parameters<typeof buildParkFaqItems>[3],
      seedNowMs
    ).flatMap((item) => [
      item.question,
      typeof item.answer === 'string'
        ? item.answer
        : [item.answer.text, ...item.answer.list].filter(Boolean).join(' '),
    ]),
    tFaq.raw('leastCrowdedQ'),
    tFaq.raw('leastCrowdedA'),
    tFaq.raw('leastCrowdedNoDataA'),
  ].join('\n');
  const faqGlossaryTerms = filterMatchableTerms(faqCorpus, glossaryTerms).map((term) => ({
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

  // Today's schedule is picked CLIENT-side inside <ParkTodayPanel> (from the browser clock in the
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
    <RouteMessages route="/parks/[continent]/[country]/[city]/[park]">
      <>
        {/* No manual <link rel="preload"> here: it pointed at the RAW /media/.../background.jpg,
          but <ParkBackground> renders it through next/image (/_next/image?…&q=90). The raw preload
          was never the LCP resource — it just downloaded the full-size original in parallel,
          competing for bandwidth with the optimized image. next/image's `priority` already preloads
          the correct optimized rendition. */}
        <ParkBackground
          imageSrc={parkBgImage}
          // The sidecar's authored sentence in this locale, not the bare entity name:
          // "{park}" told a screen reader nothing the heading had not already said.
          alt={getMediaAltBySrc(parkBgImage, locale) ?? parkName}
          objectPosition={objectPositionForSrc(parkBgImage)}
        />

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
          {/* FAQ JSON-LD streams: the base FAQPage questions don't need the seed, and the
            least-crowded question is appended when the seed resolves — awaiting it here would
            block TTFB, so it's rendered inside its own Suspense boundary. */}
          <Suspense fallback={null}>
            <FAQStructuredData
              park={park}
              locale={locale}
              nowMs={seedNowMs}
              seedPromise={bestDaysSeedPromise}
            />
          </Suspense>

          {/* Breadcrumb — rendered inline, NOT inside <Suspense>. It has nothing to await (a
              Client Component handed plain props, server-rendered into the first HTML like the
              attraction page's), and the boundary it used to sit in was the park page's single
              largest layout shift: the `h-6` fallback occupied 24px, the real nav 46px (30px pill
              + `mb-4`), so the whole article jumped 22px down the moment the boundary resolved —
              worth ~0.22 CLS on desktop and the reason this URL group failed Core Web Vitals. The
              Cache Components note this comment used to carry no longer applies (the page is
              `force-dynamic`). The BreadcrumbList JSON-LD above stays in the static shell for SEO. */}
          <BreadcrumbNav breadcrumbs={breadcrumbs} currentPage={parkCurrentPage} />

          {/* Dev/preview only — says out loud that the weather, holidays and crowd on this page
              were fabricated by `?state=`. Never renders on production. */}
          <ParkSimulationNotice scenarios={simScenarios} />

          <article itemScope itemType="https://schema.org/AmusementPark">
            {/* Park Header */}
            {/* `heavy`, like the panel and the tiles under it: the three are one stacked object
              and used to be three different fills. `mb-4` closes the rhythm — the stack ran
              32/24/56 px between its four parts, the last of those a void nothing was in. */}
            <div className="mb-4">
              <GlassCard variant="heavy">
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
                    {/* 56px = 24 (the address at text-base) + 12 (gap-3) + 20 (the distance
                      line) — two lines is what this row settles on below `sm` once the city and
                      country are long enough. Same reservation as the ride header, reasoned
                      through there. */}
                    <div className="text-muted-foreground flex min-h-14 flex-wrap content-start items-center gap-3 sm:min-h-0">
                      <address className="flex items-center gap-1 not-italic">
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                        <span>{cityName}</span>,{' '}
                        <span>{translateGeoSlug(tGeo, 'countries', country, countryName)}</span>
                      </address>
                      {/* How far the visitor is from this park — client-only (needs their
                        position), so it just appears next to the address once known. */}
                      <ParkDistance latitude={park.latitude} longitude={park.longitude} size="md" />
                    </div>
                  </div>
                  {park.id && <ParkFavoriteButton parkId={park.id} />}
                </div>

                {/* Keyword-rich, server-rendered intro — gives Google crawlable topical
                  text with the exact "Wartezeiten im {park}" phrase + "heute" that the
                  live (client-streamed) grid doesn't provide as static text. The stats board
                  that used to sit above it, and the neighbouring-holiday column beside it, both
                  moved into <ParkTodayPanel> below: they answered the same question as the
                  weather warning and the weather card, in three other boxes. */}
                <p className="text-muted-foreground mt-5 max-w-2xl text-sm leading-relaxed">
                  {t('intro', { park: parkName, city: cityName })}
                </p>

                {/* The park's own site and ticket shop, right under the intro. They used to be the
                  bottom row of a titled "Infos zum Park" section far down the page — which on most
                  parks was a heading and a frame around exactly these two buttons. Renders nothing
                  for a park nobody has curated. */}
                <ParkQuickLinks info={park.info} className="mt-4" />
              </GlassCard>
            </div>

            {/* Paid skip-the-line day prices (schedule purchases) — renders nothing for parks
              without purchase data (currently everything non-Disney). */}
            <ParkPurchasesCard schedule={park.schedule} timezone={park.timezone} className="mb-8" />

            {/* Parks that publish wait times only inside their own app (Hansa-Park). Server-rendered,
              not streamed: `liveWaitTimes` is day-stable, so it arrives with the structure fetch and
              the live merge carries it — and it has to be in the first paint, because it explains
              the empty ride list the visitor is already looking at. Renders nothing for the other
              212 parks. */}
            <NoLiveWaitTimesNotice
              reason={noLiveWaitTimesReason(park)}
              scope="park"
              className="mb-8"
            />

            {/* Live Park Data — the header card ("Heute im Park" + the entry tiles) and the tab
              body under it, all with auto-refresh.

              "Heute im Park" is the one panel the fold is built around. It absorbed four things
              that used to be four boxes: the official DWD/MeteoAlarm warning (its top strip), the
              stats board (its first two columns), the holiday context (its last row) and the
              weather summary (the nowcast strip above that row). It also carries the two readings
              that were not above the fold at all — what the headliners cost right now and when the
              next shows start.

              It is handed down as a SLOT rather than rendered here, because it and the entry-tile
              row are one card now and that card is built where the tiles are (see
              <ParkHeaderCard>). Not behind <Suspense>: everything it draws is either in `park`
              already or arrives on the client queries it starts itself, so a boundary would defer
              nothing and its `fallback={null}` would reserve nothing — the exact shape that cost
              this page 0.095 CLS when the weather card had one. */}
            <LiveParkData
              initialData={park}
              continent={continent}
              country={country}
              city={city}
              parkSlug={parkSlug}
              landNames={landNames}
              attractionsByLand={attractionsByLand}
              otherAttractionsLabel={otherAttractionsLabel}
              todayPanel={
                // The key is not decoration: <ParkHeaderCard> renders `{panel}{tiles}`, and an
                // element created HERE and handed through a prop into that pair is a keyless child
                // of an array as far as React's dev validation is concerned — it warns naming
                // ParkHeaderCard and pointing back at this file. One stable key, no extra DOM.
                <ParkTodayPanel
                  key="today-panel"
                  initialData={park}
                  continent={continent}
                  country={country}
                  city={city}
                  parkSlug={parkSlug}
                  parkPath={`/parks/${continent}/${country}/${city}/${parkSlug}`}
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

            {/* Blog posts about this park — static content out of the generated blog manifest
              (no API call, no clock), so it neither competes with the live queries nor with the
              load-last best-travel-time data. Renders nothing when no post mentions the park.
              NOT behind <Suspense>: `hasPublishedPosts`/`getPostsForPark` are synchronous manifest
              lookups and the only await is `getTranslations`, whose messages this render already
              holds — so the boundary deferred nothing and bought no TTFB. What it did cost was a
              `fallback={null}` hole: on mobile this section is ~470px that appeared out of nowhere
              when the boundary resolved, shoving the FAQ, share row and contribute banner down the
              page. Together with the nearby-parks hole below that was the park page's worst
              measured layout shift. Rendered inline it is part of the first HTML, at its final
              height, and crawlers see the links without waiting for the stream. */}
            <ParkBlogPostsSection
              locale={locale as Locale}
              parkSlug={parkSlug}
              geoPath={`${continent}/${country}/${city}`}
              parkName={parkName}
              className="mt-8"
            />

            {/* Historical statistics — loaded client-side (CDN-cached /stats route); a skeleton
              shows until the cold/slow stats response lands, so it never blocks the static shell. */}
            <ParkStatsSection
              continent={continent}
              country={country}
              city={city}
              parkSlug={parkSlug}
              locale={locale}
              hasLiveWaitTimes={hasReadableWaitTimes(park)}
            />

            {/* What is on at this park. Hand-researched, day-stable, and its own
              request rather than a field on the park: the park payload is
              re-polled every five minutes and a season changes a few times a
              year. Renders nothing for the majority of parks that have none. */}
            <ParkSeasonsCard seasons={seasons} locale={locale} className="mt-8" />

            {/* Address, phone and the hard facts — hand-curated in the admin, because none of the
              three upstream feeds carries any of it. The links that used to close this section are
              <ParkQuickLinks> in the header now, so this renders nothing at all for a park that
              had only those. */}
            <ParkInfoCard
              info={park.info}
              city={cityName}
              country={translateGeoSlug(tGeo, 'countries', country, countryName)}
              className="mt-8"
            />

            {/* FAQ Section — Q0–Q6 + Q1 (today's hours) render immediately from the park snapshot +
              server clock. Q7 (least crowded) is NOT server-seeded here (that would require
              awaiting the best-days seed on the critical path); it streams in from the client
              calendar fetch after mount. The Q7 signal for SEO lives in the streamed FAQPage
              JSON-LD above (which is seeded off the critical path). */}
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
              initialCalendar={null}
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

            {/* Secondary, lighter "make park.fan a preferred Google source" prompt */}
            <PreferredSourcePrompt compact className="mt-8" />
          </article>
        </PageContainer>
      </>
    </RouteMessages>
  );
}
