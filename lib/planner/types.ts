/**
 * The trip planner's own data. It lives in the visitor's browser: there is no account, and the
 * plan is theirs.
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
/** One of {@link PLANNER_BLOCK_ICONS}. */
export type PlannerBlockIcon = (typeof PLANNER_BLOCK_ICONS)[number];

/**
 * A block the visitor wrote themselves. Its height is a duration the visitor drags, not a queue the
 * model predicts; everything else (placement, lanes, legs) is the same machinery as a ride's.
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

/** One block in a planned day: a ride, a free block or a show. */
export interface PlannerEntry {
  /**
   * Stable across reorders and re-renders. Drag needs an identity that survives
   * the list being rewritten under it, and a ride can legitimately appear twice
   * in one day, so the slug cannot serve as the key.
   */
  id: string;
  /**
   * The ride this entry stands for, absent on a free block. Optional rather than an empty string,
   * so no lookup keyed on it answers for a ride that is not there.
   */
  attractionSlug?: string;
  attractionName?: string;
  /**
   * Set where this is a free block: anything the visitor wants on the day that the catalogue lacks.
   */
  custom?: PlannerCustomBlock;
  /**
   * Set where this block is a show, one performance picked from the day's showtimes. It always
   * comes with a `custom` block, so the optimiser and the estimate treat it as a fixed block; the
   * slug gives the walking sum the show's position and locks the time to the performance (no drag,
   * nudge or resize).
   */
  showSlug?: string;
  /**
   * When the visit starts, in park-local minutes since midnight. Park-local always: the reader's
   * own offset never enters the planner.
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
 * What the visitor said about the day itself, as against what is in it. Stored per day, because a
 * party changes between visits while the park does not. Neither answer ever hides a ride; see
 * `party.ts`.
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
   * The visitor holds early entry for this day (a hotel guest let in before opening). Only asked at
   * a park whose `/plan/day` context carries `hasEarlyEntry`; absent reads as `false`. Not about
   * the party, so `hasPartyPrefs` ignores it.
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
   * The visitor accepted this day from the trip assistant and has planned nothing in it yet. Tells
   * "said yes to this day" from an empty day `openDay` filed by just opening the date.
   */
  reserved?: boolean;
}

/** A day the lists, the countdown, the share link and the sync show: it holds entries or was reserved. */
export function isPlannedDay(day: PlannerDay): boolean {
  return day.entries.length > 0 || day.reserved === true;
}

/** One park in the plan, with its days. */
export interface PlannerPark {
  slug: string;
  name: string;
  geo: PlannerGeo;
  /**
   * The park's IANA zone, stored rather than fetched: the overview lists several parks at once with
   * no payload for any of them.
   */
  timezone?: string;
  /** Keyed by date, so several days of the same park sit side by side. */
  days: Record<string, PlannerDay>;
}

/** The whole plan, as the store holds and persists it. */
export interface PlannerState {
  /** Keyed by park slug — the visitor plans more than one park. */
  parks: Record<string, PlannerPark>;
  /** Which park and day the flyout shows when it opens. */
  activeParkSlug: string | null;
  activeDate: string | null;
  /** Bumped on every write, so a stale copy from another tab is detectable. */
  version: number;
}

/** A plan with nothing in it. */
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
 * The latest minute a planned stop may carry. A plan is not bounded by the park's hours:
 * `optimizeDay` files an entry it cannot fit past the gate, in sequence, and a clamp at the drag's
 * 25:00 would stack those again. 48:00, because past the end of the next day a minute is not a
 * reading of the park's clock on any axis this app draws.
 */
export const MAX_PLANNED_MINUTE = 48 * 60;
