import type { ParkLookup } from '@/lib/media';
import { getRideImage } from '@/lib/media';
import { getOgImageUrl } from '@/lib/utils/og-image';

/**
 * The OG card a ride page points at: the ride's own card when the media database has a photo of
 * the ride, else its park's card, so a ride without a photo adds no card URL of its own for
 * crawlers to render (docs/features/og-images.md).
 *
 * @param park      The ride's park, for the photo lookup; without it the park card is used.
 * @param segments  `[locale, continent, country, city, park, ride]`.
 * @returns         The card URL, and whether that card is the ride's own (for its alt text).
 */
export function getRideOgImage(
  park: ParkLookup | null | undefined,
  segments: [string, string, string, string, string, string]
): { url: string; isRideCard: boolean } {
  const isRideCard = getRideImage(park, segments[5]) !== null;
  return {
    url: getOgImageUrl(isRideCard ? segments : segments.slice(0, 5)),
    isRideCard,
  };
}
