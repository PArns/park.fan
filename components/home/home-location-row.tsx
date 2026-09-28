'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { LocateFixed, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationBlockedHelp } from '@/components/common/location-blocked-help';
import { useGeolocation, useLocationNeeded } from '@/lib/contexts/geolocation-context';
import { cn } from '@/lib/utils';

const subscribeNever = () => () => {};

/**
 * The homepage's standing control for location, under the nearby chapter's lead ("Share your
 * location and park.fan shows you the parks around you").
 *
 * The banner is the ask that comes by itself, and after a no it stays away for 30 days. This row
 * does not come by itself, it is simply there, so a no can be taken back on the page where
 * location matters most: the button while nothing is decided, the state once location is on, and
 * after a block the steps to lift it (`LocationBlockedHelp`). It declares the page's need for
 * location like the banner does (`useLocationNeeded`), so either one mounting first is enough.
 *
 * Layout: server-rendered at one fixed height (44 px, the phone target) and every state fills
 * exactly that row, invisible until the permission check has run, the same contract as the park
 * page's near-you row. So the first paint and the settled page agree whatever the answer is.
 */
export function HomeLocationRow({ className }: { className?: string }) {
  const t = useTranslations('nearby');
  const tLocation = useTranslations('location');
  const {
    position,
    loading,
    permissionGranted,
    permissionDenied,
    initialCheckDone,
    earlierYes,
    refresh,
  } = useGeolocation();
  useLocationNeeded();

  // Browser state only, so the server pass and the hydration pass both see "nothing known yet".
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );

  const state =
    !mounted || !initialCheckDone || earlierYes
      ? 'pending'
      : permissionGranted
        ? 'active'
        : permissionDenied
          ? 'blocked'
          : 'ask';

  return (
    <div
      className={cn('flex min-h-11 items-center gap-2 text-sm', className)}
      data-location-row={state}
    >
      {state === 'pending' && (
        // Holds the button's box so the row is the same height before and after the check.
        <Button variant="outline" size="sm" className="invisible" tabIndex={-1} aria-hidden>
          <Navigation className="size-4" />
          {t('enable')}
        </Button>
      )}
      {state === 'ask' && (
        <Button
          variant="outline"
          size="sm"
          className="min-w-0"
          disabled={loading}
          onClick={() => refresh()}
        >
          <Navigation className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{loading ? t('loadingLocation') : t('enable')}</span>
        </Button>
      )}
      {state === 'active' && (
        <p className="text-muted-foreground flex min-w-0 items-center gap-2">
          <LocateFixed className="text-primary size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {loading && !position ? t('loadingLocation') : tLocation('active')}
          </span>
        </p>
      )}
      {state === 'blocked' && (
        <>
          <p className="text-muted-foreground flex min-w-0 items-center gap-2">
            <LocateFixed className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{t('parkPage.blocked')}</span>
          </p>
          <LocationBlockedHelp />
        </>
      )}
    </div>
  );
}
