import { HERO_LQIP } from './manifest-hero-lqip';

/**
 * The inline preview for a hero photo, a tiny WebP `data:` URL for `next/image`'s
 * `placeholder="blur"`. Server-side only, apart from the client-safe `./hero`: a page needs one
 * preview, so the server looks it up and passes it down rather than shipping the whole table.
 * `undefined` for an unknown path, where `RandomHeroImage` falls back to the brand gradient.
 */
export function heroBlurDataUrl(src: string | null | undefined): string | undefined {
  return src ? HERO_LQIP[src] : undefined;
}
