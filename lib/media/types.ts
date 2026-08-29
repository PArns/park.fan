import type { Locale } from '@/i18n/config';

/**
 * What an image is *used for*, as opposed to what it shows. Roles are declared
 * per image in its sidecar — they are never inferred from the file name or the
 * folder, because in a unified pool `background.jpg` and a Halloween snapshot of
 * the same park sit side by side and only the sidecar can tell them apart.
 */
export type MediaRole =
  /** The park's full-bleed background (park page, OG card). At most one per park. */
  | 'park-background'
  /** The canonical photo of a ride — used on ride cards and the ride page. At most one per ride. */
  | 'ride-card'
  /** Eligible for the homepage hero rotation. */
  | 'hero';

export const MEDIA_ROLES: readonly MediaRole[] = ['park-background', 'ride-card', 'hero'];

/**
 * `unknown` is a real, expected value — an image whose rights have not been
 * established yet. The manifest generator counts those so they can't quietly
 * accumulate; see `pnpm generate:media`.
 */
export type MediaLicense =
  | 'all-rights-reserved'
  | 'cc-by-4.0'
  | 'cc-by-sa-4.0'
  | 'cc-by-nc-4.0'
  | 'cc0-1.0'
  | 'public-domain'
  | 'unknown';

export const MEDIA_LICENSES: readonly MediaLicense[] = [
  'all-rights-reserved',
  'cc-by-4.0',
  'cc-by-sa-4.0',
  'cc-by-nc-4.0',
  'cc0-1.0',
  'public-domain',
  'unknown',
];

/** Per-locale strings. Lookup falls back through `de` → `en` → any present value. */
export type LocalizedText = Partial<Record<Locale, string>>;

export interface MediaCredit {
  /** Who took the photo. `null` when unestablished — never guessed. */
  author: string | null;
  license: MediaLicense;
  /** Where it came from, e.g. `own`, `press-kit`, `contribution`. */
  source: string | null;
  sourceUrl: string | null;
  /** Year of capture/publication, for the copyright line. */
  year: number | null;
}

/**
 * The hand-authored half: `<name>.json` sitting next to `<name>.jpg`.
 *
 * Every field is optional — an image with no sidecar at all is still a valid
 * member of the database, it just carries no metadata. That is deliberate:
 * dropping a file into `public/media/` should never break the build.
 */
export interface MediaSidecar {
  /** Park slug the image shows, or `null` when it shows no specific park. */
  park?: string | null;
  /**
   * Full hierarchy path (`europe/france/paris/disneyland-park`), for the parks
   * whose slug is not unique.
   *
   * Two really exist in the catalog: `disneyland-park` (Anaheim and Paris) and
   * `universal-islands-of-adventure` (Orlando and, per the upstream data, Tampa).
   * A bare slug cannot say which one a photo shows, so the generator warns when a
   * colliding slug is used without this.
   */
  parkPath?: string | null;
  /** Attraction slug, when the image shows one specific ride. */
  ride?: string | null;
  /**
   * Further attraction slugs the same photo shows, and should answer for.
   *
   * For the pairs the API lists as two rides but the park built as one structure:
   * Winja's Fear and Winja's Force share a hall, YOY Chill and YOY Thrill share a
   * layout, and one photograph is genuinely of both. Storing that as two identical
   * files is what the media database exists to avoid — and when the duplicates were
   * cleaned up, the second ride silently lost its only picture, because `ride` holds
   * one slug. `roles` already solved the same problem in the other direction (one
   * file is `park-background` AND `ride-card`); this is that, for rides.
   *
   * Not a place for "this ride is also in frame somewhere": the photo has to be a
   * fair card for every slug listed, since `ride-card` resolution treats them alike.
   */
  alsoRides?: string[];
  /** Themed area within the park (not tracked by the API — authored here). */
  area?: string | null;
  /** Short human label, mainly for the admin browser. */
  title?: string;
  tags?: string[];
  roles?: MediaRole[];
  alt?: LocalizedText;
  caption?: LocalizedText;
  credit?: Partial<MediaCredit>;
  /** ISO date (YYYY-MM-DD) the photo was taken. Falls back to EXIF DateTimeOriginal. */
  shotAt?: string;
  /** Explicit position within its collection; falls back to filename order. */
  order?: number;
  /** Overrides the EXIF GPS fix — set it when EXIF is absent, stripped or wrong. */
  gps?: MediaGps | null;
  /**
   * Focal point, as `{ x, y }` in 0..1 or one of the nine keyword shorthands
   * (`top`, `top-left`, `center`, `bottom-right`, …). Omit for centre.
   */
  focus?: MediaFocus | string | null;
  /**
   * Somebody still has to look at this one.
   *
   * Written by the field-capture route (`/admin/capture`), which fills in what a
   * phone standing in front of a ride can know for certain and leaves what needs
   * the picture on a screen: alt text, caption, the tags describing what is in
   * frame, the focal point if it was not tapped on the spot. The flag is what
   * separates "not written yet" from "needs none" — those two look identical in
   * the database, which is why a missing alt text alone cannot be the signal.
   *
   * Cleared from the media browser's detail panel. Only `true` is ever written.
   */
  review?: boolean;
}

