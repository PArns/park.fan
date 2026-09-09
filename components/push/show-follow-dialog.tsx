'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, BellRing, Clock } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LocalTime } from '@/components/ui/local-time';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { trackShowFollowAdd, trackShowFollowRemove } from '@/lib/analytics/umami';
import { followShow, unfollowShow, type PushWriteError } from '@/lib/push/push-follows';
import {
  getShowFollowLocal,
  isSameInstant,
  showFollowMatchesLocal,
} from '@/lib/push/push-follows-store';
import { useLocalPushFollowsValue } from '@/lib/push/use-local-push-follows-value';
import { usePushErrorMessage } from '@/components/push/use-push-error-message';
import { PushDialogHero } from '@/components/push/push-dialog-hero';
import { SHOW_LEAD_MIN } from '@/lib/push/show-lead';

interface ShowFollowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showId: string;
  showName: string;
  /** Today's performances, for naming the one the reminder is actually about. */
  showtimes?: Array<{ startTime: string }> | null;
  /** The park's zone, so the time reads as the park reads it, not as the visitor's phone does. */
  timezone?: string;
  /**
   * The performance the visitor tapped, as a full ISO instant. Omitted means
   * the open-ended follow — whichever performance is next — which is what a
   * card's corner bell files, since a bell names no time.
   */
  startTime?: string | null;
  /** Where this was opened from — the analytics property, see `trackShowFollowAdd`. */
  source?: 'card' | 'panel';
  /**
   * A failure that happened before this dialog opened — `ShowFollowBell`
   * hands its own over, because a corner icon has nowhere to put a sentence
   * and "it went red for two seconds" is not an explanation.
   */
  initialError?: PushWriteError | null;
}

/**
 * Every way of asking for a show reminder ends here: the corner bell, and a
 * tap on any showtime badge. The bell used to toggle the follow silently on
 * click, which left the one question a visitor actually has unanswered —
 * WHICH show did I just sign up for, and when is it? A dialog can name both;
 * a corner icon that quietly changes colour cannot.
 *
 * Which performance it names is the whole question, and there are three
 * answers in this order: the one that was tapped (`startTime`), the one this
 * browser has already pinned, and — only when neither exists — whichever
 * comes next, which is the open-ended follow a card's corner bell files.
 * Naming the next one over a pin was wrong in the one way that matters: the
 * API sends the pinned performance and the dialog was announcing another.
 *
 * One reminder per show, because that is what `show_follows` holds: it is
 * unique on (subscription, show) and its upsert overwrites `startTime`. So
 * arming a second performance MOVES the reminder, and the dialog says so
 * before the press rather than leaving it to be discovered.
 */
