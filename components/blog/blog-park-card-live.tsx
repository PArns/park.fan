'use client';

import { useTranslations } from 'next-intl';
import { ParkCard } from '@/components/parks/park-card';
import { useLiveBlogPark } from '@/lib/blog/use-blog-live';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import type { ResolvedPark } from '@/lib/blog/park-resolver';

interface BlogParkCardLiveProps {
  park: ResolvedPark;
  backgroundImage?: string | null;
  /** Wrapper classes — the callers own the card's grid-row template. */
  className?: string;
}

/**
 * `ParkCard` for a blog park reference, kept live in the browser.
 *
 * Shared by the hover preview and the `?full` spotlight. Status, crowd level, average wait,
 * open-ride count and today's hours all change during the day, so they're refreshed from the
 * region batch instead of being served as of whenever the post was built.
 */
export function BlogParkCardLive({ park, backgroundImage, className }: BlogParkCardLiveProps) {
  const tGeo = useTranslations('geo');
  const live = useLiveBlogPark(park) ?? park;
  const country = translateGeoSlug(tGeo, 'countries', live.countrySlug, live.country);

  return (
    <div className={className}>
      <ParkCard
        name={live.name}
        slug={live.slug}
        parkId={live.id}
        city={live.city}
        country={country}
        href={live.href as '/'}
        status={live.status}
        crowdLevel={live.crowdLevel}
        averageWaitTime={live.avgWaitTime}
        operatingAttractions={live.operatingAttractions}
        totalAttractions={live.totalAttractions}
        timezone={live.timezone}
        todaySchedule={live.todaySchedule}
        nextSchedule={live.nextSchedule}
        hasOperatingSchedule={live.hasOperatingSchedule}
        backgroundImage={backgroundImage}
      />
    </div>
  );
}
