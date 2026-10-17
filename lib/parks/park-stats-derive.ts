import type {
  DayOfWeekStat,
  MonthStat,
  ParkHistoricalStats,
  ParkHourlyProfile,
} from '@/lib/api/types';

/**
 * What a park's two-year aggregate says once readings too thin to mean anything are taken out.
 * Shared by the blog comparison hook and the wait-time record page's server render, so there is
 * one quietest-weekday rule; free of React and the network.
 * See docs/rules/the-quietest-weekday-may-be-two-days-and-a-thin-day-drops-out.md.
 */

/** Minimum measured days before an attraction may represent a whole park. */
const MIN_SAMPLE_DAYS = 100;

/** Minimum measured days before ONE weekday's median means anything on its own. */
const MIN_WEEKDAY_SAMPLE_DAYS = 8;

/**
 * A weekday needs this share of the best-measured weekday's sample count to be compared with it;
 * a park closed on many weekdays out of season otherwise compares two parts of the year. A day
 * that fails is dropped from the candidates, not grounds to refuse the whole park.
 */
const MIN_WEEKDAY_SAMPLE_RATIO = 0.7;

/**
 * How many evenly-measured weekdays must survive before one may be called the quietest. Below four
 * there is no week to be quiet within: a weekends-only record would nominate „Sunday".
 */
const MIN_COMPARABLE_WEEKDAYS = 4;

/**
 * How many days may share the quietest value before the week reads as flat rather than as having
 * a quiet end: four tied days is a park with no quiet day.
 */
const MAX_TIED_QUIETEST_DAYS = 2;

/**
 * Is there a typical-day table to draw? Exported so the card, the record page's hourly chapter
 * heading and its method paragraph ask the same question; a 200 with `displayable: false` is no.
 * See docs/rules/a-cell-is-gated-on-its-content-and-a-component-that-fills-one.md.
 */
export function hasReadableHourlyProfile(
  profile: ParkHourlyProfile | null | undefined
): profile is ParkHourlyProfile {
  return !!profile && profile.meta.displayable && profile.hours.length > 0;
}

/** The headline findings of a park's aggregate, each `null` or empty where the data is too thin. */
export interface ParkStatsFindings {
  /** Sample-day-weighted median across all weekdays, the "park average" the posts quote. */
  parkP50: number | null;
  longestName: string | null;
  longestP50: number | null;
  /**
   * The quietest weekday(s), 0 = Sunday … 6 = Saturday, ascending; empty when naming one would
   * overstate the data (see {@link pickQuietestWeekday}). A list because a tie at whole minutes
   * is common, and two quiet days is a finding.
   */
  quietestDays: number[];
  /** Median wait on those days, in minutes. */
  quietestP50: number | null;
  /** The busiest month(s), 1 = January … 12 = December, ascending. Empty on the same grounds. */
  busiestMonths: number[];
  /** Median wait in those months, in minutes. */
  busiestP50: number | null;
}

/** The park average, longest queue, quietest weekday and busiest month an aggregate supports. */
export function deriveParkStatsFindings(stats: ParkHistoricalStats | null): ParkStatsFindings {
  if (!stats || !stats.meta.displayable) {
    return {
      parkP50: null,
      longestName: null,
      longestP50: null,
      quietestDays: [],
      quietestP50: null,
      busiestMonths: [],
      busiestP50: null,
    };
  }

  // Weighted by sample days, so a ragged window does not count a thin weekday like a full one.
  const dow = stats.byDayOfWeek ?? [];
  const days = dow.reduce((sum, d) => sum + d.sampleDays, 0);
  const parkP50 =
    days > 0
      ? Math.round(dow.reduce((sum, d) => sum + d.avgWaitP50 * d.sampleDays, 0) / days)
      : null;

  // The longest queue, only among rides watched for a while: a children's coaster on a thin basis
  // is not a figure for a whole park.
  const solid = (stats.topAttractions ?? []).filter((a) => a.sampleDays >= MIN_SAMPLE_DAYS);
  const longest = solid.reduce<(typeof solid)[number] | null>(
    (best, a) => (best === null || a.avgWaitP50 > best.avgWaitP50 ? a : best),
    null
  );

  const quietest = pickQuietestWeekday(dow, parkP50);
  const busiest = pickBusiestMonth(stats.byMonth ?? [], parkP50);

  return {
    parkP50,
    longestName: longest?.attractionName ?? null,
    longestP50: longest?.avgWaitP50 ?? null,
    quietestDays: quietest?.days ?? [],
    quietestP50: quietest?.avgWaitP50 ?? null,
    busiestMonths: busiest?.months ?? [],
    busiestP50: busiest?.avgWaitP50 ?? null,
  };
}

