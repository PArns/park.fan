import { format } from 'date-fns';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getParkByGeoPath } from '@/lib/api/parks';
import type { IntegratedCalendarResponse } from '@/lib/api/types';
import { getIntegratedCalendar } from '@/lib/api/integrated-calendar';
import { ParkStatus } from '@/components/parks/park-status';
import { WeatherCard } from '@/components/parks/weather-card';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { ParkTimeInfo } from '@/components/parks/park-time-info';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { TabsWithHash } from '@/components/parks/tabs-with-hash';
import { ParkStructuredData, BreadcrumbStructuredData } from '@/components/seo/structured-data';
import type { Metadata } from 'next';
import type { ParkAttraction, Breadcrumb } from '@/lib/api/types';
import { ParkBackground } from '@/components/parks/park-background';
import { getParkBackgroundImage } from '@/lib/utils/park-assets';

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

  const park = await getParkByGeoPath(continent, country, city, parkSlug).catch(() => null);

  if (!park) {
    return { title: 'Park Not Found' };
  }

  return {
    title: park.name,
    description: t('metaDescriptionTemplate', { park: park.name }),
    openGraph: {
      title: park.name,
      description: t('metaDescriptionTemplate', { park: park.name }),
    },
    alternates: {
      canonical: `/parks/${continent}/${country}/${city}/${parkSlug}`,
      languages: {
        en: `/en/parks/${continent}/${country}/${city}/${parkSlug}`,
        de: `/de/parks/${continent}/${country}/${city}/${parkSlug}`,
      },
    },
  };
}

export const revalidate = 60; // 1 minute (matches homepage stats)

// Group attractions by land
function groupAttractionsByLand(
  attractions: ParkAttraction[],
  fallbackName: string = 'Other Attractions'
): Record<string, ParkAttraction[]> {
  const grouped: Record<string, ParkAttraction[]> = {};

  attractions.forEach((attraction) => {
    const landName = attraction.land || fallbackName;
    if (!grouped[landName]) {
      grouped[landName] = [];
    }
    grouped[landName].push(attraction);
  });

  // Sort attractions within each land by name
  Object.keys(grouped).forEach((land) => {
    grouped[land].sort((a, b) => a.name.localeCompare(b.name));
  });

  return grouped;
}

export default async function ParkPage({ params }: ParkPageProps) {
  const { locale, continent, country, city, park: parkSlug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('parks');
  const tCommon = await getTranslations('common');
  const tGeo = await getTranslations('geo');

  // Fetch park data and holidays (holidays are optional)
  const park = await getParkByGeoPath(continent, country, city, parkSlug).catch(() => null);

  if (!park) {
    notFound();
  }

  // Fetch integrated calendar data (replaces separate holiday/schedule calls)
  let calendarData: IntegratedCalendarResponse | null = null;
  try {
    calendarData = await getIntegratedCalendar(
      continent,
      country,
      city,
      parkSlug,
      { includeHourly: 'today+tomorrow' } // Include hourly for today and tomorrow
    );
  } catch (error) {
    console.error('[Calendar] Failed to fetch calendar data:', error);
    // Provide fallback empty calendar
    calendarData = {
      meta: {
        parkId: park.id,
        slug: parkSlug,
        timezone: park.timezone,
        generatedAt: new Date().toISOString(),
        requestRange: {
          from: format(new Date(), 'yyyy-MM-dd'),
          to: format(new Date(), 'yyyy-MM-dd'),
        },
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
  const continentName = tGeo.has(`continents.${continent}`)
    ? tGeo(`continents.${continent}`)
    : continent.charAt(0).toUpperCase() + continent.slice(1).replace(/-/g, ' ');
  const countryName = tGeo.has(`countries.${country}`)
    ? tGeo(`countries.${country}`)
    : park.country || country.charAt(0).toUpperCase() + country.slice(1).replace(/-/g, ' ');
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

  // Construct breadcrumbs manually
  const breadcrumbs: Breadcrumb[] = [
    { name: tCommon('home'), url: '/' },
    { name: continentName, url: `/parks/${continent}` },
    { name: countryName, url: `/parks/${continent}/${country}` },
    { name: cityName, url: `/parks/${continent}/${country}/${city}` },
  ];

  return (
    <>
      <ParkBackground imageSrc={getParkBackgroundImage(parkSlug)} alt={park.name} />

      <div className="container mx-auto px-4 py-8">
        <ParkStructuredData
          park={park}
          url={`https://park.fan/parks/${continent}/${country}/${city}/${parkSlug}`}
        />
        <BreadcrumbStructuredData breadcrumbs={breadcrumbs} />

        {/* Breadcrumb */}
        <BreadcrumbNav
          breadcrumbs={breadcrumbs}
          currentPage={park.name}
          className="bg-background/80 backdrop-blur-md w-fit rounded-lg border px-3 py-1 shadow-sm"
        />

        {/* Park Header */}
        <div className="mb-8">
          <div className="bg-background/60 rounded-xl border p-6 shadow-sm backdrop-blur-md">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold md:text-4xl">{park.name}</h1>
                  {park.status && <ParkStatusBadge status={park.status} className="scale-110" />}
                </div>
                <div className="text-muted-foreground flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {cityName}, {tGeo(`countries.${country}` as 'countries.germany') || countryName}
                  </span>
                  {park.timezone && (
                    <Badge variant="outline" className="gap-1 font-mono text-xs">
                      <Clock className="h-3 w-3" />
                      {park.timezone}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule & Weather Row */}
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          {/* Today's Schedule with Current Time */}
          <ParkTimeInfo
            timezone={park.timezone}
            todaySchedule={todaySchedule}
            className="bg-background/60 border-primary/10 backdrop-blur-md"
          />

          {/* Weather */}
          {park.weather?.current && (
            <WeatherCard
              weather={park.weather}
              className="bg-background/60 border-primary/10 backdrop-blur-md"
            />
          )}
        </div>

        {/* Park Status Component */}
        <ParkStatus park={park} variant="detailed" />

        <Separator className="my-8" />

        {/* Tabs for Attractions, Shows, Restaurants */}
        <TabsWithHash
          defaultValue="attractions"
          showsAvailable={park.shows && park.shows.length > 0}
          restaurantsAvailable={park.restaurants && park.restaurants.length > 0}
          park={park}
          calendarData={calendarData}
          continent={continent}
          country={country}
          city={city}
          parkSlug={parkSlug}
          landNames={landNames}
          attractionsByLand={attractionsByLand}
        />
      </div>
    </>
  );
}
