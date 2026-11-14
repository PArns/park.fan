import { SITE_URL } from '@/i18n/config';
import { liveTripRegion } from '@/lib/trip-regions/registry';
import { tripRegionPath } from '@/lib/trip-regions/paths';

const SITE = new URL(SITE_URL);
const ORIGINS = new Set([SITE.origin, `${SITE.protocol}//www.${SITE.host}`]);

const DIRECTIONS =
  /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=-?\d{1,2}(?:\.\d+)?,-?\d{1,3}(?:\.\d+)?$/;

/**
 * The one link off the site an answer may carry: Google Maps directions to coordinates, exactly in
 * the form the API's `get_directions` writes it. Opened in a new tab; never used for navigation.
 */
export function directionsHref(href: string | undefined): string | null {
  return href && DIRECTIONS.test(href) ? href : null;
}

/**
 * The link an answer may carry, or null to show it as text: only park.fan pages, absolute or as a
 * path. An answer is model output, so the URL is resolved the way a browser would (`/\host` and
 * `//host` leave the site) and kept only when it lands on park.fan over https. Returns the path
 * with query and hash, which is what a caller links, never the string it was given.
 */
export function safeAssistantHref(href: string | undefined): string | null {
  if (!href) return null;
  try {
    const url = new URL(href, SITE);
    // `https://park.fan//evil.example` and `/\evil.example` resolve on the site with a path that
    // starts `//`, which a link then reads as another host.
    if (!ORIGINS.has(url.origin) || url.pathname.startsWith('//')) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

const REGION_FOLDER = /^\/trip-regions\/([a-z0-9-]+)(?=$|[?#])/;

/**
 * A hub link as Parky writes it, `/trip-regions/<slug>…` (the API does not know the segments), as
 * the region's own segment in `locale` (`/kalifornien…`), so a press lands without the site's
 * redirect. Any other path, and a region the registry does not know, stays as it is.
 */
export function regionHubPath(path: string, locale: string): string {
  const match = REGION_FOLDER.exec(path);
  if (!match || !liveTripRegion(match[1])) return path;
  return `${tripRegionPath(match[1], locale)}${path.slice(match[0].length)}`;
}
