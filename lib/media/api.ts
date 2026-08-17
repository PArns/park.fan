import { getParkRef } from './index';
import { versioned, versionedSrc } from './focus';
import { getCreditLine, getMediaAlt, getMediaCaption } from './text';
import type { MediaImage } from './types';

/**
 * The wire shape of a media image.
 *
 * Deliberately not `MediaImage` itself: the internal row is free to change shape,
 * while this is a contract with clients we do not deploy in lockstep — the native
 * app above all. It also does the work a client would otherwise each reimplement:
 * resolving text for a locale, formatting the credit line, versioning every URL.
 */
export interface MediaApiImage {
  id: string;
  collection: string;
  /** Content-versioned public URL; safe to cache as immutable. */
  url: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  /** Content version — changes only when the pixels or the framing change. */
  version: string;
  alt: string;
  caption: string | null;
  credit: {
    author: string | null;
    license: string;
    line: string | null;
    sourceUrl: string | null;
  };
  park: {
    slug: string;
    name: string;
    city: string | null;
    country: string;
    /** Page path on park.fan, without a locale prefix. */
    path: string;
  } | null;
  ride: string | null;
  /** Further rides the same photo shows and answers for — see `MediaSidecar.alsoRides`. */
  alsoRides: string[];
  area: string | null;
  tags: string[];
  roles: string[];
  shotAt: string | null;
  /**
   * Normalized focal point in 0..1, or null for centre. A client cropping the
   * image to its own aspect ratio should honour this — it is the difference
   * between keeping a subject in frame and cutting its head off.
   */
  focus: { x: number; y: number } | null;
  gps: { lat: number; lon: number } | null;
  /** Pre-cut aspect-ratio renditions, widest-first, content-versioned. */
  variants: { aspect: string; url: string }[];
}

const ASPECT_OF = /-(16x9|4x3|1x1)\.[a-z0-9]+$/i;

/** One database row in its wire shape, with text resolved for `locale`. */
export function serializeMediaImage(image: MediaImage, locale: string): MediaApiImage {
  const park = getParkRef(image);

  return {
    id: image.id,
    collection: image.collection,
    url: versionedSrc(image),
    width: image.width,
    height: image.height,
    bytes: image.bytes,
    format: image.format,
    version: image.version,
    alt: getMediaAlt(image.id, locale) ?? image.title,
    caption: getMediaCaption(image.id, locale),
    credit: {
      author: image.credit.author,
      license: image.credit.license,
      line: getCreditLine(image),
      sourceUrl: image.credit.sourceUrl,
    },
    park: park
      ? {
          slug: park.slug,
          name: park.name,
          city: park.city,
          country: park.countrySlug,
          path: `/parks/${park.path}`,
        }
      : null,
    ride: image.ride,
    alsoRides: image.alsoRides,
    area: image.area,
    tags: image.tags,
    roles: image.roles,
    shotAt: image.shotAt,
    focus: image.focus,
    // The `source` discriminator is internal bookkeeping; a client only needs the fix.
    gps: image.gps ? { lat: image.gps.lat, lon: image.gps.lon } : null,
    variants: image.variants.map((path) => ({
      aspect: path.match(ASPECT_OF)?.[1] ?? 'source',
      url: versioned(path, image),
    })),
  };
}
