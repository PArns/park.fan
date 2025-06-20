import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import Link from 'next/link';
import type { ContinentStats } from '../../lib/api-types';
import { Globe } from 'lucide-react';
import { normalizePathSegment } from '../../lib/api';

interface ContinentStatsProps {
  continents: ContinentStats;
}

export default function ContinentStats({ continents }: ContinentStatsProps) {
  const getContinentEmoji = (continent: string) => {
    switch (continent) {
      case 'North America':
        return '🇺🇸';
      case 'Europe':
        return '🇪🇺';
      case 'Asia':
        return '🌏';
      case 'South America':
        return '🌎';
      case 'Africa':
        return '🌍';
      default:
        return '🌍';
    }
  };

  const continentEntries = Object.entries(continents || {});
  const totalParks = continentEntries.reduce((sum, [, count]) => sum + count, 0);

  if (continentEntries.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span>Parks by Continent</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No continent data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <span>Parks by Continent</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {continentEntries
          .sort(([, a], [, b]) => b - a)
          .map(([continent, count]) => {
            const percentage = totalParks > 0 ? (count / totalParks) * 100 : 0;
            const continentSlug = normalizePathSegment(continent);

            return (
              <Link key={continent} href={`/parks/${continentSlug}`} className="block">
                <div className="space-y-2 p-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getContinentEmoji(continent)}</span>
                      <span className="font-medium text-sm text-foreground hover:text-primary transition-colors">{continent}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{count}</span>
                      <span className="text-xs text-muted-foreground">
                        ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              </Link>
            );
          })}

        <div className="pt-4 border-t border-border">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-foreground">Total Parks</span>
            <span className="font-bold text-foreground">{totalParks}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
