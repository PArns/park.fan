import Link from 'next/link';
import { Clock, TrendingDown } from 'lucide-react';
import { Card } from '../ui/card';
import { WaitTimeBadge } from '../wait-time-badge';
import { RideWaitTime } from '../../lib/api-types';
import { getCountryFlag } from '../../lib/api';
import { ClientTime } from '../ui/client-time';

interface QuietestRidesProps {
  rides: RideWaitTime[];
}

// Helper function to generate hierarchical URL for rides
function generateRideUrl(ride: RideWaitTime): string {
  const continent =
    ride.country === 'United States'
      ? 'north-america'
      : ride.country === 'England' || ride.country === 'United Kingdom'
        ? 'europe'
        : 'europe'; // Default to europe for now, would need mapping for other continents
  const country = ride.country.toLowerCase().replace(/\s+/g, '-');
  const parkName = ride.parkName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
  const rideName = ride.rideName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
  return `/${continent}/${country}/${parkName}/${rideName}`;
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
          <Link
            key={ride.rideId}
            href={generateRideUrl(ride)}
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
                <WaitTimeBadge 
                  waitTime={ride.waitTime} 
                  className="text-lg font-bold px-3 py-1"
                />
              </div>
            </div>
          </Link>
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
