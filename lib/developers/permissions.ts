/**
 * What a data key on api.park.fan can be allowed to read, permission by permission, in the groups
 * the admin grants them in. Mirrors the backend's catalog (`src/api-keys/permissions.ts` in
 * v4.api.park.fan, also served at `/v1/api-keys/permissions`); the ids must match. The developer
 * portal, the dashboard's request form and the admin's key dialogs all read this list. Without a
 * key a caller reads the live wait times and nothing else (`KEYLESS_PERMISSIONS`).
 */

/** Every permission a key can carry. */
export const API_PERMISSIONS = [
  'live.waits',
  'live.schedule',
  'live.weather',
  'parks.directory',
  'parks.details',
  'parks.seasons',
  'rides.details',
  'rides.profiles',
  'stats.live',
  'stats.history',
  'stats.platform',
  'stats.accuracy',
  'forecasts.crowd',
  'forecasts.waits',
  'planner.day',
  'planner.trip',
  'travel.regions',
  'travel.tickets',
  'travel.school-breaks',
] as const;

/** One permission a key can carry. */
export type ApiPermission = (typeof API_PERMISSIONS)[number];

/** The groups, in the order every list shows them. */
export const API_PERMISSION_GROUP_IDS = [
  'live',
  'parks',
  'rides',
  'stats',
  'forecasts',
  'planner',
  'travel',
] as const;

/** One group of permissions. */
export type ApiPermissionGroupId = (typeof API_PERMISSION_GROUP_IDS)[number];

/** The permissions of each group, in catalog order; each permission is in exactly one. */
export const API_PERMISSION_GROUPS: Record<ApiPermissionGroupId, readonly ApiPermission[]> = {
  live: ['live.waits', 'live.schedule', 'live.weather'],
  parks: ['parks.directory', 'parks.details', 'parks.seasons'],
  rides: ['rides.details', 'rides.profiles'],
  stats: ['stats.live', 'stats.history', 'stats.platform', 'stats.accuracy'],
  forecasts: ['forecasts.crowd', 'forecasts.waits'],
  planner: ['planner.day', 'planner.trip'],
  travel: ['travel.regions', 'travel.tickets', 'travel.school-breaks'],
};

/** `/v1/parks/{continent}/{country}/{city}/{park}`, shortened to keep the route lists readable. */
export const PARK_ROUTE = '/v1/parks/{…}/{park}';

/** The routes each permission opens, as the portal lists them; `{…}/{park}` is `PARK_ROUTE`. */
export const PERMISSION_ROUTES: Record<ApiPermission, readonly string[]> = {
  'live.waits': [`${PARK_ROUTE}/wait-times`],
  'live.schedule': [`${PARK_ROUTE}/schedule`],
  'live.weather': [
    `${PARK_ROUTE}/weather`,
    `${PARK_ROUTE}/weather/forecast`,
    `${PARK_ROUTE}/weather/nowcast`,
  ],
  'parks.directory': [
    '/v1/parks',
    '/v1/parks/{continent}',
    '/v1/parks/{continent}/{country}',
    '/v1/parks/{continent}/{country}/{city}',
    '/v1/parks/popular',
    '/v1/discovery/geo',
    '/v1/discovery/continents',
    '/v1/discovery/continents/{continent}',
    '/v1/discovery/continents/{continent}/{country}',
    '/v1/discovery/continents/{continent}/{country}/summary',
    '/v1/discovery/{continent}/{country}',
    '/v1/discovery/nearby',
    '/v1/search',
    '/v1/sitemap/attractions',
  ],
  'parks.details': [PARK_ROUTE, '/v1/favorites'],
  'parks.seasons': [`${PARK_ROUTE}/seasons`],
  'rides.details': [`${PARK_ROUTE}/attractions`, `${PARK_ROUTE}/attractions/{ride}`],
  'rides.profiles': ['/v1/glossary/terms/counts', '/v1/glossary/terms/{term}/attractions'],
  'stats.live': [],
  'stats.history': [`${PARK_ROUTE}/stats`, `${PARK_ROUTE}/stats/hourly`, `${PARK_ROUTE}/stats/day`],
  'stats.platform': [
    '/v1/analytics/realtime',
    '/v1/analytics/ticker',
    '/v1/analytics/best-times',
    '/v1/page-views/top',
  ],
  'stats.accuracy': ['/v1/ml/accuracy/system', '/v1/trip-regions/{region}/accuracy'],
  'forecasts.crowd': [
    `${PARK_ROUTE}/calendar`,
    `${PARK_ROUTE}/best-days`,
    `${PARK_ROUTE}/predictions/yearly`,
    `${PARK_ROUTE}/parky-tip`,
    '/v1/trip-regions/{region}/calendar',
    '/v1/trip-regions/{region}/best-days',
    '/v1/trip-regions/{region}/when',
  ],
  'forecasts.waits': [
    `${PARK_ROUTE}?forecast=true`,
    `${PARK_ROUTE}/attractions/{ride}?forecast=true`,
  ],
  'planner.day': [`${PARK_ROUTE}/plan/day`, `POST ${PARK_ROUTE}/plan/optimize`],
  'planner.trip': ['/v1/trip-regions/{region}/plan', '/v1/trip-regions/{region}/plan/ideas'],
  'travel.regions': ['/v1/trip-regions', '/v1/trip-regions/{region}'],
  'travel.tickets': ['/v1/trip-regions/{region}/tickets'],
  'travel.school-breaks': ['/v1/trip-regions/{region}/school-breaks'],
};

