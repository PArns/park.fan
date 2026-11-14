/**
 * Which park a photo is filed under, and which park a lookup asks for: the park's geo path
 * (`europe/france/paris/disneyland-park`), never its slug alone, because two parks in the catalog
 * share a slug (`disneyland-park` in Paris and Anaheim). Plain JS and its own module because the
 * build (`scripts/generate-media-manifest.mjs`, the role audit), the runtime (`lib/media/index.ts`),
 * the browser's card map (`lib/media/card-images.ts`) and the app export
 * (`scripts/publish-media-r2.mjs`) must file and find a photo by the same key. It imports nothing,
 * so it is client-safe.
 */

/**
 * @param {Readonly<Record<string, string>>} table
 * @param {string} key
 * @returns {string | undefined}
 */
function own(table, key) {
  return Object.hasOwn(table, key) ? table[key] : undefined;
}

/**
 * The geo path `continent/country/city/slug` from anything that names a park: the API's `url`
 * (`/v1/parks/…`, a ride's included), a page path with or without a locale (`/de/parks/…`), or the
 * bare path. `null` when it holds no four-segment park path.
 *
 * @param {string | null | undefined} value
 * @returns {string | null}
 */
export function parkGeoPath(value) {
  if (typeof value !== 'string') return null;
  const parts = value.split(/[?#]/)[0].split('/').filter(Boolean);
  const at = parts.indexOf('parks');
  const path = at >= 0 ? parts.slice(at + 1, at + 5) : parts.length === 4 ? parts : [];
  return path.length === 4 ? path.join('/') : null;
}

/**
 * The key an image is filed under: its sidecar's `parkPath`, else the catalog's path for its slug,
 * else the bare slug when the committed table does not know it (an image added in an offline
 * build). `null` for an image of no park.
 *
 * @param {{ park?: string | null; parkPath?: string | null }} image
 * @param {Readonly<Record<string, string>>} pathBySlug `MEDIA_PARK_PATH_BY_SLUG`
 * @returns {string | null}
 */
export function imageParkKey(image, pathBySlug) {
  if (!image.park) return null;
  return image.parkPath ?? own(pathBySlug, image.park) ?? image.park;
}

/**
 * The keys a lookup tries, in order. A path the caller passes wins over the catalog's path for the
 * slug, which is the first park of that slug and so Paris for `disneyland-park`. A slug the table
 * does not know adds itself, for the images {@link imageParkKey} filed under the bare slug.
 *
 * @param {import('./types').ParkLookup | null | undefined} park
 * @param {Readonly<Record<string, string>>} pathBySlug `MEDIA_PARK_PATH_BY_SLUG`
 * @returns {string[]}
 */
export function parkLookupKeys(park, pathBySlug) {
  if (!park) return [];
  const slug = typeof park === 'string' ? park : park.slug;
  const known = slug ? own(pathBySlug, slug) : undefined;
  const path = (typeof park === 'string' ? null : parkGeoPath(park.url)) ?? known;
  const keys = path ? [path] : [];
  if (slug && !known && slug !== path) keys.push(slug);
  return keys;
}
