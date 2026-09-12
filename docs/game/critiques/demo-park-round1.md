# demo-park — critic, round 1

Graded at commit `5ac9c03`. Rubric: `docs/game/CRITIC.md`, six axes, pass at 8.5.

Frames: `node scripts/game-shot.mjs --out=.game-render/critic-dp/<tod>-<cam> --tod=<T> --cam=<C>
--wait=6000 --timeout=180000` — one invocation per frame, 16 of 16 green on the first attempt, each
with its own `report.json`. (A four-camera-per-run invocation died twice at
`page.evaluate: Resulting promise was garbage collected`, the same failure the builder reports; one
frame per process does not.) No `--showcase=`: the demo park is the default scene.

Two claims the brief asked me to measure rather than accept were measured against the running scene
through `window.__parkfan_game.scene()` and `.world()`, and the world was rebuilt independently in
node against `lib/game/content/packs/`.

---

## 1. Scores

| #   | Axis                       | Weight |   Score | One sentence                                                                                                                                                                                                                                    |
| --- | -------------------------- | -----: | ------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The frame                  |   30 % | **6.6** | `ground` and `entrance` read as a place and are best at 09:00 and 22:00, but `overview` — the default scene's widest camera — is scrubland at every hour, because 99.9 % of the 1 008 tree instances it draws are LOD 2 imposters.              |
| 2   | Fidelity to the real thing |   20 % | **6.4** | The circulation is researched and correct (a real 8/6/4 m width hierarchy, three terraces, a gate axis, ride loops, a service road); the planting and the plaza programme are not — 6.9 % of 893 trees stand within 10 m of a path.             |
| 3   | Extensibility              |   20 % | **7.6** | Role resolution against the registry with no content id in it, verified by building the park against an empty registry; against that, one deep import past a sibling module's public API which the report's headline claim denies.              |
| 4   | Budget and behaviour       |   15 % | **7.0** | 237 draw calls peak = 19.8 % of the whole-game budget with 5 of 24 modules built, stated as a share with the levers named — and boot was over the 8 s budget in 16 of 16 runs, once far enough to trip the sim watchdog in front of the player. |
| 5   | Determinism and state      |   10 % | **9.5** | `buildWorld(1, …)` twice in one process is byte-identical, verified myself; the module found and reported the core bug that made it not so, and there is now a regression test for it.                                                          |
| 6   | Honesty of the report      |    5 % | **8.4** | Fourteen numbers re-derived, fourteen exact; ten ranked weaknesses whose top three are the right three — minus four specific claims that the frames or the source contradict.                                                                   |

**Weighted total: 6.6·0.30 + 6.4·0.20 + 7.6·0.20 + 7.0·0.15 + 9.5·0.10 + 8.4·0.05 = 7.20**

## 2. Hard gates

| Gate                                               | Result                                                                                                                                                                 | Command                                                         |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Zero console errors / hydration warnings           | **PASS** — 0 errors, 0 warnings, 0 hydration in all 16 `report.json`, and 0 in two separate Playwright probe sessions                                                  | `.game-render/critic-dp/*/report.json` → `console`              |
| Extensibility ≥ 5                                  | **PASS** — 7.6                                                                                                                                                         | axis 3                                                          |
| Touched only its own folder                        | **PASS** — answered by the integrator for all six modules, not re-derived per the brief                                                                                | —                                                               |
| No `from '@babylonjs/core'`                        | **PASS** — no match                                                                                                                                                    | `grep -rn "from '@babylonjs/core'" lib/game/demo-park/`         |
| No `window`/`document`/`navigator` at module scope | **PASS** — the only hit in all six files is the word "window" inside a `plan.ts` docblock (line 302)                                                                   | `grep -n "window\|document\|navigator" lib/game/demo-park/*.ts` |
| `pnpm test:game` green                             | **PASS** — 6 suites: save round-trip + **entity-id reproducibility**, registry, lint (134 files clean), i18n (68 keys × en/de), track selftest (95 checks), soak (9/9) | `pnpm test:game`                                                |
| `npx tsc --noEmit` clean                           | **PASS** — exit 0, no output                                                                                                                                           | `npx tsc --noEmit`                                              |
| `npx eslint lib/game/demo-park` clean              | **PASS** — exit 0, no output                                                                                                                                           | `npx eslint lib/game/demo-park`                                 |
| (also) `prettier --check`                          | **PASS** — "All matched files use Prettier code style!"                                                                                                                | `npx prettier --check lib/game/demo-park`                       |

