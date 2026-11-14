import { isValidLocale } from '@/i18n/config';
import { parseParkCalendarMonthSpelling } from '@/lib/parks/calendar-segments';
import { currentTripRegionMonth, isTripRegionMonthInRange, tripRegionPath } from './paths';
import { LIVE_TRIP_REGIONS, tripRegionSegment } from './registry';
import type { TripMonth } from './types';

/**
 * The hubs' month redirects, decided from the URL alone so `proxy.ts` answers them before
 * anything renders (a redirect thrown from a render carries the layout as its body). A region has
 * one zone, so unlike a park calendar every case is settled here:
 *
 * - a month that is a month but outside the twelve the hub serves 308s to the hub;
 * - a padded month (`/2026/09`) 308s to its unpadded URL;
 * - everything else returns `null`: the route serves it or 404s it.
 *
 * Only a live region's own segment in its locale counts; another locale's spelling is
 * `next.config.ts`'s redirect, which runs first.
 *
 * @param now the region's current month; the proxy passes nothing and gets today's.
 */
export function tripRegionRedirect(pathname: string, now?: TripMonth): string | null {
  // '', locale, segment, year, month
  const parts = pathname.split('/');
  if (parts.length !== 5) return null;
  const [, locale, segment] = parts;
  if (!isValidLocale(locale)) return null;
  const region = LIVE_TRIP_REGIONS.find((r) => tripRegionSegment(r, locale) === segment);
  if (!region) return null;
  const spelled = parseParkCalendarMonthSpelling(parts.slice(3));
  if (!spelled) return null;
  const current = now ?? currentTripRegionMonth(region.slug);
  if (!isTripRegionMonthInRange(spelled.month, current)) {
    return `/${locale}${tripRegionPath(region.slug, locale)}`;
  }
  return spelled.padded ? `/${locale}${tripRegionPath(region.slug, locale, spelled.month)}` : null;
}
