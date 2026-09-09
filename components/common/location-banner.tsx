'use client';

import { useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, Navigation, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import { trackLocationBannerClicked } from '@/lib/analytics/umami';

interface LocationBannerProps {
  ariaLabel?: string;
}

/**
 * Banner shown when the user has not granted location (prompt) or has denied it.
 * Renders only when there is no position; user can click to request location.
 */
export function LocationBanner({ ariaLabel }: LocationBannerProps) {
  const t = useTranslations('nearby');
  const tCommon = useTranslations('common');
  const { permissionGranted, loading, initialCheckDone, refresh } = useGeolocation();
  // Server snapshot = false → always null during SSR and the hydration pass,
  // matching what the server produced. Client snapshot = true, so after
  // hydration the real geolocation state takes over.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Dismissible: hide for the rest of the session once the user closes it (the banner
  // is client-only, so reading sessionStorage in the initializer is safe).
  const [dismissed, setDismissed] = useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem('locationBannerDismissed') === '1'
  );

  if (!mounted || !initialCheckDone || permissionGranted || loading || dismissed) {
    return null;
  }

  return (
    // Floating corner toast, out of the document flow: a fixed overlay instead of an
    // in-flow section. The banner only appears after the client-side geolocation check,
    // so in flow it pushed everything below it down ~320px on mount — the dominant
    // homepage CLS (0.13). As a fixed, compact, dismissible toast it no longer affects
    // layout and stays out of the way. pointer-events are scoped to the card so the rest
    // of the floating strip stays click-through.
    <section
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-3 sm:inset-x-auto sm:right-4 sm:bottom-4"
      aria-label={ariaLabel ?? tCommon('locationBannerLabel')}
      data-nosnippet
      data-noindex
    >
      <div
        // `pr-9` (36 px) clears the 24 px close button in its 8 px corner. Below `sm` that button
        // reaches 44 px through a pseudo-element centred on it, so the finger's edge lands 43 px
        // from this one — `max-sm:pr-11` is what keeps the text column out from under it. With
        // `pr-9` alone the column ended 37 px in, i.e. six pixels under the target, and a tap at
        // its right edge still hit the close button.
        //
        // The eight pixels are paid in text width, and in 3 of 18 cases measured (six locales ×
        // 320/360/390 px) that is one more line: es at 320 and 360, en at 390, each +16.5 px of
        // card. The other 15 are unchanged. It costs no layout shift — this toast is `fixed`, so
        // its height moves nothing on the page — and the alternative was leaving the button's
        // reach over the end of every headline line.
        className="border-border/80 bg-card/95 pointer-events-auto relative mx-auto max-w-sm rounded-xl border p-4 pr-9 shadow-2xl ring-1 ring-black/5 backdrop-blur-md max-sm:pr-11 sm:mx-0 dark:ring-white/5"
        aria-live="polite"
      >
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            try {
              sessionStorage.setItem('locationBannerDismissed', '1');
            } catch {}
          }}
          aria-label={tCommon('close')}
          // 24 px (a 16 px glyph in `p-1`), and it is the only way out of a toast that covers the
          // bottom of the homepage, so it needs the 44 px. It reaches it through a pseudo-element:
          // the target grows, the box does not — see the design system.
          //
          // `max-sm:min-h-11 max-sm:min-w-11` grew the box instead, and this button is anchored by
          // its TOP-RIGHT corner, so the extra 20 px went inward. Measured at 390 px: the box
          // reached 53 px into a card whose headline column ends 37 px from that edge, i.e. it lay
          // over the last 16 px of the headline, and `elementFromPoint` at that column's right
          // edge returned the close button — tapping the end of a headline line dismissed the
          // banner. The glyph came to rest at 31/31 from the card's corner instead of 21/21. The
          // comment that stood here claimed the opposite of both, which is why the `pr-9` it cited
          // was never checked against the grown box.
          className="text-muted-foreground hover:text-foreground hover:bg-muted absolute top-2 right-2 inline-flex items-center justify-center rounded-md p-1 transition-colors max-sm:after:absolute max-sm:after:top-1/2 max-sm:after:left-1/2 max-sm:after:h-11 max-sm:after:w-11 max-sm:after:-translate-x-1/2 max-sm:after:-translate-y-1/2 max-sm:after:content-['']"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
            <MapPin className="text-primary h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-foreground text-sm leading-tight font-semibold">
              {t('bannerHeadline')}
            </h2>
            <p className="text-muted-foreground mt-1 text-xs leading-snug">{t('bannerBody')}</p>
          </div>
        </div>
        <Button
          onClick={() => {
            trackLocationBannerClicked();
            refresh();
          }}
          size="sm"
          disabled={loading}
          className="mt-3 w-full"
        >
          <Navigation className="mr-1.5 h-3.5 w-3.5" />
          {loading ? t('loadingLocation') : t('enable')}
        </Button>
      </div>
    </section>
  );
}
