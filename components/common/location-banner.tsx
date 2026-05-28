'use client';

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

  if (!initialCheckDone || permissionGranted || loading) {
    return null;
  }

  return (
    <section
      className="px-4 py-4"
      aria-label={ariaLabel ?? tCommon('locationBannerLabel')}
      data-nosnippet
      data-noindex
    >
      <div className="container mx-auto">
        <div
          className="border-border/80 bg-card relative overflow-hidden rounded-2xl border shadow-sm ring-1 ring-black/5 dark:ring-white/5"
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
