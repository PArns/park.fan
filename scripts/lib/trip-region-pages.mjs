import { LIVE_TRIP_REGIONS } from '../../lib/trip-regions/registry.ts';
import {
  currentTripRegionMonth,
  tripRegionLandingPaths,
  tripRegionMonths,
  tripRegionPath,
} from '../../lib/trip-regions/paths.ts';

/**
 * The pages of every live trip region that `check:landing-pages` and `check:semantic-html` load:
 * the hub and each best-time page in German and English, and next month's page in German. Next
 * month, because the current month's URL canonicals to the hub and is no page of its own, and the
 * next is in the hub's window whenever the check runs. Read from the registry, so a region that
 * goes live is checked from that commit on. Needs `--import ./scripts/register-path-alias.mjs`.
 */
export const TRIP_REGION_PAGES = LIVE_TRIP_REGIONS.flatMap((region) => [
  ...['de', 'en'].flatMap((locale) =>
    tripRegionLandingPaths(region.slug, locale).map((path) => `/${locale}${path}`)
  ),
  `/de${tripRegionPath(region.slug, 'de', tripRegionMonths(currentTripRegionMonth(region.slug))[1])}`,
]);
