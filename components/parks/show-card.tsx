'use client';

import { Link } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FavoriteStar } from '@/components/common/favorite-star';
import { LocalTime } from '@/components/ui/local-time';
import { formatDistance } from '@/lib/utils/distance-utils';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface ShowCardProps {
  id: string;
  name: string;
  slug: string;
  status: string;
  showtimes?: Array<{
    type: string;
    startTime: string;
    endTime?: string;
  }> | null;
  timezone: string;
  href: string;
  parkName?: string; // Optional park name (for favorites section)
  distance?: number; // Optional distance (for favorites section)
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
}: ShowCardProps) {
  const tCommon = useTranslations('common');

  // Filter showtimes for today or future dates
  const today = new Date();
  const todayShowtimes =
    showtimes?.filter((showtime) => {
      const showtimeDate = new Date(showtime.startTime);
      return showtimeDate >= today || showtimeDate.toDateString() === today.toDateString();
    }) || [];

  // Find next showtime
  const nextShowtime = todayShowtimes.find((showtime) => {
    const showtimeDate = new Date(showtime.startTime);
    return showtimeDate > today;
  });

  return (
    <Link href={href} className="group block h-full">
      <Card className="hover:border-primary/50 relative h-full transition-all hover:shadow-md">
        {/* Favorite Star */}
        <div className="absolute top-2 right-2 z-20 flex items-center justify-center">
          <FavoriteStar type="show" id={id} />
        </div>
        <CardContent className="p-4">
          <h3 className={cn('font-semibold', parkName ? 'line-clamp-2' : '')}>{name}</h3>

          {/* Park Name (for favorites) */}
          {parkName && <p className="text-muted-foreground mt-1 truncate text-xs">{parkName}</p>}

          {/* Distance (for favorites) */}
          {distance !== undefined && distance !== null && (
            <div className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
              <span className="font-medium">{formatDistance(distance)}</span>
            </div>
          )}

          {/* All showtimes */}
          {status === 'OPERATING' && todayShowtimes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {todayShowtimes.map((showtime, i) => {
                const showtimeDate = new Date(showtime.startTime);
                const isPast = showtimeDate < today;
                const isNext = nextShowtime && showtime.startTime === nextShowtime.startTime;

                return (
                  <Badge
                    key={i}
                    variant={isNext ? 'default' : 'outline'}
                    className={cn(
                      'text-xs',
                      isPast && 'line-through opacity-50',
                      isNext && 'bg-green-600 text-white hover:bg-green-700'
                    )}
                  >
                    <LocalTime time={showtime.startTime} timeZone={timezone} />
                  </Badge>
                );
              })}
            </div>
          )}

          {/* No showtimes today message */}
          {status === 'OPERATING' &&
            todayShowtimes.length === 0 &&
            showtimes &&
            showtimes.length > 0 && (
              <p className="text-muted-foreground mt-2 text-sm">{tCommon('noShowtimesToday')}</p>
            )}

          {/* Status Badge for closed shows */}
          {status !== 'OPERATING' && (
            <div className="mt-2">
              <Badge
                className={cn(
                  'border-0 text-xs font-medium',
                  status === 'CLOSED'
                    ? 'bg-red-600 text-white dark:bg-red-400 dark:text-slate-900'
                    : 'bg-orange-600 text-white dark:bg-orange-400 dark:text-slate-900'
                )}
              >
                {tCommon(status.toLowerCase() as 'closed')}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
