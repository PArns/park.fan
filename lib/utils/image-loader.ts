import type { ImageLoaderProps } from 'next/image';

/**
 * Shared next/image loader for full-bleed background images (homepage hero, park &
 * ride pages). Mobile-width renditions (≤828px) get a lighter q75 where the loss is
 * imperceptible and the LCP byte savings matter most on slow networks; everything
 * larger stays at full q90 for crisp desktop/tablet images.
 *
 * Quality values must be listed in next.config `images.qualities`.
 */
export function backgroundImageLoader({ src, width }: ImageLoaderProps): string {
  const quality = width <= 828 ? 75 : 90;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}
