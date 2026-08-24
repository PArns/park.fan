import { useParkStatsQueries } from '@/lib/hooks/use-park-stats-queries';
import type { DayOfWeekStat, ParkHistoricalStats } from '@/lib/api/types';

export interface ComparisonPark {
  /** Blog slug, only used as a React key and for the queryKey. */
  slug: string;
  /** Display name — curated in the post, since the API name is the raw one ("WODAN - Timburcoaster"). */
  name: string;
  /** Frontend href for the park page. */
  href: string;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  /** Renders bold. The post's own park. */
  highlight?: boolean;
}

export interface ComparisonRow extends ComparisonPark {
  /** Sample-day-weighted median across all weekdays, the "park average" the posts quote. */
  parkP50: number | null;
  longestName: string | null;
  longestP50: number | null;
  /**
   * The quietest weekday(s), 0 = Sunday … 6 = Saturday, ascending. Empty when
   * naming one would overstate the data — see {@link pickQuietestWeekday}.
   *
   * A LIST, not one day, because a tie at whole minutes is the single most
   * common reason a park had no answer here: Disneyland Paris measures 32 on
   * both Sunday and Wednesday, Heide Park 15 on Sunday and Friday. The old
   * rule refused all three rather than pick by sort order — which was right
   * about the pick and wrong about the refusal. Two quiet days is the finding.
   */
  quietestDays: number[];
  /** Median wait on those days, in minutes. */
  quietestP50: number | null;
}

/**
 * The `/stats` payload for one park is ~3 KB, so seven of them cost ~21 KB — measured, and
 * the reason this widget exists client-side at all while an hourly-profile equivalent does not
 * (8 × 53 KB, of which 45 % is `schedule` nobody renders). See docs/architecture/api-budget.md.
 *
 * The fetching itself lives in `useParkStatsQueries`, shared with the ride-wait tables: the query
 * key, the stale window and the loads-last gate had to agree in three files for two tables on one
 * page to share a cache entry rather than fetch the same park twice.
 */
export function useParkComparisonStats(parks: readonly ComparisonPark[]) {
  const { stats, isPending } = useParkStatsQueries(parks);

  const rows: ComparisonRow[] = parks.map((p, i) => ({ ...p, ...deriveRow(stats[i] ?? null) }));

  return { rows, isPending };
}

/** Minimum measured days before an attraction may represent a whole park. */
const MIN_SAMPLE_DAYS = 100;

/** Minimum measured days before ONE weekday's median means anything on its own. */
const MIN_WEEKDAY_SAMPLE_DAYS = 8;

/**
 * A weekday needs this share of the best-observed weekday's sample count to be compared with it.
 * Movie Park closes on many weekdays out of season, so its Mondays carry 13 measured days against
 * 22 Sundays — comparing those two is a claim about two different parts of the year.
 *
 * The day that fails this is DROPPED from the candidate set, not taken as grounds to refuse the
 * whole park: the remaining weekdays are still comparable with each other, and "the quietest of
 * the days we watched evenly" is a true sentence. Refusing outright emptied the column for Movie
 * Park, Heide Park, Walibi Belgium and Walibi Holland — four of the eighteen parks this table is
 * ever asked about — while the six or four days it did have said the same thing all along.
 */
const MIN_WEEKDAY_SAMPLE_RATIO = 0.7;

/**
 * How many evenly-measured weekdays must survive before one of them may be called the quietest.
 * Below four there is no week left to be quiet within — a park watched on Saturdays and Sundays
 * only would otherwise nominate "Sunday" as its quiet day.
 */
const MIN_COMPARABLE_WEEKDAYS = 4;

/**
 * How many days may share the quietest value before the week reads as flat rather than as having
 * a quiet end. Disney Adventure World measures 39 minutes on Sunday, Monday, Friday AND Saturday:
 * that is not four quiet days, that is a park with no quiet day.
 */
const MAX_TIED_QUIETEST_DAYS = 2;

function deriveRow(stats: ParkHistoricalStats | null): {
  parkP50: number | null;
  longestName: string | null;
  longestP50: number | null;
  quietestDays: number[];
  quietestP50: number | null;
} {
  if (!stats || !stats.meta.displayable) {
    return {
      parkP50: null,
      longestName: null,
      longestP50: null,
      quietestDays: [],
      quietestP50: null,
    };
  }

  // Weight by sample days rather than averaging the seven weekday medians flat: a Sunday with
  // 23 measured days must not count the same as a Tuesday with 22 when the window is ragged.
  const dow = stats.byDayOfWeek ?? [];
  const days = dow.reduce((sum, d) => sum + d.sampleDays, 0);
  const parkP50 =
    days > 0
      ? Math.round(dow.reduce((sum, d) => sum + d.avgWaitP50 * d.sampleDays, 0) / days)
      : null;

  // The longest queue in the park, but only among rides we have actually watched for a while.
  // Toverland's Maximus' Blitz Bahn tops its list on 61 days — a children's coaster on a thin
  // basis is not a figure for a whole park.
  const solid = (stats.topAttractions ?? []).filter((a) => a.sampleDays >= MIN_SAMPLE_DAYS);
  const longest = solid.reduce<(typeof solid)[number] | null>(
    (best, a) => (best === null || a.avgWaitP50 > best.avgWaitP50 ? a : best),
    null
  );

  const quietest = pickQuietestWeekday(dow, parkP50);

  return {
    parkP50,
    longestName: longest?.attractionName ?? null,
    longestP50: longest?.avgWaitP50 ?? null,
    quietestDays: quietest?.days ?? [],
    quietestP50: quietest?.avgWaitP50 ?? null,
  };
}

/**
 * The weekday(s) worth naming, or null whenever naming one would overstate the data.
 *
 * Four refusals, each of which fired on a real park: a weekday measured too rarely to stand on
 * its own, too few evenly-measured weekdays left to have a quiet end at all, a week so flat that
 * three or more days share its minimum, and a "quietest" day that is not actually below the
 * park's own median.
 *
 * Two of those used to be three. Refusing on a tie was correct as far as it went — the sort order
 * decides, not the data — but the conclusion was wrong: when Sunday and Wednesday both measure 32
 * at Disneyland Paris, the finding is that the park has two quiet days, not that it has none. And
 * a raggedly-measured weekday now drops out of the comparison instead of ending it.
 */
function pickQuietestWeekday(dow: readonly DayOfWeekStat[], parkP50: number | null) {
  if (parkP50 == null || dow.length < 7) return null;

  const usable = dow.filter((d) => d.sampleDays >= MIN_WEEKDAY_SAMPLE_DAYS);
  if (usable.length === 0) return null;

  const maxSamples = Math.max(...usable.map((d) => d.sampleDays));
  const comparable = usable.filter((d) => d.sampleDays >= maxSamples * MIN_WEEKDAY_SAMPLE_RATIO);
  if (comparable.length < MIN_COMPARABLE_WEEKDAYS) return null;

  const avgWaitP50 = Math.min(...comparable.map((d) => d.avgWaitP50));
  if (avgWaitP50 >= parkP50) return null;

  const tied = comparable.filter((d) => d.avgWaitP50 === avgWaitP50);
  // `tied.length === comparable.length` cannot happen once the median check above has passed, but
  // it is the same statement as the cap and costs nothing to say out loud.
  if (tied.length > MAX_TIED_QUIETEST_DAYS || tied.length === comparable.length) return null;

  return { days: tied.map((d) => d.dayOfWeek).sort((a, b) => a - b), avgWaitP50 };
}