/** What a caller without a key may read. */
export const KEYLESS_PERMISSIONS: readonly ApiPermission[] = ['live.waits'];

/** What a key issued before permissions existed reads: everything. */
export const LEGACY_KEY_PERMISSIONS: readonly ApiPermission[] = API_PERMISSIONS;

/** The API's base URL, which every route above is relative to. */
export const API_BASE_URL = 'https://api.park.fan';

/** The interactive reference (Swagger UI) and the OpenAPI document behind it. */
export const API_REFERENCE_URL = `${API_BASE_URL}/api`;
export const API_OPENAPI_URL = `${API_BASE_URL}/api-json`;

/** Answers 200 with the key's permissions for an active key, 401 otherwise; `?park=` checks a park. */
export const API_KEY_VERIFY_URL = `${API_BASE_URL}/v1/api-keys/verify`;

/** The catalog as the API serves it. */
export const API_PERMISSIONS_URL = `${API_BASE_URL}/v1/api-keys/permissions`;

/** The header a key travels in. */
export const API_KEY_HEADER = 'X-API-Key';

/** What the API allows a caller without a key, per address, on the wait times. */
export const KEYLESS_LIMITS = { perMinute: 60, perHour: 1000 } as const;

/** What a key is allowed per hour unless agreed otherwise; the backend's default too. */
export const DEFAULT_KEY_REQUESTS_PER_HOUR = 1000;

/** The refusals a key can meet, as the API sends them in `error`, with their HTTP status. */
export const API_KEY_ERRORS = [
  { code: 'api-key-required', status: 401 },
  { code: 'api-key-invalid', status: 401 },
  { code: 'api-key-expired', status: 401 },
  { code: 'api-key-permission-missing', status: 403 },
  { code: 'api-key-park-not-allowed', status: 403 },
  { code: 'api-key-park-required', status: 403 },
  { code: 'api-key-rate-limited', status: 429 },
] as const;

/** One of those refusals. */
export type ApiKeyErrorCode = (typeof API_KEY_ERRORS)[number]['code'];

/** The value is a permission this module knows. */
export function isApiPermission(value: unknown): value is ApiPermission {
  return typeof value === 'string' && (API_PERMISSIONS as readonly string[]).includes(value);
}

/** `permissions` in the catalog's order, unknown values and repeats dropped. */
export function sortPermissions(permissions: readonly string[]): ApiPermission[] {
  return API_PERMISSIONS.filter((permission) => permissions.includes(permission));
}

/** The group a permission belongs to. */
export function permissionGroup(permission: ApiPermission): ApiPermissionGroupId {
  return API_PERMISSION_GROUP_IDS.find((group) =>
    API_PERMISSION_GROUPS[group].includes(permission)
  ) as ApiPermissionGroupId;
}

/** The curl call the portal and the admin show for a key, against a route a key needs. */
export function apiKeyCurlExample(key: string): string {
  return `curl -H "${API_KEY_HEADER}: ${key}" ${API_BASE_URL}/v1/parks/europe/germany/rust/europa-park/best-days`;
}

/** The keyless call the portal shows: the one route open without a key. */
export const KEYLESS_CURL_EXAMPLE = `curl ${API_BASE_URL}/v1/parks/europe/germany/rust/europa-park/wait-times`;
