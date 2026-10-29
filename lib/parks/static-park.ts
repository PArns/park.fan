import { stripNewPrefix } from '@/lib/utils';
import {
  getCardObjectPosition,
  getParkBackgroundImage,
  getParkImageSet,
} from '@/lib/utils/park-assets';
import type { StaticPark } from '@/components/parks/live-park-grid';

/** Where a park sits in the URL tree, and the names its card shows for the place. */
export interface ParkPlace {
  continent: string;
  country: string;
  citySlug: string;
  cityName: string;
  /** Already translated. */
  countryName: string;
}

/**
 * A park's card fields for `<LiveParkGrid>`, only those that never change during the day: live
 * status, crowd level and waits are layered on in the browser, so a hub's prerender stays valid
 * for a day. Server only, because the image lookup reads the file system.
 */
export function toStaticPark(
  park: {
    id: string;
    name: string;
    slug: string;
    latitude?: number | null;
    longitude?: number | null;
  },
  place: ParkPlace
): StaticPark {
  return {
    id: park.id,
    name: stripNewPrefix(park.name),
    slug: park.slug,
    city: place.cityName,
    countryName: place.countryName,
    href: `/parks/${place.continent}/${place.country}/${place.citySlug}/${park.slug}`,
    backgroundImage: getParkBackgroundImage(park.slug),
    backgroundPosition: getCardObjectPosition(park.slug),
    // The distance to the visitor is computed in the browser from these.
    latitude: park.latitude,
    longitude: park.longitude,
  };
}

/** A park card as an entry of a hub's `ItemList`: its shown name, its URL in `locale`, its image. */
export function parkListItem(locale: string, park: StaticPark) {
  return { name: park.name, url: `/${locale}${park.href}`, image: getParkImageSet(park.slug)[0] };
}
