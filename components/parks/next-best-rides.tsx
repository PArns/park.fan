'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronRight, Hourglass } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
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
 * "What now?" for a visitor in the park without a plan (PAR-419): up to three rides whose queue
 * is short now and forecast to be longer within two hours. The rule is `suggestNextRides`; this
 * only feeds it and prints the two numbers it compared.
 *
 * Mounted only inside the in-park lists, so the one request it adds, today's `/plan/day` (the
 * planner's hourly curve, deduped with the planner through React Query), is made for somebody
 * standing in the park and for nobody else. Renders nothing until that answer is there and has a
 * suggestion, so a park without a forecast shows no empty heading.
 */
export function NextBestRides({
  park,
  rides,
  showDistance,
}: {
  park: { slug: string; timezone: string };
  rides: AttractionWithDistance[];
  showDistance: boolean;
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
    // `tick` moves the clock forward; it is not read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rides, day, park.timezone, riderHeightCm, tick]
  );

  if (suggestions.length === 0) return null;
  const bySlug = new Map(rides.map((r) => [r.slug, r]));

  return (
    <div data-next-best-rides>
      <h4 className="text-muted-foreground mb-2 flex items-center gap-1.5 text-sm font-medium">
        <Hourglass className="text-park-primary h-4 w-4" aria-hidden="true" />
        {t('heading')}
      </h4>
      <ul className="space-y-2">
        {suggestions.map((s) => {
          const ride = bySlug.get(s.slug);
          if (!ride) return null;
          return (
            <li key={s.slug}>
              <Link
                href={convertApiUrlToFrontendUrl(ride.url)}
                prefetch={false}
                className="group block"
              >
                <div className="bg-background/60 hover:bg-background/80 hover:border-primary/50 flex min-h-11 items-center justify-between gap-2 rounded-lg border p-3 backdrop-blur-md transition-all hover:shadow-sm">
                  <div className="min-w-0 flex-1">
                    <p className="group-hover:text-primary truncate font-medium transition-colors">
                      {stripNewPrefix(s.name)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {t('reason', {
                        now: roundWaitTo5(s.waitNow),
                        later: roundWaitTo5(s.laterWait),
                        time: formatGridTime(s.laterHour * 60),
                      })}
                      {showDistance && (
                        <>
                          {' · '}
                          {formatDistance(ride.distance)} {tNearby('awayFrom')}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                      {t('saving', { minutes: roundWaitDeltaTo5(s.saving) })}
                    </Badge>
                    <ChevronRight className="text-muted-foreground group-hover:text-primary h-4 w-4 flex-shrink-0 transition-colors" />
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
