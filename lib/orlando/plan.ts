import { parkGeoFromUrl } from '@/lib/planner/park-url';
import type { PlannerGeo } from '@/lib/planner/types';
import { addDays, daysBetween } from '@/lib/utils/park-day';
import {
  MAX_PLAN_VISITS,
  MAX_TRIP_DAYS,
  MAX_VISITS_PER_PARK,
  MIN_FIND_DAYS,
  DEFAULT_FIND_DAYS,
  normalizePlanState,
  planQueryEntries,
  type OrlandoPlanState,
  type PlanHotel,
  type PlanLock,
  type PlanParkPick,
  type PlanSearchRange,
} from './plan-query';
import type { TicketLink, TripBasis, TripCrowdLevel, TripPerk, TripRegionPark } from './types';

export * from './plan-query';

/**
 * The `/plan` answer and what the planner does with a state: the trip's arithmetic, the edits
 * (steppers, hotel, pins, swaps), and filing a plan into the day planner. Pure, and free of React,
 * so `scripts/test-orlando-plan.mjs` checks it without a browser. The state and its URL form are
 * in `plan-query.ts`, re-exported here. The contract behind every field: the API's
 * `docs/frontend/trip-regions.md`.
 */

// ── The answer ────────────────────────────────────────────────────────────────

/** What a trip day is: a travel day without a park, a park day, two parks, or a day off. */
export type PlanDayKind = 'arrival' | 'park' | 'hop' | 'rest' | 'departure';

/** A leg as a plan day carries it: hotel area to the day's park, or between a hop day's parks. */
export interface PlanTravel {
  from: string;
  to: string;
  km?: number;
  minutes: number;
  mode: 'drive' | 'walk' | 'bus';
  /** Where a drive ends short of the gate (`ttc`, `garage_shuttle`). */
  via?: string;
  /** The curated rest of the way from that car park to the gate. */
  transferMinutes?: number;
}

/** One park on a plan day; a hop day's two halves carry their own figures. */
export interface PlanParkVisit {
  slug: string;
  part: 'full' | 'half';
  headlinerWait?: number;
  crowdLevel?: TripCrowdLevel;
  basis?: TripBasis;
  perks?: TripPerk[];
  closesEarly?: boolean;
  dayGuestCloseAt?: string;
}

/**
 * One day of the trip. `reasons` and `warnings` are codes the API may add to: one this client does
 * not know is skipped (`lib/orlando/plan-copy.ts`), never shown raw.
 */
export interface PlanDay {
  date: string;
  kind: PlanDayKind;
  parks: PlanParkVisit[];
  headlinerWait?: number;
  crowdLevel?: TripCrowdLevel;
  basis?: TripBasis;
  perks?: TripPerk[];
  travel?: PlanTravel;
  between?: PlanTravel;
  /**
   * The day guests leave earlier than on the park's usual day here (a party night, a short
   * schedule); `dayGuestCloseAt` is when, park-local ISO. The plan's cost already counts the hours.
   */
  closesEarly?: boolean;
  dayGuestCloseAt?: string;
  /** An evening after the park, with `evenings=1` and a park that closes early. */
  evening?: PlanEvening;
  /** The owned ticket's id (`t1`) or a suggestion's (`suggested:<resort>`) the day is on. */
  ticket?: string;
  /** The day's number on that ticket; on an every-day ticket the day of its window. */
  ticketDay?: number;
  /** A water-park visit on the ticket's allowance: no ticket day used. */
  ticketAllowance?: boolean;
  reasons: string[];
  warnings: string[];
}

/** One day of a hopper comparison: the two parks of a hop day, or the day's park and the evening's. */
export interface PlanHopperDay {
  date: string;
  parks: string[];
}

/**
 * What the hopper option adds to a resort's days, from the plan made a second time with it. The API
 * recommends it only for an evening hop, a park that fits only with it, or 3 minutes a ride.
 */
export interface PlanHopperVerdict {
  recommended: boolean;
  savedMinutes?: number;
  savedMinutesPerRide?: number;
  hopDays?: number;
  eveningHops?: number;
  fitsMoreParks?: number;
  hopDayList?: PlanHopperDay[];
  eveningHopList?: PlanHopperDay[];
  /** The parks of the visits only the hopper places, a park once per visit. */
  fitsOnlyWithHopper?: string[];
  why: string[];
}

