import { HERO_BY_PARK, HERO_META, HERO_SRCS } from './manifest-hero';
import type { MediaFocus } from './types';

/**
 * The homepage / glossary hero, served from the media database.
 *
 * Replaces the generated `lib/hero-images.ts` + `lib/hero-images-meta.ts` pair.
 * Both used to be rebuilt by a script that re-fetched the API and re-derived the
 * captions on every build; now the rotation pool is just "images whose sidecar
 * claims the `hero` role" and the caption is assembled from data the database
 * already holds.
 *
 * **This module is client-safe, and must stay that way.** The rotation, the
 * crossfade and the caption that follows it all run in Client Components, so
 * anything imported here is shipped to every visitor. It therefore reads
 * `manifest-hero.ts` — a ~21 KB slice holding only the hero images and only the
 * fields the caption paints — never `manifest.ts`, which is ~107 KB of catalog
 * that would otherwise land in the bundle of every page with a hero.
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

/**
 * Public paths of every image eligible for the hero rotation.
 *
 * Passing a park slug narrows it to that park — used when the visitor is detected
 * inside a park, so the hero shows where they actually are.
 */
export function heroImageSrcs(parkSlug?: string | null): string[] {
  if (parkSlug) return HERO_BY_PARK[parkSlug] ?? [];
  return [...HERO_SRCS];
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
