import { HERO_IMAGES } from '@/lib/hero-images';

/**
 * The curated hero images that belong to a given park, derived from the image path
 * (`/images/parks/<slug>/...`). Used to rotate only that park's images in the hero when the user is
 * detected inside the park. Returns an empty array when the park has no curated hero images.
 */
export function getParkHeroImages(parkSlug: string | null | undefined): string[] {
  if (!parkSlug) return [];
  const prefix = `/images/parks/${parkSlug}/`;
  return HERO_IMAGES.filter((src: string) => src.startsWith(prefix));
}
