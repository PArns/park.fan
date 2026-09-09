'use client';

import { useCallback, useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { showFollowMatchesLocal } from '@/lib/push/push-follows-store';
import { useLocalPushFollowsValue } from '@/lib/push/use-local-push-follows-value';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { ShowFollowDialog } from '@/components/push/show-follow-dialog';
import { SHOW_FOLLOW_MIN_LEAD_MIN } from '@/lib/push/show-lead';

interface ShowFollowBellProps {
  showId: string;
  showName?: string;
  className?: string;
  /** Where this bell sits — the show's own card, or a row in the park overview. */
  source: 'card' | 'panel';
  /**
   * Today's performances, ISO start times, in any order. WHICH of them is
   * next is worked out here rather than by the caller, because the callers
   * are Server Components rendering statically cached pages: "the next one"
   * is a question only the visitor's own clock can answer, and the first
   * entry of the day stops being the answer the moment it has started.
   * Omitted entirely, the bell behaves as it always did. Where `startTime`
   * names this bell's own performance, this is still the show's whole day —
   * the dialog needs it to say which performance an open-ended reminder is
   * about, and it is not what decides whether this bell is drawn.
   */
  showtimes?: Array<{ startTime: string }> | null;
  /**
   * The ONE performance this bell is about, as a full ISO instant — for a
   * bell that sits beside a clock time rather than on a show as a whole.
   * The park panel's rows are one performance each, so a bell there that
   * files the open-ended follow arms every performance of that show while
   * the row it sits in names one of them.
   *
   * Omitted is the open-ended follow — "whichever performance is next" —
   * which is what a show card's corner bell means and what every caller of
   * this component meant before the prop existed.
   */
  startTime?: string | null;
  /**
   * The PARK's zone, for the clock the dialog prints. Not optional in
   * practice: without it `LocalTime` falls back to the visitor's own zone,
   * and a Universal Epic Universe show at 16:40 was announced to a German
   * reader as "Nächste Vorstellung 22:40" — six hours out, in the one line
   * the dialog exists to state.
   */
  timezone?: string;
}

/**
 * "Notify me 30 minutes before this show starts" — the same interaction
 * shape as `FavoriteStar` (hydration-safe: renders "off" on the server, a
 * mount-only effect reads the real state, a window event keeps every bell on
 * the page in sync with the one that was just clicked), sitting in the same
 * corner.
 *
 * It OPENS `ShowFollowDialog` rather than toggling the follow itself, the
 * same way `RideAlertBell` opens its own. Toggling in place answered none of
 * the questions a click raises — which show did I just subscribe to, when is
 * it on, and (when the write fails, which it does for every browser with
 * notifications blocked) why nothing happened. A corner icon has room for a
 * colour and nothing else.
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
  const browserNow = useBrowserNow(30_000);
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
  const t = useTranslations('pushAlerts.showBell');

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  }, []);

  const label = following
    ? t('following', { name: showName ?? '' })
    : t('follow', { name: showName ?? '' });

  // Drawn until the browser's own clock says otherwise, so the bell a visitor
  // sees on the first paint is the one the server sent. Nothing left today
  // (every performance is over) hides it for the same reason as one about to
  // start: there is no reminder left to give. A bell already switched ON
  // stays visible either way — it is the only way to switch it off again,
  // and hiding somebody's own control is worse than showing one with nothing
  // left to schedule.
  //
  // A bell that names ONE performance asks about that one and not about the
  // rest of the show's day: beside an 18:00 row, "is there still time to warn
  // somebody" is a question about 18:00, and answering it from the show's
  // whole list would keep a bell on a performance starting in four minutes.
  const leadCandidates = startTime ? [startTime] : (showtimes ?? []).map((s) => s.startTime);
  if (!following && browserNow && leadCandidates.length > 0) {
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
          // Same 44 px hit area over a smaller visual box as FavoriteStar — see
          // that component for the measured reasoning.
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
    </>
  );
}
