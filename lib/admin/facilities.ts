/**
 * The admin's page for the parks' toilets and drinking water from OpenStreetMap
 * (`/v1/admin/facilities`): its shapes, the one state a park's row shows, the filter, and the plot
 * of a park's outline with its points. The API drops null fields, so anything that may be null
 * arrives as absent and is typed optional.
 */

/** The admin proxy prefix of every facility endpoint. */
export const FACILITIES_API = '/api/admin/facilities';

/** How far a park's import has come in the review. `none`: no import was ever tried. */
export type FacilityReviewStatus = 'none' | 'pending' | 'imported' | 'approved';

/** How the last import attempt of a park ended. */
export type FacilityRunOutcome = 'ok' | 'no_outline' | 'failed';

/** One park of `GET facilities`. */
export interface FacilityParkRow {
  parkId: string;
  name: string;
  country?: string;
  status: FacilityReviewStatus;
  lastRun?: FacilityRunOutcome;
  lastRunAt?: string;
  lastRunMessage?: string;
  boundary?: { type: 'way' | 'relation'; id: string; name?: string };
  importedAt?: string;
  approvedAt?: string;
  counts: { toilets: number; drinkingWater: number; hidden: number; outside: number };
  /** Whether the bulk approval would take this park. */
  bulkApprovable: boolean;
}

/** A bulk run's place and tally. */
export interface FacilityBulkProgress {
  total: number;
  done: number;
  ok: number;
  noOutline: number;
  failed: number;
  points: number;
}

/** What the import queue is doing. */
export interface FacilityQueueState {
  bulk?: { state: 'waiting' | 'active'; progress?: FacilityBulkProgress };
  parkIds: string[];
  lastFailure?: string;
}

/** `GET facilities`: the queue and every park. */
export interface FacilityList {
  queue: FacilityQueueState;
  parks: FacilityParkRow[];
}

/** One imported point of `GET facilities/{parkId}`. */
export interface FacilityPoint {
  id: string;
  type: 'toilets' | 'drinking_water';
  latitude: number;
  longitude: number;
  name?: string;
  wheelchair?: 'yes' | 'limited' | 'no';
  changingTable?: boolean;
  fee?: boolean;
  osmType: 'node' | 'way' | 'relation';
  osmId: string;
  osmTimestamp: string;
  hidden: boolean;
  insideOutline: boolean;
}

/** `GET facilities/{parkId}`: the outline as rings of `[longitude, latitude]` and every point. */
export interface FacilityReview {
  import?: { boundaryRings?: [number, number][][] };
  facilities: FacilityPoint[];
}

/** `POST facilities/approve-all`: the parks the bulk approval takes, or took. */
export interface FacilityBulkApproval {
  dryRun: boolean;
  count: number;
  parks: string[];
}

/** The one state a park's row shows, which is also what the list filters by. */
export type FacilityState = 'approved' | 'review' | 'no_outline' | 'failed' | 'none';

/**
 * A park's state for the list. What a visitor gets comes first: an approved or imported park
 * keeps that state when a later run failed, and its row says so in its own line.
 */
export function facilityState(row: Pick<FacilityParkRow, 'status' | 'lastRun'>): FacilityState {
  if (row.status === 'approved') return 'approved';
  if (row.status === 'imported') return 'review';
  if (row.lastRun === 'no_outline') return 'no_outline';
  if (row.lastRun === 'failed') return 'failed';
  return 'none';
}

/** The states in the order the filter lists them. */
export const FACILITY_STATES: FacilityState[] = [
  'review',
  'approved',
  'no_outline',
  'failed',
  'none',
];

/** The admin's word for a {@link FacilityState}. */
export const FACILITY_STATE_LABEL: Record<FacilityState, string> = {
  review: 'Zu prüfen',
  approved: 'Freigegeben',
  no_outline: 'Kein Umriss',
  failed: 'Fehlgeschlagen',
  none: 'Nicht eingelesen',
};

/** The chip colour of a {@link FacilityState}. */
export const FACILITY_STATE_TONE = {
  review: 'warning',
  approved: 'success',
  no_outline: 'muted',
  failed: 'danger',
  none: 'muted',
} as const satisfies Record<FacilityState, string>;

