import type { ImageLoaderProps } from 'next/image';

/**
 * Shared next/image loader for full-bleed background images (homepage hero, glossary, park &
 * ride pages). These always sit under gradient overlays + opacity-90 (and a ken-burns transform
 * on the hero), so mobile renditions (≤1080px) get a lighter q60 where the loss is imperceptible
 * and the LCP byte savings matter most on slow networks. The cutoff is 1080 (not 828) because
 * high-DPR phones request the **w=1080** candidate for the hero — the actual mobile LCP element —
 * so it must be q60: w=1080 is ~109 KB at q75 vs ~62 KB at q60 (−43% on the LCP image). Only the
 * genuine desktop renditions (>1080px → 1200/1920/2560) keep q75: under the overlays they're
 * indistinguishable from q90 but lighter, and the extra sharpness shortens the
 * blur-placeholder→photo swap that otherwise reads as a flicker on a cold/uncached reload.
 *
 * Quality values must be listed in next.config `images.qualities`.
 */
export function backgroundImageLoader({ src, width }: ImageLoaderProps): string {
  // SVGs can't go through the optimizer (next/image responds 400 unless
  // dangerouslyAllowSVG is on) — and there's nothing to optimize anyway.
  if (src.endsWith('.svg')) return src;
  const quality = width <= 1080 ? 60 : 75;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}
