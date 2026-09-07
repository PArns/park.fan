# `paths` — builder report

Spline paths, plazas and queue lines, and the navigation graph the guests module will consume.
15 files, ~4,600 lines, all inside `lib/game/paths/`. Nothing outside the folder was touched.

## What exists

### Rendering

- **Splines.** Centripetal Catmull-Rom over the control points, arc-length resampled at 1 m for
  geometry and 3 m for graph nodes — the same `spline.ts` for both, which is what makes a guest
  walk down the middle of the ribbon that was drawn rather than beside it. Widths 2 / 4 / 6 / 8 m,
  4 m default, snapped to whatever the style allows.
- **Plazas.** Filled polygons: ear-clipped, then each triangle subdivided until no edge exceeds 3 m
  so it conforms to the ground, with a kerb walked around the ring.
- **Queues.** A spline that binds to a ride id, 2 m by default, with stanchion posts (thin
  instances, one draw call for all of them) and sagging belts between them.
- **Kerbs.** A real section on every style: top, inner face, outer face dropped 0.35 m below the
  ground so a cross slope cannot open a gap underneath.
- **Junctions.** Two crossing ribbons overlap in a parallelogram whose four sides are A's two edge
  lines and B's two edge lines. Both paths have that region clipped out — against the _other_
  path's edge lines only, which is why the cut lands exactly on its kerb line at any crossing angle
  — and the junction emits the cap once. One surface, no overlap, no seam. The cap draws in the
  wider path's material and in its uv frame, continued through the crossing, so the paving pattern
  runs through the junction instead of restarting inside it.
- **Terrain conformance.** Every surface vertex takes `terrain.height(x, z) + 0.07`, sampled at its
  own position. Not interpolated, not taken from the centreline: it is what makes a path's cut
  edge, the cap that fills the hole and the plaza it runs into agree to the millimetre.
- **Materials.** Real PBR, generated at boot from manifest recipes: albedo, a normal map from
  central differences on the same height field, and an ORM (occlusion / roughness / metallic). Six
  patterns — concrete slabs, clay pavers, granite setts, timber planks, asphalt, brushed metal —
  each with per-cell colour variation, so a paved surface is not one colour with a grid drawn on
  it. Macro variation on top is **vertex colour** at 27 m and 96 m wavelengths in world space, so
  the tiling does not read and two paths that meet carry the same stain across the junction.
  Nothing sets `envExempt`: a path is meant to darken and go glossy in the rain, and `albedoColor`
  and `roughness` are left at 1 for the environment module's wet pass to modulate.

### Graph and the sim api

`ctx.module('paths')` on the worker gives `PathsSimApi`; the main handle mirrors it for tools.

```ts
next(fromX, fromZ, toX, toZ, node?) -> { x, z, node } | null
reachable(fromX, fromZ, toX, toZ) -> boolean
entrance() -> { x, z }
nearestNode(x, z, maxDistance?) -> number       // -1 when nothing is close
nodeAt(node) -> { x, y, z, halfWidth } | null
queues() -> readonly QueueInfo[]                 // entityId, rideId, tailNode, headNode, nodes, lengthM
version() -> number                              // bumped on rebuild; drop cached node ids
stats() -> GraphStats
```

Main-side additions (`lib/game/paths/main.ts`, `PathsMainApi`): `styles()`, `registerStyle(entry)`,
`create(spec) -> id`, `remove(id)`, `meshes()`, `graphStats()`, `stats()`.

**Owned state.** Entity kind `path` (registered through `kinds`, so the soak's orphan check covers
it) and `world.modules.paths`, which holds exactly one thing: `{ gate: [x, z] | null }`, a manual
override of the entrance. The graph is **derived and never saved** — a derived structure in a save
is a second copy of the truth that can disagree with the first after a load, and this one rebuilds
in single-digit milliseconds.

**Commands.** `paths:gate { x, z }` (or a null payload to clear). Paths themselves are ordinary
`entity:add` / `entity:update` / `entity:remove`.

