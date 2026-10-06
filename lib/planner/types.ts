/**
 * The trip planner's own data. Everything here lives in the visitor's browser —
 * there is no account system, and the plan is theirs.
 */

/** Where a park lives, so a stored plan can rebuild its API path and its links. */
export interface PlannerGeo {
  continent: string;
  country: string;
  city: string;
}

/** The icons a free block may carry. A closed set, so a plan never stores a class name. */
export const PLANNER_BLOCK_ICONS = [
  'break',
  'food',
  'show',
  'shop',
  'photo',
  'meet',
  'star',
] as const;
export type PlannerBlockIcon = (typeof PLANNER_BLOCK_ICONS)[number];

/**
 * A block the visitor wrote themselves.
 *
 * Its height is a DURATION the visitor drags, not a queue the model predicts —
 * which is the one structural difference from a ride. Everything else about it
 * (where it sits, how it packs into lanes, what the legs either side of it say)
 * is the same machinery, because an hour spent eating and an hour spent queuing
 * cost the day the same hour.
 */
export interface PlannerCustomBlock {
  label: string;
  icon: PlannerBlockIcon;
  /** Minutes. What the visitor dragged the bottom edge to. */
  durationMinutes: number;
}

/** The longest label a free block keeps, wherever it is typed, stored or read back. */
export const MAX_CUSTOM_LABEL_LENGTH = 60;

/** Five minutes is a block you can still read; twelve hours is a whole day. */
export const MIN_CUSTOM_MINUTES = 5;
/** The longest a free block may be dragged to. */
export const MAX_CUSTOM_MINUTES = 720;
/** How long a free block is when nobody said. */
export const DEFAULT_CUSTOM_MINUTES = 60;

export interface PlannerEntry {
  /**
   * Stable across reorders and re-renders. Drag needs an identity that survives
   * the list being rewritten under it, and a ride can legitimately appear twice
   * in one day, so the slug cannot serve as the key.
   */
  id: string;
  /**
   * The ride this entry stands for — absent on a FREE BLOCK, which stands for
   * nothing in the catalogue. Optional rather than an empty string on purpose:
   * an empty slug would be a claim that a ride exists with no name, one render
   * away from a reader, and every lookup keyed on it (`liveWaits`, `closedNow`,
   * the forecast curve, the "already planned" count) would silently answer for
   * a ride that is not there.
   */
  attractionSlug?: string;
  attractionName?: string;
  /**
   * Set where this is a free block — a lunch break, a show, a meeting point,
   * anything a visitor wants on the day that the catalogue does not know.
   */
  custom?: PlannerCustomBlock;
  /**
   * Set where this block is a SHOW — one performance picked from the day's
   * showtimes. It always travels with a `custom` block (label = the show's name,
   * icon `show`), so the optimiser, the fit assistant and the estimate treat it
   * as the fixed block they already know. What `showSlug` adds is the identity
   * the walking-time sum needs to find the show's position, and a lock: the time
   * belongs to the performance, so the entry is not dragged, nudged, resized or
   * shifted. Changing it means deleting it and picking another performance.
   */
  showSlug?: string;
  /**
   * When the visit starts, as park-local minutes since midnight. Park-local
   * always: the reader's own offset never enters the planner, because this
   * value and the date it is filed under are what a plan IS.
   */
  startMinute: number;
  /**
   * @deprecated A write-only mirror of `Math.floor(startMinute / 60)`, kept for
   * one release so a tab still running the previous build reads a plan it
   * understands instead of dropping every entry. Nothing may read it.
   */
  hour?: number;
  /**
   * Ticked off. Once set, the estimate stops being the point: `actualWait` is
   * what happened, and the entry is a record rather than a plan.
   */
  done?: boolean;
  /** The wait actually queued, in minutes, recorded when it was ticked off. */
  actualWait?: number;
}

/**
 * What the visitor said about the day itself, as against what is in it.
 *
 * Two answers, both about the PARTY, and they are stored per day rather than per
 * park or per browser because that is what they are properties of: the same
 * family comes back in October without the four-year-old, and the park has not
 * changed. Neither ever hides a ride — see `party.ts`.
 */
export interface PlannerDayPrefs {
  /**
   * How tall the SHORTEST rider is, in centimetres. Absent means nobody was
   * asked, which is different from "everybody is tall enough".
   */
  riderHeightCm?: number;
  /** The party would rather not get soaked. Water rides carry a flag. */
  avoidWet?: boolean;
  /**
   * The visitor said they hold early entry for this day (a hotel guest let in
   * before the official opening). Only ever asked at a park whose `/plan/day`
   * context carries `hasEarlyEntry`, and absent everywhere else, which reads
   * as `false`. The day grid's pre-opening window (PAR-199) reads it as the
   * day context's `earlyEntry`. Not a statement about the party, so
   * `hasPartyPrefs` ignores it.
   */
  earlyEntry?: boolean;
}

