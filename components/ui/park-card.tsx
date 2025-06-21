import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { getCountryFlag, getWaitTimeBadgeVariant } from '@/lib/api';
import { formatPercentage } from '@/lib/date-utils';

interface ParkCardProps {
  park: {
    id: number;
    name: string;
    country: string;
    hierarchicalUrl: string;
    operatingStatus: {
      isOpen: boolean;
      openRideCount: number;
      totalRideCount: number;
      operatingPercentage: number;
    };
    averageWaitTime?: number;
  };
  showWaitTime?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ParkCard({ park, showWaitTime = false, size = 'md' }: ParkCardProps) {
  const cardClasses = {
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6',
  };

  const titleClasses = {
    sm: 'text-sm sm:text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-xl sm:text-2xl',
  };

  return (
    <Link href={park.hierarchicalUrl} className="block transition-transform hover:scale-[1.02]">
      <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle
              className={`${titleClasses[size]} line-clamp-2 pr-2 hover:text-primary transition-colors`}
            >
              {park.name}
            </CardTitle>
            <Badge
              variant={park.operatingStatus.isOpen ? 'success' : 'secondary'}
              className="text-xs"
            >
              {park.operatingStatus.isOpen ? 'Open' : 'Closed'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className={`pt-0 ${cardClasses[size]}`}>
          <div className="space-y-2">
            <div className="text-xs sm:text-sm text-muted-foreground">
              {getCountryFlag(park.country)} {park.country}
            </div>

            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Rides Operating:</span>
              <span className="font-medium">
                {park.operatingStatus.openRideCount}/{park.operatingStatus.totalRideCount}
                {park.operatingStatus.totalRideCount > 0 && (
                  <span className="text-muted-foreground ml-1">
                    ({formatPercentage(park.operatingStatus.operatingPercentage)})
                  </span>
                )}
              </span>
            </div>

            {showWaitTime && park.averageWaitTime !== undefined && (
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Avg. Wait:</span>
                <Badge variant={getWaitTimeBadgeVariant(park.averageWaitTime)} className="text-xs">
                  {park.averageWaitTime.toFixed(0)} min
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
