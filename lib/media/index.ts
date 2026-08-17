import { MEDIA_IMAGES } from './manifest';
import { MEDIA_PARK_PATH_BY_SLUG, MEDIA_PARKS } from './manifest-parks';
import { MEDIA_POSTINGS, MEDIA_SEARCH, MEDIA_VOCABULARY } from './manifest-search';
import { foldText, lowerBound, tokenize } from './tokenize.mjs';
import type { MediaImage, MediaParkRef, MediaQuery, MediaRole } from './types';

export type {
  LocalizedText,
  MediaCredit,
  MediaGps,
  MediaImage,
  MediaLicense,
  MediaParkRef,
  MediaQuery,
  MediaRole,
  MediaText,
  ResolvedMediaImage,
} from './types';
export { MEDIA_PARKS } from './manifest-parks';
export { MEDIA_IMAGES } from './manifest';
export { MEDIA_REVISION } from './manifest-search';

/**
 * The read side of the media database — structure, lookup and search.
 *
 * Everything here works off the build-time manifests, so it is safe in Server
 * Components, route handlers and scripts alike — no `fs`, no `server-only`. The
 * filesystem is the write side; this module never touches it.
 *
 * The organizing idea: **a collection is storage, the sidecar is the index.**
 * Nothing queries by folder. A Halloween photo of Troy lives in the
 * `toverland-halloween` collection and still answers `getRideImages('toverland',
 * 'troy')`, because its sidecar says which ride it shows. That is what makes one
 * pool serve the blog, the park pages and the ride pages at once.
 *
 * Localized alt/caption deliberately live in `./text` — importing them costs the
 * 37 KB text manifest, which a route that only resolves paths or searches should
 * not pay. Same split as `@/lib/blog/listing` vs `@/lib/blog`.
 */

// ─── indexes ─────────────────────────────────────────────────────────────────

// Built once per process on first use. The manifest is fixed at build time, so
// there is nothing to invalidate.
let byId: Map<string, MediaImage> | null = null;
let bySrc: Map<string, MediaImage> | null = null;
let byVariant: Map<string, MediaImage> | null = null;
let byPark: Map<string, MediaImage[]> | null = null;
let byCollection: Map<string, MediaImage[]> | null = null;

function indexes() {
  if (!byId) {
    byId = new Map();
    bySrc = new Map();
    byVariant = new Map();
    byPark = new Map();
    byCollection = new Map();
    for (const image of MEDIA_IMAGES) {
      byId.set(image.id, image);
      bySrc.set(image.src, image);
      // Crops are indexed separately, NOT folded into `bySrc`. They must not answer
      // the ordinary path lookup: callers there use the row's own `src` and `width`
      // (the gallery rewrites an author's path to the canonical one, the blog
      // reserves an inline image's box from it), and a crop resolving to its source
      // would swap a 16:9 file for a 4:3 one and reserve the wrong box.
      for (const variant of image.variants) byVariant.set(variant, image);
      if (image.park) {
        const list = byPark.get(image.park);
        if (list) list.push(image);
        else byPark.set(image.park, [image]);
      }
      const collection = byCollection.get(image.collection);
      if (collection) collection.push(image);
      else byCollection.set(image.collection, [image]);
    }
  }
  return {
    byId: byId!,
    bySrc: bySrc!,
    byVariant: byVariant!,
    byPark: byPark!,
    byCollection: byCollection!,
  };
}

// ─── lookup ──────────────────────────────────────────────────────────────────

/** One image by id (`toverland/troy`), or null. */
export function getMediaImage(id: string): MediaImage | null {
  return indexes().byId.get(id) ?? null;
}

/**
 * One image by its public path (`/media/toverland/troy.jpg`), or null.
 *
 * Lets anything still holding a path — blog markdown, frontmatter `coverImage`,
 * legacy props — reach the image's metadata without being rewritten to use ids.
 * An `?align=`-style query is tolerated, matching the blog authoring convention.
 *
 * Matches the **source file only**. A pre-cut crop answers `null` here on purpose;
 * see {@link getMediaImageForPath}.
 */
export function getMediaImageBySrc(src: string): MediaImage | null {
  const clean = src.split('?')[0];
  return indexes().bySrc.get(clean) ?? null;
}

/**
 * The image a public path belongs to, counting the build-time crops.
 *
 * `…-16x9.jpg` is the same photo as `….jpg` — same credit, same focal point, same
 * content version — so anything asking "which row is this file part of" wants this.
 * Anything asking "which row IS this file" wants {@link getMediaImageBySrc}, because
 * the row's `src`, `width` and `height` describe the source, and handing those back
 * for a crop would substitute a 4:3 file for a 16:9 one.
 */
export function getMediaImageForPath(src: string): MediaImage | null {
  const clean = src.split('?')[0];
  const { bySrc, byVariant } = indexes();
  return bySrc.get(clean) ?? byVariant.get(clean) ?? null;
}

