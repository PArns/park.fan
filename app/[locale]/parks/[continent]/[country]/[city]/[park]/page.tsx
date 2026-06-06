import { Suspense, type ComponentProps } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, addDays, min } from 'date-fns';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternateLanguages, locales } from '@/i18n/config';
import { buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { translateCountry, translateContinent } from '@/lib/i18n/helpers';
import { notFound, permanentRedirect } from 'next/navigation';
import { connection } from 'next/server';
import { MapPin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { getParkByGeoPath, getPopularParks } from '@/lib/api/parks';
import { getGeoStructure } from '@/lib/api/discovery';
import { getServerNowMs } from '@/lib/utils/server-time';
import { catchNonFatal } from '@/lib/api/client';
import { getBestDaysCalendar } from '@/lib/api/integrated-calendar';
import { getParkHistoricalStats } from '@/lib/api/stats';
import { getParkWeatherNowcast } from '@/lib/api/weather-nowcast';
import type { IntegratedCalendarResponse, ParkHistoricalStats } from '@/lib/api/types';
import { WeatherCard } from '@/components/parks/weather-card';
import { WeatherNowcastBanner } from '@/components/parks/weather-nowcast-banner';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { ParkTimeInfo } from '@/components/parks/park-time-info';
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
import { getParkBackgroundImage } from '@/lib/utils/park-assets';
import { PageContainer } from '@/components/common/page-container';
import { GlassCard } from '@/components/common/glass-card';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { findParkPageRedirect } from '@/lib/utils/redirect-utils';
import { stripNewPrefix } from '@/lib/utils';
import { LiveParkData } from '@/components/parks/live-park-data';
import { ParkBestDaysSection } from '@/components/parks/park-best-days-section';
import { ParkBestDaysSectionSkeleton } from '@/components/parks/park-best-days-section-skeleton';
import { ParkStatsSection } from '@/components/parks/park-stats-section';
import { ParkStatsSectionSkeleton } from '@/components/parks/park-stats-section-skeleton';
import { NearbyParksSection } from '@/components/parks/nearby-parks-section';
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

// Prebuild the most-requested parks (× all locales). Under Cache Components every dynamic route
// must enumerate at least one param: without a generateStaticParams, Next prerenders a
// param-less placeholder shell and `await params` there counts as dynamic data accessed outside
// <Suspense>, which fails the build. Listing concrete params makes each prebuilt park a proper
// PPR page (static shell + streamed Suspense holes). Every other park stays on-demand ISR
// (dynamicParams defaults to true). Kept small to bound build memory / API load — each entry is a
// full park-page prerender against the live API, and the long tail is served on-demand anyway.
const PREBUILD_PARK_LIMIT = 12;

type ParkRouteParams = { continent: string; country: string; city: string; park: string };

export async function generateStaticParams() {
  const popular = await getPopularParks(PREBUILD_PARK_LIMIT).catch(() => []);

  const parks: ParkRouteParams[] = popular
    .map((p) => p.url?.replace(/^\/v1\/parks\//, '').split('/'))
    .filter((seg): seg is [string, string, string, string] => !!seg && seg.length === 4)
    .map(([continent, country, city, park]) => ({ continent, country, city, park }));

  // Cache Components requires generateStaticParams to return ≥1 result — an empty array throws
  // EmptyGenerateStaticParamsError and fails the whole build. The popular-parks endpoint can be
  // briefly unavailable during a build (and a build environment may be flakier than local), so
  // fall back to the geo structure — already relied on by the city/country routes — to guarantee
  // we always enumerate at least one real park.
  if (parks.length === 0) {
    const geo = await getGeoStructure().catch(() => null);
    outer: for (const c of geo?.continents ?? []) {
      for (const co of c.countries) {
        for (const ci of co.cities) {
          for (const p of ci.parks) {
            parks.push({ continent: c.slug, country: co.slug, city: ci.slug, park: p.slug });
            if (parks.length >= PREBUILD_PARK_LIMIT) break outer;
          }
        }
      }
    }
  }

  return locales.flatMap((locale) => parks.map((p) => ({ locale, ...p })));
}

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
      alternates: { canonical: `https://park.fan/${locale}${redirectUrl}` },
    };
  }

  const park = await catchNonFatal(getParkByGeoPath(continent, country, city, parkSlug));

  if (!park) {
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
      url: `https://park.fan/${locale}/parks/${continent}/${country}/${city}/${parkSlug}`,
      ogImageUrl,
      imageAlt: tImageAlt('park', { park: parkName }),
    }),
    alternates: {
      canonical: `https://park.fan/${locale}/parks/${continent}/${country}/${city}/${parkSlug}`,
      languages: {
        ...generateAlternateLanguages(
          (l) => `/${l}/parks/${continent}/${country}/${city}/${parkSlug}`
        ),
        'x-default': `https://park.fan/en/parks/${continent}/${country}/${city}/${parkSlug}`,
      },
    },
  };
}

