import { Suspense, type ComponentProps } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, addDays, min } from 'date-fns';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternateLanguages } from '@/i18n/config';
import { buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { translateCountry, translateContinent } from '@/lib/i18n/helpers';
import { notFound, permanentRedirect } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { getParkByGeoPath } from '@/lib/api/parks';
import { catchNonFatal } from '@/lib/api/client';
import { getIntegratedCalendar } from '@/lib/api/integrated-calendar';
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
import { ParkStatsSection } from '@/components/parks/park-stats-section';
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

export const revalidate = 300;

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

  // Pre-fetch calendar + historical stats in parallel.
  // Calendar: current month + next 2 months (API limit: 90 days max — cap to avoid 400)
  const calendarFrom = startOfMonth(new Date());
  const calendarTo = min([endOfMonth(addMonths(new Date(), 2)), addDays(calendarFrom, 89)]);

  // The calendar (up to ~15s on a cold build) feeds only below-the-fold / behind-tab UI:
  // the best-days + FAQ sections (streamed via <Suspense> below) and the calendar tab —
  // which client-fetches per visible month on its own (useCalendarData). So keep it OFF
  // the blocking path: the page shell paints in ~0.4s instead of waiting on the calendar.
  const calendarPromise: Promise<IntegratedCalendarResponse> = getIntegratedCalendar(
    continent,
    country,
    city,
    parkSlug,
    {
      from: format(calendarFrom, 'yyyy-MM-dd'),
      to: format(calendarTo, 'yyyy-MM-dd'),
      includeHourly: 'none',
    }
  ).catch(
    (): IntegratedCalendarResponse => ({
      meta: {
        slug: parkSlug,
        timezone: park.timezone,
        hasOperatingSchedule: park.hasOperatingSchedule,
      },
      days: [],
    })
  );

  // Nowcast feeds the header banner + weather card (above the fold), so it stays on the
  // blocking path. Historical stats feed only the below-the-fold stats section and the
  // best-days widget — keep them OFF the blocking path and stream via <Suspense> so a
  // cold, slow-to-compute stats response can't block the shell (or blank the section
  // until a reload, as it did when awaited inline on the first cold hit).
  const nowcast = await getParkWeatherNowcast(continent, country, city, parkSlug).catch(
    () => null
  );

  const statsPromise: Promise<ParkHistoricalStats | null> = getParkHistoricalStats(
    continent,
    country,
    city,
    parkSlug
  ).catch((): ParkHistoricalStats | null => null);

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
    const todayInParkTz = new Date().toLocaleDateString('en-CA', {
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
      {parkBgImage && <link rel="preload" as="image" href={parkBgImage} />}
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
          <ShowsStructuredData
            shows={park.shows}
            park={park}
            date={format(new Date(), 'yyyy-MM-dd')}
          />
        )}
        <FAQStructuredData park={park} locale={locale} />

        {/* Breadcrumb */}
        <BreadcrumbNav breadcrumbs={breadcrumbs} currentPage={parkCurrentPage} />

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

          {/* Weather warning banner (rain / storm / hail / thunderstorm) */}
          <WeatherNowcastBanner
            continent={continent}
            country={country}
            city={city}
            parkSlug={parkSlug}
            initialData={nowcast}
            className="mb-6"
          />

          {/* Schedule & Weather Row */}
          <div className="mb-8 grid gap-4 md:grid-cols-2">
            {/* Today's Schedule with Current Time */}
            <ParkTimeInfo
              timezone={park.timezone}
              todaySchedule={todaySchedule}
              nextSchedule={park.nextSchedule}
              status={park.status}
              hasOperatingSchedule={park.hasOperatingSchedule}
              className="border-primary/10"
            />

            {/* Weather */}
            {park.weather?.current && (
              <WeatherCard
                weather={park.weather}
                nowcast={nowcast}
                continent={continent}
                country={country}
                city={city}
                parkSlug={parkSlug}
                className="border-primary/10"
              />
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
              <Suspense fallback={null}>
                <StreamedBestDays
                  calendarPromise={calendarPromise}
                  statsPromise={statsPromise}
                  parkName={parkName}
                  parkSlug={parkSlug}
                  locale={locale}
                />
              </Suspense>
            }
          />

          {/* Nearby Parks */}
          {park.latitude != null && park.longitude != null && (
            <NearbyParksSection
              parkId={park.id}
              lat={park.latitude}
              lng={park.longitude}
              className="mt-8"
            />
          )}

          {/* Historical statistics — streamed so a cold/slow stats response doesn't block
              the shell or blank the section until a reload. */}
          <Suspense fallback={null}>
            <StreamedParkStats
              statsPromise={statsPromise}
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
            <StreamedFaq park={park} locale={locale} calendarPromise={calendarPromise} />
          </Suspense>
        </article>
      </PageContainer>
    </>
  );
}

/**
 * Streams the "best days" widget: awaits the (non-blocking) calendar promise so the page
 * shell never waits on a cold calendar build. Wrapped in <Suspense> by the caller.
 */
async function StreamedBestDays({
  calendarPromise,
  statsPromise,
  ...rest
}: Omit<ComponentProps<typeof ParkBestDaysSection>, 'calendarData' | 'statsByDayOfWeek'> & {
  calendarPromise: Promise<IntegratedCalendarResponse>;
  statsPromise: Promise<ParkHistoricalStats | null>;
}) {
  const [calendarData, stats] = await Promise.all([calendarPromise, statsPromise]);
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
  calendarPromise,
  ...rest
}: Omit<ComponentProps<typeof ParkFAQSection>, 'calendarData'> & {
  calendarPromise: Promise<IntegratedCalendarResponse>;
}) {
  const calendarData = await calendarPromise;
  return <ParkFAQSection {...rest} calendarData={calendarData} />;
}

/**
 * Streams the historical statistics section: awaits the (non-blocking) stats promise so
 * a cold, slow-to-compute stats response never blocks the page shell — and the section
 * renders whenever the data arrives instead of being blanked until the next reload.
 */
async function StreamedParkStats({
  statsPromise,
  ...rest
}: Omit<ComponentProps<typeof ParkStatsSection>, 'stats'> & {
  statsPromise: Promise<ParkHistoricalStats | null>;
}) {
  const stats = await statsPromise;
  return <ParkStatsSection stats={stats} {...rest} />;
}
