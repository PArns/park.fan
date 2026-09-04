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
export function startRideDrag(
  dt: DataTransfer,
  ride: PlannerRideDrag,
  image?: RideDragImageSource
): void {
  try {
    dt.setData(PLANNER_RIDE_MIME, serializeRideDrag(ride));
    dt.setData('text/plain', ride.attractionName);
    dt.effectAllowed = 'copy';
  } catch {
    // A store in protected mode — the drag was not started by this gesture.
  }
  setRideDragImage(dt, ride.attractionName, image);
}

/** Where the chip's thumbnail comes from, if it has one. */
export interface RideDragImageSource {
  /** The element being dragged. Its `<img>`, where it has a decoded one, is drawn. */
  element?: Element | null;
  /** A photo URL, for a control that carries no picture of its own. */
  photo?: string | null;
  /** `object-position` for that photo. */
  photoPosition?: string | null;
}

/** The chip's picture, in CSS pixels. A list row's thumbnail, deliberately. */
const THUMB_PX = 32;

/**
 * The optimizer URL for a chip-sized thumbnail.
 *
 * `w=96` and `q=75` are not free numbers: they are exactly what
 * `PlannerRideThumb` asks for at `size={8}`, so a ride that is also in the
 * panel's list shares that rendition's cache entry and the warm costs nothing
 * at all. Both values have to be listed in `next.config`'s `imageSizes` and
 * `qualities` or the optimizer answers 400.
 */