// Cache Components: the shell (header, attractions, weather, FAQ, structured data) is
// statically prerendered + edge-cached; the slow calendar/stats sections opt into dynamic
// rendering individually (connection() inside their Streamed* components) so they stream as
// PPR holes without ever blocking the static shell.
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

  // Fetch park data and holidays (holidays are optional)
  const park = await catchNonFatal(getParkByGeoPath(continent, country, city, parkSlug));

  if (!park) {
    notFound();
  }

  // Cached "now" (cacheComponents-safe) — drives the calendar range + today lookups below.
  const nowMs = await getServerNowMs();
  const now = new Date(nowMs);

  // Calendar date range: current month + next 2 months (API limit: 90 days max — cap to avoid 400).
  // The calendar feeds only the below-the-fold best-days + FAQ sections, which stream as dynamic
  // <Suspense> holes (StreamedBestDays / StreamedFaq, after connection()). The ~2.25 MB fetch is
  // therefore invoked INSIDE those holes (not here in the shell): it's too big for Next's fetch
  // data-cache, so under Cache Components creating its promise in the static shell would surface
  // as "uncached data outside <Suspense>". getBestDaysCalendar caches the projected ~13 KB result
  // (unstable_cache, 24h SWR), so the two consumers share one cached snapshot.
  const calendarFrom = startOfMonth(now);
  const calendarTo = min([endOfMonth(addMonths(now, 2)), addDays(calendarFrom, 89)]);
  const calendarArgs: CalendarArgs = {
    continent,
    country,
    city,
    parkSlug,
    from: format(calendarFrom, 'yyyy-MM-dd'),
    to: format(calendarTo, 'yyyy-MM-dd'),
    timezone: park.timezone,
    hasOperatingSchedule: park.hasOperatingSchedule,
  };

  // Nowcast feeds the header banner + weather card (above the fold), so it stays on the
  // blocking path (small, cacheable response).
  const nowcast = await getParkWeatherNowcast(continent, country, city, parkSlug).catch(() => null);

  // Historical stats feed only the below-the-fold stats section and the best-days widget. The
  // stats response (2 years of aggregates) can exceed Next's 2 MB fetch data-cache cap, which
  // would leave its 'use cache' boundary uncached — and creating that promise here in the static
  // shell would surface as "uncached data outside <Suspense>". So, like the calendar, the fetch
  // is invoked INSIDE the dynamic Suspense holes (after connection()), keyed off the geo slugs.

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

  // Get today's schedule - filter by date in park's timezone
  const getTodaySchedule = () => {
    if (!park.schedule || park.schedule.length === 0) return null;

    // Get today's date in the park's timezone
    const todayInParkTz = now.toLocaleDateString('en-CA', {
      timeZone: park.timezone,
    }); // Format: YYYY-MM-DD

    return park.schedule.find((s) => s.date === todayInParkTz) || park.schedule[0];
  };
  const todaySchedule = getTodaySchedule();
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
          url={`https://park.fan/${locale}/parks/${continent}/${country}/${city}/${parkSlug}`}
          description={tSeo('metaDescriptionTemplate', { park: parkName, city: cityName })}
          locale={locale}
        />
        <BreadcrumbStructuredData breadcrumbs={breadcrumbs} locale={locale} />
        {park.shows && park.shows.length > 0 && (
          <ShowsStructuredData shows={park.shows} park={park} date={format(now, 'yyyy-MM-dd')} />
        )}
        <FAQStructuredData park={park} locale={locale} />

        {/* Breadcrumb — visible nav streams (next-intl links are dynamic under Cache
            Components); the BreadcrumbList JSON-LD above stays in the static shell for SEO. */}
        <Suspense fallback={<div className="h-6" />}>
          <BreadcrumbNav breadcrumbs={breadcrumbs} currentPage={parkCurrentPage} />
        </Suspense>

        <article itemScope itemType="https://schema.org/ThemePark">
          {/* Park Header */}
          <div className="mb-8">
            <GlassCard variant="medium">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-baseline">
                    <h1 className="text-3xl font-bold md:text-4xl">{parkName}</h1>
                    <span className="text-muted-foreground ml-2 text-xl font-normal md:text-2xl">
                      – {t('h1Suffix')}
                    </span>
                  </div>
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
            </GlassCard>
          </div>

          {/* Weather warning banner (rain / storm / hail / thunderstorm) — client live query,
              streamed as a dynamic hole under Cache Components. */}
          <Suspense fallback={null}>
            <WeatherNowcastBanner
              continent={continent}
              country={country}
              city={city}
              parkSlug={parkSlug}
              initialData={nowcast}
              className="mb-6"
            />
          </Suspense>

          {/* Schedule & Weather Row */}
          <div className="mb-8 grid gap-4 md:grid-cols-2">
            {/* Today's Schedule with Current Time */}
            <Suspense fallback={null}>
              <ParkTimeInfo
                timezone={park.timezone}
                todaySchedule={todaySchedule}
                nextSchedule={park.nextSchedule}
                status={park.status}
                hasOperatingSchedule={park.hasOperatingSchedule}
                className="border-primary/10"
              />
            </Suspense>

            {/* Weather — client live nowcast query, streamed as a dynamic hole */}
            {park.weather?.current && (
              <Suspense fallback={null}>
                <WeatherCard
                  weather={park.weather}
                  nowcast={nowcast}
                  continent={continent}
                  country={country}
                  city={city}
                  parkSlug={parkSlug}
                  className="border-primary/10"
                />
              </Suspense>
            )}
          </div>

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
              <Suspense fallback={<ParkBestDaysSectionSkeleton />}>
                <StreamedBestDays
                  calendarArgs={calendarArgs}
                  parkName={parkName}
                  parkSlug={parkSlug}
                  locale={locale}
                />
              </Suspense>
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

          {/* Historical statistics — streamed so a cold/slow stats response doesn't block
              the shell or blank the section until a reload. */}
          <Suspense fallback={<ParkStatsSectionSkeleton />}>
            <StreamedParkStats
              continent={continent}
              country={country}
              city={city}
              parkSlug={parkSlug}
              locale={locale}
            />
          </Suspense>

          {/* FAQ Section */}
          <Separator className="my-8" />
          <Suspense fallback={<ParkFAQSection park={park} locale={locale} />}>
            <StreamedFaq park={park} locale={locale} calendarArgs={calendarArgs} />
          </Suspense>
        </article>
      </PageContainer>
    </>
  );
}

