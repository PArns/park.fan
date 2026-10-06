import type {
  PlannerBlockIcon,
  PlannerCustomBlock,
  PlannerDayPrefs,
  PlannerEntry,
  PlannerGeo,
  PlannerPark,
  PlannerState,
} from './types';
import {
  DEFAULT_CUSTOM_MINUTES,
  isPlannedDay,
  MAX_CUSTOM_LABEL_LENGTH,
  MAX_CUSTOM_MINUTES,
  MAX_PLANNED_MINUTE,
  MIN_CUSTOM_MINUTES,
} from './types';
import { clampRiderHeight } from './party';
import { SNAP_MIN_FINE } from './day-grid';
import { dayClock, resolveTimeZone } from './park-time';

/**
 * Every change the planner can make to a plan, as pure functions on the state, so the off-by-ones
 * can be tested without a browser. All immutable: the store hands one object to every
 * `useSyncExternalStore` consumer, and a mutation in place would skip the render.
 */

interface AddCustomParams {
  parkSlug: string;
  parkName: string;
  geo: PlannerGeo;
  date: string;
  timezone?: string;
  label: string;
  icon: PlannerBlockIcon;
  durationMinutes?: number;
  startMinute?: number;
}

interface AddParams {
  parkSlug: string;
  parkName: string;
  geo: PlannerGeo;
  date: string;
  attractionSlug: string;
  attractionName: string;
  /** The park's IANA zone, so the plan can answer "what day is it there?". */
  timezone?: string;
  /** Park-local minutes since midnight. Omitted means "after the last entry". */
  startMinute?: number;
}

/** Stable enough for a list key, and readable in stored JSON while debugging. */
function makeId(attractionSlug: string, existing: PlannerEntry[]): string {
  let n = 1;
  let id = `${attractionSlug}-${n}`;
  const taken = new Set(existing.map((e) => e.id));
  while (taken.has(id)) id = `${attractionSlug}-${++n}`;
  return id;
}

function withDay(
  state: PlannerState,
  parkSlug: string,
  date: string,
  entries: PlannerEntry[],
  seed?: { parkName: string; geo: PlannerGeo; timezone?: string }
): PlannerState {
  const existing: PlannerPark | undefined = state.parks[parkSlug];
  const park: PlannerPark = existing ?? {
    slug: parkSlug,
    name: seed?.parkName ?? parkSlug,
    geo: seed?.geo ?? { continent: '', country: '', city: '' },
    days: {},
  };

  return {
    ...state,
    parks: {
      ...state.parks,
      [parkSlug]: {
        ...park,
        // A park added under a slug alone gets its real name and path once a caller supplies them.
        name: seed?.parkName ?? park.name,
        geo: seed?.geo ?? park.geo,
        timezone: seed?.timezone ?? park.timezone,
        days: {
          ...park.days,
          // The day's preferences are carried through: every action rewrites the whole day object,
          // and dropping who is coming on the first move would lose data silently.
          [date]: { ...park.days[date], date, entries },
        },
      },
    },
  };
}

/**
 * Entries in time order, keeping insertion order within the same minute: the only stable ordering
 * for which of two blocks starting together takes the left column.
 */
function byStart(entries: PlannerEntry[]): PlannerEntry[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => a.entry.startMinute - b.entry.startMinute || a.index - b.index)
    .map((x) => x.entry);
}

/** The mirror the store still writes for a tab running the previous build. */
function withHourMirror(entry: PlannerEntry): PlannerEntry {
  return { ...entry, hour: Math.floor(entry.startMinute / 60) };
}

/**
 * The latest minute a block a hand put somewhere may carry, 25:00: the backstop behind
 * `clampStart`, since a pointer can be far below the canvas.
 */
const MAX_DRAGGED_MINUTE = 25 * 60;

/** Park-local minutes, inside a day. Clamped where it can be tested. */
function clampMinute(minute: number, ceiling: number = MAX_DRAGGED_MINUTE): number {
  if (!Number.isFinite(minute)) return 0;
  return Math.max(0, Math.min(ceiling, Math.round(minute)));
}

/**
 * A block the visitor writes themselves, a lunch break, a show or a meeting point. It goes in like
 * a ride; its height is the duration the visitor dragged, so `durationMinutes` lives on the entry.
 */
