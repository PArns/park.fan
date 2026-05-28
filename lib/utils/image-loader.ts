import type { ImageLoaderProps } from 'next/image';

/**
 * Shared next/image loader for full-bleed background images (homepage hero, park &
 * ride pages). Quality scales with the requested rendition width: small (mobile)
 * widths get lighter files where the loss is imperceptible and the LCP byte savings
 * matter most on slow networks; large (desktop) widths stay at full quality.
 *
 * Quality values must be listed in next.config `images.qualities`.
 */
export function backgroundImageLoader({ src, width }: ImageLoaderProps): string {
  const quality = width <= 828 ? 65 : width <= 1200 ? 85 : 90;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}