/** One park's plan for one date. */
export interface PlannerDay {
  /** YYYY-MM-DD, in the park's own timezone. */
  date: string;
  entries: PlannerEntry[];
  /** Absent until the visitor has been asked. Never inferred. */
  prefs?: PlannerDayPrefs;
  /**
   * Set where the visitor accepted a day from the trip assistant and has planned
   * nothing in it yet. Optional, so a plan written before it existed reads as it
   * always did. `openDay` files an empty day too, and that one stays invisible on
   * purpose; this flag is what tells "the visitor said yes to this day" from
   * "the visitor once opened this date".
   */
  reserved?: boolean;
}

/** A day the lists, the countdown, the share link and the sync show: it holds entries or was reserved. */
export function isPlannedDay(day: PlannerDay): boolean {
  return day.entries.length > 0 || day.reserved === true;
}

export interface PlannerPark {
  slug: string;
  name: string;
  geo: PlannerGeo;
  /**
   * The park's IANA zone, stored rather than fetched: the overview lists several
   * parks at once and has no payload for any of them, so a single "today" for
   * the panel would be wrong by construction for all but one.
   */
  timezone?: string;
  /** Keyed by date, so several days of the same park sit side by side. */
  days: Record<string, PlannerDay>;
}

export interface PlannerState {
  /** Keyed by park slug — the visitor plans more than one park. */
  parks: Record<string, PlannerPark>;
  /** Which park and day the flyout shows when it opens. */
  activeParkSlug: string | null;
  activeDate: string | null;
  /** Bumped on every write, so a stale copy from another tab is detectable. */
  version: number;
}

export const EMPTY_PLANNER_STATE: PlannerState = {
  parks: {},
  activeParkSlug: null,
  activeDate: null,
  version: 1,
};

/** True when there is anything at all worth opening the flyout for. */
export function hasAnyPlan(state: PlannerState): boolean {
  return Object.values(state.parks).some((park) => Object.values(park.days).some(isPlannedDay));
}

/** The parks that hold a planned day, by name in the reader's language, each with those days in date order. */
export function plannedParks(
  parks: PlannerState['parks'],
  locale: string
): Array<Omit<PlannerPark, 'days'> & { days: PlannerDay[] }> {
  return Object.values(parks)
    .map((park) => ({
      ...park,
      days: Object.values(park.days)
        .filter(isPlannedDay)
        .sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .filter((park) => park.days.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

/** Entries for one park and date, in plan order. Never `undefined`. */
export function entriesFor(
  state: PlannerState,
  parkSlug: string | null,
  date: string | null
): PlannerEntry[] {
  if (!parkSlug || !date) return [];
  return state.parks[parkSlug]?.days[date]?.entries ?? [];
}

/** How many entries a park has across every planned day. */
function countForPark(state: PlannerState, parkSlug: string): number {
  const park = state.parks[parkSlug];
  if (!park) return 0;
  return Object.values(park.days).reduce((sum, day) => sum + day.entries.length, 0);
}

/** Total across all parks — what the trigger badge shows. */
export function countAll(state: PlannerState): number {
  return Object.keys(state.parks).reduce((sum, slug) => sum + countForPark(state, slug), 0);
}

/**
 * The latest minute a PLANNED stop may carry.
 *
 * A plan is not bounded by the park's hours and must not be. `optimizeDay`
 * files an ENTRY it cannot fit before closing PAST the gate on purpose, in the
 * sequence the day would actually reach it, and `growGridForSpans` widens the
 * canvas to hold them — so the overflow reads as "and these two do not fit"
 * rather than as blocks stacked in lanes on the park's last minute. (A ride it
 * is ADDING gets the opposite answer and is left out; the asymmetry is that
 * nobody's own plan is deleted behind their back.) Clamped at
 * the drag world's 25:00 that is exactly what came back: ten 120-minute queues
 * in a park open 09:00–22:00 produced 25:30, 26:45 and 28:00, and all three
 * were stored as 1500. The stacking the optimiser goes out of its way not to
 * draw was put back by the write.
 *
 * 48:00 because a plan is filed under ONE date and read in the park's own
 * clock: past the end of the day after it, a minute is not a reading of that
 * clock under any axis this app can draw, and nothing `MAX_STOPS` stops
 * of the longest queue on record can produce comes near it.
 */
export const MAX_PLANNED_MINUTE = 48 * 60;
