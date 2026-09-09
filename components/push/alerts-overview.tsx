'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Bell, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatTime } from '@/lib/utils/intl-format';
import { trackRideAlertRemoved, trackShowFollowRemove } from '@/lib/analytics/umami';
import { removeRideAlert, unfollowShow } from '@/lib/push/push-follows';
import {
  PUSH_FOLLOWS_QUERY_KEY,
  usePushFollowsList,
  type PushFollowsList,
} from '@/lib/push/use-push-follows-list';

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
  // `formatTime` directly rather than the `LocalTime` component every other
  // surface uses: the sentence wraps the clock time ("um 19:10 Uhr"), so it
  // has to go through `t()` as a string. Same helper `LocalTime` itself
  // calls, so the two render identically.
  const locale = useLocale();
  const showClock = (iso: string, timezone: string | null) => {
    try {
      return formatTime(new Date(iso), locale, {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone ?? undefined,
      });
    } catch {
      return null;
    }
  };
  // A failure is its own state rather than folding into `null`: this page's
  // whole point is showing the truth, so a fetch that failed must not render
  // as the same "nothing set up yet" empty state a browser with zero alerts
  // gets — that reads as "your alerts are gone" to someone who has five.
  // `isError` is both endpoints refusing, `partial` is one of them.
  const queryClient = useQueryClient();
  const { data, isPending: loading, isError: bothFailed } = usePushFollowsList({ enabled: true });
  const [removingRide, setRemovingRide] = useState<string | null>(null);
  const [removingShow, setRemovingShow] = useState<string | null>(null);

  const rideAlertList = data?.rideAlerts ?? [];
  const showFollowList = data?.showFollows ?? [];
  const onlyOneFailed = !bothFailed && (data?.partial ?? false);
  const empty =
    !loading &&
    !bothFailed &&
    !onlyOneFailed &&
    rideAlertList.length === 0 &&
    showFollowList.length === 0;

  const patch = (next: (list: PushFollowsList) => PushFollowsList) =>
    queryClient.setQueryData<PushFollowsList>(PUSH_FOLLOWS_QUERY_KEY, (previous) =>
      previous ? next(previous) : previous
    );

  const handleRemoveRide = async (attractionId: string) => {
    setRemovingRide(attractionId);
    await removeRideAlert(attractionId);
    patch((list) => ({
      ...list,
      rideAlerts: list.rideAlerts.filter((a) => a.attractionId !== attractionId),
    }));
    setRemovingRide(null);
    trackRideAlertRemoved();
  };

  const handleRemoveShow = async (showId: string) => {
    setRemovingShow(showId);
    await unfollowShow(showId);
    patch((list) => ({
      ...list,
      showFollows: list.showFollows.filter((s) => s.showId !== showId),
    }));
    setRemovingShow(null);
    trackShowFollowRemove();
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
      {onlyOneFailed && <p className="text-destructive text-xs">{t('loadError')}</p>}
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
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveRide(alert.attractionId)}
                  disabled={removingRide === alert.attractionId}
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
                        time: showClock(follow.startTime, follow.timezone) ?? '—',
                      }) as string)
                    ) : (
                      <span>{t('showNextAny')}</span>
                    )}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveShow(follow.showId)}
                  disabled={removingShow === follow.showId}
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
