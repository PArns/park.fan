import 'server-only';

/**
 * A storage backend for contributions: Vercel Blob, or the local filesystem, which is for
 * offline dev only because Vercel's runtime filesystem is read-only.
 */
export type Driver = 'vercel-blob' | 'local';

/** Returns true when `BLOB_READ_WRITE_TOKEN` is set, i.e. a Vercel Blob store is linked. */
function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Returns the contribution storage backend: `STORAGE_DRIVER` when set, else Vercel Blob when a
 * token exists, else the local filesystem.
 */
export function resolveDriver(): Driver {
  if (process.env.STORAGE_DRIVER === 'local') return 'local';
  if (process.env.STORAGE_DRIVER === 'vercel-blob') return 'vercel-blob';
  return isBlobConfigured() ? 'vercel-blob' : 'local';
}
