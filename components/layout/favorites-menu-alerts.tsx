'use client';

import { Fragment } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Bell, CalendarClock, Loader2, X } from 'lucide-react';
import { GroupHeading, MoreLine, Row, RowSkeletons } from './favorites-menu-rows';
import { usePushFollowsList } from '@/lib/push/use-push-follows-list';
import type { PushWriteError } from '@/lib/push/push-follows';
import { rideRowKey, showRowKey, usePushFollowRemoval } from '@/lib/push/use-push-follow-removal';
import { formatShowClock } from '@/lib/push/show-clock';
import { isReopenAlert } from '@/lib/push/ride-alert-picker';
import { cn } from '@/lib/utils';

/**
 * The wait-time alerts and show reminders this browser has, as a group in the favorites band, with
 * a way to drop one without leaving the page. Loaded on demand and drawn in the band only: the push
 * code does not belong in every page's header chunk, and the 300 px sheet keeps the link rather
 * than an irreversible tap in the phone's navigation. A failed read is shown as one, never as an
 * empty list.
 */

interface AlertRow {
  key: string;
  href: string;
  title: string;
  detail: string;
  /** Kept out of `detail`'s truncate — see `Row`'s `subtitleValue`. */
  value: string | null;
  icon: React.ReactNode;
  remove: () => void;
}

/**
 * Group in the header's favourites band listing this browser's wait-time alerts and show reminders,
 * each with a button to remove it. Loaded lazily; fetches only while the band is open.
 */
