import 'server-only';

import { getParkBackground, getRideImage } from '@/lib/media';
import { focusToObjectPosition, versionedSrc } from '@/lib/media/focus';
import type { SearchResult, SearchResultItem } from '@/lib/api/types';

/**
 * Attach each search hit's photo from the media database, which the backend knows nothing about.
 * `server-only` so the media catalog can never reach a Client Component bundle. Shows and
 * restaurants get their park's photo; rides get only their own, as in
 * `enrichAttractionsWithImages`, since a park photo on a ride row claims to show the ride.
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
