'use client';

import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { GlassSectionTitle } from '@/components/parks/glass-section-title';
import { ParkCard } from '@/components/parks/park-card';
import { Button } from '@/components/ui/button';
import { cn, stripNewPrefix } from '@/lib/utils';
import type { NearbyParksData } from '@/types/nearby';
import type { ParkStatus } from '@/lib/api/types';

// Top spacing that separates the card from the hero above. The in-park full-bleed banner
// is intentionally exempt: it must sit flush under the hero (see app/[locale]/page.tsx), so
// only the parks-list / prompt / error / empty states (and the matching skeleton) get this gap.
const TOP_SPACING = 'mt-8';

/**
 * "Nearby parks" grid view: sorted list of nearby parks (open first, then by distance) with a
 * mobile "show more" toggle. Rendered when the nearby response classifies the user as outside a
 * park. Also handles the empty (no parks found) state.
 */
export function NearbyParksListView({
  data,
  className,
  isExpanded,
  setIsExpanded,
}: {
  data: NearbyParksData;
  className?: string;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}) {
  const t = useTranslations('nearby');
  const tCommon = useTranslations('common');

  const rawParks = data.parks;

  // Sort: open (OPERATING/UNKNOWN) first, then by distance – so "nearest open" is first open
  const parks = [...rawParks].sort((a, b) => {
    const aOpen = a.status === 'OPERATING' || a.status === 'UNKNOWN' ? 1 : 0;
    const bOpen = b.status === 'OPERATING' || b.status === 'UNKNOWN' ? 1 : 0;
    if (bOpen !== aOpen) return bOpen - aOpen;
    return a.distance - b.distance;
  });
  const nearestOpenPark =
    parks.find((p) => p.status === 'OPERATING' || p.status === 'UNKNOWN') ?? null;
  const hasNoOpenNearby = parks.length > 0 && nearestOpenPark === null;

  if (parks.length === 0) {
    return (
      <div className={cn('min-h-[200px]', TOP_SPACING, className)}>
        <GlassSectionTitle icon={MapPin} iconClassName="text-muted-foreground">
          {t('title')}
        </GlassSectionTitle>
        <p className="text-muted-foreground text-center text-sm">{t('noParksNearby')}</p>
      </div>
    );
  }

  return (
    <section className={cn(TOP_SPACING, className)}>
      <GlassSectionTitle icon={MapPin} iconClassName="text-park-primary">
        {nearestOpenPark
          ? t('nearestOpenTitle')
          : hasNoOpenNearby
            ? t('nearbyParksClosedTitle')
            : t('nearbyParks')}{' '}
        <span className="text-muted-foreground font-normal">({parks.length})</span>
      </GlassSectionTitle>
      {parks.length > 0 && (
        <p className="text-muted-foreground mb-8 text-sm">
          {t('nearParkSubtitle', { parkName: parks[0].name })}
        </p>
      )}
      {hasNoOpenNearby && (
        <p className="text-muted-foreground mb-4 text-sm">{t('noOpenNearbyFocus')}</p>
      )}
      <div>
        {/* The location prompt lives in the floating LocationBanner now — an inline,
            conditionally-rendered hint here would re-introduce an in-flow layout shift
            (and duplicate the banner's message). */}
        <ul className="grid [grid-auto-rows:auto_1fr_auto] gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {parks.map((park, index) => {
            const hidden = !isExpanded && index >= 2;

            return (
              <li
                key={park.id}
                className={cn(
                  'row-span-3 grid [grid-template-rows:subgrid]',
                  hidden && 'hidden md:grid'
                )}
              >
                <ParkCard
                  id={park.id}
                  name={stripNewPrefix(park.name)}
                  slug={park.slug}
                  city={park.city}
                  country={park.country}
                  distance={park.distance}
                  status={park.status as ParkStatus}
                  timezone={park.timezone}
                  totalAttractions={park.totalAttractions}
                  operatingAttractions={park.operatingAttractions}
                  analytics={park.analytics}
                  todaySchedule={park.todaySchedule}
                  nextSchedule={park.nextSchedule}
                  backgroundImage={park.backgroundImage}
                  url={park.url}
                  hasOperatingSchedule={park.hasOperatingSchedule}
                  highlightAsNearestOpen={nearestOpenPark?.id === park.id}
                  translateCountry
                />
              </li>
            );
          })}
        </ul>

        {/* Show More Button (Mobile Only) */}
        {!isExpanded && parks.length > 2 && (
          <div className="mt-4 flex justify-center md:hidden">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="w-full"
            >
              {tCommon('showMore')}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
