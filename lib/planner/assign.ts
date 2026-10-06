import type { CrowdLevel } from '@/lib/api/types';
import { addDays } from './park-time';

/**
 * Which park goes on which day of a trip, by the crowd each day is forecast to have.
 *
 * The single-day optimiser (`optimize.ts`) orders rides inside ONE park-day. This is the
 * level above it, and it is pure: dates and levels in, dates and parks out, no clock and no
 * store, so `pnpm test:planner-assignment` runs it on fixtures.
 *
 * The rules are the PO's decision on PAR-9, and each one has a reason:
 *
 * - **A day is a slot for one park.** A day already in the plan (`fixed`, any park) is
 *   occupied, and is never moved.
 * - **`closed` is never proposed.** A day the park is shut is not a quiet day.
 * - **`unknown` ranks behind every known level.** No forecast is not a low crowd. A park only
 *   gets such a day when nothing better is free, and the caller says so on the row.
 * - **Parks of one country lie together as a block.** With `travelDays` on, a change of
 *   country needs a free day between the two days, against the plan's own days as well.
 *   There is no distance or travel time in here: a country is the only grouping the plan
 *   stores (`PlannerGeo`, no coordinates).
 * - **A second day is offered where the first is `high` or worse**, on the day before or after,
 *   when that day is free, open, forecast and breaks no rule above. It is not part of the
 *   optimisation: the first days are chosen for the lowest crowd, the extras are chosen from
 *   what is left.
 */

export type AssignCrowd = CrowdLevel | 'closed';

/** Lower is quieter. `unknown` sits above `extreme` on purpose: see the file comment. */
const RANK: Record<Exclude<AssignCrowd, 'closed'>, number> = {
  very_low: 0,
  low: 1,
  moderate: 2,
  high: 3,
  very_high: 4,
  extreme: 5,
  unknown: 6,
};

/** The first level at which a park is offered a second day. */
const SECOND_DAY_FROM_RANK = RANK.high;

/** A park left without a day costs more than any crowd level can. */
const UNPLACED_PENALTY = 100;

/**
 * The search is exact over the window and the parks below. Past them a trip is not one
 * question any more, and the caller trims to these rather than waiting on a search that grows
 * with both.
 */
export const MAX_ASSIGN_DAYS = 31;
export const MAX_ASSIGN_PARKS = 8;

export interface AssignPark {
  slug: string;
  /** Parks that share it lie together. Compared as a string, so the caller passes one slug form. */
  country: string;
  /** Date → the day's forecast. A date that is absent has none, and reads as `unknown`. */
  levels: ReadonlyMap<string, AssignCrowd>;
}

/** A day the plan already holds, in whichever park. */
export interface AssignFixedDay {
  date: string;
  country: string;
}

export interface AssignInput {
  parks: readonly AssignPark[];
  /** The window, first and last day included. */
  from: string;
  to: string;
  fixed: readonly AssignFixedDay[];
  /** Whether a change of country needs a free day. On by default in the assistant. */
  travelDays: boolean;
}

export interface AssignedDay {
  date: string;
  parkSlug: string;
  level: AssignCrowd;
  /** True for the extra day offered beside a busy first day. */
  second: boolean;
}

export interface AssignResult {
  /** In date order. */
  days: AssignedDay[];
  /** Parks that got no day: too few free days, or no day the park is open. */
  unplaced: string[];
}

/**
 * Sort rank of a crowd level for the trip assignment: `very_low` is 0, `unknown` ranks behind
 * `extreme`, and `closed` is infinite.
 */
export function crowdRank(level: AssignCrowd): number {
  return level === 'closed' ? Number.POSITIVE_INFINITY : RANK[level];
}

/** The forecast for one park and date, `unknown` where the snapshot has none. */
export function levelOn(park: AssignPark, date: string): AssignCrowd {
  return park.levels.get(date) ?? 'unknown';
}

/** Every date from `from` to `to`, at most {@link MAX_ASSIGN_DAYS}. Empty when `to` is before `from`. */
export function windowDates(from: string, to: string): string[] {
  const out: string[] = [];
  for (let date = from; date <= to && out.length < MAX_ASSIGN_DAYS; date = addDays(date, 1)) {
    out.push(date);
  }
  return out;
}

interface Best {
  cost: number;
  /** Index of the park placed on this date, or -1 for a free day. */
  park: number;
}

function popcount(mask: number): number {
  let n = 0;
  for (let m = mask; m > 0; m &= m - 1) n += 1;
  return n;
}

/**
 * Gives each park of a trip the quietest free day in the window under the rules above, adds a
 * second day beside busy ones, and lists the parks that got none.
 */
