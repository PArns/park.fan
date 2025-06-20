import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchCountryDetails, fetchContinentDetails, getCountryFlag, isStaticFileRequest, normalizePathSegment } from '@/lib/api';
import { POSSIBLE_CONTINENTS } from '@/lib/config';
import { formatNumber, formatPercentage } from '@/lib/date-utils';
import { formatSlugToTitle } from '@/lib/utils';

interface CountryPageProps {
  params: Promise<{
    continent: string;
    country: string;
  }>;
}

export const revalidate = 300; // CACHE_REVALIDATE_TIME from config

export async function generateStaticParams() {
  try {
    const params: Array<{ continent: string; country: string }> = [];
    
    for (const continent of POSSIBLE_CONTINENTS) {
      try {
        // Fetch continent details to get all parks in this continent
        const continentData = await fetchContinentDetails(continent);
        
        if (continentData.data && continentData.data.length > 0) {
          // Get unique countries from the parks in this continent
          const countries = [...new Set(continentData.data.map(park => normalizePathSegment(park.country)))];
          
          // Add all continent-country combinations that actually exist
          for (const country of countries) {
            params.push({ continent, country });
          }
        }
      } catch {
        // Continent doesn't exist or error fetching, skip it
        continue;
      }
    }
    
    return params;
  } catch (error) {
    console.error('Error generating static params for countries:', error);
    return [];
  }
}

export async function generateMetadata({ params }: CountryPageProps): Promise<Metadata> {
  const { country, continent } = await params;
  
  // Check if this is a static file request
  if (isStaticFileRequest(continent) || isStaticFileRequest(country)) {
    return {
      title: 'Not Found | park.fan',
      description: 'The requested page could not be found.',
    };
  }
  
  const countryName = formatSlugToTitle(country);
  const continentName = formatSlugToTitle(continent);
  
  return {
    title: `${countryName} Theme Parks - Real-time Wait Times | park.fan`,
    description: `Explore theme parks in ${countryName}, ${continentName}. Real-time wait times, crowd levels, and detailed park information.`,
  };
}

export default async function CountryPage({ params }: CountryPageProps) {
  const { continent, country } = await params;
  
  // Check if this is a static file request
  if (isStaticFileRequest(continent) || isStaticFileRequest(country)) {
    notFound();
  }
  
  try {
    const data = await fetchCountryDetails(continent, country);
    const countryName = formatSlugToTitle(country);
    const continentName = formatSlugToTitle(continent);
    
    // Calculate country-wide statistics
    const totalParks = data.data.length;
    const openParks = data.data.filter(park => park.operatingStatus.isOpen).length;
    const totalRides = data.data.reduce((sum, park) => sum + park.operatingStatus.totalRideCount, 0);
    const openRides = data.data.reduce((sum, park) => sum + park.operatingStatus.openRideCount, 0);

    // Get top rides across all parks
    const allRides = data.data.flatMap(park => 
      park.themeAreas.flatMap(area => 
        area.rides.map(ride => ({
          ...ride,
          parkName: park.name,
          parkId: park.id,
          hierarchicalUrl: `${park.hierarchicalUrl}/${ride.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`
        }))
      )
    );

    const topRides = allRides
      .filter(ride => ride.isActive && ride.currentQueueTime.isOpen && ride.currentQueueTime.waitTime > 0)
      .sort((a, b) => b.currentQueueTime.waitTime - a.currentQueueTime.waitTime)
      .slice(0, 10);

    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="mb-6 lg:mb-8">
          <nav className="text-sm text-muted-foreground mb-4">
            <Link href={`/parks/${continent}`} className="hover:text-primary">
              {continentName}
            </Link>
            {' / '}
            <span className="text-foreground">{countryName}</span>
          </nav>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 lg:mb-4">
            {getCountryFlag(countryName)} {countryName} Theme Parks
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
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{formatNumber(totalRides)}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total Rides</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-orange-600">{formatNumber(openRides)}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Open Rides</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-4">Parks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.data.map((park) => (
                <Link 
                  key={park.id} 
                  href={park.hierarchicalUrl}
                  className="block transition-transform hover:scale-[1.02]"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{park.name}</CardTitle>
                        <Badge 
                          variant={park.operatingStatus.isOpen ? "default" : "secondary"}
                          className={park.operatingStatus.isOpen ? "bg-green-500 hover:bg-green-600" : ""}
                        >
                          {park.operatingStatus.isOpen ? "Open" : "Closed"}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Rides Operating:</span>
                          <span className="font-medium">
                            {park.operatingStatus.openRideCount}/{park.operatingStatus.totalRideCount}
                            {park.operatingStatus.totalRideCount > 0 && (
                              <span className="text-muted-foreground ml-1">
                                ({formatPercentage(park.operatingStatus.operatingPercentage / 100, 0)})
                              </span>
                            )}
                          </span>
                        </div>
                        
                        {park.operatingStatus.isOpen && (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Crowd Level:</span>
                              <span className="font-medium">{park.crowdLevel.label}</span>
                            </div>
                            
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Weather:</span>
                              <span className="font-medium capitalize">
                                {park.weather.status} {park.weather.temperature.max}°C
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

          <div>
            <h2 className="text-2xl font-semibold mb-4">Longest Wait Times</h2>
            {topRides.length > 0 ? (
              <div className="space-y-2">
                {topRides.map((ride, index) => (
                  <Link
                    key={`${ride.parkId}-${ride.id}`}
                    href={ride.hierarchicalUrl}
                    className="block transition-colors hover:bg-muted rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{ride.name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {ride.parkName}
                        </div>
                      </div>
                      <div className="ml-3 flex items-center gap-2">
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          {ride.currentQueueTime.waitTime} min
                        </Badge>
                        <span className="text-muted-foreground text-sm">#{index + 1}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No wait time data available.</p>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching country data:', error);
    notFound();
  }
}
