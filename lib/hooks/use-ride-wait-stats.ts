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
 * A ride the post asks for by name, in `mode="rides"`.
 *
 * `label` and `type` are author-supplied and deliberately so. A coaster's layout does not change
 * between two page loads, so "Multi-Launch, Stahl" is a stable fact that belongs in the post; the
 * MINUTES are what drifts daily and what this hook exists to stop anyone from typing by hand.
 */
export interface RideWaitTarget {
  parkSlug: string;
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
 * How many measured days a ride needs before its numbers are set against another ride's.
 *
 * `rides` MODE ONLY, and the distinction is the whole point. The API applies its own floor of 20
 * to the ranking, which is what stopped a one-day average from leading a park's top ten. This
 * second, higher floor answers a different question: a table that puts Troy next to Joris en de
 * Draak invites the reader to subtract one from the other, and the thinner number carries the
 * argument. Toverlands Maximus' Blitz Bahn tops its park's list on 61 days against 135 for
 * everything else.
 *
 * In `park` mode it would do harm. A ranking is a claim about the park, the days column states
 * each row's basis, and the posts build on exactly that: the Efteling article spends a paragraph
 * on the steam train sitting seventh "with 32 and 41 measured days, a good deal thinner than the
 * rest". Blanking those two rows deletes the thing the paragraph is about.
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
 * The rows behind every wait-time table that lists RIDES, in the two shapes posts actually write.
 *
 * `mode="park"` takes the top of one park's ranking — "the ten most-queued rides at the Efteling".
 * `mode="rides"` takes a hand-picked list that usually spans parks — "Troy against Joris en de
 * Draak". Both read the same `/stats` payload, so the two tables in one post agree with each other
 * and with the park-comparison table beside them; they used to be prose typed from a spreadsheet
 * and drifted apart within a season.
 *
 * A named ride is looked up in its park's ranking rather than fetched per ride, which is why
 * `mode="rides"` asks for the deep list: the ranking is by busiest queue, and a post comparing
 * mid-table rides would otherwise find nothing. Every ride in the four posts this replaced sits in
 * its park's top ten; 30 is the headroom for the next post that does not.
 */
export function useRideWaitStats(
  parks: readonly RideWaitPark[],
  options:
    | { mode: 'park'; limit: number; highlight?: string }
    | { mode: 'rides'; targets: readonly RideWaitTarget[] }
) {
  const depth: StatsDepth = options.mode === 'rides' ? 'deep' : 'default';
  const { stats, isPending } = useParkStatsQueries(parks, depth);

  const byParkSlug = new Map(
    parks.map((p, i) => [p.parkSlug, { park: p, stats: stats[i] ?? null }])
  );

  let rows: RideWaitRow[];
  if (options.mode === 'park') {
    const entry = parks[0] ? byParkSlug.get(parks[0].parkSlug) : undefined;
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
    // Order is the post's, never the data's: the sentence under the table ("the two Toverland
    // rides sit at the bottom, by a distance") is written against the sequence its author chose,
    // and a table that re-sorts itself when a median moves by a minute breaks that sentence
    // without touching a word of it.
    rows = options.targets.flatMap((target) => {
      const entry = byParkSlug.get(target.parkSlug);
      if (!entry) return [];
      const key = `${target.parkSlug}/${target.rideSlug}`;
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