/** How many parks are in each state, for the filter's numbers. */
export function facilityStateCounts(
  parks: readonly Pick<FacilityParkRow, 'status' | 'lastRun'>[]
): Record<FacilityState, number> {
  const counts: Record<FacilityState, number> = {
    review: 0,
    approved: 0,
    no_outline: 0,
    failed: 0,
    none: 0,
  };
  for (const park of parks) counts[facilityState(park)] += 1;
  return counts;
}

/** The parks in one state (`all` for every state) whose name or country contains the search text. */
export function filterFacilityParks<
  T extends Pick<FacilityParkRow, 'status' | 'lastRun' | 'name' | 'country'>,
>(parks: readonly T[], state: FacilityState | 'all', search: string): T[] {
  const needle = search.trim().toLowerCase();
  return parks.filter(
    (park) =>
      (state === 'all' || facilityState(park) === state) &&
      (needle === '' || `${park.name} ${park.country ?? ''}`.toLowerCase().includes(needle))
  );
}

/** The status line of the import queue, or null when it is idle and the last run did not fail. */
export function facilityQueueText(queue: FacilityQueueState): string | null {
  if (queue.bulk) {
    const progress = queue.bulk.progress;
    if (queue.bulk.state === 'waiting' || !progress)
      return 'Der Sammelimport wartet auf seinen Start.';
    return (
      `Sammelimport läuft: ${progress.done} von ${progress.total} Parks, ` +
      `${progress.ok} eingelesen, ${progress.noOutline} ohne Umriss, ${progress.failed} fehlgeschlagen.`
    );
  }
  if (queue.parkIds.length > 0) {
    return queue.parkIds.length === 1
      ? 'Ein Park wird eingelesen.'
      : `${queue.parkIds.length} Parks werden eingelesen.`;
  }
  return queue.lastFailure ? `Der letzte Sammelimport brach ab: ${queue.lastFailure}` : null;
}

/** A park's outline and points in the pixels of an SVG `width` wide. */
export interface FacilityPlot {
  width: number;
  height: number;
  /** One closed SVG path per ring of the outline. */
  paths: string[];
  points: { id: string; x: number; y: number }[];
}

/**
 * Lays a park's outline and points out for an SVG: north up, a degree of longitude shortened by
 * the cosine of the latitude so the park keeps its shape, and a margin so a point on the edge is
 * not cut. Points outside the outline widen the frame. Null without anything to draw.
 */
export function facilityPlot(
  rings: readonly (readonly [number, number][])[],
  points: readonly Pick<FacilityPoint, 'id' | 'latitude' | 'longitude'>[],
  width = 480,
  margin = 16
): FacilityPlot | null {
  const all = [
    ...rings.flat(),
    ...points.map((point): [number, number] => [point.longitude, point.latitude]),
  ];
  if (all.length === 0) return null;
  const lons = all.map(([lon]) => lon);
  const lats = all.map(([, lat]) => lat);
  const west = Math.min(...lons);
  const north = Math.max(...lats);
  const squeeze = Math.cos(((north + Math.min(...lats)) / 2) * (Math.PI / 180));
  const spanX = (Math.max(...lons) - west) * squeeze || 1e-9;
  const spanY = north - Math.min(...lats) || 1e-9;
  const scale = (width - 2 * margin) / spanX;
  const height = Math.round(spanY * scale + 2 * margin);
  const round = (value: number) => Math.round(value * 10) / 10;
  const project = (lon: number, lat: number): [number, number] => [
    round(margin + (lon - west) * squeeze * scale),
    round(margin + (north - lat) * scale),
  ];
  return {
    width,
    height,
    paths: rings.map(
      (ring) =>
        ring
          .map(([lon, lat], index) => `${index === 0 ? 'M' : 'L'}${project(lon, lat).join(' ')}`)
          .join('') + 'Z'
    ),
    points: points.map((point) => {
      const [x, y] = project(point.longitude, point.latitude);
      return { id: point.id, x, y };
    }),
  };
}

/** The page of an OSM element on openstreetmap.org, where a wrong point is corrected. */
export function osmElementUrl(type: string, id: string): string {
  return `https://www.openstreetmap.org/${type}/${id}`;
}

/** True when `text` names an OSM outline the way the import takes it: `way/123` or `relation/123`. */
export function isOutlineRef(text: string): boolean {
  return /^(way|relation)\/\d{1,19}$/.test(text.trim());
}

/** True when the API answering is older than these routes: it deploys apart from the site. */
export function isFacilitiesBackendMissing(error: { status: number } | null | undefined): boolean {
  return error?.status === 404;
}
