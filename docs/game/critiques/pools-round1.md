# pools — critic round 1

**Score: 7.6 · Verdict: FAIL** (pass is ≥ 8.5; every hard gate is clear, the weighted total is not)

Graded at commit `b4f47ff`, against a **production build** (`pnpm start`, localhost:3000), harness
`medium` preset, WebGL2 through SwiftShader, 1280 × 720.

---

## 1. The six axes

| #   | Axis                       | Weight |     Score | One sentence                                                                                                                                                                          |
| --- | -------------------------- | -----: | --------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The frame                  |   30 % |       6.8 | Two genuinely good pictures at 1:1 and a full kit of deck, coping, waterline and furniture — but the water never reflects anything, its depth cue **inverts** at night, and the floor's dominant pattern is a coarse uniform net that at 5.5× reads as crazy paving. |
| 2   | Fidelity to the real thing |   20 % |       6.5 | The dimensions are researched and the beach-shelf and overflow-channel details are things somebody who has been to a public bath knows; the caustics, the niche lamps, the whirlpool and the empty deck are not. |
| 3   | Extensibility              |   20 % |       8.5 | A basin, a tile style, an edge treatment and a deck item are each one JSON entry through one parser, verified by running it — minus the deck/coping surface parameters, which are hard-coded ternaries. |
| 4   | Budget and behaviour       |   15 % |       8.2 | 31 draw calls and 43 k triangles for eleven basins (2.6 % of the 1,200 budget), 13 and 12 k for the demo park's three — paid for with **74 % of the showcase scene's textures**. |
| 5   | Determinism and state      |   10 % |       9.2 | No `Math.random`, no `Date.now`, hashed furniture placement, sorted-and-rounded serialisation, idempotent excavation; the only gap is that the integrations have never run at non-zero load. |
| 6   | Honesty of the report      |    5 % |       7.6 | §5 named most of what I found before I found it and every number I re-measured matched — but three claims about its own frames are contradicted by those frames, and the build-bar diagnosis is wrong on both halves. |

**Weighted: 2.04 + 1.30 + 1.70 + 1.23 + 0.92 + 0.38 = 7.57 → 7.6**

Extensibility is 8.5, well clear of the 5.0 floor, so the axis-3 gate does not fire.

---

## 2. Hard gates

| Gate                                    | Result                                                                                                                          | Command                                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Zero console errors / hydration warnings | **PASS** — `errors: []`, `hydration: []` in **both** runs                                                                        | `.game-render/critic-pools/report.json`, `.game-render/critic-pools-park/report.json`                       |
| Warnings attributable to this module     | **PASS** — the two `WebGL: INVALID_VALUE: bufferSubData: buffer overflow` and the CSS-preload warning appear **byte-identical** in a `--showcase=terrain` control that loads no pools | `.game-render/critic-control-terrain/report.json`                                                           |
| `Registry.name` errors gone              | **PASS** — the two intermittent page errors did not appear in any of my three runs, and `test-game-registry.mjs:28` now asserts `Registry.name === 'Registry'` | `pnpm test:game`                                                                                            |
| Extensibility ≥ 5                        | **PASS** — 8.5                                                                                                                  | §4 below                                                                                                    |
| Touched only its own folder              | **PASS** — working tree clean at `b4f47ff`; `demo-park/build.ts:290-334` and `plan.ts:187` are the integrator's, and say so       | `git status --porcelain` (empty)                                                                            |
| No `from '@babylonjs/core'` barrel       | **PASS** — 0 hits                                                                                                               | `grep -rn "from '@babylonjs/core'" lib/game/pools/`                                                         |
| No module-scope `window`/`document`/`navigator` | **PASS** — 0 hits                                                                                                        | `grep -rn "window\.\|document\.\|navigator\." lib/game/pools/*.ts`                                           |
| No `Math.random` / `Date.now` / enums / parameter properties | **PASS** — 0 hits (one comment mentioning the word "enum")                                                  | `grep -rn "Math.random\|Date.now" lib/game/pools/*.ts`                                                       |
| `pnpm test:game` green                   | **PASS** — but see finding 8: **it does not run this module's selftest**                                                          | `pnpm test:game` → exit 0                                                                                   |
| `npx tsc --noEmit` clean                 | **PASS** — exit 0                                                                                                               | `npx tsc --noEmit`                                                                                          |
| `npx eslint lib/game/pools` clean        | **PASS** — exit 0                                                                                                               | `npx eslint lib/game/pools`                                                                                 |
| Budget met                               | **PASS** — 31 draw calls showcase, 13 demo park, against 1,200 whole-game                                                         | scene probe, §5                                                                                             |