export function addCustomEntry(
  state: PlannerState,
  params: AddCustomParams,
  now: number = Date.now()
): PlannerState {
  const { parkSlug, parkName, geo, timezone, date, label, icon, durationMinutes, startMinute } =
    params;
  const existing = state.parks[parkSlug]?.days[date]?.entries ?? [];

  const entry: PlannerEntry = withHourMirror({
    id: makeId('block', existing),
    // The same floor a ride gets: never before now (see `nowFloorMinute`).
    startMinute: clampMinute(
      startMinute ?? nextFallbackStart(existing, nowFloorMinute(date, timezone, now))
    ),
    custom: {
      label,
      icon,
      durationMinutes: clampDuration(durationMinutes ?? DEFAULT_CUSTOM_MINUTES),
    },
  });

  return withDay(state, parkSlug, date, byStart([...existing, entry]), {
    parkName,
    geo,
    timezone,
  });
}

/** What {@link addShowEntry} files. */
export interface AddShowParams {
  parkSlug: string;
  parkName: string;
  geo: PlannerGeo;
  timezone?: string;
  date: string;
  showSlug: string;
  showName: string;
  /** The performance's start, park-local minutes. */
  startMinute: number;
  durationMinutes?: number;
}

/** What a performance is assumed to take. `/plan/day` carries a start time and no length. */
export const DEFAULT_SHOW_MINUTES = 30;

/**
 * One performance of a show, filed as a free block (`custom`, icon `show`) bound to it by
 * `showSlug`, which the walking-time sum reads. The same performance twice returns the state by
 * identity; two performances of one show are two entries.
 */
export function addShowEntry(state: PlannerState, params: AddShowParams): PlannerState {
  const { parkSlug, parkName, geo, timezone, date, showSlug, showName, startMinute } = params;
  const existing = state.parks[parkSlug]?.days[date]?.entries ?? [];
  const at = clampMinute(startMinute);
  if (existing.some((e) => e.showSlug === showSlug && e.startMinute === at)) return state;

  const entry: PlannerEntry = withHourMirror({
    id: makeId(`show-${showSlug}`, existing),
    startMinute: at,
    showSlug,
    custom: {
      label: showName.slice(0, MAX_CUSTOM_LABEL_LENGTH),
      icon: 'show',
      durationMinutes: clampDuration(params.durationMinutes ?? DEFAULT_SHOW_MINUTES),
    },
  });

  return withDay(state, parkSlug, date, byStart([...existing, entry]), {
    parkName,
    geo,
    timezone,
  });
}

/** Retitle or re-icon a free block. A no-op, by identity, on a ride. */
export function setCustomBlock(
  state: PlannerState,
  parkSlug: string,
  date: string,
  entryId: string,
  patch: Partial<PlannerCustomBlock>
): PlannerState {
  const entries = state.parks[parkSlug]?.days[date]?.entries;
  if (!entries) return state;
  const target = entries.find((entry) => entry.id === entryId);
  // A show is bound to its performance: its name and length are not the visitor's to edit.
  if (!target?.custom || target.showSlug) return state;

  const next: PlannerCustomBlock = {
    label: (patch.label ?? target.custom.label).slice(0, MAX_CUSTOM_LABEL_LENGTH),
    icon: patch.icon ?? target.custom.icon,
    durationMinutes: clampDuration(patch.durationMinutes ?? target.custom.durationMinutes),
  };
  if (
    next.label === target.custom.label &&
    next.icon === target.custom.icon &&
    next.durationMinutes === target.custom.durationMinutes
  ) {
    // The same object, so the render and the localStorage write are skipped.
    return state;
  }

  return withDay(
    state,
    parkSlug,
    date,
    entries.map((entry) => (entry.id === entryId ? { ...entry, custom: next } : entry))
  );
}

function clampDuration(minutes: number): number {
  if (!Number.isFinite(minutes)) return DEFAULT_CUSTOM_MINUTES;
  return Math.max(MIN_CUSTOM_MINUTES, Math.min(MAX_CUSTOM_MINUTES, Math.round(minutes)));
}

/**
 * The earliest minute a block filed without a chosen time may take, and `0` on every date that is
 * not today where the park is: the `nowFloor` rule for callers that hold no `DayGrid` (the ride
 * page's button, or a panel whose payload has not arrived). Snapped up to the quarter hour, and not
 * capped at the end of the day. The zone falls back through `resolveTimeZone`, like the date did,
 * so both are read on one clock.
 */
