import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { EmptyState } from '../feedback/empty-state';
import { cn } from '../../lib/utils';
import { getWaitTimeBadgeVariant } from '../../lib/api';
import { Park } from '../../lib/api-types';
import { Flame, Smile } from 'lucide-react';

interface TopParksProps {
  parks: Park[];
  type: 'busiest' | 'quietest';
}

export default function TopParks({ parks, type }: TopParksProps) {
  const title = type === 'busiest' ? 'Busiest Parks' : 'Quietest Parks';
  const Icon = type === 'busiest' ? Flame : Smile;

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900';
      case 1:
        return 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-700';
      case 2:
        return 'bg-gradient-to-br from-amber-600 to-amber-800 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card variant="glass" hover="lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              type === 'busiest'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
            )}
          >
            <Icon size={20} />
          </div>
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {parks && parks.length > 0 ? (
          parks.slice(0, 3).map((park, index) => (
            <Link
              key={park.parkId}
              href={park.hierarchicalUrl}
              className="block transition-transform hover:scale-[1.02]"
            >
              <div className="group flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-lg transition-all">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold shadow-lg',
                      getMedalColor(index)
                    )}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {park.parkName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {park.country} • {park.continent}
                    </p>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <Badge
                    variant={getWaitTimeBadgeVariant(park.averageWaitTime)}
                    className="text-lg font-bold px-3 py-1"
                  >
                    {park.averageWaitTime.toFixed(0)} min
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {park.openRideCount}/{park.totalRideCount} rides
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <EmptyState
            icon={Icon}
            title="No data available"
            description={`No ${type === 'busiest' ? 'busy' : 'quiet'} parks data at the moment`}
          />
        )}
      </CardContent>
    </Card>
  );
}
