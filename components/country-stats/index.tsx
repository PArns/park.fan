import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import Link from 'next/link';
import { CountryStats as CountryStatsType } from '../../lib/api-types';
import { MapPin } from 'lucide-react';
import { normalizePathSegment } from '../../lib/api';

interface CountryStatsProps {
  countries: CountryStatsType[];
}

export default function CountryStats({ countries }: CountryStatsProps) {
  // Sort countries by total parks and take top 5
  const topCountries = countries.sort((a, b) => b.totalParks - a.totalParks).slice(0, 5);

  if (topCountries.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span>Top Countries</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No country data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <span>Top 5 Countries</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topCountries.map((country) => {
            // We need to determine the continent for the country
            // For now, we'll use a simple mapping for major countries
            const getCountryContinent = (countryName: string) => {
              const continentMap: { [key: string]: string } = {
                'United States': 'north-america',
                Canada: 'north-america',
                Mexico: 'north-america',
                Germany: 'europe',
                France: 'europe',
                'United Kingdom': 'europe',
                England: 'europe',
                Italy: 'europe',
                Spain: 'europe',
                Netherlands: 'europe',
                Belgium: 'europe',
                Austria: 'europe',
                Switzerland: 'europe',
                Denmark: 'europe',
                Sweden: 'europe',
                Norway: 'europe',
                Finland: 'europe',
                Japan: 'asia',
                China: 'asia',
                'South Korea': 'asia',
                Australia: 'oceania',
                Brazil: 'south-america',
              };
              return continentMap[countryName] || 'europe'; // Default to europe if not found
            };

            const continentSlug = getCountryContinent(country.country);
            const countrySlug = normalizePathSegment(country.country);

            return (
              <Link key={country.country} href={`/parks/${continentSlug}/${countrySlug}`}>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg flex-shrink-0">{country.flag || '🏁'}</span>
                      <span className="font-medium text-sm text-foreground hover:text-primary transition-colors truncate">
                        {country.country}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold text-sm text-foreground">
                        {country.totalParks} parks
                      </div>
                      <div className="text-xs text-muted-foreground">{country.openParks} open</div>
                    </div>

                    <Badge
                      variant={
                        country.operatingPercentage >= 80
                          ? 'success'
                          : country.operatingPercentage >= 50
                            ? 'warning'
                            : 'error'
                      }
                      className="text-xs"
                    >
                      {country.operatingPercentage}%
                    </Badge>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Showing top {topCountries.length} countries by park count
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
