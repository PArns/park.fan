import { createLocalRecordStore } from '@/lib/utils/local-record-store';
import { addDays } from '@/lib/utils/park-day';
import { MAX_TRIP_DAYS } from './plan-query';
import { isIsoDate } from '@/lib/utils/iso-date';

/*
 * The parks a visitor has ticked off in a region's hub as already visited, so the day's tip and
 * each resort's park move on to one not seen yet. Kept per region in localStorage, as each park's
 * slug with the region's date it was ticked; „Reise löschen“ drops it with the rest of the trip
 * (`clearTrip`). Only a signed-in visitor's account carries a copy to their other devices
 * (`lib/account/sync.ts`). The server render and hydration read none (`getServerSnapshot`), so
 * the served page is the same for every visitor and the ticks arrive in one batch after hydration.
 */

/** Each ticked park's slug with the region's date it was ticked (`YYYY-MM-DD`). */
export type VisitedRecord = Readonly<Record<string, string>>;

/** A park ticked off in a region, as the visitor account carries it across devices. */
export interface VisitedPark {
  region: string;
  park: string;
  date: string;
}

const NONE: VisitedRecord = Object.freeze({});
const NO_PARKS: ReadonlySet<string> = new Set();
const SLUG = /^[a-z0-9-]{1,80}$/;

/** Where a region's ticks live. */
export const visitedKey = (region: string) => `parkfan_${region}_visited`;

/** A key {@link visitedKey} wrote, with its region. */
const VISITED_KEY = /^parkfan_([a-z0-9-]{1,40})_visited$/;

/** Who hears a tick in any region: the visitor account's sync. */
const anyListeners = new Set<() => void>();

/** A stored value read leniently: a hand-edited or broken entry costs only itself. */
export function parseVisited(raw: string | null): VisitedRecord {
  if (!raw) return NONE;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return NONE;
    const entries = Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, string] =>
        SLUG.test(entry[0]) && typeof entry[1] === 'string' && isIsoDate(entry[1])
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
  /** Takes the account's copy of the region's ticks, replacing this browser's. */
  replace(record: VisitedRecord): void;
}

const stores = new Map<string, VisitedParks>();

/** The {@link VisitedParks} of a region, one per region and page. */
export function visitedParks(region: string): VisitedParks {
  let store = stores.get(region);
  if (store) return store;
  const { write, ...record } = createLocalRecordStore({
    key: visitedKey(region),
    parse: parseVisited,
    empty: NONE,
    onWrite: () => {
      for (const listener of anyListeners) listener();
    },
  });

  store = {
    ...record,
    toggle(slug, today) {
      // Ticks of an earlier trip go with the next write, so neither the browser nor the account
      // collects them.
      const active = visitedOn(record.getSnapshot(), today);
      const next: Record<string, string> = Object.fromEntries(
        Object.entries(record.getSnapshot()).filter(([park]) => active.has(park))
      );
      const ticked = !active.has(slug);
      if (ticked) next[slug] = today;
      else delete next[slug];
      write(Object.freeze(next));
      return ticked;
    },
    replace(next) {
      write(Object.keys(next).length > 0 ? Object.freeze({ ...next }) : NONE);
    },
  };
  stores.set(region, store);
  return store;
}

/** The regions this browser keeps ticks for. */
function storedRegions(): string[] {
  const regions: string[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const region = VISITED_KEY.exec(window.localStorage.key(i) ?? '')?.[1];
      if (region) regions.push(region);
    }
  } catch {
    // Blocked storage: no ticks here.
  }
  return regions;
}

/** Every tick of this browser, in every region, for the visitor account's sync. */
export function readAllVisited(): VisitedPark[] {
  return storedRegions().flatMap((region) =>
    Object.entries(visitedParks(region).getSnapshot()).map(([park, date]) => ({
      region,
      park,
      date,
    }))
  );
}

/** Puts the account's ticks in place of this browser's, in every region either side knows. */
export function replaceAllVisited(visits: readonly VisitedPark[]): void {
  const byRegion = new Map<string, Record<string, string>>();
  for (const { region, park, date } of visits) {
    if (!SLUG.test(region) || !SLUG.test(park) || !isIsoDate(date)) continue;
    byRegion.set(region, { ...byRegion.get(region), [park]: date });
  }
  for (const region of new Set([...storedRegions(), ...byRegion.keys()])) {
    visitedParks(region).replace(byRegion.get(region) ?? NONE);
  }
}

/** Calls `listener` when a park is ticked in any region, here or in another tab. */
export function subscribeToAnyVisited(listener: () => void): () => void {
  anyListeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || VISITED_KEY.test(event.key)) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    anyListeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}
