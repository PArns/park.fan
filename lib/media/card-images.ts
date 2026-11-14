import { parkGeoPath } from './park-path.mjs';

/**
 * Card photos for parks and rides as a lookup a Client Component may hold: the path and focal
 * point of every card photo, without the media manifest behind them. The server builds it
 * (`getCardImageMap` in `lib/utils/park-assets.ts`) and serves it as `/api/card-images`, so a
 * response the browser fetched from api.park.fan directly gets the same photos a proxy would
 * have attached. Parks are keyed by their geo path, because Paris and Anaheim share the slug
 * `disneyland-park`.
 */

/**
 * Where a card crops from when the image has no focal point: the top, as these photos have always
 * been framed. Setting a focal point opts an image out.
 */
export const CARD_FALLBACK_POSITION = '50% 0%';

/**
 * `[src, objectPosition]` per park geo path (`europe/france/paris/disneyland-park`) and per
 * {@link rideCardImageKey}; only photos that exist. `paths` turns a bare slug into the path it
 * means, for a park or ride that arrives without one: the catalog's first park of that slug.
 */
export interface CardImageMap {
  parks: Record<string, [string, string]>;
  rides: Record<string, [string, string]>;
  paths: Record<string, string>;
}

/** The two fields a park or ride card reads its photo from. */
export interface CardImageFields {
  backgroundImage: string | null;
  backgroundPosition: string;
}

const EMPTY_CARD_IMAGE_MAP: CardImageMap = { parks: {}, rides: {}, paths: {} };

// The browser keeps the map for a day and a deploy does not clear that copy, so a change to its
// keys takes a new URL, or new code reads yesterday's map and finds no photo.
const CARD_IMAGE_MAP_URL = '/api/card-images?keys=path';

let cardImageMapRequest: Promise<CardImageMap> | null = null;

/**
 * The map from `/api/card-images`, fetched once per page. A failure resolves to an empty map and
 * is not kept, so a card loses its photo rather than its data and the next caller asks again.
 */
export function loadCardImageMap(): Promise<CardImageMap> {
  cardImageMapRequest ??= fetch(CARD_IMAGE_MAP_URL)
    .then((response) => (response.ok ? (response.json() as Promise<CardImageMap>) : null))
    .catch(() => null)
    .then((map) => {
      if (map) return map;
      cardImageMapRequest = null;
      return EMPTY_CARD_IMAGE_MAP;
    });
  return cardImageMapRequest;
}

/** The {@link CardImageMap} key of a ride: slugs are unique only within their park. */
export function rideCardImageKey(parkPath: string, rideSlug: string): string {
  return `${parkPath}/${rideSlug}`;
}

/** A park as a card carries it: its slug, and its `url` where the API sent one. */
interface CardPark {
  slug: string;
  url?: string | null;
}

/**
 * The geo path a card's park is filed under in the map: from `url` (the park's, or a ride's,
 * which contains it), else from the slug through `map.paths`. `undefined` when neither names one.
 */
export function cardParkPath(
  map: CardImageMap,
  park: CardPark | null | undefined,
  url?: string | null
): string | undefined {
  const fromUrl = parkGeoPath(park?.url) ?? parkGeoPath(url);
  if (fromUrl) return fromUrl;
  const paths = map.paths ?? {};
  return park && Object.hasOwn(paths, park.slug) ? paths[park.slug] : undefined;
}

// `Object.hasOwn`, because the map is parsed JSON and a slug such as `constructor` would
// otherwise find a prototype member.
function cardImageFields(
  table: Record<string, [string, string]>,
  key: string | undefined
): CardImageFields {
  const entry = key !== undefined && Object.hasOwn(table, key) ? table[key] : undefined;
  return entry
    ? { backgroundImage: entry[0], backgroundPosition: entry[1] }
    : { backgroundImage: null, backgroundPosition: CARD_FALLBACK_POSITION };
}

/** A park with its card photo attached, `null` and the fallback crop when it has none. */
export function withParkCardImage<T extends CardPark>(
  map: CardImageMap,
  park: T
): T & CardImageFields {
  return { ...park, ...cardImageFields(map.parks, cardParkPath(map, park)) };
}

/**
 * A ride with **its own** card photo attached, never the park's: the park's photo on a ride card
 * says „this is what the ride looks like", which is false, and repeats on every card without one.
 */
export function withRideCardImage<
  T extends { slug: string; url?: string | null; park?: CardPark | null },
>(map: CardImageMap, attraction: T): T & CardImageFields {
  const parkPath = attraction.park ? cardParkPath(map, attraction.park, attraction.url) : undefined;
  const key = parkPath ? rideCardImageKey(parkPath, attraction.slug) : undefined;
  return { ...attraction, ...cardImageFields(map.rides, key) };
}