/**
 * The weekday(s) worth naming, or null whenever naming one would overstate the data.
 * Refuses when too few evenly-measured weekdays remain, when three or more share the minimum, or
 * when the quietest is not below the park's median. A thinly measured weekday drops out instead
 * of ending the comparison, and a two-way tie names both days.
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
  // `tied.length === comparable.length` cannot pass the median check above; stated anyway as the
  // same rule as the cap.
  if (tied.length > MAX_TIED_QUIETEST_DAYS || tied.length === comparable.length) return null;

  return { days: tied.map((d) => d.dayOfWeek).sort((a, b) => a - b), avgWaitP50 };
}

/**
 * The busiest month(s), by the same refusals and thresholds as {@link pickQuietestWeekday} read the
 * other way round. The ragged-window rule matters more here: a seasonal park's thin fringe months
 * would otherwise be compared with full summer months.
 */
function pickBusiestMonth(byMonth: readonly MonthStat[], parkP50: number | null) {
  if (parkP50 == null || byMonth.length === 0) return null;

  const usable = byMonth.filter((m) => m.sampleDays >= MIN_WEEKDAY_SAMPLE_DAYS);
  if (usable.length === 0) return null;

  const maxSamples = Math.max(...usable.map((m) => m.sampleDays));
  const comparable = usable.filter((m) => m.sampleDays >= maxSamples * MIN_WEEKDAY_SAMPLE_RATIO);
  if (comparable.length < MIN_COMPARABLE_WEEKDAYS) return null;

  const avgWaitP50 = Math.max(...comparable.map((m) => m.avgWaitP50));
  if (avgWaitP50 <= parkP50) return null;

  const tied = comparable.filter((m) => m.avgWaitP50 === avgWaitP50);
  if (tied.length > MAX_TIED_QUIETEST_DAYS || tied.length === comparable.length) return null;

  return { months: tied.map((m) => m.month).sort((a, b) => a - b), avgWaitP50 };
}

/** Where a weekday or month sits among the park's own: quieter, about usual, or busier. */
export type BestDaysTier = 'quiet' | 'middle' | 'busy';

/**
 * The park page header's answer to „when is it quiet here": each weekday's tier against the
 * park's other weekdays, and the weekdays and months at either end. Only this crosses into the
 * page, never the aggregate it came from.
 */
export interface ParkBestDays {
  /** Indexed by `dayOfWeek` (0 = Sunday); `null` where the day was measured too rarely. */
  days: (BestDaysTier | null)[];
  /**
   * The quietest of the quiet days, ascending: those within one score step of the week's minimum.
   * Empty when no day is quiet. The same rule reads `busyDays` and both month lists.
   */
  quietDays: number[];
  busyDays: number[];
  /** Months (1–12) at the quiet end, ascending; empty on the same grounds. */
  quietMonths: number[];
  busyMonths: number[];
  windowYears: number;
}

/**
 * How far a bucket's crowd score must sit from the mean of the compared buckets to be quieter or
 * busier. The mean and not the median: Phantasialand's five weekdays read 2.7 to 2.8 and ARE its
 * median, so a median-relative rule could never call them quieter than its 3.4 and 3.9 weekend.
 */
const BEST_DAYS_TIER_DISTANCE = 0.15;

/** Below this range between the quietest and busiest bucket, nothing is marked: the week is flat. */
const BEST_DAYS_FLAT_RANGE = 0.3;

/**
 * Buckets within this of the quiet or busy extreme share it. Scores arrive with one decimal, so
 * 2.7 and 2.8 may be the same reading rounded apart; one step of slack, plus float noise.
 */
const BEST_DAYS_EXTREME_TIE = 0.1 + 1e-9;

interface ScoredBucket {
  key: number;
  score: number;
  sampleDays: number;
}

interface TieredBuckets {
  tiers: Map<number, BestDaysTier>;
  quietEnd: number[];
  busyEnd: number[];
}