/** An owned ticket as the plan used it (`meta.tickets[]`), in the order of `tickets=`. */
export interface PlanOwnedTicket {
  /** `t1` … `t6`. */
  id: string;
  product: string;
  /** Absent for a pass. */
  days?: number;
  /** `unknown` for `.h?`, planned without the hopper; `hopperVerdict` then says what it would add. */
  hopper: boolean | 'unknown';
  hopperVerdict?: PlanHopperVerdict;
  start?: string;
  /** The window's last day; absent for a pass. */
  end?: string;
  /** The plan picked the start, where the link gave none. */
  startChosen?: boolean;
  usedDays: number;
  /** Days left over; absent when none, for a pass and for an every-day ticket. */
  unusedDays?: number;
  unusedReason?: string;
  /** An every-day ticket's window, which it has instead of days to count off. */
  windowDays?: number;
  allowanceVisits?: number;
  /** `product_archived` among them when the product left the catalog. */
  warnings?: string[];
  links?: TicketLink[];
  shopUrl?: string;
}

/** A product another ticket could be, in a suggestion: a UK 14-day ticket, a promotion. */
export interface PlanTicketAlternative {
  product: string;
  days?: number;
  markets?: string[];
  reason: string;
}

/** Plan first: the ticket a resort's planned days need (`meta.ticketSuggestion[]`). */
export interface PlanTicketSuggestion {
  /** `suggested:<resort>`, a second one `suggested:<resort>:2`. */
  id: string;
  resort: string;
  product: string;
  days: number;
  start: string;
  end: string;
  /** How many days the ticket has beyond the park days, where rest days stretch the window. */
  extraDays?: number;
  parks: string[];
  /** Products with an optional hopper: what it would add. */
  hopper?: PlanHopperVerdict;
  shopUrl?: string;
  /** Where to buy it, in the admin's order. */
  links?: TicketLink[];
  alternatives?: PlanTicketAlternative[];
  /** Owned tickets of the resort that do not cover these parks. */
  notCoveredBy?: string[];
}

/** A highlight of an evening, as the plan names it. */
export interface PlanEveningHighlight {
  kind: 'night_show' | 'fireworks' | 'fireworks_view' | 'dining' | 'shopping';
  name?: string;
  /** Park-local ISO or `HH:MM`. */
  at?: string;
}

/**
 * After a park that closes early for day guests: an evening at a second park (`hop`, with a hopper
 * ticket) or at a venue (Disney Springs, CityWalk), with why and how to get there.
 */
export interface PlanEvening {
  kind: 'hop' | 'venue';
  /** The park slug of a `hop` evening. */
  park?: string;
  /** The venue key of a `venue` evening (`region.venues`). */
  venue?: string;
  /** Park-local ISO or `HH:MM`. */
  from: string;
  to: string;
  travel?: { minutes: number; mode: string; via?: string };
  highlights?: PlanEveningHighlight[];
  reasons: string[];
  /** Other evenings that would do. */
  alternatives?: Array<{ kind?: 'hop' | 'venue'; park?: string; venue?: string }>;
}

/** Another day of the trip a park could have had, best first. */
export interface PlanAlternative {
  date: string;
  headlinerWait?: number;
  crowdLevel?: TripCrowdLevel;
}

/** Where each chosen park ended up, and the days it could have had instead. */
export interface PlanParkSummary {
  slug: string;
  dates: string[];
  alternatives: PlanAlternative[];
}

/**
 * The plan against an average day, per headliner ride and never per day or per trip.
 * `orderMatters` is false when the gap is within the forecast's own error, `expectedError` that
 * error in minutes where the API has one.
 */
export interface PlanTotals {
  headlinerWait?: number;
  averageDayWait?: number;
  savedMinutesPerRide?: number;
  expectedError?: number;
  orderMatters?: boolean;
  /** What heat and the hurricane season added to the ranking, minutes per park day. */
  penalties?: { heat?: number; hurricane?: number };
  parkDays: number;
  restDays: number;
  visits: number;
}

