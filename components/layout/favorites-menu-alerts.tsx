'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Bell, CalendarClock, Loader2, X } from 'lucide-react';
import { GroupHeading, MoreLine, Row, RowSkeletons } from './favorites-menu-rows';
import { removeRideAlert, unfollowShow } from '@/lib/push/push-follows';
import {
  PUSH_FOLLOWS_QUERY_KEY,
  usePushFollowsList,
  type PushFollowsList,
} from '@/lib/push/use-push-follows-list';
import { trackRideAlertRemoved, trackShowFollowRemove } from '@/lib/analytics/umami';
import { formatTime } from '@/lib/utils/intl-format';

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
  remove: () => Promise<void>;
}

export function FavoritesMenuAlerts({
  open,
  cap,
  expected,
}: {
  open: boolean;
  /** Rows before the rest goes behind the "+N" line. */
  cap: number;
  /** How many rows to reserve while loading, from the local mirror — see `countPushFollowsLocal`. */
  expected: number;
}) {
  const t = useTranslations('pushAlerts.menu');
  const tFavorites = useTranslations('favorites');
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { data, isPending, isError } = usePushFollowsList({ enabled: open });
  const [removing, setRemoving] = useState<string | null>(null);

  // Same helper `LocalTime` calls, so a performance reads here exactly as it does on the show's
  // own card — and in the PARK's zone, which is the clock the park posts its times in.
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

  /**
   * The cache is the list. Editing it after the DELETE has resolved is what keeps a removal from
   * racing a refetch: `removeRideAlert` writes the local mirror first and only then calls the
   * API, so anything keyed on that mirror would ask the server for the row again while the
   * deletion was still in flight.
   */
  const drop = async (
    key: string,
    remove: () => Promise<void>,
    next: (l: PushFollowsList) => PushFollowsList
  ) => {
    setRemoving(key);
    await remove();
    queryClient.setQueryData<PushFollowsList>(PUSH_FOLLOWS_QUERY_KEY, (previous) =>
      previous ? next(previous) : previous
    );
    setRemoving(null);
  };

  const rows: AlertRow[] = [
    ...(data?.rideAlerts ?? []).map((alert) => ({
      key: `ride:${alert.attractionId}`,
      // A ride whose path the API could not resolve (retired, or a slug that moved) still has a
      // home: the overview page, which is where the rest of this group's rows lead anyway.
      href: alert.path ?? '/alerts',
      title: alert.attractionName,
      detail: `${alert.parkName} · ${t('threshold', { minutes: alert.thresholdMinutes })}`,
      icon: <Bell className="text-muted-foreground size-4" aria-hidden="true" />,
      remove: () =>
        drop(
          `ride:${alert.attractionId}`,
          async () => {
            await removeRideAlert(alert.attractionId);
            trackRideAlertRemoved();
          },
          (list) => ({
            ...list,
            rideAlerts: list.rideAlerts.filter((a) => a.attractionId !== alert.attractionId),
          })
        ),
    })),
    ...(data?.showFollows ?? []).map((follow) => ({
      key: `show:${follow.showId}`,
      href: follow.path ?? '/alerts',
      title: follow.showName,
      detail: `${follow.parkName} · ${
        follow.startTime
          ? t('showAt', { time: showClock(follow.startTime, follow.timezone) ?? '—' })
          : t('showNextAny')
      }`,
      icon: <CalendarClock className="text-muted-foreground size-4" aria-hidden="true" />,
      remove: () =>
        drop(
          `show:${follow.showId}`,
          async () => {
            await unfollowShow(follow.showId);
            trackShowFollowRemove();
          },
          (list) => ({
            ...list,
            showFollows: list.showFollows.filter((s) => s.showId !== follow.showId),
          })
        ),
    })),
  ];

  // While loading, the count the mirror knows; afterwards the count the server answered. The
  // heading is the one number in this group that must not wait for the request.
  const count = isPending ? expected : rows.length;
  const shown = rows.slice(0, cap);

  return (
    <div data-menu-stagger className="min-w-0">
      <GroupHeading title={t('title')} count={count} />
      {(isError || data?.partial) && (
        <p className="text-destructive mb-2 text-xs">{t('loadError')}</p>
      )}
      <ul className="space-y-px">
        {isPending ? (
          <RowSkeletons count={expected} />
        ) : (
          <>
            {shown.map((row) => (
              <Row
                key={row.key}
                href={row.href}
                title={row.title}
                subtitle={row.detail}
                leading={row.icon}
                action={
                  <button
                    type="button"
                    onClick={() => void row.remove()}
                    disabled={removing === row.key}
                    aria-label={t('remove', { name: row.title })}
                    // 32 px rather than the 44 px phone tier the button scale documents: this
                    // group is drawn in the band only, and the band needs a 1024 px header
                    // before its trigger is even in the row.
                    className="text-muted-foreground hover:text-destructive hover:bg-muted/60 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-default disabled:opacity-50"
                  >
                    {removing === row.key ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <X className="size-3.5" aria-hidden="true" />
                    )}
                  </button>
                }
              />
            ))}
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
