/**
 * Generate OG image URL for a given path
 * @param path - Array of path segments (e.g., ['de', 'europe', 'germany'])
 * @returns Full URL to the OG image endpoint
 */
export function getOgImageUrl(path: (string | undefined)[]): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://park.fan';
  const cleanPath = path.filter((segment): segment is string => segment !== undefined);
  return `${baseUrl}/api/og/${cleanPath.join('/')}/og.png`;
}
