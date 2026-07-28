import type { ImageLoaderProps } from 'next/image';

/**
 * Widest rendition worth asking the optimizer for. The largest background source in the tree is
 * 2048px (`disneyland-park/background.jpg`; the rest are 1024px) and the optimizer resizes with
 * `withoutEnlargement: true`, so w=2560 and w=3840 can only ever return the same pixels as w=1920 —
 * three separate cache entries for one rendition. Clamping here changes no pixel and no byte at a
 * given quality; it just stops the srcset from spreading one rendition across three entries, which
 * matters for a hero photo that re-picks on every shell regeneration and is therefore regularly the
 * first request for its URL in a region.
 *
 * NOTE: deliberately NOT lowered to 1080 to match today's 1024px photos. Doing that caps every
 * background at 1024px forever, and 1024px is already the binding limit on wide screens (see
 * {@link qualityForWidth}) — leaving the ceiling at 1920 is what lets a re-sourced 2048px photo
 * actually deliver its extra detail without touching this file.
 */
const MAX_USEFUL_WIDTH = 1920;

/**
 * Quality per REQUESTED width — which, because the delivered rendition is capped by the source, is
 * how wide the browser intends to *paint* it, i.e. how far the rendition gets stretched. Compression
 * artifacts are magnified by that same factor, so quality has to rise with it:
 *
 * - **≤1080 → q50.** Painted at ~1:1 or downscaled — this is all of mobile (`115vw`/`60vw` resolves
 *   to w=640 or w=828 there). Under the gradient overlays the loss is invisible, and this is where
 *   the LCP byte savings matter most on slow networks.
 * - **≤1920 → q60.** Up to a ~1.9× stretch: a 1440–1600px desktop asks for w=1920. Roughly −40%
 *   against q75 with no visible difference at that magnification.
 * - **>1920 → q75.** A 2.5×+ stretch — ultrawides (3440px asks for w=3840) and 2× retina laptops
 *   (1512@2× also lands on w=3840). Verified side-by-side on `wodan-timburcoaster`'s wooden
 *   structure at a 3956px paint width: q50 visibly smears fine detail there, so this band keeps its
 *   quality. This is the band that cannot be cheapened — and the real limit in it is the 1024px
 *   SOURCE, not the encoder: re-encoding the same 1024px pixels at q75 costs 80 KB and still looks
 *   soft, while a 2048px source at q50 costs 95 KB and is dramatically sharper. If ultrawide
 *   sharpness matters, the fix is bigger source photos, not a higher quality here.
 */
function qualityForWidth(width: number): number {
  if (width <= 1080) return 50;
  if (width <= 1920) return 60;
  return 75;
}

/**
 * Shared next/image loader for full-bleed background images (homepage hero, glossary, park &
 * ride pages, the announce section). These always sit under gradient overlays + opacity-90 / a
 * bg-background scrim (and a ken-burns transform on the hero), so quality is tuned down as far as
 * the paint size allows — see {@link qualityForWidth} and {@link MAX_USEFUL_WIDTH}.
 *
 * Quality values must be listed in next.config `images.qualities`.
 */
export function backgroundImageLoader({ src, width }: ImageLoaderProps): string {
  // SVGs can't go through the optimizer (next/image responds 400 unless
  // dangerouslyAllowSVG is on) — and there's nothing to optimize anyway.
  if (src.endsWith('.svg')) return src;
  const w = Math.min(width, MAX_USEFUL_WIDTH);
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=${qualityForWidth(width)}`;
}
