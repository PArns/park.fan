# scenery — critic, round 1

Module: `lib/game/scenery/` · showcase `/game?showcase=scenery` · also the content of the default
demo park · commit `5174035`.

Frames taken by me with `scripts/game-shot.mjs` into `.game-render/critic-scenery-0900/`,
`-1200/`, `-1830/`, `-2200/` (showcase) and `.game-render/critic-spark-0900/`, `-1200/`, `-1830/`,
`-2200/` (demo park), plus six 2.6–3× crops of my own into `.game-render/critic-scenery-lamp/`.
Every PNG named below was opened and looked at. Numbers come from those `report.json` files and
from three probes I wrote and left beside them: `.game-render/scen-probe.mjs` →
`scen-probe-park.json` (LOD census, per-key triangles, light census, `scenery.stats()` at six
camera×time combinations), `scen-probe2.mjs` → `scen-probe2.json` (material light slots, fountain
meshes, save round-trip) and `scen-probe3.mjs` → `scen-probe3.json` (lamp-pool tracking,
extensibility against a schema-valid pack, three dress/clear cycles).

**Weighted total: 7.10. FAIL** (pass is 8.5). No hard gate is failed and extensibility is clear of
the 5.0 floor. The near field of this module is the best-looking thing in the game — a LOD 0 tree
has bark, a branch armature and a canopy that reads as foliage, and the `ground` frames of both
scenes are photographs of a park. Everything past 34 m is a different, much worse module, and that
is 86.7–99.9 % of every frame.

## 1. Scores

| #   | Axis                  | Weight | Score | One sentence                                                                                                                                                                                                                   |
| --- | --------------------- | -----: | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | The frame             |   30 % |   6.8 | The near field is genuinely photographic and the `ground` frames carry both scenes, but 86.7 % of the trees at `ground` and 99.9 % at `overview` are a 14-triangle imposter that reads as a palm.                              |
| 2   | Fidelity              |   20 % |   6.5 | Bench, lamp, railing, trunk flare and boulder are researched and right; the clipped box hedge is a row of topiary balls, the fountain is dry in every frame, and the spruce imposter is a rectangle.                           |
| 3   | Extensibility         |   20 % |   7.0 | The five-step generator fallback is exemplary and a new species/prop by pack.json genuinely needs no code — but a pack registered after boot never reaches the module, and `themes`/`materials` are read by nothing.           |
| 4   | Budget and behaviour  |   15 % |   7.2 | 70 meshes for 15,578 objects is instancing doing its job at 5.8 % of the whole-game draw budget, but 62 % of the module's triangles at `ground` go to flowerbeds and hedges rather than to anything a player looks at.         |
| 5   | Determinism and state |   10 % |   9.5 | No `Math.random`, no wall clock, `dress()` repeatable to the instance, save → load → save byte-identical at 748,984 bytes, and the owned slot is written by the sim alone.                                                     |
| 6   | Honesty of the report |    5 % |   6.5 | Ten ranked weaknesses of which six I confirmed and whose showcase numbers match mine to the triangle — spoiled by filing the module's biggest problem as a cross-fade issue and by a claim about water the frames do not show. |

**6.8 × 0.30 + 6.5 × 0.20 + 7.0 × 0.20 + 7.2 × 0.15 + 9.5 × 0.10 + 6.5 × 0.05 = 7.10.**

## 2. Hard gates

