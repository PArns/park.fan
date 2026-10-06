import { getCollection, getMediaImageBySrc, getMediaImageForPath } from '@/lib/media';
import { cropDimensionsForPath } from '@/lib/media/crop-box.mjs';
import { versionedPath, versionedSrc } from '@/lib/media/focus';
import { getCreditLine, getMediaAlt, getMediaCaption } from '@/lib/media/text';
import type { MediaImage } from '@/lib/media/types';
import type { BlogImage } from './types';

/**
 * Blog galleries, served from the media database: a gallery is a collection and its captions live
 * in each image's sidecar, so the same photos also answer park and ride queries. Reads the
 * build-time manifest, not the filesystem, so it is safe anywhere.
 */

/** One database row, in the shape the blog components render. */
function toBlogImage(image: MediaImage, locale?: string): BlogImage {
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
 * The images of a gallery, in order, from a collection id or a `/media/<collection>` path. An
 * unknown collection gives no gallery rather than a broken page.
 */
export function listFolderImages(folder: string, locale?: string): BlogImage[] {
  return getCollection(normalizeCollection(folder)).map((image) => toBlogImage(image, locale));
}

/**
 * Fills in what the database knows about a hand-listed image without overriding what the author
 * wrote, since a post may caption a photo differently from the database.
 */
function enrich(image: BlogImage, locale?: string): BlogImage {
  // `exact` is "is this row THIS file"; `owner` also answers for a build-time crop such as
  // `…-16x9.jpg`, which needs the owner's version token because its bytes change under an
  // unchanged URL when the focal point moves.
  const exact = getMediaImageBySrc(image.src);
  const owner = exact ?? getMediaImageForPath(image.src);
  if (!owner) return image;
  const fromDb = toBlogImage(owner, locale);
  // A crop's dimensions come from the module the generator cuts it with; left undefined, the
  // image would reserve no box and reflow the article.
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
