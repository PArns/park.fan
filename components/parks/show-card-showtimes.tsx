'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { LocalTime } from '@/components/ui/local-time';
import { ShowFollowDialog } from '@/components/push/show-follow-dialog';
import { SHOW_FOLLOW_MIN_LEAD_MIN } from '@/lib/push/show-lead';
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
 * Each badge opens `ShowFollowDialog` for its own performance: `ShowFollow`
 * on the API stores the chosen instant, so tapping 19:10 files a reminder for
 * 19:10 rather than for whichever performance happens to be next. A badge
 * already past, or one starting inside `SHOW_FOLLOW_MIN_LEAD_MIN`, is a
 * read-out instead — there is no reminder left to give for either.
 * `stopPropagation` keeps the click from also activating the card's own
 * `<Link>`, the same nested-interactive-element concern `RideAlertBell` has.
 */
export function ShowCardShowtimes({
  showtimes,
  timezone,
  showId,
  showName,
}: ShowCardShowtimesProps) {
  const tCommon = useTranslations('common');
  const [dialogOpen, setDialogOpen] = useState(false);
  // Which performance the tapped badge was for — handed to the dialog, and
  // from there to the API, so the reminder belongs to that one instant.
  const [chosen, setChosen] = useState<string | null>(null);

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

            // A badge opens the dialog for ITS OWN performance — the API
            // stores the chosen instant, so tapping 19:10 files a reminder
            // for 19:10 and not for whatever happens to be next. Two of them
            // cannot: one already over, and one starting too soon for a
            // reminder to beat it there.
            const leadMin = (showtimeDate.getTime() - today.getTime()) / 60_000;
            const canFollow = !isPast && leadMin >= SHOW_FOLLOW_MIN_LEAD_MIN;

            const badge = (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs transition-colors',
                  isPast && 'line-through opacity-40',
                  isNext &&
                    'border-status-operating/40 bg-status-operating/15 text-status-operating',
                  !isPast && !isNext && 'text-muted-foreground',
                  canFollow && 'cursor-pointer hover:bg-white/10'
                )}
              >
                <LocalTime time={showtime.startTime} timeZone={timezone} />
              </Badge>
            );

            return canFollow ? (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setChosen(showtime.startTime);
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
          startTime={chosen}
        />
      </>
    );
  }

  if (showtimes && showtimes.length > 0) {
    return <p className="text-muted-foreground mt-2 text-sm">{tCommon('noShowtimesToday')}</p>;
  }

  return null;
}
