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
 * The day as it was before Parky's last change to it, one level per park and day, for the tab's
 * lifetime: `null` where the day did not exist, so undoing drops it again.
 */
const undoSnapshots = new Map<string, PlannerDay | null>();
const undoKey = (parkSlug: string, date: string) => `${parkSlug}|${date}`;

/** Keep the day as it is now, before Parky writes to it. */
export function rememberDayForUndo(state: PlannerState, parkSlug: string, date: string): void {
  const day = state.parks[parkSlug]?.days[date];
  undoSnapshots.set(
    undoKey(parkSlug, date),
    day ? { ...day, entries: day.entries.map((e) => ({ ...e })) } : null
  );
}

/** Whether Parky changed this day and has not undone it yet. */
export function hasParkyUndo(parkSlug: string, date: string): boolean {
  return undoSnapshots.has(undoKey(parkSlug, date));
}

/**
 * The plan with that day put back as it was before Parky's last change: its entries through
 * `restoreDay`, its preferences and its reservation as they were. Consumes the snapshot; the same
 * state where there is none.
 */
export function undoParkyChange(state: PlannerState, park: UndoPark, date: string): PlannerState {
  const key = undoKey(park.slug, date);
  if (!undoSnapshots.has(key)) return state;
  const before = undoSnapshots.get(key) ?? null;
  undoSnapshots.delete(key);
  if (!before) return clearDay(state, park.slug, date);
  const restored = restoreDay(openDay(state, park, date), park.slug, date, before.entries);
  const filed = restored.parks[park.slug];
  const { prefs: _prefs, reserved: _reserved, ...day } = filed.days[date];
  return {
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
  };
}
