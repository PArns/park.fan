import { getCollection, getMediaImageBySrc } from '@/lib/media';
import { versionedSrc } from '@/lib/media/focus';
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
  const found = getMediaImageBySrc(image.src);
  if (!found) return image;
  const fromDb = toBlogImage(found, locale);
  return {
    ...fromDb,
    ...image,
    // The author's src may lack the version token — always use the canonical one.
    src: fromDb.src,
    alt: image.alt ?? fromDb.alt,
    caption: image.caption ?? fromDb.caption,
    credit: image.credit ?? fromDb.credit,
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
