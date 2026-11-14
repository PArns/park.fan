import { BEST_TIME_SEGMENTS } from '../best-time/segments';
import type { TripRegionConfig } from './registry';

/**
 * The trip regions' URLs as `next.config.ts` serves them, built from the registry: one route
 * folder, `app/[locale]/trip-regions/[region]`, answers every region's hub, its months and its
 * best-time pages under the region's own segment per locale (`/de/kalifornien`, `/en/california`),
 * and no URL a reader sees names the folder. `next.config.ts` passes the live regions;
 * `pnpm test:trip-regions` passes every region, so a coming region's URLs are tested before it goes
 * live. Free of `@/` imports, since the config loads before the aliases exist.
 * See docs/features/trip-regions.md.
 */

/** A redirect as `redirects()` returns it. */
export interface TripRegionRedirect {
  source: string;
  destination: string;
  permanent: boolean;
}

/** A rewrite as `rewrites()` returns it. */
export interface TripRegionRewrite {
  source: string;
  destination: string;
}

/** An edge window for a source, which `next.config.ts` turns into its `CDN-Cache-Control`. */
export interface TripRegionWindow {
  source: string;
  window: string;
}

/** The internal route folder of a region in a locale, which only rewrites reach. */
export function tripRegionFolder(locale: string, slug: string): string {
  return `/${locale}/trip-regions/${slug}`;
}

/** The locales each of a region's segments is spelled in, segment first. */
function regionSpellings(region: TripRegionConfig): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const [locale, segment] of Object.entries(region.segments)) {
    out.set(segment, [...(out.get(segment) ?? []), locale]);
  }
  return out;
}

/** A region's resort segments under its best-time pages, as a path pattern, or `null`. */
function resortPattern(region: TripRegionConfig): string | null {
  const resorts = region.bestTime.flatMap((page) => (page.segment ? [page.segment] : []));
  return resorts.length ? `:resort(${resorts.join('|')})` : null;
}

/** The best-time segment of a locale. */
const bestTimeOf = (locale: string) =>
  BEST_TIME_SEGMENTS[locale as keyof typeof BEST_TIME_SEGMENTS] ?? BEST_TIME_SEGMENTS.en;

/**
 * Every region's redirects: the internal route folder to the region's own segment; another
 * locale's spelling of the region (`/de/california`) and of the best-time segment
 * (`/de/orlando/best-time-to-visit`) to the locale's own; and an unprefixed path whose segment
 * only one locale spells (`/kalifornien`) to that locale. A segment every locale shares
 * (`/orlando`) is left to the proxy's language negotiation.
 */
export function tripRegionRedirects(regions: readonly TripRegionConfig[]): TripRegionRedirect[] {
  const rules: TripRegionRedirect[] = [];
  const bestTimeAll = Object.values(BEST_TIME_SEGMENTS);
  for (const region of regions) {
    const resort = resortPattern(region);
    const spellings = regionSpellings(region);
    const hasBestTime = region.bestTime.length > 0;
    for (const [locale, segment] of Object.entries(region.segments)) {
      rules.push({
        source: `${tripRegionFolder(locale, region.slug)}/:path*`,
        destination: `/${locale}/${segment}/:path*`,
        permanent: true,
      });
      for (const wrong of spellings.keys()) {
        if (wrong === segment) continue;
        rules.push({
          source: `/${locale}/${wrong}/:path*`,
          destination: `/${locale}/${segment}/:path*`,
          permanent: true,
        });
      }
      if (!hasBestTime) continue;
      const correct = bestTimeOf(locale);
      for (const wrong of bestTimeAll) {
        if (wrong === correct) continue;
        rules.push({
          source: `/${locale}/${segment}/${wrong}`,
          destination: `/${locale}/${segment}/${correct}`,
          permanent: true,
        });
        if (resort) {
          rules.push({
            source: `/${locale}/${segment}/${wrong}/${resort}`,
            destination: `/${locale}/${segment}/${correct}/:resort`,
            permanent: true,
          });
        }
      }
      rules.push({
        source: `/${segment}/${correct}`,
        destination: `/${locale}/${segment}/${correct}`,
        permanent: true,
      });
      if (resort) {
        rules.push({
          source: `/${segment}/${correct}/${resort}`,
          destination: `/${locale}/${segment}/${correct}/:resort`,
          permanent: true,
        });
      }
    }
    for (const [segment, spelledBy] of spellings) {
      if (spelledBy.length !== 1) continue;
      rules.push({
        source: `/${segment}/:path*`,
        destination: `/${spelledBy[0]}/${segment}/:path*`,
        permanent: true,
      });
    }
  }
  return rules;
}

/**
 * Every region's rewrites onto its one route folder: the best-time pages first (the locale's own
 * segment onto the folder's English one), then the hub and anything under it, which the route
 * parses as a month or answers with a 404.
 */
export function tripRegionRewrites(regions: readonly TripRegionConfig[]): TripRegionRewrite[] {
  const rules: TripRegionRewrite[] = [];
  for (const region of regions) {
    const resort = resortPattern(region);
    for (const [locale, segment] of Object.entries(region.segments)) {
      const base = tripRegionFolder(locale, region.slug);
      const bestTime = bestTimeOf(locale);
      if (region.bestTime.length > 0) {
        rules.push({
          source: `/${locale}/${segment}/${bestTime}`,
          destination: `${base}/best-time-to-visit`,
        });
      }
      if (resort) {
        rules.push({
          source: `/${locale}/${segment}/${bestTime}/${resort}`,
          destination: `${base}/best-time-to-visit/:resort`,
        });
      }
      rules.push(
        { source: `/${locale}/${segment}`, destination: base },
        { source: `/${locale}/${segment}/:path*`, destination: `${base}/:path*` }
      );
    }
  }
  return rules;
}

/** An hour fresh: the hub names the region's today, and its figures are an hour old at most. */
export const TRIP_HUB_WINDOW = 'public, s-maxage=3600, stale-while-revalidate=3600';
/** Twelve hours fresh: a month page's forecast is rebuilt twice a day. */
export const TRIP_MONTH_WINDOW = 'public, s-maxage=43200, stale-while-revalidate=3600';

/**
 * Every region's edge windows, on the URLs a browser asks for (a header rule matches the incoming
 * path, before any rewrite). The hub an hour, like the park calendar's hub; a month page twelve
 * hours, its year and month digits only, so the best-time pages under
 * `/<segment>/<best-time segment>/<resort>` keep their own rule; the best-time pages an hour, like
 * the hub, listed after the month rule so the more specific source decides.
 */
export function tripRegionHeaders(
  regions: readonly TripRegionConfig[],
  locales: readonly string[]
): TripRegionWindow[] {
  const at = `/:locale(${locales.join('|')})`;
  const bestTimeAll = Object.values(BEST_TIME_SEGMENTS);
  return regions.flatMap((region) => {
    const resort = resortPattern(region);
    return [...new Set(Object.values(region.segments))].flatMap((segment) => [
      { source: `${at}/${segment}`, window: TRIP_HUB_WINDOW },
      { source: `${at}/${segment}/:year(\\d{4})/:month(\\d{1,2})`, window: TRIP_MONTH_WINDOW },
      ...(region.bestTime.length > 0
        ? bestTimeAll.flatMap((bestTime) => [
            { source: `${at}/${segment}/${bestTime}`, window: TRIP_HUB_WINDOW },
            ...(resort
              ? [{ source: `${at}/${segment}/${bestTime}/${resort}`, window: TRIP_HUB_WINDOW }]
              : []),
          ])
        : []),
    ]);
  });
}
