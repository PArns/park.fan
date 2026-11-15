import { getTranslations } from 'next-intl/server';
import { getListFormat } from '@/lib/utils/intl-format';
import {
  BEST_TIME_WINDOWS,
  bestTimePageDays,
  bestTimeParks,
  bestTimeTripLengths,
  REGION_BEST_TIME_PAGE,
} from '@/lib/trip-regions/best-time';
import { shortGroupName } from '@/lib/trip-regions/hub-data';
import { tripRegionBestTimePath } from '@/lib/trip-regions/paths';
import { WHEN_REASON_ORDER, type WhenReasonCode } from '@/lib/trip-regions/plan-when';
import { getRegionTranslations } from '@/lib/trip-regions/region-messages';
import { regionOrShared } from '@/lib/trip-regions/region-words';
import { requireTripRegion } from '@/lib/trip-regions/registry';
import type { TripRegion, TripWhen } from '@/lib/trip-regions/types';
import { HubWhenTeaser, type HubWhenScope } from './hub-when-teaser';

/**
 * The best-time chapter's body, the teaser of the region's best-time pages (`HubWhenTeaser`),
 * with what only the server knows: a choice per best-time page of the region (its resorts by
 * their short words, its headliner parks, the trip lengths offered for them, its page), the
 * region's words for why a window was picked, and the served answer, the region's own page at
 * its own length, which is the query that page sends. One figure and no second baseline; where a
 * figure comes from is the questions' and the best-time page's to say. The page draws the chapter
 * only for a region with best-time pages and its words for them.
 */
export async function HubWhen({
  region,
  when,
  range,
  pagePath,
  locale,
}: {
  region: TripRegion;
  /** The region's own page's `/when`; `null` when it gave no answer. */
  when: TripWhen | null;
  /** The days every choice searches. */
  range: { from: string; to: string };
  /** The page the planner is on: the hub or the month page. */
  pagePath: string;
  locale: string;
}) {
  const [tWhen, tWhenOwn] = await Promise.all([
    getTranslations('tripPlanner.when'),
    getRegionTranslations(region.slug, 'planner.when'),
  ]);
  const config = requireTripRegion(region.slug);
  const list = getListFormat(locale, { type: 'conjunction' });
  const scopes: HubWhenScope[] = config.bestTime
    .map((page) => {
      const parks = bestTimeParks(region, page.id);
      const resorts = page.groups.map(
        (key) =>
          config.resortWords[key] ??
          shortGroupName(region.groups.find((g) => g.key === key)?.name ?? key)
      );
      return {
        id: page.id,
        label: list.format(resorts),
        parks,
        lengths: bestTimeTripLengths(bestTimePageDays(region, page.id)),
        href: tripRegionBestTimePath(region.slug, locale, page.id),
        namesParks: page.id !== REGION_BEST_TIME_PAGE,
      };
    })
    .filter((scope) => scope.parks.length > 0);
  if (scopes.length === 0) return null;
  const reasons = Object.fromEntries(
    WHEN_REASON_ORDER.map((code) => [code, regionOrShared(tWhenOwn, tWhen, `reason.${code}`)])
  ) as Record<WhenReasonCode, string>;
  return (
    <HubWhenTeaser
      region={region.slug}
      scopes={scopes}
      initial={(when?.windows ?? []).slice(0, BEST_TIME_WINDOWS)}
      range={range}
      reasons={reasons}
      pagePath={pagePath}
      locale={locale}
    />
  );
}