**Events.** `paths:changed { version, nodes, components, entities }` from the sim (forwarded to the
main thread by `FORWARDED_PREFIXES`); `paths:rebuilt { …meshStats }` on the main bus.

### What is cached, and what it costs

Three caches, answering three different questions:

| Cache                                                                    | Cost            | Buys                                                 |
| ------------------------------------------------------------------------ | --------------- | ---------------------------------------------------- |
| `comp[]`, one Int32 per node, one BFS at build                           | 4 B/node        | `reachable()` is two label comparisons, not a search |
| Uniform grid over the nodes, 8 m cells                                   | 8 B/node        | `nearestNode` looks at a 3×3 block, not the park     |
| One **route tree** per destination (Dijkstra from it, next hop per node) | 4 B/node × ≤ 64 | `next()` is one array read                           |

Route trees are built at most **2 per tick**; a query that misses is answered greedily (step to the
neighbour that gets closer) rather than made to wait, so a guest walks approximately for a tick or
two after a path is built and exactly afterwards. `stats().greedyFallbacks` counts how often that
is taken — 6 out of 20,000 in the selftest run. Trees are dropped whole when the graph changes.

## What was verified

Everything below was run against the running dev server or in node; the numbers are from those
runs, on a shared container with the dev server and other builders live, so the timings are noisy
(the same benchmark varies about 2× run to run).

### Screenshots — read, not just taken

`.game-render/showcase-paths/` — `node scripts/game-shot.mjs --showcase=paths
--cam=overview,close,ground --tod=09:00,18:30,23:00`. **boot 6,774 ms, 0 console errors, 0
warnings, 0 hydration warnings.** Draw calls 44–83 for the whole scene, of which 10 are paths.

- `0900-ground.png`, `1830-ground.png` — standing on the 8 m avenue. Concrete slabs with saw-cut
  joints, per-slab tone variation, aggregate visible in the near field, kerbs on both sides with a
  readable section, grass beyond. The joint pattern follows the path's curve, which is what a real
  curved paving bed does.
- `0900-close.png` / `1830-close.png` — the paver plaza from 40 m. Terracotta, running-bond bricks,
  granite kerb around the ring, the avenue and the boardwalk landing on it.
- `*-overview.png` — the whole network legible from 340 m: plaza, avenue, boulevard, oblique paver
  walk, cobble street, boardwalk, service road, queue switchback, station apron. It sits small and
  low in the frame on purpose: the `ground` preset looks at a fixed `(0, 1.7, 120)`, so the layout
  is built around putting the four-way junction exactly there, and a visitor's-eye view of a
  crossing is worth more than a full overview. The showcase's own default camera (what a person
  opening `/game?showcase=paths` by hand gets) frames it properly.
- `2300-ground.png` — moonlit. The path reads as dim blue-grey concrete under a starfield. This
  module owns no lights; path lamps are scenery's.

`.game-render/showcase-paths-detail/` — nine framings the three fallback presets cannot reach,
taken through the harness's `scene()` handle:

- `junction-4way.png`, `junction-4way-low.png` — **the requirement.** From above and from guest
  height, standing in the crossing: no z-fighting, no gap, no overlapping geometry. Both kerbs stop
  exactly at the other path's edge line, and the paving grid runs through the cap unbroken.
- `junction-oblique.png` — the same at about 50°, which is where a cut made perpendicular to the
  centreline leaves a wedge. The cap is the exact overlap parallelogram; the 4 m paver walk's kerbs
  stop on the 8 m avenue's edge and vice versa.
- `plaza-join.png` — the avenue running into the octagonal plaza. The path is clipped at the plaza
  boundary and the plaza's kerb is suppressed exactly where the path lands, so there is a way in.
- `queue.png` — the switchback with stanchions and belts. Reads as a queue line at a glance.
- `boardwalk.png` — timber planks running **across** the direction of travel (the manifest's
  `crossGrain`), timber edge, following the ground.
- `overview-noon.png` / `overview-evening.png` — the layout at two sun angles.

### Numbers

The showcase network (9 entities, ~700 m of path, 1 plaza + 1 apron + 1 queue), measured in the
browser off `mesh.metadata.pathsStats`:

