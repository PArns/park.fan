/**
 * What a ride carries while it is being dragged onto the planner.
 *
 * The first version had no drag source at all: a card's root is an `<a>`, every
 * browser makes a link draggable, and the drop handler read the ride out of the
 * `text/uri-list` the browser puts there. That works right up to the two cases
 * that are most of the gesture.
 *
 * The first is the PHOTO. A card is a link with a picture in it, and grabbing
 * the picture drags the IMAGE — `text/uri-list` is then
 * `/media/phantasialand/taron.jpg`, which has no `parks` segment, so the drop
 * was refused with no explanation. The second is the NAME. A URL names a slug
 * and nothing else, so the panel had to look the name up in the `/plan/day`
 * payload — and that endpoint answers 404 until the backend ships, which made
 * every drop a silent no on the very build a visitor would try it on.
 *
 * So the drag carries its own payload: the park it belongs to, the ride's slug
 * and the ride's NAME, written by {@link buildRideDragPayload} from data
 * attributes the card already knows. `text/uri-list` stays on the drag for
 * everything else that accepts a link, and the drop handler still falls back to
 * it — this adds a channel rather than replacing one.
 */

/**
 * A private type, so nothing else on the web can pretend to be a ride and the
 * browser's own "here is a URL" cannot be mistaken for one.
 *
 * Lowercase: the DataTransfer store lowercases every format it is given, so a
 * mixed-case constant would be written under one key and read under another.
 */
export const PLANNER_RIDE_MIME = 'application/x-parkfan-ride';

/** The three things a drop needs to file a ride under a day. */
export interface PlannerRideDrag {
  parkSlug: string;
  attractionSlug: string;
  attractionName: string;
}

/** How much of a name is kept. A drag payload is not a place for prose. */
const MAX_NAME = 120;

/**
 * The park and ride a frontend ride URL names.
 *
 * Read by NAME rather than by counting holes in a destructuring, which is how
 * the first version read `bruehl` as the park and silently refused every drop:
 * the path carries a locale prefix on five of six locales and none on the sixth.
 *
 * `/<locale>/parks/<continent>/<country>/<city>/<park>/<attraction>`
 */
export function rideFromPath(path: string): { parkSlug: string; attractionSlug: string } | null {
  const parts = path.split('/').filter(Boolean);
  const parksAt = parts.indexOf('parks');
  if (parksAt === -1) return null;
  // continent, country, city, park, attraction
  const geo = parts.slice(parksAt + 1);
  if (geo.length < 5) return null;
  return { parkSlug: geo[3], attractionSlug: geo[4] };
}

/** The same, from a whole URL. Relative hrefs resolve against the site. */
export function rideFromUrl(uri: string): { parkSlug: string; attractionSlug: string } | null {
  if (!uri) return null;
  // A `text/uri-list` may legitimately hold several lines and comments.
  const first = uri
    .split(/[\r\n]+/)
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !line.startsWith('#'));
  if (!first) return null;
  try {
    return rideFromPath(new URL(first, 'https://park.fan').pathname);
  } catch {
    return null;
  }
}

export function serializeRideDrag(ride: PlannerRideDrag): string {
  return JSON.stringify({
    parkSlug: ride.parkSlug,
    attractionSlug: ride.attractionSlug,
    attractionName: ride.attractionName.slice(0, MAX_NAME),
  });
}

/**
 * The payload, or `null` where it is not one.
 *
 * Defensive because a `DataTransfer` is an input from outside: another tab,
 * another site, or a previous build of this one. Anything that is not all three
 * strings is refused rather than repaired — a ride with an empty name would
 * render as a nameless block, which is worse than a drop that does not land.
 */
export function parseRideDrag(raw: string | null | undefined): PlannerRideDrag | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const value = parsed as Record<string, unknown>;
  const parkSlug = typeof value.parkSlug === 'string' ? value.parkSlug : '';
  const attractionSlug = typeof value.attractionSlug === 'string' ? value.attractionSlug : '';
  const attractionName = typeof value.attractionName === 'string' ? value.attractionName : '';
  if (!parkSlug || !attractionSlug || !attractionName) return null;
  return { parkSlug, attractionSlug, attractionName: attractionName.slice(0, MAX_NAME) };
}

/** What the bridge reads off a dragged anchor. */
export interface RideDragSourceAttributes {
  /** `data-planner-ride` — the attraction slug the card is for. */
  slug?: string | null;
  /** `data-planner-ride-name` — the name as the card displays it. */
  name?: string | null;
  /** The anchor's `href`, which is where the park comes from. */
  href?: string | null;
}

/**
 * The payload for one dragged ride card, or `null` when the element is not one.
 *
 * The ride's slug and name come from the card's own attributes; the PARK comes
 * from the href, because a card does not always know which park it belongs to
 * (a favourites list mixes several) while its URL always does.
 */
export function buildRideDragPayload(source: RideDragSourceAttributes): PlannerRideDrag | null {
  const name = source.name?.trim();
  const slug = source.slug?.trim();
  if (!name || !slug) return null;
  const fromHref = source.href ? rideFromUrl(source.href) : null;
  if (!fromHref) return null;
  // The href decides the park; the slug is checked against it so an attribute
  // left over from a re-render cannot file a ride under the wrong ride.
  if (fromHref.attractionSlug !== slug) return null;
  return { parkSlug: fromHref.parkSlug, attractionSlug: slug, attractionName: name };
}

/**
 * Start a ride drag from a control that is NOT a link.
 *
 * `useRideDragSource` covers the park page, where every ride is an `<a>` and a
 * document-level `dragstart` listener can find it by its data attributes. The
 * planner's own ride list is a list of buttons — a browser does not make those
 * draggable at all, and nothing in that panel matched the anchor selector, so
 * the one surface built for putting rides into a plan was the one surface a
 * ride could not be dragged out of.
 *
 * No `text/uri-list` here on purpose: the list row knows the ride's slug and
 * name but not its URL, and writing a guessed one would hand a wrong link to
 * everything else on the desktop that accepts a drop.
 */
export function startRideDrag(dt: DataTransfer, ride: PlannerRideDrag): void {
  try {
    dt.setData(PLANNER_RIDE_MIME, serializeRideDrag(ride));
    dt.setData('text/plain', ride.attractionName);
    dt.effectAllowed = 'copy';
  } catch {
    // A store in protected mode — the drag was not started by this gesture.
  }
}
