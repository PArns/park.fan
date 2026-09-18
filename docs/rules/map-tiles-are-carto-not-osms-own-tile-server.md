# Map tiles are CARTO, never OSM's own tile server (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the
rule in one line and links here for the reasoning and the incident.

`tile.openstreetmap.org` is the tile server the OSM Foundation runs for its own site and for
renderer testing, not for embedding in a third-party production app — the
[Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) says so in as many words.
On 2026-09-18 OSM's edge enforced it: every tile on every park page and every blog `map-widget`
came back `403 Access blocked … App is not following the tile usage policy`, for every visitor,
everywhere — a hard block, not a rate limit that eases off once traffic drops. `components/parks/park-map.tsx`
had pointed its `TileLayer` straight at `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`, and
`BlogMapClient` mounts that same component, so the block took the blog widget down with it.

The admin catalogue map (`app/admin/parks/_components/parks-map.tsx`) never had this problem — it
already drew from CARTO's free basemap CDN — so the fix matched the pattern that already existed
rather than inventing a third one: both `TileLayer`s now credit OpenStreetMap (the data) **and**
CARTO (the tiles) — `&copy; OpenStreetMap contributors &copy; CARTO` — because dropping CARTO's half
of the attribution is the same policy mistake with a different host.

Both `TileLayer`s no longer point at CARTO directly, though. `cartoTileUrl()`
(`lib/utils/carto-tile-url.ts`) returns a same-origin path — `/api/tiles/<style>/{z}/{x}/{y}.png` —
proxied by `app/api/tiles/[...path]/route.ts`, which fetches the tile from
`basemaps.cartocdn.com/<style>/{z}/{x}/{y}.png` (with `?key=…` when `CARTO_MAP_KEY` is set) and
answers with a 7-day `Cache-Control`/`CDN-Cache-Control`. park.fan's zone already has a Cloudflare
rule caching any `/api/*` GET by its `Cache-Control` header (see
[caching-strategy.md](../architecture/caching-strategy.md)), so this is the same idiom every other
cacheable `/api/parks/…` route already uses (`cdnCacheHeaders()`), not a new mechanism: it puts
Cloudflare's edge, not each visitor's browser, between park.fan and CARTO. Two things follow from
routing it through our own origin instead of hotlinking CARTO's CDN from the browser:

- **`CARTO_MAP_KEY` is server-only**, never `NEXT_PUBLIC_`— the browser only ever talks to
  `park.fan/api/tiles/…`, so the key never has to leave our server.
- The proxy allow-lists the style path (`ALLOWED_STYLES` in the route handler) and validates
  `z`/`x`/`y` as digits before they reach the upstream URL — this is a public route on our own
  domain now, so it must not become an open proxy for arbitrary CARTO paths.

CARTO's free tier still has its own fair-use ceiling; the key raises it, it doesn't remove it. If
park.fan's map traffic ever outgrows the keyed tier too — Cloudflare's edge cache absorbing most
repeat requests for the same park's tiles should push that a long way out — the next step is a
different paid tile provider, never a return to `tile.openstreetmap.org`.
