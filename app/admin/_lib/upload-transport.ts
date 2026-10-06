'use client';

import { compressImage } from '@/components/contribute/compress';

/**
 * Getting an upload batch past Vercel's request-body limit, which `next start` does not have:
 * one request per photo, sized off the encoded length. Commits run in sequence because the first
 * opens the session pull request the rest join. The limit is documented in
 * `lib/contribute/config.ts`.
 */

/** Multipart envelope + headers, with room to spare under the ~4.5 MB ceiling. */
const ANALYZE_MAX_BYTES = 4 * 1024 * 1024;

/** Tighter, because `commit` sends base64: 3 MB of image is ~4.1 MB on the wire. */
const COMMIT_MAX_BYTES = 3 * 1024 * 1024;

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
 * Whether this file has to be re-encoded before the database will take it. HEIC from the Files
 * app or a share sheet is the case that matters, and `compressImage` passes a small one through
 * untouched, so format is asked before size.
 */
function needsTranscode(file: File): boolean {
  if (/hei[cf]/i.test(file.type)) return true;
  const ext = extensionOf(file);
  return ext === 'heic' || ext === 'heif' || !DATABASE_EXTENSIONS.has(ext);
}

/**
 * Re-encodes a file the media database cannot store as JPEG, or hands it back untouched. Like
 * every canvas pass it strips EXIF, which is why `analyze` runs first, on the original bytes.
 */
export async function toDatabaseFormat(file: File): Promise<{ file: File; transcoded: boolean }> {
  if (!needsTranscode(file)) return { file, transcoded: false };
  return { file: await reencodeAsJpeg(file), transcoded: true };
}

/**
 * The same photo with nothing in it but pixels, for pictures somebody else took: their EXIF in
 * `public/media/` would publish a GPS fix and a camera serial. Re-encoding is the only way to drop
 * it that keeps a portrait upright.
 */
export async function withoutMetadata(file: File): Promise<File> {
  return reencodeAsJpeg(file);
}

/**
 * Decode and re-encode as a full-resolution JPEG. Strips every metadata segment,
 * which is the point for `withoutMetadata` and a side effect for the transcode.
 */
async function reencodeAsJpeg(file: File): Promise<File> {
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
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
  } finally {
    bitmap.close();
  }
}

/** Longest edge kept when a photo has to be shrunk to fit. */
const MAX_DIMENSION = 4096;

/**
 * Fits a photo under the commit cap, or hands it back untouched when it already fits. It strips
 * EXIF, so it runs after `analyze` has read the GPS tag and capture date off the original.
 */
export async function fitForCommit(file: File): Promise<{ file: File; shrunk: boolean }> {
  if (file.size <= COMMIT_MAX_BYTES) return { file, shrunk: false };
  const fitted = await compressImage(file, COMMIT_MAX_BYTES, MAX_DIMENSION);
  return { file: fitted, shrunk: fitted !== file };
}

/**
 * The bytes `analyze` needs: for an oversized original, the first megabyte, where the EXIF
 * segment sits. Dimensions may not survive the cut; the route reports what it can.
 */
export function analyzePayload(file: File): Blob {
  return file.size <= ANALYZE_MAX_BYTES ? file : file.slice(0, 1024 * 1024, file.type);
}
