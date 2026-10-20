'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Hourglass } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RiderHeight } from '@/components/common/unit-display';
import { IN_PARK_LIST, InParkRow } from '@/components/parks/in-park-row';
import { useAfterLoad } from '@/lib/hooks/use-after-load';
import { useLiveAttractionData } from '@/lib/hooks/use-live-attraction-data';
import { useLiveParkData } from '@/lib/hooks/use-live-park-data';
import { useRideAlternativeMeta } from '@/lib/hooks/use-ride-alternative-meta';
import {
  MIN_ALTERNATIVE_SAVING_MIN,
  rankRideAlternatives,
  type AlternativeCandidate,
} from '@/lib/parks/ride-alternatives';
import { getLiveAttractionStatus, getStandbyWait } from '@/lib/utils/park-utils';
import { formatDistance } from '@/lib/utils/distance-utils';
import { buildAttractionUrlFromGeo } from '@/lib/utils/url-utils';
import { stripNewPrefix } from '@/lib/utils';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import type { ParkWithAttractions } from '@/lib/api/types';

interface RideAlternativesProps {
  initialPark: ParkWithAttractions;
  attractionSlug: string;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
}

/**
 * „A shorter queue nearby" under the ride page's live chapter: up to three open rides of the same
 * park that are at least 15 minutes shorter, ranked by `rankRideAlternatives`.
 *
 * The outer component reads the ride's own wait from the detail query the page already polls and
 * renders nothing below 15 minutes, since no ride can then save enough. Only past that gate does
 * the list mount, and only then are the park poll and the day-stable position slice requested, so
 * a ride with a short queue costs no extra request.
 */
export function RideAlternatives(props: RideAlternativesProps) {
  const { attraction, park } = useLiveAttractionData(props);
  const status = attraction ? getLiveAttractionStatus(attraction, park.status) : null;
  const wait = attraction && status === 'OPERATING' ? getStandbyWait(attraction) : null;
  const afterLoad = useAfterLoad();

  if (!afterLoad || wait == null || roundWaitTo5(wait) < MIN_ALTERNATIVE_SAVING_MIN) return null;
  return <RideAlternativesList {...props} wait={wait} />;
}

function RideAlternativesList({
  initialPark,
  attractionSlug,
  continent,
  country,
  city,
  parkSlug,
  wait,
}: RideAlternativesProps & { wait: number }) {
  const t = useTranslations('attractions.alternatives');
  const tMeta = useTranslations('attractions.meta');

  const { data: park } = useLiveParkData({
    continent,
    country,
    city,
    parkSlug,
    initialData: initialPark,
  });
  const { data: meta } = useRideAlternativeMeta({ continent, country, city, parkSlug });

  const alternatives = useMemo(() => {
    if (!park || !meta) return [];
    const info = (slug: string) => meta.get(slug);
    const candidates: AlternativeCandidate[] = (park.attractions ?? []).map((a) => ({
      slug: a.slug,
      name: a.name,
      wait: getLiveAttractionStatus(a, park.status) === 'OPERATING' ? getStandbyWait(a) : null,
      latitude: info(a.slug)?.latitude ?? null,
      longitude: info(a.slug)?.longitude ?? null,
      types: info(a.slug)?.types ?? [],
      minimumHeight: info(a.slug)?.minimumHeight ?? null,
    }));
    const here = info(attractionSlug);
    return rankRideAlternatives(
      {
        slug: attractionSlug,
        wait,
        latitude: here?.latitude ?? null,
        longitude: here?.longitude ?? null,
        types: here?.types ?? [],
      },
      candidates
    );
  }, [park, meta, attractionSlug, wait]);

  if (alternatives.length === 0) return null;

  return (
    <div data-ride-alternatives className="border-foreground/10 border-t px-4 py-4">
      <h3 className="text-muted-foreground mb-1 flex items-center gap-1.5 text-sm font-medium">
        <Hourglass className="text-park-primary h-4 w-4" aria-hidden="true" />
        {t('heading')}
      </h3>
      <ul className={IN_PARK_LIST}>
        {alternatives.map((ride) => (
          <InParkRow
            key={ride.slug}
            href={buildAttractionUrlFromGeo({
              slug: ride.slug,
              park: { continent, country, city, slug: parkSlug },
            })}
            title={<span className="truncate">{stripNewPrefix(ride.name)}</span>}
            meta={
              <>
                {ride.distance != null && t('away', { distance: formatDistance(ride.distance) })}
                {ride.distance != null && ride.minimumHeight != null && ' · '}
                {ride.minimumHeight != null && (
                  <>
                    {tMeta('minHeightLabel')} <RiderHeight cm={ride.minimumHeight} />
                  </>
                )}
              </>
            }
            trailing={
              <>
                <span className="font-semibold tabular-nums">
                  {t('wait', { minutes: ride.wait })}
                </span>
                <Badge className="border-transparent bg-emerald-500/15 px-2.5 py-1 font-bold text-emerald-700 tabular-nums dark:text-emerald-400">
                  {t('saving', { minutes: ride.saving })}
                </Badge>
              </>
            }
          />
        ))}
      </ul>
    </div>
  );
}
