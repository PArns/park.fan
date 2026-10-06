import { HERO_BY_PARK, HERO_META, HERO_SRCS } from './manifest-hero';
import type { MediaFocus } from './types';

/**
 * The homepage and glossary hero, served from the media database: the rotation pool is every image
 * whose sidecar claims the `hero` role.
 *
 * Client-safe, and must stay that way: the rotation, the crossfade and the caption run in Client
 * Components, so this reads the small `manifest-hero.ts` slice, never `manifest.ts`, which would
 * put the whole catalog in the bundle of every page with a hero.
 */

export interface HeroImageMeta {
  parkName: string;
  city: string;
  /** Matches the `geo.countries.*` translation key. */
  countrySlug: string;
  /** Park page path — makes the hero info panel clickable. */
  parkUrl?: string;
  attractionName?: string;
  /** Themed area within the park. */
  area?: string;
  /** Focal point, so a full-bleed crop keeps the subject in frame. */
  focus?: MediaFocus;
}

/** Caption data for a hero image by its public path — what the client rotation has. */
export function getHeroMetaBySrc(src: string): HeroImageMeta | null {
  return HERO_META[src] ?? null;
}

/** Public paths of every image eligible for the hero rotation. */
export function heroImageSrcs(): string[] {
  return [...HERO_SRCS];
}

/**
 * Hero images for one park, empty when no park is given. A separate function rather than an
 * optional argument on {@link heroImageSrcs}: a visitor at no park passes `undefined` and must get
 * no rotation, not every park's photos.
 */
export function parkHeroImageSrcs(parkSlug: string | null | undefined): string[] {
  if (!parkSlug) return [];
  return HERO_BY_PARK[parkSlug] ?? [];
}

/**
 * CSS `object-position` for a hero image, defaulting to centre.
 *
 * The hero is the most aggressive crop on the site — a 3:2 photo painted across a
 * 21:9 viewport loses most of its height — so a subject near the top or bottom
 * edge disappears there first. Same focal point as the cards, applied through the
 * client-safe slice.
 */
export function heroObjectPosition(src: string | null | undefined): string {
  const focus = src ? HERO_META[src]?.focus : undefined;
  return focus ? `${focus.x * 100}% ${focus.y * 100}%` : '50% 50%';
}

/**
 * Deterministic pick keyed to a time window: identical for all concurrent
 * requests, re-picked when the window rolls over. Server-rendered for LCP, so it
 * must not be random per request — that would make the shell uncacheable.
 */
export function pickHeroImage(
  windowMs: number,
  now: number = Date.now()
): { src: string; meta: HeroImageMeta | null } | null {
  if (!HERO_SRCS.length) return null;
  const src = HERO_SRCS[Math.floor(now / windowMs) % HERO_SRCS.length];
  return { src, meta: HERO_META[src] ?? null };
}