| Gate                                            | Command                                                                                                    | Result                                                                                                                                                                                                         |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Console errors / hydration warnings             | `node scripts/game-shot.mjs [--showcase=scenery] --tod=… --cam=overview,close,ground --wait=6000` × 8 runs | **PASS** — `err=0 warn=0 hyd=0` in all six `report.json` that completed, 18 shots. Two runs aborted on the harness's own "promise was garbage collected" and wrote frames but no report; the frames are in §3. |
| Barrel import                                   | `grep -rn "from '@babylonjs/core'" lib/game/scenery/`                                                      | **PASS** — no hits                                                                                                                                                                                             |
| `window`/`document`/`navigator` at module scope | `grep -rn "window\.\|document\.\|navigator\." lib/game/scenery/*.ts`                                       | **PASS** — no hits anywhere, not just at module scope                                                                                                                                                          |
| Coupling                                        | `grep -rn "from '\.\./" lib/game/scenery/*.ts`                                                             | **PASS** — 9 imports, all into `core` (`types`, `world`, `registry`, `pack-schema`). Nothing reaches a sibling module's internals; `environment` and `terrain` are reached through `ctx.module<T>()`.          |
| `npx tsc --noEmit`                              | as written                                                                                                 | **PASS** — exit 0, clean                                                                                                                                                                                       |
| `npx eslint lib/game/scenery`                   | as written                                                                                                 | **PASS** — exit 0, no output                                                                                                                                                                                   |
| `npx prettier --check lib/game/scenery`         | as written                                                                                                 | **PASS** — "All matched files use Prettier code style!"                                                                                                                                                        |
| `pnpm test:game`                                | as written                                                                                                 | **PASS** — save round-trip, registry, lint, i18n, `test:game-track` (95 checks), soak (576 ticks, mean 0.09 ms) all green                                                                                      |
| Module selftest                                 | `node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/scenery/selftest.mjs` | **PASS** — `✓ scenery self-test: 20 checks passed`. Still not wired into `pnpm test:game` (the report's request 1 is real).                                                                                    |
| Extensibility ≥ 5                               | see §4.4                                                                                                   | **PASS** — 7.0                                                                                                                                                                                                 |
| Touched only its own folder                     | answered by the integrator; `git status --porcelain` clean at grading                                      | **PASS**                                                                                                                                                                                                       |

## 3. The frames I looked at

Eighteen harness frames across two scenes and four times of day; thirteen opened, plus six crops.

| File                                                  | What is actually in it                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `critic-scenery-0900/0900-ground.png`                 | Eye level under the entrance arch: two stone piers frame the shot, pennant bunting overhead, the avenue recedes to a vanishing point past an iron railing, a slatted bench on an iron frame, a Victorian lamp, a bin, grass tufts, flowers, boulders and a hedge run. A park. Piers read as rubble, not masonry. |
| `critic-scenery-0900/0900-close.png`                  | The fountain plaza from ~40 m: tiered fountain, six benches, four lamps, four planters, boulders, hedge, railing. The basin is dry. Trees beyond ~35 m are already bare poles with a thin spray.                                                                                                                 |
| `critic-scenery-0900/0900-overview.png`               | From 340 m the whole showcase is a speckle patch about 500 px wide in an empty green field. The layout does not read; the report's "path, plaza, three meadow patches, seven tree stands" is generous.                                                                                                           |
| `critic-scenery-1200/1200-ground.png`                 | Same avenue at noon. Flat light removes the shadow that carried 09:00, and the 25–60 m trees read as pale bare trunks with a scatter of leaf cards — a flooded cypress stand, not a lime avenue.                                                                                                                 |
| `critic-scenery-1200/1200-close.png`                  | Plaza at noon. Fountain dry, paving flat and textureless, mid-band trees are poles.                                                                                                                                                                                                                              |
| `critic-scenery-1830/1830-ground.png`                 | The report's claimed best frame, and it is good: lantern lenses light up and recede down the avenue against a graded dusk sky, silhouettes survive. The paving under the near lamp is not lit at all.                                                                                                            |
| `critic-scenery-1830/1830-close.png`                  | Six lamp heads glowing over the plaza. Not one pool of light on the paving; the square is a uniform blue-grey slab.                                                                                                                                                                                              |
| `critic-scenery-2200/2200-close.png`                  | Night plaza. Lamp heads are white blobs with bloom halos; two shrubs and a lamp post near the camera are lit warm, the paving is not.                                                                                                                                                                            |
| `critic-spark-0900/0900-ground.png`                   | **The best frame either scene produces.** Dappled tree shadow across a paved promenade, kerbs running to a vanishing point, lime avenue both sides, hedge runs, Victorian lamps, benches, terracotta plaza in the distance.                                                                                      |
| `critic-spark-0900/0900-overview.png`                 | **The frame that costs the module the round.** The whole demo park from 99 m: every tree a thin bare pole with a small dark tuft on top. 494 spruce instances in this frame and not one conical silhouette. It reads as savanna.                                                                                 |
| `critic-spark-1200/1200-close.png`                    | The fountain square at noon: fountain (dry), 8 benches, ~10 lamps, planters, hedge parterres that read as heaps of round bushes.                                                                                                                                                                                 |
| `critic-spark-1830/1830-close.png`                    | ~20 lamp heads glowing over uniformly dark blue paving. Zero pools.                                                                                                                                                                                                                                              |
| `critic-spark-1830/1830-overview.png`                 | Dusk over the whole park: pole-trees everywhere, and not one lamp visible at 340 m.                                                                                                                                                                                                                              |
| `critic-spark-2200/2200-ground.png`                   | Night promenade. The near lamp's lens is blown white with bloom, the bench beside it is lit warm gold, the hedge and grass around it are lit — and the paving two metres away is a flat cold slab. ~25 further lamp heads down the avenue light nothing.                                                         |
| `critic-spark-2200/2200-close.png`                    | ~20 lamp heads over a uniformly dark plaza; the near parterre bushes at the bottom are lit green, nothing else is.                                                                                                                                                                                               |
| `critic-spark-2200/2200-overview.png`                 | The park at night from 340 m: paths as faint ribbons, a starfield, and **one** warm smudge in the whole park where the two pooled lights sit. 72 lamps, one visible glow.                                                                                                                                        |
| `critic-scenery-lamp/crop-trees-overview.png` (3×)    | The imposter, magnified. A thin dark-red pole, bare for two-thirds of its height, with a flat disc of leaf cards on top. Several read unmistakably as palms. No cone anywhere.                                                                                                                                   |
| `critic-scenery-lamp/crop-lod0-tree.png` (2.6×)       | **LOD 0 and the imposter in one image.** Two foreground trees with tapered flared trunks, visible bark, a real branch armature and a dense layered canopy — and 30 m behind them, a row of bare canopy-less poles.                                                                                               |
| `critic-scenery-lamp/crop-trees-lod1.png` (3×)        | The 34–102 m band on the showcase: full-height trunks that have lost most of their canopy, standing among trees that still have one.                                                                                                                                                                             |
| `critic-scenery-lamp/crop-lamp-night.png` (3×)        | The 22:00 lamp at 3×: lens blown out, bench lit gold, hedge lit green, grass lit — paving unlit, no gradient, no falloff.                                                                                                                                                                                        |
| `critic-scenery-lamp/crop-fountain-park1200.png` (3×) | The fountain at noon at 3×: a stone rim ring, a column with two grey stone tiers, and paving inside the ring. No water.                                                                                                                                                                                          |
| `critic-scenery-lamp/crop-hedge.png` (2.6×)           | The "clipped box hedge" at 2.6×: rows of separate rounded blobs with hard mid-tone banding and a dark contact ellipse under each. Topiary balls, not a hedge.                                                                                                                                                    |

## 4. What I measured myself

### 4.1 The LOD imposter — confirmed, and the diagnosis in the other critique is wrong

Walked `scene.meshes` after a 6 s settle at each camera, keyed on the `l<N>v<M>` tag in
`scenery:<pack>:<key>:l<N>v<M>:<piece>`, took the max `thinInstanceCount` over the pieces of each
(key, LOD, variant) and summed over variants (`scen-probe-park.json`, demo park, 12:00):

| camera     | tree LOD 0 | LOD 1 | LOD 2 | LOD 2 share |
| ---------- | ---------: | ----: | ----: | ----------: |
| `overview` |      **0** |     1 | 1 289 |  **99.9 %** |
| `close`    |         12 |   148 | 1 184 |      88.1 % |
| `ground`   |         21 |   158 | 1 165 |      86.7 % |

At `overview`: `oak:l2` ×599, `spruce:l2` ×494, `linden:l2` ×196, `linden:l1` ×1, and **no LOD 0
tree instance at all**. The demo-park critic's 1 008/1/0 is the same finding with a lower count
(my totals include the woodland species the `dress()` scatter re-derives, which its census
missed); the conclusion is identical and the frame agrees —
`critic-spark-0900/0900-overview.png` and its 3× crop.

**Where I disagree with the other critique: the LOD 2 form is not species-blind.** `gen-foliage.ts`
branches on `ctx.lod === 2` separately per species — the broadleaf (line 310) builds a two-ring
trunk stub plus three crossed leaf cards and one horizontal one, the conifer (line 426) builds a
two-ring stub plus two tall `needle`-material cards. Different geometry, different material. What
they have in common is that **both reduce to axis-aligned rectangles**, and `addCard`
(`geometry.ts:439`) is a plain quad whose only shaping is the alpha mask — which for both leaf and
needle is a uniform scatter of 58/74 blobs across the whole UV square (`textures.ts:227`). So the
conifer's silhouette is a rectangle where a spruce's entire identity is a triangle, and the
broadleaf's crown sits at `h × 0.68` over a trunk drawn to `h × 0.40`, i.e. a disc of leaves on a
bare stick. That is a palm, and it is what the crop shows. **The fix is a tapered card and a crown
that starts at half height, not a species switch** — the switch is already there.

**What the break distance ought to be, costed.** The break is `spec.lod[0] × LOD_SCALE.medium`
= 40 × 0.85 = **34 m** (`batches.ts:208`, `main.ts:71`), then 102 m, then LOD 2 out to
`max(300, height × 55) × 0.85` = 654 m for an oak. Per-instance triangle cost, measured from the
same census: **LOD 0 ≈ 830, LOD 1 ≈ 218, LOD 2 = 12–17**.

- Moving the LOD 0 break out is affordable at `ground` and useless at `overview`. Promoting all 158
  LOD 1 trees at `ground` to LOD 0 (i.e. taking the break to 102 m) costs 158 × 612 = **+97 k
  triangles**, +8.7 % of that frame's 1,113,593. A more modest 34 → 70 m is roughly half of that.
- Promoting the 1 289 imposters at `overview` to LOD 1 costs 1 289 × 204 = **+263 k triangles**,
  nearly doubling that frame's 299,646. So at the camera where the problem is total, the break is
  the wrong lever.
- **Fixing the imposter's shape is the cheap lever and the right one.** It costs 12–17 triangles
  today. Taking it to 30 — a tapered three-card spire for the conifer, a crown starting at `0.5 h`
  with a shorter trunk for the broadleaf — costs 1 289 × 16 = **+20.6 k at `overview`, +6.9 % of
  the cheapest frame in the set**, and buys back the silhouette in every frame at once. The
  triangles are already in the budget: see §4.5.

### 4.2 The two-light night rig — both prior findings are true, and here is why

`scenery.stats()` in the demo park reports `lightSites: 74` and `activeLights: 2` at 22:00 at every
camera (`scen-probe-park.json`), against **72 `lamp-victorian` entities** in `world.entities`
(`scen-probe2.json`). `POOL_BY_PRESET.medium = 2` (`night-lights.ts:47`) and the harness runs
`medium`.

- The environment critic is right: both pooled lights run at **63.0** at 22:00 with `range 14`, and
  they are visibly lighting things — `critic-spark-2200/2200-ground.png` at 3× shows the bench
  beside the near lamp lit warm gold, the hedge behind it lit and the grass under it lit.
- The demo-park critic is right: no lamp anywhere in any of my six night/dusk frames puts a pool on
  **paving**. `critic-spark-1830/1830-close.png` has ~20 glowing heads over a uniform slab;
  `critic-spark-2200/2200-close.png` the same; `critic-spark-2200/2200-overview.png` shows one
  warm smudge for 72 lamps.

The two are not in conflict: **2 of 72 lamp sites hold a light**, and what those two reach is
scenery, not the path. Measured light-slot budget (`scen-probe2.json`, every material in the live
scene): `scenery-bark/leaf/needle/foliage-solid/paint/metal/wood/stone/fabric` are
`maxSimultaneousLights = 6`; `terrain-ground`, `terrain-water` and **all eight `path-*` materials
are 4**. The scene holds five lights at 22:00 (`sun`, `sky`, `env-moon-light`, two lamps) and the
lamps carry `renderPriority = -1`, so a 4-slot material can take at most one of them. The builder's
own weakness #2 names this and is correct; what its report does not say is that the visible result
is not "one lamp lights the path" but "no lamp lights any path in any frame I took".

One thing I checked and will **not** hold against the module: the pool does follow the camera. Cut
to `ground` and the two lights are still on lamps 157 m and 163 m away; cut again 7 s later and
they are on lamps 6.6 m and 11.0 m away; at `close` they are at 12.7 m and 18.6 m
(`scen-probe3.json`, `poolTracking`). The lag is the harness's own dt clamp — `batches.ts:362`
documents that SwiftShader runs the loop at ~1 fps with `dt` clamped to 0.1 s, so the rig's
`sinceSort > 0.5` gate takes five wall-clock seconds. `needsRefresh` has a camera-cut escape
(`REBUCKET_TELEPORT`) for exactly this and the night rig has none, which is worth a line of code,
but it is not a shipping bug at 60 fps.

### 4.3 Foliage LOD 0 — confirmed good

`critic-scenery-lamp/crop-lod0-tree.png`: tapered trunks with the documented bottom-twelfth flare
(`gen-foliage.ts:155`) and visible bark, a branch armature that curves out and up with secondary
branches, and a canopy dense enough to read as foliage rather than as cards at 8–20 m. The claim
that the fix is a break distance and not a model is **correct for LOD 0**. It is not correct for
LOD 2, which is a bad model at any distance (§4.1), and the same crop shows why: the good trees and
the bare poles are 30 m apart in one frame.

### 4.4 Extensibility, probed rather than read

**What works, and it is the axis's own named test.** No `switch` on a content id anywhere. Every
generator reads the entry's own `footprint`, `height`, `lod` and `night.light`. The five-step
resolution in `catalog.ts` (exact → family before the first dash → `furniture` → `category`/foliage
`kind` → a sized marker with `fallback: true` and one warning per key) is the best-argued
extensibility seam I have seen in this codebase, and I ran its 20-check selftest myself: all 21
shipped scenery and foliage entries across **two** packs resolve with no fallback, a synthetic
third pack's bench/lamp/birch resolve and keep their own numbers, and `lamp-art-deco → lamp` works.
Catalogue size in the live scene is 26 = 14 scenery + 7 foliage + 5 ambient, i.e. every entry of
both bundled packs is in it.

**`registerPackCategory` is correctly not used here, and I checked rather than assumed.**
`registry.unclaimedPackKeys()` returns `[]` in the running game (`scen-probe2.json`): all four of
this module's categories — `scenery`, `foliage`, `themes`, `materials` — are in `PACK_CORE_KEYS`
and in `ItemCategory`, so they are core's own and were never at risk of the silent strip that hit
`track`. That question is a clean pass and needs no change.

**Two real deductions.**

1. **A pack registered after boot never reaches the module.** Registering a schema-valid
   `critic-pack` on the live registry (`scen-probe3.json`) succeeds — `registry.items('foliage')`
   goes 7 → 9 — and the module's catalogue **stays at 26**, with `spec('critic-pack:birch')`,
   `:cypress`, `:lamp-art-deco` and `:bandstand` all returning `null` and nothing placed.
   `buildCatalog(ctx.registry)` runs exactly once, at `main.ts:143` and `sim.ts:75`, and
   `grep -rn "onPack" lib/game/scenery/` returns nothing though core publishes
   `registry.onPack(fn)` (`registry.ts:132`). The shipped path is saved only by ordering — every
   bundled pack is registered at `host.ts:98` before the modules boot — so editing `pack.json`
   works and `loadPackFromUrl` does not. Same shape as the `track` critique's finding, and here the
   fix is a listener in two files with no core change.
2. **Two of the four categories are consumed by nothing.** `grep -rn "registry\." lib/game/scenery/`
   finds `items('scenery')` and `items('foliage')` and no other call. The module never reads
   `themes` or `materials`, so "a new scenery **theme** is a manifest entry" is not true of this
   module in either direction: a theme entry changes nothing it draws, and `scenerySchema`'s own
   `theme` and `material` fields are ignored. Eleven procedural material sets are hard-wired in
   `materials.ts` and a pack cannot add or re-skin one.

A third thing is not a deduction but is worth recording: **neither graded scene draws a single
`neon-lagoon` entry.** `showcase.ts` places `core-classic:` keys only, and the census confirms
oak/linden/spruce/hedge/shrub/flowers/grass/rock and the nine core-classic props. So 8 of the 23
generators — `tree-palm`, `lamp-modern`, `sign-post`, `parasol`, `lounger`, `light-strip`,
`neon-palm`, `marker` — appear in no frame taken by me or, per its own screenshot section, by the
builder. `neon-palm`'s `cycle` mode, which the report ranks as weakness #8, has never been
photographed by anyone.

**7.0.**

### 4.5 Budget — the share is defensible, the allocation is upside down

Frame totals from `report.json`; the module's own column from `scenery.stats()` and the mesh census
(`scen-probe-park.json`). Demo park, 12:00:

| camera     | frame draws | frame tris | scenery meshes | scenery tris | scenery share of draws / tris |
| ---------- | ----------: | ---------: | -------------: | -----------: | ----------------------------: |
| `overview` |         145 |    299 646 |             27 |       79 490 |               18.6 % / 26.5 % |
| `close`    |         229 |  1 057 879 |             67 |      444 216 |               29.3 % / 42.0 % |
| `ground`   |         248 |  1 113 593 |             70 |      431 300 |               28.2 % / 38.7 % |

Against the 1,200 draw-call whole-game budget, this module's worst camera is **70 calls, 5.8 %**,
for the largest single content module in the game. The frame totals include four shadow cascades
and the sky dome, so the mesh column is the honest share, exactly as the report argues.

**The instancing is doing its job and there is no argument about it.** 1,578 placed props plus
14,000 ambient instances = 15,578 objects, drawn from at most 70 meshes; 5,983 visible thin
instances at `ground`, i.e. **85 instances per draw call**. Eighteen batches, one per placed
catalogue key. This is the right architecture and it is well executed.

**What is wrong is which triangles get spent.** Per-key triangles at `ground`:

| key              | instances | triangles | share of 431 300 | tris/instance |
| ---------------- | --------: | --------: | ---------------: | ------------: |
| `meadow-flowers` |       394 |   154 848 |       **35.9 %** |           393 |
| `hedge-box`      |       131 |    73 364 |           17.0 % |           560 |
| `meadow-grass`   |       957 |    39 792 |            9.2 % |            42 |
| `oak`            |       594 |    36 772 |            8.5 % |            62 |
| `lamp-victorian` |        72 |    28 800 |            6.7 % |           400 |
| `linden`         |       246 |    20 542 |            4.8 % |            84 |
| `spruce`         |       494 |    11 300 |            2.6 % |            23 |

Flowerbeds, hedges and grass tufts are **62 % of the module's triangles at `ground`**; all 1,344
trees together are 16 %. At `overview` it is worse: `hedge-box` alone is **29,184 of 79,490
(36.7 %)** for 76 one-metre hedges at 340 m — more than the 18,878 spent on 1,290 trees — because
its LOD 2 is a 384-triangle blob where a tree's is 12–17. `meadow-flowers` takes another 9,984 at
340 m for 26 clumps 0.4 m tall. The 20 k triangles §4.1 needs to give the imposter a silhouette
are sitting in the flowerbeds.

Three more measured items:

- **`AMBIENT_CAP` is already hit.** `stats().ambient` is exactly **14 000** in the demo park at
  every camera (`main.ts:73`), so the shipping scene's dressing is silently truncated today, not
  hypothetically at 512 m. The report ranks this ninth and does not say it is already happening.
- **Every non-foliage prop has exactly one LOD level** (`batches.ts:158`: `lods = isFoliage ? [0,1,2] : [0]`).
  The census confirms `lamp-victorian`, `bench-wood`, `planter-round` at `lods=[0]` only —
  72 lamps × 400 triangles drawn in full out to `max(300, 3.2 × 55) × 0.85` = 255 m.
- **885 ms of boot on the main thread**: `textureMs 438` + `buildMs 447`, reported live by the
  module and confirmed identical across three probes.
- **No leak.** Three `clearDressing()` + `dress()` cycles return to exactly 295 meshes / 32
  materials / 82 textures / 5 lights / 18 batches / 14 000 ambient / 444,216 triangles every time
  (`scen-probe3.json`).

**7.2.**

### 4.6 Determinism and state

- `grep -rn "Math.random\|Date.now\|performance.now\|new Date" lib/game/scenery/*.ts` → four hits,
  all `performance.now()` and all used only to report `buildMs`/`textureMs`.
- `dress({})` called twice in one session returns **13 864** both times (`scen-probe2.json`).
- `save()` → `load()` → `save()` is **byte-identical at 748,984 bytes**.
- The selftest's own property checks, which I ran: `evaluateScatter` gives 794 instances whether the
  field is asked for whole or in two halves, one seed repeats and a different seed does not, and no
  two scattered props are closer than the species clearance.
- Owned state is three fields (`world.modules.scenery`) written **only** by the sim, in response to
  the `scenery:dress` command; `main.ts:386` dispatches and never writes. `rebuild()` reads the
  saved slot back and re-derives the entity index from the world (`sim.ts:269`). One writer.
- Wind direction is derived from `env.day` and `env.minute` (`main.ts:539`) — the world clock, not
  the wall clock. It is invented rather than the weather's (the report says so), but it is
  deterministic.

**9.5.**

### 4.7 What the report gets wrong about itself

| Report says                                                                           | Measured                                                                                                                                                                           |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| weakness #4: the far LOD "holds at 120 m+ in the overview"                            | It takes over at **34 m** and carries 86.7 % of the trees at `ground`, 99.9 % at `overview`; and it does not hold — `0900-overview.png` is a palm grove with 494 spruces in it     |
| `0900-close.png` shows "a tiered stone fountain with **water discs at three levels**" | The `pond` mesh exists (72 tris, enabled, `albedoColor` 0.03/0.09/0.11, roughness 0.06) and the basin reads **dry** in all six frames I looked at, three times of day, both scenes |
| "The sky is black at 09:00 and 12:00 in every one of my shots"                        | Not in mine — the sky is blue and graded at every hour, in every one of 18 shots. Stale rather than untrue, but it is the stated premise of weakness #1                            |
| "Sixteen files in `lib/game/scenery/`"                                                | **18** (17 `.ts` + `selftest.mjs`)                                                                                                                                                 |
| "eleven shared materials over **eight** procedurally generated PBR sets"              | ", procedural textures **9** sets" three paragraphs later; the live scene holds 11 `scenery-*` materials plus 3 emissives                                                          |
| Numbers table (showcase 12:00)                                                        | **Matches.** 118/217/251 draw calls against my 120/217/251; 165 k/617 k/640 k triangles against my 169,180/616,778/640,352                                                         |

Against that: the weakness list is ten items long and ranked, and #2 (one pooled lamp reaches the
ground), #3 (cards from inside a canopy), #5, #7 (the arch piers read as rock), #8, #9 (the 14,000
cap) and #10 (invented wind) are all things I found in the frames or the numbers before reading it.
That is what keeps this axis at 6.5 rather than below. What pulls it down is that the module's
single biggest problem — the one that decides 30 % of the grade — is filed under "it pops when it
takes over" with a cross-fade proposed as the fix.

