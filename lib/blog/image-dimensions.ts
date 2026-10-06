import { getMediaImageBySrc, getMediaImageForPath } from '@/lib/media';
import { cropDimensionsForPath } from '@/lib/media/crop-box.mjs';

/**
 * Intrinsic dimensions for an image a blog post references, from the media database, so an
 * inline image reserves its box before the bytes arrive. Null for anything outside the database.
 */
export function getBlogImageDimensions(src: string): { width: number; height: number } | null {
  // The src may carry an `?align=` or `?v=` query; `getMediaImageBySrc` strips it.
  const image = getMediaImageBySrc(src);
  if (image?.width && image.height) return { width: image.width, height: image.height };

  // Authors mostly reference a build-time crop (`…-4x3.jpg`), which is not a row of its own, and
  // `width={0} height={0}` reserves no box at all. The crops are cut on every build, so their size
  // is derived through crop-box.mjs, the module the generator cuts them with.
  const source = getMediaImageForPath(src);
  if (!source?.width || !source.height) return null;
  return cropDimensionsForPath(src, source.width, source.height);
}