/**
 * Args for the below-the-fold best-days calendar fetch. The Streamed* components take these
 * args and run the fetch themselves (after connection()), so the ~2.25 MB uncacheable response
 * is only ever requested inside a dynamic Suspense hole — never in the static shell, where it
 * would surface as "uncached data outside <Suspense>".
 */
interface CalendarArgs {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  from: string;
  to: string;
  timezone: string;
  hasOperatingSchedule: boolean;
}

/**
 * Fetch + project the best-days calendar (cached 24h via unstable_cache inside
 * getBestDaysCalendar), falling back to an empty calendar on error so a failed fetch degrades
 * the widget gracefully instead of taking down the streamed section.
 */
function loadBestDaysCalendar(a: CalendarArgs): Promise<IntegratedCalendarResponse> {
  return getBestDaysCalendar(a.continent, a.country, a.city, a.parkSlug, {
    from: a.from,
    to: a.to,
  }).catch(
    (): IntegratedCalendarResponse => ({
      meta: {
        slug: a.parkSlug,
        timezone: a.timezone,
        hasOperatingSchedule: a.hasOperatingSchedule,
      },
      days: [],
    })
  );
}

/**
 * Fetch historical park stats (cached 5 min via 'use cache' inside getParkHistoricalStats). The
 * 2-year aggregate response can exceed Next's 2 MB fetch data-cache cap; if it does, the boundary
 * is uncached — which is why this is invoked only INSIDE the dynamic Suspense holes (after
 * connection()), never in the static shell. Falls back to null so a failure degrades gracefully.
 */
