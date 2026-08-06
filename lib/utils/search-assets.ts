import 'server-only';

import { getParkBackground, getRideImage } from '@/lib/media';
import { focusToObjectPosition, versionedSrc } from '@/lib/media/focus';
import type { SearchResult, SearchResultItem } from '@/lib/api/types';

/**
 * Attach each hit's photo from the media database.
 *
 * The backend's `/v1/search` knows nothing about our images — they live in this repo — so the
 * proxy route resolves them, exactly like `/api/nearby` and `/api/discovery` do for their park
 * lists. Without this the result rows fall back to their type icon and the palette looks empty
 * next to the nearby list, which does have photos.
 *
 * `server-only`: this reaches into `@/lib/media`, whose 107 KB catalog must never be bundled
 * into a Client Component. The import is what makes that a build error rather than a silent
 * regression somebody notices in a bundle report months later.
 *
 * Shows and restaurants get their park's photo (the media database has no per-show images and
 * that photo is the right "where is this" cue), rides get **only** their own — the park's photo
 * on a ride row claims to show the ride. Same rule as `enrichAttractionsWithImages`.
 */
export function enrichSearchResultsWithImages(data: SearchResult): SearchResult {
  return {
    ...data,
    results: data.results.map((item): SearchResultItem => {
      const parkSlug = item.type === 'park' ? item.slug : item.parentPark?.slug;
      if (!parkSlug) return item;

      const image =
        item.type === 'attraction'
          ? getRideImage(parkSlug, item.slug)
          : getParkBackground(parkSlug);
      if (!image) return item;

      return {
        ...item,
        imageUrl: versionedSrc(image),
        imagePosition: focusToObjectPosition(image.focus),
      };
    }),
  };
}