export function ShowFollowDialog({
  open,
  onOpenChange,
  showId,
  showName,
  showtimes,
  timezone,
  startTime,
  source = 'card',
  initialError = null,
}: ShowFollowDialogProps) {
  const t = useTranslations('pushAlerts.showDialog');
  const pushErrorMessage = usePushErrorMessage();
  const browserNow = useBrowserNow(30_000);
  // "Is the reminder this dialog is about already armed" — for a chosen
  // performance that is a question about that instant, not about the show.
  const [following, setFollowing] = useLocalPushFollowsValue(
    false,
    () => showFollowMatchesLocal(showId, startTime),
    [showId, startTime]
  );
  // The performance this browser's reminder for the show is pinned to, if it
  // named one at all. Read whatever this dialog was opened from: it is what
  // makes a corner bell able to say "19:10" instead of naming the next
  // performance, which is not the one that will be sent.
  const [armedStart] = useLocalPushFollowsValue<string | null>(
    null,
    () => getShowFollowLocal(showId)?.startTime ?? null,
    [showId]
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<PushWriteError | null>(null);
  // The bell's failure is shown until this dialog produces one of its own.
  const shownError = error ?? initialError;

  // Both outcomes close the dialog, the way `RideAlertQuickDialog` has always
  // closed on save: the press answered the only question this dialog asks, and
  // a form that stays open after succeeding reads as one that did not. Only a
  // FAILURE holds it open — that is when there is something left to read.
  const handleToggle = async () => {
    setPending(true);
    setError(null);
    if (following) {
      setFollowing(false);
      await unfollowShow(showId);
      setPending(false);
      trackShowFollowRemove();
      onOpenChange(false);
      return;
    }
    const result = await followShow(showId, startTime);
    setPending(false);
    if (result.ok) {
      setFollowing(true);
      trackShowFollowAdd(source);
      onOpenChange(false);
      return;
    }
    setError(result.error);
  };

  // Whether an instant is still ahead of the visitor's own clock. The mirror
  // is never swept, so an entry can name a performance that finished
  // yesterday — and `LocalTime` prints a clock time with no date, so an
  // expired one would read as tonight's.
  const isUpcoming = (iso: string) =>
    browserNow !== null && new Date(iso).getTime() >= browserNow.getTime();

  // The performance a reminder from THIS dialog would be about: the tapped
  // showtime, else the one this browser already pinned, else the next
  // performance that has not started — off the browser's clock rather than
  // the render's, since these pages are statically cached.
  const pinnedStart = armedStart && isUpcoming(armedStart) ? armedStart : null;
  // A follow that is already armed open-ended is about no single performance,
  // whichever bell was pressed to get here — so a bell beside 16:00 must not
  // report "chosen performance 16:00" for a reminder that will also come
  // before the 18:00 one. Only the press that ARMS one names one.
  const armedOpenEnded = following && armedStart === null;
  const chosenStart = armedOpenEnded ? null : (startTime ?? pinnedStart);
  const nextStart =
    chosenStart ??
    (browserNow
      ? (showtimes ?? [])
          .map((s) => s.startTime)
          .filter(isUpcoming)
          .sort()[0]
      : undefined);

  // What arming this dialog's performance would give up: a pin on a DIFFERENT
  // performance. The API keeps one row per (subscription, show) and overwrites
  // its `startTime`, so the visitor has to be told before pressing, not after.
  const replacedStart =
    startTime && pinnedStart && !isSameInstant(pinnedStart, startTime) ? pinnedStart : null;

  // Whether the reminder is still early enough for the usual window. Under
  // 25 minutes it is not: the API catches a follow made this late in its
  // second window instead, so the description has to say ten minutes rather
  // than promise a half hour it can no longer deliver for this performance.
  const late =
    browserNow !== null &&
    nextStart !== undefined &&
    new Date(nextStart).getTime() - browserNow.getTime() < SHOW_LEAD_MIN * 60_000;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <PushDialogHero
          icon={Bell}
          title={showName}
          description={chosenStart ? t('explainChosen') : t('explain', { show: showName })}
        >
          {late && (
            <p className="text-muted-foreground mt-1 text-xs leading-snug">{t('explainLate')}</p>
          )}
          {nextStart && (
            <p className="mt-2 flex items-center gap-1.5 text-xs">
              <Clock className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
              <span className="text-muted-foreground">
                {chosenStart ? t('chosenShowtime') : t('nextShowtime')}
              </span>
              <span className="font-semibold tabular-nums">
                <LocalTime time={nextStart} timeZone={timezone} />
              </span>
            </p>
          )}
          {replacedStart && !following && (
            <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
              <span>{t('replacesShowtime')}</span>
              <span className="font-semibold tabular-nums">
                <LocalTime time={replacedStart} timeZone={timezone} />
              </span>
            </p>
          )}
          {shownError && (
            <p className="text-destructive mt-2 text-xs leading-snug">
              {pushErrorMessage(shownError)}
            </p>
          )}
        </PushDialogHero>

        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3 sm:px-6">
          <Link href="/alerts" className="text-primary text-xs whitespace-nowrap hover:underline">
            {t('viewAll')}
          </Link>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              {t('close')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={following ? 'secondary' : 'default'}
              onClick={handleToggle}
              disabled={pending}
            >
              {following ? (
                <>
                  <BellRing className="size-3.5 shrink-0" aria-hidden="true" />
                  {t('unfollow')}
                </>
              ) : (
                <>
                  <Bell className="size-3.5 shrink-0" aria-hidden="true" />
                  {t('follow')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
