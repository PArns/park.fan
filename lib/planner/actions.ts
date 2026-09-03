import type {
  PlannerBlockIcon,
  PlannerCustomBlock,
  PlannerEntry,
  PlannerGeo,
  PlannerPark,
  PlannerState,
} from './types';

/**
 * Every change the planner can make to a plan, as pure functions on the state.
 *
 * Pure because they are the part worth testing: reordering, hour assignment and
 * tick-off are where an off-by-one hides, and none of it needs a browser. The
 * store's `update` applies them; nothing here touches storage.
 *
 * They are also all **immutable**. The store hands the same object to every
 * `useSyncExternalStore` consumer, so mutating in place would leave React
 * comparing an object to itself and skipping the render.
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
        // A park added earlier under a slug alone gets its real name and path
        // the first time a caller supplies them.
        name: seed?.parkName ?? park.name,
        geo: seed?.geo ?? park.geo,
        timezone: seed?.timezone ?? park.timezone,
        days: { ...park.days, [date]: { date, entries } },
      },
    },
  };
}

/**
 * Entries in time order, keeping insertion order within the same minute.
 *
 * The tie-break is not cosmetic any more: on the day grid two blocks starting at
 * the same minute are laid out side by side, and this is the only stable
 * ordering a plan has to decide which of them takes the left column.
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

/** Park-local minutes, inside a day. Clamped where it can be tested. */
function clampMinute(minute: number): number {
  if (!Number.isFinite(minute)) return 0;
  return Math.max(0, Math.min(1500, Math.round(minute)));
}


/**
 * A block the visitor writes themselves — a lunch break, a show, a meeting point.
 *
 * It goes in exactly where a ride would, because to a day they cost the same
 * thing: an hour of it. What differs is where the height comes from. A ride's
 * block is as tall as the queue the model predicts; this one is as tall as the
 * visitor dragged it, which is why `durationMinutes` lives on the entry and not
 * in a forecast.
 */
export function addCustomEntry(state: PlannerState, params: AddCustomParams): PlannerState {
  const { parkSlug, parkName, geo, timezone, date, label, icon, durationMinutes, startMinute } =
    params;
  const existing = state.parks[parkSlug]?.days[date]?.entries ?? [];

  const entry: PlannerEntry = withHourMirror({
    id: makeId('block', existing),
    startMinute: clampMinute(startMinute ?? nextFallbackStart(existing)),
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
  if (!target?.custom) return state;

  const next: PlannerCustomBlock = {
    label: (patch.label ?? target.custom.label).slice(0, 60),
    icon: patch.icon ?? target.custom.icon,
    durationMinutes: clampDuration(patch.durationMinutes ?? target.custom.durationMinutes),
  };
  if (
    next.label === target.custom.label &&
    next.icon === target.custom.icon &&
    next.durationMinutes === target.custom.durationMinutes
  ) {
    // Same object by identity, so `useSyncExternalStore` skips the render and a
    // drag that ends where it started costs no localStorage write.
    return state;
  }

  return withDay(
    state,
    parkSlug,
    date,
    entries.map((entry) => (entry.id === entryId ? { ...entry, custom: next } : entry))
  );
}

/** Five minutes is a block you can still read; twelve hours is a whole day. */
export const MIN_CUSTOM_MINUTES = 5;
export const MAX_CUSTOM_MINUTES = 720;
export const DEFAULT_CUSTOM_MINUTES = 60;

function clampDuration(minutes: number): number {
  if (!Number.isFinite(minutes)) return DEFAULT_CUSTOM_MINUTES;
  return Math.max(MIN_CUSTOM_MINUTES, Math.min(MAX_CUSTOM_MINUTES, Math.round(minutes)));
}

/** An hour after the last entry, so several adds in a row spread across the day. */
function nextFallbackStart(existing: readonly PlannerEntry[]): number {
  return existing.length > 0 ? Math.max(...existing.map((e) => e.startMinute)) + 60 : 10 * 60;
}

export function addEntry(state: PlannerState, params: AddParams): PlannerState {
  const { parkSlug, parkName, geo, timezone, date, attractionSlug, attractionName, startMinute } =
    params;
  const existing = state.parks[parkSlug]?.days[date]?.entries ?? [];

  // No time given: an hour after the last entry, so adding several rides in a
  // row spreads them across the day instead of stacking them on one minute. The
  // caller passes a real minute when it knows the day's shape — see
  // `nextFreeStart`, which is what the grid uses.
  const fallback = nextFallbackStart(existing);

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
 * Move one entry to another minute. The list re-sorts; nothing else moves.
 *
 * This is what a drag on the grid writes, so its two identity guards are not
 * hygiene. Every `plannerStore.update` stringifies the whole multi-park plan,
 * writes localStorage, rewrites the cookie and notifies every subscriber on the
 * page — and a drag that ends where it started is the commonest gesture there
 * is. Returning `state` itself, not a copy, is what makes that free.
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

/**
 * Push one entry and everything after it by the same amount.
 *
 * The second half of a repair, and never automatic: it exists so a visitor who
 * has been told their plan does not work can accept a fix in one gesture, with
 * the whole cascade as a single undoable write. Nothing calls it on its own.
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

  return withDay(
    state,
    parkSlug,
    date,
    byStart(
      ordered.map((e, index) =>
        index >= from
          ? withHourMirror({ ...e, startMinute: clampMinute(e.startMinute + deltaMinutes) })
          : e
      )
    )
  );
}

/**
 * Tick an entry off, recording what the queue actually was.
 *
 * `actualWait` is optional because it comes from the live data and can be
 * missing — a ride that was closed, a park with no readable wait times. Ticked
 * off without a figure is still a fact about the visit; a zero would be a claim
 * about the queue.
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
        // Un-ticking drops the recorded wait with it: keeping it would leave a
        // measured number attached to an entry that is a plan again.
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
  return { ...state, activeParkSlug: parkSlug, activeDate: date };
}

/**
 * Point the planner at a park and a day, registering the park if it is new.
 *
 * The way in from the park calendar, where a visitor picks the day BEFORE any
 * ride — the reverse of the ride page's order. `setActive` alone cannot do it:
 * it stores two strings, and a slug the state has never seen leaves the panel
 * with no name, no geo path and therefore no forecast to fetch.
 *
 * It adds no entry, so `hasAnyPlan` stays false and the launcher stays hidden
 * until something is actually planned. An existing day keeps its entries.
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
