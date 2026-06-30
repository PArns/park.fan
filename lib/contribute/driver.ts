import 'server-only';

/**
 * Picks the storage backend for contributions.
 *
 * Vercel Blob is used whenever a `BLOB_READ_WRITE_TOKEN` is present (which it is on
 * any Vercel deployment with a linked Blob store), or when explicitly forced via
 * `STORAGE_DRIVER=vercel-blob`. Otherwise we fall back to the local filesystem
 * (`STORAGE_DRIVER=local`), which is for offline dev only — Vercel's runtime FS is
 * ephemeral/read-only.
 */
export type Driver = 'vercel-blob' | 'local';

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function resolveDriver(): Driver {
  if (process.env.STORAGE_DRIVER === 'local') return 'local';
  if (process.env.STORAGE_DRIVER === 'vercel-blob') return 'vercel-blob';
  return isBlobConfigured() ? 'vercel-blob' : 'local';
}
