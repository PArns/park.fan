/**
 * Rides that are a way of getting across the park rather than a ride you queue
 * for — curated here, because no field in the API says so.
 *
 * The case that started it: Efteling's `stoomtrein-oost` is a station on the
 * park's steam railway. A train leaves roughly every twenty minutes, so the
 * queue in front of it is people waiting for a departure, not people waiting
 * for a popular ride. The wait-time feed cannot tell the two apart, and the
 * headliner algorithm — which reads wait times — occasionally ranks the station
 * among the park's highlights on that evidence alone.
 *
 * The badge this list feeds is deliberately NOT gated on headliner status. A
 * station is a station on the days the algorithm promotes it and on the days it
 * does not; a marker that appeared and vanished with a computed rank would tell
 * a visitor nothing they could rely on.
 *
 * `attractionType` / `curatedAttractionType` exist in the backend but never
 * reach `ParkAttraction`, so nothing the card renders can read them. Wiring
 * that through, and teaching the headliner algorithm about it, is the larger
 * ticket this list stands in for.
 */

export interface TransportAttraction {
  /** The park's slug, as the frontend route spells it (`efteling`). */
  parkSlug: string;
  /** The ride's slug, as the API spells it (`stoomtrein-oost`). */
  attractionSlug: string;
}

/**
 * Every curated entry. Slugs are the API's, verified against the park's
 * attraction list — `pnpm test:transport-attractions` pins the spelling,
 * because a typo here produces no badge and no error.
 */
export const TRANSPORT_ATTRACTIONS: readonly TransportAttraction[] = [
  // Efteling's steam railway, east station. Its sibling `stoomtrein-marerijk`,
  // plus `monorail`, `gondoletta` and `pagode`, are the same kind of thing and
  // are deliberately not here yet: PAR-343 curated the one case it verified.
  { parkSlug: 'efteling', attractionSlug: 'stoomtrein-oost' },
];

/**
 * Whether this ride is one of the curated transport systems.
 *
 * Both slugs are required and compared exactly. Passing null or undefined —
 * a listing that cannot name the park a ride belongs to — answers false rather
 * than matching on the ride slug alone: `monorail` exists in more than one
 * park, and only the curated pairs are claimed.
 */
export function isTransportAttraction(
  parkSlug: string | null | undefined,
  attractionSlug: string | null | undefined
): boolean {
  if (!parkSlug || !attractionSlug) return false;
  return TRANSPORT_ATTRACTIONS.some(
    (entry) => entry.parkSlug === parkSlug && entry.attractionSlug === attractionSlug
  );
}

/**
 * `/parks/{continent}/{country}/{city}/{park}/{attraction}`, with an optional
 * query string or hash — the shape `convertApiUrlToFrontendUrl` produces and
 * the cards link to.
 *
 * Every segment is `[^/?#]+`, so an empty one fails the match instead of
 * collapsing. Counting segments after dropping the empty ones would accept
 * `/parks/europe/nl//kaatsheuvel/efteling/x` and read a slug out of the wrong
 * position, which is how a curated marker ends up on a ride nobody curated.
 */
const ATTRACTION_PATH = /^\/parks\/[^/?#]+\/[^/?#]+\/[^/?#]+\/([^/?#]+)\/([^/?#]+)(?:[?#].*)?$/;

/**
 * The park and ride slug of a frontend attraction path, or null when the path
 * is not one.
 *
 * The card reads the pair out of the href it already computed rather than
 * taking new props: its call sites pass the park in four different ways (a
 * `parkPath`, a nested `park` object, a bare slug, or nothing at all), while
 * every one of them ends up with the same link. Deriving both slugs from that
 * link is what keeps the badge on a card and the badge on the page behind it in
 * agreement.
 *
 * `#` — `getHref`'s answer when it has nothing to link to — yields null.
 */
export function attractionPathSlugs(
  path: string | null | undefined
): { parkSlug: string; attractionSlug: string } | null {
  if (!path) return null;

  const match = ATTRACTION_PATH.exec(path);
  if (!match) return null;

  return { parkSlug: match[1], attractionSlug: match[2] };
}

/** {@link isTransportAttraction} for a frontend attraction path. */
export function isTransportAttractionPath(path: string | null | undefined): boolean {
  const slugs = attractionPathSlugs(path);
  return isTransportAttraction(slugs?.parkSlug, slugs?.attractionSlug);
}
