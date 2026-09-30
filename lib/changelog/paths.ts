/**
 * Where the public changelog lives, and the anchor of one release on it.
 *
 * Client-safe on purpose: the footer's version line and the page's own index both link into the
 * page, and `lib/changelog/index.ts` is `server-only` because it reads the content directory.
 */

/** The page exists in English only; every other spelling of the URL is a 308 to this one. */
export const CHANGELOG_PATH = '/en/changelog';

/** The fragment a release is reachable under: `v2.12.0`. */
export function changelogAnchor(version: string): string {
  return `v${version}`;
}

/** Link to one release on the page. */
export function changelogHref(version: string): string {
  return `${CHANGELOG_PATH}#${changelogAnchor(version)}`;
}
