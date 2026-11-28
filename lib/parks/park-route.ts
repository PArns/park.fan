import { notFound, permanentRedirect } from 'next/navigation';
import { getParkByGeoPath } from '@/lib/api/parks';
import { formatSlug } from '@/lib/i18n/helpers';
import type { ParkPathParts } from '@/lib/parks/paths';
import { stripNewPrefix } from '@/lib/utils';
import {
  findParkPageRedirect,
  findRelocatedParkRedirect,
  findRenamedParkRedirect,
} from '@/lib/utils/redirect-utils';

/*
 * The three redirects every route of a park runs, each as one call that sends the 308 itself.
 * They need a lookup, so they stay in the render
 * (docs/rules/a-redirect-thrown-from-a-render-carries-the-layout-as-its-body.md). `suffix` is what
 * the route adds below the park's path, such as its own localized segment or a ride's slug, so the
 * old URL of a sub-page lands on the same sub-page.
 */

/** 308s a URL whose city segment holds a park slug to the path that park really has. */
export async function redirectMalformedParkPath(
  { continent, country, city, parkSlug }: ParkPathParts,
  locale: string,
  suffix = ''
): Promise<void> {
  const malformed = await findParkPageRedirect(continent, country, city, parkSlug);
  if (malformed) permanentRedirect(`/${locale}${malformed}${suffix}`);
}

/**
 * 308s a park the API no longer has under the requested geo segments to its current path, and
 * returns where the slug is known nowhere. Only for after the API lookup failed: see
 * `findRelocatedParkRedirect`.
 */
export async function redirectRelocatedPark(
  { continent, country, city, parkSlug }: ParkPathParts,
  locale: string,
  suffix = ''
): Promise<void> {
  const relocated = await findRelocatedParkRedirect(continent, country, city, parkSlug);
  if (relocated) permanentRedirect(`/${locale}${relocated}${suffix}`);
}

/**
 * 308s a park the API returned under another path than the one requested: the API answered the
 * old path with a 301 that `fetch` followed, and the page would otherwise render at two URLs.
 */
export function redirectRenamedPark(
  park: { url?: string | null },
  requested: ParkPathParts,
  locale: string,
  suffix = ''
): void {
  const renamed = findRenamedParkRedirect(park, requested);
  if (renamed) permanentRedirect(`/${locale}${renamed}${suffix}`);
}

/**
 * The park of a sub-page route, or the redirect or 404 the route owes instead. The park is read
 * first and uncaught: a failed fetch has to reach the error boundary, because a swallowed outage
 * would become a `notFound()` the edge serves for up to a day.
 */
export async function resolveParkOrRedirect(parts: ParkPathParts, locale: string, suffix: string) {
  const park = await getParkByGeoPath(parts.continent, parts.country, parts.city, parts.parkSlug);
  await redirectMalformedParkPath(parts, locale, suffix);
  if (!park) {
    await redirectRelocatedPark(parts, locale, suffix);
    notFound();
  }
  redirectRenamedPark(park, parts, locale, suffix);
  return park;
}

/**
 * A park's name and its city's as the page prints them: the name without the „new" prefix, and the
 * city from the park's own record, which has the correct spelling („Brühl"), before the slug.
 */
export function parkDisplayNames(
  park: { name: string; city?: string | null },
  citySlug: string
): { parkName: string; cityName: string } {
  return { parkName: stripNewPrefix(park.name), cityName: park.city || formatSlug(citySlug) };
}
