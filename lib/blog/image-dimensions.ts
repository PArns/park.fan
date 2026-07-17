import 'server-only';
import { BLOG_GALLERY_FOLDERS } from './manifest';

let bySrc: Map<string, { width: number; height: number }> | null = null;

/**
 * Intrinsic dimensions for a blog image, looked up from the build-time manifest
 * (scripts/generate-blog-manifest.mjs bakes them in via sharp). Lets inline
 * article images reserve their box before the bytes load instead of reflowing
 * the surrounding text (CLS). Returns null for images outside the indexed
 * gallery folders — callers fall back to the old height-auto behavior.
 */
export function getBlogImageDimensions(src: string): { width: number; height: number } | null {
  if (!bySrc) {
    bySrc = new Map();
    for (const images of Object.values(BLOG_GALLERY_FOLDERS)) {
      for (const img of images) {
        if (img.width && img.height) bySrc.set(img.src, { width: img.width, height: img.height });
      }
    }
  }
  // Authoring convention allows an ?align= query on the src — strip it for the lookup.
  const clean = src.split('?')[0];
  return bySrc.get(clean) ?? null;
}
