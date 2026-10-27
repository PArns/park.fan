# Map tiles are CARTO, never OSM's own tile server (REQUIREMENT)

Every Leaflet `TileLayer` draws from CARTO's basemap CDN through `cartoTileUrl(style)`
(`lib/utils/carto-tile-url.ts`): the park map (`components/parks/park-map.tsx`, also mounted by the
blog's `map-widget`) uses `rastertiles/voyager`, the admin catalogue map
(`app/admin/parks/_components/parks-map.tsx`) `dark_all`. Every attribution string credits both
halves, `&copy; OpenStreetMap contributors &copy; CARTO`: dropping CARTO's is the same policy
mistake with another host.

- With `NEXT_PUBLIC_CARTO_MAP_KEY` set, `cartoTileUrl` uses CARTO's keyed single-host endpoint
  (`basemaps.cartocdn.com/<style>/{z}/{x}/{y}.png?key=…`), which raises CARTO's fair-use ceiling;
  unset (local dev), the anonymous subdomain-sharded one.
- If the map traffic ever outgrows the keyed tier, the next step is a different paid tile provider,
  never `tile.openstreetmap.org`.

## Why

`tile.openstreetmap.org` serves OSM's own site and renderer testing, not third-party production
apps ([Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)). On 2026-09-18 OSM
enforced it: every tile on every park page and every blog `map-widget` came back
`403 Access blocked … App is not following the tile usage policy`, for every visitor. A hard block,
not a rate limit that eases once traffic drops.
