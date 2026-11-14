import 'server-only';

import { getParkBackground } from '@/lib/media';
import { focusToObjectPosition, versionedSrc } from '@/lib/media/focus';
import type { TripRegion } from './types';

/**
 * The region parks' photos for the planner's Week view, one per park that has a park background
 * in the media database. SERVER ONLY: `@/lib/media` is the whole catalog, too large for the
 * planner's Client Components, so the page resolves the few it needs and passes them down as
 * `TripRegionPlanner`'s `photos`.
 */
export function tripPlannerPhotos(
  region: Pick<TripRegion, 'parks'>
): Record<string, { src: string; position: string }> {
  const out: Record<string, { src: string; position: string }> = {};
  for (const park of region.parks) {
    const image = getParkBackground(park.slug);
    if (image)
      out[park.slug] = { src: versionedSrc(image), position: focusToObjectPosition(image.focus) };
  }
  return out;
}
