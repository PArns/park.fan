'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { LocalTime } from '@/components/ui/local-time';
import { ShowFollowDialog } from '@/components/push/show-follow-dialog';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface ShowCardShowtimesProps {
  showtimes?: Array<{ startTime: string }> | null;
  timezone: string;
  showId: string;
  showName: string;
}

/**
 * Today's showtimes for a show card (with past/next highlighting). Client Component
 * because "today / is past / is next" depend on the current time — under Cache Components
 * a server render can't read `new Date()`. Rendered only for OPERATING shows by the parent.
 *
 * Each badge opens `ShowFollowDialog` — a showtime used to be a plain read-out with
 * nothing to tap. `stopPropagation` keeps a click from also activating the card's own
 * `<Link>`, the same nested-interactive-element concern `RideAlertBell` has.
 */
export function ShowCardShowtimes({ showtimes, timezone, showId, showName }: ShowCardShowtimesProps) {
  const tCommon = useTranslations('common');
  const [dialogOpen, setDialogOpen] = useState(false);

  const today = new Date();
  const todayShowtimes =
    showtimes?.filter((showtime) => {
      const showtimeDate = new Date(showtime.startTime);
      return showtimeDate >= today || showtimeDate.toDateString() === today.toDateString();
    }) || [];
  const nextShowtime = todayShowtimes.find((showtime) => new Date(showtime.startTime) > today);

  if (todayShowtimes.length > 0) {
    return (
      <>
        <div className="mt-2 flex flex-wrap gap-1" suppressHydrationWarning>
          {todayShowtimes.map((showtime, i) => {
            const showtimeDate = new Date(showtime.startTime);
            const isPast = showtimeDate < today;
            const isNext = nextShowtime && showtime.startTime === nextShowtime.startTime;

            return (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDialogOpen(true);
                }}
              >
                <Badge
                  variant="outline"
                  className={cn(
                    'cursor-pointer text-xs transition-colors hover:bg-white/10',
                    isPast && 'line-through opacity-40',
                    isNext &&
                      'border-status-operating/40 bg-status-operating/15 text-status-operating',
                    !isPast && !isNext && 'text-muted-foreground'
                  )}
                >
                  <LocalTime time={showtime.startTime} timeZone={timezone} />
                </Badge>
              </button>
            );
          })}
        </div>
        <ShowFollowDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          showId={showId}
          showName={showName}
          showtimes={showtimes}
          timezone={timezone}
        />
      </>
    );
  }

  if (showtimes && showtimes.length > 0) {
    return <p className="text-muted-foreground mt-2 text-sm">{tCommon('noShowtimesToday')}</p>;
  }

  return null;
}
