import { Clock, TrendingUp } from 'lucide-react';
import { Card } from '../ui/card';
import { EmptyState } from '../feedback/empty-state';
import { WaitTimeBadge } from '../wait-time-badge';
import { RideWaitTime } from '../../lib/api-types';
import { getCountryFlag, getRankIcon } from '../../lib/api';
import { ClientTime } from '../display/client-time';
import Link from 'next/link';

interface BusiestRidesProps {
  rides: RideWaitTime[];
}

export function BusiestRides({ rides }: BusiestRidesProps) {
  const topRides = rides.slice(0, 3);

  return (
    <Card className="p-6" hover="lift">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
          <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Busiest Rides</h3>
          <p className="text-sm text-muted-foreground">Longest wait times globally</p>
        </div>
      </div>

      <div className="space-y-4">
        {topRides.map((ride, index) => (
          <Link
            key={ride.rideId}
            href={ride.hierarchicalUrl}
            className="block transition-transform hover:scale-[1.02]"
          >
            <div className="flex items-center gap-4 p-4 bg-muted/30 hover:bg-muted/50 rounded-lg transition-all">
              <div className="text-4xl flex items-center justify-center w-16 h-16 bg-muted/50 rounded-full">
                {getRankIcon(index)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-foreground truncate hover:text-primary transition-colors">
                    {ride.rideName}
                  </h4>
                  <span className="text-lg">{getCountryFlag(ride.country)}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{ride.parkName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <ClientTime
                    timestamp={ride.lastUpdated}
                    format="both"
                    className="text-xs text-muted-foreground"
                  />
                </div>
              </div>

              <div className="text-right">
                <WaitTimeBadge waitTime={ride.waitTime} className="text-lg font-bold px-3 py-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {rides.length === 0 && (
        <EmptyState
          title="No ride data available"
          description="Currently no rides with wait time data"
        />
      )}
    </Card>
  );
}
