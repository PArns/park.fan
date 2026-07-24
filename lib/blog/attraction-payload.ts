import type { ResolvedAttraction, ResolvedPark } from '@/lib/blog/park-resolver';
import type { FavoriteAttraction } from '@/lib/api/favorites';
import type { AttractionStatistics } from '@/lib/api/types';
import { waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';

/**
 * Map the slim `AttractionStatistics` from the detail endpoint to the richer
 * shape `FavoriteAttraction.statistics` expects — missing fields stay null so
 * AttractionCard renders without claiming data it doesn't have. Some optional
 * fields are read best-effort via a Record cast, since the backend may include
 * more than the typed interface.
 */
export function buildFavoriteStats(
  stats: AttractionStatistics
): NonNullable<FavoriteAttraction['statistics']> {
  const extra = stats as unknown as Record<string, unknown>;
  const num = (v: unknown): number | null => (typeof v === 'number' ? v : null);
  return {
    avgWaitToday: stats.avgWaitToday ?? null,
    peakWaitToday: stats.peakWaitToday ?? null,
    peakWaitTimestamp: stats.peakWaitTimestamp ?? null,
    minWaitToday: stats.minWaitToday ?? null,
    typicalWaitThisHour: num(extra.typicalWaitThisHour),
    percentile95ThisHour: num(extra.percentile95ThisHour),
    currentVsTypical: num(extra.currentVsTypical),
    dataPoints:
      typeof extra.dataPoints === 'number' ? extra.dataPoints : (stats.history?.length ?? 0),
    history: stats.history ?? [],
    // Empty when the upstream omitted a timestamp — reading the clock here would
    // break Cache Components prerender; the field is only used for display.
    timestamp: typeof extra.timestamp === 'string' ? extra.timestamp : '',
  };
}

/**
 * Build the `FavoriteAttraction` payload that AttractionCard consumes. Prefers
 * the live `attraction.detail` resolved server-side; falls back to a minimal
 * shape (name/slug/url only) when the API call failed so the card still renders.
 */
export function buildAttractionPayload(
  park: ResolvedPark,
  attraction: ResolvedAttraction
): FavoriteAttraction {
  const detail = attraction.detail;
  const parkContext = {
    id: park.id,
    name: park.name,
    slug: park.slug,
    timezone: park.timezone ?? '',
    continent: park.continentSlug,
    country: park.countrySlug,
    city: park.city,
  };

  if (detail) {
    // Surface the ride's crowd level so AttractionCard renders the same
    // "Sehr niedrig … Extrem" CrowdLevelBadge it shows on the park page — both
    // in the inline hover card and the `?full` spotlight card. Prefer the
    // backend's per-ride level; fall back to the canonical wait-time tier (the
    // same thresholds that colour the inline wait badge) so an open ride with a
    // live wait always carries a level.
    const crowdLevel =
      attraction.crowdLevel ??
      (typeof attraction.currentWaitTime === 'number'
        ? waitTimeCrowdTier(attraction.currentWaitTime)
        : undefined);
    return {
      id: detail.id,
      name: detail.name,
      slug: detail.slug,
      url: attraction.href,
      status: detail.status,
      crowdLevel,
      queues: (detail.queues ?? []).map((q) => ({
        queueType: q.queueType,
        waitTime: 'waitTime' in q ? (q.waitTime ?? null) : null,
        status: 'status' in q ? String(q.status ?? '') : '',
      })),
      latitude: detail.latitude ?? null,
      longitude: detail.longitude ?? null,
      park: parkContext,
      statistics: detail.statistics ? buildFavoriteStats(detail.statistics) : undefined,
      bestVisitTimes: detail.bestVisitTimes ?? null,
    };
  }

  return {
    id: attraction.attractionSlug,
    name: attraction.attractionName,
    slug: attraction.attractionSlug,
    url: attraction.href,
    latitude: null,
    longitude: null,
    park: parkContext,
  };
}