**No gate fails. The module fails on the weighted total alone.**

---

## 3. The frames I looked at

Runs, exactly as commissioned:

```
node scripts/game-shot.mjs --showcase=pools --cam=overview,close,ground --tod=09:00,18:30,23:00 --out=.game-render/critic-pools
node scripts/game-shot.mjs --cam=pool,overview --tod=13:00,22:00 --step=2400 --out=.game-render/critic-pools-park
node scripts/game-shot.mjs --showcase=terrain --cam=overview --tod=13:00 --out=.game-render/critic-control-terrain   # control
```

### Showcase (`.game-render/critic-pools/`)

| File               | What is actually in it                                                                                                                                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `0900-close.png`   | The lagoon from ~12 m: a pale cyan zero-entry shelf grading to navy at the deep end, a grey slab deck ring with loungers, a towel box, a red lifebuoy post and handrails, the timber-decked plunge pool behind at left, the lap pool as a smudge at the horizon. The best daylight frame the module has — and there is not one pixel of sky reflected in the water. |
| `1830-close.png`   | The same, but 18:30 is already night here: the grass is black-green, the deck is a grey chequerboard and the basin glows cyan with the caustic net already dominant. Effectively a second night frame, not a dusk one.                                                                     |
| `2300-close.png`   | The lagoon as a bright cyan shape with a very legible caustic web, the plunge pool glowing behind it, the deck dark blue-grey. Arresting at 1:1; at 2.6× the net is identical over 0.3 m and 2 m of water and every lounger 1.5 m from it is a black silhouette.                          |
| `0900-ground.png`  | The lap pool at eye height from the deck: lane lines on the floor (not the wall), a blue mosaic waterline band, planters at the far corners, a lounger at left, grey stone paving with a beige skirt at the grass line. Water pale and completely matte.                                  |
| `1830-ground.png`  | The same under an orange-to-blue dusk gradient, six niche lamps as pinpricks along the far wall, the deck reading as a two-tone chessboard. The prettiest sky in the set and the pool is the least interesting thing in it.                                                                |
| `2300-ground.png`  | The claimed best frame. The near **wall** carries the brightest, highest-contrast caustic in the picture; the floor beyond it is flatter and dimmer; the lamps are dots with no cone; the deck below is uniformly dark. It shows the underwater lighting *not* doing its job.             |
| `0900-overview.png`| Eleven basins scattered as blue dots over ~200 m of empty green field, about a tenth of the frame. You can tell they are pools and nothing else. Reads as unplanned rather than as a lido.                                                                                                |
| `1830-overview.png`| The same field almost black under a mauve sky, the basins faint blue smudges. The weakest frame in the set.                                                                                                                                                                               |
| `2300-overview.png`| Eleven glowing basins at 400 m, and the one frame that proves the lamp colour is content: the terrace pool amber, the whirlpool orange, the rest cyan — all from their own tile styles' `night` hex, all readable.                                                                        |

### Demo park (`.game-render/critic-pools-park/`)

