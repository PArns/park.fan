import { addDays } from '@/lib/utils/park-day';
import {
  DEFAULT_PLAN_STATE,
  MAX_PLAN_VISITS,
  MAX_TRIP_DAYS,
  MAX_VISITS_PER_PARK,
  normalizePlanState,
  writePlanQuery,
  type PlanLock,
} from './plan-query';

/*
 * The days a visitor has picked in a region's hub calendar, one park per date: a press on a park's
 * tile plans that park on that day, so the calendar can move every other park's star off it. Kept
 * per region in localStorage, as each date with the park picked on it; „Reise löschen“ drops it with
 * the rest of the trip (`clearTrip`). The server render and hydration read none
 * (`getServerSnapshot`), so the served page is the same for every visitor and the picks arrive in one
 * batch after hydration.
 */

/** Each picked date (`YYYY-MM-DD`) with the slug of the park picked on it. */
export type HubPicks = Readonly<Record<string, string>>;

const NONE: HubPicks = Object.freeze({});
const SLUG = /^[a-z0-9-]{1,80}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Where a region's picks live. */
export const hubPicksKey = (region: string) => `parkfan_${region}_hub_picks`;

/** A stored value read leniently: a hand-edited or broken entry costs only itself. */
export function parseHubPicks(raw: string | null): HubPicks {
  if (!raw) return NONE;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return NONE;
    const entries = Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, string] =>
        DATE.test(entry[0]) && typeof entry[1] === 'string' && SLUG.test(entry[1])
    );
    return entries.length > 0 ? Object.freeze(Object.fromEntries(entries)) : NONE;
  } catch {
    return NONE;
  }
}

/**
 * The picks after a press on `slug`'s tile of `date`: a switch per day. A press on one of the
 * park's picked days takes that day back; a press on any other day adds it, taken from whichever
 * park held it, and keeps the park's other days, so a park can be planned on as many days as a
 * visitor wants to spend there. Dates before `today` go with the write.
 */
export function pickHubDay(picks: HubPicks, slug: string, date: string, today: string): HubPicks {
  const next: Record<string, string> = {};
  for (const [day, park] of Object.entries(picks)) {
    if (day < today || day === date) continue;
    next[day] = park;
  }
  if (picks[date] !== slug) next[date] = slug;
  return Object.keys(next).length > 0 ? Object.freeze(next) : NONE;
}

/**
 * The trip planner's query for the picks of a region: from the first picked day to the last, at
 * most a trip's length ({@link MAX_TRIP_DAYS}) from the first, both ends park days; each picked park
 * with as many visits as it has days (at most {@link MAX_VISITS_PER_PARK}); every picked day locked
 * to its park (`lock=`), so the plan keeps the days the visitor chose and fills the rest. Only the
 * region's parks (`parks`) and days from `today` count; `null` without one.
 */
export function picksPlanQuery(
  picks: HubPicks,
  parks: ReadonlySet<string>,
  today: string
): string | null {
  const dates = Object.keys(picks)
    .filter((date) => date >= today && parks.has(picks[date]))
    .sort();
  if (dates.length === 0) return null;
  const from = dates[0];
  const last = addDays(from, MAX_TRIP_DAYS - 1);
  const visits = new Map<string, number>();
  const locks: PlanLock[] = [];
  for (const date of dates) {
    if (date > last || locks.length >= MAX_PLAN_VISITS) break;
    const slug = picks[date];
    const count = visits.get(slug) ?? 0;
    if (count >= MAX_VISITS_PER_PARK) continue;
    visits.set(slug, count + 1);
    locks.push({ target: slug, date });
  }
  const state = normalizePlanState({
    ...DEFAULT_PLAN_STATE,
    from,
    to: locks[locks.length - 1].date,
    parks: [...visits].map(([slug, n]) => ({ slug, visits: n })),
    arrival: 'park',
    departure: 'park',
    locks,
  });
  return writePlanQuery(state);
}

/** One region's picks as an external store for `useSyncExternalStore`. */
export interface HubPicksStore {
  subscribe(listener: () => void): () => void;
  /** The same object until the stored value changes. */
  getSnapshot(): HubPicks;
  /** None on the server and while hydrating. */
  getServerSnapshot(): HubPicks;
  set(next: HubPicks): void;
  /** Drops every pick of the region and returns how to put them back. */
  forget(): () => void;
}

const stores = new Map<string, HubPicksStore>();

/** The {@link HubPicksStore} of a region, one per region and page. */
export function hubPicks(region: string): HubPicksStore {
  let store = stores.get(region);
  if (store) return store;
  const key = hubPicksKey(region);
  const listeners = new Set<() => void>();
  let cachedRaw: string | null = null;
  let cached: HubPicks = NONE;

  const readRaw = (): string | null => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const getSnapshot = (): HubPicks => {
    const raw = readRaw();
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cached = parseHubPicks(raw);
    }
    return cached;
  };
  const write = (next: HubPicks) => {
    try {
      if (Object.keys(next).length === 0) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Private mode or a full store: the picks last until the page is left.
      cachedRaw = readRaw();
      cached = next;
    }
    for (const listener of listeners) listener();
  };

  store = {
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key === key || event.key === null) listener();
      };
      window.addEventListener('storage', onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
      };
    },
    getSnapshot,
    getServerSnapshot: () => NONE,
    set: write,
    forget() {
      const kept = getSnapshot();
      if (kept === NONE) return () => undefined;
      write(NONE);
      return () => write(kept);
    },
  };
  stores.set(region, store);
  return store;
}
