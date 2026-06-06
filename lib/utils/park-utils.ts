import type { ParkAttraction, ParkWithAttractions } from '@/lib/api/types';

/**
 * Strip the heavy, live per-attraction fields before a park is used as the LiveParkData SSR seed.
 *
 * The park page renders the attraction-grid STRUCTURE (name, link, land, headliner/seasonal badges)
 * server-side for SEO, but the volatile data — wait times (`queues`), `status`, crowd level, the
 * `statistics`/sparkline and `bestVisitTimes` — is refetched on the client by `useLiveParkData`
 * (initialDataUpdatedAt: 0) and must not be baked into the per-locale ISR output. Those arrays are
 * the bulk of the ~130 KB park payload (statistics ≈ 28 KB, bestVisitTimes ≈ 15 KB, queues ≈ 11 KB
 * across a big park), and they're rendered into per-card sparklines/badges on top — so dropping them
 * from the seed sharply shrinks the park page's size-weighted ISR write units. The live /api/parks
 * proxy still returns the FULL park, so the client overlay is unaffected.
 */
export function leanParkSeed(park: ParkWithAttractions): ParkWithAttractions {
  return {
    ...park,
    attractions: park.attractions.map((a) => {
      const lean = { ...a } as ParkAttraction & Record<string, unknown>;
      // Heavy / live — re-supplied by the client refetch.
      delete lean.statistics;
      delete lean.queues;
      delete lean.bestVisitTimes;
      delete lean.status;
      delete lean.crowdLevel;
      delete lean.currentLoad;
      delete lean.trend;
      delete lean.history;
      delete lean.hourlyForecast;
      delete lean.predictionAccuracy;
      // Non-typed extras some backends include — never read by the frontend.
      delete lean.effectiveStatus;
      delete lean.baseline;
      delete lean.comparison;
      return lean;
    }),
  };
}

/**
 * Groups attractions by their land name.
 * Attractions without a land fall back to `fallbackName`.
 * Attractions within each land are sorted alphabetically.
 */
export function groupAttractionsByLand(
  attractions: ParkAttraction[],
  fallbackName: string = 'Other Attractions'
): Record<string, ParkAttraction[]> {
  const grouped: Record<string, ParkAttraction[]> = {};

  attractions.forEach((attraction) => {
    const landName = attraction.land || fallbackName;
    if (!grouped[landName]) {
      grouped[landName] = [];
    }
    grouped[landName].push(attraction);
  });

  Object.keys(grouped).forEach((land) => {
    grouped[land].sort((a, b) => a.name.localeCompare(b.name));
  });

  return grouped;
}