| File                | What is actually in it                                                                                                                                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `1300-pool.png`     | The `pool` preset frames all three basins on the pad — lagoon, kids' pool, whirlpool on its timber disc — with 1,471 guests in the park and **not one of them within 30 m of the water**. Trees and shrubs are growing out of the pool deck and overhanging the water.       |
| `1300-overview.png` | The whole park at 400 m; the three basins are a pale patch at the right edge, indistinguishable from the terrain lake beside them. Neutral.                                                                                                                                 |
| `2200-pool.png`     | Genuinely the module's best demo-park frame: two cyan basins and one warm amber whirlpool as the only light in that corner of the park, with a tree silhouette blocking the right third of the lagoon.                                                                     |
| `2200-overview.png` | The park at night; the pools read as small cyan glows with one warm dot, holding their own against the ride lights at 400 m.                                                                                                                                                |

I also cropped and re-read five regions at 3–5.5× (lagoon rim, lap-pool wall day and night, kids' pool, deck/tree overlap) — those are what §4 is measured from.

---

## 4. Numbers, all from files the harness or a scene probe wrote

### Frame metrics — `.game-render/critic-pools/report.json`

| tod   | cam      | draw calls | triangles | active meshes | sim ms | fps  |
| ----- | -------- | ---------: | --------: | ------------: | -----: | ---: |
| 09:00 | overview |        117 |   109,036 |            99 |   0.00 | 1.15 |
| 09:00 | close    |         73 |   117,376 |            55 |   0.00 | 1.25 |
| 09:00 | ground   |         50 |    97,822 |            32 |   0.00 | 1.20 |
| 18:30 | overview |        106 |    70,542 |           100 |   0.00 | 1.05 |
| 23:00 | close    |         60 |    80,676 |            54 |   0.10 | 0.70 |
| 23:00 | ground   |         37 |    61,122 |            31 |   0.00 | 0.70 |

Boot 7,356 ms, against **6,004 ms** for the `--showcase=terrain` control on the same box — so 51
generated textures cost **+1.35 s**, not the 16.4 s vs 8.5 s the report worried about. Its own
figure was contended and pessimistic by 12×.

### Demo park — `.game-render/critic-pools-park/report.json`

Boot 14,390 ms. 13:00 `pool`: **485 draw calls, 1,056,774 triangles**, 1,471 guests. 22:00 `pool`:
178 / 442,516 / 219 guests. Zero errors, zero hydration warnings.

### This module's share — scene probe of `window.__parkfan_game.scene()`, meshes named `pool-*`

| Scene                     | meshes | **drawn** | triangles | vertices | materials | textures |   MB (RGBA, pre-mip) | lights |
| ------------------------- | -----: | --------: | --------: | -------: | --------: | -------: | -------------------: | -----: |
| `showcase=pools` (11 basins) |     40 |    **31** |  **43,096** |   31,507 |        32 |   **51** |            **10.95** |      2 |
| demo park (3 basins)      |     22 |    **13** |  **12,418** |    9,025 |        14 |       21 |                 4.12 |      2 |

Every figure the report gave is confirmed to the digit — 43,096 triangles, 31,507 vertices, 51
textures, ~11 MB — except the draw count, which is **31 not 32** (it counted the disabled
`pool-splash` template). Texture sizes: 21 × 288², 15 × 202², 12 × 173², 2 × 256², 1 × 160².

**Share.** Showcase: 31 of 117 frame draw calls, **2.6 % of the 1,200 whole-game budget** for eleven
basins in six tile styles. Demo park: 13 of 485 draw calls (**2.7 %**) and 12,418 of 1,056,774
triangles (**1.2 %**) for three basins. The report predicted "about eight" draw calls for three
basins; it is 13, 60 % over its own estimate. The budget is comfortably met either way.

### Sim and soak

`simTickMs` is 0.00 in twelve of the thirteen shots and 0.10 in the thirteenth. `.game-render/soak.json`:
48 park-hours, 576 ticks, **mean 1.568 ms/tick against a 6 ms budget for all modules**, max 48.331,
1,550 entities, `roundTrip: "ok"`, `failedModules: []`, `runtimeErrors: 0`, `nonFinite` clean.

### Selftest

```
node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/pools/selftest.mjs
→ 80/80 checks passed, 1.514 s
   20,504 triangles checked, 0 degenerate, 0 reversed
   310 interior samples, worst clearance 0.90 m
   lagoon water 353 m² of a 400 m² plan (12 % dry shelf)
   volume 370 m³ where the naive half-box says 340 (8.0 % out)
   4 pools · 1,033 m³ · 37 m³/h · 258 bathers
```

Every one of those matches the report exactly.

### The four bugs the module says it fixed — verified in the frames

1. **Back-facing deck** (§4.1). Fixed. Paving is present in all nine showcase frames and both `pool`
   frames; `selftest` walks 20,504 triangles and finds 0 reversed.
2. **Zero-entry beach under water** (§4.3). Fixed, but only just: the pale shelf is visible in
   `0900-close.png` and the selftest measures 12 % dry — and at 23:00 that shelf is the *darkest*
   part of the basin because dry tile carries no caustic, so the module's own headline feature is
   invisible in half its frames.
3. **Lane lines up the wall** (§4.4a). Fixed. `0900-ground.png` at 3× shows lane lines running along
   the **floor** and a mosaic waterline band on the wall, with no periodic dark verticals anywhere.
4. **White hole from the pooled light** (§4.4b). Fixed. No blown highlight at 23:00 in either
   `close` or `ground`, and no specular streak on the grass in front of the lap pool.

### The extensibility path, named with file and line

Verified by **running it**, not by reading it.

- Registration: `manifest.ts:465 registerPools(packId, input)` and `manifest.ts:556
  attachPoolContent(registry)`, which claims the category (`:558`), loads `BUILTIN` (`:564`) —
  itself manifest JSON at `manifest.ts:174` — walks `registry.packs()` (`:570`) **and** subscribes
  with `onPack` (`:571`). Called from `main.ts:167`, `sim.ts:74` and `demo-park/build.ts:137`.
- **Basin plan** → `geom.ts:117 switch (shape.outline)` (`rect`/`ellipse`/`stadium`/`lobed`/`polygon`),
  resampled at `geom.ts:157`.
- **Depth profile** → `geom.ts:313 switch (depth.profile)` (`flat`/`slope`/`dish`/`beach`/`channel`).
- **Tile style** → `textures.ts:85 switch (r.pattern)` for the maps, plus `materials.ts:205`, which
  gives the wall its own material only when the pattern is `lanes` and shares the mesh otherwise.
- **Edge treatment** → `build.ts:256` and `:262-269` on `edge.coping`, `build.ts:324-326` on
  `edge.deck`, `build.ts:154` for the deck fall.
- **Deck furniture** → `furniture.ts:36 switch (prop.shape)`.
- **No id switch anywhere**: `grep -rn "'lagoon'\|'kids-pool'\|'whirlpool'\|shape.id ===\|tile.id ===\|edge.id ==="`
  outside `manifest.ts`/`showcase.ts` returns nothing.
- **Per-entry parse failure** proven in the selftest run: `pack "pools-selftest-late": pool shape
  "broken" could not be read and was skipped — outline: Invalid option…`, with the good entry beside
  it surviving.
- **The star-shape warning fires.** I registered a chevron polygon and a square through
  `registerPools` and got exactly one line, naming the right one:
  `[game/pools] pool shape "probe:horseshoe" is not star-shaped about its centre; the basin will be
  drawn from its convex sweep.` The square was silent. `manifest.ts:535`.

---

## 5. Findings, ranked

### 1. The caustic net is the dominant read on every pool floor and it is not light — it is a coarse, uniform, depth-independent texture

This is the module's biggest single frame problem and it is bigger than its own §5.1 admits.

At 5.5× on `0900-close.png`, the pool floor is a field of rounded cells with pale webbing between
them, ~0.5–0.7 m across in world terms. The scale is **identical** under the 0.3 m shelf and under
the 2 m deep end, the brightness is identical, and there is no per-cell sharpening in the shallows.
Real caustics scale and sharpen with the depth of water above them; these do neither, so what the
eye reads is painted crazy paving. It is also the same frequency band as the `mosaic` chips
themselves, which is the fight §4.5 said it had already settled — it did not.

Worse at night: in `2300-ground.png` at 3× the **brightest, highest-contrast net in the frame is on
the vertical wall**, and the floor beyond it is dimmer and flatter. Refraction through a surface
casts caustics on the floor and only a weak elongated smear on a wall; this is the wrong way round.

The fix the report proposes (per-vertex attenuation from the niche positions, §5.1) addresses the
*falloff*, which is the second problem. The first is the **cell size and its dependence on depth**:
scroll the caustic UV at a scale derived from the vertex's own water depth (the vertex colour
already carries it — `water-mesh.ts:77 absorb`), and drop it on the wall material to a fraction.

