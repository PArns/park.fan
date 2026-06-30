/**
 * Client-side image downscaling so high-res originals fit under the proxy's
 * per-request size cap (our serverless route can't accept bodies over ~4.5 MB).
 *
 * Deliberately gentle and lazy:
 *  - Files already under the cap are returned **untouched** (no re-encode, no loss).
 *  - Only oversized files are processed, and then with the lightest touch that fits:
 *    high JPEG quality first (≥ 0.8), and the resolution is only reduced further if
 *    quality alone can't get it under the cap.
 *  - Formats the browser can't decode on a canvas (e.g. HEIC) are returned as-is.
 */
export async function compressImage(file: File, maxBytes: number, maxDim = 4096): Promise<File> {
  // Only when necessary — a file that already fits keeps its pristine original.
  if (file.size <= maxBytes) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // undecodable (e.g. HEIC) — let server-side validation handle it
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
  const longestEdge = Math.max(bitmap.width, bitmap.height);
  // Start at full resolution (capped at maxDim only if the image is bigger than that).
  let scale = Math.min(1, maxDim / longestEdge);
  // Try gentle quality first, then step down a little, then shrink resolution.
  const qualities = [0.92, 0.86, 0.8];

  let best: Blob | null = null;
  try {
    for (let attempt = 0; attempt < 5; attempt++) {
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;
      // Flatten onto white so transparent PNGs don't turn black as JPEG.
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(bitmap, 0, 0, width, height);

      for (const q of qualities) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/jpeg', q)
        );
        if (!blob) continue;
        if (!best || blob.size < best.size) best = blob;
        if (blob.size <= maxBytes) {
          return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
        }
      }
      // Quality alone didn't fit at this resolution — shrink and retry.
      scale *= 0.8;
    }
  } finally {
    bitmap.close();
  }

  // Couldn't get under the cap without going lower than we'd like — use the
  // smallest we produced (still ≥ 0.8 quality), or fall back to the original.
  return best ? new File([best], `${baseName}.jpg`, { type: 'image/jpeg' }) : file;
}
