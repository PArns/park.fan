import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchRideDetails, getCountryFlag, isStaticFileRequest } from '@/lib/api';
import { formatDateTime } from '@/lib/date-utils';
import { formatSlugToTitle } from '@/lib/utils';

interface RidePageProps {
  params: Promise<{
    continent: string;
    country: string;
    park: string;
    ride: string;
  }>;
}

export const revalidate = 300; // CACHE_REVALIDATE_TIME from config

export async function generateMetadata({ params }: RidePageProps): Promise<Metadata> {
  const { continent, country, park, ride } = await params;

  // Check if this is a static file request
  if (
    isStaticFileRequest(continent) ||
    isStaticFileRequest(country) ||
    isStaticFileRequest(park) ||
    isStaticFileRequest(ride)
  ) {
    return {
      title: 'Not Found | park.fan',
      description: 'The requested page could not be found.',
    };
  }

  try {
    const data = await fetchRideDetails(continent, country, park, ride);

    return {
      title: `${data.name} at ${data.park.name} - Real-time Wait Times | park.fan`,
      description: `Current wait time for ${data.name} at ${data.park.name}. Live queue information and ride details.`,
    };
  } catch {
    return {
      title: 'Ride not found | park.fan',
      description: 'The requested ride could not be found.',
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

function getStatusBadge(isActive: boolean, isOpen: boolean) {
  if (!isActive) {
    return <Badge variant="secondary">Inactive</Badge>;
  }
  if (isOpen) {
    return (
      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
        Operating
      </Badge>
    );
  }
  return <Badge variant="destructive">Temporarily Closed</Badge>;
}

export default async function RidePage({ params }: RidePageProps) {
  const { continent, country, park, ride } = await params;

  // Check if this is a static file request
  if (
    isStaticFileRequest(continent) ||
    isStaticFileRequest(country) ||
    isStaticFileRequest(park) ||
    isStaticFileRequest(ride)
  ) {
    notFound();
  }

  try {
    const data = await fetchRideDetails(continent, country, park, ride);
    const countryName = formatSlugToTitle(country);
    const continentName = formatSlugToTitle(continent);

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
            <Link href={`${data.park.hierarchicalUrl}`} className="hover:text-primary">
              {data.park.name}
            </Link>
            {' / '}
            <span className="text-foreground">{data.name}</span>
          </nav>

          <div className="flex items-center gap-4 mb-6">
            <h1 className="text-4xl font-bold">{data.name}</h1>
            {getStatusBadge(data.isActive, data.currentQueueTime.isOpen)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Current Wait Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  {data.isActive && data.currentQueueTime.isOpen ? (
                    <>
                      <div
                        className={`text-6xl font-bold mb-2 ${getWaitTimeColor(data.currentQueueTime.waitTime)}`}
                      >
                        {data.currentQueueTime.waitTime > 0
                          ? `${data.currentQueueTime.waitTime}`
                          : '0'}
                      </div>
                      <div className="text-xl text-muted-foreground mb-4">
                        {data.currentQueueTime.waitTime > 0 ? 'minutes' : 'Walk On'}
                      </div>
                      <Badge
                        variant={getWaitTimeBadgeVariant(data.currentQueueTime.waitTime)}
                        className="text-lg px-4 py-2"
                      >
                        {data.currentQueueTime.waitTime > 0
                          ? `${data.currentQueueTime.waitTime} min wait`
                          : 'No Wait'}
                      </Badge>
                    </>
                  ) : (
                    <>
                      <div className="text-6xl font-bold mb-2 text-gray-500">—</div>
                      <div className="text-xl text-muted-foreground mb-4">
                        {data.isActive ? 'Temporarily Closed' : 'Inactive'}
                      </div>
                      <Badge variant="secondary" className="text-lg px-4 py-2">
                        Not Operating
                      </Badge>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ride Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Location</h3>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Park:</span>
                          <Link
                            href={data.park.hierarchicalUrl}
                            className="font-medium hover:text-primary"
                          >
                            {data.park.name}
                          </Link>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Theme Area:</span>
                          <span className="font-medium">{data.themeArea.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Country:</span>
                          <span className="font-medium">
                            {getCountryFlag(data.park.country)} {data.park.country}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Status</h3>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Active:</span>
                          <span className="font-medium">{data.isActive ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Operating:</span>
                          <span className="font-medium">
                            {data.isActive && data.currentQueueTime.isOpen ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Updated:</span>
                          <span className="font-medium text-sm">
                            {formatDateTime(data.currentQueueTime.lastUpdated)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link
                    href={data.park.hierarchicalUrl}
                    className="block w-full px-4 py-2 text-center bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    View Park Details
                  </Link>
                  <Link
                    href={`/${continent}/${country}`}
                    className="block w-full px-4 py-2 text-center border border-border rounded-md hover:bg-muted transition-colors"
                  >
                    All {countryName} Parks
                  </Link>
                  <Link
                    href={`/${continent}`}
                    className="block w-full px-4 py-2 text-center border border-border rounded-md hover:bg-muted transition-colors"
                  >
                    All {continentName} Parks
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Wait Time Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-500">
                      0-15 min
                    </Badge>
                    <span>Great time to ride</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">16-30 min</Badge>
                    <span>Moderate wait</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">31+ min</Badge>
                    <span>Long wait</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Walk On</Badge>
                    <span>No wait time</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>About Wait Times</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Wait times are updated in real-time and represent the estimated time from joining
                  the queue to boarding the ride. Times may vary based on operational factors and
                  crowd levels.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching ride data:', error);
    notFound();
  }
}