### 2. The water reflects nothing, at any angle, at any time of day

In all nine showcase frames the surface shows the tile floor at every grazing angle, including the
far rim of the lagoon in `0900-close.png` where Fresnel should make the last two metres almost pure
sky. `water.ts:76-82` sets `roughness = 0.055`, `specularIntensity = 1.5`,
`useRadianceOverAlpha`/`useSpecularOverAlpha` — the setup is right, and the result on screen is a
sheet of tinted glass.

The one place a specular does appear — the demo park's lagoon at 13:00 — peaks at **rgb(238,239,239)**
and is a wide, soft, desaturated wash across a third of the basin with a hard edge, not a glint. A
pool photographed from a deck is at least half sky; this one is never any sky. The report's §5.3
frames this as "no refraction and no reflection probe" and defends skipping a `RefractionTexture`,
which is correct and is not the issue: **an IBL-only sky reflection at grazing angles costs nothing
and is missing.**

### 3. The night depth cue inverts — the deep end is brighter than the shallow one

Measured on the same two screen points, same camera, day and night (`.game-render/critic-pools/`):

| point                     | 09:00 luma | 23:00 luma |
| ------------------------- | ---------: | ---------: |
| shallow shelf (390 , 440) |  **147.4** |   **66.4** |
| deep zone (555 , 505)     |   **95.7** |   **87.5** |

