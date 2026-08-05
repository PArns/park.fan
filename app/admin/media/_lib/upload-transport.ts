'use client';

import { compressImage } from '@/components/contribute/compress';

/**
 * Getting an upload batch past the request-size limit.
 *
 * Both halves of the old flow put the whole batch in ONE request — `analyze` as a
 * single multipart, `commit` as a single JSON with every file base64-encoded.
 * Vercel's serverless functions reject bodies over ~4.5 MB, and base64 inflates by
 * a third, so a single 4 MB photo already exceeded it. The admin advertised
 * hundred-image batches and could not have committed three. It passed every local
 * test because `next start` has no such limit — the ceiling only exists in
 * production.
 *
 * So the batch is sent as one request per photo. The per-request body is then one
 * image instead of the sum of them, and batch size stops being a factor at all.
 * Commits go sequentially on purpose: the first one opens the session pull request
 * and the rest look it up and join, which they cannot do if they race.
 *
 * `lib/contribute/config.ts` reached the same conclusion for visitor uploads and is
 * where the 4.5 MB figure is documented.
 */

/** Multipart envelope + headers, with room to spare under the ~4.5 MB ceiling. */
export const ANALYZE_MAX_BYTES = 4 * 1024 * 1024;

/**
 * Tighter, because `commit` sends base64: 3 MB of image is ~4.1 MB on the wire.
 * Sizing this off the encoded length rather than the file's is the whole trick.
 */
export const COMMIT_MAX_BYTES = 3 * 1024 * 1024;

/** Longest edge kept when a photo has to be shrunk to fit. */
const MAX_DIMENSION = 4096;

/**
 * Fit a photo under the cap, or hand it back untouched when it already fits.
 *
 * **This strips EXIF** — a canvas re-encode cannot carry it — which is why it runs
 * AFTER `analyze` has read the GPS tag and capture date off the original, and why
 * the caller writes those into the sidecar explicitly. The alternative, compressing
 * first, would silently throw away the park/ride suggestion the whole flow is built
 * on.
 */
export async function fitForCommit(file: File): Promise<{ file: File; shrunk: boolean }> {
  if (file.size <= COMMIT_MAX_BYTES) return { file, shrunk: false };
  const fitted = await compressImage(file, COMMIT_MAX_BYTES, MAX_DIMENSION);
  return { file: fitted, shrunk: fitted !== file };
}

/**
 * The bytes `analyze` needs to answer, which is not the whole photo.
 *
 * EXIF sits in an APP1 segment right after the JPEG header, so for an oversized
 * original the first megabyte carries the GPS tag and the capture date. Dimensions
 * may not survive the truncation — the route reports what it can and the admin
 * fills in the rest, which beats refusing the file.
 */
export function analyzePayload(file: File): Blob {
  return file.size <= ANALYZE_MAX_BYTES ? file : file.slice(0, 1024 * 1024, file.type);
}