/** Every image assigned to a park, in collection + gallery order. */
export function getParkImages(parkSlug: string | null | undefined): MediaImage[] {
  if (!parkSlug) return [];
  return indexes().byPark.get(parkSlug) ?? [];
}

/** Every image in a collection, in gallery order. */
export function getCollection(collection: string): MediaImage[] {
  const key = collection.replace(/^\/+|\/+$/g, '');
  return indexes().byCollection.get(key) ?? [];
}

/** Every collection id present in the database, sorted. */
export function listCollections(): string[] {
  return [...indexes().byCollection.keys()].sort();
}

// ─── park reference data ─────────────────────────────────────────────────────

/**
 * Name, city, country and page path of the park an image shows.
 *
 * Resolves through the image's explicit `parkPath` when it has one, which is what
 * keeps the two colliding slugs (`disneyland-park`, `universal-islands-of-adventure`)
 * pointing at the right park.
 */
export function getParkRef(image: MediaImage): MediaParkRef | null {
  const path = image.parkPath ?? (image.park ? MEDIA_PARK_PATH_BY_SLUG[image.park] : null);
  return path ? (MEDIA_PARKS[path] ?? null) : null;
}

/** Park reference by slug, for callers that only have one. */
export function getParkRefBySlug(parkSlug: string | null | undefined): MediaParkRef | null {
  if (!parkSlug) return null;
  const path = MEDIA_PARK_PATH_BY_SLUG[parkSlug];
  return path ? (MEDIA_PARKS[path] ?? null) : null;
}

/** Locale-less park page path, e.g. `/parks/europe/netherlands/sevenum/toverland`. */
export function getParkPagePath(image: MediaImage): string | null {
  const ref = getParkRef(image);
  return ref ? `/parks/${ref.path}` : null;
}

// ─── role-based resolution ───────────────────────────────────────────────────

/**
 * The park's background image — the full-bleed photo on the park page and the OG
 * card. `null` when the park has none, which callers treat as "fall back to the
 * generic background".
 */
export function getParkBackground(parkSlug: string | null | undefined): MediaImage | null {
  return getParkImages(parkSlug).find((i) => i.roles.includes('park-background')) ?? null;
}

/**
 * The canonical photo for a ride. Prefers the image explicitly marked
 * `ride-card`; falls back to any image of that ride, so a park that has Halloween
 * snapshots of a coaster but no dedicated portrait still shows something.
 */
export function getRideImage(
  parkSlug: string | null | undefined,
  rideSlug: string | null | undefined
): MediaImage | null {
  const candidates = getRideImages(parkSlug, rideSlug);
  return candidates.find((i) => i.roles.includes('ride-card')) ?? candidates[0] ?? null;
}

/**
 * Images that belong to a park but to no particular ride — the park-level tier of
 * the database.
 *
 * This is where the bulk of a Halloween shoot lands: a fogged-in path, a maze
 * facade, a performer between two queues. They are genuinely about the park and
 * nothing narrower, so forcing a ride onto them would be a lie that then shows up
 * on that ride's page. Park pages and park galleries draw from here.
 */
export function getParkOnlyImages(parkSlug: string | null | undefined): MediaImage[] {
  return getParkImages(parkSlug).filter((i) => !i.ride);
}

/**
 * Every image showing a given ride, wherever in the tree it is stored.
 *
 * Matches `alsoRides` as well as `ride`, so the one photo of Winja's Fear & Force
 * answers for both halves instead of the second one needing a byte-identical copy
 * of the file (see `MediaSidecar.alsoRides`).
 */
export function getRideImages(
  parkSlug: string | null | undefined,
  rideSlug: string | null | undefined
): MediaImage[] {
  if (!parkSlug || !rideSlug) return [];
  return getParkImages(parkSlug).filter((i) => showsRide(i, rideSlug));
}

/** Whether an image is indexed for a ride, as its primary ride or via `alsoRides`. */
export function showsRide(image: MediaImage, rideSlug: string): boolean {
  return image.ride === rideSlug || image.alsoRides.includes(rideSlug);
}

/**
 * The homepage hero rotation pool: images explicitly marked `hero`.
 *
 * Passing a park slug narrows it to that park — used when the visitor is
 * detected inside a park, so the hero shows where they actually are.
 */
export function getHeroImages(parkSlug?: string | null): MediaImage[] {
  const pool = parkSlug ? getParkImages(parkSlug) : MEDIA_IMAGES;
  return pool.filter((i) => i.roles.includes('hero'));
}

/** Images carrying a role, optionally within one park. */
export function getImagesByRole(role: MediaRole, parkSlug?: string | null): MediaImage[] {
  const pool = parkSlug ? getParkImages(parkSlug) : MEDIA_IMAGES;
  return pool.filter((i) => i.roles.includes(role));
}

// ─── search ──────────────────────────────────────────────────────────────────