By day the deep end is **35 % darker** than the shelf, which is right and is the module's best
daylight quality. By night it is **32 % brighter**, so the basin loses every trace of its slope and
reads as a flat lit plane — and the zero-entry beach that §4.3 was rebuilt to expose becomes the
darkest strip in the frame. Root cause is that the only night illumination is the floor's uniform
emissive, which the absorption alpha (`water-mesh.ts:83`, 0.08 → 0.52 with depth) then *hides more
of* in the shallows. The emissive needs the same depth ramp the albedo has.

### 4. A lit pool lights nothing around it

`2300-ground.png`, deck luma by distance from the coping, averaged over a 400 px band:

| deck row  | +0.2 m   | ~1 m     | ~2 m | ~3 m | grass beyond |
| --------- | -------- | -------- | ---- | ---- | ------------ |
| luma      | **42.6** | **33.8** | 34.7 | 36.6 | 21.2         |

The water beside it is 113.4. So the brightest object for 400 m raises the paving in front of it by
9 luma over 0.5 m and then the deck gets *brighter with distance* (33.8 → 36.6, the same trend the
09:00 control shows at 142 → 152, i.e. it is perspective, not light). The loungers 1.5 m from the
lagoon in `2300-close.png` are unlit black silhouettes.

Two causes, both in `main.ts`. `LIGHT_POOL` (`main.ts:99`) is `{low: 0, medium: 2, high: 3, ultra: 4}`
and the probe confirms **2 real lights at `medium`** — so 9 of the showcase's 11 basins and 1 of the
demo park's 3 are emissive-only, and which two are lit is re-sorted by camera distance every 0.6 s
(`main.ts:531-556`). And `LUMEN_SCALE = 2.2` (`main.ts:529`) times a manifest `nightIntensity` of 5–8
gives 11–17.6 at `range = 13` (`main.ts:503`), which is an order of magnitude under what a PBR deck
at roughness 0.6–0.82 needs to show it.

