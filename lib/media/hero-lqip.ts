import { HERO_LQIP } from './manifest-hero-lqip';

/**
 * The inline preview for a hero photo — a 16 px WebP as a `data:` URL, for `next/image`'s
 * `placeholder="blur"`.
 *
 * **Server-side only.** It is a separate module from `./hero` for one reason: that one is
 * client-safe and imported by the rotation, the crossfade and the caption, so everything in it
 * ships to every visitor. A page needs exactly one preview — the photo it picked — and the table
 * is ~7 KB of base64, so the server looks the one up and passes it down as a prop.
 *
 * Returns `undefined` for an unknown path, which is the correct answer: `RandomHeroImage` falls
 * back to the shared brand gradient, the behaviour before previews existed.
 */
export function heroBlurDataUrl(src: string | null | undefined): string | undefined {
  return src ? HERO_LQIP[src] : undefined;
}
