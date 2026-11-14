import { clearDay, openDay, restoreDay } from '@/lib/planner/actions';
import { formatGridTime, todayInZone } from '@/lib/planner/park-time';
import {
  isPlannedDay,
  type PlannerDay,
  type PlannerDayPrefs,
  type PlannerGeo,
  type PlannerState,
} from '@/lib/planner/types';

/**
 * The plan as Parky reads it with each question: the planner lives in this browser, so the API
 * sees it only here. Names are the visitor's text, and the API treats them as data.
 */

/** One entry of a planned day, in plan order. */
export interface AssistantPlannerEntry {
  id: string;
  kind: 'ride' | 'show' | 'block';
  name: string;
  rideSlug?: string;
  /** A show's slug, so Parky can check a new time against its performances. */
  showSlug?: string;
  /** Park-local `HH:MM`, the start the planner prints on the block. */
  start?: string;
  /** The planner's own minute, past 1440 after midnight, which `start` cannot say. */
  startMinute?: number;
  /** A free block's or a show's length; a ride's depends on the queue. */
  durationMinutes?: number;
  done?: boolean;
}

/** A planned day a question names by park and date only. */
export interface AssistantPlannerIndexDay {
  park: { slug: string; name: string };
  date: string;
  entries: number;
  done?: number;
  reserved?: true;
  riderHeightCm?: number;
}

/** The `planner` field of a chat request. */
export interface AssistantPlannerSnapshot {
  active?: { park: string; date: string };
  days: Array<{
    park: { slug: string; name: string };
    date: string;
    prefs?: PlannerDayPrefs;
    entries: AssistantPlannerEntry[];
  }>;
  /** Every other planned day from today on; Parky opens one to read it in full. */
  more?: AssistantPlannerIndexDay[];
}

/** The days a question carries in full (the active one and the nearest), and the entries per day. */
export const SNAPSHOT_MAX_DAYS = 8;
export const SNAPSHOT_MAX_ENTRIES = 40;
/** The other planned days a question names by park and date, as many as the API reads. */
export const SNAPSHOT_MAX_INDEX = 60;
const MAX_NAME = 120;

function entryOf(entry: PlannerDay['entries'][number]): AssistantPlannerEntry {
  const kind = entry.showSlug ? 'show' : entry.custom ? 'block' : 'ride';
  return {
    id: entry.id,
    kind,
    name: (entry.custom?.label ?? entry.attractionName ?? '').slice(0, MAX_NAME),
    ...(kind === 'ride' && entry.attractionSlug ? { rideSlug: entry.attractionSlug } : {}),
    ...(kind === 'show' && entry.showSlug ? { showSlug: entry.showSlug } : {}),
    start: formatGridTime(entry.startMinute),
    startMinute: entry.startMinute,
    ...(entry.custom ? { durationMinutes: entry.custom.durationMinutes } : {}),
    ...(entry.done ? { done: true } : {}),
  };
}

/**
 * Every planned day from today on, each in its park's own date, nearest first: the day open in the
 * planner and the nearest in full, the rest by park and date; `undefined` when there is none, so
 * the request leaves the field out.
 */
export function assistantPlannerSnapshot(
  state: PlannerState,
  now: number = Date.now()
): AssistantPlannerSnapshot | undefined {
  const planned = Object.values(state.parks)
    .flatMap((park) => {
      const today = todayInZone(park.timezone, now);
      return Object.values(park.days)
        .filter((day) => isPlannedDay(day) && day.date >= today)
        .map((day) => ({ park, day }));
    })
    .sort((a, b) => a.day.date.localeCompare(b.day.date) || a.park.slug.localeCompare(b.park.slug));
  if (planned.length === 0) return undefined;
  const { activeParkSlug, activeDate } = state;
  const isActive = ({ park, day }: (typeof planned)[number]) =>
    park.slug === activeParkSlug && day.date === activeDate;
  // The day open in the planner is the one "this day" means, wherever it falls.
  const active = planned.find(isActive);
  const full = [
    ...(active ? [active] : []),
    ...planned.filter((p) => !isActive(p)).slice(0, SNAPSHOT_MAX_DAYS - (active ? 1 : 0)),
  ].sort((a, b) => a.day.date.localeCompare(b.day.date) || a.park.slug.localeCompare(b.park.slug));
  const rest = planned.filter((p) => !full.includes(p)).slice(0, SNAPSHOT_MAX_INDEX);
  const name = (park: (typeof planned)[number]['park']) => ({
    slug: park.slug,
    name: park.name.slice(0, MAX_NAME),
  });
  return {
    ...(activeParkSlug && activeDate ? { active: { park: activeParkSlug, date: activeDate } } : {}),
    days: full.map(({ park, day }) => ({
      park: name(park),
      date: day.date,
      ...(day.prefs ? { prefs: { ...day.prefs } } : {}),
      entries: day.entries.slice(0, SNAPSHOT_MAX_ENTRIES).map(entryOf),
    })),
    ...(rest.length > 0 && {
      more: rest.map(({ park, day }) => {
        const done = day.entries.filter((e) => e.done).length;
        return {
          park: name(park),
          date: day.date,
          entries: day.entries.length,
          ...(done > 0 && { done }),
          ...(day.reserved && { reserved: true as const }),
          ...(day.prefs?.riderHeightCm && { riderHeightCm: day.prefs.riderHeightCm }),
        };
      }),
    }),
  };
}

