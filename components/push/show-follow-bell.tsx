'use client';

import { useCallback, useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { isShowFollowedLocal } from '@/lib/push/push-follows-store';
import { useLocalPushFollowsValue } from '@/lib/push/use-local-push-follows-value';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { ShowFollowDialog } from '@/components/push/show-follow-dialog';

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
   * Omitted entirely, the bell behaves as it always did.
   */
  showtimes?: Array<{ startTime: string }> | null;
}

/**
 * Below this many minutes to the next performance a reminder is pointless:
 * the notification would land while the visitor is already reading it on the
 * schedule, or after the show has started. The API sends its reminder about
 * half an hour ahead and, for a show followed later than that, ten minutes
 * ahead — under ten there is no lead left to give.
 */
export const SHOW_FOLLOW_MIN_LEAD_MIN = 10;

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
}: ShowFollowBellProps) {
  // The clock has to come from the browser, not the render: these pages are
  // statically cached, so a server-side "minutes from now" would be the
  // moment the page was built. `null` until mount, which is also what keeps
  // the first paint identical to the server's.
  const browserNow = useBrowserNow(30_000);
  // Read-only here: the dialog owns the write, and the store's own change
  // event is what brings the new state back to every bell on the page.
  const [following] = useLocalPushFollowsValue(false, () => isShowFollowedLocal(showId), [showId]);
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
  if (!following && browserNow && showtimes && showtimes.length > 0) {
    const nowMs = browserNow.getTime();
    const nextStartMs = showtimes
      .map((s) => new Date(s.startTime).getTime())
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
        source={source}
      />
    </>
  );
}
