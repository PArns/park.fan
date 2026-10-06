import type { ImageLoaderProps } from 'next/image';

/**
 * Widest rendition worth asking the optimizer for. It resizes with `withoutEnlargement`, so wider
 * requests return the same pixels under separate cache entries. Not lowered to today's 1024 px
 * sources, so a re-sourced 2048 px photo can deliver its extra detail without touching this file.
 */
const MAX_USEFUL_WIDTH = 1920;

/**
 * Quality per REQUESTED width, which (the rendition being capped by its source) says how far the
 * browser will stretch it; artifacts magnify by the same factor. ≤1080 is mobile at about 1:1 and
 * can drop to q50 under the overlays; ≤1920 gets q60; wider (ultrawide, 2× laptops) keeps q75,
 * where q50 visibly smears. Sharper ultrawides need bigger source photos, not a higher quality.
 */
function qualityForWidth(width: number): number {
  if (width <= 1080) return 50;
  if (width <= 1920) return 60;
  return 75;
}

/**
 * Shared next/image loader for full-bleed background images (hero, glossary, park and ride pages).
 * They sit under gradient overlays and scrims, so quality is as low as the paint size allows; see
 * {@link qualityForWidth}. Quality values must be listed in next.config `images.qualities`.
 */
export function backgroundImageLoader({ src, width }: ImageLoaderProps): string {
  // SVGs cannot go through the optimizer (it answers 400 without `dangerouslyAllowSVG`).
  if (src.endsWith('.svg')) return src;
  const w = Math.min(width, MAX_USEFUL_WIDTH);
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=${qualityForWidth(width)}`;
}

/**
 * The optimizer URL for a photo painted as a CSS `background-image` (planner blocks and panels),
 * where there is no srcset. Those surfaces are narrow and draw the photo faintly, so one w=828
 * rendition covers a 2× screen.
 */
export function backgroundPhotoUrl(src: string): string {
  if (src.startsWith('data:') || src.startsWith('blob:') || !src.startsWith('/')) return src;
  return backgroundImageLoader({ src, width: 828 });
}

/**
 * The optimizer URL for a small square image drawn through a component that takes a plain `src`
 * (the Radix `AvatarImage`). `width` must be one of `images.imageSizes` in next.config, q75 one of
 * `qualities`.
 */
export function avatarUrl(src: string, width: 96 | 256): string {
  if (src.startsWith('data:') || src.startsWith('blob:') || !src.startsWith('/')) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
}
