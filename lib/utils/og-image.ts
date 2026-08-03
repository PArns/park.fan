/**
 * Generate OG image URL for a given path
 * @param path - Array of path segments (e.g., ['de', 'europe', 'germany'])
 * @returns Full URL to the OG image endpoint
 */
export function getOgImageUrl(path: (string | undefined)[]): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://park.fan';
  const cleanPath = path.filter((segment): segment is string => segment !== undefined);
  return `${baseUrl}/api/og/${cleanPath.join('/')}/${OG_IMAGE_FILENAME}`;
}

/**
 * Trailing filename on every OG URL. Social crawlers like seeing an image extension, and the
 * route strips this segment before parsing the path — it carries no routing meaning.
 *
 * `.jpg` because that is what the endpoint actually returns (see lib/og/jpeg.ts). It used to say
 * `.png` from when Satori's PNG output was served straight through; once the cards were re-encoded
 * the name no longer described the bytes.
 *
 * The route still accepts the old `og.png` — see OG_IMAGE_FILENAMES there. Not as a redirect: the
 * old name is in every already-indexed page and every cached social preview, and answering those
 * with a 301 would add a hop to requests that are already the expensive part of the OG bill. They
 * are served the image directly and simply age out as pages are re-crawled.
 */
export const OG_IMAGE_FILENAME = 'og.jpg';
