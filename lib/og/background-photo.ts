import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Resolves the park or ride photo an OG card paints behind its headline, as a data URI read off
 * the deployment's own filesystem rather than a URL Satori fetches over the internet on every
 * render. The 16:9 rendition is preferred, since the card frame is 1200×630.
 *
 * The read is rooted at `og-assets/`, which prebuild fills with only what these cards paint: a
 * runtime `join(process.cwd(), <root>, <variable>)` bundles the whole root into the function. See
 * docs/rules/a-runtime-file-read-ships-the-directory-it-is-rooted-at.md.
 *
 * Without a rendition on disk (or under `next dev`, which skips prebuild) it falls back to the
 * absolute URL. That fallback usually paints no photo, because Satori skips the progressive
 * source JPEG, but a card without its photo beats a failed render.
 */

/** Read once per warm function instance. Keyed by the site-relative source path. */
const dataUriCache = new Map<string, string | null>();

/** `/media/x/background.jpg` → `/media/x/background-16x9.jpg` */
function toCropPath(imagePath: string): string {
  return imagePath.replace(/(\.[a-z0-9]+)$/i, '-16x9$1');
}

/**
 * Drop the `?v=` content version before touching the filesystem.
 *
 * Media paths carry a version token so browser and CDN caches can treat them as
 * immutable, but there is no such file on disk — and the token also sits between
 * the extension and the end of the string, so `toCropPath` would not match either.
 */
function withoutVersion(imagePath: string): string {
  return imagePath.split('?')[0];
}

function readAsDataUri(relPath: string): string | null {
  const cached = dataUriCache.get(relPath);
  if (cached !== undefined) return cached;

  // `og-assets`, never `public` — see the header. The variable segment is what makes the tracer
  // sweep the whole root, so the root has to be a directory holding only these cards' assets.
  const absolute = join(process.cwd(), 'og-assets', relPath.replace(/^\//, ''));
  let uri: string | null = null;
  // existsSync first: a miss is the expected path for un-rendered images, and letting readFileSync
  // throw for that would mean try/catch as control flow on every cold card.
  if (existsSync(absolute)) {
    try {
      uri = `data:image/jpeg;base64,${readFileSync(absolute).toString('base64')}`;
    } catch {
      uri = null;
    }
  }
  dataUriCache.set(relPath, uri);
  return uri;
}

/**
 * Returns the photo an OG card paints behind its headline: the 16:9 rendition from `og-assets/` as
 * a data URI, else the source file from there, else the absolute URL.
 *
 * @param imagePath  Site-relative source image (`/media/…`), or null when the card has no
 *                   photo — e.g. what `getParkBackgroundImage` returns.
 * @param baseUrl    Absolute site origin, used only for the fallback URL.
 * @returns          A `data:` URI, an absolute URL, or null when there is no photo at all.
 */
export function ogBackgroundSrc(imagePath: string | null, baseUrl: string): string | null {
  if (!imagePath) return null;
  // Already absolute (an externally hosted cover): nothing local to read, hand it back untouched
  // rather than gluing the origin in front of it.
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  const onDisk = withoutVersion(imagePath);
  return (
    // Both attempts matter: a park background is named `/media/x/background.jpg` and needs the
    // suffix added, while a blog cover often points straight at `…-16x9.jpg` in its frontmatter,
    // where adding it again would miss.
    readAsDataUri(toCropPath(onDisk)) ??
    readAsDataUri(onDisk) ??
    // The fallback keeps the version token: that one IS fetched over HTTP.
    `${baseUrl}${imagePath}`
  );
}