/**
 * The point that must survive any crop, in normalized image coordinates
 * (0,0 = top-left, 1,1 = bottom-right).
 *
 * A point rather than a `top | center | bottom` keyword, because one value then
 * drives both places a crop happens: the CSS `object-position` of a card that
 * paints the photo in a different aspect ratio, and the offset the build-time
 * 16:9 / 4:3 / 1:1 crops are cut at. Keywords are accepted in the sidecar as
 * shorthand and stored as their equivalent point.
 */
export interface MediaFocus {
  x: number;
  y: number;
}

/** Where the shutter was pressed. Decimal degrees, WGS 84. */
export interface MediaGps {
  lat: number;
  lon: number;
  /** `exif` when read off the file, `manual` when authored in the sidecar. */
  source: 'exif' | 'manual';
}

/**
 * One row of the database: the sidecar, normalized, plus everything the
 * generator derives from the file itself (path, intrinsic size, byte size).
 *
 * Localized `alt`/`caption` deliberately live in a separate manifest
 * (`manifest-text.ts`) — six locales of prose for every image is the bulk of the
 * data, and most consumers only need to resolve a path.
 */
export interface MediaImage {
  /** `<collection>/<name>`, e.g. `toverland/troy`. Stable, greppable, URL-safe. */
  id: string;
  /** Directory path under `public/media`, e.g. `toverland` or `halloween-2026/kulissen`. */
  collection: string;
  /** Public path, e.g. `/media/toverland/troy.jpg`. */
  src: string;
  width: number;
  height: number;
  bytes: number;
  /** Lower-case file extension without the dot: `jpg`, `png`, `webp`, `svg`. */
  format: string;
  park: string | null;
  /** Full hierarchy path, present when the sidecar disambiguates a colliding slug. */
  parkPath: string | null;
  ride: string | null;
  /** Additional rides this photo shows — see `MediaSidecar.alsoRides`. Empty when none. */
  alsoRides: string[];
  area: string | null;
  title: string;
  tags: string[];
  roles: MediaRole[];
  credit: MediaCredit;
  shotAt: string | null;
  order: number | null;
  /**
   * GPS fix, from EXIF unless the sidecar overrides it. The admin browser matches
   * this against the park catalog to confirm — or contradict — the assigned park,
   * which is the cheapest data-quality check the database has: a photo tagged
   * `europa-park` whose coordinates land in Kaatsheuvel is simply mislabelled.
   */
  gps: MediaGps | null;
  /**
   * Normalized focal point, or null when the image is happy centred.
   *
   * Drives both the CSS `object-position` wherever the photo is painted in a
   * different aspect ratio (ride cards, backgrounds) and the offset the
   * build-time crops are cut at, so a subject near an edge — the Troy horse's
   * head — survives every rendition instead of being cut off in the wide one.
   */
  focus: MediaFocus | null;
  /** Still awaiting a proper pass — see `MediaSidecar.review`. */
  review: boolean;
  /**
   * Content version: changes exactly when this image's pixels or framing change.
   * Append as `?v=` so renditions can be cached as immutable without a focal-point
   * retarget silently serving the old crop forever. See `versionedSrc`.
   */
  version: string;
  /**
   * Aspect-ratio crops (16:9 / 4:3 / 1:1) that exist for this image, widest-first,
   * as public paths. Cut by `generate:image-crops` and recorded at build time, so
   * the structured-data image set needs no filesystem probe at request time.
   * Empty when the image has no crops (SVGs, or a build without sharp).
   */
  variants: string[];
}

/** The localized half, keyed by image id. */
export interface MediaText {
  alt?: LocalizedText;
  caption?: LocalizedText;
}

/** A `MediaImage` with its text resolved for one locale — what components render. */
export interface ResolvedMediaImage extends MediaImage {
  alt: string;
  caption: string | null;
  /** Ready-to-render attribution line, e.g. `© 2025 Patrick Arns`. */
  creditLine: string | null;
}

/** Park reference data, generated from the API catalog into `manifest-parks.ts`. */
export interface MediaParkRef {
  slug: string;
  name: string;
  city: string | null;
  /** Matches the `geo.countries.*` translation key. */
  countrySlug: string;
  /** `continent/country/city/slug` — append to `/parks/` for the page URL. */
  path: string;
}

export interface MediaQuery {
  /** Free text over id, title, tags, alt and caption (all locales). */
  q?: string;
  park?: string | null;
  ride?: string | null;
  collection?: string;
  /** Match images carrying ALL of these tags. */
  tags?: string[];
  role?: MediaRole;
  license?: MediaLicense;
  /** Only images whose rights are still unestablished. */
  unlicensedOnly?: boolean;
  /** Only images with no park assigned. */
  unassignedOnly?: boolean;
  /** Only images still flagged for a review pass. */
  reviewOnly?: boolean;
}
