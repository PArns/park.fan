'use client';

import { useSyncExternalStore, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, Navigation } from 'lucide-react';
import { GlassSectionTitle } from '@/components/parks/glass-section-title';
import { NearbyParksCardSkeleton } from '@/components/parks/nearby-parks-card-skeleton';
import { InParkView } from '@/components/parks/nearby-in-park-view';
import { NearbyParksListView } from '@/components/parks/nearby-parks-list-view';
import { Button } from '@/components/ui/button';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { useNearbyAnalytics } from '@/lib/hooks/use-nearby-analytics';
import { cn } from '@/lib/utils';
import type { NearbyAttractionsData, NearbyParksData } from '@/types/nearby';

// Top spacing that separates the card from the hero above. The in-park full-bleed banner
// is intentionally exempt: it must sit flush under the hero (see app/[locale]/page.tsx), so
// only the parks-list / prompt / error / empty states (and the matching skeleton) get this gap.
const TOP_SPACING = 'mt-8';

export function NearbyParksCard({ className }: { className?: string }) {
  const t = useTranslations('nearby');
  const tCommon = useTranslations('common');

  const [isExpanded, setIsExpanded] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const {
    position,
    loading: geoLoading,
    permissionDenied,
    permissionGranted,
    refresh,
    setIsInPark,
  } = useGeolocation();

  // `isPending` (no data yet, including "query not enabled yet") instead of `isLoading`
  // (actively fetching): the query is gated behind the after-load idle window and the
  // initial geolocation check, so right after mount NOTHING is in flight yet — with
  // `isLoading` the card fell through to the "enable location" prompt for those first
  // seconds and then jumped prompt → skeleton → parks once the query fired. `isPending`
  // keeps the skeleton up until the query has actually produced data or an error.
  const { data: nearbyData, isPending: dataPending, error: dataError } = useHomeNearbyParks();

  const locationSource = position ? 'gps' : 'ip';

  useNearbyAnalytics({ nearbyData, position, permissionDenied, locationSource, setIsInPark });

  // Show skeleton whenever there's nothing to display and something is still in progress.
  // Keep showing skeleton even on 400 errors while GPS is still loading — coords may arrive
  // and trigger a successful retry. nearbyData covers both real and placeholder (cached) data.
  const isLoading = !nearbyData && (geoLoading || dataPending);

  // "Location required" 400 = no public IP and no coords (e.g. local dev). Treat as prompt, not error.
  const isLocationUnavailable =
    dataError != null &&
    !dataPending &&
    typeof (dataError as Error)?.message === 'string' &&
    ((dataError as Error).message.toLowerCase().includes('location') ||
      (dataError as Error).message.toLowerCase().includes('geoip') ||
      (dataError as Error).message.includes('400'));

  // Same structure on server and initial client to avoid hydration mismatch. Mirrors the live
  // "nearby parks" layout exactly (shared skeleton) so the swap to real parks doesn't shift layout.
  if (!mounted || isLoading) {
    return <NearbyParksCardSkeleton className={className} />;
  }

  // Prompt state: only when user hasn't granted location yet (or is still undecided).
  // Don't show if GPS timed out / unavailable — permissionGranted stays true in that case.
  if (!permissionGranted && !permissionDenied && !geoLoading && !dataPending && !nearbyData) {
    return (
      <div className={cn('min-h-[200px]', TOP_SPACING, className)}>
        <GlassSectionTitle icon={MapPin} iconClassName="text-muted-foreground">
          {t('title')}
        </GlassSectionTitle>
        <div className="flex flex-col items-center space-y-4 py-4 text-center">
          <p className="text-muted-foreground text-sm">{t('enableDescription')}</p>
          <Button onClick={refresh}>
            <Navigation className="mr-2 h-4 w-4" />
            {t('enable')}
          </Button>
        </div>
      </div>
    );
  }

  // Error state: unexpected API/backend errors only
  const showErrorCard = dataError && !dataPending && !isLocationUnavailable;

  if (showErrorCard) {
    return (
      <div className={cn('min-h-[200px]', TOP_SPACING, className)}>
        <GlassSectionTitle icon={MapPin} iconClassName="text-park-primary">
          {t('loadError')}
        </GlassSectionTitle>
        <div className="flex flex-col items-center space-y-4 py-4 text-center">
          <p className="text-muted-foreground mx-auto max-w-md text-sm">
            {t('loadErrorDescription')}
          </p>
          <Button onClick={refresh} variant="outline">
            <Navigation className="mr-2 h-4 w-4" />
            {tCommon('retry')}
          </Button>
        </div>
      </div>
    );
  }

  // No data yet
  if (!nearbyData) {
    return null;
  }

  // User is IN a park - show park info and nearby attractions
  if (nearbyData.type === 'in_park') {
    return <InParkView data={nearbyData.data as NearbyAttractionsData} className={className} />;
  }

  if (nearbyData.type === 'nearby_parks') {
    return (
      <NearbyParksListView
        data={nearbyData.data as NearbyParksData}
        className={className}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />
    );
  }

  return null;
}
