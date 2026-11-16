import 'server-only';
import {
  deletePrivateJson,
  listPrivateJson,
  readPrivateJson,
  writePrivateJson,
} from '@/lib/storage/private-json';
import type { KeyRequestDecision, KeyRequestRecord, KeyRequestStatus } from './key-request';

/**
 * The key requests from the developer portal, one private JSON document each at
 * `developer-requests/<id>.json` (Vercel Blob, or `.data/` in offline dev). They hold an
 * applicant's name and email, so nothing here is public and only the owner's admin routes read
 * them.
 */

const PREFIX = 'developer-requests/';
const pathFor = (id: string) => `${PREFIX}${id}.json`;

/**
 * How many undecided requests may wait at once. Turnstile keeps scripts out; this keeps a person
 * who solves it by hand from filling the store.
 */
export const MAX_PENDING_REQUESTS = 300;

/** Every stored request, newest first. */
export async function listKeyRequests(): Promise<KeyRequestRecord[]> {
  const pathnames = await listPrivateJson(PREFIX);
  const records = await Promise.all(pathnames.map((p) => readPrivateJson<KeyRequestRecord>(p)));
  return records
    .filter((record): record is KeyRequestRecord => record !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Why a new request was not stored. */
export type KeyRequestRefusal = 'already-pending' | 'queue-full';

/**
 * Stores a new request, unless one from the same address is still undecided (the applicant sent
 * the form twice) or the queue is full.
 */
export async function recordKeyRequest(
  record: KeyRequestRecord
): Promise<{ ok: true } | { ok: false; reason: KeyRequestRefusal }> {
  const pending = (await listKeyRequests()).filter((r) => r.status === 'pending');
  const email = record.email.toLowerCase();
  if (pending.some((r) => r.email.toLowerCase() === email)) {
    return { ok: false, reason: 'already-pending' };
  }
  if (pending.length >= MAX_PENDING_REQUESTS) return { ok: false, reason: 'queue-full' };
  await writePrivateJson(pathFor(record.id), record);
  return { ok: true };
}

/** Records the admin's decision; null when there is no such request. */
export async function decideKeyRequest(
  id: string,
  status: KeyRequestStatus,
  decision: KeyRequestDecision | undefined
): Promise<KeyRequestRecord | null> {
  const existing = await readPrivateJson<KeyRequestRecord>(pathFor(id));
  if (!existing) return null;
  const next: KeyRequestRecord = { ...existing, status, decision };
  await writePrivateJson(pathFor(id), next);
  return next;
}

/** Deletes a request for good; false when there was none. */
export async function deleteKeyRequest(id: string): Promise<boolean> {
  const existing = await readPrivateJson<KeyRequestRecord>(pathFor(id));
  if (!existing) return false;
  await deletePrivateJson(pathFor(id));
  return true;
}
