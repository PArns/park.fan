'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, Navigation, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  readLocationDeclinedAt,
  rememberLocationDeclined,
  useGeolocation,
  useLocationNeeded,
} from '@/lib/contexts/geolocation-context';
import { useMounted } from '@/lib/hooks/use-mounted';
import { trackLocationBannerClicked } from '@/lib/analytics/umami';
import { locationBannerIsQuiet } from '@/lib/utils/geolocation-permission';

interface LocationBannerProps {
  ariaLabel?: string;
}

/**
 * The homepage's ask for location, shown when the user has not granted location yet (prompt).
 * Mounted, it marks the page as one that uses location (`useLocationNeeded`): a visitor who said
 * yes on an earlier visit gets the browser's prompt directly and never sees this banner.
 * Not shown once the browser has denied it: the button would do nothing, and the browser alone
 * can lift a denial. A no keeps it closed for `LOCATION_BANNER_QUIET_MS` (30 days): closing it,
 * or answering the browser's prompt with no from any page (`rememberLocationDeclined`).
 */
export function LocationBanner({ ariaLabel }: LocationBannerProps) {
  const t = useTranslations('nearby');
  const tCommon = useTranslations('common');
  const {
    permissionGranted,
    permissionDenied,
    loading,
    error,
    initialCheckDone,
    earlierYes,
    refresh,
  } = useGeolocation();
  useLocationNeeded();
  // False on the server and in the hydration pass → the banner renders null there,
  // matching what the server produced. After hydration the real geolocation state takes over.
  const mounted = useMounted();

  // Dismissible: hidden for 30 days once closed (client-only, so reading localStorage in the
  // initializer is safe). One session was too short for a visitor who had said no.
  const [dismissed, setDismissed] = useState(
    () =>
      typeof window !== 'undefined' && locationBannerIsQuiet(readLocationDeclinedAt(), Date.now())
  );

  if (
    !mounted ||
    !initialCheckDone ||
    permissionGranted ||
    permissionDenied ||
    // A no in this page (a dismissed prompt is not `permissionDenied`), or no Geolocation API at
    // all. The chapter row under "near you" keeps the button for a change of mind.
    error ||
    loading ||
    // The browser is about to ask this visitor directly; the banner would be a second ask.
    earlierYes ||
    dismissed
  ) {
    return null;
  }

  return (
    // A fixed corner toast rather than an in-flow section: it appears only after the client-side
    // geolocation check, and in flow it pushed the homepage down on mount. Pointer events are
    // scoped to the card so the rest of the strip stays click-through.
    <section
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-3 max-sm:p-2 sm:inset-x-auto sm:right-4 sm:bottom-4"
      aria-label={ariaLabel ?? tCommon('locationBannerLabel')}
      data-nosnippet
      data-noindex
      // Read by the new-posts toast, which stacks above this on a phone instead of covering it.
      data-location-banner
    >
      <div
        // `pr-9` clears the 24 px close button; below `sm` that button reaches 44 px through a
        // pseudo-element, so `max-sm:pr-11` keeps the text column out from under its reach. The
        // toast is `fixed`, so the occasional extra line costs no layout shift.
        className="border-border/80 bg-card/95 pointer-events-auto relative mx-auto max-w-sm rounded-xl border p-4 pr-9 shadow-2xl ring-1 ring-black/5 backdrop-blur-md max-sm:p-3 max-sm:pr-11 sm:mx-0 dark:ring-white/5"
        aria-live="polite"
      >
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            rememberLocationDeclined();
          }}
          aria-label={tCommon('close')}
          // The only way out of a toast over the bottom of the homepage, so it needs 44 px. It
          // gets them from a pseudo-element: a grown box, anchored by its top-right corner, would
          // reach over the end of the headline and dismiss the banner on a tap there.
          className="text-muted-foreground hover:text-foreground hover:bg-muted absolute top-2 right-2 inline-flex items-center justify-center rounded-md p-1 transition-colors max-sm:after:absolute max-sm:after:top-1/2 max-sm:after:left-1/2 max-sm:after:h-11 max-sm:after:w-11 max-sm:after:-translate-x-1/2 max-sm:after:-translate-y-1/2 max-sm:after:content-['']"
        >
          <X className="h-4 w-4" />
        </button>
        {/* Below `sm` the toast covers a large share of a phone screen over the hero's search box,
            so it drops the icon tile and takes a short body (`bannerBodyShort`) and tighter
            padding. The button and the close keep their 44 px. */}
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg max-sm:hidden">
            <MapPin className="text-primary h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-foreground text-sm leading-tight font-semibold">
              {t('bannerHeadline')}
            </h2>
            <p className="text-muted-foreground mt-1 text-xs leading-snug max-sm:hidden">
              {t('bannerBody')}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs leading-snug sm:hidden">
              {t('bannerBodyShort')}
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            trackLocationBannerClicked();
            refresh();
          }}
          size="sm"
          disabled={loading}
          className="mt-3 w-full max-sm:mt-2"
        >
          <Navigation className="mr-1.5 h-3.5 w-3.5" />
          {loading ? t('loadingLocation') : t('enable')}
        </Button>
      </div>
    </section>
  );
}
