import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import { list, put } from '@vercel/blob';
import { resolveDriver } from './driver';
import type { StoredImageRecord } from './types';

/**
 * Server-side image storage for contributions. Every byte flows through this server, one request
 * per file, so the private Blob store's write token never leaves it and the images are only
 * served through our authenticated route. The local driver writes under `.uploads/` for offline
 * dev.
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

/**
 * Where the admin reads a stored image: our authenticated route, never the raw private blob URL.
 * Built from the key on the server, so nothing a browser sends decides what the moderator loads.
 */
export function contributionFileUrl(key: string): string {
  return `/api/admin/contributions/file?key=${encodeURIComponent(key)}`;
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
    url: contributionFileUrl(key),
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
    url: contributionFileUrl(blob.pathname),
    originalName,
    contentType,
    size: data.byteLength,
  };
}

/** Store one image via the configured driver. */
export function putImage(input: PutImageInput): Promise<StoredImageRecord> {
  return resolveDriver() === 'vercel-blob' ? putImageBlob(input) : putImageLocal(input);
}

/**
 * How many images a submission already holds. The upload route checks it against the ticket's
 * `maxFiles`, because finalize only counts what the browser reports and an upload it never reports
 * would otherwise be free.
 */
export async function countImages(submissionId: string): Promise<number> {
  if (resolveDriver() === 'vercel-blob') {
    const { blobs } = await list({ prefix: `contributions/${submissionId}/`, limit: 100 });
    return blobs.length;
  }
  try {
    return (await fs.readdir(submissionDir(submissionId))).length;
  } catch {
    return 0;
  }
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
