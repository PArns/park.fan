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
 * Two things happen here:
 *
 *  1. **Read locally.** No network, no CDN miss, no DNS.
 *  2. **Prefer the 16:9 crop.** `scripts/generate-image-crops.mjs` already cuts a `-16x9` variant
 *     of every source image (~119 KB vs ~376 KB) and 16:9 is exactly the card's 1200×630 frame, so
 *     `objectFit: cover` has nothing to throw away.
 *
 * Requires the crops to be traced into the OG function bundle — see `outputFileTracingIncludes`
 * for `/api/og/[...path]` in next.config.ts — now a single glob over the 16:9 crops
 * under public/media, which covers the park, ride and blog-cover photos alike.
 *
 * Falls back to the absolute URL when a crop isn't on disk, so a source image that never got a
 * crop keeps rendering exactly as it does today rather than losing its photo.
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

  const absolute = join(process.cwd(), 'public', relPath.replace(/^\//, ''));
  let uri: string | null = null;
  // existsSync first: a miss is the expected path for un-cropped images, and letting readFileSync
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
    readAsDataUri(toCropPath(onDisk)) ??
    readAsDataUri(onDisk) ??
    // The fallback keeps the version token: that one IS fetched over HTTP.
    `${baseUrl}${imagePath}`
  );
}
