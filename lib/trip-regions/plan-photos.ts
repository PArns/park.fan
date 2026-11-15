import 'server-only';

import { getParkBackground, getParkImages } from '@/lib/media';
import { focusToObjectPosition, versionedSrc } from '@/lib/media/focus';
import { NOT_PHOTO_KINDS } from '@/lib/media/tags.mjs';
import type { TripRegion } from './types';

/**
 * The region parks' photos for the planner's Week view, one per park that has a photo in the media
 * database: its park background, else the first photo filed under the park (a ride, a land), so a
 * park without a curated background still gets its own picture. A diagram or a map filed under the
 * park is no photo of it, and its own lettering would show cropped. SERVER ONLY: `@/lib/media` is the
 * whole catalog, too large for the planner's Client Components, so the page resolves the few it
 * needs and passes them down as `TripRegionPlanner`'s `photos`.
 */
export function tripPlannerPhotos(
  region: Pick<TripRegion, 'parks'>
): Record<string, { src: string; position: string }> {
  const out: Record<string, { src: string; position: string }> = {};
  for (const park of region.parks) {
    // By path: the California planner's `disneyland-park` is Anaheim's, not Paris'.
    const lookup = { slug: park.slug, url: park.path };
    const image =
      getParkBackground(lookup) ??
      getParkImages(lookup).find((i) => !i.tags.some((tag) => NOT_PHOTO_KINDS.includes(tag))) ??
      null;
    if (image)
      out[park.slug] = { src: versionedSrc(image), position: focusToObjectPosition(image.focus) };
  }
  return out;
}
