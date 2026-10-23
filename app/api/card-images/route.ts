import { cdnCacheHeaders } from '@/lib/api/cdn-cache-headers';
import { getCardImageMap } from '@/lib/utils/park-assets';

/**
 * Every park and ride card photo with its focal point, for the responses a browser fetches from
 * api.park.fan directly (`loadCardImageMap`). Built from the media manifest at deploy time and
 * changed only by a deploy, so it is prerendered and never starts a function.
 */
export const dynamic = 'force-static';

export function GET() {
  return Response.json(getCardImageMap(), {
    headers: cdnCacheHeaders(
      'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'
    ),
  });
}
