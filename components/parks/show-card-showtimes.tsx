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
 * The badge for the NEXT performance opens `ShowFollowDialog`; the others are a
 * read-out. See the comment at that branch for why only one of them may be —
 * short version: a reminder belongs to the show, not to a clock time, so a badge
 * reading 19:45 must not file one for the 16:45 performance. `stopPropagation`
 * keeps that click from also activating the card's own `<Link>`, the same
 * nested-interactive-element concern `RideAlertBell` has.
 */
export function ShowCardShowtimes({
  showtimes,
  timezone,
  showId,
  showName,
}: ShowCardShowtimesProps) {
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

            const badge = (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs transition-colors',
                  isPast && 'line-through opacity-40',
                  isNext &&
                    'border-status-operating/40 bg-status-operating/15 text-status-operating cursor-pointer hover:bg-white/10',
                  !isPast && !isNext && 'text-muted-foreground'
                )}
              >
                <LocalTime time={showtime.startTime} timeZone={timezone} />
              </Badge>
            );

            // Only the NEXT performance opens the dialog. A reminder cannot be
            // bound to one showtime — `ShowFollow` on the API is keyed by
            // (subscription, show) and fires ahead of whichever performance
            // comes next — so a badge reading 19:45 that files a reminder for
            // the 16:45 one is a promise the feature cannot keep, and a badge
            // for a performance already over is worse. The next one is the
            // exception because it IS the one the reminder fires before, and
            // it is the badge already drawn apart from the others.
            return isNext ? (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDialogOpen(true);
                }}
              >
                {badge}
              </button>
            ) : (
              <span key={i}>{badge}</span>
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