type UndoPark = { slug: string; name: string; geo: PlannerGeo; timezone?: string };

/**
 * Parky's last change to a day, one per park and day for the tab's lifetime: the day before it
 * (`null` where it did not exist, so undoing drops it again) and the day right after it, so an undo
 * can tell whether the visitor has changed the day since.
 */
interface ParkyChange {
  before: PlannerDay | null;
  after: string;
}
const undoSnapshots = new Map<string, ParkyChange>();
const undoKey = (parkSlug: string, date: string) => `${parkSlug}|${date}`;

const copyOf = (day: PlannerDay | undefined): PlannerDay | null =>
  day ? { ...day, entries: day.entries.map((e) => ({ ...e })) } : null;

/**
 * What a day holds, field by field, so two copies compare equal however they were built. A day
 * with nothing in it reads like no day, since opening a date files an empty one.
 */
function daySignature(day: PlannerDay | undefined): string {
  if (!day || (day.entries.length === 0 && !day.prefs && !day.reserved)) return '';
  return JSON.stringify([
    day.entries.map((e) => [
      e.id,
      e.attractionSlug ?? null,
      e.showSlug ?? null,
      e.startMinute,
      e.custom?.label ?? null,
      e.custom?.icon ?? null,
      e.custom?.durationMinutes ?? null,
      e.done === true,
      e.actualWait ?? null,
    ]),
    day.prefs?.riderHeightCm ?? null,
    day.prefs?.avoidWet === true,
    day.prefs?.earlyEntry === true,
    day.reserved === true,
  ]);
}

/** Keep a change Parky just made to a day: the plan before it and the plan after it. */
export function rememberParkyChange(
  before: PlannerState,
  after: PlannerState,
  parkSlug: string,
  date: string
): void {
  undoSnapshots.set(undoKey(parkSlug, date), {
    before: copyOf(before.parks[parkSlug]?.days[date]),
    after: daySignature(after.parks[parkSlug]?.days[date]),
  });
}

/**
 * What an undo did: put the day back, found it changed by the visitor since Parky's change (and
 * left it), or found no change of Parky's to undo.
 */
export type ParkyUndoOutcome = 'undone' | 'changed' | 'none';

/**
 * The plan with that day put back as it was before Parky's last change, its entries through
 * `restoreDay`, its preferences and reservation as they were; only while the day is still what
 * Parky left, so the visitor's own edits are never undone. Consumes the change either way.
 */
export function undoParkyChange(
  state: PlannerState,
  park: UndoPark,
  date: string
): { state: PlannerState; outcome: ParkyUndoOutcome } {
  const key = undoKey(park.slug, date);
  const change = undoSnapshots.get(key);
  if (!change) return { state, outcome: 'none' };
  undoSnapshots.delete(key);
  if (daySignature(state.parks[park.slug]?.days[date]) !== change.after) {
    return { state, outcome: 'changed' };
  }
  const { before } = change;
  if (!before) return { state: clearDay(state, park.slug, date), outcome: 'undone' };
  const restored = restoreDay(openDay(state, park, date), park.slug, date, before.entries);
  const filed = restored.parks[park.slug];
  const { prefs: _prefs, reserved: _reserved, ...day } = filed.days[date];
  return {
    outcome: 'undone',
    state: {
      ...restored,
      parks: {
        ...restored.parks,
        [park.slug]: {
          ...filed,
          days: {
            ...filed.days,
            [date]: {
              ...day,
              ...(before.prefs ? { prefs: before.prefs } : {}),
              ...(before.reserved ? { reserved: true } : {}),
            },
          },
        },
      },
    },
  };
}