No gate fails. The module fails on the total.

## 3. The frames I looked at

All sixteen from `.game-render/critic-dp/<tod>-<cam>/<tod>-<cam>.png`, opened with the Read tool.

| File                              | What was actually in it                                                                                                                                                                                                                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `0900-overview/0900-overview.png` | The whole park from 99 m: lake with a sand ring top-left, three path loops as pale pink ribbons, plazas as pink lenses — and **every single tree a thin bare pole with a small dark spray on top**. No conifer silhouette anywhere. Reads as savanna, not as a European park.                                      |
| `0900-entrance/0900-entrance.png` | The arch with its blue board and four flags, the terracotta forecourt with a hedge roundel, the grey main street running north. Flanking trees at 20–40 m are convincing broadleaves; everything past ~35 m is poles again. Deep morning shadow eats the right third.                                              |
| `0900-close/0900-close.png`       | The fountain square: fountain, 8 benches, 2 lamp rings, 8 planters, 4 hedge corners. The fountain is **dry**. The setts are a fine blue-grey noise with no sett pattern. The "parterres" read as heaps of round bushes.                                                                                            |
| `0900-ground/0900-ground.png`     | **The best frame in the set, and the report is right about that.** Dappled tree shadow across the promenade, kerb running away to a vanishing point, Victorian lamps and lime avenues either side, hedge runs, terracotta market square in the distance. This is a park.                                           |
| `1200-overview/1200-overview.png` | Same as 09:00 with the shadows gone, so the imposters lose even their form. The dirt-layer patches read as rust-coloured stains on lawn. Terrain chunk tiling visible as a checkerboard bottom-left.                                                                                                               |
| `1200-entrance/1200-entrance.png` | The clearest read of the plan in the whole set: gate → arch → 60 m forecourt with a legible 14-hedge roundel → main street → market square. Also the clearest view of the problem: warm terracotta plaza butted straight onto cool grey promenade, and 80 % bare paving.                                           |
| `1200-close/1200-close.png`       | The square flattened by overhead light. Measured over a 700×80 px strip of open paving: mean rgb(136,140,152), luminance 140/255, max 161 — **not near-white**, but flat and blue-cast (B−R = +16). A shadow-cascade seam runs down the left third.                                                                |
| `1200-ground/1200-ground.png`     | The same avenue with the dapple gone; mean paving luminance 163 over a 680×200 px strip. A hard dark seam runs down the exact centre of the path from y≈390 to the frame edge (a paths mesh artifact, visible in all four `ground` frames).                                                                        |
| `1830-overview/1830-overview.png` | A warm pink sunset over a park with **no directional light left on it at all** — flat dark green, the lake a grey lens taking none of the sky. The apron shows as a lighter olive band beyond the terrain edge on both sides.                                                                                      |
| `1830-entrance/1830-entrance.png` | Very good: the arch's sign glowing, ~30 lamp heads as white points, the axis running north as a lit ribbon, treeline in silhouette against pink. And not one pool of light on the ground.                                                                                                                          |
| `1830-close/1830-close.png`       | ~20 lit lamp heads over uniformly dark paving. Measured under three of them against 5 m to the side: 41.8 vs 51.8, 42.2 vs 49.0, 44.8 vs 52.9 — the ground **under** every lit lamp is darker than beside it.                                                                                                      |
| `1830-ground/1830-ground.png`     | Strong. The avenue receding into lit dots, the right kerb catching the last warm light, dark green canopies against a blue-to-amber sky.                                                                                                                                                                           |
| `2200-overview/2200-overview.png` | A black park under a star field with a moon, one warm glow at the fountain square. Exactly what the report says. **This run also raised a second toast: "The simulation did not start. The park is shown, but guests and rides are paused."** See §5.4.                                                            |
| `2200-entrance/2200-entrance.png` | The arch's sign is now a bright cyan bar and is the strongest object in the frame; gate walk and plaza kerb lit; the main street a faint ribbon of lamp dots. Reads well.                                                                                                                                          |
| `2200-close/2200-close.png`       | ~20 lamp heads with soft bloom halos over the plaza. A horizontal luminance scan at row 530 gives 25 → 34 → 26 across the whole square, a single smooth hump with **no local maximum at any lamp position**; the only local maxima in the frame are the heads themselves (99 at row 480) and two near hedges (47). |
| `2200-ground/2200-ground.png`     | The best night frame: the near lamp blooming, the avenue running away into paired dots, dark canopies, a faint warm glow on the market square. The 8 m street from y≈380 down is a single flat blue-grey slab.                                                                                                     |

