import fs from 'fs';
import path from 'path';

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Module-level caches — populated on first call, reused for the lifetime of the
// serverless instance. Images only change on deployment, so staleness is not a concern.
const parkBackgroundCache = new Map<string, string | null>();
const attractionImageCache = new Map<string, string | null>();

export function getParkBackgroundImage(parkSlug: string): string | null {
  if (parkBackgroundCache.has(parkSlug)) return parkBackgroundCache.get(parkSlug)!;

  const publicDir = path.join(process.cwd(), 'public');
  const parkDir = `images/parks/${parkSlug}`;

  for (const ext of SUPPORTED_EXTENSIONS) {
    const relativePath = `${parkDir}/background${ext}`;
    const fullPath = path.join(publicDir, relativePath);
    if (fs.existsSync(fullPath)) {
      parkBackgroundCache.set(parkSlug, `/${relativePath}`);
      return `/${relativePath}`;
    }
  }

  parkBackgroundCache.set(parkSlug, null);
  return null;
}

export function getAttractionBackgroundImage(
  parkSlug: string,
  attractionSlug: string
): string | null {
  const cacheKey = `${parkSlug}/${attractionSlug}`;
  if (attractionImageCache.has(cacheKey)) return attractionImageCache.get(cacheKey)!;

  const publicDir = path.join(process.cwd(), 'public');

  // First, try to find attraction image in park's main directory (e.g., images/parks/phantasialand/taron.jpg)
  const parkDir = `images/parks/${parkSlug}`;
  for (const ext of SUPPORTED_EXTENSIONS) {
    const relativePath = `${parkDir}/${attractionSlug}${ext}`;
    const fullPath = path.join(publicDir, relativePath);
    if (fs.existsSync(fullPath)) {
      attractionImageCache.set(cacheKey, `/${relativePath}`);
      return `/${relativePath}`;
    }
  }

  // Second, try to find in attractions subdirectory (e.g., images/parks/phantasialand/attractions/taron.jpg)
  const attractionDir = `${parkDir}/attractions`;
  for (const ext of SUPPORTED_EXTENSIONS) {
    const relativePath = `${attractionDir}/${attractionSlug}${ext}`;
    const fullPath = path.join(publicDir, relativePath);
    if (fs.existsSync(fullPath)) {
      attractionImageCache.set(cacheKey, `/${relativePath}`);
      return `/${relativePath}`;
    }
  }

  // Return null if no attraction-specific image is found
  // Fallback to park background should be handled by the calling code
  attractionImageCache.set(cacheKey, null);
  return null;
}

/** Adds `backgroundImage` to each park in an array (mutates a shallow copy). */
export function enrichParksWithImages<T extends { slug: string }>(parks: T[]): (T & { backgroundImage: string | null })[] {
  return parks.map((park) => ({ ...park, backgroundImage: getParkBackgroundImage(park.slug) }));
}

/** Adds `backgroundImage` to each attraction, falling back to the park's background image. */
export function enrichAttractionsWithImages<T extends { slug: string; park?: { slug: string } }>(
  attractions: T[]
): (T & { backgroundImage: string | null })[] {
  return attractions.map((attraction) => {
    const image = attraction.park?.slug
      ? (getAttractionBackgroundImage(attraction.park.slug, attraction.slug) ??
        getParkBackgroundImage(attraction.park.slug))
      : null;
    return { ...attraction, backgroundImage: image };
  });
}