**6.5.**

## 5. What to fix, most valuable first

1. **Give the LOD 2 imposter a silhouette.** 99.9 % of the trees at `overview` and 86.7 % at
   `ground` are 12–17 triangles of axis-aligned quad, and the crop shows what that looks like: a
   palm. Taper the conifer's two cards into a spire and start the broadleaf's crown at `0.5 h`
   instead of `0.68 h` over a trunk drawn to `0.4 h`. Budget: 1 289 × 16 extra triangles =
   **+20.6 k at `overview`, +6.9 % of that frame** — and §4.5 shows 29 k sitting in 76 hedges at
   340 m to pay for it. This is the whole gap between 6.8 and something over 8 on axis 1.
2. **Move the LOD 0 break from 34 m to about 70 m.** Half the LOD 1 band at `ground` costs roughly
   **+55 k triangles, +5 % of a 1,113,593-triangle frame**. It is what makes `0900-ground` — the
   frame both scenes are carried by — hold past the first twenty metres, and `crop-lod0-tree.png`
   shows the cliff it fixes. Do it after (1), not instead of it.
3. **Rebalance the imposter budget across species.** `hedge-box:l2` is 384 triangles and
   `spruce:l2` is 12; at `ground` `meadow-flowers` alone is 154,848 triangles, 35.9 % of the
   module, for 0.4 m clumps. A per-class triangle target at each level would free the triangles
   items 1 and 2 need and cost nothing visible.