## 4. What I measured myself

### 4.1 The two claims the brief named

**"One connected component" — TRUE, and stronger than stated.** Rebuilt the world in node from
`lib/game/demo-park/index.ts` with both bundled packs, ran the paths module's own
`buildLayout(GRAPH_SPACING)` + `buildGraph` over the 20 path entities:

```
graph: nodes 1511  edges 8044 (= 4022 undirected)  components 1  entranceNode 0
junctions: 17
component sizes: 0:1511
entities per component: path-1..path-20 all = [0]
```

Every one of the twenty path entities has all of its nodes in component 0. The report's
"1 511 nodes, 4 022 edges, 1 component, 17 junctions" is exact.

**"Every tree at `overview` is a LOD 2 imposter" — TRUE, and worse than the report says.** Walked
`scene.meshes` after a settled frame at each camera, keyed on the `l<N>v<M>` tag in
`scenery:<pack>:<key>:l<N>v<M>:<piece>` and read `thinInstanceCount` on the enabled, visible ones:

| camera @12:00 | tree LOD 0 | LOD 1 | LOD 2 | LOD 2 share |
| ------------- | ---------: | ----: | ----: | ----------: |
| `overview`    |      **0** | **1** | 1 008 |  **99.9 %** |
| `entrance`    |      **0** |    86 |   981 |      91.9 % |
| `close`       |          5 |    62 | 1 005 |      93.8 % |
| `ground`      |     **12** |   112 |   948 |      88.4 % |

At `overview`: `spruce:l2v0` ×435, `oak:l2v0` ×358, `linden:l2v0` ×215, `linden:l1v0` ×1, and no
LOD 0 tree instance at all. The report's own figures (179/351/288) are lower than mine but its
conclusion is exactly right. The number that matters is the last row: **the frame that works
(`0900-ground`) is carried by twelve full-detail trees.** Everything else in this park, at every
camera, is the imposter — and `hedge-box:l2v0` ×76 at `overview` / ×114 at `entrance` is why the
roundel and the four parterres read as heaps of bushes rather than as clipped box.

The species-independence of the imposter is the visible half: 435 spruce instances are drawn at
`overview` and there is not one conical silhouette in the frame. That single fact is what makes the
default scene read as a palm grove.

### 4.2 Everything else I re-derived, and whether it matched

