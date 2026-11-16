/**
 * What a data key on api.park.fan can be granted, one scope per kind of data park.fan makes
 * itself. The developer portal, the key request form and the admin's key dialog all read this
 * list, so a scope cannot be offered in one place and missing in another. What the live sources
 * deliver (wait times, opening hours, weather) is not here: park.fan holds no rights to it and
 * cannot grant any (`OPEN_API_ROUTES`).
 */

/** One permission a data key can carry. */
export type ApiScope = 'forecasts' | 'planner' | 'statistics' | 'curated' | 'travel';

/** The scopes in the order the portal, the form and the admin list them. */
export const API_SCOPES = [
  'forecasts',
  'planner',
  'statistics',
  'curated',
  'travel',
] as const satisfies readonly ApiScope[];

/** `/v1/parks/{continent}/{country}/{city}/{park}`, shortened to keep the route lists readable. */
export const PARK_ROUTE = '/v1/parks/{…}/{park}';

/** One scope as the portal describes it. */
export interface ApiScopeDefinition {
  id: ApiScope;
  /** The routes it opens, as paths on api.park.fan; `{park}` stands for `PARK_ROUTE`. */
  routes: readonly string[];
  /**
   * Whether the API refuses these routes without a key today. False: the terms already ask for a
   * key, and the API still answers without one until it enforces the scope.
   */
  enforced: boolean;
}

/** Every scope with its routes. */
export const API_SCOPE_DEFINITIONS: Record<ApiScope, ApiScopeDefinition> = {
  forecasts: {
    id: 'forecasts',
    routes: [
      `${PARK_ROUTE}/best-days`,
      `${PARK_ROUTE}/calendar`,
      `${PARK_ROUTE}/predictions/yearly`,
      `${PARK_ROUTE}?forecast=true`,
      `${PARK_ROUTE}/attractions/{ride}?forecast=true`,
      '/v1/trip-regions/{region}/best-days',
      '/v1/trip-regions/{region}/calendar',
      '/v1/trip-regions/{region}/when',
    ],
    enforced: true,
  },
  planner: {
    id: 'planner',
    routes: [
      `${PARK_ROUTE}/plan/day`,
      `POST ${PARK_ROUTE}/plan/optimize`,
      '/v1/trip-regions/{region}/plan',
      '/v1/trip-regions/{region}/plan/ideas',
    ],
    enforced: true,
  },
  statistics: {
    id: 'statistics',
    routes: [
      `${PARK_ROUTE}/stats`,
      `${PARK_ROUTE}/stats/hourly`,
      `${PARK_ROUTE}/stats/day`,
      '/v1/analytics/best-times',
      '/v1/trip-regions/{region}/accuracy',
    ],
    enforced: false,
  },
  curated: {
    id: 'curated',
    routes: [
      `${PARK_ROUTE}/seasons`,
      '/v1/glossary/terms/counts',
      '/v1/glossary/terms/{term}/attractions',
    ],
    enforced: false,
  },
  travel: {
    id: 'travel',
    routes: [
      '/v1/trip-regions',
      '/v1/trip-regions/{region}',
      '/v1/trip-regions/{region}/tickets',
      '/v1/trip-regions/{region}/school-breaks',
    ],
    enforced: false,
  },
};

/**
 * What a key without a scope list opens: what every key opened before scopes existed. The API
 * reads a key that carries no scopes this way, so no key issued earlier loses a route.
 */
export const LEGACY_KEY_SCOPES: readonly ApiScope[] = ['forecasts', 'planner'];

/** The routes anyone may read without a key: the live sources' data and the park directory. */
export const OPEN_API_ROUTES: readonly string[] = [
  '/v1/parks',
  PARK_ROUTE,
  `${PARK_ROUTE}/wait-times`,
  `${PARK_ROUTE}/attractions`,
  `${PARK_ROUTE}/schedule`,
  `${PARK_ROUTE}/weather`,
  '/v1/discovery/geo',
  '/v1/search',
];

/** The API's base URL, which every route above is relative to. */
export const API_BASE_URL = 'https://api.park.fan';

/** The interactive reference (Swagger UI) and the OpenAPI document behind it. */
export const API_REFERENCE_URL = `${API_BASE_URL}/api`;
export const API_OPENAPI_URL = `${API_BASE_URL}/api-json`;

/** Answers 200 for an active key, 401 for an unknown or expired one; `?park=` checks a park. */
export const API_KEY_VERIFY_URL = `${API_BASE_URL}/v1/api-keys/verify`;

/** The header a key travels in. */
export const API_KEY_HEADER = 'X-API-Key';

/** What the API allows a caller without a key, per address. */
export const KEYLESS_LIMITS = { perMinute: 60, perHour: 1000 } as const;

/** What a key is allowed per hour unless agreed otherwise; the backend's default too. */
export const DEFAULT_KEY_REQUESTS_PER_HOUR = 1000;

/** The refusals a key can meet, as the API sends them in `error`, with their HTTP status. */
export const API_KEY_ERRORS = [
  { code: 'api-key-required', status: 401 },
  { code: 'api-key-invalid', status: 401 },
  { code: 'api-key-expired', status: 401 },
  { code: 'api-key-park-not-allowed', status: 403 },
  { code: 'api-key-park-required', status: 403 },
] as const;

/** One of those refusals. */
export type ApiKeyErrorCode = (typeof API_KEY_ERRORS)[number]['code'];

/** The value is a scope this module knows. */
export function isApiScope(value: unknown): value is ApiScope {
  return typeof value === 'string' && (API_SCOPES as readonly string[]).includes(value);
}

/** `scopes` in the catalog's order, unknown values and repeats dropped. */
export function sortScopes(scopes: readonly string[]): ApiScope[] {
  return API_SCOPES.filter((scope) => scopes.includes(scope));
}

/** The curl call the portal and the admin show for a key, against a route the key opens. */
export function apiKeyCurlExample(key: string): string {
  return `curl -H "${API_KEY_HEADER}: ${key}" ${API_BASE_URL}/v1/parks/europe/germany/rust/europa-park/best-days`;
}
