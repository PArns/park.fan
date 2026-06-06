import type { ImageLoaderProps } from 'next/image';

/**
 * Shared next/image loader for full-bleed background images (homepage hero, glossary, park &
 * ride pages). These always sit under gradient overlays + opacity-90 (and a ken-burns
 * transform on the hero), so mobile-width renditions (≤828px) get a lighter q60 where
 * the loss is imperceptible and the LCP byte savings matter most on slow networks
 * — the hero LCP image was ~109 KB at q75 / ~80 KB at q60 (w=828). Desktop/tablet
 * (>828px) uses q75 (next/image's own default): under the overlays + opacity-90 it is
 * indistinguishable from q90 but ~30-40% lighter, so the heavy desktop rendition loads
 * faster on a cold/uncached reload — which shortens the blur-placeholder→photo swap that
 * otherwise reads as a flicker. The 828px cutoff is the clean mobile↔desktop boundary in
 * `deviceSizes`.
 *
 * Quality values must be listed in next.config `images.qualities`.
 */
export function backgroundImageLoader({ src, width }: ImageLoaderProps): string {
  const quality = width <= 828 ? 60 : 75;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}
