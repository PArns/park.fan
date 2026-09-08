'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, BellRing, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import {
  fetchRideAlertsRemote,
  fetchShowFollowsRemote,
  removeRideAlert,
  unfollowShow,
  type RideAlertRemote,
  type ShowFollowRemote,
} from '@/lib/push/push-follows';

/**
 * Every ride alert and followed show this browser has, across every park —
 * the parkübergreifend counterpart to the per-park `RideAlertDialog`. Reads
 * straight from the server on mount, same "let me see everything" reasoning
 * as that dialog: this is not a hot render path, and the local mirror is a
 * cache for bells, not a source of truth for a page whose whole point is
 * showing the truth.
 */
export function AlertsOverview() {
  const t = useTranslations('pushAlerts.overview');
  const [rideAlerts, setRideAlerts] = useState<RideAlertRemote[] | null>(null);
  const [showFollows, setShowFollows] = useState<ShowFollowRemote[] | null>(null);
  const [removingRide, setRemovingRide] = useState<string | null>(null);
  const [removingShow, setRemovingShow] = useState<string | null>(null);

  useEffect(() => {
    void fetchRideAlertsRemote().then(setRideAlerts);
    void fetchShowFollowsRemote().then(setShowFollows);
  }, []);

  const loading = rideAlerts === null || showFollows === null;
  const empty = !loading && rideAlerts.length === 0 && showFollows.length === 0;

  const handleRemoveRide = async (attractionId: string) => {
    setRemovingRide(attractionId);
    await removeRideAlert(attractionId);
    setRideAlerts((current) => (current ?? []).filter((a) => a.attractionId !== attractionId));
    setRemovingRide(null);
  };

  const handleRemoveShow = async (showId: string) => {
    setRemovingShow(showId);
    await unfollowShow(showId);
    setShowFollows((current) => (current ?? []).filter((s) => s.showId !== showId));
    setRemovingShow(null);
  };

  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-12 text-sm">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        {t('loading')}
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
      {rideAlerts.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold">
            {t('rideAlertsTitle', { count: rideAlerts.length })}
          </h2>
          <ul className="flex flex-col gap-2">
            {rideAlerts.map((alert) => (
              <li
                key={alert.attractionId}
                className="border-border/60 flex items-center justify-between gap-3 rounded-md border px-4 py-3"
              >
                <div className="min-w-0 flex-1">
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

      {showFollows.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <BellRing className="size-4 shrink-0" aria-hidden="true" />
            {t('showFollowsTitle', { count: showFollows.length })}
          </h2>
          <ul className="flex flex-col gap-2">
            {showFollows.map((follow) => (
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
                  <p className="text-muted-foreground text-xs">{follow.parkName}</p>
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
