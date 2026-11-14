import { getParkBackground, getRideImage, MEDIA_IMAGES, type ParkLookup } from '@/lib/media';
import { MEDIA_PARK_PATH_BY_SLUG } from '@/lib/media/manifest-parks';
import { imageParkKey } from '@/lib/media/park-path.mjs';
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
 * Every helper takes a park as a slug or as `{ slug, url }` (a `ParkBase` as it stands); pass the
 * path wherever the caller has it, because a bare `disneyland-park` means Paris.
 * See docs/rules/media-database.md.
 */

/** Public path of a park's background photo, or `null`. */
export function getParkBackgroundImage(park: ParkLookup): string | null {
  const image = getParkBackground(park);
  return image ? versionedSrc(image) : null;
}

/**
 * Public path of a ride's photo, or `null` when the ride has none. Falls back to any image showing
 * the ride when none is marked `ride-card`; a park-background fallback is the caller's decision.
 */
export function getAttractionBackgroundImage(
  park: ParkLookup,
  attractionSlug: string
): string | null {
  const image = getRideImage(park, attractionSlug);
  return image ? versionedSrc(image) : null;
}

/**
 * Full aspect-ratio image set for a park's hero photo, for structured-data `image`.
 * Prefers the 16:9 / 4:3 / 1:1 crops, falls back to the single source, else `[]`.
 */
export function getParkImageSet(park: ParkLookup): string[] {
  const image = getParkBackground(park);
  return image ? versionedImageSet(image) : [];
}

/**
 * Full aspect-ratio image set for a ride's photo, `[]` when the ride has none. No park fallback:
 * this feeds JSON-LD `image`, and the park's carousel as a picture of a dark ride is worse than
 * nothing.
 */
export function getAttractionImageSet(park: ParkLookup, attractionSlug: string): string[] {
  const image = getRideImage(park, attractionSlug);
  return image ? versionedImageSet(image) : [];
}

let cardImageMap: CardImageMap | null = null;

/**
 * Every card photo, by park geo path and by ride, as the manifest-free lookup `/api/card-images`
 * serves, with the path each photographed slug means when a card names no path. The enrich
 * functions below read the same map, so a card's photo is decided in one place whether the server
 * or the browser attaches it.
 */
export function getCardImageMap(): CardImageMap {
  if (cardImageMap) return cardImageMap;
  const map: CardImageMap = { parks: {}, rides: {}, paths: {} };
  const entry = (image: MediaImage): [string, string] => [versionedSrc(image), positionOf(image)];
  for (const image of MEDIA_IMAGES) {
    const path = imageParkKey(image, MEDIA_PARK_PATH_BY_SLUG);
    if (!image.park || !path) continue;
    const park = { slug: image.park, url: path };
    map.paths[image.park] ??= MEDIA_PARK_PATH_BY_SLUG[image.park] ?? path;
    const background = getParkBackground(park);
    if (background) map.parks[path] = entry(background);
    for (const rideSlug of image.ride ? [image.ride, ...image.alsoRides] : image.alsoRides) {
      const ride = getRideImage(park, rideSlug);
      if (ride) map.rides[rideCardImageKey(path, rideSlug)] = entry(ride);
    }
  }
  return (cardImageMap = map);
}

/**
 * Adds `backgroundImage` **and** `backgroundPosition` to each park. The focal point travels with
 * the path because the cards are Client Components, and looking it up there would ship the whole
 * manifest to every visitor.
 */
export function enrichParksWithImages<T extends { slug: string; url?: string | null }>(
  parks: T[]
): (T & CardImageFields)[] {
  const map = getCardImageMap();
  return parks.map((park) => withParkCardImage(map, park));
}

/** Same for attractions, with only the ride's own photo (see {@link withRideCardImage}). */
export function enrichAttractionsWithImages<
  T extends {
    slug: string;
    url?: string | null;
    park?: { slug: string; url?: string | null } | null;
  },
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
export function getCardObjectPosition(park: ParkLookup, attractionSlug?: string): string {
  return positionOf(attractionSlug ? getRideImage(park, attractionSlug) : getParkBackground(park));
}
