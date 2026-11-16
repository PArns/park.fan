import type { DataApiKey, DataApiKeyStats } from '@/lib/admin/api-keys';
import { hasPassed } from '@/lib/utils/has-passed';

/*
 * What the admin and the developer dashboard both need about a key's life: its grace periods, when
 * a rotated secret stops working, and its use summed. Its own module, so the dashboard gets them
 * without the admin's helpers and their dependencies.
 */

/** A key's requests or refusals over the days its statistics cover (30, UTC). */
export function keyDaysSum(
  stats: DataApiKeyStats | undefined,
  field: 'requests' | 'limited'
): number {
  return (stats?.days ?? []).reduce((total, day) => total + day[field], 0);
}

/** The grace periods a rotation offers, in hours, shortest first; the admin and the dashboard both. */
export const ROTATION_GRACE_HOURS = [0, 1, 24, 168] as const;

/** How long a rotation keeps the old secret working beside the new one, in hours. */
export type RotationGraceHours = (typeof ROTATION_GRACE_HOURS)[number];

/** The grace period the dialog starts with: a day, time for a holder to deploy the new key. */
export const DEFAULT_ROTATION_GRACE_HOURS: RotationGraceHours = 24;

/**
 * Until when the secret a key's last rotation replaced still works, seen from `nowMs`: the end of
 * its grace period, or the key's own end date when that comes first, as the API decides it. Null
 * when there is none, it has run out, or the key is revoked.
 */
export function previousKeyValidUntil(
  key: Pick<DataApiKey, 'previousExpiresAt' | 'expiresAt' | 'revokedAt'>,
  nowMs: number
): string | null {
  if (key.revokedAt || !key.previousExpiresAt) return null;
  const until =
    key.expiresAt && Date.parse(key.expiresAt) < Date.parse(key.previousExpiresAt)
      ? key.expiresAt
      : key.previousExpiresAt;
  return hasPassed(until, nowMs) ? null : until;
}
