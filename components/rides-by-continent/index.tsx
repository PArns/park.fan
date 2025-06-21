import { Globe, Activity } from 'lucide-react';
import Link from 'next/link';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { normalizePathSegment } from '../../lib/api';

interface RidesByContinentProps {
  continents: Array<{
    continent: string;
    totalRides: number;
    activeRides: number;
    openRides: number;
    operatingPercentage: number;
  }>;
}

export function RidesByContinent({ continents }: RidesByContinentProps) {
  const validContinents = continents.filter((c) => c.totalRides > 0);
  const maxRides = Math.max(...validContinents.map((c) => c.totalRides));

  const getContinentEmoji = (continent: string) => {
    const emojiMap: { [key: string]: string } = {
      'North America': '🇺🇸',
      'South America': '🇧🇷',
      Europe: '🇪🇺',
      Asia: '🇯🇵',
      Africa: '🌍',
      Oceania: '🇦🇺',
      Antarctica: '🐧',
    };
    return emojiMap[continent] || '🌍';
  };

  const getPerformanceVariant = (percentage: number): 'success' | 'warning' | 'error' => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500 dark:bg-green-600';
    if (percentage >= 60) return 'bg-yellow-500 dark:bg-yellow-600';
    return 'bg-red-500 dark:bg-red-600';
  };

  return (
    <Card className="p-6" hover="lift">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Rides by Continent</h3>
          <p className="text-sm text-muted-foreground">Continental ride distribution</p>
        </div>
      </div>

      <div className="space-y-4">
        {validContinents.map((continent) => {
          const continentSlug = normalizePathSegment(continent.continent);

          return (
            <Link key={continent.continent} href={`/parks/${continentSlug}`}>
              <div className="p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{getContinentEmoji(continent.continent)}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground hover:text-primary transition-colors">
                      {continent.continent}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {continent.totalRides.toLocaleString()} rides total
                      </span>
                      <Badge
                        variant={getPerformanceVariant(continent.operatingPercentage)}
                        className="text-xs"
                      >
                        {continent.operatingPercentage}% operating
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Open Now</span>
                    <span className="font-medium text-foreground">
                      {continent.openRides.toLocaleString()} /{' '}
                      {continent.totalRides.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Progress
                      value={(continent.totalRides / maxRides) * 100}
                      className="flex-1 h-2"
                    />
                    <div
                      className={`h-2 w-6 rounded-full ${getProgressColor(continent.operatingPercentage)}`}
                      title={`${continent.operatingPercentage}% operating`}
                    />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {validContinents.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No continental ride data available</p>
        </div>
      )}
    </Card>
  );
}
