import 'server-only';
import { FEATURED_PARK_SLUGS } from '@/components/home/featured-parks-section';
import { getImagesByRole, getParkPagePath, getParkRefBySlug } from '@/lib/media';

/**
 * The six photo cards in the parks menu, and why they are a fixed set rather than a thumbnail
 * per park.
 *
 * The media database holds a picture for **14 of 212 parks**, and a `park-background` for nine of
 * them. A photo on every park row in the menu would therefore be nine pictures and two hundred
 * empty boxes — so the panel carries a "beliebte Parks" rail instead: a handful of parks that are
 * genuinely worth looking at, all of which have a photo, and no gaps.
 *
 * Which parks: the homepage's per-locale list (`FEATURED_PARK_SLUGS`), intersected with the ones
 * that actually have a background image, in that order. A second curated list would be a second
 * thing to keep in sync — and the answer to "which parks does a German reader want" has already
 * been worked out once, with visitor numbers in the comments. Locales whose featured parks have no
 * photos yet (`en` leans on Orlando and Tokyo, none of which we have shot) fall back to the parks
 * that do, so the rail is never short.
 *
 * Runs on the server: `@/lib/media` is the 107 KB catalog and the header is a Client Component.
 * Only the six resolved URLs cross that boundary.
 */

/** Six cards, two by three beside five continent columns — the column is as tall as they are.
 *  Nine parks carry a `park-background`, so this is the shelf being filled, not stretched. */
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
}

export function getFeaturedParksMenu(locale: string): FeaturedParkCard[] {
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

    cards.push({
      slug,
      name: ref.name,
      href,
      city: ref.city ?? '',
      countrySlug: ref.countrySlug ?? '',
      // `?v=` is not decoration: retargeting a focal point rewrites a crop's bytes at an unchanged
      // URL, so the hash is what makes the new cut visible.
      image: `${image.variants?.find((v) => v.endsWith('-16x9.jpg')) ?? image.src}?v=${image.version}`,
    });
  }

  return cards;
}