function nowFloorMinute(date: string, timezone: string | undefined, now: number): number {
  const clock = dayClock(date, resolveTimeZone(timezone), now);
  if (clock.phase !== 'today') return 0;
  return Math.ceil(clock.nowMinute / SNAP_MIN_FINE) * SNAP_MIN_FINE;
}

/**
 * An hour after the last entry, so several adds in a row spread across the day, and never before
 * `floorMinute`. Late in the day the spread reaches `clampMinute`'s 25:00 ceiling, where the blocks
 * draw side by side (see `byStart`), which reads as "these do not fit today".
 */
function nextFallbackStart(existing: readonly PlannerEntry[], floorMinute = 0): number {
  const spread =
    existing.length > 0 ? Math.max(...existing.map((e) => e.startMinute)) + 60 : 10 * 60;
  return Math.max(spread, floorMinute);
}

/**
 * Returns the plan with one ride added to a park-day at the given minute, or an hour after the
 * day's last block and never before now when none is given.
 *
 * @param now Park-clock instant, defaulted so only a test passes one.
 */
export function addEntry(
  state: PlannerState,
  params: AddParams,
  now: number = Date.now()
): PlannerState {
  const { parkSlug, parkName, geo, timezone, date, attractionSlug, attractionName, startMinute } =
    params;
  const existing = state.parks[parkSlug]?.days[date]?.entries ?? [];

  // No time given: an hour after the last entry, never before now (see `nowFloorMinute`). A caller
  // that knows the day's shape passes a real minute (`nextFreeStart`).
  const fallback = nextFallbackStart(existing, nowFloorMinute(date, timezone, now));

  const entry: PlannerEntry = withHourMirror({
    id: makeId(attractionSlug, existing),
    attractionSlug,
    attractionName,
    startMinute: clampMinute(startMinute ?? fallback),
  });

  return withDay(state, parkSlug, date, byStart([...existing, entry]), {
    parkName,
    geo,
    timezone,
  });
}

/**
 * Returns the plan without the block with this id on that park-day; the same state when the day
 * does not exist.
 */
export function removeEntry(
  state: PlannerState,
  parkSlug: string,
  date: string,
  entryId: string
): PlannerState {
  const existing = state.parks[parkSlug]?.days[date]?.entries;
  if (!existing) return state;
  return withDay(
    state,
    parkSlug,
    date,
    existing.filter((e) => e.id !== entryId)
  );
}

/**
 * Move one entry to another minute; the list re-sorts and nothing else moves. What a drag writes,
 * so its identity guards matter: every store update rewrites the whole plan and notifies every
 * subscriber, and a drag ending where it started is the commonest gesture.
 */
export function moveEntry(
  state: PlannerState,
  parkSlug: string,
  date: string,
  entryId: string,
  startMinute: number
): PlannerState {
  const existing = state.parks[parkSlug]?.days[date]?.entries;
  if (!existing) return state;

  const target = clampMinute(startMinute);
  const current = existing.find((e) => e.id === entryId);
  if (!current) return state;
  // The time of a show entry is the performance's own.
  if (current.showSlug) return state;
  if (current.startMinute === target) return state;

  return withDay(
    state,
    parkSlug,
    date,
    byStart(
      existing.map((e) => (e.id === entryId ? withHourMirror({ ...e, startMinute: target }) : e))
    )
  );
}

/** One stop of a plan for {@link applyPlan}: an entry to move, or a ride to add. */
export interface ApplyPlanStop {
  /** An existing entry to move, or `null` for a ride being added. */
  entryId: string | null;
  attractionSlug: string;
  attractionName: string;
  startMinute: number;
}

/**
 * A whole re-plan, in one write, which is what the optimiser commits: a loop of single moves would
 * rewrite and broadcast the whole plan per stop and render half-old, half-new days in between.
 * Everything the caller did not name is kept: this moves and adds, and never removes.
 */