export function assignParks(input: AssignInput): AssignResult {
  const dates = windowDates(input.from, input.to);
  const parks = input.parks.slice(0, MAX_ASSIGN_PARKS);
  const overflow = input.parks.slice(MAX_ASSIGN_PARKS).map((park) => park.slug);

  const fixedCountry = new Map<string, string>();
  for (const day of input.fixed) fixedCountry.set(day.date, day.country);

  // Only a country with two or more parks can be left and re-entered, so only those need a bit.
  const perCountry = new Map<string, number>();
  for (const park of parks) perCountry.set(park.country, (perCountry.get(park.country) ?? 0) + 1);
  const bitOf = new Map<string, number>();
  for (const [country, count] of perCountry) {
    if (count > 1) bitOf.set(country, 1 << bitOf.size);
  }

  const memo = new Map<string, Best>();

  /**
   * @param prev Country of the previous date, or `null` when it was free.
   * @param last Country of the last park placed, whatever the gap since.
   * @param left The multi-park countries already left behind.
   */
  function solve(
    i: number,
    mask: number,
    prev: string | null,
    last: string | null,
    left: number
  ): number {
    if (i === dates.length) return UNPLACED_PENALTY * (parks.length - popcount(mask));

    const key = `${i}|${mask}|${prev ?? ''}|${last ?? ''}|${left}`;
    const known = memo.get(key);
    if (known) return known.cost;

    const date = dates[i];
    const fixed = fixedCountry.get(date);
    let best: Best;

    if (fixed !== undefined) {
      best = { cost: solve(i + 1, mask, fixed, last, left), park: -1 };
    } else {
      best = { cost: Number.POSITIVE_INFINITY, park: -1 };
      const nextFixed = fixedCountry.get(addDays(date, 1));

      for (let p = 0; p < parks.length; p += 1) {
        if (mask & (1 << p)) continue;
        const park = parks[p];
        const level = levelOn(park, date);
        if (level === 'closed') continue;
        if (input.travelDays) {
          if (prev !== null && prev !== park.country) continue;
          if (nextFixed !== undefined && nextFixed !== park.country) continue;
        }
        const enters = bitOf.get(park.country) ?? 0;
        if (enters & left) continue;
        const leaves = last !== null && last !== park.country ? (bitOf.get(last) ?? 0) : 0;

        const cost =
          crowdRank(level) +
          solve(i + 1, mask | (1 << p), park.country, park.country, left | leaves);
        // Strictly less, and placing is tried before skipping: a tie keeps the earlier day.
        if (cost < best.cost) best = { cost, park: p };
      }

      const skip = solve(i + 1, mask, null, last, left);
      if (skip < best.cost) best = { cost: skip, park: -1 };
    }

    memo.set(key, best);
    return best.cost;
  }

  const start = dates.length > 0 ? (fixedCountry.get(addDays(dates[0], -1)) ?? null) : null;
  solve(0, 0, start, null, 0);

  // Walk the choices the search kept. Re-deriving the state along the way is what the
  // memo key is made of, so the walk and the search cannot disagree.
  const days: AssignedDay[] = [];
  let mask = 0;
  let prev: string | null = start;
  let last: string | null = null;
  let left = 0;
  for (let i = 0; i < dates.length; i += 1) {
    const fixed = fixedCountry.get(dates[i]);
    if (fixed !== undefined) {
      prev = fixed;
      continue;
    }
    const choice = memo.get(`${i}|${mask}|${prev ?? ''}|${last ?? ''}|${left}`);
    if (!choice || choice.park < 0) {
      prev = null;
      continue;
    }
    const park = parks[choice.park];
    if (last !== null && last !== park.country) left |= bitOf.get(last) ?? 0;
    mask |= 1 << choice.park;
    prev = park.country;
    last = park.country;
    days.push({
      date: dates[i],
      parkSlug: park.slug,
      level: levelOn(park, dates[i]),
      second: false,
    });
  }

  const placed = new Set(days.map((day) => day.parkSlug));
  const unplaced = [
    ...parks.map((park) => park.slug).filter((slug) => !placed.has(slug)),
    ...overflow,
  ];

  return {
    days: addSecondDays(days, parks, fixedCountry, dates, input.travelDays),
    unplaced,
  };
}

/**
 * The extra day beside every first day that is `high` or worse.
 *
 * Busiest first, so where two parks want the same free day the one with the longer queues
 * gets it. A candidate has to be free, forecast and open, and it may not sit next to a day of
 * another country when a change of country needs a gap.
 */
function addSecondDays(
  firsts: AssignedDay[],
  parks: readonly AssignPark[],
  fixedCountry: ReadonlyMap<string, string>,
  dates: readonly string[],
  travelDays: boolean
): AssignedDay[] {
  const inWindow = new Set(dates);
  const parkBySlug = new Map(parks.map((park) => [park.slug, park]));
  const countryOn = new Map<string, string>(fixedCountry);
  for (const day of firsts) countryOn.set(day.date, parkBySlug.get(day.parkSlug)!.country);

  const out: AssignedDay[] = [...firsts];
  const busy = firsts
    .filter((day) => crowdRank(day.level) >= SECOND_DAY_FROM_RANK && day.level !== 'unknown')
    .sort((a, b) => crowdRank(b.level) - crowdRank(a.level) || a.date.localeCompare(b.date));

  for (const first of busy) {
    const park = parkBySlug.get(first.parkSlug)!;
    let pick: { date: string; level: AssignCrowd } | null = null;

    for (const date of [addDays(first.date, -1), addDays(first.date, 1)]) {
      if (!inWindow.has(date) || countryOn.has(date)) continue;
      const level = levelOn(park, date);
      if (level === 'closed' || level === 'unknown') continue;
      if (travelDays) {
        // The far side of the candidate: the day after the pair, or the day before it.
        const outer = countryOn.get(addDays(date, date > first.date ? 1 : -1));
        if (outer !== undefined && outer !== park.country) continue;
      }
      if (pick === null || crowdRank(level) < crowdRank(pick.level)) pick = { date, level };
    }

    if (pick) {
      countryOn.set(pick.date, park.country);
      out.push({ date: pick.date, parkSlug: park.slug, level: pick.level, second: true });
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date));
}
