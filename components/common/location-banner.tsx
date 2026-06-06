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
        className="border-border/80 bg-card/95 pointer-events-auto relative mx-auto max-w-sm rounded-xl border p-4 pr-9 shadow-2xl ring-1 ring-black/5 backdrop-blur-md sm:mx-0 dark:ring-white/5"
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
          className="text-muted-foreground hover:text-foreground hover:bg-muted absolute top-2 right-2 rounded-md p-1 transition-colors"
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