The report says of this exact frame that "the deck around both carries the spill" and that it is
"the one frame that shows the underwater lighting doing its job". The numbers above say otherwise,
and that is a finding about the report as much as about the light.

### 5. Nothing swims, and this module owes `guests` one function before it can

`capacity`, `enter`, `leave` and `swimmers` are on `PoolsSimApi`, covered by the selftest (258
bathers over four pools) and called by nobody. In `1300-pool.png` the park holds **1,471 guests** and
the three basins have **zero**, on their decks or in the water.

It is not this module's fault that `guests` has no swimming behaviour. What *is* this module's is
that `requests/pools.md` §7 names `entryPoint(id): {x, z}` as "four lines when somebody needs it"
and then does not write them — so the module that would consume this cannot start, because it has
no place to walk a guest to. Four lines is not a reason to defer; it is a reason to ship it and let
the dependency land.

What it costs on fidelity: a lido is a place people are in. Every reference photograph of the thing
this module is modelling has bodies in the water and towels on the loungers, and the module has
built the loungers and the towel box for nobody. That is most of why axis 2 sits at 6.5 rather than 8.

### 6. The demo-park placement puts trees in the pool — a finding against the integrator, and a missing query on this module

`1300-pool.png` at 4× shows shrubs and tree canopy rendered **on the deck slabs and over the water**
of both the lagoon and the kids' pool, with the deck visible through the gaps between leaves. At
22:00 a canopy silhouette blocks the right third of the lagoon. It reads as an abandoned lido.

Both halves are real and neither is the pools builder's:

- `demo-park/plan.ts:187` reserves the `water-park` pad and `build.ts:307-333` places the three
  basins on it, correctly — the integrator's own note at `build.ts:130-136` records moving all three
  after the module measured its requested layout hanging 7 m past the east edge, and the frames
  confirm nothing hangs off. The placement is right; nothing **enforces** the reservation.
- `scenery/main.ts:378` scatters the ambient woodland with `excluded: (x, z, r) => nearPlacedProp(x, z, r)`,
  which knows about scenery's own prop grid and nothing else — not `PADS`, not the pool decks.

Where this module owes something: `poolAt(x, z)` and `depthAt(x, z)` are deliberately about the
**water** and there is no footprint query, so even a scatterer that asked could not avoid the deck.
A `footprintAt(x, z)` (or `plots`-aware exclusion in `scenery`) is the fix, and it is the same four
lines as finding 5.

### 7. Eleven megabytes and 74 % of the scene's textures, at a texel density below the art bible

51 of the showcase scene's **69** textures are this module's, and 21 of the demo park's **127** for
2.7 % of its draw calls. 10.95 MB RGBA before mipmaps, ≈ 14.6 MB with. Three maps per surface
recipe, one recipe per tile style, per coping, per deck surface, never shared, generated on the main
thread at boot.

The opinion the module asked for: **the cost is in the count, not the resolution, and the resolution
is simultaneously too low.** A 288² map at `tileMetres: 0.9` is 320 px/m, under the art bible's
512 px/m for "things a camera can touch", and a pool deck under the `ground` camera is exactly that —
which is why the deck slabs in `0900-ground.png` have joints but no aggregate, no grain and no wear.
The sizes are also all non-power-of-two (288, 202, 173, 160), three distinct odd allocations for no
stated reason. The `colors` array in `tileSchema` already implies the right trade: one larger ORM +
normal per **pattern**, tinted per style, which would take 51 maps to roughly 15 and let each be
512² instead of 288².

### 8. The deck texture repeats every 2.4 m with eight slabs in it, and the repeat is visible in every frame past 5 m

