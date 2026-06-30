import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import type { StoredImageRecord } from './types';

/**
 * Local-filesystem image store — used ONLY by the server-upload fallback
 * (`/api/contribute`) when no Vercel Blob token is configured (offline dev). In
 * production, photos are uploaded straight from the browser to Vercel Blob
 * (client direct upload, see app/api/contribute/upload), bypassing Vercel's
 * ~4.5 MB serverless body limit — they never pass through this module.
 *
 * NOTE: Vercel's runtime filesystem is ephemeral/read-only, so this is dev-only.
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

export async function putImageLocal({
  submissionId,
  originalName,
  contentType,
  data,
}: PutImageInput): Promise<StoredImageRecord> {
  const dir = submissionDir(submissionId);
  await fs.mkdir(dir, { recursive: true });
  const filename = safeName(originalName);
  await fs.writeFile(path.join(dir, filename), data);
  const key = `contributions/${submissionId}/${filename}`;
  return {
    key,
    // Served back for admin previews via /api/admin/contributions/file (dev only).
    url: `/api/admin/contributions/file?key=${encodeURIComponent(key)}`,
    originalName,
    contentType,
    size: data.byteLength,
  };
}

/** Remove a submission's local image folder (best-effort). */
export async function deleteImagesLocal(submissionId: string): Promise<void> {
  await fs.rm(submissionDir(submissionId), { recursive: true, force: true });
}

/** Read a stored local image by its key (for the dev-only admin preview route). */
export async function readImageLocal(key: string): Promise<Buffer | null> {
  // key = contributions/<id>/<file>; resolve under .uploads and guard traversal.
  const root = path.join(process.cwd(), '.uploads');
  const target = path.join(root, key);
  if (!target.startsWith(root + path.sep)) return null;
  try {
    return await fs.readFile(target);
  } catch {
    return null;
  }
}
