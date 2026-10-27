import 'server-only';
import { FEATURED_PARK_SLUGS } from '@/components/home/featured-parks-section';
import { getImagesByRole, getParkPagePath, getParkRefBySlug } from '@/lib/media';
import type { MediaImage } from '@/lib/media/types';
import { focusToObjectPosition } from '@/lib/media/focus';
import { viewedParksSeed } from '@/lib/parks/viewed-parks-seed';

/**
 * The six cards in the parks menu: a fixed rail rather than a thumbnail per park row. The parks are
 * the ones this locale's readers opened most (the build's snapshot, `viewedParksSeed`), with their
 * photo where they have one and the brand cover where not, since a popular park left out for want
 * of a picture would be the wrong list, and the American parks have almost none. Behind them the
 * homepage's per-locale `FEATURED_PARK_SLUGS` that have a photo, then other photographed parks, so
 * the rail is never short. Server-side: `@/lib/media` is the whole catalog and the header is a
 * Client Component, so only the resolved URLs cross.
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
  /** Pre-cut 16:9 crop where the generator made one, else the original. Absent for a park without
   *  a photo: the card draws `BlogCoverFallback`. */
  image?: string;
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

/** A photo as a card's picture. */
function photoOf(image: MediaImage): Pick<FeaturedParkCard, 'image' | 'imagePosition'> {
  const crop = image.variants?.find((v) => v.endsWith('-16x9.jpg'));
  return {
    // `?v=` is not decoration: retargeting a focal point rewrites a crop's bytes at an unchanged
    // URL, so the hash is what makes the new cut visible.
    image: `${crop ?? image.src}?v=${image.version}`,
    imagePosition: crop ? undefined : focusToObjectPosition(image.focus),
  };
}

function buildFeaturedParksMenu(locale: string): FeaturedParkCard[] {
  const withPhoto = new Map(
    getImagesByRole('park-background')
      .filter((image) => image.park)
      .map((image) => [image.park as string, image])
  );

  const cards: FeaturedParkCard[] = [];
  const seen = new Set<string>();
  const add = (card: FeaturedParkCard) => {
    if (cards.length === RAIL_SIZE || seen.has(card.href)) return;
    seen.add(card.href);
    cards.push(card);
  };

  for (const park of viewedParksSeed(locale)) {
    // A slug names more than one park ('disneyland-park' is Paris and Anaheim), and the photos are
    // filed by slug, so a counted park takes the photo only when the photo's park is its page.
    const image = withPhoto.get(park.slug);
    const ref = image ? getParkRefBySlug(park.slug) : null;
    const own = image && ref && `/parks/${ref.path}` === park.href ? image : null;
    add({
      slug: park.slug,
      name: park.name,
      href: park.href,
      city: park.city,
      countrySlug: park.countrySlug,
      ...(own && photoOf(own)),
    });
  }

  const preferred = FEATURED_PARK_SLUGS[locale] ?? FEATURED_PARK_SLUGS.en ?? [];
  for (const slug of [...preferred.filter((slug) => withPhoto.has(slug)), ...withPhoto.keys()]) {
    const image = withPhoto.get(slug);
    const ref = getParkRefBySlug(slug);
    const href = image ? getParkPagePath(image) : null;
    // A photo whose park the API no longer lists has no page to link to. Skip rather than render
    // a card that goes nowhere.
    if (!image || !ref || !href) continue;
    add({
      slug,
      name: ref.name,
      href,
      city: ref.city ?? '',
      countrySlug: ref.countrySlug ?? '',
      ...photoOf(image),
    });
  }

  return cards;
}
