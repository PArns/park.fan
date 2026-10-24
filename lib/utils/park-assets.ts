import { getParkBackground, getRideImage, MEDIA_IMAGES } from '@/lib/media';
import {
  CARD_FALLBACK_POSITION,
  rideCardImageKey,
  withParkCardImage,
  withRideCardImage,
  type CardImageFields,
  type CardImageMap,
} from '@/lib/media/card-images';
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

let cardImageMap: CardImageMap | null = null;

/**
 * Every card photo, by park slug and by ride, as the manifest-free lookup `/api/card-images`
 * serves. The enrich functions below read the same map, so a card's photo is decided in one place
 * whether the server or the browser attaches it.
 */
export function getCardImageMap(): CardImageMap {
  if (cardImageMap) return cardImageMap;
  const map: CardImageMap = { parks: {}, rides: {} };
  const entry = (image: MediaImage): [string, string] => [versionedSrc(image), positionOf(image)];
  for (const { park, ride, alsoRides } of MEDIA_IMAGES) {
    if (!park) continue;
    const background = getParkBackground(park);
    if (background) map.parks[park] = entry(background);
    for (const rideSlug of ride ? [ride, ...alsoRides] : alsoRides) {
      const image = getRideImage(park, rideSlug);
      if (image) map.rides[rideCardImageKey(park, rideSlug)] = entry(image);
    }
  }
  return (cardImageMap = map);
}

/**
 * Adds `backgroundImage` **and** `backgroundPosition` to each park. The focal point travels with
 * the path because the cards are Client Components, and looking it up there would ship the whole
 * manifest to every visitor.
 */
export function enrichParksWithImages<T extends { slug: string }>(
  parks: T[]
): (T & CardImageFields)[] {
  const map = getCardImageMap();
  return parks.map((park) => withParkCardImage(map, park));
}

/** Same for attractions, with only the ride's own photo (see {@link withRideCardImage}). */
export function enrichAttractionsWithImages<
  T extends { slug: string; park?: { slug: string } | null },
>(attractions: T[]): (T & CardImageFields)[] {
  const map = getCardImageMap();
  return attractions.map((attraction) => withRideCardImage(map, attraction));
}

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
