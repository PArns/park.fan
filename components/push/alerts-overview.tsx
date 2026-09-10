'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Bell, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatShowClock } from '@/lib/push/show-clock';
import { usePushErrorMessage } from '@/components/push/use-push-error-message';
import { usePushFollowsList } from '@/lib/push/use-push-follows-list';
import { rideRowKey, showRowKey, usePushFollowRemoval } from '@/lib/push/use-push-follow-removal';

/**
 * Every ride alert and followed show this browser has, across every park —
 * the parkübergreifend counterpart to the per-park `RideAlertDialog`. Reads
 * straight from the server, same "let me see everything" reasoning as that
 * dialog: this is not a hot render path, and the local mirror is a cache for
 * bells, not a source of truth for a page whose whole point is showing the
 * truth.
 *
 * The read and the removal go through the same query the header's favorites
 * band uses (`usePushFollowsList`). They used to be two implementations of
 * one list, which showed: removing an alert in the header menu while standing
 * on this page left the row sitting here until a reload, because this page
 * held its answer in a `useState` nothing else could reach.
 */
export function AlertsOverview() {
  const t = useTranslations('pushAlerts.overview');
  // `formatShowClock` rather than the `LocalTime` component every other
  // surface uses: the sentence wraps the clock time ("um 19:10 Uhr"), so it
  // has to go through `t()` as a string. Same `formatTime` underneath, so the
  // two render identically.
  const locale = useLocale();
  // A failure is its own state rather than folding into `null`: this page's
  // whole point is showing the truth, so a fetch that failed must not render
  // as the same "nothing set up yet" empty state a browser with zero alerts
  // gets — that reads as "your alerts are gone" to someone who has five.
  // `isError` is both endpoints refusing, `partial` is one of them.
  const { data, isFetching, isError } = usePushFollowsList({ enabled: true });
  /**
   * Shared with the header band's alerts group — same rows, same query cache, so one rule
   * decides what it takes for a row to leave. A removal that the API refused leaves the row
   * where it is and says so under it, which is the whole reason this page can be trusted: an
   * alert that disappears here has really been switched off.
   */
  const removal = usePushFollowRemoval();
  const pushErrorMessage = usePushErrorMessage();

  const rideAlertList = data?.rideAlerts ?? [];
  const showFollowList = data?.showFollows ?? [];
  /*
   * Three states, and the middle one is the whole reason this is not two booleans.
   *
   * TanStack Query keeps the last good `data` when a REFETCH fails, so `isError` does not mean
   * "nothing in hand": replacing a correct list of five alerts with the full-page "couldn't load"
   * block because a background refresh hiccupped is worse than showing that list one read old.
   * But a retained EMPTY list is not an answer either — a failed read over it would otherwise
   * render "nothing set up yet" to a browser with five alerts, which is the exact sentence this
   * page must never produce. So what decides the error block is whether there is anything to
   * fall back ON, not whether `data` happens to be defined.
   */
  const anything = rideAlertList.length + showFollowList.length > 0;
  const partial = data?.partial ?? false;
  // A request in flight outranks the verdict of the one before it. `isError` survives a failure
  // until the NEXT read settles, and this query is shared with the header menu — so without
  // this, arriving on /alerts after the menu's read failed shows the full-page error block
  // while the page's own request is still on its way.
  const loading = isFetching && !anything;
  const bothFailed = !isFetching && isError && !anything;
  /** One endpoint refused, or the last read did while an older answer still stands. */
  const incomplete = !isFetching && !bothFailed && (partial || isError);
  const empty = !isFetching && !isError && !partial && !anything;

  /**
   * Why one row's removal did not go through, beside that row.
   *
   * At the top of the page it would be a sentence about a list; here it names the alert that is
   * still armed. `role="alert"` because it appears in response to a press and nothing moves the
   * focus to it.
   */
  const removalError = (key: string) => {
    const error = removal.errorFor(key);
    if (!error) return null;
    return (
      <p role="alert" className="text-destructive mt-1 text-xs leading-snug">
        {pushErrorMessage(error)}
      </p>
    );
  };

  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-12 text-sm">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        {t('loading')}
      </div>
    );
  }

  if (bothFailed) {
    return (
      <div className="border-destructive/40 rounded-lg border border-dashed px-6 py-12 text-center">
        <p className="text-destructive mx-auto max-w-sm text-sm leading-relaxed">
          {t('loadError')}
        </p>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="border-border/60 rounded-lg border border-dashed px-6 py-12 text-center">
        <Bell className="text-muted-foreground mx-auto mb-3 size-8" aria-hidden="true" />
        <p className="text-muted-foreground mx-auto max-w-sm text-sm leading-relaxed">
          {t('emptyBody')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {incomplete && <p className="text-destructive text-xs">{t('loadError')}</p>}
      {rideAlertList.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold">
            {t('rideAlertsTitle', { count: rideAlertList.length })}
          </h2>
          <ul className="flex flex-col gap-2">
            {rideAlertList.map((alert) => (
              <li
                key={alert.attractionId}
                className="border-border/60 flex items-center justify-between gap-3 rounded-md border px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {alert.path ? (
                      <Link
                        href={alert.path}
                        className="hover:text-primary truncate text-sm font-medium hover:underline"
                      >
                        {alert.attractionName}
                      </Link>
                    ) : (
                      <p className="truncate text-sm font-medium">{alert.attractionName}</p>
                    )}
                    {/* Accepted at write time regardless (a visitor may alert on a
                        winter ride ahead of a trip) — surfaced here so a dormant
                        alert does not look identical to a live one. */}
                    {alert.outOfSeason && (
                      <Badge variant="secondary" className="shrink-0">
                        {t('outOfSeason')}
                      </Badge>
                    )}
                    {alert.retired && (
                      <Badge variant="secondary" className="shrink-0">
                        {t('retired')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {alert.parkName} · {t('thresholdLabel', { minutes: alert.thresholdMinutes })}
                  </p>
                  {removalError(rideRowKey(alert.attractionId))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void removal.removeRide(alert.attractionId)}
                  disabled={removal.isRemoving(rideRowKey(alert.attractionId))}
                >
                  {t('remove')}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {showFollowList.length > 0 && (
        <section>
          {/* No icon, matching the ride-alert heading above it. These two are
              one pair of section labels and only one of them had a glyph, so
              the page read as if the show list were a different KIND of thing
              rather than the second half of the same list. The bell the page
              needs is the one in its own header. */}
          <h2 className="mb-3 text-sm font-semibold">
            {t('showFollowsTitle', { count: showFollowList.length })}
          </h2>
          <ul className="flex flex-col gap-2">
            {showFollowList.map((follow) => (
              <li
                key={follow.showId}
                className="border-border/60 flex items-center justify-between gap-3 rounded-md border px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  {follow.path ? (
                    <Link
                      href={follow.path}
                      className="hover:text-primary truncate text-sm font-medium hover:underline"
                    >
                      {follow.showName}
                    </Link>
                  ) : (
                    <p className="truncate text-sm font-medium">{follow.showName}</p>
                  )}
                  {/* Which performance, in the PARK's clock — the ride row
                      beside this one says "unter 50 Min." and this one said
                      nothing but the park, so a show reminder read as if it
                      had no setting at all. A follow with no chosen
                      performance says so rather than showing a time it does
                      not have. */}
                  <p className="text-muted-foreground text-xs">
                    {follow.parkName} ·{' '}
                    {follow.startTime ? (
                      (t('showAt', {
                        time: formatShowClock(follow.startTime, follow.timezone, locale) ?? '—',
                      }) as string)
                    ) : (
                      <span>{t('showNextAny')}</span>
                    )}
                  </p>
                  {removalError(showRowKey(follow.showId))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void removal.removeShow(follow.showId)}
                  disabled={removal.isRemoving(showRowKey(follow.showId))}
                >
                  {t('remove')}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