function loadParkStats(
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): Promise<ParkHistoricalStats | null> {
  return getParkHistoricalStats(continent, country, city, parkSlug).catch(
    (): ParkHistoricalStats | null => null
  );
}

/**
 * Streams the "best days" widget. The calendar + stats fetches are kicked off HERE (inside the
 * dynamic hole, after connection()) rather than in the page shell, so the bulky uncacheable
 * responses never block or poison the static prerender. Wrapped in <Suspense> by the caller.
 */
async function StreamedBestDays({
  calendarArgs,
  ...rest
}: Omit<ComponentProps<typeof ParkBestDaysSection>, 'calendarData' | 'statsByDayOfWeek'> & {
  calendarArgs: CalendarArgs;
}) {
  // Dynamic PPR hole: keeps the slow calendar/stats out of the static shell prerender.
  await connection();
  const { continent, country, city, parkSlug } = calendarArgs;
  const [calendarData, stats] = await Promise.all([
    loadBestDaysCalendar(calendarArgs),
    loadParkStats(continent, country, city, parkSlug),
  ]);
  return (
    <ParkBestDaysSection
      calendarData={calendarData}
      statsByDayOfWeek={stats?.byDayOfWeek}
      {...rest}
    />
  );
}

/** Streams the FAQ section (calendar-derived crowd FAQ) the same way. */
async function StreamedFaq({
  calendarArgs,
  ...rest
}: Omit<ComponentProps<typeof ParkFAQSection>, 'calendarData'> & {
  calendarArgs: CalendarArgs;
}) {
  // Dynamic PPR hole: the calendar-derived crowd FAQ streams; the static FAQ fallback is prerendered.
  await connection();
  const calendarData = await loadBestDaysCalendar(calendarArgs);
  return <ParkFAQSection {...rest} calendarData={calendarData} />;
}

/**
 * Below-the-fold historical statistics. Fetched inside a dynamic Suspense hole (connection())
 * so the cold, slow-to-compute (and potentially >2 MB, uncacheable) stats response never blocks
 * the static shell; the skeleton shows until the data streams in.
 */
async function StreamedParkStats({
  ...rest
}: Omit<ComponentProps<typeof ParkStatsSection>, 'stats'>) {
  // Dynamic PPR hole: keeps the (no-store, cold-compute) stats out of the static shell prerender.
  await connection();
  const stats = await loadParkStats(rest.continent, rest.country, rest.city, rest.parkSlug);
  return <ParkStatsSection stats={stats} {...rest} />;
}
