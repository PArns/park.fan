import 'server-only';
import type { Locale } from '@/i18n/config';
import { FEATURED_PARK_SLUGS } from '@/components/home/featured-parks-section';
import { getMediaImageBySrc, getParkRefBySlug } from '@/lib/media';
import { menuPhoto, type MoreMenuPhoto } from '@/lib/navigation/more-menu';
import { TRIP_REGIONS, tripRegionText } from '@/lib/navigation/trip-regions';
import { rankedFirst } from '@/lib/parks/viewed-parks';
import { viewedParksSeed } from '@/lib/parks/viewed-parks-seed';

/**
 * What the header's planner band needs from the server: the trip-planner regions with their names
 * and photos, and the parks it offers to start the day planner on. Both come from modules of this
 * repo (the media catalog, the build's page-view snapshot), and the header is a Client Component,
 * so only the resolved fields cross. See docs/features/header-navigation.md.
 */

/** A trip-planner region as the band draws it. */
export interface PlannerMenuRegion {
  id: string;
  name: string;
  area: string;
  /** The hub's trip planner, locale-relative. */
  href: string;
  /** The hub's crowd calendar, locale-relative. */
  calendarHref: string;
  /** The hub's photo; `null` where the catalog lost it. */
  photo: MoreMenuPhoto | null;
  parkCount: number;
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
 * The parks for a locale: the ones its readers opened most (the build's snapshot), without those
 * that had no published hours ahead when the build read the geo structure (`hasHoursAhead`: an
 * event whose run is over, a park shut for the season with no dates out), topped up from the
 * homepage's hand-picked `FEATURED_PARK_SLUGS`, which are parks by choice. The same ranking as the
 * parks menu's rail, before that rail's photo preference.
 */
function plannerParks(locale: Locale): PlannerMenuPark[] {
  const counted = viewedParksSeed(locale)
    .filter((park) => park.hasHoursAhead !== false)
    .map(({ slug, name, href, city, countrySlug }) => ({ slug, name, href, city, countrySlug }));
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
  return rankedFirst(counted, curated, (park) => park.href, PLANNER_MENU_PARKS);
}

const PLANNER_MENU = new Map<Locale, PlannerMenu>();

/**
 * The planner band for a locale, memoised per process like `getFeaturedParksMenu`: it reads only
 * modules of this repo, and the layout asks on every page. Callers share the object and must not
 * mutate it.
 */
export function getPlannerMenu(locale: Locale): PlannerMenu {
  let menu = PLANNER_MENU.get(locale);
  if (!menu) {
    menu = {
      regions: TRIP_REGIONS.map((region) => ({
        id: region.id,
        name: tripRegionText(region.name, locale),
        area: tripRegionText(region.area, locale),
        href: region.href,
        calendarHref: region.calendarHref,
        photo: menuPhoto(getMediaImageBySrc(region.photo)),
        parkCount: region.parkCount,
        maxDays: region.maxDays,
      })),
      parks: plannerParks(locale),
    };
    PLANNER_MENU.set(locale, menu);
  }
  return menu;
}