`textures.ts:558` fixes the deck's `tileMetres` at 2.4 (3 for sand) and `textures.ts:137-139` gives
`stone`/`slate` `unit = 0.6` with `cols = tile / (unit × 2)` — so one repeat holds **4 rows × 2
columns = 8 distinct slabs**, tiling every 2.4 m in both axes with no per-instance offset. In
`1300-pool.png` and `p2` at 3.6× the deck around the lagoon reads as a two-tone chessboard, which is
the module's loudest programmer-art tell.

This is also the extensibility deduction. `tileSchema` (`manifest.ts:72-95`) makes `tileMetres`,
`roughness` and `relief` content; `edgeSchema` (`manifest.ts:88-100`) has none of the three, so those
values are hard-coded ternaries at `textures.ts:558`, `:563`, `:564` for the deck and literals at
`:533`, `:538`, `:539` for the coping. A pack cannot author a rough sawn-timber deck, a polished
granite terrace, or a smaller slab — and cannot fix the visible repeat. **−1 on axis 3.**

### 9. There is no Pools tab in the build bar, and the recorded reason is wrong on both halves

The reading the module recorded — "`tools/palette.ts` derives everything from the registry's manifest
categories, and `pools` keeps its shapes in a module-local map and registers only the pack category,
never the items" — does not survive checking:

- `tools/palette.ts:34-40 PALETTE_CATEGORIES` is a **hard-coded literal** `['scenery','foliage','shops','rides','buildings']`,
  not a derivation from the registry. `pools` is absent from it, and adding it would not work either:
  `palette.ts:149` reads `pack[category]` and iterates it as `AnyDef[]`, while `pack.pools` is
  `{shapes, tiles, edges, deck}` — an object of four arrays.
- `core/registry.ts:8-21 ItemCategory` is a **closed union** with no `pools` in it, so this module
  could not register its shapes as registry items even if it wanted to. `registerPackCategory`
  (`registry.ts:184`) is the only mechanism available to a module-owned category, and `pools` uses it
  correctly at `manifest.ts:558`.

So the gap belongs to `tools` and to core's item model, not to this module's catalogue — which is
why it costs only **−0.5** on axis 3 rather than the −1 the report's self-blame would justify. What
*is* this module's is that `requests/pools.md` never asks for it: §6 asks about i18n keys "when the
build bar does" render a name, as if the tab were somebody else's already-scheduled work. File the
request, and say which of the two shapes above you want (`pools.shapes` as its own palette category,
or a flattening adapter).

### 10. `pnpm test:game` does not run this module's 80 checks

`package.json:105` lists eleven module selftests and `test:game-pools` is not among them; there is no
such script (`grep -n '"test:game' package.json`). `requests/pools.md` §1 asked for it and it has not
landed. The consequence is concrete: the winding convention, the excavation clearance, both halves of
the content path, the geometry determinism and the save round-trip are green because I ran them by
hand, and a green CI says nothing about any of them.

### 11. Smaller things, worth one line each

- **The whirlpool is the weakest built-in.** At 5× in `1300-pool.png` it is a flat brown timber disc
  with a puddle of dark grey-blue water in it — no steam, no jets, no bubbles, no interior read, for
  a basin the sim heats to 36 °C. `slate-dark` (`night: '#ffb877'`) saves it at 22:00 and nothing
  saves it at 13:00.
- **The mosaic waterline band renders as noise, not tile.** At 3× on `0900-ground.png` the band under
  the coping is high-contrast blue-and-white blobs with no grid; a mosaic waterline is a regular
  course of small square chips, and the pattern generator's `mosaic` branch (`textures.ts:87-110`)
  produces one — it is just not the thing being drawn at that scale.
- **Caustics on the dry wall are much more visible than §5.2 claims.** The report says "30–120 mm of
  wall on most edges"; at the `ground` camera in both `0900-ground.png` and `2300-ground.png` they
  cover the entire visible wall face, including the strip immediately under the coping.
