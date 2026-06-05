import { Link } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { FavoriteStar } from '@/components/common/favorite-star';
import { DistanceBadge } from '@/components/common/distance-badge';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { SeasonalBadge } from '@/components/parks/seasonal-badge';
import { ShowCardShowtimes } from '@/components/parks/show-card-showtimes';
import { cn } from '@/lib/utils';

interface ShowCardProps {
  id: string;
  name: string;
  slug: string;
  status: string;
  showtimes?: Array<{
    startTime: string;
  }> | null;
  timezone: string;
  href: string;
  parkName?: string; // Optional park name (for favorites section)
  distance?: number; // Optional distance (for favorites section)
  isSeasonal?: boolean;
  seasonMonths?: number[] | null;
  isCurrentlyInSeason?: boolean | null;
}

export function ShowCard({
  id,
  name,
  status,
  showtimes,
  timezone,
  href,
  parkName,
  distance,
  isSeasonal,
  seasonMonths,
  isCurrentlyInSeason,
}: ShowCardProps) {
  return (
    <Link href={href} prefetch={false} className="group block h-full">
      <Card className="hover:border-primary/50 relative h-full transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
        {/* Favorite Star */}
        <div className="absolute top-2 right-2 z-20 flex items-center justify-center">
          <FavoriteStar type="show" id={id} />
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn('font-semibold', parkName ? 'line-clamp-2' : '')}>{name}</h3>
            {isSeasonal && (
              <SeasonalBadge
                seasonMonths={seasonMonths}
                isCurrentlyInSeason={isCurrentlyInSeason}
                className="h-5 shrink-0 px-1.5 text-[10px]"
              />
            )}
          </div>

          {/* Park Name (for favorites) */}
          {parkName && <p className="text-muted-foreground mt-1 truncate text-xs">{parkName}</p>}

          {/* Distance (for favorites) */}
          {distance !== undefined && distance !== null && (
            <DistanceBadge distance={distance} className="mt-2" />
          )}

          {/* Today's showtimes — client-rendered (time-relative past/next highlighting) */}
          {status === 'OPERATING' && (
            <ShowCardShowtimes showtimes={showtimes} timezone={timezone} />
          )}

          {/* Status Badge for closed shows */}
          {status !== 'OPERATING' && (
            <div className="mt-2">
              <ParkStatusBadge status={status as import('@/lib/api/types').AttractionStatus} />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
