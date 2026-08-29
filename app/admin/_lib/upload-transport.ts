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

/**
 * What the media database will actually store. Anything else has to become one of
 * these before it is offered to `commit`, which validates the extension and
 * refuses the rest.
 */
const DATABASE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg']);

function extensionOf(file: File): string {
  return file.name.split('.').pop()?.toLowerCase() ?? '';
}

/**
 * Whether this file has to be re-encoded before the database will take it.
 *
 * The case that matters is **HEIC from an iPhone's camera roll**. `/contribute`
 * accepts it (`lib/contribute/config.ts`), the media database does not: the commit
 * route's extension check lists jpg/jpeg/png/webp/avif/svg and nothing else. Two
 * of the three ways a photo reaches this app never produce one — the camera button
 * and, usually, the photo library both hand over JPEG because Safari converts on
 * the way out — but "Choose File" from the Files app does, and so does a share
 * sheet on a device set to keep originals.
 *
 * `compressImage` is not the safety net it looks like: it returns anything already
 * under the size cap untouched, so a 2 MB HEIC sails through the whole client and
 * fails at the last step with `Bad extension "heic"`, after the analysis, after the
 * shrink, after the upload. Format is a different question from size and gets asked
 * first.
 */
export function needsTranscode(file: File): boolean {
  if (/hei[cf]/i.test(file.type)) return true;
  const ext = extensionOf(file);
  return ext === 'heic' || ext === 'heif' || !DATABASE_EXTENSIONS.has(ext);
}

/**
 * Re-encode into something the database stores, or hand the file back untouched.
 *
 * Safari decodes HEIC through the system codec, so `createImageBitmap` works on the
 * device this matters on. On a desktop browser that cannot, this throws with a
 * sentence a person can act on rather than letting the failure surface four steps
 * later as a server-side extension error.
 *
 * Like every canvas pass, this **strips EXIF** — capture date and GPS have to be
 * carried into the sidecar by the caller. That is why `analyze` runs first, on the
 * original bytes.
 */
export async function toDatabaseFormat(file: File): Promise<{ file: File; transcoded: boolean }> {
  if (!needsTranscode(file)) return { file, transcoded: false };

  let bitmap: ImageBitmap;
  try {
    // `from-image` explicitly: a phone photo taken in portrait carries its rotation
    // in EXIF, and the re-encode is the moment that tag stops existing. Left to the
    // browser's default, a sideways picture is what gets committed.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error(
      `${file.name}: dieses Format kann der Browser hier nicht öffnen. ` +
        `Auf dem iPhone geht es über „Aufnehmen" oder die Fotomediathek, ` +
        `sonst vorher als JPEG exportieren.`
    );
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error(`${file.name}: kein Canvas-Kontext für die Umwandlung.`);
    // Flattened onto white, like `compressImage` does, so a transparent source does
    // not come out of the JPEG encoder black.
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.92)
    );
    if (!blob) throw new Error(`${file.name}: die Umwandlung nach JPEG ist fehlgeschlagen.`);

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
    return {
      file: new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' }),
      transcoded: true,
    };
  } finally {
    bitmap.close();
  }
}

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
