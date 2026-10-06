/** The OG image URL for a list of path segments (e.g. `['de', 'europe', 'germany']`). */
export function getOgImageUrl(path: (string | undefined)[]): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://park.fan';
  const cleanPath = path.filter((segment): segment is string => segment !== undefined);
  return `${baseUrl}/api/og/${cleanPath.join('/')}/${OG_IMAGE_FILENAME}`;
}

/**
 * Trailing filename on every OG URL: social crawlers like an image extension, and the route strips
 * the segment before parsing. `.jpg` because the endpoint returns JPEG. The route still serves the
 * old `og.png` directly (not as a redirect), since already indexed pages and cached previews use it
 * and a 301 would add a hop to the expensive requests.
 */
export const OG_IMAGE_FILENAME = 'og.jpg';