export function applyPlan(
  state: PlannerState,
  params: {
    parkSlug: string;
    parkName: string;
    geo: PlannerGeo;
    timezone?: string;
    date: string;
    stops: readonly ApplyPlanStop[];
  }
): PlannerState {
  const { parkSlug, parkName, geo, timezone, date, stops } = params;
  const existing = state.parks[parkSlug]?.days[date]?.entries ?? [];

  const moved = new Map<string, number>();
  const added: PlannerEntry[] = [];
  // Ids are unique within the day, so new ones have to see those minted a moment ago too.
  const seen = [...existing];

  for (const stop of stops) {
    if (stop.entryId) {
      moved.set(stop.entryId, clampMinute(stop.startMinute, MAX_PLANNED_MINUTE));
      continue;
    }
    const entry = withHourMirror({
      id: makeId(stop.attractionSlug, seen),
      attractionSlug: stop.attractionSlug,
      attractionName: stop.attractionName,
      startMinute: clampMinute(stop.startMinute, MAX_PLANNED_MINUTE),
    });
    seen.push(entry);
    added.push(entry);
  }

  const next = [
    ...existing.map((entry) => {
      const minute = moved.get(entry.id);
      // A show keeps its performance's minute whatever a caller names.
      return minute === undefined || minute === entry.startMinute || entry.showSlug
        ? entry
        : withHourMirror({ ...entry, startMinute: minute });
    }),
    ...added,
  ];

  return withDay(state, parkSlug, date, byStart(next), { parkName, geo, timezone });
}

/**
 * Put a day back exactly as it was: the undo for {@link applyPlan}. It replaces rather than merges,
 * so an entry added since the snapshot goes.
 */
export function restoreDay(
  state: PlannerState,
  parkSlug: string,
  date: string,
  entries: readonly PlannerEntry[]
): PlannerState {
  if (!state.parks[parkSlug]) return state;
  return withDay(state, parkSlug, date, byStart(entries.map((entry) => ({ ...entry }))));
}

/**
 * Push one entry and everything after it by the same amount: a repair the visitor accepts in one
 * gesture and one undoable write. Never called on its own.
 */
export function shiftFrom(
  state: PlannerState,
  parkSlug: string,
  date: string,
  entryId: string,
  deltaMinutes: number
): PlannerState {
  const existing = state.parks[parkSlug]?.days[date]?.entries;
  if (!existing || deltaMinutes === 0) return state;

  const ordered = byStart(existing);
  const from = ordered.findIndex((e) => e.id === entryId);
  if (from === -1) return state;

  // Nothing but shows after the anchor: nothing moves, so the state stays the same object.
  if (!ordered.slice(from).some((e) => !e.showSlug)) return state;

  return withDay(
    state,
    parkSlug,
    date,
    byStart(
      ordered.map((e, index) =>
        index >= from && !e.showSlug
          ? withHourMirror({ ...e, startMinute: clampMinute(e.startMinute + deltaMinutes) })
          : e
      )
    )
  );
}

/**
 * Tick an entry off, recording what the queue actually was. `actualWait` is optional, since a
 * closed ride or a park without readable waits has none; a zero would be a claim about the queue.
 */
export function setEntryDone(
  state: PlannerState,
  parkSlug: string,
  date: string,
  entryId: string,
  done: boolean,
  actualWait?: number
): PlannerState {
  const existing = state.parks[parkSlug]?.days[date]?.entries;
  if (!existing) return state;

  return withDay(
    state,
    parkSlug,
    date,
    existing.map((e) => {
      if (e.id !== entryId) return e;
      if (!done) {
        // Un-ticking drops the recorded wait: a plan again carries no measurement.
        const { done: _done, actualWait: _actual, ...rest } = e;
        return rest;
      }
      return { ...e, done: true, ...(actualWait !== undefined ? { actualWait } : {}) };
    })
  );
}

/** Which park and day the flyout opens on. */
export function setActive(
  state: PlannerState,
  parkSlug: string | null,
  date: string | null
): PlannerState {
  if (state.activeParkSlug === parkSlug && state.activeDate === date) return state;
  return { ...state, activeParkSlug: parkSlug, activeDate: date };
}

/**
 * Point the planner at a park and a day, registering the park if it is new: the calendar's way in,
 * where the day comes before any ride, and a bare slug would leave the panel nothing to fetch. It
 * adds no entry, so `hasAnyPlan` stays false; an existing day keeps its entries.
 */
