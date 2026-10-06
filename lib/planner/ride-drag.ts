/**
 * What a ride carries while it is being dragged onto the planner.
 *
 * The drag carries its own payload (park, slug and name, from {@link buildRideDragPayload}),
 * because `text/uri-list` alone fails on the commonest grabs: dragging a card's photo hands over
 * the image's URL, and a ride URL carries a slug but no name. `text/uri-list` stays on the drag for
 * everything else that accepts a link, and the drop handler still falls back to it.
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
 * The park and ride a frontend ride URL names, read by the `parks` segment rather than by position,
 * because five of six locales carry a locale prefix.
 *
 * `/<locale>/parks/<continent>/<country>/<city>/<park>/<attraction>`
 */
export function rideFromPath(path: string): { parkSlug: string; attractionSlug: string } | null {
  const parts = path.split('/').filter(Boolean);
  const parksAt = parts.indexOf('parks');
  if (parksAt === -1) return null;
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

/**
 * The ride currently in the air, for the handlers that may not read the payload.
 *
 * Chrome keeps the DataTransfer protected until `drop`, so `dragover` sees only its types, yet the
 * grid's preview needs the ride to clamp it to the ride's own floor. Module-level, because a drag
 * is one gesture in one document. Not a second channel for the drop: the drop files only from the
 * DataTransfer, which also survives a drag from another tab.
 */
let activeDrag: PlannerRideDrag | null = null;

/** What is being dragged right now, or `null` — see {@link activeDrag}. */
export function activeRideDrag(): PlannerRideDrag | null {
  return activeDrag;
}

/**
 * Remember a drag for its own length, and forget it at `dragend`, which fires on the source after
 * every gesture, including one cancelled or ended outside the window, where `drop` does not.
 */
export function rememberRideDrag(ride: PlannerRideDrag): void {
  activeDrag = ride;
  if (typeof document === 'undefined') return;
  const done = () => {
    activeDrag = null;
    document.removeEventListener('dragend', done, true);
  };
  document.addEventListener('dragend', done, true);
}

/**
 * Serializes a ride dragged onto the planner as the JSON carried under `PLANNER_RIDE_MIME`, with
 * the name cut to 120 characters.
 */
export function serializeRideDrag(ride: PlannerRideDrag): string {
  return JSON.stringify({
    parkSlug: ride.parkSlug,
    attractionSlug: ride.attractionSlug,
    attractionName: ride.attractionName.slice(0, MAX_NAME),
  });
}

/**
 * The payload, or `null` where it is not one. A `DataTransfer` is input from outside, so anything
 * that is not three strings is refused rather than repaired.
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
 * The payload for one dragged ride card, or `null` when the element is not one. The park comes from
 * the href, because a card does not always know its park (a favourites list mixes several).
 */
export function buildRideDragPayload(source: RideDragSourceAttributes): PlannerRideDrag | null {
  const name = source.name?.trim();
  const slug = source.slug?.trim();
  if (!name || !slug) return null;
  const fromHref = source.href ? rideFromUrl(source.href) : null;
  if (!fromHref) return null;
  // The slug is checked against the href, so a stale attribute cannot file the wrong ride.
  if (fromHref.attractionSlug !== slug) return null;
  return { parkSlug: fromHref.parkSlug, attractionSlug: slug, attractionName: name };
}

/**
 * Start a ride drag from a control that is not a link, such as the planner's own ride list, which
 * a browser does not make draggable. No `text/uri-list`: the row knows no URL, and a guessed one
 * would hand a wrong link to anything that accepts a drop.
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
    // A store in protected mode: the drag was not started by this gesture.
  }
  // Outside the `try`: a store that refuses the payload must not cost the remembered drag.
  rememberRideDrag(ride);
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
 * The optimizer URL for a chip-sized thumbnail. `w=96` and `q=75` are what `PlannerRideThumb` asks
 * for at `size={8}`, so the two share a cached rendition; both must be listed in `next.config`'s
 * `imageSizes` and `qualities`, or the optimizer answers 400.
 */
function thumbUrl(src: string | null | undefined): string | null {
  if (!src) return null;
  // Nothing the optimizer would take, and nothing it needs to.
  if (src.startsWith('data:') || src.startsWith('blob:') || src.endsWith('.svg')) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=96&q=75`;
}

/**
 * Thumbnails this session has already decoded, keyed by their optimizer URL. A drag image is
 * snapshotted synchronously in `dragstart`, so a source with no picture of its own must ask for
 * one before the gesture ({@link warmRideDragThumb}). Module-level, because one ride appears on
 * several surfaces.
 */
const warmed = new Map<string, HTMLImageElement>();

/**
 * How many decoded thumbnails are kept, so a long-open tab does not leak them; a `Map` keeps
 * insertion order, so the oldest key is the first.
 */
const WARM_LIMIT = 32;

/** Asks for a ride's thumbnail now, so the next drag from the same control has one. */
function warmRideDragThumb(src: string | null | undefined): void {
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
 * What a dragged ride looks like while it is in the air: the same chip, the ride's photo at 32 px
 * and its name, from every surface, rather than whatever element the gesture started on.
 *
 * The thumbnail is painted, never loaded (see {@link dragThumb}). The chip must be in the document
 * and rendered when `setDragImage` is called, so it is placed off-screen and removed two frames
 * later: `display: none` gives no snapshot, and removing it in the same tick races WebKit.
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
    // Under the pointer near the chip's left edge, so the cursor stays on the hour it drops into.
    dt.setDragImage(chip, 20, chip.offsetHeight / 2 || 22);
  } catch {
    // Some browsers refuse a drag image on a protected store; the default one is used then.
  }
  requestAnimationFrame(() => requestAnimationFrame(() => chip.remove()));
}

/**
 * The chip's picture, drawn into a canvas, or nothing.
 *
 * A canvas copies pixels that are already decoded, so the thumbnail is finished before
 * `setDragImage` and nothing goes over the network; an `<img>` clone is a request, and an unloaded
 * `next/image` falls back to its largest srcset candidate. Cover geometry is done here so the
 * focal point survives. With no decoded pixels the answer is `null` and the chip is the name alone.
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

  // Nothing to draw this time; asking now makes the next drag from the same control work.
  warmRideDragThumb(image?.photo);
  return null;
}

/** Decoded and non-empty, which is the only state `drawImage` accepts. */
function isPainted(img: unknown): img is HTMLImageElement {
  return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0;
}

/**
 * The source, drawn into a square the way `object-fit: cover` would, backed at the device's pixel
 * ratio, since the OS composites the drag image at the screen's real resolution.
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
 * `object-position` as a pair of fractions of the leftover space. Percentages only, which is what
 * the media database stores and `getComputedStyle` returns; a length means something else in a
 * 32 px box, so it falls back to the centre.
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
