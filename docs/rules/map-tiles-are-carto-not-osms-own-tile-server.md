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
already draws from CARTO's free basemap CDN — so the fix is to match the pattern that already
exists, not invent a third one: both `TileLayer`s now point at
`{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png` (park page) or
`.../dark_all/...` (admin, unchanged), and **both** attribution strings must credit OpenStreetMap
(the data) and CARTO (the tiles) — `&copy; OpenStreetMap contributors &copy; CARTO` — because
dropping CARTO's half is the same policy mistake with a different host.

CARTO's free tier has its own fair-use ceiling; it is not a permanent license for unlimited
production traffic. If park.fan's map traffic ever grows enough to hit it, the next step is a paid
tile provider with an API key — never a return to `tile.openstreetmap.org`.