/** The frame of a plan; `relaxed` names the rules it had to loosen. */
export interface PlanMeta {
  region: string;
  from: string;
  to: string;
  computedAt: string;
  objective: string;
  exact: boolean;
  relaxed?: string[];
  /**
   * The parks `split=auto` gave more than one visit, and how many; `ticket` names the owned ticket
   * whose days the second visit uses.
   */
  split?: Array<{ slug: string; visits: number; auto?: boolean; ticket?: string }>;
  warnings?: string[];
  /** Plan first's option for the parks no owned ticket covers. */
  ticket?: 'base' | 'hopper';
  /** The plan-first resorts planned with the hopper. */
  hopper?: string[];
  tickets?: PlanOwnedTicket[];
  ticketSuggestion?: PlanTicketSuggestion[];
  /**
   * With owned tickets: whether their resorts mix inside the windows, and what mixing saves per ride
   * against keeping them in blocks (absent where `blocks` was written).
   */
  mixing?: { used: boolean; savedMinutesPerRide?: number };
  /** The catalog version the plan was made with. */
  ticketCatalog?: string;
}

/** `GET /v1/trip-regions/orlando/plan`: one entry per trip day, arrival and departure included. */
export interface TripPlan {
  meta: PlanMeta;
  days: PlanDay[];
  parks: PlanParkSummary[];
  totals: PlanTotals;
  unplaced: Array<{ slug: string; reason: string }>;
  ignoredLocks?: Array<{ lock: string; reason: string }>;
}

/**
 * The `/plan` request's query, or `null` while the plan cannot be asked for: no dates yet, or a
 * problem {@link planProblem} names, which the API would answer with a 400. With the catalog, a
 * ticket the dates miss (`ticketProblem` in `plan-tickets.ts`) holds the request back as well.
 */
export function planRequestQuery(
  state: OrlandoPlanState,
  headliners: readonly string[],
  ticketBlocked = false
): Record<string, string> | null {
  if (state.when || ticketBlocked || planProblem(state, headliners)) return null;
  return Object.fromEntries(planQueryEntries(state));
}

// ── Trip arithmetic ──────────────────────────────────────────────────────────

/** Every date of the trip, both ends included; empty without both dates. */
export function tripDates(state: Pick<OrlandoPlanState, 'from' | 'to'>): string[] {
  if (!state.from || !state.to) return [];
  const n = daysBetween(state.from, state.to) + 1;
  if (n < 1) return [];
  return Array.from({ length: n }, (_, i) => addDays(state.from as string, i));
}

/** Days a park can go on: the trip, less a free arrival and a free departure day. */
export function parkDaysAvailable(
  state: Pick<OrlandoPlanState, 'from' | 'to' | 'arrival' | 'departure' | 'locks'>
): number {
  const dates = tripDates(state);
  if (dates.length === 0) return 0;
  const first = dates[0];
  const last = dates[dates.length - 1];
  // A park pinned to a free travel day turns it into a park day (the contract's locks).
  const pinned = (date: string) => state.locks.some((l) => l.date === date && l.target !== 'rest');
  let n = dates.length;
  if (state.arrival === 'free' && !pinned(first)) n -= 1;
  if (dates.length > 1 && state.departure === 'free' && !pinned(last)) n -= 1;
  return Math.max(0, n);
}

/** The parks the plan is asked for: the visitor's picks, or the headliners while untouched. */
export function effectiveParks(
  state: Pick<OrlandoPlanState, 'parks'>,
  headliners: readonly string[]
): PlanParkPick[] {
  return state.parks ?? headliners.map((slug) => ({ slug, visits: null }));
}

/** The fewest visits the choice asks for: a count that is left to the split counts as one. */
export function minimumVisits(picks: readonly PlanParkPick[]): number {
  return picks.reduce((sum, p) => sum + (p.visits ?? 1), 0);
}

/** Why the plan cannot be asked for yet; each code has a line in `orlandoPlanner.problem`. */
export type PlanProblem =
  'no_dates' | 'too_long' | 'no_parks' | 'too_many_visits' | 'over_max_visits' | 'no_park_day';

/**
 * The first reason the plan cannot be asked for, or `null`. These are the 400s the API would
 * answer, caught before the request so each gets a sentence and a way out instead of an error.
 */