- **No contact shadow or AO decal under any deck furniture** in any frame — the loungers, planters and
  lifebuoy posts sit on the deck without touching it. The art bible names this by name ("Every prop
  grounds"). The shadow casters *are* wired (`main.ts:406-410`) and `receiveShadows` is set
  (`main.ts:390`) — the demo park's deck visibly receives tree shadows — so this is the AO decal, not
  the CSM.
- **The showcase spreads eleven basins over 200 m to fill the `overview` preset** and the result is
  eleven dots in a field. §5.9 is honest about the preset; the answer is not to spread out but to
  build one dense complex, because a lido is one paved terrace with several basins in it, which is
  also §5.5's point about the per-basin deck ring.
- **18:30 is already night in this build**, so the nine showcase frames give the module two lighting
  states, not three. That is `environment`'s solar model, not this module's, but it means half the
  commissioned coverage is redundant.
- **Stale docstring.** `main.ts:95` says the lamp is held "at `waterY − 0.25`"; `main.ts:527` and the
  code at `main.ts:565` both say 0.55. One of them is a lie to the next reader.

---

## 6. What is genuinely good, and must not be removed to fix the above

- **The content system is the best I have graded on this branch.** The built-in catalogue is manifest
  JSON through the same parser a pack uses (`manifest.ts:174` → `:465`), per-entry parse failure
  isolates a bad entry instead of dropping a pack, `packs()` **and** `onPack` are both read, the
  category is claimed so a typo is a console line, and the non-star-shaped polygon warning fires by
  name — I checked all five by running them, not by reading them.
- **The winding fix is the right fix.** `SurfaceBuilder.tri` deriving its winding from the normals the
  builder already writes means a call site *cannot* get it wrong, and the selftest walks all 20,504
  triangles. That is a class of bug closed, not an instance.
- **The excavation.** A ramp measured against the deck rather than a hard pit, only-lowering and
  therefore idempotent, with 0.90 m worst clearance at 310 sample points and 0 samples moving on a
  second application. Nothing in any of my thirteen frames shows ground poking through tile or a
  trench around a deck.
- **The daylight depth tint** (147.4 → 95.7 luma) and the zero-entry shelf. Both are correct, both are
  legible, and the shelf is a detail most builders would not have known to get wrong.
- **The lamp colour is content and it reads at 400 m.** `2300-overview.png` and `2200-pool.png` are
  the proof: amber whirlpool, cyan lagoons, all from `tiles[].night`.
- **The budget discipline.** One mesh per material per look, the wall sharing the floor's mesh unless
  the pattern is `lanes`, eight pooled splash rings that allocate nothing after boot, 2.6 % of the
  whole-game draw budget for eleven basins, 0.00 ms of sim.
- **The report's §4.** Four bugs written up as post-mortems with the frame that revealed each. §4.1
  in particular — "the first render simply had no paving in it" — is the kind of thing reports omit,
  and the three claims I had to contradict in §5 above do not undo it.

---

## 7. What round 2 should do, in order

1. Make the caustics depend on depth (scale + strength from `water-mesh.ts:77 absorb`), and cut them
   on the wall material. **Finding 1.**
2. Give the surface a sky reflection at grazing angles. **Finding 2.**
3. Ramp the floor's night emissive with depth so the slope survives 23:00. **Finding 3.**
4. Raise `LUMEN_SCALE` / the light count until the coping and the first two metres of deck measurably
   brighten, and re-measure the five-row transect in §5.4. **Finding 4.**
5. Ship `entryPoint(id)` and `footprintAt(x, z)`. Eight lines, and they unblock `guests` and stop the
   next scatterer planting a tree in the water. **Findings 5 and 6.**
6. Move `tileMetres`, `roughness` and `relief` onto `edgeSchema` and raise the deck's repeat past
   2.4 m. **Findings 7 and 8.**
7. File the build-bar request properly, with the two shapes it could take. **Finding 9.**

**Verdict: FAIL, round 1, 7.6.** Nothing here is broken and nothing here is programmer art; the
module is a competent, well-engineered, genuinely extensible piece of work whose water does not yet
behave like water and whose pools nobody uses. Both are addressable inside the folder except the last
two, and none of it needs a rewrite.