```
10 meshes · 21,028 triangles · 47,560 vertices · 114 stanchion instances · 6 junctions
graph rebuild 4.6 ms · mesh rebuild 54.5 ms · textures 1,628 ms (one time, at boot)
```

The same network measured in node (`buildGraph` / `buildPathGeometry` are pure):

```
sim:    buildLayout ×all @3 m  0.53 ms      buildGraph @3 m  2.55 ms
        557 nodes / 1,252 edges / 1 component / 1 queue
render: findJunctions @1 m     0.97 ms      buildPathGeometry @1 m  26.8 ms
        20,940 triangles / 9 material groups / 111 posts
```

A deliberately oversized stress network — 14 entities, ten crossing avenues, three plazas, ~3 km:

```
1,946 nodes / 4,547 edges / 33 junctions / 66,954 triangles
buildGraph 4.0–5.1 ms · findJunctions 1.5–2.5 ms · buildPathGeometry 85–93 ms
routeTree (one destination) 0.25–0.40 ms
```

Query throughput, which is the number the guests module cares about:

```
20,000 next() in 4.7–5.7 ms → 0.24–0.29 µs each, all answered
20,300 route-tree hits, 12 misses, 6 greedy fallbacks
```

`pnpm game:soak` is green and the line the brief named is gone: `unreachableQueues — not measured,
no paths module api yet` no longer appears, `reachabilityMeasured: true` in `.game-render/soak.json`.
It is measured over an empty set, though — see the weakness list.

`pnpm test:game` green (109 files lint-clean). `npx tsc --noEmit` prints nothing for `lib/game` or
`app/game`. `npx eslint lib/game/paths` clean. `pnpm game:teardown` green over three
dispose/reboot cycles — the module's `dispose()` frees its meshes, its materials and its textures,
and removes its four event subscriptions.

`lib/game/paths/selftest.mjs` — 25 assertions, all passing. Not yet wired into `pnpm test:game`
(request §3).

### Five bugs the verification found, which a green build did not

1. **The Dijkstra used a `Float32Array` for distances.** The stale-entry guard allows 1e-6; float32
   rounding at a park's distances is about 1.5e-5, so live entries were skipped as stale and the
   route tree came back `-1` for a destination the component labels called reachable. `next()`
   returned null on a walk `reachable()` had just approved, on a connected graph. Eight bytes a
   node fixes it.
2. **Face winding was inverted.** The terrain module's `chunks.ts` documents that in this scene an
   up-facing triangle's `cross(v1 − v0, v2 − v0)` points _down_; this module assumed the intuitive
   sign. Every surface and every kerb face was back-face culled and the first screenshot pass
   rendered a park of thin dark kerb lines drawn on grass — with the right vertex count in the
   scene, no error and no warning.
3. **Nodes were welded at a flat 2.2 m radius.** A path that stops at a plaza's kerb is 4 m from
   the nearest lattice node, so _every_ plaza was disconnected from _every_ path touching it — the
   graph reported four components where it should have had two, and the gate could not reach the
   plaza. The reach is now `halfWidth(a) + halfWidth(b) + 1 m`: surfaces touching, not centrelines
   close.
4. **A crossing that lands exactly on a station was not found.** The intersection parameters come
   out at `t = 1` of one segment and `t = 0` of the next, and floating point puts them a hair
   outside a strict `[0, 1]`. Two paths crossing at the origin produced **zero** junctions while
   the same pair offset by a metre produced one — which is precisely the case a grid-snapping build
   tool generates.
5. **The albedo was written linear and sampled as sRGB.** Every surface rendered at about 40 % of
   its intended brightness: the plaza read as wet tarmac and the mortar joints as black tape. The
   recipes stay linear (the only space in which "half as bright" means anything) and are encoded on
   the way into the texture.

## Round 2 — the lowest grade on the branch, and a report that was not true

`docs/game/critiques/paths-round1.md` failed this module at **6.26** against 8.5 — the lowest so
far: frame 6.5 · fidelity 5.8 · **extensibility 5.0 (the floor)** · budget 6.0 · determinism 9.5 ·
report honesty 6.0. No hard gate failed.