export function planProblem(
  state: OrlandoPlanState,
  headliners: readonly string[]
): PlanProblem | null {
  if (!state.from || !state.to) return 'no_dates';
  const length = tripDates(state).length;
  if (length < 1) return 'no_dates';
  if (length > MAX_TRIP_DAYS) return 'too_long';
  const picks = effectiveParks(state, headliners);
  if (picks.length === 0) return 'no_parks';
  const days = parkDaysAvailable(state);
  if (days === 0) return 'no_park_day';
  const visits = minimumVisits(picks);
  if (visits > MAX_PLAN_VISITS) return 'over_max_visits';
  if (visits > days * (state.hop ? 2 : 1)) return 'too_many_visits';
  return null;
}

// ── Edits ────────────────────────────────────────────────────────────────────

/**
 * The next count of a park's stepper. With the split on, an untouched park reads "auto", which sits
 * between one and two: minus pins it to one, plus to two. Minus from one removes the park (`0`).
 * With the split off, "auto" is simply one.
 */
export function stepVisits(
  visits: number | null,
  delta: 1 | -1,
  split: OrlandoPlanState['split']
): number | null {
  const current = visits ?? (split === 'auto' ? null : 1);
  if (current === null) return delta > 0 ? 2 : 1;
  return Math.max(0, Math.min(MAX_VISITS_PER_PARK, current + delta));
}

/**
 * Set one park's count: `0` removes it, `null` leaves it to the split. The first edit turns the
 * untouched default (the headliners) into an explicit list, kept in the region's order.
 */
export function setParkVisits(
  state: OrlandoPlanState,
  slug: string,
  visits: number | null,
  regionOrder: readonly string[],
  headliners: readonly string[]
): OrlandoPlanState {
  const picks = effectiveParks(state, headliners).filter((p) => p.slug !== slug);
  if (visits !== 0) picks.push({ slug, visits });
  const rank = (s: string) => {
    const i = regionOrder.indexOf(s);
    return i === -1 ? regionOrder.length : i;
  };
  picks.sort((a, b) => rank(a.slug) - rank(b.slug));
  return normalizePlanState({ ...state, parks: picks });
}

/**
 * Turn the split on or off. Off, a count left to the split becomes one, so the stepper keeps
 * showing what will be planned.
 */
export function setSplit(
  state: OrlandoPlanState,
  split: OrlandoPlanState['split']
): OrlandoPlanState {
  if (split === state.split) return state;
  return { ...state, split };
}

/**
 * The hotel area a stay of this kind usually means, as the API reads it the other way round
 * (`regions.ts`): the Disney area for a Disney hotel, the Universal area for a Universal one.
 */
const HOTEL_AREA: Partial<Record<PlanHotel, string>> = {
  disney: 'disney',
  disney_deluxe: 'disney',
  universal: 'universal',
  universal_premier: 'universal',
};

/** The hotel the API plans with: the chosen one, else the area's usual hotel, else off-site. */
export function effectiveHotel(state: Pick<OrlandoPlanState, 'hotel' | 'area'>): PlanHotel {
  if (state.hotel) return state.hotel;
  if (state.area === 'disney') return 'disney';
  if (state.area === 'universal') return 'universal';
  return 'offsite';
}

/**
 * Choose a hotel. Where no area is set yet, the hotel's own area follows, so drive times appear
 * without a second question; an area the visitor chose stays.
 */
export function chooseHotel(
  state: OrlandoPlanState,
  hotel: PlanHotel,
  areas: ReadonlySet<string>
): OrlandoPlanState {
  const area =
    state.area ?? (HOTEL_AREA[hotel] && areas.has(HOTEL_AREA[hotel]) ? HOTEL_AREA[hotel] : null);
  return { ...state, hotel, area: area ?? null };
}

/** Set the trip's dates; pins outside them go. */
export function setTripDates(state: OrlandoPlanState, from: string, to: string): OrlandoPlanState {
  const [a, b] = from <= to ? [from, to] : [to, from];
  return normalizePlanState({ ...state, from: a, to: b });
}

/** Whether a day carries a pin, and which. */
export function lockOn(state: Pick<OrlandoPlanState, 'locks'>, date: string): PlanLock | null {
  return state.locks.find((l) => l.date === date) ?? null;
}

