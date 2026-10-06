'use client';

import { useTranslations } from 'next-intl';
import { LocateFixed, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  LocationBlockedHelp,
  useHasGeolocationElement,
} from '@/components/common/location-blocked-help';
import { useGeolocation, useLocationNeeded } from '@/lib/contexts/geolocation-context';
import { useInParkBlock } from '@/lib/hooks/use-in-park-block';
import { cn } from '@/lib/utils';

/**
 * The park page's control for location, on the title card's address line beside the distance badge:
 * the button while nothing is decided, the way out after a block, „location on" once the position
 * is in, and „you are in the park" when the nearby answer places the visitor here. It is the park
 * page's ask (`useLocationNeeded`), see docs/rules/location-is-asked-for-where-it-is-needed.md.
 *
 * One box at one fixed height in every state (44 px below `sm`, 32 px above), so it never changes
 * the title card's height: a long label wraps on a phone and truncates from `sm` up.
 */
export function ParkLocationLine({
  park,
  className,
}: {
  park: { id: string; latitude: number | null; longitude: number | null };
  className?: string;
}) {
  const t = useTranslations('nearby');
  const tLocation = useTranslations('location');
  const { loading, refresh } = useGeolocation();
  useLocationNeeded();
  const state = useInParkBlock(park);
  const hasGeolocationElement = useHasGeolocationElement();

  return (
    <div
      className={cn('flex h-11 min-w-0 items-center gap-2 text-sm sm:h-8', className)}
      data-location-line={state.kind}
    >
      {state.kind === 'pending' && loading && (
        <p className="text-muted-foreground flex min-w-0 items-center gap-2">
          {/* No pulse: an endless animation under the title card's `backdrop-filter` repaints the
              blur every frame (docs/rules/work-nobody-can-see-is-still-work.md). */}
          <LocateFixed className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{t('loadingLocation')}</span>
        </p>
      )}
      {state.kind === 'ask' && (
        <Button
          variant="outline"
          size="sm"
          className="max-w-full min-w-0 max-sm:text-left max-sm:whitespace-normal"
          // Held while the browser's prompt is open, as on the homepage's row: a second tap
          // would only queue a second read behind the first.
          disabled={loading}
          onClick={() => refresh()}
        >
          <LocateFixed className="size-4 shrink-0" aria-hidden="true" />
          <span className="max-sm:line-clamp-2 max-sm:leading-tight sm:truncate">
            {loading ? t('loadingLocation') : t('parkPage.ask')}
          </span>
        </Button>
      )}
      {state.kind === 'blocked' && (
        <>
          {/* The short line, not the homepage's sentence: beside "How to change this" a phone
            has about 100 px for it. Beside the browser's own `<geolocation>` button there is no
            room left at all, and that button says what it does, so there it goes below `sm`. */}
          <p
            className={cn(
              'text-muted-foreground flex min-w-0 items-center gap-2',
              hasGeolocationElement && 'max-sm:hidden'
            )}
          >
            <LocateFixed className="size-4 shrink-0" aria-hidden="true" />
            <span className="max-sm:line-clamp-2 max-sm:leading-tight sm:truncate">
              {tLocation('blocked')}
            </span>
          </p>
          <LocationBlockedHelp />
        </>
      )}
      {state.kind === 'away' && (
        <p className="text-muted-foreground flex min-w-0 items-center gap-2">
          <LocateFixed className="text-primary size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{tLocation('active')}</span>
        </p>
      )}
      {state.kind === 'inPark' && (
        <p className="text-foreground flex min-w-0 items-center gap-2 font-medium">
          <MapPin className="text-park-primary size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{t('parkPage.inParkCoarse')}</span>
        </p>
      )}
    </div>
  );
}