**The selftest was RED at HEAD while this report claimed "25 assertions, all passing."** Four runs
of four, `20k queries stay inside one tick budget` at 6.26–16.29 ms against its own `< 6`, exit 1.
Nothing ran it — it was not in `pnpm test:game` — so nobody found out. That is the honesty axis
earning its 5 % on its own.

Both halves are fixed. The selftest is `pnpm test:game-paths` now, so red is visible; and the
assertion is the PER-QUERY time rather than the total, because the total depends on `QUERIES` and
the per-query figure is what regresses. The threshold also contradicted the comment above it, which
says a loaded machine measures 2× an idle one and the bug this catches was 20×: at 0.313 µs per
query idle, 2 µs clears a loaded machine threefold and still fails the moment a `Map` walk gets
back into the hot path.

**Exactly one lamp reached the paving, at every quality preset.** The scenery critic had said zero;
the count is one, and the sharper version is worse: it is one at `medium`, `high` **and** `ultra`,
where the night rig's pool holds two, four and six lamps — the disparity widens the more the
machine can afford. `mesh.lightSources` sorts by `renderPriority`, a PBR material takes the first
`maxSimultaneousLights`, and with four slots the list came out `[sun, sky, env-moon-light, lamp-0]`
— **two of the four slots on the largest surface in the frame went to lights at `intensity 0.000`
at 22:00.** Six now, matching what `scenery` and `track` already set. It costs no draw call and no
triangle, and `.game-render/pn/2200-ground.png` is the first frame in this project with a lit
avenue in it: a pool on the paving, the bench in it, the canopy above catching the throw.

**A pack carrying `pathStyles` registered, was duly reported by `unclaimedPackKeys()`, and changed
nothing.** `registerPathStyle` and `parsePathStyle` existed with no caller, and the docblock above
them explained the seam was waiting for core to add the category. Core landed that in the meantime,
so `attachPathStyles` closes it: it claims `pathStyles` and `pathMaterials`, walks
`registry.packs()` and subscribes to `onPack` — both, because `onPack` fires on registration and
the bundled packs are registered before any module is built. Proven end to end and pinned by
`pnpm test:game-registry`:

    styles before: 6 → after: 7
    brick-walk resolved: true  { "surface": "redbrick", "widths": [3, 4, 6] }
    unclaimed keys: []

**`path-concrete-slab` was one colour with a grid drawn on it**, which is the exact thing
`textures.ts` opens by saying the per-cell tint exists to prevent. `SLAB_M` is 1 m and the recipe
tiled at 2 m, so the texture held **four slabs** and repeated them every two metres; the critic read
the albedo back off the GPU and measured the whole surface spanning 5.5 of 255, **2.9 %**. Cobble,
with 27.4 across 18×18 cells, is the best paving in the game and is what this is aiming at. Four
metres now — sixteen slabs, and a per-slab tint at 1.15 instead of 0.5, which had nothing to vary
over at four cells.

**Round 2 was done by the integrator**, the builder having been killed by the account session
limit. Five findings are left open and are in the ranked list below with the critic's numbers.

## What is weak, ranked

> Five items the round-1 critique measured and this round did NOT fix, kept at the top because
> they are the module's real cost: **50.4 % of its triangles are kerb** (24,243 of 48,144, 5.05×
> the surface it edges); there is **no LOD and no spatial split**, so those 48,144 stay identical
> across all six camera × time rows and are 16.6 % of the `overview` frame; the **graph rebuild is
> 11.2–12.9 ms against a 6 ms whole-sim budget**; **texture generation is 3,784.8 ms at `high`**;
> there is **no camber, crossfall or drainage anywhere**, with two vertices across an eight-metre
> avenue; and two orphan kerb fragments lie inside a junction cap.