| Claim in `docs/game/reports/demo-park.md`                                          | Mine                                                                                                                                              | Verdict                |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 1 295 entities — 20 `path`, 1 275 `scenery`                                        | 1 295 — 20 / 1 275                                                                                                                                | exact                  |
| 397 spruce, 315 oak, 181 linden, 166 hedge, 72 lamps, …                            | identical, all thirteen rows                                                                                                                      | exact                  |
| `buildWorld(1, …)` twice in one process byte-identical                             | `serializeWorld` identical                                                                                                                        | exact                  |
| seed 7 → 1 294 entities                                                            | 1 294                                                                                                                                             | exact                  |
| save 673.5 KB                                                                      | 673.5 KB                                                                                                                                          | exact                  |
| terrain −6.8 … +25.9 m, 2.08 % under waterline                                     | −6.80 … 25.90, 2.08 %                                                                                                                             | exact                  |
| 20 paths in 5 styles: promenade ×4, pavers ×12, cobble, boardwalk ×2, service-road | identical                                                                                                                                         | exact                  |
| `missingRoles()` empty against the bundled packs                                   | `[]`                                                                                                                                              | exact                  |
| path mesh: 8 meshes                                                                | 8 (`paths-concrete-slab`, `-kerb-concrete`, `-clay-pavers`, `-kerb-granite`, `-timber-deck`, `-kerb-timber`, `-asphalt-service`, `-granite-sett`) | exact                  |
| `scenery.drawnMeshes` 27 (overview) → 68 (ground)                                  | 27 / 68 / 65 (close)                                                                                                                              | exact                  |
| draw calls 145 / 193 / 214 / 237 at 09:00                                          | 145 / 193 / 214 / 237                                                                                                                             | exact                  |
| triangles 295 224 / 690 920 / 1 037 213 / 1 089 765                                | identical                                                                                                                                         | exact                  |
| 105 / 161 522 at 22:00 overview                                                    | identical                                                                                                                                         | exact                  |
| `activeLights` is 2                                                                | 3 lights on at 22:00: `sky` + `scenery-lamp-0/1`, i.e. **2 point lights** for 72 lamp sites                                                       | exact                  |
| world edge: sky→land step at rows 228–240, ΔG ≈ 35 over 8 px                       | centre column of `1200-overview`: rgb(171,175,176) at row 228 → rgb(113,140,111) at row 236, ΔG = 35                                              | exact                  |
| "the granite setts render close to white at noon"                                  | mean luminance **140/255**, max 161, over a 700×80 px strip                                                                                       | **overstated**         |
| "74 lamp sites"                                                                    | 72 `lamp-victorian` entities — and the report's own props table says 72                                                                           | **wrong by 2**         |
| "warm pools on the paving" at 22:00                                                | none: a smooth 25→44 gradient toward the camera with no local maximum at any lamp                                                                 | **not in the frames**  |
| "everything … through their public APIs"                                           | `landform.ts:35` imports `fbm2` from `'../terrain/noise'`, which `terrain/index.ts` does not export                                               | **false, in one line** |

### 4.3 The planting, judged as a park designer

The circulation is right. Widths read off the world: `promenade` 8 m for the gate and both halves of
the main street, 6 m for the east avenue; `pavers` 6 m for the garden walk and 4 m for every loop
and link; `boardwalk` 4 m; `service-road` 6 m; five plazas. That is a genuine spine-and-branch
hierarchy with plazas as nodes, and the gate → forecourt → street → market square → fountain square
axis is the correct reference. The service road hidden behind the west treeline is the kind of detail
someone who has walked a park backstage puts in.

The planting is not right, and the numbers say so before the frames do. Distance from each of the 893
tree entities to the nearest path centreline:

```
  0–10 m:   62 (6.9%)     40–60 m:   99 (11.1%)
 10–20 m:   74 (8.3%)     60–80 m:  124 (13.9%)
 20–30 m:  102 (11.4%)   80–120 m:  224 (25.1%)
 30–40 m:   77 (8.6%)   120–999 m:  131 (14.7%)
```

Trees per hectare by Chebyshev band from the park centre:

```
   0– 40 m: 31.3/ha      120–160 m: 18.5/ha
  40– 80 m: 18.8/ha      160–200 m: 17.4/ha
  80–120 m:  7.8/ha      200–256 m: 61.6/ha
```

A park's planting is densest where people walk and thins into lawn; this one is a **bathtub** — a
wall of wood on the rim at 61.6/ha, a hole in the mid-park at 7.8/ha, and only 6.9 % of the trees
close enough to a path to shade anybody on it. The rim belt is defensible on its own terms (many
European parks sit in woods), but the 80–120 m band is where a visitor spends the day and it is bare
lawn with copses scattered at random. The lime avenues that make `0900-ground` work are about thirty
trees out of 893.

Three more things a designer would ask for and cannot get from this plan:

- **Nothing is reserved on the entrance forecourt.** `plots()` returns eight pads and all three shop
  plots are up the main street at z = 44–120. The 60 m disc at z = 178 — the single largest paved
  surface in the park, and the first thing a visitor stands on — has no owner, so the next six
  builders will follow `plots()` and it will stay empty paving forever. Ticket windows, guest
  services, lockers, a pram hire all belong on that flank.
- **No railing, fence, bollard or gate leaf anywhere.** The report names this (weakness 9) and puts
  it on the lakeside boardwalk. The place it actually costs the frame is the entrance: in
  `1200-entrance` the arch stands free with open lawn either side, so it reads as an ornament rather
  than as the boundary of a park you pay to enter.
