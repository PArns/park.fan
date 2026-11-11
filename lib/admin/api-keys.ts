/**
 * The data API keys of `/admin/api-keys`: the keys that unlock park.fan's forecasts on
 * api.park.fan for one consumer each. The backend owns them (`/v1/admin/api-keys`, owner only);
 * this module holds what the page and its dialog share.
 */
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { TOKEN_EXPIRY_OPTIONS, hasPassed } from './mcp';

/** What a key was issued for, as the backend stores it. */
export type DataApiKeyUsage = 'non-commercial' | 'commercial' | 'internal';

/** One UTC day of a key's use: its requests, and how many of them its allowance refused. */
export interface DataApiKeyDay {
  /** `YYYY-MM-DD`, UTC. */
  date: string;
  requests: number;
  limited: number;
}

/** A key's use as the list returns it: the last 30 days and the last 12 months, oldest first. */
export interface DataApiKeyStats {
  days: DataApiKeyDay[];
  /** `month` is `YYYY-MM`, UTC. */
  months: { month: string; requests: number }[];
}

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
  /** Its use per day and month; absent from an API without the counters. */
  stats?: DataApiKeyStats;
  /** The parks the key may read forecasts for; null means every park. */
  allowedParkIds: string[] | null;
  /** The same parks with their names, as the list returns them. */
  allowedParks?: { id: string; name: string }[] | null;
  /** When the key stops working; null means never. An expired key can be extended. */
  expiresAt: string | null;
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

/** „12 von 1.000 in dieser Stunde“, or „12 in dieser Stunde, ohne eigenes Limit“. */
export function formatHourlyUsage(
  key: Pick<DataApiKey, 'requestsPerHour' | 'requestsThisHour'>
): string {
  const used = (key.requestsThisHour ?? 0).toLocaleString('de-DE');
  return key.requestsPerHour === null
    ? `${used} in dieser Stunde, ohne eigenes Limit`
    : `${used} von ${key.requestsPerHour.toLocaleString('de-DE')} in dieser Stunde`;
}

/**
 * „heute 120 · 30 Tage 3.456“, and „· 40 über dem Limit abgelehnt“ when the allowance refused any
 * of them. „Heute“ is the UTC day the counters run on.
 */
export function formatKeyUsage(stats: DataApiKeyStats): string {
  const count = (value: number) => value.toLocaleString('de-DE');
  const today = stats.days.at(-1)?.requests ?? 0;
  const total = stats.days.reduce((sum, day) => sum + day.requests, 0);
  const limited = stats.days.reduce((sum, day) => sum + day.limited, 0);
  const refused = limited > 0 ? ` · ${count(limited)} über dem Limit abgelehnt` : '';
  return `heute ${count(today)} · 30 Tage ${count(total)}${refused}`;
}

/**
 * The months worth a row, newest first: from the first with any request on, since a key's earlier
 * months are zeros it could not have earned. At least the current month.
 */
export function usedMonths(stats: DataApiKeyStats): DataApiKeyStats['months'] {
  const first = stats.months.findIndex((month) => month.requests > 0);
  return stats.months.slice(first === -1 ? -1 : first).reverse();
}

/** „November 2026“ for `2026-11`. */
export function formatUsageMonth(month: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}-01T00:00:00Z`));
}

/** „alle Parks“, or „nur“ and the parks by name, as one line. */
export function formatAllowedParks(
  key: Pick<DataApiKey, 'allowedParks' | 'allowedParkIds'>
): string {
  if (!key.allowedParkIds || key.allowedParkIds.length === 0) return 'alle Parks';
  const names = key.allowedParks?.map((park) => park.name) ?? key.allowedParkIds;
  return `nur ${names.join(', ')}`;
}

/** The time zone a key's end date is chosen and shown in: the admin's, Patrick's. */
export const KEY_EXPIRY_TIME_ZONE = 'Europe/Berlin';

/** What the end-date select offers: the MCP tokens' lifetimes, or a day of one's choosing. */
export type KeyExpiryChoice = 'never' | 'date' | `${number}`;

/** The select's options, in the order the token dialog shows its lifetimes. */
export const KEY_EXPIRY_CHOICES: ReadonlyArray<{ value: KeyExpiryChoice; label: string }> = [
  ...TOKEN_EXPIRY_OPTIONS.map((option) => ({
    value: (option.days === null ? 'never' : `${option.days}`) as KeyExpiryChoice,
    label: option.label,
  })),
  { value: 'date', label: 'Bis zu einem Datum' },
];

/**
 * The end date a choice stands for, as the API takes it: a lifetime counted from `nowMs`, the end
 * of the chosen day in Berlin, or null for never. `undefined` for a day that is missing, malformed
 * or already over, so the dialog can refuse it before the API does.
 */
export function keyExpiryFrom(
  choice: KeyExpiryChoice,
  day: string,
  nowMs: number
): string | null | undefined {
  if (choice === 'never') return null;
  if (choice === 'date') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return undefined;
    const end = fromZonedTime(`${day}T23:59:59.999`, KEY_EXPIRY_TIME_ZONE);
    return Number.isFinite(end.getTime()) && end.getTime() > nowMs ? end.toISOString() : undefined;
  }
  return new Date(nowMs + Number(choice) * 86_400_000).toISOString();
}

/** The Berlin day an end date falls on, `YYYY-MM-DD`, as a date field takes it. */
export function keyExpiryDay(iso: string): string {
  return formatInTimeZone(iso, KEY_EXPIRY_TIME_ZONE, 'yyyy-MM-dd');
}

/** „gültig bis 30.06.2027“, „abgelaufen am 31.01.2026“, or „unbefristet“. */
export function formatKeyExpiry(expiresAt: string | null, nowMs: number): string {
  if (!expiresAt) return 'unbefristet';
  const day = formatInTimeZone(expiresAt, KEY_EXPIRY_TIME_ZONE, 'dd.MM.yyyy');
  return hasPassed(expiresAt, nowMs) ? `abgelaufen am ${day}` : `gültig bis ${day}`;
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
  /** ISO 8601; null for a key that does not expire. */
  expiresAt: string | null;
}): string {
  const contact = input.contact.trim();
  const note = input.note.trim();
  return JSON.stringify({
    name: input.name.trim(),
    usage: input.usage,
    requestsPerHour: input.requestsPerHour,
    allowedParkIds: input.allowedParkIds.length > 0 ? [...input.allowedParkIds] : null,
    ...(input.expiresAt && { expiresAt: input.expiresAt }),
    ...(contact && { contact }),
    ...(note && { note }),
  });
}

/** How a client sends the key, for the dialog to show next to it. */
export function dataApiKeyCurlExample(key: string): string {
  return `curl -H "X-API-Key: ${key}" https://api.park.fan/v1/parks/europe/germany/rust/europa-park/best-days`;
}
