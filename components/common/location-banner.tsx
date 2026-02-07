'use client';

import { useTranslations } from 'next-intl';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGeolocation } from '@/lib/contexts/geolocation-context';

/**
 * Banner shown when the user has not granted location (prompt) or has denied it.
 * Renders only when there is no position; user can click to request location.
 */
export function LocationBanner() {
  const t = useTranslations('nearby');
  const { position, loading, initialCheckDone, refresh } = useGeolocation();

  if (!initialCheckDone || position !== null || loading) {
    return null;
  }

  return (
    <div
      className="border-border/80 bg-card relative overflow-hidden rounded-2xl border shadow-sm ring-1 ring-black/5 dark:ring-white/5"
      data-nosnippet
      data-noindex
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
            <p className="text-muted-foreground/90 text-xs leading-snug">{t('bannerPrivacy')}</p>
          </div>
        </div>
        <Button
          onClick={refresh}
          size="lg"
          disabled={loading}
          className="w-full shrink-0 sm:w-auto"
        >
          <Navigation className="mr-2 h-4 w-4" />
          {loading ? t('loadingLocation') : t('enable')}
        </Button>
      </div>
    </div>
  );
}
