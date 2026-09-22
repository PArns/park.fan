'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { LocateFixed, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InParkRideLists, splitInParkRides } from '@/components/parks/nearby-in-park-view';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { resolveInParkBlock } from '@/lib/utils/in-park-block';
import { formatDistance } from '@/lib/utils/distance-utils';
import { cn } from '@/lib/utils';
import type { ParkWithAttractions } from '@/lib/api/types';

const subscribeNever = () => () => {};

/**
 * "Near you" at the top of the park page, for a visitor who is standing in this park.
 *
 * The homepage has had an in-park mode for a long time (`InParkView`); the park page, which is
 * where somebody in the park more often lands (favourites, search, a bookmark), had none. This
 * reads the same `/api/nearby` answer the header already asks for on every page
 * (`useHomeNearbyParks`, deduped by React Query), so it adds no request, and lists the same rows.
 *
 * Nothing here asks for location on load. The geolocation context reads a position only where
 * permission is already granted; without it the row offers a button, and only the tap asks.
 *
 * Distances follow the visitor through the context's own refresh: 60 s while `isInPark` is set,
 * which this block sets for as long as it shows the lists, and the position keeps its identity
 * while the fix does not move. So the lists re-render at most once a minute while walking — no
 * second `watchPosition`, which would wake the device on every step (PAR-341).
 *
 * Layout: the row is server-rendered at one fixed height (44 px, the phone target) and every
 * state but `inPark` fills exactly that row — invisible until the permission check has run, so
 * the first paint and the settled page agree for the visitor who is not in a park. The ride
 * lists under it appear only in the park, and they do shift the page: reserving them would put
 * several hundred pixels of nothing on every park page for every reader at home.
 */
export function ParkInParkBlock({
  park,
  className,
}: {
  park: ParkWithAttractions;
  className?: string;
}) {
  const t = useTranslations('nearby');
  const {
    position,
    accuracy,
    loading,
    permissionGranted,
    permissionDenied,
    initialCheckDone,
    refresh,
    setIsInPark,
  } = useGeolocation();
  const { data: nearby } = useHomeNearbyParks();

  // Everything below reads browser state, so the server pass and the hydration pass must both
  // see "nothing known yet" — a local guard, not the provider's (the rule in
  // docs/rules/a-client-only-preference-may-not-decide-server-rendered-markup.md).
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
  const simulated = useSyncExternalStore(
    subscribeNever,
    () => new URLSearchParams(window.location.search).has('sim'),
    () => false
  );

  const rideCoordinates = useMemo(() => {
    const map = new Map<string, { lat: number; lng: number }>();
    for (const a of park.attractions ?? []) {
      if (a.latitude != null && a.longitude != null) {
        map.set(a.id, { lat: a.latitude, lng: a.longitude });
      }
    }
    return map;
  }, [park.attractions]);

  const state = useMemo(
    () =>
      mounted
        ? resolveInParkBlock({
            parkId: park.id,
            parkLatitude: park.latitude,
            parkLongitude: park.longitude,
            rideCoordinates,
            nearby,
            position,
            accuracy,
            permissionGranted,
            permissionDenied,
            initialCheckDone,
            loading,
            simulated,
          })
        : ({ kind: 'pending' } as const),
    [
      mounted,
      park.id,
      park.latitude,
      park.longitude,
      rideCoordinates,
      nearby,
      position,
      accuracy,
      permissionGranted,
      permissionDenied,
      initialCheckDone,
      loading,
      simulated,
    ]
  );

  const inPark = state.kind === 'inPark';
  useEffect(() => {
    if (!inPark) return;
    setIsInPark(true);
    return () => setIsInPark(false);
  }, [inPark, setIsInPark]);

  const lists = state.kind === 'inPark' ? splitInParkRides(state.rides) : null;

  return (
    <section
      className={cn('mb-6', className)}
      aria-label={t('parkPage.heading')}
      data-nosnippet
      data-in-park-block={state.kind}
    >
      {/* The one row every state shares. `min-h-11` is the reservation: every variant is a single
          line, truncated rather than wrapped, so the row never grows on a narrow phone. */}
      <div className="flex min-h-11 items-center gap-2 text-sm">
        {state.kind === 'pending' && (
          // Holds the button's box so the row is the same height before and after the check.
          <Button variant="outline" size="sm" className="invisible" tabIndex={-1} aria-hidden>
            <LocateFixed className="size-4" />
            {t('parkPage.ask')}
          </Button>
        )}
        {state.kind === 'ask' && (
          <Button variant="outline" size="sm" className="min-w-0" onClick={() => refresh()}>
            <LocateFixed className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{t('parkPage.ask')}</span>
          </Button>
        )}
        {state.kind === 'blocked' && (
          <p className="text-muted-foreground flex min-w-0 items-center gap-2">
            <LocateFixed className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{t('parkPage.blocked')}</span>
          </p>
        )}
        {state.kind === 'away' && state.distanceM != null && (
          <p className="text-muted-foreground flex min-w-0 items-center gap-2">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {t('parkPage.away', { distance: formatDistance(state.distanceM) })}
            </span>
          </p>
        )}
        {state.kind === 'inPark' && (
          <h2 className="flex min-w-0 items-center gap-2 text-lg font-semibold">
            <MapPin className="text-park-primary size-5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {state.showDistances ? t('parkPage.heading') : t('parkPage.inParkCoarse')}
            </span>
          </h2>
        )}
      </div>

      {lists && (lists.headliners.length > 0 || lists.attractions.length > 0) && (
        <div className="mt-2 space-y-4">
          <InParkRideLists
            headliners={lists.headliners}
            attractions={lists.attractions}
            showDistance={state.kind === 'inPark' && state.showDistances}
          />
        </div>
      )}
    </section>
  );
}
