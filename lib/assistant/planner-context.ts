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
  /** Park-local `HH:MM`, the start the planner prints on the block. */
  start?: string;
  /** A free block's or a show's length; a ride's depends on the queue. */
  durationMinutes?: number;
  done?: boolean;
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
}

/** The nearest days a question carries, and the entries per day. */
export const SNAPSHOT_MAX_DAYS = 6;
export const SNAPSHOT_MAX_ENTRIES = 40;
const MAX_NAME = 120;

function entryOf(entry: PlannerDay['entries'][number]): AssistantPlannerEntry {
  const kind = entry.showSlug ? 'show' : entry.custom ? 'block' : 'ride';
  return {
    id: entry.id,
    kind,
    name: (entry.custom?.label ?? entry.attractionName ?? '').slice(0, MAX_NAME),
    ...(kind === 'ride' && entry.attractionSlug ? { rideSlug: entry.attractionSlug } : {}),
    start: formatGridTime(entry.startMinute),
    ...(entry.custom ? { durationMinutes: entry.custom.durationMinutes } : {}),
    ...(entry.done ? { done: true } : {}),
  };
}

/**
 * The planned days from today on, each in its park's own date, nearest first; `undefined` when
 * there is none, so the request leaves the field out.
 */
export function assistantPlannerSnapshot(
  state: PlannerState,
  now: number = Date.now()
): AssistantPlannerSnapshot | undefined {
  const days = Object.values(state.parks)
    .flatMap((park) => {
      const today = todayInZone(park.timezone, now);
      return Object.values(park.days)
        .filter((day) => isPlannedDay(day) && day.date >= today)
        .map((day) => ({ park, day }));
    })
    .sort((a, b) => a.day.date.localeCompare(b.day.date) || a.park.slug.localeCompare(b.park.slug))
    .slice(0, SNAPSHOT_MAX_DAYS)
    .map(({ park, day }) => ({
      park: { slug: park.slug, name: park.name.slice(0, MAX_NAME) },
      date: day.date,
      ...(day.prefs ? { prefs: { ...day.prefs } } : {}),
      entries: day.entries.slice(0, SNAPSHOT_MAX_ENTRIES).map(entryOf),
    }));
  if (days.length === 0) return undefined;
  const { activeParkSlug, activeDate } = state;
  return {
    ...(activeParkSlug && activeDate ? { active: { park: activeParkSlug, date: activeDate } } : {}),
    days,
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
