# Assets — sources, licences, provenance

**CC0 only. Vendored, never hotlinked. Every file has a row here before it has a byte on disk.**

`public/game/assets/**` is **gitignored**. `scripts/fetch-game-assets.mjs` is the only thing that
writes it: every entry pins a URL, an expected SHA-256 and a licence, and the script refuses a file
whose digest does not match. A missing asset folder is a supported state — every consumer falls
back to procedural geometry or a solid PBR material **and logs that it did**, so a flaky network is
a slightly plainer park, never a white screen.

Run: `pnpm fetch:game-assets` · verify: `pnpm fetch:game-assets --check`

---

## Allowed sources

| Source | What we take | Licence |
| --- | --- | --- |
| [Poly Haven](https://polyhaven.com) | HDRIs, PBR textures, models | CC0 1.0 |
| [ambientCG](https://ambientcg.com) | PBR material sets | CC0 1.0 |
| [Kenney](https://kenney.nl) | props, UI icons, SFX | CC0 1.0 |
| [Quaternius](https://quaternius.com) | stylized props, rigged characters | CC0 1.0 |
| [KayKit](https://kaylousberg.itch.io) | stylized props, rigged + animated characters | CC0 1.0 |
| [Game Assets Garden](https://gameassets.garden) | props | CC0 1.0 |
| [Texture Ninja](https://texture.ninja) | photo textures | CC0 1.0 |

## Forbidden

Mixamo (licence is not CC0), Sketchfab anything not explicitly CC0, and **anything extracted from a
shipped game** — most specifically any Frontier/Planet Coaster name, logo, texture, icon, UI
screenshot or mesh. No exceptions, no "just for testing".

## What is procedural and therefore has no row here

Track, rails, ties, spine, supports and footings · paths, kerbs, plazas, queue rails · pool shells,
tiles, edges, coping · water (shader) · terrain mesh and its splat blend · building kit walls,
roofs, windows · signage geometry · every gizmo. These are generated from the spline/heightfield and
cannot come from a kit — a kit asset can never match a spline.

## Pipeline

- glTF is served as **`.glb` with meshopt** (Draco where meshopt loses), textures as **KTX2**
  (UASTC for normals, ETC1S for albedo/roughness).
- HDRIs are converted to Babylon `.env` (prefiltered, RGBD) — one per time-of-day band.
- `Cache-Control: public, max-age=31536000, immutable` on `/game/assets/**` (content-hashed names).
- A texture is never larger than the preset that will draw it: the fetch script writes 2K, 1K and
  512 variants and the loader picks by `QualityPreset`.

## Ledger

| File | Source | Author | Licence | SHA-256 | Used by |
| --- | --- | --- | --- | --- | --- |
| _(populated by `pnpm fetch:game-assets` — the script writes this table back into this file so it cannot drift from what is on disk)_ | | | | | |

## Audio

Ambience beds, ride SFX and UI clicks come from Kenney's CC0 audio packs, transcoded to Ogg Vorbis
(~96 kbps mono for SFX, ~128 kbps stereo for beds). Music is the one slot that may end up
commissioned or generated; until it is, the music bus is **silent by default** and the HUD says so
rather than shipping a placeholder loop.
