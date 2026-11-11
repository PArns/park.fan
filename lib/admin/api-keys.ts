/**
 * The data API keys of `/admin/api-keys`: the keys that unlock park.fan's forecasts on
 * api.park.fan for one consumer each. The backend owns them (`/v1/admin/api-keys`, owner only);
 * this module holds what the page and its dialog share.
 */

/** What a key was issued for, as the backend stores it. */
export type DataApiKeyUsage = 'non-commercial' | 'commercial' | 'internal';

/** One key as the list shows it; the key itself is never in it. */
export interface DataApiKey {
  id: string;
  name: string;
  contact: string | null;
  usage: DataApiKeyUsage;
  note: string | null;
  /** The first ten characters, enough to recognise a key someone quotes back. */
  prefix: string;
  /** Requests allowed per clock hour; null means only the API's general limit. */
  requestsPerHour: number | null;
  /** Requests counted in the current clock hour. */
  requestsThisHour?: number;
  /** The parks the key may read forecasts for; null means every park. */
  allowedParkIds: string[] | null;
  /** The same parks with their names, as the list returns them. */
  allowedParks?: { id: string; name: string }[] | null;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

/** The answer to a create: the key in clear, this once, and the row it became. */
export interface CreatedDataApiKey {
  key: string;
  item: DataApiKey;
}

/** The labels the page uses for a key's usage. */
export const DATA_API_KEY_USAGE_LABELS: Record<DataApiKeyUsage, string> = {
  'non-commercial': 'nicht-kommerziell',
  commercial: 'kommerziell (mit Vereinbarung)',
  internal: 'park.fan selbst',
};

/** What a new key is allowed per hour unless the dialog says otherwise; the backend's default too. */
export const DEFAULT_REQUESTS_PER_HOUR = 1000;

/** The most a key may be allowed per hour; the backend's `MAX_REQUESTS_PER_HOUR`. */
export const MAX_REQUESTS_PER_HOUR = 1_000_000;

/**
 * The hourly allowance typed into a field: a whole number from 1, written plain or with German
 * thousands points or spaces (`1.000`, `1 000`), or empty for no per-key limit. `undefined` for
 * anything else, a decimal like `2.5` included, so the dialog can refuse it before the API does.
 */
export function parseRequestsPerHour(text: string): number | null | undefined {
  const compact = text.replace(/\s/g, '');
  if (compact === '') return null;
  if (!/^(\d+|\d{1,3}(\.\d{3})+)$/.test(compact)) return undefined;
  const value = Number(compact.replace(/\./g, ''));
  return value >= 1 && value <= MAX_REQUESTS_PER_HOUR ? value : undefined;
}

/** „12 von 1.000 in dieser Stunde“, or „ohne eigenes Limit“. */
export function formatHourlyUsage(
  key: Pick<DataApiKey, 'requestsPerHour' | 'requestsThisHour'>
): string {
  const used = (key.requestsThisHour ?? 0).toLocaleString('de-DE');
  return key.requestsPerHour === null
    ? `${used} in dieser Stunde, ohne eigenes Limit`
    : `${used} von ${key.requestsPerHour.toLocaleString('de-DE')} in dieser Stunde`;
}

/** „Alle Parks“, or the parks by name, as one line. */
export function formatAllowedParks(
  key: Pick<DataApiKey, 'allowedParks' | 'allowedParkIds'>
): string {
  if (!key.allowedParkIds || key.allowedParkIds.length === 0) return 'alle Parks';
  const names = key.allowedParks?.map((park) => park.name) ?? key.allowedParkIds;
  return names.join(', ');
}

/** The proxy path of the backend's key endpoints. */
export const DATA_API_KEYS_PATH = '/api/admin/api-keys';

/** The React Query key of the list. */
export const DATA_API_KEYS_QUERY_KEY = ['admin', 'api-keys'] as const;

/** The body of a create: empty optional fields are left out rather than sent as empty strings. */
export function createDataApiKeyBody(input: {
  name: string;
  contact: string;
  usage: DataApiKeyUsage;
  note: string;
  requestsPerHour: number | null;
  /** Empty for every park. */
  allowedParkIds: readonly string[];
}): string {
  const contact = input.contact.trim();
  const note = input.note.trim();
  return JSON.stringify({
    name: input.name.trim(),
    usage: input.usage,
    requestsPerHour: input.requestsPerHour,
    allowedParkIds: input.allowedParkIds.length > 0 ? [...input.allowedParkIds] : null,
    ...(contact && { contact }),
    ...(note && { note }),
  });
}

/** How a client sends the key, for the dialog to show next to it. */
export function dataApiKeyCurlExample(key: string): string {
  return `curl -H "X-API-Key: ${key}" https://api.park.fan/v1/parks/europe/germany/rust/europa-park/best-days`;
}
