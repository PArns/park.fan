import 'server-only';
import type { Locale } from '@/i18n/config';
import { getMediaImageBySrc } from '@/lib/media';
import { menuPhoto, type MoreMenuPhoto } from '@/lib/navigation/more-menu';
import { TRIP_REGIONS, tripRegionName } from '@/lib/navigation/trip-regions';

/**
 * What the header's planner band needs from the server: the trip-planner regions with their names
 * and photos. The photos come from `@/lib/media`, the whole catalog, and the header is a Client
 * Component, so only the resolved URLs cross. The band's popular parks are the parks menu's rail
 * (`getFeaturedParksMenu`), which the header already holds; they are not sent twice. See
 * docs/features/header-navigation.md.
 */

/** A trip-planner region as the band draws it. */
export interface PlannerMenuRegion {
  id: string;
  name: string;
  /** The hub's trip planner, locale-relative. */
  href: string;
  /** The hub's photo; `null` where the catalog lost it, and the tile goes dark under its scrim. */
  photo: MoreMenuPhoto | null;
}

export interface PlannerMenu {
  regions: PlannerMenuRegion[];
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
        name: tripRegionName(region, locale),
        href: region.href,
        photo: menuPhoto(getMediaImageBySrc(region.photo)),
      })),
    };
    PLANNER_MENU.set(locale, menu);
  }
  return menu;
}
