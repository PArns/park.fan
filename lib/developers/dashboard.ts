import type { DataApiKey } from '@/lib/admin/api-keys';
import { keyDaysSum } from './key-lifecycle';
import { sessionCall } from '@/lib/admin/session-client';
import type { KeyRequestInput, KeyRequestRecord } from './key-request';

/**
 * What the developer dashboard reads and writes, through `/api/developer/*` (the session proxy to
 * `/v1/developer/*`) and the shared session routes. Every call is the signed-in account's own:
 * the API answers only its keys and requests.
 */

/** The dashboard's answer from `GET /v1/developer/overview`. */
export interface DeveloperOverview {
  account: { email: string; displayName: string; role: string; totpEnabled: boolean };
  keys: DataApiKey[];
  requests: KeyRequestRecord[];
}

/** A key in clear, the one time the API answers it, and the row it belongs to. */
export interface RevealedKey {
  key: string;
  item: DataApiKey;
}

/** Where a key stands, for its chip. */
export type DeveloperKeyState = 'pickup' | 'active' | 'expired' | 'revoked';

/** The React Query key of the overview. */
export const DEVELOPER_OVERVIEW_QUERY_KEY = ['developer', 'overview'] as const;

const API = '/api/developer';

/** The signed-in account's keys and requests. A 401 means nobody is signed in. */
export function fetchDeveloperOverview(): Promise<DeveloperOverview> {
  return sessionCall<DeveloperOverview>(`${API}/overview`);
}

/** Files a key request. */
export function createKeyRequest(input: KeyRequestInput): Promise<{ item: KeyRequestRecord }> {
  return sessionCall(`${API}/requests`, { method: 'POST', body: input });
}

/** Withdraws an undecided request. */
export function withdrawKeyRequest(id: string): Promise<void> {
  return sessionCall(`${API}/requests/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/**
 * Gives a key a new secret and answers it this once. A key nobody has picked up yet is picked up
 * this way, with no grace period, since nobody has its first secret.
 */
export function rotateDeveloperKey(id: string, graceHours: number): Promise<RevealedKey> {
  return sessionCall(`${API}/keys/${encodeURIComponent(id)}/rotate`, {
    method: 'POST',
    body: { graceHours },
  });
}

/** Ends a key's grace period now: the replaced secret stops at once. */
export function endDeveloperKeyGrace(id: string): Promise<void> {
  return sessionCall(`${API}/keys/${encodeURIComponent(id)}/previous`, { method: 'DELETE' });
}

/** Revokes a key for good. */
export function revokeDeveloperKey(id: string): Promise<void> {
  return sessionCall(`${API}/keys/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/** Where a key stands, seen from `nowMs`. */
export function developerKeyState(
  key: Pick<DataApiKey, 'revokedAt' | 'expiresAt' | 'revealedAt'>,
  nowMs: number
): DeveloperKeyState {
  if (key.revokedAt) return 'revoked';
  if (key.expiresAt && Date.parse(key.expiresAt) <= nowMs) return 'expired';
  if (!key.revealedAt) return 'pickup';
  return 'active';
}

/**
 * The dashboard's tiles: requests of this hour, of today (UTC) and of the last 30 days, over every
 * key not revoked.
 */
export function usageTotals(keys: readonly DataApiKey[]): {
  thisHour: number;
  last30Days: number;
  today: number;
} {
  let thisHour = 0;
  let last30Days = 0;
  let today = 0;
  for (const key of keys) {
    if (key.revokedAt) continue;
    thisHour += key.requestsThisHour ?? 0;
    last30Days += keyDaysSum(key.stats, 'requests');
    today += key.stats?.days.at(-1)?.requests ?? 0;
  }
  return { thisHour, last30Days, today };
}