/**
 * Image indexes matching one query word, via the build-time inverted index.
 *
 * The word is treated as a prefix — typing "arach" should find Arachnophobia
 * before the word is complete, which is what a search box is expected to do.
 * Binary search lands on the first candidate token and the walk stops as soon as
 * the prefix no longer matches, so this never scans the whole vocabulary.
 */
function postingsForPrefix(prefix: string): Set<number> | null {
  const out = new Set<number>();
  let index = lowerBound(MEDIA_VOCABULARY as string[], prefix);
  if (index >= MEDIA_VOCABULARY.length) return null;
  for (; index < MEDIA_VOCABULARY.length; index += 1) {
    if (!MEDIA_VOCABULARY[index].startsWith(prefix)) break;
    for (const posting of MEDIA_POSTINGS[index]) out.add(posting);
  }
  return out.size ? out : null;
}

/**
 * Resolve a free-text query to the set of matching image indexes, or null when
 * the query matches nothing.
 *
 * Two paths, because they answer different questions. Word prefixes go through
 * the inverted index and stay fast as the database grows. Anything the index
 * cannot answer — a fragment that starts mid-word like "phobia", or a single
 * character — falls back to a substring scan of the prebuilt haystacks. The
 * fallback is O(n), but it only runs for queries the index genuinely can't serve.
 */
function matchesForQuery(raw: string): Set<number> | null {
  const words = tokenize(raw);

  if (words.length) {
    let result: Set<number> | null = null;
    for (const word of words) {
      const postings = postingsForPrefix(word);
      if (!postings) {
        result = null;
        break;
      }
      // Every word must match — intersect against what survived so far.
      if (result === null) {
        result = postings;
      } else {
        const intersection = new Set<number>();
        for (const index of result) {
          if (postings.has(index)) intersection.add(index);
        }
        result = intersection;
      }
      if (result.size === 0) return null;
    }
    if (result?.size) return result;
  }

  const needle = foldText(raw.trim());
  if (!needle) return null;
  const fallback = new Set<number>();
  MEDIA_IMAGES.forEach((image, index) => {
    if ((MEDIA_SEARCH[image.id] ?? '').includes(needle)) fallback.add(index);
  });
  return fallback.size ? fallback : null;
}

/**
 * Filter the database. Every field is optional and ANDed together; `q` searches
 * id, slugs, area, tags, credit and all localized alt/caption text at once, so
 * "arachnophobia" finds the photo through its German caption even though nothing
 * else mentions it.
 *
 * Shared by the admin browser and the public `/api/media` route, so the two can
 * never drift apart in what they consider a match.
 */
export function searchMedia(query: MediaQuery = {}): MediaImage[] {
  const { q, park, ride, collection, tags, role, license, unlicensedOnly, unassignedOnly } = query;

  const trimmed = q?.trim();
  let matches: Set<number> | null = null;
  if (trimmed) {
    matches = matchesForQuery(trimmed);
    if (!matches) return [];
  }

  return MEDIA_IMAGES.filter((image, index) => {
    if (matches && !matches.has(index)) return false;
    if (park !== undefined && image.park !== park) return false;
    // `ride: null` asks for the park-only tier; a slug matches alsoRides too.
    if (ride !== undefined && (ride === null ? image.ride !== null : !showsRide(image, ride)))
      return false;
    if (
      collection &&
      image.collection !== collection &&
      !image.collection.startsWith(`${collection}/`)
    )
      return false;
    if (role && !image.roles.includes(role)) return false;
    if (license && image.credit.license !== license) return false;
    if (unlicensedOnly && image.credit.license !== 'unknown') return false;
    if (unassignedOnly && image.park) return false;
    if (tags?.length && !tags.every((tag) => image.tags.includes(tag.toLowerCase()))) return false;
    return true;
  });
}

/** Every distinct tag in the database with its usage count, most-used first. */
export function listTags(): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const image of MEDIA_IMAGES) {
    for (const tag of image.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** Every park slug that has at least one image, with its image count. */
export function listParks(): { park: string; count: number }[] {
  return [...indexes().byPark.entries()]
    .map(([park, images]) => ({ park, count: images.length }))
    .sort((a, b) => b.count - a.count || a.park.localeCompare(b.park));
}

/**
 * Counters the admin browser and the build report both show.
 *
 * Structural only — how many images carry prose lives in `./text`, so reading
 * these numbers doesn't pull the text manifest in.
 */
export function mediaStats() {
  return {
    total: MEDIA_IMAGES.length,
    collections: indexes().byCollection.size,
    parks: indexes().byPark.size,
    withGps: MEDIA_IMAGES.filter((i) => i.gps).length,
    unlicensed: MEDIA_IMAGES.filter((i) => i.credit.license === 'unknown').length,
    unassigned: MEDIA_IMAGES.filter((i) => !i.park).length,
    bytes: MEDIA_IMAGES.reduce((sum, i) => sum + i.bytes, 0),
  };
}