- **The fountain is dry**, and it is the object the `close` camera is pointed at. The report's frame
  description lists "the fountain, eight benches facing it, two rings of lamps" without mentioning
  that no water comes out of it.

### 4.4 Extensibility, probed rather than read

Built the park against a `Registry` with **no packs at all**:

```
EMPTY REGISTRY: ok. entities 20  props 0  paths 20   save 438.0 KB
  missingRoles: ["arch","bench","bin","canopyTree","conifer","flag","flowers",
                 "fountain","hedge","lamp","planter","shrub","streetTree"]
```

No crash, no exception, every unanswered role named on the world, and the park still serializes. That
is the claim in `props.ts`'s docblock and it holds. `pathStyle()` likewise degrades an unknown style
to `promenade` rather than throwing, so the five style ids in `plan.ts` are safe.

Two deductions:

- `landform.ts:35` — `import { fbm2 } from '../terrain/noise'`. `terrain/index.ts` exports
  `generateShowcaseLandscape`, the layer constants, `sampleHeight`, `samplePaint` and the brush
  types; `fbm2` is not among them. The file's own comment argues for it ("a pure, DOM-free helper of
  the module whose heightfield this file writes into") and the argument is reasonable — but the gate
  is about reaching past a sibling's public surface, and the report's headline sentence says the
  module does not. Either terrain exports it or this copies a five-line helper; it should not be
  both.
- `build.ts:88` — `buildPathEntities(world, packs[0] ?? 'core-classic', allocId)`. The one hard-coded
  content id in the module, and with an empty registry it stamps twenty path entities with a pack
  that is not loaded. `packs[0] ?? ''` or the style's own pack would be honest.

A third, smaller: `build.ts` keeps a private `allocId` that duplicates core's `nextEntityId`, which
now reads `world.modules.__ids` and is correct. Two implementations of one id format with nothing
asserting they agree; the private one can go.

### 4.5 Budget

| camera     | draw calls | triangles | active meshes | share of the 1 200 whole-game budget |
| ---------- | ---------: | --------: | ------------: | -----------------------------------: |
| `overview` |        145 |   295 224 |           100 |                               12.1 % |
| `entrance` |        193 |   690 920 |           109 |                               16.1 % |
| `close`    |        214 | 1 037 213 |            88 |                               17.8 % |
| `ground`   |    **237** | 1 089 765 |           105 |                           **19.8 %** |

From `.game-render/critic-dp/0900-*/report.json`; `lib/game/modules.ts` lists **24** modules and five
are built. The report states this share and names the four levers, which is what the axis asks for.
Instancing is real, not claimed: every prop and every ambient species is a thin-instance batch
(27 batches drawn at `overview`, 68 at `ground`), the whole path network is 8 meshes, the shadow
generator has a **52-mesh render list at 2048²** and the day/night delta at `ground` is 237 − 110 =
127 calls, which is consistent with the report's estimate of the shadow share.

`pnpm test:game-soak`: 576 ticks, mean **0.08 ms**/tick against a 6 ms budget, max 39.78 ms at init,
9/9 assertions, 0 non-finite, 0 orphan entities, 0 unreachable queues.

Boot, over sixteen harness runs: **9 758 – 15 955 ms**, against an 8 000 ms budget — **over in 16 of
16**. The report's range (5.9–12.0 s) has a lower floor than anything I saw and a ceiling already
above budget. It matters more than a soft number, because `core/host.ts:354` sets `readyTimeout` to
the same 8 000 ms: in the 15 955 ms run the watchdog fired and `2200-overview` was taken with a
second toast reading "The simulation did not start. The park is shown, but guests and rides are
paused." That is SwiftShader on a busy container and not the module's fault — but the demo park is
the first world heavy enough to reach the watchdog, and the report's weakness 11 stops at "boot is
5.9–12.0 s" without connecting it to what the player then sees.

## 5. What to fix, most valuable first

1. **The tree imposter, because it is 99.9 % of the default scene's widest camera.** 1 008 tree
   instances at LOD 2, one at LOD 1, zero at LOD 0 (§4.1), and the LOD 2 form is species-blind —
   435 spruces and not one conical silhouette. This is `scenery/gen-foliage.ts`'s to fix and the
   demo park is where it shows, exactly as `requests` §4 says. Until it is fixed no amount of
   planting will make `overview` read as a park. **It also bounds every other fix on this list.**
