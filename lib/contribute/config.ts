/**
 * Shared limits and accepted formats for the user photo contribution flow.
 *
 * These constants are imported by BOTH the client (dropzone validation, `accept`
 * attribute) and the server (the API route re-validates — never trust the client),
 * so they live in one place to stay in sync.
 */

/** Max number of photos per single submission. */
export const MAX_FILES = 10;

/**
 * Per-file size cap for the request that reaches our proxy. Each photo is POSTed
 * in its own request to /api/contribute/file, and Vercel's serverless functions
 * reject request bodies over ~4.5 MB, so we cap at 4 MB (leaving headroom for the
 * multipart envelope). Larger originals are downscaled client-side before upload
 * (see components/contribute/compress.ts) so high-res shots still come through.
 */
export const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB (Vercel body limit ~4.5 MB)

/**
 * Limit for the ORIGINAL the user may pick (before client-side downscaling). We
 * accept big high-res files here and shrink them to MAX_FILE_SIZE before upload.
 */
export const MAX_ORIGINAL_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

/** MIME types we accept. Covers the common high-res photo formats incl. Apple HEIC. */
export const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/tiff',
] as const;

/** Value for the file input's `accept` attribute. */
export const ACCEPT_ATTR = [
  ...ACCEPTED_MIME_TYPES,
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
  '.heic',
  '.heif',
  '.tif',
  '.tiff',
].join(',');

export type AcceptedMimeType = (typeof ACCEPTED_MIME_TYPES)[number];

export function isAcceptedMimeType(type: string): boolean {
  return (ACCEPTED_MIME_TYPES as readonly string[]).includes(type);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
