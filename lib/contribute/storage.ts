import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import { put } from '@vercel/blob';
import { resolveDriver } from './driver';
import type { StoredImageRecord } from './types';

/**
 * Server-side image storage for contributions. All bytes flow THROUGH our server
 * (one request per file, each under Vercel's ~4.5 MB body limit) — the browser
 * never talks to the Blob store directly, so the private store's write token never
 * leaves the server.
 *
 *  - **vercel-blob**: `put()` with the server-only BLOB_READ_WRITE_TOKEN into a
 *    PRIVATE store (`access: 'private'`) — the bytes are never publicly reachable;
 *    they're streamed back only through our own authenticated route.
 *  - **local**: writes under `.uploads/` for offline dev (Vercel's FS is ephemeral).
 *
 * Either way, the record's `url` points at our serve route, not a public blob URL.
 */

export interface PutImageInput {
  submissionId: string;
  originalName: string;
  contentType: string;
  data: Buffer;
}

/** Strip anything unsafe so a filename can't escape the submission folder. */
export function safeName(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
  return base.length > 0 ? base.slice(0, 80) : 'image';
}

function submissionDir(submissionId: string): string {
  return path.join(process.cwd(), '.uploads', 'contributions', submissionId);
}

async function putImageLocal({
  submissionId,
  originalName,
  contentType,
  data,
}: PutImageInput): Promise<StoredImageRecord> {
  const dir = submissionDir(submissionId);
  await fs.mkdir(dir, { recursive: true });
  const filename = `${Date.now()}-${safeName(originalName)}`;
  await fs.writeFile(path.join(dir, filename), data);
  const key = `contributions/${submissionId}/${filename}`;
  return {
    key,
    url: `/api/admin/contributions/file?key=${encodeURIComponent(key)}`,
    originalName,
    contentType,
    size: data.byteLength,
  };
}

async function putImageBlob({
  submissionId,
  originalName,
  contentType,
  data,
}: PutImageInput): Promise<StoredImageRecord> {
  const pathname = `contributions/${submissionId}/${safeName(originalName)}`;
  const blob = await put(pathname, data, {
    access: 'private',
    contentType,
    addRandomSuffix: true,
  });
  return {
    key: blob.pathname,
    // Served only through our authenticated route — never the raw private blob URL.
    url: `/api/admin/contributions/file?key=${encodeURIComponent(blob.pathname)}`,
    originalName,
    contentType,
    size: data.byteLength,
  };
}

/** Store one image via the configured driver. */
export function putImage(input: PutImageInput): Promise<StoredImageRecord> {
  return resolveDriver() === 'vercel-blob' ? putImageBlob(input) : putImageLocal(input);
}

/** Remove a submission's local image folder (best-effort; local driver only). */
export async function deleteImagesLocal(submissionId: string): Promise<void> {
  await fs.rm(submissionDir(submissionId), { recursive: true, force: true });
}

/** Read a stored local image by its key (for the dev-only admin preview route). */
export async function readImageLocal(key: string): Promise<Buffer | null> {
  const root = path.join(process.cwd(), '.uploads');
  const target = path.join(root, key);
  if (!target.startsWith(root + path.sep)) return null;
  try {
    return await fs.readFile(target);
  } catch {
    return null;
  }
}
