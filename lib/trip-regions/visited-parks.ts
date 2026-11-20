import { addDays } from '@/lib/utils/park-day';
import { MAX_TRIP_DAYS } from './plan-query';

/*
 * The parks a visitor has ticked off in a region's hub as already visited, so the day's tip and
 * each resort's park move on to one not seen yet. Kept per region in localStorage, never on the
 * server, as each park's slug with the region's date it was ticked; „Reise löschen“ drops it with
 * the rest of the trip (`clearTrip`). The server and hydration read none
 * (`getServerSnapshot`), so the served page is the same for every visitor and the ticks arrive
 * in one batch after hydration.
 */

/** Each ticked park's slug with the region's date it was ticked (`YYYY-MM-DD`). */
export type VisitedRecord = Readonly<Record<string, string>>;

const NONE: VisitedRecord = Object.freeze({});
const NO_PARKS: ReadonlySet<string> = new Set();
const SLUG = /^[a-z0-9-]{1,80}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Where a region's ticks live. */
export const visitedKey = (region: string) => `parkfan_${region}_visited`;

/** A stored value read leniently: a hand-edited or broken entry costs only itself. */
export function parseVisited(raw: string | null): VisitedRecord {
  if (!raw) return NONE;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return NONE;
    const entries = Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, string] =>
        SLUG.test(entry[0]) && typeof entry[1] === 'string' && DATE.test(entry[1])
    );
    return entries.length > 0 ? Object.freeze(Object.fromEntries(entries)) : NONE;
  } catch {
    return NONE;
  }
}

/**
 * The parks that count as visited on the region's `today`: a tick older than the longest trip the
 * planner plans ({@link MAX_TRIP_DAYS}) was made on an earlier trip, and last year's visit says
 * nothing about where to go this time.
 */
export function visitedOn(record: VisitedRecord, today: string): ReadonlySet<string> {
  const since = addDays(today, -MAX_TRIP_DAYS);
  const slugs = Object.entries(record)
    .filter(([, date]) => date > since)
    .map(([slug]) => slug);
  return slugs.length > 0 ? new Set(slugs) : NO_PARKS;
}

/** One region's ticks as an external store for `useSyncExternalStore`. */
export interface VisitedParks {
  subscribe(listener: () => void): () => void;
  /** The same object until the stored value changes. */
  getSnapshot(): VisitedRecord;
  /** None on the server and while hydrating. */
  getServerSnapshot(): VisitedRecord;
  /** Ticks the park off on `today`, or takes the tick away; returns whether it is ticked now. */
  toggle(slug: string, today: string): boolean;
  /** Drops every tick of the region and returns how to put them back. */
  forget(): () => void;
}

const stores = new Map<string, VisitedParks>();

/** The {@link VisitedParks} of a region, one per region and page. */
export function visitedParks(region: string): VisitedParks {
  let store = stores.get(region);
  if (store) return store;
  const key = visitedKey(region);
  const listeners = new Set<() => void>();
  let cachedRaw: string | null = null;
  let cached: VisitedRecord = NONE;

  const readRaw = (): string | null => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const getSnapshot = (): VisitedRecord => {
    const raw = readRaw();
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cached = parseVisited(raw);
    }
    return cached;
  };
  const write = (next: VisitedRecord) => {
    try {
      if (Object.keys(next).length === 0) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Private mode or a full store: the ticks last until the page is left. Pinning the raw that
      // is stored now keeps `next` as the snapshot until the stored value changes under it.
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
    toggle(slug, today) {
      const next: Record<string, string> = { ...getSnapshot() };
      const ticked = !visitedOn(next, today).has(slug);
      if (ticked) next[slug] = today;
      else delete next[slug];
      write(Object.freeze(next));
      return ticked;
    },
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
