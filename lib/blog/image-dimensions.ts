import { getMediaImageBySrc, getMediaImageForPath } from '@/lib/media';
import { cropDimensionsForPath } from '@/lib/media/crop-box.mjs';

/**
 * Intrinsic dimensions for an image referenced from a blog post, looked up in the
 * media database.
 *
 * Lets an inline article image reserve its box before the bytes arrive instead of
 * reflowing the surrounding text (CLS). Previously this only covered images inside
 * indexed gallery folders; now every image in the database answers, including the
 * park and ride photos a post links to directly.
 *
 * Returns null for anything outside the database — callers fall back to the old
 * height-auto behaviour.
 */
export function getBlogImageDimensions(src: string): { width: number; height: number } | null {
  // The authoring convention allows an `?align=` (and now `?v=`) query on the
  // src; `getMediaImageBySrc` strips it before looking up.
  const image = getMediaImageBySrc(src);
  if (image?.width && image.height) return { width: image.width, height: image.height };

  // Authors mostly reference a build-time CROP (`…-4x3.jpg`), which is not a row of its own —
  // `getMediaImageBySrc` answers null for it, and the caller then rendered `width={0} height={0}`.
  // That is worse than omitting them: `aspect-ratio: auto 0 / 0` is invalid, so the browser
  // reserved nothing and every inline image reflowed the article as it popped in.
  //
  // The crops are gitignored and cut on every build, so nothing can measure them here. Their size
  // is derived instead, through the same module the generator cuts them with — see crop-box.mjs
  // for why that is shared rather than copied.
  const source = getMediaImageForPath(src);
  if (!source?.width || !source.height) return null;
  return cropDimensionsForPath(src, source.width, source.height);
}
