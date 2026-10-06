'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Bell, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { isReopenAlert } from '@/lib/push/ride-alert-picker';
import { formatShowClock } from '@/lib/push/show-clock';
import { usePushErrorMessage } from '@/components/push/use-push-error-message';
import { usePushFollowsList } from '@/lib/push/use-push-follows-list';
import { rideRowKey, showRowKey, usePushFollowRemoval } from '@/lib/push/use-push-follow-removal';

/**
 * Every ride alert and followed show this browser has, across every park, read straight from the
 * server: the local mirror is a cache for bells, not the truth for a page that exists to show it.
 * The read and the removal share the header band's query (`usePushFollowsList`), so a removal in
 * either place updates both.
 */
export function AlertsOverview() {
  const t = useTranslations('pushAlerts.overview');
  // `formatShowClock` rather than `LocalTime`: the sentence wraps the clock time, so it goes
  // through `t()` as a string. Same `formatTime` underneath.
  const locale = useLocale();
  // A failed fetch must not render as the "nothing set up yet" state, which reads as "your alerts
  // are gone". `isError` is both endpoints refusing, `partial` one of them.
  const { data, isFetching, isError } = usePushFollowsList({ enabled: true });
  /**
   * Shared with the header band's alerts group, so one rule decides when a row leaves: a removal
   * the API refused leaves the row and says so under it.
   */
  const removal = usePushFollowRemoval();
  const pushErrorMessage = usePushErrorMessage();

  const rideAlertList = data?.rideAlerts ?? [];
  const showFollowList = data?.showFollows ?? [];
  /*
   * A failed refetch keeps the last good `data`, so the error block depends on whether there is
   * anything to fall back on: a correct list one read old beats an error block, but a retained
   * empty list under a failed read must not say "nothing set up yet".
   */
  const anything = rideAlertList.length + showFollowList.length > 0;
  const partial = data?.partial ?? false;
  // A request in flight outranks the verdict of the one before it: the query is shared with the
  // header menu, so a failure there would otherwise show the error block while this page's own
  // request is still on its way.
  const loading = isFetching && !anything;
  const bothFailed = !isFetching && isError && !anything;
  /** One endpoint refused, or the last read did while an older answer still stands. */
  const incomplete = !isFetching && !bothFailed && (partial || isError);
  const empty = !isFetching && !isError && !partial && !anything;

  /**
   * Why one row's removal did not go through, beside that row. `role="alert"` because it appears
   * in response to a press and nothing moves the focus to it.
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
                    {alert.parkName} ·{' '}
                    {isReopenAlert(alert) || alert.thresholdMinutes === null
                      ? t('reopenLabel')
                      : t('thresholdLabel', { minutes: alert.thresholdMinutes })}
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
          {/* No icon, matching the ride-alert heading above: the two are one pair of section
              labels. */}
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
                  {/* Which performance, in the park's clock; a follow with no chosen performance
                      says so rather than showing a time it does not have. */}
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
