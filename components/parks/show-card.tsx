import { Suspense } from 'react';
import { Link } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { FavoriteStar } from '@/components/common/favorite-star';
import { ShowFollowBell } from '@/components/push/show-follow-bell';
import { DistanceBadge } from '@/components/common/distance-badge';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { SeasonalBadge } from '@/components/parks/seasonal-badge';
import { ShowCardShowtimes } from '@/components/parks/show-card-showtimes';
import { Skeleton } from '@/components/ui/skeleton';
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
        {/* Notification bell + favorite star */}
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
          <ShowFollowBell showId={id} showName={name} />
          <FavoriteStar type="show" id={id} />
        </div>
        <CardContent className="p-4">
          {/* `pr-12` reserves the corner icons' own footprint (measured: 44px from this
              row's right edge to the notification bell's left edge, for the two-icon
              row now that a title runs unclamped on the park's own page) so a long,
              badge-less title wraps before it reaches them instead of running underneath. */}
          <div className="flex items-start justify-between gap-2 pr-12">
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

          {/* Today's showtimes — client-rendered (time-relative past/next highlighting). The
              skeleton fallback reserves one showtimes row so the badges swap in without shifting. */}
          {status === 'OPERATING' && (
            <Suspense
              fallback={
                <div className="mt-2 flex flex-wrap gap-1" aria-hidden="true">
                  <Skeleton className="h-5 w-12 rounded-md" />
                  <Skeleton className="h-5 w-12 rounded-md" />
                  <Skeleton className="h-5 w-12 rounded-md" />
                </div>
              }
            >
              <ShowCardShowtimes showtimes={showtimes} timezone={timezone} />
            </Suspense>
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
