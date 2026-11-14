import 'server-only';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/config';
import { regionMessagesPath } from '@/i18n/client-messages';
import { FEATURED_PARK_SLUGS } from '@/components/home/featured-parks-section';
import { getMediaImageBySrc, getParkRefBySlug } from '@/lib/media';
import { menuPhoto, type MoreMenuPhoto } from '@/lib/navigation/more-menu';
import { getTripRegionParkCounts } from '@/lib/trip-regions/api';
import { TRIP_PLANNER_ID, tripRegionPath } from '@/lib/trip-regions/paths';
import { MAX_TRIP_DAYS } from '@/lib/trip-regions/plan-query';
import { LIVE_TRIP_REGIONS } from '@/lib/trip-regions/registry';
import { isEventPark } from '@/lib/parks/event-parks';
import { rankedFirst, type ViewedPark } from '@/lib/parks/viewed-parks';
import { viewedParksSeed } from '@/lib/parks/viewed-parks-seed';

/**
 * What the header's planner band needs from the server: the live trip regions with their names,
 * photos and park counts, and the parks it offers to start the day planner on. The regions are the
 * registry's (`LIVE_TRIP_REGIONS`) with their own words (`tripRegions.<slug>.nav`), the count is the
 * API's, the rest modules of this repo (the media catalog, the build's page-view snapshot); the
 * header is a Client Component, so only the resolved fields cross. See
 * docs/features/header-navigation.md.
 */

/** A trip-planner region as the band draws it. */
export interface PlannerMenuRegion {
  /** The registry's slug: React's key, the scene's, the tile's. */
  id: string;
  name: string;
  /** Where it is, the tile's kicker: the state or the country. */
  area: string;
  /** The hub's trip planner, locale-relative. */
  href: string;
  /** The hub's crowd calendar, locale-relative. */
  calendarHref: string;
  /** The hub's crowd calendar by its name, "Orlando Crowd Calendar", for the phone sheet. */
  calendarLabel: string;
  /** The hub's photo; `null` where the catalog lost it. */
  photo: MoreMenuPhoto | null;
  /**
   * How many parks the trip planner places, from the API (`getTripRegionParkCounts`); `null`
   * while it has not said, and the tile leaves the count out.
   */
  parkCount: number | null;
  /** The longest trip it plans, in days. */
  maxDays: number;
}

/** A park the band offers as a quick start into the day planner. */
export interface PlannerMenuPark {
  slug: string;
  name: string;
  /** The park's page, locale-relative. */
  href: string;
  city: string;
  /** Localized through `geo.countries.<slug>` where it is drawn. */
  countrySlug: string;
}

/** The planner band's server-side half: its regions and its quick starts, for one locale. */
export interface PlannerMenu {
  regions: PlannerMenuRegion[];
  parks: PlannerMenuPark[];
}

/** How many parks the band offers: two columns of three. */
export const PLANNER_MENU_PARKS = 6;

/**
 * The parks the band offers, from the locale's counted parks (most opened first) and a curated
 * list to top up with: an event is never offered (`isEventPark`), nor a counted park that had no
 * published hours ahead when the build read the geo structure (`hasHoursAhead`: a park shut for the
 * season with no dates out). The curated parks are parks by choice and skip the hours check, which
 * only the counted ones carry.
 */
export function pickPlannerParks(
  counted: readonly Pick<
    ViewedPark,
    'slug' | 'name' | 'href' | 'city' | 'countrySlug' | 'hasHoursAhead'
  >[],
  curated: readonly PlannerMenuPark[]
): PlannerMenuPark[] {
  const offered = counted
    .filter((park) => park.hasHoursAhead !== false && !isEventPark(park.slug))
    .map(({ slug, name, href, city, countrySlug }) => ({ slug, name, href, city, countrySlug }));
  return rankedFirst(
    offered,
    curated.filter((park) => !isEventPark(park.slug)),
    (park) => park.href,
    PLANNER_MENU_PARKS
  );
}

/** A locale's parks: its counted ones, topped up from the homepage's `FEATURED_PARK_SLUGS`. */
export function plannerParks(locale: Locale): PlannerMenuPark[] {
  const curated = (FEATURED_PARK_SLUGS[locale] ?? FEATURED_PARK_SLUGS.en ?? []).flatMap((slug) => {
    const ref = getParkRefBySlug(slug);
    return ref
      ? [
          {
            slug,
            name: ref.name,
            href: `/parks/${ref.path}`,
            city: ref.city ?? '',
            countrySlug: ref.countrySlug ?? '',
          },
        ]
      : [];
  });
  return pickPlannerParks(viewedParksSeed(locale), curated);
}

const PLANNER_PARKS = new Map<Locale, PlannerMenuPark[]>();

/**
 * The planner band for a locale. The parks and the regions' words and photos are modules of this
 * repo, memoised per process like `getFeaturedParksMenu`, since the layout asks on every page; the
 * park counts are the API's list of regions, a day in the Data Cache and bounded in time, so a
 * slow API costs the band its count and nothing else.
 */
export async function getPlannerMenu(locale: Locale): Promise<PlannerMenu> {
  let parks = PLANNER_PARKS.get(locale);
  if (!parks) {
    parks = plannerParks(locale);
    PLANNER_PARKS.set(locale, parks);
  }
  const [counts, regions] = await Promise.all([
    getTripRegionParkCounts(),
    Promise.all(
      LIVE_TRIP_REGIONS.map(async (region) => {
        const t = await getTranslations({
          locale,
          namespace: `${regionMessagesPath(region.slug)}.nav`,
        });
        const calendarHref = tripRegionPath(region.slug, locale);
        return {
          id: region.slug,
          name: t('name'),
          area: t('area'),
          href: `${calendarHref}#${TRIP_PLANNER_ID}`,
          calendarHref,
          calendarLabel: t('calendar'),
          photo: menuPhoto(region.photo ? getMediaImageBySrc(region.photo) : null),
          maxDays: MAX_TRIP_DAYS,
        };
      })
    ),
  ]);
  return {
    regions: regions.map((region) => ({ ...region, parkCount: counts[region.id] ?? null })),
    parks,
  };
}
