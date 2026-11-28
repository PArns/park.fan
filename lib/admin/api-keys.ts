/**
 * The data API keys of `/admin/api-keys`: the keys that unlock park.fan's own data on
 * api.park.fan for one consumer each, permission by permission (`lib/developers/permissions.ts`).
 * The backend owns them (`/v1/admin/api-keys`, owner only); this module holds what the page, its
 * dialogs and the developer dashboard share.
 */
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import {
  LEGACY_KEY_PERMISSIONS,
  sortPermissions,
  type ApiPermission,
} from '@/lib/developers/permissions';
import { TOKEN_EXPIRY_OPTIONS, hasPassed } from './mcp';
import {
  DEFAULT_ROTATION_GRACE_HOURS,
  ROTATION_GRACE_HOURS,
  keyDaysSum,
  previousKeyValidUntil,
  type RotationGraceHours,
} from '@/lib/developers/key-lifecycle';
import { formatCount } from '@/lib/admin/format-number';
import { isIsoDate } from '@/lib/utils/iso-date';

export { DEFAULT_ROTATION_GRACE_HOURS, ROTATION_GRACE_HOURS, previousKeyValidUntil };
export type { RotationGraceHours };

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
  /** The parks the key may read data for; null means every park. */
  allowedParkIds: string[] | null;
  /**
   * The permissions the key carries. Absent from an API that does not know permissions yet; null
   * for a key issued before them, which the API reads as `LEGACY_KEY_PERMISSIONS`.
   */
  permissions?: ApiPermission[] | null;
  /** The developer account that holds the key; null for a key the owner issued by hand. */
  ownerUserId?: string | null;
  /** That account's address and name, as the owner's list returns them. */
  owner?: { email: string; displayName: string } | null;
  /** The request the key was approved from. */
  requestId?: string | null;
  /**
   * When the developer first saw the key in clear; null while an approved key waits on the
   * dashboard to be picked up.
   */
  revealedAt?: string | null;
  /** The same parks with their names, as the list returns them. */
  allowedParks?: { id: string; name: string }[] | null;
  /** When the key stops working; null means never. An expired key can be extended. */
  expiresAt: string | null;
  createdAt: string;
  /** When the current secret was last sent; a rotation starts it over. */
  lastUsedAt: string | null;
  revokedAt: string | null;
  /** When the key last got a new secret; absent from an API without rotation. */
  rotatedAt?: string | null;
  /**
   * Until when the secret the last rotation replaced still works; null without one, in the past
   * once its grace period has run out.
   */
  previousExpiresAt?: string | null;
  /** When that replaced secret was last sent. */
  previousLastUsedAt?: string | null;
}

/** The answer to a create or a rotation: the key in clear, this once, and the row it became. */
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

/**
 * The API stores permissions: its key list carries the field. Until it does, a key opens what every
 * key opens, and the dialogs send no permissions, which an API without them would refuse as an
 * unknown field.
 */
export function apiStoresPermissions(items: readonly DataApiKey[]): boolean {
  return items.some((key) => key.permissions !== undefined);
}

/** What a key opens: its permissions, or for a key from before them everything. */
export function effectivePermissions(key: Pick<DataApiKey, 'permissions'>): ApiPermission[] {
  return key.permissions ? sortPermissions(key.permissions) : [...LEGACY_KEY_PERMISSIONS];
}

/** The key was issued before permissions and reads everything. */
export function isLegacyKey(key: Pick<DataApiKey, 'permissions'>): boolean {
  return key.permissions === null;
}

/**
 * The key waits on its developer's dashboard to be picked up. Only a key held by a developer
 * account has a pickup: one the owner issued by hand was shown in clear the moment it was made,
 * so its empty `revealedAt` means nothing.
 */
export function awaitsPickup(
  key: Pick<DataApiKey, 'ownerUserId' | 'revealedAt' | 'revokedAt'>
): boolean {
  return !key.revokedAt && Boolean(key.ownerUserId) && key.revealedAt === null;
}

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
  const used = formatCount(key.requestsThisHour ?? 0);
  return key.requestsPerHour === null
    ? `${used} in dieser Stunde, ohne eigenes Limit`
    : `${used} von ${formatCount(key.requestsPerHour)} in dieser Stunde`;
}

