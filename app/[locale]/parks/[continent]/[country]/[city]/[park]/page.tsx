import { format, startOfMonth, endOfMonth, addMonths, addDays, min } from 'date-fns';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternateLanguages } from '@/i18n/config';
import { buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { translateCountry, translateContinent } from '@/lib/i18n/helpers';
import { notFound, permanentRedirect } from 'next/navigation';
import { Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getParkByGeoPath } from '@/lib/api/parks';
import { getIntegratedCalendar } from '@/lib/api/integrated-calendar';
import type { IntegratedCalendarResponse } from '@/lib/api/types';
import { WeatherCard } from '@/components/parks/weather-card';
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
import { groupAttractionsByLand } from '@/lib/utils/park-utils';
import { generateParkBreadcrumbs } from '@/lib/utils/breadcrumb-utils';

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

  const park = await getParkByGeoPath(continent, country, city, parkSlug).catch(() => null);

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

export const revalidate = 3600; // 1 hour — live data via React Query on client

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
  const park = await getParkByGeoPath(continent, country, city, parkSlug).catch(() => null);

  if (!park) {
    notFound();
  }

  // Pre-fetch calendar for current month + next 2 months so opening hours
  // are available in advance (API limit: 90 days max — cap to avoid 400)
  const calendarFrom = startOfMonth(new Date());
  const calendarTo = min([endOfMonth(addMonths(new Date(), 2)), addDays(calendarFrom, 89)]);
  let calendarData: IntegratedCalendarResponse;
  try {
    calendarData = await getIntegratedCalendar(continent, country, city, parkSlug, {
      from: format(calendarFrom, 'yyyy-MM-dd'),
      to: format(calendarTo, 'yyyy-MM-dd'),
      includeHourly: 'none',
    });
  } catch {
    calendarData = {
      meta: {
        slug: parkSlug,
        timezone: park.timezone,
      },
      days: [],
    };
  }

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
                  <div className="mb-2">
                    <h1 className="text-3xl font-bold md:text-4xl">
                      {parkName}
                      <span className="text-muted-foreground ml-2 text-xl font-normal md:text-2xl">
                        – {t('h1Suffix')}
                      </span>
                    </h1>
                  </div>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-3">
                    <address className="flex items-center gap-1 not-italic">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                      <span>{cityName}</span>,{' '}
                      <span>
                        {tGeo(`countries.${country}` as 'countries.germany') || countryName}
                      </span>
                    </address>
                    {park.timezone && (
                      <Badge variant="outline" className="gap-1 font-mono text-xs">
                        <Clock className="h-3 w-3" />
                        {park.timezone}
                      </Badge>
                    )}
                  </div>
                </div>
                {park.id && <ParkFavoriteButton parkId={park.id} />}
              </div>
            </GlassCard>
          </div>

          {/* Schedule & Weather Row */}
          <div className="mb-8 grid gap-4 md:grid-cols-2">
            {/* Today's Schedule with Current Time */}
            <ParkTimeInfo
              timezone={park.timezone}
              todaySchedule={todaySchedule}
              nextSchedule={park.nextSchedule}
              status={park.status}
              className="border-primary/10"
            />

            {/* Weather */}
            {park.weather?.current && (
              <WeatherCard weather={park.weather} className="border-primary/10" />
            )}
          </div>

          {/* Live Park Data (Status + Tabs with auto-refresh) */}
          <LiveParkData
            initialData={park}
            continent={continent}
            country={country}
            city={city}
            parkSlug={parkSlug}
            calendarData={calendarData}
            landNames={landNames}
            attractionsByLand={attractionsByLand}
          />

          {/* Historical statistics */}
          <ParkStatsSection
            continent={continent}
            country={country}
            city={city}
            parkSlug={parkSlug}
            locale={locale}
          />

          {/* Best Days to Visit */}
          <ParkBestDaysSection
            calendarData={calendarData}
            parkName={parkName}
            parkSlug={parkSlug}
            locale={locale}
          />

          {/* FAQ Section */}
          <Separator className="my-8" />
          <ParkFAQSection park={park} locale={locale} calendarData={calendarData} />
        </article>
      </PageContainer>
    </>
  );
}
