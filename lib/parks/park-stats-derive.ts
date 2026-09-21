import type {
  DayOfWeekStat,
  MonthStat,
  ParkHistoricalStats,
  ParkHourlyProfile,
} from '@/lib/api/types';

/**
 * What a park's two-year aggregate actually says, once the readings too thin to mean anything
 * have been taken out.
 *
 * It lived inside `use-park-comparison-stats.ts` while a blog table was its only reader. The
 * wait-time record page reads the same three findings on the SERVER, for its lead sentence, and a
 * second implementation of "the quietest weekday" is precisely what
 * `docs/rules/the-quietest-weekday-may-be-two-days-and-a-thin-day-drops-out.md` exists to
 * prevent — the refusals in {@link pickQuietestWeekday} were each measured against a real park,
 * and a copy of them would drift on the first one that gets a new one.
 *
 * Nothing here touches React or the network, so both a hook and a Server Component can read it.
 */

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

/**
 * Is there a typical-day table to draw?
 *
 * Exported because three places have to ask it and must not each decide for themselves:
 * `ParkHourlyProfileCard` (which draws nothing when the answer is no), the wait-time record's
 * hourly chapter (whose heading must not stand over nothing), and that page's method paragraph
 * about the hourly window. Two of those got it from separate expressions first, and the third
 * from `profile !== null` alone — so a park whose profile answers 200 with `displayable: false`
 * read a paragraph about a table that was not on the page.
 *
 * Same shape as the cell rule: where a count and a cell must agree, the predicate is exported
 * rather than written twice — `docs/rules/a-cell-is-gated-on-its-content-and-a-component-that-fills-one.md`.
 */
export function hasReadableHourlyProfile(
  profile: ParkHourlyProfile | null | undefined
): profile is ParkHourlyProfile {
  return !!profile && profile.meta.displayable && profile.hours.length > 0;
}

export interface ParkStatsFindings {
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
  /** The busiest month(s), 1 = January … 12 = December, ascending. Empty on the same grounds. */
  busiestMonths: number[];
  /** Median wait in those months, in minutes. */
  busiestP50: number | null;
}

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

/**
 * The busiest month(s), by the same four refusals as {@link pickQuietestWeekday} read the other
 * way round. Deliberately the same thresholds rather than a second set: both ask "is this bucket
 * of measured days comparable with the others", and the bucket is measured days either way.
 *
 * The ragged-window refusal matters more here than on the weekday table, not less. A park's
 * `byMonth` covers only the months it was open — Phantasialand answers for nine of twelve — and
 * the thin ones are its winter fringe: January on 4 measured days and December on 5, against 31
 * in August. Comparing those is a claim about two different parts of the year, so they drop out,
 * and „am vollsten im August" is measured against the months watched the same way.
 *
 * Twelve buckets rather than seven means `MIN_COMPARABLE_WEEKDAYS` is a floor and not a shape: it
 * asks that four comparable buckets remain, which for a seasonal park is the season.
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