export function FavoritesMenuAlerts({
  open,
  cap,
  expected,
  className,
  style,
}: {
  open: boolean;
  /** Rows before the rest goes behind the "+N" line. */
  cap: number;
  /** How many rows to reserve while loading, from the local mirror — see `countPushFollowsLocal`. */
  expected: number;
  /**
   * The group's own box. It belongs to this component and not to a wrapper around it, because
   * this component is allowed to render NOTHING — see the empty case below — and a wrapper the
   * panel drew would then be an empty flex item holding a slice of the band open.
   */
  className?: string;
  style?: React.CSSProperties;
}) {
  const t = useTranslations('pushAlerts.menu');
  const tFavorites = useTranslations('favorites');
  const locale = useLocale();
  const { data, isFetching, isError } = usePushFollowsList({ enabled: open });
  /**
   * Shared with `AlertsOverview` — the two surfaces list the same rows out of the same query
   * cache, so what it takes for one of them to leave is decided in one place.
   */
  const removal = usePushFollowRemoval();

  /**
   * Why a removal did not go through. Not `usePushErrorMessage`: it reads `pushAlerts.pushErrors`,
   * which would ship in the chrome of every page. The DELETE path never registers, so only a rate
   * limit needs its own sentence.
   */
  const removeErrorMessage = (error: PushWriteError) =>
    error.reason === 'rate-limited'
      ? t('removeRateLimited', { seconds: error.retryAfterSeconds })
      : t('removeError');

  const rows: AlertRow[] = [
    ...(data?.rideAlerts ?? []).map((alert) => ({
      key: rideRowKey(alert.attractionId),
      // A ride whose path the API could not resolve (retired, or a slug that moved) still has a
      // home: the overview page, which is where the rest of this group's rows lead anyway.
      href: alert.path ?? '/alerts',
      title: alert.attractionName,
      // The threshold tells two alerts in one park apart, so it stays whole and the park name gives
      // way.
      detail: alert.parkName,
      value:
        isReopenAlert(alert) || alert.thresholdMinutes === null
          ? t('reopen')
          : t('threshold', { minutes: alert.thresholdMinutes }),
      icon: <Bell className="text-muted-foreground size-4" aria-hidden="true" />,
      remove: () => void removal.removeRide(alert.attractionId),
    })),
    ...(data?.showFollows ?? []).map((follow) => ({
      key: showRowKey(follow.showId),
      href: follow.path ?? '/alerts',
      title: follow.showName,
      // A set time is a value like a threshold. "Next performance" is not, and in German it is
      // wider than the column on its own, so it stays in the truncating half.
      ...(follow.startTime
        ? {
            detail: follow.parkName,
            value: t('showAt', {
              time: formatShowClock(follow.startTime, follow.timezone, locale) ?? '—',
            }),
          }
        : { detail: `${follow.parkName} · ${t('showNextAny')}`, value: null }),
      icon: <CalendarClock className="text-muted-foreground size-4" aria-hidden="true" />,
      remove: () => void removal.removeShow(follow.showId),
    })),
  ];

  /**
   * A number over an incomplete list is a claim the list cannot back. Only a read that answered
   * both endpoints puts the server's count in the heading; otherwise it is what this browser
   * believes, over an error line. A failed refetch keeps the last good `data`, so the error line
   * depends on whether there is anything to fall back on, and a retained empty list must not reach
   * the `return null` below.
   */
  const anything = rows.length > 0;
  const partial = data?.partial ?? false;
  // A request in flight outranks the verdict of the one before it, as in `AlertsOverview`, or a
  // reopened band shows the last error over an empty list for the whole next request.
  const loading = isFetching && !anything;
  const failed = !isFetching && isError && !anything;
  const incomplete = !isFetching && !failed && (partial || isError);
  const complete = !isFetching && !isError && !partial;
  const count = complete ? rows.length : expected;
  const shown = rows.slice(0, cap);

  /*
   * A complete read that found nothing means the local mirror is stale: the backend prunes a
   * failing subscription and `localStorage` never hears of it. An empty "Alarme 0" column would be
   * a wrong claim, and the panel's "Meine Alarme" link still leads to the page.
   */
  if (complete && rows.length === 0) return null;

  return (
    <div data-menu-stagger className={cn('min-w-0', className)} style={style}>
      <GroupHeading title={t('title')} count={count} />
      {(failed || incomplete) && <p className="text-destructive mb-2 text-xs">{t('loadError')}</p>}
      <ul className="space-y-px">
        {loading ? (
          <RowSkeletons count={expected} max={cap} />
        ) : (
          <>
            {shown.map((row) => {
              const removeError = removal.errorFor(row.key);
              return (
                <Fragment key={row.key}>
                  <Row
                    href={row.href}
                    title={row.title}
                    subtitle={row.detail}
                    subtitleValue={row.value}
                    leading={row.icon}
                    action={
                      <button
                        type="button"
                        onClick={row.remove}
                        disabled={removal.isRemoving(row.key)}
                        aria-label={t('remove', { name: row.title })}
                        // 32 px rather than the 44 px phone tier the button scale documents: this
                        // group is drawn in the band only, and the band needs a 1024 px header
                        // before its trigger is even in the row.
                        className="text-muted-foreground hover:text-destructive hover:bg-muted/60 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-default disabled:opacity-50"
                      >
                        {removal.isRemoving(row.key) ? (
                          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <X className="size-3.5" aria-hidden="true" />
                        )}
                      </button>
                    }
                  />
                  {/* Under the row it belongs to, not at the top of the group: the visitor pressed
                    one X and needs to know which alert is still armed. `role="alert"` goes on the
                    paragraph and never on the `<li>`, which would replace its implicit `listitem`
                    role and leave this `<ul>` holding a child that is not a list item. */}
                  {removeError && (
                    <li className="px-2 pb-1">
                      <p role="alert" className="text-destructive text-xs leading-snug">
                        {removeErrorMessage(removeError)}
                      </p>
                    </li>
                  )}
                </Fragment>
              );
            })}
            <MoreLine
              hidden={rows.length - shown.length}
              label={(n) => tFavorites('more', { count: n })}
              href="/alerts"
            />
          </>
        )}
      </ul>
    </div>
  );
}
