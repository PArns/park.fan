import { Clock, TrendingDown } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { RideWaitTime } from '../../lib/api-types';
import { getCountryFlag } from '../../lib/api';
import { ClientTime } from '../ui/client-time';

interface QuietestRidesProps {
  rides: RideWaitTime[];
}

export function QuietestRides({ rides }: QuietestRidesProps) {
  const topRides = rides.slice(0, 3);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return '🏆';
    }
  };

  const getWaitTimeVariant = (waitTime: number): 'success' | 'success' | 'info' => {
    if (waitTime === 0) return 'success';
    if (waitTime <= 10) return 'success';
    return 'info';
  };

  return (
    <Card className="p-6" hover="lift">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Quietest Rides</h3>
          <p className="text-sm text-muted-foreground">Shortest wait times globally</p>
        </div>
      </div>

      <div className="space-y-4">
        {topRides.map((ride, index) => (
          <div key={ride.rideId} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-4xl flex items-center justify-center w-16 h-16 bg-muted/50 rounded-full">
              {getRankIcon(index)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-foreground truncate">{ride.rideName}</h4>
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
              <Badge
                variant={getWaitTimeVariant(ride.waitTime)}
                className="text-lg font-bold px-3 py-1"
              >
                {ride.waitTime === 0 ? 'Walk-On' : `${ride.waitTime} min`}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {rides.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <TrendingDown className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No ride data available</p>
        </div>
      )}
    </Card>
  );
}
