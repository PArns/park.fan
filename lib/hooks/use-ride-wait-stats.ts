import {
  useParkStatsQueries,
  type ParkStatsTarget,
  type StatsDepth,
} from '@/lib/hooks/use-park-stats-queries';
import type { ParkHistoricalStats, TopAttractionStat } from '@/lib/api/types';

/** One park a table draws rows from, resolved on the server before it reaches the browser. */
export interface RideWaitPark extends ParkStatsTarget {
  /** Display name for the park column. */
  name: string;
  /** Frontend href for the park page. */
  href: string;
  /** `/parks/<continent>/<country>/<city>/<parkSlug>` — the prefix a ride href is built on. */
  basePath: string;
}

/**
 * A ride the post asks for by name, in `mode="rides"`. `label` and `type` are author-supplied: a
 * ride's type is a stable fact that belongs in the post, the minutes are what drift.
 */
export interface RideWaitTarget {
  /**
   * The park's `basePath`, not its slug: a bare park slug is not unique (`disneyland-park` is
   * Paris and Anaheim).
   */
  parkKey: string;
  rideSlug: string;
  /** Overrides the API's ride name. Use for a park that publishes "WODAN - Timburcoaster". */
  label?: string;
  /** Free-text ride type shown in the optional type column. */
  type?: string;
  /** Renders bold. Usually the post's own ride. */
  highlight?: boolean;
}

export interface RideWaitRow {
  /** `parkSlug/rideSlug`, unique within a table and used as the React key. */
  key: string;
  name: string;
  href: string;
  parkName: string;
  parkHref: string;
  land: string | null;
  type: string | null;
  p50: number | null;
  p90: number | null;
  sampleDays: number | null;
  highlight: boolean;
}

/**
 * How many measured days a ride needs before its numbers are set against another ride's, in
 * `rides` mode only: a side-by-side table invites subtraction, and the thinner number carries the
 * argument. In `park` mode the API's own floor of 20 is enough, because a ranking states each
 * row's days and posts discuss exactly those thin rows.
 */
const MIN_COMPARABLE_SAMPLE_DAYS = 60;

function findStat(
  stats: ParkHistoricalStats | null,
  rideSlug: string
): TopAttractionStat | undefined {
  return stats?.topAttractions?.find((a) => a.attractionSlug === rideSlug);
}

function toRow(
  key: string,
  park: RideWaitPark,
  rideSlug: string,
  stat: TopAttractionStat | undefined,
  overrides: { label?: string; type?: string; highlight?: boolean },
  minSampleDays: number
): RideWaitRow {
  // A ride below the floor keeps its row — the post named it, so dropping it silently would leave
  // an argument pointing at nothing — but shows dashes rather than numbers nobody should compare.
  const solid = stat != null && stat.sampleDays >= minSampleDays;
  return {
    key,
    name: overrides.label ?? stat?.attractionName ?? rideSlug,
    href: `${park.basePath}/${rideSlug}`,
    parkName: park.name,
    parkHref: park.href,
    land: stat?.land ?? null,
    type: overrides.type ?? stat?.attractionType ?? null,
    p50: solid ? stat!.avgWaitP50 : null,
    p90: solid ? stat!.avgWaitP90 : null,
    sampleDays: stat?.sampleDays ?? null,
    highlight: overrides.highlight ?? false,
  };
}

/**
 * The rows behind every wait-time table that lists rides: `mode="park"` takes the top of one
 * park's ranking, `mode="rides"` a hand-picked list that usually spans parks. Both read the same
 * `/stats` payload, so the tables in one post agree. A named ride is looked up in its park's
 * ranking, which is why `rides` asks for the deep list. See
 * docs/rules/a-wait-time-is-never-typed-into-a-post.md.
 */
export function useRideWaitStats(
  parks: readonly RideWaitPark[],
  options:
    | { mode: 'park'; limit: number; highlight?: string }
    | { mode: 'rides'; targets: readonly RideWaitTarget[] }
) {
  const depth: StatsDepth = options.mode === 'rides' ? 'deep' : 'default';
  const { stats, isPending } = useParkStatsQueries(parks, depth);

  // Keyed by `basePath` (`/parks/<continent>/<country>/<city>/<park>`), which is unique, rather
  // than by the park slug, which is not.
  const byParkKey = new Map(
    parks.map((p, i) => [p.basePath, { park: p, stats: stats[i] ?? null }])
  );

  let rows: RideWaitRow[];
  if (options.mode === 'park') {
    const entry = parks[0] ? byParkKey.get(parks[0].basePath) : undefined;
    rows = (entry?.stats?.topAttractions ?? []).slice(0, options.limit).map((stat) =>
      toRow(
        `${entry!.park.parkSlug}/${stat.attractionSlug}`,
        entry!.park,
        stat.attractionSlug,
        stat,
        { highlight: options.highlight === stat.attractionSlug },
        // The API already refused everything under 20 days before ranking it; this mode adds
        // nothing on top. See MIN_COMPARABLE_SAMPLE_DAYS.
        0
      )
    );
  } else {
    // Order is the post's, never the data's: the sentence under the table is written against the
    // sequence its author chose.
    rows = options.targets.flatMap((target) => {
      const entry = byParkKey.get(target.parkKey);
      if (!entry) return [];
      const key = `${target.parkKey}/${target.rideSlug}`;
      return [
        toRow(
          key,
          entry.park,
          target.rideSlug,
          findStat(entry.stats, target.rideSlug),
          target,
          MIN_COMPARABLE_SAMPLE_DAYS
        ),
      ];
    });
  }

  return {
    rows,
    isPending,
    /** True when at least one row knows its land — the column is hidden otherwise, since a park
     *  that publishes no lands would get a column of dashes. */
    hasLand: rows.some((r) => r.land != null),
    /** Same for the type column. */
    hasType: rows.some((r) => r.type != null),
  };
}