/** Pin a day to what it holds now (a park or a rest day), or release its pin. */
export function toggleLock(state: OrlandoPlanState, day: PlanDay): OrlandoPlanState {
  if (lockOn(state, day.date)) {
    return { ...state, locks: state.locks.filter((l) => l.date !== day.date) };
  }
  const target = dayLockTarget(day);
  if (!target) return state;
  return normalizePlanState({ ...state, locks: [...state.locks, { target, date: day.date }] });
}

/** What a pin of this day names: its park, `rest`, or nothing for a travel or hop day. */
export function dayLockTarget(day: PlanDay): string | null {
  if (day.kind === 'rest') return 'rest';
  if (day.kind === 'park' && day.parks[0]) return day.parks[0].slug;
  return null;
}

/**
 * The pins after trading two days' contents: what was on `a` goes to `b` and the other way round,
 * both pinned, so the re-plan keeps the trade and moves only the rest. Pins elsewhere stay.
 */
export function swapLocks(state: OrlandoPlanState, a: PlanDay, b: PlanDay): PlanLock[] | null {
  const ta = dayLockTarget(a);
  const tb = dayLockTarget(b);
  if (!ta || !tb || a.date === b.date || (ta === 'rest' && tb === 'rest')) return null;
  const rest = state.locks.filter((l) => l.date !== a.date && l.date !== b.date);
  return [...rest, { target: ta, date: b.date }, { target: tb, date: a.date }].sort((x, y) =>
    x.date.localeCompare(y.date)
  );
}

// ── Into the day planner ─────────────────────────────────────────────────────

/** A park as `reserveDays` files it. */
export interface PlanReservePark {
  slug: string;
  name: string;
  geo: PlannerGeo;
  timezone: string;
}

/** The region park as the day planner stores it, or `null` where its path names no geography. */
export function plannerParkOf(park: TripRegionPark): PlanReservePark | null {
  const geo = parkGeoFromUrl(park.path);
  return geo ? { slug: park.slug, name: park.name, geo, timezone: park.timezone } : null;
}

/**
 * Every park day of the plan as `reserveDays` takes it, a hop day's two parks on one date, each
 * park and date once, in trip order.
 */
export function reserveTripDays(
  plan: Pick<TripPlan, 'days'>,
  parks: readonly TripRegionPark[]
): Array<{ park: PlanReservePark; date: string }> {
  const bySlug = new Map(parks.map((p) => [p.slug, p]));
  const out: Array<{ park: PlanReservePark; date: string }> = [];
  for (const day of plan.days) {
    if (day.kind !== 'park' && day.kind !== 'hop') continue;
    for (const visit of day.parks) {
      const park = bySlug.get(visit.slug);
      const filed = park ? plannerParkOf(park) : null;
      if (filed) out.push({ park: filed, date: day.date });
    }
  }
  return out;
}

/**
 * The leg between two points of the region (park slugs or `hotel:<key>`). The matrix stores each
 * pair once, both directions averaged, so either order finds it.
 */
export function findLeg<L extends { from: string; to: string }>(
  legs: readonly L[],
  a: string,
  b: string
): L | null {
  return legs.find((l) => (l.from === a && l.to === b) || (l.from === b && l.to === a)) ?? null;
}

/**
 * Switch between the two ways in: the visitor knows the dates, or the planner finds them. Finding
 * starts on `range` with the length of the dates chosen so far (or {@link DEFAULT_FIND_DAYS});
 * knowing drops the search. Pins belong to given dates and go either way.
 */
export function setFindMode(
  state: OrlandoPlanState,
  find: boolean,
  range: PlanSearchRange
): OrlandoPlanState {
  if (find === (state.when !== null)) return state;
  if (!find) return { ...state, when: null, within: null };
  const length = tripDates(state).length;
  return {
    ...state,
    from: null,
    to: null,
    locks: [],
    when: range,
    days: length >= MIN_FIND_DAYS ? Math.min(MAX_TRIP_DAYS, length) : DEFAULT_FIND_DAYS,
  };
}

/** Level 3 of the When mode: plan a found window, which leaves the search for the plan itself. */
export function planWindow(state: OrlandoPlanState, window: PlanSearchRange): OrlandoPlanState {
  return { ...state, from: window.from, to: window.to, when: null, within: null, locks: [] };
}
