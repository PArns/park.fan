'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Hourglass } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { IN_PARK_LIST, InParkRow } from '@/components/parks/in-park-row';
import { usePlanDay } from '@/lib/hooks/use-plan-day';
import { suggestNextRides } from '@/lib/planner/next-best-ride';
import { parkGeoFromUrl } from '@/lib/planner/park-url';
import { formatGridTime, parkMinuteNow, todayInZone } from '@/lib/planner/park-time';
import { getMinuteTick, subscribeToMinute } from '@/lib/planner/minute-tick';
import { plannerStore } from '@/lib/planner/store';
import { roundWaitDeltaTo5, roundWaitTo5 } from '@/lib/utils/wait-time';
import { stripNewPrefix } from '@/lib/utils';
import { formatDistance } from '@/lib/utils/distance-utils';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import type { AttractionWithDistance } from '@/types/nearby';

/**
 * "What now?" for a visitor in the park without a plan: up to three rides whose queue
 * is short now and forecast to be longer within two hours. The rule is `suggestNextRides`; this
 * only feeds it and prints the two numbers it compared.
 *
 * Mounted only inside the in-park lists, so the one request it adds, today's `/plan/day` (the
 * planner's day curve, deduped with the planner through React Query), is made for somebody
 * standing in the park and for nobody else. Renders nothing until that answer is there and has a
 * suggestion, so a park without a forecast shows no empty heading.
 */
export function NextBestRides({
  park,
  rides,
  showDistance,
  headingAs: Heading = 'h4',
}: {
  park: { slug: string; timezone: string };
  rides: AttractionWithDistance[];
  showDistance: boolean;
  /** The label's level: `h4` under the homepage's in-park heading, `h3` on the park page. */
  headingAs?: 'h3' | 'h4';
}) {
  const t = useTranslations('nearby.nextRide');
  const tNearby = useTranslations('nearby');

  // `/api/nearby` names no geography for the park itself; every ride URL carries it
  // (the same reading as `PlannerInParkCta`).
  const geo = useMemo(
    () =>
      rides.reduce<ReturnType<typeof parkGeoFromUrl>>((g, r) => g ?? parkGeoFromUrl(r.url), null),
    [rides]
  );
  const { data: day } = usePlanDay({
    continent: geo?.continent ?? '',
    country: geo?.country ?? '',
    city: geo?.city ?? '',
    parkSlug: park.slug,
    enabled: geo != null,
  });

  // Re-read the park's clock once a minute; the tick only triggers the re-render.
  const tick = useSyncExternalStore(subscribeToMinute, getMinuteTick, () => 0);
  const planner = useSyncExternalStore(
    plannerStore.subscribe,
    plannerStore.getSnapshot,
    plannerStore.getServerSnapshot
  );
  const riderHeightCm =
    planner.parks[park.slug]?.days[todayInZone(park.timezone)]?.prefs?.riderHeightCm;

  const suggestions = useMemo(
    () =>
      suggestNextRides({
        rides,
        day,
        nowMinute: parkMinuteNow(park.timezone),
        riderHeightCm,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lists `tick` without reading it: `parkMinuteNow` reads the clock, the minute tick re-runs the memo
    [rides, day, park.timezone, riderHeightCm, tick]
  );

  if (suggestions.length === 0) return null;
  const bySlug = new Map(rides.map((r) => [r.slug, r]));

  return (
    <div data-next-best-rides>
      <Heading className="text-muted-foreground mb-1 flex items-center gap-1.5 text-sm font-medium">
        <Hourglass className="text-park-primary h-4 w-4" aria-hidden="true" />
        {t('heading')}
      </Heading>
      <ul className={IN_PARK_LIST}>
        {suggestions.map((s) => {
          const ride = bySlug.get(s.slug);
          if (!ride) return null;
          const now = roundWaitTo5(s.waitNow);
          const later = roundWaitTo5(s.laterWait);
          return (
            <InParkRow
              key={s.slug}
              href={convertApiUrlToFrontendUrl(ride.url)}
              title={<span className="truncate">{stripNewPrefix(s.name)}</span>}
              meta={
                <>
                  {t('reason', {
                    now,
                    later,
                    time: formatGridTime(s.laterMinute),
                  })}
                  {showDistance && (
                    <>
                      {' · '}
                      {formatDistance(ride.distance)} {tNearby('awayFrom')}
                    </>
                  )}
                </>
              }
              trailing={
                <Badge className="border-transparent bg-emerald-500/15 px-2.5 py-1 font-bold text-emerald-700 tabular-nums dark:text-emerald-400">
                  {/* The difference of the two numbers printed beside it, not the raw gap
                      rounded on its own, or 22 → 33 would read "20 … 35" next to "−10". */}
                  {t('saving', { minutes: roundWaitDeltaTo5(later - now) })}
                </Badge>
              }
            />
          );
        })}
      </ul>
    </div>
  );
}