/**
 * „heute 120 · 30 Tage 3.456“, and „· 40 über dem Limit abgelehnt“ when the allowance refused any
 * of them. „Heute“ is the UTC day the counters run on.
 */
export function formatKeyUsage(stats: DataApiKeyStats): string {
  const count = formatCount;
  const today = stats.days.at(-1)?.requests ?? 0;
  const total = keyDaysSum(stats, 'requests');
  const limited = keyDaysSum(stats, 'limited');
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
    if (!isIsoDate(day)) return undefined;
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

/**
 * The path of one key, or of its rotation (`rotate`), the secret its last rotation kept
 * (`previous`) or the deletion of a revoked key (`delete`).
 */
export function dataApiKeyPath(id: string, part?: 'rotate' | 'previous' | 'delete'): string {
  const path = `${DATA_API_KEYS_PATH}/${encodeURIComponent(id)}`;
  return part ? `${path}/${part}` : path;
}

const GRACE_LABELS: Record<RotationGraceHours, string> = {
  0: 'Keine, sofort sperren',
  1: '1 Stunde',
  24: '24 Stunden',
  168: '7 Tage',
};

/** The grace periods the admin's rotate dialog offers, with their German labels. */
export const ROTATION_GRACE_CHOICES: ReadonlyArray<{ value: RotationGraceHours; label: string }> =
  ROTATION_GRACE_HOURS.map((value) => ({ value, label: GRACE_LABELS[value] }));

/** What a rotation with this grace period does to the old key, in one sentence. */
export function describeRotationGrace(hours: RotationGraceHours): string {
  if (hours === 0) {
    return 'Der alte Key wird sofort gesperrt: Wer ihn noch sendet, bekommt ab der nächsten Anfrage nur noch, was ohne Key offen ist.';
  }
  const label = ROTATION_GRACE_CHOICES.find((choice) => choice.value === hours)?.label;
  return `Der alte Key gilt noch ${label} neben dem neuen, damit der Inhaber umstellen kann, und wird dann gesperrt.`;
}

/** „14.11.2026, 10:00“: a moment as the admin reads it, in Berlin. */
export function formatKeyMoment(iso: string): string {
  return formatInTimeZone(iso, KEY_EXPIRY_TIME_ZONE, 'dd.MM.yyyy, HH:mm');
}

/**
 * „Alter Key gültig bis 14.11.2026, 10:00, zuletzt genutzt vor 5 Minuten“; `lastUsed` is the
 * last use as the page words it, null for never.
 */
export function formatPreviousKeyStatus(
  previousExpiresAt: string,
  lastUsed: string | null
): string {
  const used = lastUsed ? `zuletzt genutzt ${lastUsed}` : 'nie genutzt';
  return `Alter Key gültig bis ${formatKeyMoment(previousExpiresAt)}, ${used}`;
}

/** The React Query key of the list. */
export const DATA_API_KEYS_QUERY_KEY = ['admin', 'api-keys'] as const;

/** What a create sends: the dialog's fields, empty optional ones left out rather than sent empty. */
export interface CreateDataApiKeyBody {
  name: string;
  usage: DataApiKeyUsage;
  requestsPerHour: number | null;
  /** Null for every park. */
  allowedParkIds: string[] | null;
  /** Only to an API that stores permissions (`apiStoresPermissions`). */
  permissions?: ApiPermission[];
  expiresAt?: string;
  contact?: string;
  note?: string;
}

/** The body of a create, as an object for `adminFetch` to serialize. */
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
  /** Left out for an API that does not store permissions. */
  permissions?: readonly ApiPermission[];
}): CreateDataApiKeyBody {
  const contact = input.contact.trim();
  const note = input.note.trim();
  return {
    name: input.name.trim(),
    usage: input.usage,
    requestsPerHour: input.requestsPerHour,
    allowedParkIds: input.allowedParkIds.length > 0 ? [...input.allowedParkIds] : null,
    ...(input.permissions && { permissions: sortPermissions(input.permissions) }),
    ...(input.expiresAt && { expiresAt: input.expiresAt }),
    ...(contact && { contact }),
    ...(note && { note }),
  };
}
