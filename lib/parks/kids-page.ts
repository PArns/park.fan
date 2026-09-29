import { stripNewPrefix } from '@/lib/utils';
import { canRideAtHeight, riderHeightThresholds } from '@/lib/utils/rider-height';
import type { RiderHeightLimits } from '@/lib/utils/rider-height';

/**
 * Which parks get a "with kids" page, and what it says. One place, because three readers ask:
 * the route (404 below the line), the sitemap, and the park page's link.
 *
 * The gate is the PO's decision of 2026-09-29 on PAR-356 (option C, a pilot on few parks): at
 * least 20 rides with a `minimumHeight` **and** at least half of the park's attractions with one.
 * Measured against the catalogue on the day of the build that is 32 of 203 parks with attractions
 * (the decision text says 41, which is the count for either condition on its own: 41 parks have 20
 * or more, and 41 have 10 or more that make up half). Hansa-Park (0 of 83) and
 * Efteling (8 of 37) are below it. The value is loosened after the four-week re-measurement, not
 * before; a page that has been published is not easily taken back.
 */
export const KIDS_PAGE_GATE = {
  /** Attractions with a `minimumHeight`, absolute. */
  minRidesWithHeight: 20,
  /** Attractions with a `minimumHeight`, as a share of all the park's attractions. */
  minShareWithHeight: 0.5,
} as const;

/** The two fields the page reads besides the height limits. */
export interface KidsPageAttraction extends RiderHeightLimits {
  name: string;
  slug: string;
}

export interface KidsTierRide {
  name: string;
  slug: string;
}

/** One step of the park's own height ladder. */
export interface KidsTier {
  /** The height in cm at which these rides open up. Always one of the park's posted minima. */
  cm: number;
  /** How many of the park's attractions this height may ride — the park page's "23 of 40". */
  rideable: number;
  /** The rides whose minimum is exactly `cm`, i.e. what this step adds over the one below. */
  newRides: KidsTierRide[];
}

export interface KidsPageData {
  /** Every attraction the park lists — the denominator of the park page's height readout. */
  total: number;
  /** Attractions that post a `minimumHeight`. */
  withHeight: number;
  /** Attractions that post none. The list does not say whether that means "nobody" or "unknown". */
  withoutHeight: KidsTierRide[];
  /** How many of the park's attractions have no limit posted and a height cannot rule out. */
  rideableAtZero: number;
  /** Ascending, one per distinct posted minimum. */
  tiers: KidsTier[];
}

/** The name the park page shows: the feed's `NEW:` marker is not part of it. */
const toRide = (a: KidsPageAttraction): KidsTierRide => ({
  name: stripNewPrefix(a.name),
  slug: a.slug,
});

const byName = (a: KidsTierRide, b: KidsTierRide) => a.name.localeCompare(b.name);

/** The numbers of the page, or `null` where the park does not clear the gate. */
export function kidsPageData(attractions: readonly KidsPageAttraction[]): KidsPageData | null {
  const total = attractions.length;
  const withHeight = attractions.filter((a) => a.minimumHeight != null && a.minimumHeight > 0);
  if (total === 0) return null;
  if (withHeight.length < KIDS_PAGE_GATE.minRidesWithHeight) return null;
  if (withHeight.length / total < KIDS_PAGE_GATE.minShareWithHeight) return null;

  const tiers = riderHeightThresholds(attractions).map((cm) => ({
    cm,
    rideable: attractions.filter((a) => canRideAtHeight(a, cm)).length,
    newRides: attractions
      .filter((a) => a.minimumHeight === cm)
      .map(toRide)
      .sort(byName),
  }));

  return {
    total,
    withHeight: withHeight.length,
    withoutHeight: attractions
      .filter((a) => !(a.minimumHeight != null && a.minimumHeight > 0))
      .map(toRide)
      .sort(byName),
    rideableAtZero: attractions.filter((a) => canRideAtHeight(a, 0)).length,
    tiers,
  };
}

/** Whether the park has the page. The sitemap, the route and the park page all ask this. */
export function hasKidsPage(attractions: readonly KidsPageAttraction[]): boolean {
  return kidsPageData(attractions) !== null;
}

/**
 * The `?height=` a park page opens with, or `null`.
 *
 * Only a height the park's own slider can stand on is accepted — one of its posted minima — so a
 * hand-edited URL cannot switch the filter on at a value with no stop under it, where the thumb
 * would rest between two positions and the readout would describe a height nobody can select.
 */
export function initialRiderHeightFromParam(
  raw: string | string[] | undefined,
  attractions: readonly RiderHeightLimits[]
): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !/^\d{2,3}$/.test(value)) return null;
  const cm = Number(value);
  return riderHeightThresholds(attractions).includes(cm) ? cm : null;
}
