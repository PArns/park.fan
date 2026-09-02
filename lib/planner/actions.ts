import type { PlannerEntry, PlannerGeo, PlannerPark, PlannerState } from './types';

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

interface AddParams {
  parkSlug: string;
  parkName: string;
  geo: PlannerGeo;
  date: string;
  attractionSlug: string;
  attractionName: string;
  /** Where to put it. Omitted means "after the last entry", see below. */
  hour?: number;
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
  seed?: { parkName: string; geo: PlannerGeo }
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
        days: { ...park.days, [date]: { date, entries } },
      },
    },
  };
}

/** Entries sorted by hour, keeping insertion order within the same hour. */
function byHour(entries: PlannerEntry[]): PlannerEntry[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => a.entry.hour - b.entry.hour || a.index - b.index)
    .map((x) => x.entry);
}

export function addEntry(state: PlannerState, params: AddParams): PlannerState {
  const { parkSlug, parkName, geo, date, attractionSlug, attractionName, hour } = params;
  const existing = state.parks[parkSlug]?.days[date]?.entries ?? [];

  // No hour given: an hour after the last entry, so dropping several rides in a
  // row spreads them across the day instead of stacking them on one time. The
  // day's opening hour is not known here — the caller passes one when it is.
  const fallbackHour = existing.length > 0 ? Math.max(...existing.map((e) => e.hour)) + 1 : 10;

  const entry: PlannerEntry = {
    id: makeId(attractionSlug, existing),
    attractionSlug,
    attractionName,
    hour: hour ?? fallbackHour,
  };

  return withDay(state, parkSlug, date, byHour([...existing, entry]), { parkName, geo });
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

/** Move one entry to another hour. The list re-sorts; nothing else moves. */
export function moveEntry(
  state: PlannerState,
  parkSlug: string,
  date: string,
  entryId: string,
  hour: number
): PlannerState {
  const existing = state.parks[parkSlug]?.days[date]?.entries;
  if (!existing) return state;
  return withDay(
    state,
    parkSlug,
    date,
    byHour(existing.map((e) => (e.id === entryId ? { ...e, hour } : e)))
  );
}

/**
 * Drag-and-drop reorder by position.
 *
 * The dropped entry takes the hour of the row it landed on, which is what makes
 * dragging change the estimate — the whole point of the feature. Everything else
 * keeps its own hour, so a reorder is one change and not a cascade the visitor
 * did not ask for.
 */
export function reorderEntry(
  state: PlannerState,
  parkSlug: string,
  date: string,
  entryId: string,
  toIndex: number
): PlannerState {
  const existing = state.parks[parkSlug]?.days[date]?.entries;
  if (!existing) return state;

  const fromIndex = existing.findIndex((e) => e.id === entryId);
  if (fromIndex === -1) return state;

  const clamped = Math.max(0, Math.min(toIndex, existing.length - 1));
  if (clamped === fromIndex) return state;

  const next = [...existing];
  const [moved] = next.splice(fromIndex, 1);
  // Read the target hour BEFORE inserting: after the splice the neighbour at
  // `clamped` is a different entry, and the dropped ride would take the hour of
  // whatever slid into that position.
  const targetHour = existing[clamped].hour;
  next.splice(clamped, 0, { ...moved, hour: targetHour });

  return withDay(state, parkSlug, date, byHour(next));
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