function thumbUrl(src: string | null | undefined): string | null {
  if (!src) return null;
  // Nothing the optimizer would take, and nothing it needs to.
  if (src.startsWith('data:') || src.startsWith('blob:') || src.endsWith('.svg')) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=96&q=75`;
}

/**
 * Thumbnails this session has already decoded, keyed by their optimizer URL.
 *
 * A drag image is snapshotted SYNCHRONOUSLY inside `dragstart`: whatever has
 * not arrived by then is not in the picture, and there is no second chance —
 * the browser does not redraw it when the load finishes. So a source that
 * carries no picture of its own has to have asked for one BEFORE the gesture,
 * which is what {@link warmRideDragThumb} is for, and this map is where the
 * decoded element waits.
 *
 * Module-level rather than per-component: the same ride is a pill in one band
 * and a row in a list, and a plan is opened and closed all day.
 */
const warmed = new Map<string, HTMLImageElement>();

/**
 * How many decoded thumbnails are kept. A 96 px picture is ~2 KB on the wire and
 * ~37 KB decoded, so an unbounded map is a slow leak in a tab somebody leaves
 * open — and the useful set is tiny anyway: the rides visible in one band.
 * Insertion order is a `Map`'s own, so the oldest key is the first one.
 */
const WARM_LIMIT = 32;

/**
 * Ask for a ride's thumbnail now, so a drag that starts later has one.
 *
 * Called from a control's `pointerenter` — not on mount. A mouse drag is always
 * preceded by the pointer arriving on the control, which buys the fetch the
 * whole time between hovering and pressing, and a band of eight headliner pills
 * that nobody points at costs nothing.
 */
export function warmRideDragThumb(src: string | null | undefined): void {
  const url = thumbUrl(src);
  if (!url || warmed.has(url) || typeof window === 'undefined') return;
  const img = new window.Image();
  img.decoding = 'async';
  img.src = url;
  warmed.set(url, img);
  if (warmed.size > WARM_LIMIT) {
    const oldest = warmed.keys().next();
    if (!oldest.done) warmed.delete(oldest.value);
  }
}

/**
 * What a dragged ride looks like while it is in the air.
 *
 * Without this the browser snapshots whatever element the gesture started on,
 * and the two ways into a plan therefore looked like two different features:
 * the panel's own list handed over a 400 × 36 px row that reads as a chip, and
 * a park page handed over the whole `AttractionCard` — 405 × 404 px of
 * photograph, headline, badges and wait time, dragged across the screen at
 * half opacity. The headliner band was a third shape again, a bare pill.
 *
 * So the chip is drawn here, once, and every surface gets the same one. It is
 * deliberately close to what the ride list already looked like, because that is
 * the shape this was reported as wanting: the ride's own photo at 32 px and its
 * name, nothing else.
 *
 * Two details are what make it work rather than flicker:
 *
 * - The thumbnail is PAINTED, never loaded. See {@link dragThumb}.
 * - The element must be IN the document and rendered when `setDragImage` is
 *   called, so it is appended off-screen rather than hidden, and removed two
 *   frames later: `display: none` produces no snapshot at all, and removing it
 *   in the same tick races the browser in WebKit.
 */
export function setRideDragImage(
  dt: DataTransfer,
  name: string,
  image?: RideDragImageSource
): void {
  if (typeof document === 'undefined' || typeof dt?.setDragImage !== 'function') return;

  const chip = document.createElement('div');
  chip.setAttribute('data-planner-drag-chip', '');
  chip.className =
    'pointer-events-none fixed top-[-9999px] left-[-9999px] z-[9999] flex max-w-[240px] items-center gap-2 rounded-md border bg-popover px-2 py-1.5 shadow-lg';

  const thumb = dragThumb(image);
  if (thumb) chip.appendChild(thumb);

  const label = document.createElement('span');
  label.className = 'truncate text-sm font-medium text-popover-foreground';
  label.textContent = name;
  chip.appendChild(label);

  document.body.appendChild(chip);
  try {
    // Under the pointer near the chip's left edge, so the cursor stays on the
    // hour it is about to drop into rather than on the middle of the name.
    dt.setDragImage(chip, 20, chip.offsetHeight / 2 || 22);
  } catch {
    // Some browsers refuse a drag image on a protected store. The default one
    // is then what it always was.
  }
  requestAnimationFrame(() => requestAnimationFrame(() => chip.remove()));
}

/**
 * The chip's picture — drawn into a canvas, or nothing.
 *
 * It used to be an `<img>` clone pinned to the source's `currentSrc`, and that
 * is a REQUEST: same URL, warm cache, almost always instant — but "almost" is
 * the whole story here, because the snapshot is taken in the same tick and does
 * not wait. Worse was the fallback beside it. `currentSrc` is empty until an
 * image has actually loaded, so `currentSrc || src` fell through to `src`, and
 * on a `next/image` element `src` is the LAST srcset candidate — `w=3840`, 147
 * KB, a rendition the page never asked for. Every card whose photo had not
 * finished loading therefore started a fresh download of the largest copy in
 * existence and drew the chip with a hole in it.
 *
 * A canvas has neither problem: `drawImage` copies pixels that are already
 * decoded, so the thumbnail is finished before `setDragImage` is reached and
 * nothing goes over the network at all. The cover geometry is done here rather
 * than left to `object-fit`, because a canvas has no `object-fit` to speak of —
 * its content IS what was drawn — and that is also what lets the curator's
 * focal point survive into a 32 px box.
 *
 * Where there are no decoded pixels — a card below `sm`, which renders no photo
 * at all, or a pill nobody hovered — the answer is `null` and the chip is the
 * ride's name. An empty grey square would claim a picture that is not coming.
 */
function dragThumb(image?: RideDragImageSource): HTMLElement | null {
  const found = image?.element?.querySelector?.('img');
  if (isPainted(found)) {
    return canvasThumb(found, getComputedStyle(found).objectPosition);
  }

  const url = thumbUrl(image?.photo);
  const ready = url ? warmed.get(url) : null;
  if (isPainted(ready)) {
    return canvasThumb(ready, image?.photoPosition ?? undefined);
  }

  // Nothing to draw this time. Asking now is what makes the NEXT drag from the
  // same control work — a pill somebody grabbed without hovering first, or a
  // card whose photo was still in flight.
  warmRideDragThumb(image?.photo);
  return null;
}

/** Decoded and non-empty, which is the only state `drawImage` accepts. */
function isPainted(img: unknown): img is HTMLImageElement {
  return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0;
}

/**
 * The source, drawn into a square the way `object-fit: cover` would.
 *
 * Backed at the device's pixel ratio rather than at 32 × 32: the drag image is
 * composited by the OS at the screen's real resolution, and a 32 px canvas
 * blown up to a retina display is the one place in this chip where the seam
 * would show.
 */
function canvasThumb(source: HTMLImageElement, position?: string): HTMLElement | null {
  const canvas = document.createElement('canvas');
  const ratio = Math.min(Math.max(window.devicePixelRatio || 1, 1), 3);
  canvas.width = Math.round(THUMB_PX * ratio);
  canvas.height = Math.round(THUMB_PX * ratio);
  // The CSS box stays 32 px; only the backing store is denser.
  canvas.className = 'size-8 shrink-0 rounded';

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // `cover`: scale to the LARGER of the two ratios, so the box is filled and
  // the overflow happens on one axis.
  const scale = Math.max(canvas.width / source.naturalWidth, canvas.height / source.naturalHeight);
  const width = source.naturalWidth * scale;
  const height = source.naturalHeight * scale;
  const [x, y] = coverOffset(position);
  ctx.drawImage(source, (canvas.width - width) * x, (canvas.height - height) * y, width, height);
  return canvas;
}

/**
 * `object-position` as a pair of fractions of the leftover space.
 *
 * Percentages only, which is what the media database stores and what
 * `getComputedStyle` normalises a keyword to (`center top` comes back as
 * `50% 0%`). A length would be an offset in the SOURCE element's box and means
 * something else in a 32 px one, so it falls back to the centre rather than
 * being reinterpreted.
 */
export function coverOffset(position?: string): [number, number] {
  const parts = (position ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return [0.5, 0.5];
  const axis = (raw: string | undefined): number => {
    if (!raw?.endsWith('%')) return 0.5;
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) ? Math.min(Math.max(value / 100, 0), 1) : 0.5;
  };
  return [axis(parts[0]), axis(parts[1] ?? parts[0])];
}
