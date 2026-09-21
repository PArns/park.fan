import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Resolve the park/ride photo an OG card paints behind its headline — as a data URI read off the
 * deployment's own filesystem, not as a URL Satori has to fetch.
 *
 * This is the same fix `lib/og/brand-mark.tsx` already applies to the two brand PNGs, applied to
 * the asset that dwarfs them. The card referenced the photo by absolute URL
 * (`https://park.fan/images/parks/<park>/background.jpg`), so every place-card render sent Satori
 * back out over the public internet — through Cloudflare, through Vercel's own CDN — to pull a
 * **376 KB** JPEG (Phantasialand; several parks are over 400 KB), decode it at full resolution and
 * re-encode it into a 1200×630 PNG.
 *
 * That round trip is most of what separated a place card from a photo-less one: a glossary card
 * renders in ~150 ms and 49 KB, while `/api/og` averaged 860 ms and 119 KB in production — a third
 * of the whole site's function time on 6 % of its requests. It also billed twice, once outbound to
 * fetch and once inbound to serve.
 *
 * ## The read is rooted at `og-assets/`, and that is the whole point
 *
 * A runtime `join(process.cwd(), <root>, <variable>)` is a path the function tracer cannot
 * resolve, and its answer to one is to bundle **the entire directory that path is rooted at**.
 * This used to read `join(process.cwd(), 'public', …)`, so the OG function carried all of
 * `/public` — the sources, the sidecars and all three crop ratios, 256 MB of photos for a card
 * that paints one — and the deploy failed at 290.96 MB against Vercel's 250 MB limit.
 *
 * `outputFileTracingIncludes` is not the lever: `next build --turbo` never calls
 * `collectBuildTraces`, the only place includes and excludes are applied, so under the build this
 * project ships every key in that map is inert (`outputFileTracingExcludes` was tried, and the
 * crops it named stayed in the trace). The lever is **where the read is rooted**. So the OG
 * function has its own asset directory, written by `scripts/generate-og-assets.mjs` in prebuild
 * and holding nothing but what these cards paint: one 1200×630 rendition per media photo, plus
 * the two brand PNGs. The sweep is then a feature — `og-assets/` **is** the list of what this
 * function carries, and it cannot grow past what somebody deliberately put in it.
 *
 * Two things still happen per render, and both predate that move:
 *
 *  1. **Read locally.** No network, no CDN miss, no DNS.
 *  2. **Prefer the 16:9 rendition.** The card frame IS 1200×630, so `objectFit: cover` has
 *     nothing to throw away.
 *
 * Falls back to the absolute URL when a rendition isn't on disk — a photo that never got one, or
 * any `next dev` run, which skips prebuild and therefore has no `og-assets/` at all. **That
 * fallback is best-effort and measured not to paint**: with `og-assets/` moved aside the park card
 * still renders, correctly, but with no photo behind it. The source is a *progressive* JPEG
 * (`/media/phantasialand/background.jpg`, 1024×768, 185 KB) and Satori quietly skips an image it
 * cannot decode. This predates the move — dev never had the `-16x9` crops either, since they are
 * git-ignored and cut in prebuild — so the fallback has always been "a card without its photo"
 * rather than "the photo over HTTP". It is left in place because a card without a photo beats a
 * failed render, not because it recovers the picture.
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
