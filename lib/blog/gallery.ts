import { getCollection, getMediaImageBySrc, getMediaImageForPath } from '@/lib/media';
import { cropDimensionsForPath } from '@/lib/media/crop-box.mjs';
import { versionedPath, versionedSrc } from '@/lib/media/focus';
import { getCreditLine, getMediaAlt, getMediaCaption } from '@/lib/media/text';
import type { MediaImage } from '@/lib/media/types';
import type { BlogImage } from './types';

/**
 * Blog galleries, served from the media database.
 *
 * A gallery used to be "every file in a folder under `/public`, plus whatever
 * `captions.json` and its five `captions.<locale>.json` siblings said". That
 * folder is now a **collection** in the media database and the captions live in
 * each image's sidecar, so a gallery is a query — and the same photos answer park
 * and ride queries at the same time. The Halloween shoot is a gallery in the post
 * *and* the source of Troy's Halloween photo on the ride page, without being
 * stored twice.
 *
 * No `server-only` any more: this reads the build-time manifest rather than the
 * filesystem, so it is safe anywhere.
 *
 * `BlogImage` is kept as the return shape, so the rendering components did not
 * have to change.
 */

/** One database row, in the shape the blog components render. */
export function toBlogImage(image: MediaImage, locale?: string): BlogImage {
  const lang = locale ?? 'de';
  return {
    // Content-versioned so a retargeted focal point can't be served stale.
    src: versionedSrc(image),
    alt: getMediaAlt(image.id, lang) ?? image.title,
    caption: getMediaCaption(image.id, lang) ?? undefined,
    credit: getCreditLine(image) ?? undefined,
    width: image.width || undefined,
    height: image.height || undefined,
  };
}

/** `/media/toverland-halloween/` → `toverland-halloween`; also strips legacy prefixes. */
function normalizeCollection(folder: string): string {
  return folder
    .replace(/^\/+|\/+$/g, '')
    .replace(/^media\//, '')
    .replace(/^blog\/images\//, '')
    .replace(/^images\/parks\//, '');
}

/**
 * The images of a gallery, in order.
 *
 * Accepts a bare collection id as well as a `/media/<collection>` path, and still
 * strips the pre-migration `/blog/images/` and `/images/parks/` prefixes so a post
 * written against the old layout keeps resolving. An unknown collection returns an empty array — an author referencing
 * a renamed gallery gets no gallery, not a broken page.
 */
export function listFolderImages(folder: string, locale?: string): BlogImage[] {
  return getCollection(normalizeCollection(folder)).map((image) => toBlogImage(image, locale));
}

/**
 * Fill in what the database knows about a hand-listed image, without overriding
 * what the author wrote — a post may legitimately caption the same photo
 * differently from the database default, and two posts here already do.
 */
function enrich(image: BlogImage, locale?: string): BlogImage {
  // Two questions, deliberately asked separately. `exact` is "is this row THIS
  // file"; `owner` is "which row is this file part of", which also answers for a
  // build-time crop. A hand-listed gallery routinely points at `…-16x9.jpg`, and
  // asking only the first question left those with no caption, no credit — and no
  // version token, which is the one that matters: a crop's bytes are rewritten
  // under an unchanged URL the moment its focal point moves.
  const exact = getMediaImageBySrc(image.src);
  const owner = exact ?? getMediaImageForPath(image.src);
  if (!owner) return image;
  const fromDb = toBlogImage(owner, locale);
  // A crop's dimensions are not the source's, but they are not unknown either: the same module
  // the generator cuts them with can state them. Leaving them undefined is what made a hand-listed
  // gallery render `width={0} height={0}` and reflow the article on every image.
  const cropSize = exact ? null : cropDimensionsForPath(image.src, owner.width, owner.height);
  return {
    ...image,
    // For the source file, the canonical path. For a crop, the author's OWN path
    // with the owning image's version appended — substituting `fromDb.src` there
    // would quietly swap a 16:9 file for a 4:3 one.
    src: exact ? fromDb.src : (versionedPath(image.src) ?? image.src),
    alt: image.alt ?? fromDb.alt,
    caption: image.caption ?? fromDb.caption,
    credit: image.credit ?? fromDb.credit,
    // Dimensions describe the SOURCE. A crop's are different by definition, so they are borrowed
    // only when the author pointed at the source itself — and derived otherwise.
    width: image.width ?? (exact ? fromDb.width : cropSize?.width),
    height: image.height ?? (exact ? fromDb.height : cropSize?.height),
  };
}

/**
 * Resolve a polymorphic gallery declaration from frontmatter into `BlogImage[]`.
 *
 * Accepts:
 *   - an array of explicit image objects (passed through, enriched from the
 *     database where the `src` resolves, so hand-listed images still get their
 *     dimensions and credit),
 *   - a string — a collection id or a path under `/media`,
 *   - `{ folder: '…' }`.
 */
export function resolveGallery(
  input: BlogImage[] | string | { folder: string } | undefined,
  locale?: string
): BlogImage[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((image) => enrich(image, locale));
  if (typeof input === 'string') return listFolderImages(input, locale);
  if (typeof input === 'object' && 'folder' in input && typeof input.folder === 'string') {
    return listFolderImages(input.folder, locale);
  }
  return [];
}