/**
 * Tiers the buckets against their own mean by `avgCrowdScore`, the same way in both directions.
 * A bucket is compared only when it was measured for {@link MIN_WEEKDAY_SAMPLE_DAYS} days and for
 * {@link MIN_WEEKDAY_SAMPLE_RATIO} of the median bucket's days, so a month the park opens for a few
 * days of its winter season is not set against its full summer months — on either end.
 */
function tierBuckets(buckets: readonly ScoredBucket[]): TieredBuckets {
  const tiers = new Map<number, BestDaysTier>();
  const none = { tiers, quietEnd: [], busyEnd: [] };
  const measured = buckets.filter((b) => b.sampleDays > 0).map((b) => b.sampleDays);
  if (measured.length === 0) return none;
  const sorted = [...measured].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const usable = buckets.filter(
    (b) =>
      b.sampleDays >= MIN_WEEKDAY_SAMPLE_DAYS && b.sampleDays >= median * MIN_WEEKDAY_SAMPLE_RATIO
  );
  if (usable.length < MIN_COMPARABLE_WEEKDAYS) return none;

  const scores = usable.map((b) => b.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const mean = scores.reduce((sum, v) => sum + v, 0) / scores.length;
  const flat = max - min < BEST_DAYS_FLAT_RANGE;

  for (const b of usable) {
    const tier: BestDaysTier = flat
      ? 'middle'
      : b.score <= mean - BEST_DAYS_TIER_DISTANCE
        ? 'quiet'
        : b.score >= mean + BEST_DAYS_TIER_DISTANCE
          ? 'busy'
          : 'middle';
    tiers.set(b.key, tier);
  }
  const end = (tier: BestDaysTier, extreme: number) =>
    usable
      .filter(
        (b) => tiers.get(b.key) === tier && Math.abs(b.score - extreme) <= BEST_DAYS_EXTREME_TIE
      )
      .map((b) => b.key)
      .sort((a, b) => a - b);
  return { tiers, quietEnd: end('quiet', min), busyEnd: end('busy', max) };
}

/**
 * Weekday tiers and the quiet and busy ends of the week and the year, from the aggregate's
 * `avgCrowdScore`. The score rather than the P50 wait `deriveParkStatsFindings` ranks by: waits
 * come rounded to five minutes and tie on most weekdays. Relative to the park, because the API's
 * absolute levels put six of Europa-Park's seven weekdays on „Normal". `null` when the aggregate
 * is not displayable or names no end at all.
 */
export function deriveParkBestDays(stats: ParkHistoricalStats | null): ParkBestDays | null {
  if (!stats || !stats.meta.displayable) return null;

  const week = tierBuckets(
    (stats.byDayOfWeek ?? []).map((d) => ({
      key: d.dayOfWeek,
      score: d.avgCrowdScore,
      sampleDays: d.sampleDays,
    }))
  );
  const year = tierBuckets(
    (stats.byMonth ?? []).map((m) => ({
      key: m.month,
      score: m.avgCrowdScore,
      sampleDays: m.sampleDays,
    }))
  );

  const summary: ParkBestDays = {
    days: Array.from({ length: 7 }, (_, d) => week.tiers.get(d) ?? null),
    quietDays: week.quietEnd,
    busyDays: week.busyEnd,
    quietMonths: year.quietEnd,
    busyMonths: year.busyEnd,
    windowYears: stats.meta.windowYears,
  };
  const namesAnEnd =
    summary.quietDays.length +
      summary.busyDays.length +
      summary.quietMonths.length +
      summary.busyMonths.length >
    0;
  return namesAnEnd ? summary : null;
}

/**
 * How many rows each card of the statistics chapter will draw, so its loading placeholder can
 * reserve that exact box before the client query lands. Counts and the window length only: the
 * page that has the aggregate on the server sends this, not the aggregate.
 */
export interface ParkStatsShape {
  attractions: number;
  months: number;
  weekdays: number;
  busiestDays: number;
  quietestDays: number;
  totalSampleDays: number;
}

/** {@link ParkStatsShape} of an aggregate; `null` where the chapter renders nothing at all. */
export function parkStatsShape(stats: ParkHistoricalStats | null): ParkStatsShape | null {
  if (!stats || !stats.meta.displayable) return null;
  return {
    attractions: stats.topAttractions.length,
    months: stats.byMonth.length,
    weekdays: stats.byDayOfWeek.length,
    busiestDays: stats.busiestDays?.length ?? 0,
    quietestDays: stats.quietestDays?.length ?? 0,
    totalSampleDays: stats.meta.totalSampleDays,
  };
}
