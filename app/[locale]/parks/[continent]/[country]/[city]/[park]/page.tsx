import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Clock, Calendar, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LocalTime } from '@/components/ui/local-time';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getParkByGeoPath } from '@/lib/api/parks';
import { LandSection } from '@/components/parks/land-section';
import { ParkStatus } from '@/components/parks/park-status';
import { WeatherCard } from '@/components/parks/weather-card';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import type { Metadata } from 'next';
import type { ParkAttraction, Breadcrumb } from '@/lib/api/types';

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
  const { continent, country, city, park: parkSlug } = await params;

  const park = await getParkByGeoPath(continent, country, city, parkSlug).catch(() => null);

  if (!park) {
    return { title: 'Park Not Found' };
  }

  return {
    title: park.name,
    description: `Live wait times, crowd predictions, and schedules for ${park.name}. Plan your visit with real-time data.`,
    openGraph: {
      title: park.name,
      description: `Live wait times and crowd levels for ${park.name}`,
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

  // Fetch park data
  const park = await getParkByGeoPath(continent, country, city, parkSlug).catch(() => null);

  if (!park) {
    notFound();
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
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <BreadcrumbNav breadcrumbs={breadcrumbs} currentPage={park.name} />

      {/* Park Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 text-3xl font-bold md:text-4xl">{park.name}</h1>
            <div className="text-muted-foreground flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {cityName}, {tGeo(`countries.${country}` as 'countries.germany') || countryName}
              </span>
              {park.timezone && <span className="text-sm">({park.timezone})</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Park Status Component */}
      <ParkStatus park={park} variant="detailed" className="mb-8" />

      {/* Schedule & Weather Row */}
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        {/* Today's Schedule */}
        {todaySchedule && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                {t('todaySchedule')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaySchedule.scheduleType === 'OPERATING' ? (
                <div className="flex items-center gap-2">
                  <Clock className="text-status-operating h-5 w-5" />
                  <span className="text-lg font-semibold">
                    <LocalTime time={todaySchedule.openingTime || ''} timeZone={park.timezone} />
                    {' - '}
                    <LocalTime time={todaySchedule.closingTime || ''} timeZone={park.timezone} />
                  </span>
                </div>
              ) : (
                <span className="text-status-closed font-medium">{tCommon('closed')}</span>
              )}
              {todaySchedule.isHoliday && todaySchedule.holidayName && (
                <Badge variant="outline" className="mt-2">
                  🎄 {todaySchedule.holidayName}
                </Badge>
              )}
              {todaySchedule.isBridgeDay && (
                <Badge variant="outline" className="mt-2">
                  🌉 Bridge Day
                </Badge>
              )}
            </CardContent>
          </Card>
        )}

        {/* Weather */}
        {park.weather?.current && <WeatherCard weather={park.weather} />}
      </div>

      <Separator className="my-8" />

      {/* Tabs for Attractions, Shows, Restaurants */}
      <Tabs defaultValue="attractions">
        <TabsList className="mb-6">
          <TabsTrigger value="attractions">
            {t('attractions')} ({park.attractions?.length || 0})
          </TabsTrigger>
          {park.shows && park.shows.length > 0 && (
            <TabsTrigger value="shows">
              {t('shows')} ({park.shows.length})
            </TabsTrigger>
          )}
          {park.restaurants && park.restaurants.length > 0 && (
            <TabsTrigger value="restaurants">
              {t('restaurants')} ({park.restaurants.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="attractions">
          {/* Attractions grouped by Land */}
          <div className="space-y-8">
            {landNames.map((landName) => (
              <LandSection
                key={landName}
                landName={landName}
                attractions={attractionsByLand[landName]}
                parkPath={`/parks/${continent}/${country}/${city}/${parkSlug}`}
                parkStatus={park.status}
              />
            ))}
          </div>
        </TabsContent>

        {park.shows && park.shows.length > 0 && (
          <TabsContent value="shows">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {park.shows.map((show) => {
                // Filter showtimes for today or future dates
                const today = new Date();
                const todayShowtimes =
                  show.showtimes?.filter((showtime) => {
                    const showtimeDate = new Date(showtime.startTime);
                    return (
                      showtimeDate >= today || showtimeDate.toDateString() === today.toDateString()
                    );
                  }) || [];

                return (
                  <Card key={show.id}>
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{show.name}</h3>
                      {todayShowtimes.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {todayShowtimes.map((showtime, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              <LocalTime time={showtime.startTime} timeZone={park.timezone} />
                            </Badge>
                          ))}
                        </div>
                      )}
                      {todayShowtimes.length === 0 &&
                        show.showtimes &&
                        show.showtimes.length > 0 && (
                          <p className="text-muted-foreground mt-2 text-sm">
                            {tCommon('noShowtimesToday')}
                          </p>
                        )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        )}

        {park.restaurants && park.restaurants.length > 0 && (
          <TabsContent value="restaurants">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {park.restaurants.map((restaurant) => (
                <Card key={restaurant.id}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{restaurant.name}</h3>
                    {restaurant.cuisineType && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {restaurant.cuisineType}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
