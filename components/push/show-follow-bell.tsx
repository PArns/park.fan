'use client';

import { useCallback, useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { showFollowMatchesLocal } from '@/lib/push/push-follows-store';
import { useLocalPushFollowsValue } from '@/lib/push/use-local-push-follows-value';
import { useMinuteNowDate } from '@/lib/hooks/use-minute-now';
import { ShowFollowDialog } from '@/components/push/show-follow-dialog';
import { SHOW_FOLLOW_MIN_LEAD_MIN } from '@/lib/push/show-lead';

interface ShowFollowBellProps {
  showId: string;
  showName?: string;
  className?: string;
  /** Where this bell sits — the show's own card, or a row in the park overview. */
  source: 'card' | 'panel';
  /**
   * Today's performances, ISO start times, in any order. Which is next is worked out here, because
   * the callers render statically cached pages and only the visitor's clock can answer it. With
   * `startTime` set this is still the whole day, which the dialog needs; it does not decide
   * whether the bell is drawn.
   */
  showtimes?: Array<{ startTime: string }> | null;
  /**
   * The one performance this bell is about, as a full ISO instant, for a bell beside a clock time
   * (the park panel's rows). Omitted is the open-ended follow, "whichever performance is next",
   * which is what a show card's corner bell means.
   */
  startTime?: string | null;
  /**
   * The park's zone, for the clock the dialog prints. Without it `LocalTime` falls back to the
   * visitor's zone and announces a performance hours off.
   */
  timezone?: string;
}

/**
 * "Notify me 30 minutes before this show starts", in the same corner as `FavoriteStar` and
 * hydration-safe the same way. It opens `ShowFollowDialog` rather than toggling in place, so the
 * visitor learns which show, when, and why a write failed, which a corner icon has no room to say.
 */
export function ShowFollowBell({
  showId,
  showName,
  className,
  source,
  showtimes,
  startTime,
  timezone,
}: ShowFollowBellProps) {
  // The clock has to come from the browser, not the render: these pages are
  // statically cached, so a server-side "minutes from now" would be the
  // moment the page was built. `null` until mount, which is also what keeps
  // the first paint identical to the server's.
  const browserNow = useMinuteNowDate();
  // Read-only here: the dialog owns the write, and the store's own change
  // event is what brings the new state back to every bell on the page.
  // Scoped to this bell's own performance where it has one: the panel lists an
  // hourly show once per showtime, and one reminder can only be about one of
  // them, so only that row's bell is lit.
  const [following] = useLocalPushFollowsValue(
    false,
    () => showFollowMatchesLocal(showId, startTime),
    [showId, startTime]
  );
  const [open, setOpen] = useState(false);
  // Mounted on the first press and kept, so the close animation still plays — the same shape as
  // `RideAlertBell`. Until then the dialog's clock subscription and its two local-store readers do
  // not run once per bell (one per show card and one per showtime row in the today panel).
  const [dialogMounted, setDialogMounted] = useState(false);
  const t = useTranslations('pushAlerts.showBell');

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDialogMounted(true);
    setOpen(true);
  }, []);

  const label = following
    ? t('following', { name: showName ?? '' })
    : t('follow', { name: showName ?? '' });

  // Drawn until the browser's clock says otherwise, so the first paint matches the server. Hidden
  // when no performance is left far enough ahead to warn about; a bell already on stays, as the
  // only way to switch it off. A bell naming one performance asks only about that one.
  const leadCandidates = startTime ? [startTime] : (showtimes ?? []).map((s) => s.startTime);
  // Not while its dialog is open: hiding the bell would take the dialog down with it.
  if (!following && !open && browserNow && leadCandidates.length > 0) {
    const nowMs = browserNow.getTime();
    const nextStartMs = leadCandidates
      .map((iso) => new Date(iso).getTime())
      .filter((ms) => Number.isFinite(ms) && ms >= nowMs)
      .sort((a, b) => a - b)[0];
    const noLeadLeft =
      nextStartMs === undefined || nextStartMs - nowMs < SHOW_FOLLOW_MIN_LEAD_MIN * 60_000;
    if (noLeadLeft) return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'relative z-10 flex items-center justify-center transition-all hover:scale-110',
          'focus:ring-primary focus:ring-2 focus:ring-offset-2 focus:outline-none',
          'disabled:pointer-events-none disabled:opacity-60',
          // The same 44 px hit area over a smaller visual box as FavoriteStar; see that component
          // for why.
          'max-sm:after:absolute max-sm:after:top-1/2 max-sm:after:left-1/2 max-sm:after:h-11',
          'max-sm:after:w-11 max-sm:after:-translate-x-1/2 max-sm:after:-translate-y-1/2',
          'max-sm:after:content-[""]',
          className
        )}
        aria-label={label}
        aria-pressed={following}
        title={label}
      >
        {following ? (
          <BellRing className="h-4 w-4 fill-amber-400/30 text-amber-500" />
        ) : (
          <Bell className="text-muted-foreground h-4 w-4" />
        )}
      </button>
      {dialogMounted && (
        <ShowFollowDialog
          open={open}
          onOpenChange={setOpen}
          showId={showId}
          showName={showName ?? ''}
          showtimes={showtimes}
          startTime={startTime}
          timezone={timezone}
          source={source}
        />
      )}
    </>
  );
}
