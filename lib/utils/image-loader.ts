import type { ImageLoaderProps } from 'next/image';

/**
 * The widest rendition any full-bleed background source can actually produce. Every photo under
 * `public/images/parks` is ≤1024px on its long edge (`pnpm generate:image-crops` documents the same
 * invariant), and the image optimizer resizes with `withoutEnlargement: true` — so a request for
 * w=1200/1920/2560/3840 returns the *same 1024px pixels* as w=1080, just re-encoded at the higher
 * quality the old per-width rule handed out. 1080 is the smallest `deviceSizes` entry that covers a
 * 1024px source without downscaling it, so it's the useful ceiling.
 */
const MAX_USEFUL_WIDTH = 1080;

/**
 * Shared next/image loader for full-bleed background images (homepage hero, glossary, park &
 * ride pages, the announce section). These always sit under gradient overlays + opacity-90 / a
 * bg-background scrim (and a ken-burns transform on the hero), so an aggressive q50 is used
 * throughout — the loss is imperceptible there and the LCP byte savings matter most on slow
 * networks (a w=828 rendition is ~83 KB at q60 vs ~58 KB at q50).
 *
 * Every requested width above {@link MAX_USEFUL_WIDTH} is CLAMPED to it. next/image always emits
 * the full `deviceSizes` srcset, so `sizes="100vw"`/`115vw` made desktops pick the 1920w/3840w
 * candidate — which the optimizer could only answer with an upscale-free 1024px rendition anyway,
 * but at q75 (≈105 KB AVIF) instead of q50 (≈27 KB). Clamping keeps the identical resolution for
 * −74% bytes on the desktop LCP image, verified against the real hero at its ~1.6× display
 * upscale under the overlays. It also collapses the srcset from 8 distinct optimizer URLs to 4,
 * halving the cold-transform surface for a hero photo that rotates with every shell regeneration.
 *
 * Quality values must be listed in next.config `images.qualities`.
 */
export function backgroundImageLoader({ src, width }: ImageLoaderProps): string {
  // SVGs can't go through the optimizer (next/image responds 400 unless
  // dangerouslyAllowSVG is on) — and there's nothing to optimize anyway.
  if (src.endsWith('.svg')) return src;
  const w = Math.min(width, MAX_USEFUL_WIDTH);
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=50`;
}
