/**
 * CARTO basemap raster tile URL for a style (e.g. `rastertiles/voyager`, `dark_all`). With
 * `NEXT_PUBLIC_CARTO_MAP_KEY` set it uses CARTO's keyed endpoint, which raises the request ceiling;
 * without, the anonymous subdomain-sharded one.
 * See docs/rules/map-tiles-are-carto-not-osms-own-tile-server.md.
 */
export function cartoTileUrl(style: string): string {
  const key = process.env.NEXT_PUBLIC_CARTO_MAP_KEY;
  return key
    ? `https://basemaps.cartocdn.com/${style}/{z}/{x}/{y}.png?key=${key}`
    : `https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png`;
}
