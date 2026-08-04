import { getMediaImageBySrc } from '@/lib/media';

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
  if (!image?.width || !image.height) return null;
  return { width: image.width, height: image.height };
}
