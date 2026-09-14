# demo-park — requests

What the demo park needed from core, from the content packs and from the other four built modules
and could not have. Each entry says what it worked around meanwhile, so nothing here is blocking.
Measurements are from `.game-render/dp-0900|1200|1830|2200/report.json`, from
`.game-render/dp-plots/report.json`, and from the probes named.

---

## 1. terrain — the world's edge is still visible at `overview`, and a treeline cannot reach it

`STATUS.json` records this against terrain and my brief asked whether planting solves it. **It does
not, and the arithmetic says so before the screenshot does.** Measured on the finished park, centre
column of the `overview` frame (1280 × 720, camera at (163.8, 98.9, −283.7)):

| thing                                               | screen row                      |
| --------------------------------------------------- | ------------------------------- |
| true horizon                                        | **153**                         |
| where the rendered frame steps from sky to land     | **228–240** (ΔG ≈ 35 over 8 px) |
| the park's own far boundary, ground                 | 268                             |
| the park's own far boundary, **top of a 20 m tree** | **245**                         |

The band the eye reads as "the world ends" is rows 228–245, and that is the **apron**, 700–2800 m
out. My treeline tops out five to seventeen pixels _below_ it. To occlude the apron's rim from a
camera 99 m up and 640 m from the park boundary, a boundary planting would have to be about **65 m
tall** — a park with a mountain range round it.

So this is geometry, not planting: it wants either more apron (the far rings currently settle at
`SURROUND_SHORE = 7` plus `surroundRelief`, which peaks around +25 at 1.2 km — from 99 m that is
still 1.3° below the horizon), or a distance fade that takes the last few hundred metres to the sky
colour. The treeline was built anyway and earns its place for the other thing it does: it hides the
transition from park to apron, and it is what makes the mid-ground read as a park boundary rather
than as a lawn that stops.

## 2. terrain — the splat texture is CLAMP-addressed, so the apron inherits the paint's edge row

`splat-material.ts` sets `wrapU/wrapV = CLAMP_ADDRESSMODE` and the 1.5 km apron samples the same
texture, so whatever the outermost row of `terrain.paint` holds is smeared from the park boundary to
the horizon. The first overview shot of this park came back with the distance in long straight
brown and green stripes — a park sitting in ploughed fields — because the woodland dirt patches
happened to touch the boundary.

_Worked around:_ `groundLayer()` returns `LAYER_GRASS` for the outermost 8 m of the park, so the
clamped row is uniform. It works, and it costs the park a metre-accurate boundary. A dedicated apron
layer index, or sampling the apron at a fixed layer, would remove the trap.

## 3. core — `nextEntityId` is not reproducible across two calls in one process

`core/world.ts` keeps `let idCounter = 0` at module scope and seeds each id from
`Math.max(idCounter, world.modules.__ids ?? 0)`. Building the same seed twice in one process
therefore produced `path-1…path-20` the first time and `path-721…` the second, i.e. two different
worlds from one seed. Nothing catches that except a `serializeWorld` comparison, which is exactly
what the demo park's brief asks for ("`buildWorld(seed, registry)` must produce the identical park
for the identical seed"), and the soak harness calls `buildWorld` from node where a second call is
one line away.

_Worked around:_ `build.ts` allocates its own ids from a local counter and writes the high-water mark
back into `world.modules.__ids` so runtime placement carries on correctly. The fix in core is to
drop the module-level counter and read only `world.modules.__ids`.

## 4. scenery — LOD 1 and LOD 2 broadleaf and conifer read as palm trees

At LOD 0 the trees are convincing — proper branching, dense canopy, bark (see
`.game-render/probe-copse.png`, taken at 42 m). Past the pack's `lod[0] × 0.85 = 34 m` they become a
bare trunk with a tuft on top, and past 102 m a 16-triangle card. In a park that is not a detail: at
the `overview` camera **every** tree in the frame is LOD 2 (measured — `linden:l2v0` ×179,
`spruce:l2v0` ×351, `oak:l2v0` ×288, and no LOD 0 tree mesh has an instance), and the whole
mid-ground of `.game-render/demo-park/1200-entrance.png` is LOD 1. The silhouette that arrives is a
palm grove.

