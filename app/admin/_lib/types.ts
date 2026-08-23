/**
 * The shapes the admin API answers with.
 *
 * Hand-written rather than generated, and deliberately narrow: these describe
 * what the admin renders, not everything the endpoints return. Anything not
 * listed here is not being shown to anybody, and adding a field to this file
 * should be a decision, not a side effect of a backend change.
 */

export type AdminRole = 'owner' | 'editor' | 'author' | 'viewer';

export interface AdminIdentity {
  id: string | null;
  email: string;
  displayName: string;
  role: AdminRole;
  legacy: boolean;
  mustChangePassword: boolean;
  totpEnabled: boolean;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export type CuratedFieldType =
  'text' | 'longtext' | 'number' | 'decimal' | 'boolean' | 'enum' | 'months' | 'url';

/**
 * One curated field, as the backend describes it.
 *
 * The editor is generated from these rather than hand-written per field, so a
 * new curated column appears in the admin with no frontend change. The three
 * values are the whole point: `syncedValue` is what the upstream feed says,
 * `curatedValue` is what a human wrote, `resolvedValue` is what the API
 * actually serves — and seeing all three at once is what tells an editor
 * whether a correction is still needed.
 */
export interface CuratedField {
  key: string;
  label: string;
  type: CuratedFieldType;
  group: string;
  syncedValue: unknown;
  curatedValue: unknown;
  resolvedValue: unknown;
  overridden: boolean;
  /** No sync writes this field at all, so there is nothing to compare against. */
  humanOnly: boolean;
  options?: string[];
  unit?: string;
  min?: number;
  max?: number;
  /** Text and url fields only. */
  maxLength?: number;
  hint?: string;
}

export interface AuditEntry {
  id: string;
  actorId: string | null;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string | null;
  entityLabel: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string | null;
  sourceUrl: string | null;
  revertedBy: string | null;
  createdAt: string;
}

export interface AdminParkListItem {
  id: string;
  name: string;
  upstreamName: string;
  slug: string;
  path: string;
  city: string | null;
  country: string | null;
  countryCode: string | null;
  timezone: string;
  /** Null when geocoding never resolved one — itself worth seeing. */
  latitude: number | null;
  longitude: number | null;
  parkType: string;
  noWaitTimesReason: string | null;
  attractionCount: number;
  seasonCount: number;
  curatedFieldCount: number;
  curationNote: string | null;
  updatedAt: string;
}

export interface AdminParkDetail extends AdminParkListItem {
  url: string;
  region: string | null;
  externalId: string;
  dataSources: string[];
  fields: CuratedField[];
  seasons: ParkSeason[];
  history: AuditEntry[];
}

export interface AdminAttractionListItem {
  id: string;
  name: string;
  upstreamName: string;
  slug: string;
  land: string | null;
  attractionType: string | null;
  minimumHeight: number | null;
  minimumHeightUnit: 'cm' | 'in' | null;
  isSeasonal: boolean;
  seasonMonths: number[] | null;
  seasonalityCurated: boolean;
  retiredAt: string | null;
  hasRideProfile: boolean;
  curatedFieldCount: number;
  updatedAt: string;
}

export interface RideProfile {
  attractionId: string;
  parkId: string;
  elements: string[];
  types: string[];
  manufacturerName: string | null;
  manufacturerTermId: string | null;
  model: string | null;
  openedYear: number | null;
  inversions: number | null;
  curatedStats: RideMeasurements | null;
  stats: (RideMeasurements & { source: string; sourceId: string | null }) | null;
  seededAt: string;
}

export interface RideMeasurements {
  topSpeedKmh: number | null;
  heightM: number | null;
  lengthM: number | null;
  durationSeconds: number | null;
}

export interface AdminAttractionDetail {
  id: string;
  name: string;
  upstreamName: string;
  slug: string;
  externalId: string;
  park: { id: string; name: string; slug: string; path: string } | null;
  url: string | null;
  latitude: number | null;
  longitude: number | null;
  retiredAt: string | null;
  retiredReason: string | null;
  fields: CuratedField[];
  rideProfile: RideProfile | null;
  history: AuditEntry[];
  updatedAt: string;
}

export type ParkSeasonKind =
  | 'halloween'
  | 'christmas'
  | 'summer_nights'
  | 'special_event'
  | 'opening'
  | 'closure'
  | 'maintenance';

export type ParkSeasonStatus = 'confirmed' | 'announced' | 'expected' | 'cancelled';

export interface ParkSeason {
  id: string;
  parkId: string;
  park?: { id: string; name: string; slug: string } | null;
  kind: ParkSeasonKind;
  name: string | null;
  startDate: string;
  endDate: string;
  /** Null means every day between start and end — never an empty array. */
  dates: string[] | null;
  status: ParkSeasonStatus;
  separateTicket: boolean;
  priceFrom: string | null;
  priceCurrency: string | null;
  opensAt: string | null;
  closesAt: string | null;
  attractionIds: string[] | null;
  url: string | null;
  sourceUrl: string | null;
  confirmedAt: string | null;
  note: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CurationResponse {
  changed: string[];
  auditId: string | null;
  fields: CuratedField[];
}

export interface AdminSessionInfo {
  id: string;
  current: boolean;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
}

/** The dashboard's counts, from `GET /v1/admin/content/overview`. */
export interface AdminOverview {
  parks: { total: number; curated: number; withSeasons: number };
  attractions: {
    total: number;
    curated: number;
    withRideProfile: number;
    seasonal: number;
    seasonalWithoutMonths: number;
  };
  seasons: { total: number; running: number; upcoming: number };
  curations: { last30Days: number; perDay: Array<{ day: string; count: number }> };
}
