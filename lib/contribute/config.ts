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
 * Per-file size cap. High-res phone/DSLR shots are the point here, so we allow
 * 25 MB — comfortably above a 24 MP JPEG. NOTE: the prototype POSTs files through
 * the Next.js route, and Vercel's Serverless/Edge functions reject request bodies
 * over ~4.5 MB. For production high-res uploads switch to a direct-to-storage
 * upload (presigned URL / Vercel Blob client upload) — see lib/contribute/storage.ts.
 */
export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

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
