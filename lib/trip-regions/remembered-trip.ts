/**
 * The last trip this browser planned per region, so Parky reads it on any page and an interview's
 * answers outlive leaving the hub: the planner's own query (its whole state) and the party the
 * visitor told Parky, which neither planner has a field for. localStorage only, never the server;
 * the privacy policy says so. The hub itself does not reopen it: Parky does, on request.
 */

/** How many people travel and the children's heights, as Parky's interview asked. */
export interface TripParty {
  size?: number;
  heightsCm: number[];
}

/** One region's remembered trip. */
export interface RememberedTrip {
  region: string;
  /** The planner's query, as `writePlanQuery` writes it; empty while only a party is known. */
  query: string;
  party?: TripParty;
  updatedAt: number;
}

const KEY_PREFIX = 'parkfan_trip_';
const REGION = /^[a-z0-9-]{1,40}$/;
/** The API takes this much of a query; a 21-day trip with pins and tickets fits. */
export const REMEMBERED_QUERY_MAX = 1200;
/** The query's alphabet as the planner writes it, `.h?` included. */
const QUERY = /^[A-Za-z0-9=&:,@._%+?-]*$/;
const MIN_HEIGHT_CM = 50;
const MAX_HEIGHT_CM = 250;
const MAX_HEIGHTS = 10;
const MAX_PARTY = 30;

const keyOf = (region: string) => `${KEY_PREFIX}${region}`;

/** Whether a query holds a trip worth keeping: dates, or a search for them. */
export function holdsTrip(query: string): boolean {
  const params = new URLSearchParams(query);
  return (params.has('from') && params.has('to')) || params.has('when');
}

/** A party as kept: a sensible count and heights, nothing else. */
export function cleanParty(value: unknown): TripParty | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as { size?: unknown; heightsCm?: unknown };
  const size =
    Number.isInteger(raw.size) && (raw.size as number) >= 1 && (raw.size as number) <= MAX_PARTY
      ? (raw.size as number)
      : undefined;
  const heightsCm = (Array.isArray(raw.heightsCm) ? raw.heightsCm : [])
    .filter(
      (h): h is number => Number.isInteger(h) && h >= MIN_HEIGHT_CM && h <= MAX_HEIGHT_CM
    )
    .slice(0, MAX_HEIGHTS);
  if (size === undefined && heightsCm.length === 0) return undefined;
  return { ...(size !== undefined && { size }), heightsCm };
}

/** A stored record read leniently: a hand-edited or older value costs only itself. */
function readRecord(region: string, raw: string | null): RememberedTrip | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<RememberedTrip>;
    const query =
      typeof value.query === 'string' &&
      value.query.length <= REMEMBERED_QUERY_MAX &&
      QUERY.test(value.query)
        ? value.query
        : '';
    const party = cleanParty(value.party);
    if (!query && !party) return null;
    return {
      region,
      query,
      ...(party && { party }),
      updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : 0,
    };
  } catch {
    return null;
  }
}

/** The remembered trip of one region, or null. */
export function rememberedTrip(region: string): RememberedTrip | null {
  if (!REGION.test(region)) return null;
  try {
    return readRecord(region, window.localStorage.getItem(keyOf(region)));
  } catch {
    return null;
  }
}

function write(record: RememberedTrip): void {
  try {
    window.localStorage.setItem(
      keyOf(record.region),
      JSON.stringify({
        query: record.query,
        ...(record.party && { party: record.party }),
        updatedAt: record.updatedAt,
      })
    );
  } catch {
    // Private mode or a full store: Parky then sees the trip only while the hub is open.
  }
}

/**
 * Keep the planner's query for a region, once it holds dates or a search; an untouched planner
 * (a bare hub visit) never erases what was kept. The party stays.
 */
export function rememberTrip(region: string, query: string, now = Date.now()): void {
  if (!REGION.test(region) || query.length > REMEMBERED_QUERY_MAX || !QUERY.test(query)) return;
  if (!holdsTrip(query)) return;
  const kept = rememberedTrip(region);
  if (kept?.query === query) return;
  write({ region, query, ...(kept?.party && { party: kept.party }), updatedAt: now });
}

/** Keep the party Parky's interview asked about with the region's trip. */
export function rememberParty(region: string, party: TripParty, now = Date.now()): void {
  const clean = cleanParty(party);
  if (!REGION.test(region) || !clean) return;
  const kept = rememberedTrip(region);
  write({ region, query: kept?.query ?? '', party: clean, updatedAt: now });
}

/** Drop a region's remembered trip: Parky's undo of the trip he started. */
export function forgetTrip(region: string): void {
  if (!REGION.test(region)) return;
  try {
    window.localStorage.removeItem(keyOf(region));
  } catch {
    // Nothing kept, nothing to drop.
  }
}

/** Every region's remembered trip, newest first. */
export function rememberedTrips(regions: readonly string[]): RememberedTrip[] {
  return regions
    .map(rememberedTrip)
    .filter((trip): trip is RememberedTrip => trip !== null)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
