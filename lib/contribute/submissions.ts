import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import { put, list, del } from '@vercel/blob';
import { resolveDriver } from './driver';
import { deleteImagesLocal } from './storage';
import type { SubmissionPatch, SubmissionRecord } from './types';

/**
 * Moderation queue for user contributions: list / read / update / delete.
 *
 * Two backends, picked by `resolveDriver()`:
 *  - **vercel-blob** (default in prod): each submission's metadata is a JSON object
 *    at `submissions/<id>.json` in the Blob store; the uploaded photos live under
 *    `contributions/<id>/…`. Listing reads the JSON objects back.
 *  - **local**: JSON files under `.data/contributions/` + images under `.uploads/`.
 *
 * Nothing here is shown publicly until a moderator flips `status` to `approved`.
 */

const META_PREFIX = 'submissions/';
const metaPath = (id: string) => `${META_PREFIX}${id}.json`;
const LOCAL_DIR = path.join(process.cwd(), '.data', 'contributions');

// ─── local driver ───────────────────────────────────────────────────────────

const local = {
  async record(rec: SubmissionRecord): Promise<void> {
    await fs.mkdir(LOCAL_DIR, { recursive: true });
    await fs.writeFile(path.join(LOCAL_DIR, `${rec.id}.json`), JSON.stringify(rec, null, 2));
  },
  async list(): Promise<SubmissionRecord[]> {
    let files: string[];
    try {
      files = await fs.readdir(LOCAL_DIR);
    } catch {
      return [];
    }
    const out: SubmissionRecord[] = [];
    for (const f of files.filter((f) => f.endsWith('.json'))) {
      try {
        out.push(JSON.parse(await fs.readFile(path.join(LOCAL_DIR, f), 'utf8')));
      } catch {
        /* skip unreadable record */
      }
    }
    return out;
  },
  async get(id: string): Promise<SubmissionRecord | null> {
    try {
      return JSON.parse(await fs.readFile(path.join(LOCAL_DIR, `${id}.json`), 'utf8'));
    } catch {
      return null;
    }
  },
  async remove(rec: SubmissionRecord): Promise<void> {
    await fs.rm(path.join(LOCAL_DIR, `${rec.id}.json`), { force: true });
    await deleteImagesLocal(rec.id);
  },
};

// ─── vercel blob driver ─────────────────────────────────────────────────────

const blob = {
  async record(rec: SubmissionRecord): Promise<void> {
    await put(metaPath(rec.id), JSON.stringify(rec), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });
  },
  async list(): Promise<SubmissionRecord[]> {
    const { blobs } = await list({ prefix: META_PREFIX, limit: 1000 });
    const records = await Promise.all(
      blobs.map(async (b) => {
        try {
          const res = await fetch(b.url, { cache: 'no-store' });
          return (await res.json()) as SubmissionRecord;
        } catch {
          return null;
        }
      })
    );
    return records.filter((r): r is SubmissionRecord => r !== null);
  },
  async get(id: string): Promise<SubmissionRecord | null> {
    const { blobs } = await list({ prefix: metaPath(id), limit: 1 });
    if (blobs.length === 0) return null;
    try {
      const res = await fetch(blobs[0].url, { cache: 'no-store' });
      return (await res.json()) as SubmissionRecord;
    } catch {
      return null;
    }
  },
  async remove(rec: SubmissionRecord): Promise<void> {
    // Images are deleted by their pathname (key); the private blob URL isn't stored.
    const keys = rec.images.map((img) => img.key).filter(Boolean);
    if (keys.length) await del(keys);
    const { blobs } = await list({ prefix: metaPath(rec.id), limit: 1 });
    if (blobs.length) await del(blobs[0].url);
  },
};

function driver() {
  return resolveDriver() === 'vercel-blob' ? blob : local;
}

// ─── public API ─────────────────────────────────────────────────────────────

export function recordSubmission(rec: SubmissionRecord): Promise<void> {
  return driver().record(rec);
}

export async function listSubmissions(): Promise<SubmissionRecord[]> {
  const records = await driver().list();
  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getSubmission(id: string): Promise<SubmissionRecord | null> {
  return driver().get(id);
}

export async function updateSubmission(
  id: string,
  patch: SubmissionPatch
): Promise<SubmissionRecord | null> {
  const d = driver();
  const existing = await d.get(id);
  if (!existing) return null;
  const next: SubmissionRecord = {
    ...existing,
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.caption !== undefined ? { caption: patch.caption } : {}),
    ...(patch.credit !== undefined ? { credit: patch.credit } : {}),
  };
  await d.record(next);
  return next;
}

export async function deleteSubmission(id: string): Promise<boolean> {
  const d = driver();
  const existing = await d.get(id);
  if (!existing) return false;
  await d.remove(existing);
  return true;
}
