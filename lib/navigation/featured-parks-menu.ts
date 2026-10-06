import 'server-only';
import { FEATURED_PARK_SLUGS } from '@/components/home/featured-parks-section';
import { getImagesByRole, getParkPagePath, getParkRefBySlug } from '@/lib/media';
import { focusToObjectPosition } from '@/lib/media/focus';

/**
 * The six photo cards in the parks menu: a fixed rail rather than a thumbnail per park, because
 * few parks have a background photo and a picture per row would be mostly empty boxes. The parks
 * are the homepage's per-locale `FEATURED_PARK_SLUGS` that have one, topped up with other
 * photographed parks so the rail is never short. Server-side: `@/lib/media` is the whole catalog
 * and the header is a Client Component, so only the resolved URLs cross.
 */

/** Six cards, two by three beside five continent columns: the column is as tall as they are. */
const RAIL_SIZE = 6;

export interface FeaturedParkCard {
  slug: string;
  name: string;
  href: string;
  city: string;
  /** Country slug — the menu localizes it through `geo.countries.<slug>`. */
  countrySlug: string;
  /** Pre-cut 16:9 crop where the generator made one, else the original. */
  image: string;
  /** Focal point for the original. Absent for a crop: it was cut around the focal point already. */
  imagePosition?: string;
}

const FEATURED_PARKS_MENU = new Map<string, FeaturedParkCard[]>();

/**
 * The parks menu's photo cards for a locale, memoised per process: everything it reads is fixed
 * for the deployment, and the layout asks on every page. Callers share the array and must not
 * mutate it.
 */
export function getFeaturedParksMenu(locale: string): FeaturedParkCard[] {
  let menu = FEATURED_PARKS_MENU.get(locale);
  if (!menu) {
    menu = buildFeaturedParksMenu(locale);
    FEATURED_PARKS_MENU.set(locale, menu);
  }
  return menu;
}

function buildFeaturedParksMenu(locale: string): FeaturedParkCard[] {
  const withPhoto = new Map(
    getImagesByRole('park-background')
      .filter((image) => image.park)
      .map((image) => [image.park as string, image])
  );

  const preferred = FEATURED_PARK_SLUGS[locale] ?? FEATURED_PARK_SLUGS.en ?? [];
  const order = [...preferred.filter((slug) => withPhoto.has(slug)), ...withPhoto.keys()];

  const cards: FeaturedParkCard[] = [];
  const seen = new Set<string>();

  for (const slug of order) {
    if (cards.length === RAIL_SIZE) break;
    if (seen.has(slug)) continue;
    seen.add(slug);

    const image = withPhoto.get(slug);
    const ref = getParkRefBySlug(slug);
    const href = image ? getParkPagePath(image) : null;
    // A photo whose park the API no longer lists has no page to link to. Skip rather than render
    // a card that goes nowhere.
    if (!image || !ref || !href) continue;
    const crop = image.variants?.find((v) => v.endsWith('-16x9.jpg'));

    cards.push({
      slug,
      name: ref.name,
      href,
      city: ref.city ?? '',
      countrySlug: ref.countrySlug ?? '',
      // `?v=` is not decoration: retargeting a focal point rewrites a crop's bytes at an unchanged
      // URL, so the hash is what makes the new cut visible.
      image: `${crop ?? image.src}?v=${image.version}`,
      imagePosition: crop ? undefined : focusToObjectPosition(image.focus),
    });
  }

  return cards;
}
