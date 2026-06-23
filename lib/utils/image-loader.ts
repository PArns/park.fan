import type { ImageLoaderProps } from 'next/image';

/**
 * Shared next/image loader for full-bleed background images (homepage hero, glossary, park &
 * ride pages). These always sit under gradient overlays + opacity-90 / a bg-background scrim
 * (and a ken-burns transform on the hero), so mobile renditions (≤1080px) get an aggressive q50
 * where the loss is imperceptible and the LCP byte savings matter most on slow networks — e.g. a
 * w=828 hero rendition is ~83 KB at q60 vs ~58 KB at q50 (−30% on the mobile LCP image). The
 * cutoff is ≤1080 (not ≤828) so it still covers full-bleed backgrounds that don't under-declare
 * `sizes` — the hero + park/attraction heroes land on w=828, but e.g. the below-the-fold
 * announce background at 100vw still pulls w=1080 on high-DPR phones, and that should be q50 too.
 * Only the genuine desktop renditions (>1080px → 1200/1920/2560) keep q75: under the overlays they're
 * indistinguishable from q90 but lighter, and the extra sharpness shortens the
 * blur-placeholder→photo swap that otherwise reads as a flicker on a cold/uncached reload.
 *
 * Quality values must be listed in next.config `images.qualities`.
 */
export function backgroundImageLoader({ src, width }: ImageLoaderProps): string {
  // SVGs can't go through the optimizer (next/image responds 400 unless
  // dangerouslyAllowSVG is on) — and there's nothing to optimize anyway.
  if (src.endsWith('.svg')) return src;
  const quality = width <= 1080 ? 50 : 75;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}