The fix is in `gen-foliage.ts`, not here: LOD 1 needs to keep the lower canopy mass, and LOD 2's card
needs a crown wider than its trunk. The demo park is the surface this shows on and it cannot be
tuned around from this folder — the LOD distances come from the pack's `lod` array.

## 5. scenery — `dress()` has one density for every species, and the cap is spent coarsest-first

`AMBIENT_CAP` is 14 000 and `evaluateScatter` returns species sorted by pitch, so the ground cover
(pitch 2.2) is last in the queue and the trees (pitch 10–15) are first. That means one scalar has to
serve two opposite wishes: a dense treeline wants a high density, and the moment the density is high
enough the flowers eat the cap and the grass tufts stop arriving. Measured: at `density: 1.3` the
park dresses to exactly 14 000 and grass survives; the treeline it produces is roughly one tree per
800 m², which is a meadow with trees in it, not a wood.

_Worked around:_ the treeline and the copses are placed as **entities** — 893 trees, **169.7 KB** of
the 673.5 KB save, at 192 bytes an entity — and `dress()` is left to the ground cover it is good at.
A per-species multiplier on `dress({ … })`, or a separate `woodland: { keys, density }`, would let
this park drop most of those 893 entities and a quarter of its save.

## 6. content packs — what `core-classic` does not have that a park this size wants

Every role the demo park asks for resolved (`missingRoles: []`), so nothing here is blocking; these
are the entries a real European park would have and this one had to do without.

| wish                                          | what it is for                                                                                                                                  | what was used instead                |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `bridge` / `jetty`                            | the lakeside promenade crosses no water and reaches out over none — the lookout is a widening of the bank                                       | a plaza on the bank                  |
| `shelter` / `bandstand`                       | something to stand in at the market square; every plaza in the park is open paving                                                              | nothing                              |
| `picnic-table`                                | the meadows either side of the main street have benches and nothing to sit round                                                                | benches                              |
| `bollard` / `chain-post`                      | the service road meets the entrance plaza with no edge treatment at all                                                                         | nothing                              |
| `signpost` (finger post)                      | five paths meet at the fountain square and none of them is labelled; `sign-post` exists as a **generator** but no `core-classic` entry names it | nothing                              |
| a second broadleaf with a **broad low crown** | the park has two broadleaves and both are tall-trunked; a spreading species is what a lawn wants                                                | linden at the top of its scale range |
| `rose-bed` / a shrub with height              | `flowerbed` is 0.4 m and vanishes past 20 m, `shrub-round` is 1.6 m and round                                                                   | both, in the parterres               |

A `gravel-walk` path style would also earn its place: the park's five styles are all hard surfaces,
and a woodland walk through the west valley wants something that is not paving. That is a paths
manifest entry rather than a pack entry (`registerPathStyle` already takes one), so it is cheap.

## 7. paths — 1.7 s to build the meshes and 1.6 s to generate the textures, at boot

`stats()` on the finished park: `rebuildMs 1659`, `textureMs 1435`, for 20 layouts, 17 junctions,
48 144 triangles and 8 meshes. Boot measured **5.9–12.0 s** across nine harness runs against the 8 s budget in
`ARCHITECTURE.md` §6 — on SwiftShader, so the absolute number is meaningless, but the split is not:
a quarter to a third of it is this module, and the demo park is the first world with enough path in
it to show that. Not a bug, and not the demo park's to fix; recorded because the next thing that lands (track,
buildings, rides) adds to the same budget.

## 8. paths — a plaza cannot say where its kerb opens

Every plaza in this park is entered by a path that overlaps its ring, and the junction logic handles
it correctly. What it cannot express is a plaza with a **closed** kerb except at its entrances —
which is what a European market square looks like. Low priority; noted because the demo park is
where somebody will first want it.
