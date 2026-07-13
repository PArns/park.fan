import fs from 'fs';
import path from 'path';

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Aspect-ratio crops Google prefers for structured-data images — supplying the
// same picture in several ratios lets it pick the best crop per SERP surface.
// Ordered widest-first (16:9 is the best generic thumbnail).
const IMAGE_ASPECTS = ['16x9', '4x3', '1x1'] as const;

// Module-level caches — populated on first call, reused for the lifetime of the
// serverless instance. Images only change on deployment, so staleness is not a concern.
const parkBackgroundCache = new Map<string, string | null>();
const attractionImageCache = new Map<string, string | null>();
const parkImageSetCache = new Map<string, string[]>();
const attractionImageSetCache = new Map<string, string[]>();

/**
 * Resolves the aspect-ratio image set for a base image path (extension-less,
 * relative to `public/`, e.g. `images/parks/phantasialand/background`).
 *
 * Returns every `<base>-<aspect>.<ext>` crop that exists (16:9 / 4:3 / 1:1). When
 * no crops are present it falls back to the single `<base>.<ext>` image, so the
 * pipeline degrades to the previous single-image behaviour until the cropped
 * assets are added. Returns `[]` when nothing exists (caller then uses its OG
 * fallback). All paths are site-relative (leading slash).
 */
function resolveImageSet(baseRelPath: string): string[] {
  const publicDir = path.join(process.cwd(), 'public');

  const variants: string[] = [];
  for (const aspect of IMAGE_ASPECTS) {
    for (const ext of SUPPORTED_EXTENSIONS) {
      const relativePath = `${baseRelPath}-${aspect}${ext}`;
      if (fs.existsSync(path.join(publicDir, relativePath))) {
        variants.push(`/${relativePath}`);
        break; // one file per aspect
      }
    }
  }
  if (variants.length > 0) return variants;

  for (const ext of SUPPORTED_EXTENSIONS) {
    const relativePath = `${baseRelPath}${ext}`;
    if (fs.existsSync(path.join(publicDir, relativePath))) return [`/${relativePath}`];
  }
  return [];
}

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

/**
 * Full aspect-ratio image set for a park's hero photo, for structured-data `image`.
 * Prefers 16:9/4:3/1:1 crops, falls back to the single `background.*`, else `[]`.
 */
export function getParkImageSet(parkSlug: string): string[] {
  if (parkImageSetCache.has(parkSlug)) return parkImageSetCache.get(parkSlug)!;
  const set = resolveImageSet(`images/parks/${parkSlug}/background`);
  parkImageSetCache.set(parkSlug, set);
  return set;
}

/**
 * Full aspect-ratio image set for a ride's photo. Resolution order: ride crops in
 * the park dir → ride crops in the `attractions/` subdir → the park's own hero set
 * (so a photo-less ride page still shows the park). Returns `[]` only when the park
 * has no image either — the caller then uses its OG fallback.
 */
export function getAttractionImageSet(parkSlug: string, attractionSlug: string): string[] {
  const cacheKey = `${parkSlug}/${attractionSlug}`;
  if (attractionImageSetCache.has(cacheKey)) return attractionImageSetCache.get(cacheKey)!;

  let set = resolveImageSet(`images/parks/${parkSlug}/${attractionSlug}`);
  if (set.length === 0)
    set = resolveImageSet(`images/parks/${parkSlug}/attractions/${attractionSlug}`);
  if (set.length === 0) set = getParkImageSet(parkSlug);

  attractionImageSetCache.set(cacheKey, set);
  return set;
}

/** Adds `backgroundImage` to each park in an array (mutates a shallow copy). */
export function enrichParksWithImages<T extends { slug: string }>(
  parks: T[]
): (T & { backgroundImage: string | null })[] {
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
