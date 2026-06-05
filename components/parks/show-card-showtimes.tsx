'use client';

import { Badge } from '@/components/ui/badge';
import { LocalTime } from '@/components/ui/local-time';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface ShowCardShowtimesProps {
  showtimes?: Array<{ startTime: string }> | null;
  timezone: string;
}

/**
 * Today's showtimes for a show card (with past/next highlighting). Client Component
 * because "today / is past / is next" depend on the current time — under Cache Components
 * a server render can't read `new Date()`. Rendered only for OPERATING shows by the parent.
 * Behaviour is identical to the previous inline server version.
 */
export function ShowCardShowtimes({ showtimes, timezone }: ShowCardShowtimesProps) {
  const tCommon = useTranslations('common');

  const today = new Date();
  const todayShowtimes =
    showtimes?.filter((showtime) => {
      const showtimeDate = new Date(showtime.startTime);
      return showtimeDate >= today || showtimeDate.toDateString() === today.toDateString();
    }) || [];
  const nextShowtime = todayShowtimes.find((showtime) => new Date(showtime.startTime) > today);

  if (todayShowtimes.length > 0) {
    return (
      <div className="mt-2 flex flex-wrap gap-1" suppressHydrationWarning>
        {todayShowtimes.map((showtime, i) => {
          const showtimeDate = new Date(showtime.startTime);
          const isPast = showtimeDate < today;
          const isNext = nextShowtime && showtime.startTime === nextShowtime.startTime;

          return (
            <Badge
              key={i}
              variant="outline"
              className={cn(
                'text-xs',
                isPast && 'line-through opacity-40',
                isNext && 'border-status-operating/40 bg-status-operating/15 text-status-operating',
                !isPast && !isNext && 'text-muted-foreground'
              )}
            >
              <LocalTime time={showtime.startTime} timeZone={timezone} />
            </Badge>
          );
        })}
      </div>
    );
  }

  if (showtimes && showtimes.length > 0) {
    return <p className="text-muted-foreground mt-2 text-sm">{tCommon('noShowtimesToday')}</p>;
  }

  return null;
}
