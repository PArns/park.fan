import { MapPin, Activity } from 'lucide-react';
import Link from 'next/link';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  getCountryFlag,
  normalizePathSegment,
  getRankIcon,
  getCountryContinent,
} from '../../lib/api';

interface RidesByCountryProps {
  countries: Array<{
    country: string;
    totalRides: number;
    activeRides: number;
    openRides: number;
    operatingPercentage: number;
  }>;
}

export function RidesByCountry({ countries }: RidesByCountryProps) {
  const topCountries = countries.slice(0, 5);
  const maxRides = Math.max(...topCountries.map((c) => c.totalRides));

  const getPerformanceVariant = (percentage: number): 'success' | 'warning' | 'error' => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  return (
    <Card className="p-6" hover="lift">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Top Countries by Rides</h3>
          <p className="text-sm text-muted-foreground">Most rides per country</p>
        </div>
      </div>

      <div className="space-y-4">
        {topCountries.map((country, index) => {
          const continentSlug = getCountryContinent(country.country);
          const countrySlug = normalizePathSegment(country.country);

          return (
            <Link key={country.country} href={`/parks/${continentSlug}/${countrySlug}`}>
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="text-4xl flex items-center justify-center w-16 h-16 bg-muted/50 rounded-full">
                  {getRankIcon(index)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getCountryFlag(country.country)}</span>
                    <h4 className="font-medium text-foreground hover:text-primary transition-colors">
                      {country.country}
                    </h4>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Rides</span>
                      <span className="font-medium text-foreground">
                        {country.totalRides.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Open Now</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {country.openRides.toLocaleString()}
                        </span>
                        <Badge
                          variant={getPerformanceVariant(country.operatingPercentage)}
                          className="text-xs"
                        >
                          {country.operatingPercentage}%
                        </Badge>
                      </div>
                    </div>

                    <Progress value={(country.totalRides / maxRides) * 100} className="h-2" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {countries.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No country data available</p>
        </div>
      )}
    </Card>
  );
}