4. **Raise the lamp pool, or say out loud that a park has two lights.** 2 of 72 sites
   (`POOL_BY_PRESET.medium`), both at 63.0 and both reaching only 6-slot scenery materials, is why
   ~20 glowing heads sit over unlit paving in four separate frames and why the park from 340 m at
   night has one warm smudge in it. The `maxSimultaneousLights = 4` on all eight `path-*` materials
   is core's or `paths`' to change (the report's request 2 is the right request); the pool size is
   this module's, and `medium` is the preset every machine in the harness picks.
5. **Subscribe to `registry.onPack`.** `foliage` items 7 → 9 on the registry, catalogue 26 → 26 in
   the module, all four new keys `null` (§4.4). Two lines in `main.ts` and `sim.ts`, no core change,
   and it is the difference between "a manifest entry" meaning a source edit and meaning a manifest.
6. **Make the fountain wet, or stop calling it wet.** The `pond` part is 72 triangles at
   `albedoColor` (0.03, 0.09, 0.11) with roughness 0.06 — a near-black mirror that renders as
   shadow under this rig — and the basin reads dry at 09:00, 12:00, 18:30 and 22:00 in both scenes.
   It is the centrepiece of the showcase's `close` camera.
7. **Make the hedge a hedge.** `crop-hedge.png`: a row of separate balls with a contact ellipse
   under each, where `hedge-box` is clipped Buxus — a continuous mass with a flat top and vertical
   faces. It is also the module's second-largest triangle consumer at every camera, so this is a
   fidelity fix that pays for itself.
8. **Put the eight unphotographed generators in a frame.** `tree-palm`, `lamp-modern`, `sign-post`,
   `parasol`, `lounger`, `light-strip`, `neon-palm` and `marker` are in no shot from either scene;
   the showcase places `core-classic:` keys only. A third of the module has never been looked at by
   anybody, including its own builder.
9. **Fix the six numbers in §4.7**, starting with weakness #4's "holds at 120 m+" and the water in
   the fountain. The report's measured figures are excellent — its showcase table matches mine to
   the triangle — which is exactly why the two claims a critic checks first being wrong costs more
   than they are worth.

## 6. Verdict

**FAIL — 7.10 weighted, pass is 8.5.** No hard gate is failed: zero console errors and zero
hydration warnings across 18 shots, no barrel import, no DOM anywhere in the module, tsc / eslint /
prettier / `pnpm test:game` all clean, 20 selftest checks, no reach past `core`, no leak over three
dress cycles, save → load → save byte-identical, and extensibility at 7.0 is well clear of the 5.0
floor.

This module builds the best near field in the game and then draws it eleven times out of every
hundred. A LOD 0 tree has bark, branches and a canopy; the bench has an iron frame and timber
slats; the railing turns where a railing turns; `0900-ground` on the demo park is a photograph of a
park. Fourteen triangles of untapered quad, taking over at 34 m, is what the other 86–100 % of every
frame is made of — and the cost of fixing it is about 7 % of the cheapest frame in the set, payable
out of the flowerbeds.
