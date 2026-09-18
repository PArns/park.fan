/**
 * Same-origin path for a CARTO basemap raster tile style (e.g.
 * `rastertiles/voyager`, `dark_all`), proxied through `/api/tiles/[...path]`
 * so Cloudflare's `/api/*` cache rule holds tiles at the edge instead of every
 * visitor's browser hitting CARTO directly, and so `CARTO_MAP_KEY` never has
 * to reach the browser at all. See
 * docs/rules/map-tiles-are-carto-not-osms-own-tile-server.md.
 */
export function cartoTileUrl(style: string): string {
  return `/api/tiles/${style}/{z}/{x}/{y}.png`;
}
