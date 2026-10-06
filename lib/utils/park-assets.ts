import { getParkBackground, getRideImage } from '@/lib/media';
import { focusToObjectPosition, versionedImageSet, versionedSrc } from '@/lib/media/focus';
import type { MediaImage } from '@/lib/media/types';

/**
 * Park and ride photo resolution, backed by the media database manifest: a lookup is a map hit,
 * with no filesystem access at request time. A ride's photo comes from its sidecar, never its
 * filename, and paths are content-versioned (`?v=<hash>`) so renditions can be cached hard.
 * See docs/rules/media-database.md.
 */

/** Public path of a park's background photo, or `null`. */
export function getParkBackgroundImage(parkSlug: string): string | null {
  const image = getParkBackground(parkSlug);
  return image ? versionedSrc(image) : null;
}

/**
 * Public path of a ride's photo, or `null` when the ride has none. Falls back to any image showing
 * the ride when none is marked `ride-card`; a park-background fallback is the caller's decision.
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
 * Full aspect-ratio image set for a ride's photo, `[]` when the ride has none. No park fallback:
 * this feeds JSON-LD `image`, and the park's carousel as a picture of a dark ride is worse than
 * nothing.
 */
export function getAttractionImageSet(parkSlug: string, attractionSlug: string): string[] {
  const image = getRideImage(parkSlug, attractionSlug);
  return image ? versionedImageSet(image) : [];
}

/**
 * Adds `backgroundImage` **and** `backgroundPosition` to each park. The focal point travels with
 * the path because the cards are Client Components, and looking it up there would ship the whole
 * manifest to every visitor.
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
 * Same for attractions, and **only** the ride's own photo: the park's photo on a ride card says
 * „this is what the ride looks like", which is false, and repeats on every card without one.
 */
export function enrichAttractionsWithImages<T extends { slug: string; park?: { slug: string } }>(
  attractions: T[]
): (T & { backgroundImage: string | null; backgroundPosition: string })[] {
  return attractions.map((attraction) => {
    const image = attraction.park?.slug
      ? getRideImage(attraction.park.slug, attraction.slug)
      : null;
    return {
      ...attraction,
      backgroundImage: image ? versionedSrc(image) : null,
      backgroundPosition: positionOf(image),
    };
  });
}

/**
 * Where a card crops from when the image has no focal point: the top, as these photos have always
 * been framed. Setting a focal point opts an image out.
 */
export const CARD_FALLBACK_POSITION = '50% 0%';

function positionOf(image: MediaImage | null): string {
  return image?.focus ? focusToObjectPosition(image.focus) : CARD_FALLBACK_POSITION;
}

/**
 * `object-position` for a park or ride card photo, resolved server-side from the same image the
 * card paints, so the ride branch stops at the ride just as the photo does.
 */
export function getCardObjectPosition(parkSlug: string, attractionSlug?: string): string {
  return positionOf(
    attractionSlug ? getRideImage(parkSlug, attractionSlug) : getParkBackground(parkSlug)
  );
}