export function openDay(
  state: PlannerState,
  park: { slug: string; name: string; geo: PlannerGeo; timezone?: string },
  date: string
): PlannerState {
  const entries = state.parks[park.slug]?.days[date]?.entries ?? [];
  const next = withDay(state, park.slug, date, entries, {
    parkName: park.name,
    geo: park.geo,
    timezone: park.timezone,
  });
  return { ...next, activeParkSlug: park.slug, activeDate: date };
}

/**
 * File the days the visitor accepted from the trip assistant: empty days with `reserved` set, which
 * the lists, the countdown, the share link and the sync count. A date that already holds a plan is
 * left as it is, and the active park and date do not move.
 */
export function reserveDays(
  state: PlannerState,
  days: readonly {
    park: { slug: string; name: string; geo: PlannerGeo; timezone?: string };
    date: string;
  }[]
): PlannerState {
  let next = state;
  for (const { park, date } of days) {
    const existing = next.parks[park.slug]?.days[date];
    if (existing && isPlannedDay(existing)) continue;
    next = withDay(next, park.slug, date, [], {
      parkName: park.name,
      geo: park.geo,
      timezone: park.timezone,
    });
    const filed = next.parks[park.slug];
    next = {
      ...next,
      parks: {
        ...next.parks,
        [park.slug]: {
          ...filed,
          days: { ...filed.days, [date]: { ...filed.days[date], reserved: true } },
        },
      },
    };
  }
  return next;
}

/**
 * Record the zone the day payload came back with, for a park added from the overview's search,
 * whose payload has no zone. Identity-guarded, so the effect that calls it cannot loop.
 */
export function learnTimezone(
  state: PlannerState,
  parkSlug: string,
  timezone: string
): PlannerState {
  const park = state.parks[parkSlug];
  if (!park || park.timezone === timezone) return state;
  return { ...state, parks: { ...state.parks, [parkSlug]: { ...park, timezone } } };
}

/**
 * Record who is coming, for one day. Merged, so a step that asks only about children keeps the
 * answer about water rides; an empty result drops the key, since "not asked" must stay apart from
 * "answered nothing". Creates the day if needed, since the wizard asks before any ride is planned.
 */
export function setDayPrefs(
  state: PlannerState,
  parkSlug: string,
  date: string,
  patch: PlannerDayPrefs
): PlannerState {
  const park = state.parks[parkSlug];
  if (!park) return state;

  const current = park.days[date]?.prefs;
  const merged: PlannerDayPrefs = { ...current, ...patch };

  // Normalised on the write path too, so an out-of-range height never reaches localStorage.
  const height =
    merged.riderHeightCm === undefined ? undefined : clampRiderHeight(merged.riderHeightCm);
  const next: PlannerDayPrefs = {
    ...(height !== undefined ? { riderHeightCm: height } : {}),
    ...(merged.avoidWet ? { avoidWet: true } : {}),
    ...(merged.earlyEntry ? { earlyEntry: true } : {}),
  };
  const empty = Object.keys(next).length === 0;

  if (
    (current?.riderHeightCm ?? undefined) === (empty ? undefined : next.riderHeightCm) &&
    (current?.avoidWet ?? false) === (empty ? false : (next.avoidWet ?? false)) &&
    (current?.earlyEntry ?? false) === (empty ? false : (next.earlyEntry ?? false))
  ) {
    // Same answers: the same object, so no render and no localStorage write.
    return state;
  }

  const day = park.days[date] ?? { date, entries: [] };
  return {
    ...state,
    parks: {
      ...state.parks,
      [parkSlug]: {
        ...park,
        days: {
          ...park.days,
          [date]: { ...day, date, ...(empty ? { prefs: undefined } : { prefs: next }) },
        },
      },
    },
  };
}

/** Drop a whole day. An empty park is dropped with it rather than lingering. */
export function clearDay(state: PlannerState, parkSlug: string, date: string): PlannerState {
  const park = state.parks[parkSlug];
  if (!park) return state;

  const days = { ...park.days };
  delete days[date];

  const parks = { ...state.parks };
  if (Object.keys(days).length === 0) delete parks[parkSlug];
  else parks[parkSlug] = { ...park, days };

  return {
    ...state,
    parks,
    activeDate:
      state.activeDate === date && state.activeParkSlug === parkSlug ? null : state.activeDate,
  };
}