2. **Plant the park along its paths.** 6.9 % of 893 trees within 10 m of a path; 7.8 trees/ha in the
   80–120 m band against 61.6/ha on the rim (§4.3). Moving ~150 trees off the second rim pass and
   into avenue lines along the garden walk, the north walk, the east avenue and the two ride loops
   costs nothing (the entity count is unchanged) and buys the mid-ground the structure it has none
   of. Fix this before adding a single new prop.
3. **Reserve a plot on the entrance forecourt.** Eight pads, none on the 60 m disc a visitor stands
   on first; three shop plots all further north (§4.3). One `Pad` entry in `plan.ts` and the next
   builder fills the biggest empty surface in the park instead of walking past it.
4. **Correct the four claims the frames contradict** (§4.2): "warm pools on the paving" at 22:00
   (measured: a smooth 25→44 gradient with no maximum at any lamp), "74 lamp sites" (72, per the
   report's own table), "close to white at noon" (luminance 140/255, the problem is flatness and a
   blue cast), and "everything through their public APIs" (`../terrain/noise`).
5. **Close the deep import**, `landform.ts:35` (§4.4). Either a `requests` entry asking terrain to
   export `fbm2`, or five lines copied. It is the only line in the module that a coupling gate
   would catch, and it is the line the report's summary denies exists.
6. **Furnish the two big plazas, or shrink them.** `ENTRANCE_PLAZA.radius = 30` and
   `FOUNTAIN_SQUARE.radius = 30`, 60 m across each, with everything on the rim and the middle bare
   (`1200-entrance`, `1200-close`). The report names this (weakness 4) and it is as bad as it says.
   A bandstand and a kiosk are `requests` §6; a radius of 22 is one number.
7. **Get water into the fountain and a railing onto the boardwalk.** The `close` camera is pointed
   at a dry fountain; the boardwalk runs unguarded 4 m from open water. The report calls the railing
   its first add-back once items 2 and 3 are fixed and I agree — but the railing that matters most
   is not on the boardwalk, it is either side of the arch, where its absence makes the gate read as
   scenery (§4.3).
8. **Match the paving palette across a joint.** `1200-entrance`: `clay-pavers` mean rgb(145,126,116)
   butted straight onto `concrete-slab` mean rgb(160,162,171) — a 40-point R−B swing at the
   forecourt edge with no transition. Either a shared warm-grey family or a band of one running into
   the other.
9. **Say what the 2-light night rig means at every camera, not just `overview`.** `POOL_BY_PRESET`
   in `scenery/night-lights.ts` gives `medium` — the harness's own preset — **two** point lights for
   72 lamp sites, and at 18:30 the emissive head and the point light are on different thresholds
   (`night < 0.03` disables the pool), so `1830-close` shows ~20 glowing lamps whose ground is
   measurably _darker_ under them than beside them. The report frames this as an `overview` problem;
   it is a night-frame problem at every camera and belongs in `requests` against `scenery`.
10. **Connect boot time to the watchdog.** 9 758–15 955 ms over 16 runs against an 8 000 ms budget,
    and `host.ts:354` uses the same 8 000 ms to decide the sim never started (§4.5). The consequence
    is a warning toast on the default scene, which is a different and worse thing than "boot is
    slow".

Two things I checked and will not charge for. The world's edge (report weakness 1) is real —
I reproduced the row-228→236 step and the ΔG of 35 in the centre column — and the arithmetic in
`requests` §1 showing that planting cannot reach it is correct; it is terrain's. And the
process-global `nextEntityId` counter this module found is the axis-5 machinery working as designed:
it is the kind of bug only a second `buildWorld` in one process reveals, the module reported it
rather than working around it silently, and `pnpm test:game` now carries the regression.

## 6. Verdict

**FAIL — 7.20 against a pass mark of 8.5.** No hard gate is tripped; the module is well engineered,
deterministic, honestly reported and hands the next six builders a plan they can build on. It fails
on the two axes that carry half the weight: the widest camera does not read as a park, and the park's
planting is not a park's planting. Items 1 and 2 above are most of the gap, and item 1 is not this
module's code — which is itself the finding, because the demo park is the scene every other module
will be graded in.
