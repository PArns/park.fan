import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchParkDetails, getCountryFlag, isStaticFileRequest } from '@/lib/api';
import { formatPercentage } from '@/lib/date-utils';
import { formatSlugToTitle } from '@/lib/utils';

interface ParkPageProps {
  params: Promise<{
    continent: string;
    country: string;
    park: string;
  }>;
}

export const revalidate = 300; // CACHE_REVALIDATE_TIME from config

export async function generateMetadata({ params }: ParkPageProps): Promise<Metadata> {
  const { continent, country, park } = await params;

  // Check if this is a static file request
  if (isStaticFileRequest(continent) || isStaticFileRequest(country) || isStaticFileRequest(park)) {
    return {
      title: 'Not Found | park.fan',
      description: 'The requested page could not be found.',
    };
  }

  try {
    const data = await fetchParkDetails(continent, country, park);

    return {
      title: `${data.name} - Real-time Wait Times | park.fan`,
      description: `Current wait times for ${data.name} in ${data.country}. Live queue times, crowd levels, weather, and ride information.`,
    };
  } catch {
    return {
      title: 'Park not found | park.fan',
      description: 'The requested theme park could not be found.',
    };
  }
}

function getWaitTimeColor(waitTime: number): string {
  if (waitTime === 0) return 'text-gray-500';
  if (waitTime <= 15) return 'text-green-600';
  if (waitTime <= 30) return 'text-yellow-600';
  if (waitTime <= 60) return 'text-orange-600';
  return 'text-red-600';
}

function getWaitTimeBadgeVariant(
  waitTime: number
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (waitTime === 0) return 'secondary';
  if (waitTime <= 15) return 'default';
  if (waitTime <= 30) return 'outline';
  return 'destructive';
}

export default async function ParkPage({ params }: ParkPageProps) {
  const { continent, country, park } = await params;

  // Check if this is a static file request
  if (isStaticFileRequest(continent) || isStaticFileRequest(country) || isStaticFileRequest(park)) {
    notFound();
  }

  try {
    const data = await fetchParkDetails(continent, country, park);
    const countryName = formatSlugToTitle(country);
    const continentName = formatSlugToTitle(continent);

    // Get all rides with wait times
    const allRides = data.themeAreas.flatMap((area) =>
      area.rides.map((ride) => ({
        ...ride,
        themeAreaName: area.name,
        hierarchicalUrl: `${data.hierarchicalUrl}/${ride.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')}`,
      }))
    );

    const activeRides = allRides.filter((ride) => ride.isActive);
    const openRides = activeRides.filter((ride) => ride.currentQueueTime.isOpen);
    const ridesWithWaitTimes = openRides.filter((ride) => ride.currentQueueTime.waitTime > 0);

    // Sort rides by wait time for highlights
    const longestWaits = ridesWithWaitTimes
      .sort((a, b) => b.currentQueueTime.waitTime - a.currentQueueTime.waitTime)
      .slice(0, 5);

    const shortestWaits = ridesWithWaitTimes
      .sort((a, b) => a.currentQueueTime.waitTime - b.currentQueueTime.waitTime)
      .slice(0, 5);

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm text-muted-foreground mb-4">
            <Link href={`/parks/${continent}`} className="hover:text-primary">
              {continentName}
            </Link>
            {' / '}
            <Link href={`/parks/${continent}/${country}`} className="hover:text-primary">
              {countryName}
            </Link>
            {' / '}
            <span className="text-foreground">{data.name}</span>
          </nav>

          <div className="flex items-center gap-4 mb-6">
            <h1 className="text-4xl font-bold">{data.name}</h1>
            <Badge
              variant={data.operatingStatus.isOpen ? 'default' : 'secondary'}
              className={`text-lg px-3 py-1 ${data.operatingStatus.isOpen ? 'bg-green-500 hover:bg-green-600' : ''}`}
            >
              {data.operatingStatus.isOpen ? 'Open' : 'Closed'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">
                  {data.operatingStatus.totalRideCount}
                </div>
                <div className="text-sm text-muted-foreground">Total Rides</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {data.operatingStatus.openRideCount}
                </div>
                <div className="text-sm text-muted-foreground">Open Rides</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{data.crowdLevel.label}</div>
                <div className="text-sm text-muted-foreground">Crowd Level</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600 capitalize">
                  {data.weather?.current?.status || 'Unknown'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {data.weather?.current?.temperature?.max
                    ? `${data.weather.current.temperature.max}°C`
                    : 'Temperature N/A'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {formatPercentage(data.operatingStatus.operatingPercentage / 100, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Operating</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-4">Theme Areas & Rides</h2>
            <div className="space-y-6">
              {data.themeAreas.map((area) => (
                <Card key={area.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{area.name}</span>
                      <Badge variant="outline">{area.rides.length} rides</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {area.rides.map((ride) => (
                        <Link
                          key={ride.id}
                          href={`${data.hierarchicalUrl}/${ride.name
                            .toLowerCase()
                            .replace(/[^a-z0-9\s-]/g, '')
                            .replace(/\s+/g, '-')}`}
                          className="block transition-colors hover:bg-muted rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{ride.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {ride.isActive
                                  ? ride.currentQueueTime.isOpen
                                    ? 'Operating'
                                    : 'Temporarily Closed'
                                  : 'Inactive'}
                              </div>
                            </div>
                            <div className="ml-3">
                              {ride.isActive && ride.currentQueueTime.isOpen ? (
                                <Badge
                                  variant={getWaitTimeBadgeVariant(ride.currentQueueTime.waitTime)}
                                  className={getWaitTimeColor(ride.currentQueueTime.waitTime)}
                                >
                                  {ride.currentQueueTime.waitTime > 0
                                    ? `${ride.currentQueueTime.waitTime} min`
                                    : 'Walk On'}
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Closed</Badge>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {longestWaits.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Longest Wait Times</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {longestWaits.map((ride, index) => (
                      <Link
                        key={ride.id}
                        href={ride.hierarchicalUrl}
                        className="block transition-colors hover:bg-muted rounded-lg p-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{ride.name}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {ride.themeAreaName}
                            </div>
                          </div>
                          <div className="ml-3 flex items-center gap-2">
                            <Badge variant="destructive">
                              {ride.currentQueueTime.waitTime} min
                            </Badge>
                            <span className="text-muted-foreground text-sm">#{index + 1}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {shortestWaits.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Shortest Wait Times</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {shortestWaits.map((ride, index) => (
                      <Link
                        key={ride.id}
                        href={ride.hierarchicalUrl}
                        className="block transition-colors hover:bg-muted rounded-lg p-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{ride.name}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {ride.themeAreaName}
                            </div>
                          </div>
                          <div className="ml-3 flex items-center gap-2">
                            <Badge variant="default">{ride.currentQueueTime.waitTime} min</Badge>
                            <span className="text-muted-foreground text-sm">#{index + 1}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Park Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">
                      {getCountryFlag(data.country)} {data.country}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Operator:</span>
                    <span className="font-medium">{data.parkGroup.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Theme Areas:</span>
                    <span className="font-medium">{data.themeAreas.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weather Score:</span>
                    <span className="font-medium">{data.weather.current.weatherScore}/100</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching park data:', error);
    notFound();
  }
}
