/**
 * The OG image URL for a list of path segments (e.g. `['de', 'europe', 'germany']`), with the card
 * version as `?v=` so a changed card gets a new URL in Cloudflare and in the social platforms'
 * caches.
 */
export function getOgImageUrl(path: (string | undefined)[]): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://park.fan';
  const cleanPath = path.filter((segment): segment is string => segment !== undefined);
  return `${baseUrl}/api/og/${cleanPath.join('/')}/${OG_IMAGE_FILENAME}?v=${OG_CARD_VERSION}`;
}

/**
 * The version of every OG card. A deploy does not purge `/api/og/` (lib/cloudflare/deploy-purge.ts),
 * so a cached card lives out its 30 days. Raise this in the pull request that changes what a card
 * shows: its layout, its strings, the brand marks or a photo. The route ignores the value; it only
 * makes the URL new.
 */
export const OG_CARD_VERSION = 1;

/**
 * Trailing filename on every OG URL: social crawlers like an image extension, and the route strips
 * the segment before parsing. `.jpg` because the endpoint returns JPEG. The route still serves the
 * old `og.png` directly (not as a redirect), since already indexed pages and cached previews use it
 * and a 301 would add a hop to the expensive requests.
 */
export const OG_IMAGE_FILENAME = 'og.jpg';
