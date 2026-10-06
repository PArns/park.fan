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
  /** The favorites section names the park and the distance to it. */
  parkName?: string;
  distance?: number;
  isSeasonal?: boolean;
  seasonMonths?: number[] | null;
  isCurrentlyInSeason?: boolean | null;
}

/**
 * Card linking to a show: name, seasonal badge, today's showtimes while it runs or its status
 * badge when it does not, with a notification bell and a favorite star in the corner.
 */
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
        {/* `max-sm:gap-7`: below `sm` each icon's `::after` touch target is 44 px, and 28 px
            between them puts the two centres 44 px apart, so the zones meet without overlapping. A
            mouse has no such zone, hence `gap-1` above `sm`. */}
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1 max-sm:gap-7">
          <ShowFollowBell
            showId={id}
            showName={name}
            source="card"
            showtimes={showtimes}
            timezone={timezone}
          />
          <FavoriteStar type="show" id={id} />
        </div>
        <CardContent className="p-4">
          {/* `pr-12` reserves the corner icons' footprint above `sm` and `max-sm:pr-[72px]` the
              wider phone row, so a long title wraps before it runs under them. */}
          <div className="flex items-start justify-between gap-2 pr-12 max-sm:pr-[72px]">
            <h3 className={cn('font-semibold', parkName ? 'line-clamp-2' : '')}>{name}</h3>
            {isSeasonal && (
              <SeasonalBadge
                seasonMonths={seasonMonths}
                isCurrentlyInSeason={isCurrentlyInSeason}
                className="h-5 shrink-0 px-1.5 text-[10px]"
              />
            )}
          </div>

          {parkName && <p className="text-muted-foreground mt-1 truncate text-xs">{parkName}</p>}

          {distance !== undefined && distance !== null && (
            <DistanceBadge distance={distance} className="mt-2" />
          )}

          {/* Client-rendered, since past and next depend on the clock. The fallback reserves one
              showtimes row so the badges swap in without a shift. */}
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
              <ShowCardShowtimes
                showtimes={showtimes}
                timezone={timezone}
                showId={id}
                showName={name}
              />
            </Suspense>
          )}

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
