import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchContinentDetails, getCountryFlag, isStaticFileRequest } from '@/lib/api';
import { formatNumber, formatPercentage } from '@/lib/date-utils';
import { formatSlugToTitle } from '@/lib/utils';

interface ContinentPageProps {
  params: Promise<{
    continent: string;
  }>;
}

export const revalidate = 300; // CACHE_REVALIDATE_TIME from config

export async function generateMetadata({ params }: ContinentPageProps): Promise<Metadata> {
  const { continent } = await params;

  // Check if this is a static file request
  if (isStaticFileRequest(continent)) {
    return {
      title: 'Not Found | park.fan',
      description: 'The requested page could not be found.',
    };
  }

  const continentName = formatSlugToTitle(continent);

  return {
    title: `${continentName} Theme Parks - Real-time Wait Times | park.fan`,
    description: `Explore theme parks in ${continentName}. Real-time wait times, crowd levels, and park information for all major theme parks.`,
  };
}

export default async function ContinentPage({ params }: ContinentPageProps) {
  const { continent } = await params;

  // Check if this is a static file request
  if (isStaticFileRequest(continent)) {
    notFound();
  }

  try {
    const data = await fetchContinentDetails(continent);
    const continentName = formatSlugToTitle(continent);

    // Group parks by country
    const parksByCountry = data.data.reduce(
      (acc, park) => {
        if (!acc[park.country]) {
          acc[park.country] = [];
        }
        acc[park.country].push(park);
        return acc;
      },
      {} as Record<string, typeof data.data>
    );

    // Calculate continent-wide statistics
    const totalParks = data.data.length;
    const openParks = data.data.filter((park) => park.operatingStatus.isOpen).length;
    const totalRides = data.data.reduce(
      (sum, park) => sum + park.operatingStatus.totalRideCount,
      0
    );
    const openRides = data.data.reduce((sum, park) => sum + park.operatingStatus.openRideCount, 0);

    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 lg:mb-4">
            {continentName} Theme Parks
          </h1>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-primary">{totalParks}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total Parks</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{openParks}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Open Today</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {formatNumber(totalRides)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total Rides</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-orange-600">
                  {formatNumber(openRides)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Open Rides</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6 lg:space-y-8">
          {Object.entries(parksByCountry).map(([country, parks]) => (
            <div key={country}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 mb-4">
                <h2 className="text-xl sm:text-2xl font-semibold">
                  {getCountryFlag(country)} {country}
                </h2>
                <Badge variant="outline" className="text-xs w-fit">
                  {parks.length} park{parks.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {parks.map((park) => (
                  <Link
                    key={park.id}
                    href={`${park.hierarchicalUrl}`}
                    className="block transition-transform hover:scale-[1.02]"
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base sm:text-lg line-clamp-2 pr-2">
                            {park.name}
                          </CardTitle>
                          <Badge
                            variant={park.operatingStatus.isOpen ? 'default' : 'secondary'}
                            className={`text-xs ${park.operatingStatus.isOpen ? 'bg-green-500 hover:bg-green-600' : ''}`}
                          >
                            {park.operatingStatus.isOpen ? 'Open' : 'Closed'}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">Rides Operating:</span>
                            <span className="font-medium">
                              {park.operatingStatus.openRideCount}/
                              {park.operatingStatus.totalRideCount}
                              {park.operatingStatus.totalRideCount > 0 && (
                                <span className="text-muted-foreground ml-1">
                                  (
                                  {formatPercentage(
                                    park.operatingStatus.operatingPercentage / 100,
                                    0
                                  )}
                                  )
                                </span>
                              )}
                            </span>
                          </div>

                          {park.operatingStatus.isOpen && (
                            <>
                              <div className="flex justify-between text-xs sm:text-sm">
                                <span className="text-muted-foreground">Crowd Level:</span>
                                <span className="font-medium">{park.crowdLevel.label}</span>
                              </div>

                              <div className="flex justify-between text-xs sm:text-sm">
                                <span className="text-muted-foreground">Weather:</span>
                                <span className="font-medium capitalize">
                                  {park.weather.current.status}{' '}
                                  {park.weather.current.temperature.max}°C
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching continent data:', error);
    notFound();
  }
}