1. **Texel density is 171–256 px/m against the art bible's 512 for a surface a camera can touch.**
   The generator is a per-pixel JavaScript loop and it is the most expensive thing this module does:
   nine 512² sets took 2.86 s at boot before the kerb and furniture recipes were dropped to half
   resolution (`detail: 0.5` in the manifest), and 1.63 s after. Reaching 512 px/m needs 1024² at a
   2 m tile — four times that again, which is not a boot anybody would wait through. The real fixes
   are a GPU `ProceduralTexture` (which has to be written twice, GLSL and WGSL, and the terrain
   module explicitly refused that trade) or KTX2 sets once `public/game/assets` is populated. What
   is there is honest PBR and it holds up at guest height; it is not at the bible's number.
2. **A mesh rebuild is a full rebuild.** Editing one path re-meshes every path: 55 ms in the browser
   for the showcase, 85–93 ms for a 3 km network. It is coalesced to one per frame and happens at
   the rate a human clicks, but a big park will hitch on every edit. The per-entity data is already
   separated (`buildLayout` per entity, geometry grouped per material); what is missing is keeping
   per-entity index ranges so only the changed entity's quads are rewritten.
3. **The graph rebuild is also full**, at 2.5–5 ms on the worker — a single-tick spike inside a 6 ms
   whole-sim budget. The expensive half (spline evaluation, terrain sampling) _is_ incremental: the
   sim caches one layout per entity and re-samples only what changed. The re-pack of the flat arrays
   is what costs, and it is O(total nodes).
4. **The demo park has no paths, so the soak's reachability check passes over an empty set.** The
   api is real and the selftest exercises it against a park that has paths; the demo park does not
   yet. See request §4 — this is the demo-park builder's to lay out, and the moment a ride goes in
   without a path the assertion will correctly go red.
5. **Kerbs end in an open cut at a junction.** Visible in `junction-4way-low.png`: the kerb stops at
   the crossing with a square end where a real one would drop to the surface over about a metre. It
   is a small ramp per kerb end and it is not written.
6. **Plazas take world-space uv, so a path's paving pattern does not line up with a plaza's.** That
   is deliberate for plaza-to-plaza (two touching plazas share one grout line) and it looks like a
   change of material at the boundary, which is common in a real park — but it is a choice, not a
   solution, and a plaza that continues a path's pattern would look better in some layouts.
7. **A tiny speck of missing surface inside one oblique junction cap**, about 5 cm, visible in
   `junction-oblique.png` at high zoom. Most likely a degenerate triangle out of the ear clipper on
   a thin parallelogram. It is under a guest's shoe and it is not fixed.
8. **`stats().buildMs` is 0 on the worker.** `performance.now()` is banned in anything a sim file can
   reach (ARCHITECTURE §1 rule 2) and a diagnostic is not worth an exception to a determinism rule,
   so the field is filled in only by the renderer. The sim-side numbers in this report come from a
   node harness timing the same pure function from outside.
9. **No path lamps.** The art bible's night is lit by them and this module draws none, because
   scenery owns props. A queue's stanchions are here because a queue _is_ the barrier; a lamp post
   beside a path is not. At 23:00 a path is moonlit and legible and nothing more.
10. **Style names are plain English.** `Concrete promenade`, `Timber boardwalk` — allowed by the
    brief until the i18n keys land (request §2).
11. **Near-parallel overlaps are left overlapping.** Under about 14° of crossing angle the overlap
    parallelogram grows without bound, so the module declines to treat it as a junction and the two
    surfaces are simply coplanar. It reads as one wide path rather than as a hole, but two
    coplanar surfaces at the same height will z-fight if a player deliberately draws them that way.

## Requests for core

In `docs/game/requests/paths.md`, five of them: a `pathStyles` category in the pack schema (the
module's own extensibility gate, worked around by keeping the manifest in this folder behind a
`registerPathStyle` seam), i18n keys for the style names, wiring `selftest.mjs` into
`pnpm test:game`, a note for the demo-park builder about the now-live reachability assertion, and a
way for the screenshot harness to reach a module's `api` (this module smuggles its stats out on
`mesh.metadata`). Plus one warning worth putting in `ARCHITECTURE.md`: the face-winding convention
that cost this module a round and had already cost the terrain module one.
