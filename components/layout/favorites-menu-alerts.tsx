'use client';

import { Fragment } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Bell, CalendarClock, Loader2, X } from 'lucide-react';
import { GroupHeading, MoreLine, Row, RowSkeletons } from './favorites-menu-rows';
import { usePushFollowsList } from '@/lib/push/use-push-follows-list';
import type { PushWriteError } from '@/lib/push/push-follows';
import { rideRowKey, showRowKey, usePushFollowRemoval } from '@/lib/push/use-push-follow-removal';
import { formatShowClock } from '@/lib/push/show-clock';
import { cn } from '@/lib/utils';

/**
 * The wait-time alerts and show reminders this browser has, as a group in the favorites band —
 * with a way to drop one without leaving the page.
 *
 * Until this existed the menu carried a link to `/alerts` and nothing else, so the only way to
 * see what was armed, or to disarm it, was to leave whatever page you were on. The band is where
 * the rest of a visitor's own state already lives.
 *
 * Three things it is built around:
 *
 * 1. **It is loaded on demand and rendered in the band only.** Everything under `lib/push` that
 *    talks to the network (`push-follows` → `push-registration`) would otherwise sit in the chunk
 *    every page's header ships, for a feature most visitors never touch — the same trade the
 *    planner makes with its panel. The panel imports this through `next/dynamic` behind a
 *    localStorage gate.
 * 2. **The 300 px sheet keeps the link instead.** Rows with a destructive control in a phone's
 *    whole navigation column is the wrong place to put an irreversible tap, and the overview page
 *    says all of this with room to spare.
 * 3. **A failed read is not an empty list.** The gate that mounts this component already
 *    established that this browser has something; rendering nothing after a failed fetch would
 *    say the alerts are gone.
 */

interface AlertRow {
  key: string;
  href: string;
  title: string;
  detail: string;
  icon: React.ReactNode;
  remove: () => void;
}

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
   * Why a removal did not go through, in the two sentences this surface can actually produce.
   *
   * `usePushErrorMessage` is the shared helper the dialogs and `/alerts` use, and it is
   * deliberately NOT used here: it reads `pushAlerts.pushErrors`, and this group renders in the
   * layout chrome, so importing it would serialize six more strings into every one of ~35,000
   * pages for a line almost nobody sees. Two keys in `pushAlerts.menu`, which the chrome already
   * carries, buy the distinction that matters instead.
   *
   * And it is the only one that matters: the DELETE path never registers a subscription, so the
   * `unavailable` causes the helper exists to separate cannot occur here — what is left is a rate
   * limit, where "please try again" is a lie in front of a limiter that will refuse the retry,
   * and everything else, where it is the right sentence.
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
      detail: `${alert.parkName} · ${t('threshold', { minutes: alert.thresholdMinutes })}`,
      icon: <Bell className="text-muted-foreground size-4" aria-hidden="true" />,
      remove: () => void removal.removeRide(alert.attractionId),
    })),
    ...(data?.showFollows ?? []).map((follow) => ({
      key: showRowKey(follow.showId),
      href: follow.path ?? '/alerts',
      title: follow.showName,
      detail: `${follow.parkName} · ${
        follow.startTime
          ? t('showAt', { time: formatShowClock(follow.startTime, follow.timezone, locale) ?? '—' })
          : t('showNextAny')
      }`,
      icon: <CalendarClock className="text-muted-foreground size-4" aria-hidden="true" />,
      remove: () => void removal.removeShow(follow.showId),
    })),
  ];

  /**
   * A number over an incomplete list is a claim the list cannot back.
   *
   * Only a read that answered both endpoints may put the server's count in the heading. While it
   * is on its way, or when one of the two refused, the number is what this browser believes it
   * has — over an error line saying the rest could not be read. Anything else tells somebody with
   * seven alerts that they have two, or none.
   *
   * `isError` is not "nothing in hand": a failed REFETCH leaves the last good `data` in place, so
   * what decides the error line is whether there is anything to fall back ON. A retained EMPTY
   * list under a failed read is the case both of these guard — it must not reach the `return
   * null` below, which is reserved for a read that really did find nothing.
   */
  const anything = rows.length > 0;
  const partial = data?.partial ?? false;
  // A request in flight outranks the verdict of the one before it — see the same three lines in
  // `AlertsOverview`. Without it, reopening the band after one failed read shows the error line
  // over an empty list for the whole of the next request.
  const loading = isFetching && !anything;
  const failed = !isFetching && isError && !anything;
  const incomplete = !isFetching && !failed && (partial || isError);
  const complete = !isFetching && !isError && !partial;
  const count = complete ? rows.length : expected;
  const shown = rows.slice(0, cap);

  /*
   * A complete read that found nothing means the local mirror is stale — the backend prunes a
   * subscription after repeated delivery failures and `localStorage` never hears about it. There
   * is nothing to show and nothing to say: a titled, empty "Alarme 0" column would be a claim
   * about a browser that has none. The band is then a slice wider than its groups, which is a
   * blank strip on the right rather than a wrong statement, and the panel's own "Meine Alarme"
   * link still leads to the page that can say it properly.
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
