import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchStatistics, getCountryFlag, normalizePathSegment } from '@/lib/api';
import { formatNumber, formatPercentage } from '@/lib/date-utils';

export const metadata: Metadata = {
  title: 'Theme Parks Directory - Real-time Wait Times | park.fan',
  description: 'Explore theme parks worldwide. Real-time wait times, crowd levels, and park information for all major theme parks across continents.',
};

export const revalidate = 300; // CACHE_REVALIDATE_TIME from config

export default async function ParksPage() {
  try {
    const stats = await fetchStatistics();
    
    // Group data by continent
    const continentData = stats.parksByContinent?.map(continent => {
      const continentCountries = stats.parksByCountry?.filter(country => 
        stats.rideStatistics.busiestParks.some(park => 
          park.continent.toLowerCase() === continent.continent.toLowerCase() && 
          park.country === country.country
        )
      ) || [];
      
      return {
        ...continent,
        countries: continentCountries.length,
        slug: normalizePathSegment(continent.continent)
      };
    }) || [];

    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 lg:mb-4">Theme Parks Directory</h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-4 lg:mb-6">
            Discover theme parks worldwide with real-time wait times, crowd levels, and detailed park information.
          </p>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-primary">{formatNumber(stats.totalParks)}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total Parks</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{formatNumber(stats.parkOperatingStatus?.openParks || 0)}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Open Parks</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{formatNumber(stats.totalRides)}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total Rides</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-orange-600">{formatNumber(stats.rideStatistics?.activeRides || 0)}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Active Rides</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6 lg:space-y-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 lg:mb-6">Explore by Continent</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {continentData.map((continent) => (
                <Link 
                  key={continent.continent} 
                  href={`/parks/${continent.slug}`}
                  className="group transition-transform hover:scale-[1.02]"
                >
                  <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg sm:text-xl font-semibold mb-2 group-hover:text-primary transition-colors truncate">{continent.continent}</h3>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div>{formatNumber(continent.totalParks)} parks</div>
                            <div>{continent.countries} countries</div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <Badge variant="outline" className="mb-2 text-xs">
                            {formatPercentage(continent.operatingPercentage)} Open
                          </Badge>
                          <div className="text-xs sm:text-sm text-primary font-medium">
                            Explore →
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-6 lg:space-y-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 lg:mb-6">Busiest Parks Right Now</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                {stats.rideStatistics.busiestParks.slice(0, 8).map((park, index) => (
                  <Link 
                    key={park.parkId} 
                    href={`/parks/${normalizePathSegment(park.continent)}/${normalizePathSegment(park.country)}/${normalizePathSegment(park.parkName)}`}
                    className="block transition-transform hover:scale-[1.01]"
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              #{index + 1}
                            </Badge>
                            <div className="min-w-0">
                              <div className="font-semibold hover:text-primary transition-colors text-sm sm:text-base truncate">
                                {park.parkName}
                              </div>
                              <div className="text-xs sm:text-sm text-muted-foreground truncate">
                                {getCountryFlag(park.country)} {park.country}
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-2">
                            <div className="text-lg sm:text-xl font-bold text-primary">
                              {park.averageWaitTime.toFixed(0)} min
                            </div>
                            <div className="text-xs text-muted-foreground">
                              avg. wait
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 lg:mb-6">Quietest Parks Right Now</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                {stats.rideStatistics.quietestParks.slice(0, 8).map((park, index) => (
                  <Link 
                    key={park.parkId} 
                    href={`/parks/${normalizePathSegment(park.continent)}/${normalizePathSegment(park.country)}/${normalizePathSegment(park.parkName)}`}
                    className="block transition-transform hover:scale-[1.01]"
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <Badge variant="outline" className="text-xs flex-shrink-0 bg-green-50 text-green-700 border-green-200">
                              #{index + 1}
                            </Badge>
                            <div className="min-w-0">
                              <div className="font-semibold hover:text-primary transition-colors text-sm sm:text-base truncate">
                                {park.parkName}
                              </div>
                              <div className="text-xs sm:text-sm text-muted-foreground truncate">
                                {getCountryFlag(park.country)} {park.country}
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-2">
                            <div className="text-lg sm:text-xl font-bold text-green-600">
                              {park.averageWaitTime.toFixed(0)} min
                            </div>
                            <div className="text-xs text-muted-foreground">
                              avg. wait
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 lg:mb-6">Featured Parks</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {stats.rideStatistics.busiestParks.slice(0, 6).map((park) => (
                  <Link 
                    key={park.parkId} 
                    href={`/parks/${normalizePathSegment(park.continent)}/${normalizePathSegment(park.country)}/${normalizePathSegment(park.parkName)}`}
                    className="block transition-transform hover:scale-[1.02]"
                  >
                    <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
                      <CardContent className="p-4 sm:p-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold hover:text-primary transition-colors text-sm sm:text-base truncate">
                                {park.parkName}
                              </h3>
                              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                                {getCountryFlag(park.country)} {park.country}
                              </div>
                            </div>
                            <Badge variant={park.averageWaitTime > 30 ? "destructive" : park.averageWaitTime > 15 ? "warning" : "success"} className="text-xs">
                              {park.averageWaitTime.toFixed(0)} min
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Average wait time across all rides
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Failed to fetch statistics:', error);
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 lg:mb-4">Theme Parks Directory</h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Sorry, we&apos;re having trouble loading the parks data right now. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}
