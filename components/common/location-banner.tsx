'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, Navigation } from 'lucide-react';
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

  if (!mounted || !initialCheckDone || permissionGranted || loading) {
    return null;
  }

  return (
    // Floating, out of the document flow: a fixed bottom card instead of an in-flow
    // section. The banner only appears after the client-side geolocation check, so when
    // it was in flow it pushed everything below it down by ~320px on mount — the dominant
    // homepage CLS (0.13). As a fixed overlay it no longer affects layout. pointer-events
    // are scoped to the card so the rest of the floating strip stays click-through.
    <section
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-4"
      aria-label={ariaLabel ?? tCommon('locationBannerLabel')}
      data-nosnippet
      data-noindex
    >
      <div className="pointer-events-auto container mx-auto max-w-3xl">
        <div
          className="border-border/80 bg-card/95 relative overflow-hidden rounded-2xl border shadow-2xl ring-1 ring-black/5 backdrop-blur-md dark:ring-white/5"
          aria-live="polite"
        >
          <div className="from-primary/5 to-primary/5 absolute inset-0 bg-gradient-to-br via-transparent" />
          <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8 sm:p-6">
            <div className="flex min-w-0 flex-1 gap-4">
              <div className="bg-primary/10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                <MapPin className="text-primary h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-2">
                <h2 className="text-foreground text-base leading-tight font-semibold sm:text-lg">
                  {t('bannerHeadline')}
                </h2>
                <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
                  {t('bannerBody')}
                </p>
                <p className="text-muted-foreground/90 text-xs leading-snug">
                  {t('bannerPrivacy')}
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                trackLocationBannerClicked();
                refresh();
              }}
              size="lg"
              disabled={loading}
              className="w-full shrink-0 sm:w-auto"
            >
              <Navigation className="mr-2 h-4 w-4" />
              {loading ? t('loadingLocation') : t('enable')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
