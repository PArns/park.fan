/**
 * CARTO basemap raster tile URL for a given style (e.g. `rastertiles/voyager`,
 * `dark_all`). With `NEXT_PUBLIC_CARTO_MAP_KEY` set, uses CARTO's keyed
 * single-host endpoint (raises the request ceiling above the anonymous
 * fair-use tier); unset, falls back to the subdomain-sharded anonymous
 * endpoint both maps used before the key existed. See
 * docs/rules/map-tiles-are-carto-not-osms-own-tile-server.md.
 */
export function cartoTileUrl(style: string): string {
  const key = process.env.NEXT_PUBLIC_CARTO_MAP_KEY;
  return key
    ? `https://basemaps.cartocdn.com/${style}/{z}/{x}/{y}.png?key=${key}`
    : `https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png`;
}
