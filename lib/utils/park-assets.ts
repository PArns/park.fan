import { getParkBackground, getRideImage } from '@/lib/media';
import { focusToObjectPosition, versionedImageSet, versionedSrc } from '@/lib/media/focus';
import type { MediaImage } from '@/lib/media/types';

/**
 * Park and ride photo resolution, backed by the media database.
 *
 * This module used to walk `public/images/parks` with `fs.existsSync` on every
 * cold serverless instance, trying four extensions per lookup and memoizing the
 * result in module state. All of that is gone: the manifest already knows which
 * image belongs to which park and ride, so a lookup is a map hit and there is no
 * filesystem access at request time at all.
 *
 * Two behaviours changed for the better as a result:
 *
 *  - **A ride's photo is no longer its filename.** The old resolver looked for
 *    `<attractionSlug>.jpg` on disk, so `maximus-blitzbahn.jpeg` never answered
 *    for the ride `maximus-blitz-bahn` and that photo was invisible on the site.
 *    The sidecar names the ride explicitly, so the file can be called anything.
 *  - **Paths are content-versioned** (`?v=<hash>`), changing when the pixels or
 *    the focal point change and never otherwise — so renditions can be cached
 *    hard without a retargeted crop being served stale.
 *
 * The exported signatures are unchanged, so no caller needed touching.
 */

/** Public path of a park's background photo, or `null`. */
export function getParkBackgroundImage(parkSlug: string): string | null {
  const image = getParkBackground(parkSlug);
  return image ? versionedSrc(image) : null;
}

/**
 * Public path of a ride's photo, or `null` when the ride has none.
 *
 * Falls back to any image showing that ride when none is marked `ride-card`, so a
 * ride that only appears in a Halloween shoot still shows a picture. Whether to
 * then fall back to the park background stays the caller's decision.
 */
export function getAttractionBackgroundImage(
  parkSlug: string,
  attractionSlug: string
): string | null {
  const image = getRideImage(parkSlug, attractionSlug);
  return image ? versionedSrc(image) : null;
}

/**
 * Full aspect-ratio image set for a park's hero photo, for structured-data `image`.
 * Prefers the 16:9 / 4:3 / 1:1 crops, falls back to the single source, else `[]`.
 */
export function getParkImageSet(parkSlug: string): string[] {
  const image = getParkBackground(parkSlug);
  return image ? versionedImageSet(image) : [];
}

/**
 * Full aspect-ratio image set for a ride's photo, falling back to the park's own
 * set so a photo-less ride page still carries an image. `[]` only when the park
 * has nothing either — the caller then uses its OG fallback.
 */
export function getAttractionImageSet(parkSlug: string, attractionSlug: string): string[] {
  const image = getRideImage(parkSlug, attractionSlug);
  return image ? versionedImageSet(image) : getParkImageSet(parkSlug);
}

/**
 * Adds `backgroundImage` **and** `backgroundPosition` to each park.
 *
 * The position travels with the path on purpose. A card cannot look the focal
 * point up itself without importing the manifest, and the cards are rendered by
 * Client Components (the live hub grid, nearby, favorites), so that import ships
 * the whole 107 KB catalog to every visitor. Resolving both here — once, on the
 * server, where the manifest already lives — is what keeps the browser out of it.
 */
export function enrichParksWithImages<T extends { slug: string }>(
  parks: T[]
): (T & { backgroundImage: string | null; backgroundPosition: string })[] {
  return parks.map((park) => {
    const image = getParkBackground(park.slug);
    return {
      ...park,
      backgroundImage: image ? versionedSrc(image) : null,
      backgroundPosition: positionOf(image),
    };
  });
}

/**
 * Same for attractions, falling back to the park's background photo — and to that
 * photo's focal point with it, so the two never come from different images.
 */
export function enrichAttractionsWithImages<T extends { slug: string; park?: { slug: string } }>(
  attractions: T[]
): (T & { backgroundImage: string | null; backgroundPosition: string })[] {
  return attractions.map((attraction) => {
    const image = attraction.park?.slug
      ? (getRideImage(attraction.park.slug, attraction.slug) ??
        getParkBackground(attraction.park.slug))
      : null;
    return {
      ...attraction,
      backgroundImage: image ? versionedSrc(image) : null,
      backgroundPosition: positionOf(image),
    };
  });
}

/**
 * Where a card crops from when the image has no focal point.
 *
 * Not centre: park and ride photos have always framed from the top, and switching
 * every un-tuned photo to centre-crop would silently re-frame the whole catalog.
 * Setting a focal point is what opts an image out of it.
 */
export const CARD_FALLBACK_POSITION = '50% 0%';

function positionOf(image: MediaImage | null): string {
  return image?.focus ? focusToObjectPosition(image.focus) : CARD_FALLBACK_POSITION;
}

/** `object-position` for a park/ride card photo, resolved server-side. */
export function getCardObjectPosition(parkSlug: string, attractionSlug?: string): string {
  return positionOf(
    attractionSlug
      ? (getRideImage(parkSlug, attractionSlug) ?? getParkBackground(parkSlug))
      : getParkBackground(parkSlug)
  );
}
