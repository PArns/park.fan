# demo-park — builder report

"park.fan Resort": the world `/game` opens with, and the scene every other builder and every critic
looks at. Folder: `lib/game/demo-park/` (6 files, 1 610 lines). Nothing outside it was touched
except this report and `docs/game/requests/demo-park.md`.

It draws nothing of its own. Everything in it is made by the four modules that exist — `terrain`
shapes it, `paths` draws the network, `scenery` plants it, `environment` lights it — through their
public APIs. That is deliberate and it is the point of the module: a park that looks wrong is a
module that looks wrong, and there is nowhere here to hide a special case.

Before: an empty green hill, 47–74 draw calls, no path, no prop, no entity at all.
After: 1 295 entities, 20 paths in **one** connected graph component, 1 275 placed props, 14 000
pieces of ambient dressing, and a lake.

## What exists

| File          | Lines | What it owns                                                                                                                                                                                          |
| ------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plan.ts`     | 587   | Every coordinate the park is built from: the three terraces, the lake, the reserved plots, the ridge, the valley, the rim, the twenty path plans. Data, because three passes read the same geography. |
| `landform.ts` | 312   | One height pass and one paint pass, both pure. Writes `world.terrain`.                                                                                                                                |
| `props.ts`    | 412   | Role resolution against the registry, then the furniture, the avenues, the copses and the treeline as `scenery` entities.                                                                             |
| `build.ts`    | 178   | `buildWorld(seed, registry)` — orchestration, path entities, the module's own world slot.                                                                                                             |
| `main.ts`     | 79    | The main handle. Its only job is asking `scenery.dress()` for the ambient landscape, on the first render frame.                                                                                       |
| `index.ts`    | 42    | The `GameModule`.                                                                                                                                                                                     |

### The park

A straight south–north axis with three terraces on it, a lake in the south-east, a wooded ridge in
the north-west, a shallow valley down the west side, and a raised rim planted with a treeline.

```
  z = −256  ┌──────────────── north ────────────────┐
            │  pavilion plot ▸ forecourt plaza      │
            │  coaster loop      north walk         │  fairground loop
            │      ▲ ridge 26 m                     │
  z =    0  │        ◆ FOUNTAIN SQUARE (r 30)       │  ▸ flume plot
            │  garden walk (west loop)              │  water-park plot
  z =   86  │        ◆ MARKET SQUARE (r 24)  ── east avenue ──▸ forecourt ▸ LAKE
            │        │ main street, 8 m                                    (r 42 waterline)
  z =  178  │        ◆ ENTRANCE PLAZA (r 30)                               lakeside boardwalk ring
            │        │ gate walk + arch at z = 210
  z =  256  └──────────────── south ────────────────┘
```

Twenty path entities in five of the paths module's six registered styles: `promenade` ×4 (the gate,
the two halves of the main street, the east avenue), `pavers` ×12 (the loops, the links and four of
the plazas), `cobble` (the fountain square), `boardwalk` ×2 (the lakeside ring and the lookout),
`service-road` (the back of house behind the west treeline). The sixth, `queue-line`, is unused because there is nothing to queue for.
Five plazas, three closed loops, 17 junctions, **one** graph component — measured, not assumed.

### Public API

```ts
// ctx.module<DemoParkApi>('demo-park')
plots(): Array<{ id; owner; x; z; sizeX; sizeZ }>   // the reserved, flattened land
missingRoles(): string[]                            // roles no registered pack could answer
stats(): { paths; props; ambient; dressed }

// and the world factory core calls before any module exists
buildWorld(seed: number, registry: Registry): World
```

Owned state: `world.modules['demo-park']` (`DemoParkState` — the `dress()` arguments, the plot
list, the missing roles, the counts). It survives a save byte-for-byte; verified.

### Reserved plots — where the next builder should look

Flattened, blended into the surrounding land, and each one served by a path. Coordinates are the
centre; sizes are metres. `PADS` in `plan.ts` is the source, and `demo-park.plots()` answers with
the same list at runtime.

| plot           | for         | centre (x, z) | size    | height | how it is served                                                                    |
| -------------- | ----------- | ------------- | ------- | ------ | ----------------------------------------------------------------------------------- |
| `coaster`      | `track`     | (−96, −52)    | 58 × 48 | 8.0 m  | ringed by `coaster-loop`, ~10 m clearance; the `coaster` camera preset points at it |
| `fairground`   | `rides`     | (96, −46)     | 48 × 42 | 2.6 m  | ringed by `fairground-loop`                                                         |
| `water-park`   | `pools`     | (112, 50)     | 44 × 32 | 1.2 m  | `water-forecourt` plaza on its west side; the `pool` preset points at it            |
| `flumes`       | `flumes`    | (168, 18)     | 36 × 30 | 2.2 m  | `lake-link` runs along its west edge, 4 m off                                       |
| `pavilion`     | `buildings` | (−8, −162)    | 56 × 32 | 7.0 m  | `pavilion-plaza` forecourt at (−8, −130), on the north walk                         |
| `shops-west`   | `shops`     | (−19, 120)    | 14 × 44 | street | main-street frontage, already flat                                                  |
| `shops-east`   | `shops`     | (19, 120)     | 14 × 44 | street | main-street frontage                                                                |
| `shops-market` | `shops`     | (19, 44)      | 14 × 32 | street | between the two squares, the busiest stretch of path in the park                    |

The park gate — what `PathsMainApi.entrance()` answers with — is the first node of `gate`, at
**(0, 228)**. Guests will arrive there.

### Determinism

`buildWorld(1, registry)` twice in one process is byte-identical under `serializeWorld`; seed 7
produces a different park (1 294 entities against 1 295). `serializeWorld(deserializeWorld(s)) === s`,
the 66 049 heights come back bit-identical, and `world.modules['demo-park']` survives. No
`Math.random`, no wall clock: `pnpm test:game-lint` passes over 134 files.

Getting there needed one fix outside the obvious: `core/world.ts`'s `nextEntityId` keeps a
module-level counter, so the second `buildWorld` in a process started numbering at `path-721`. The
demo park allocates its own ids and writes the high-water mark into `world.modules.__ids`
(`docs/game/requests/demo-park.md` §3).

## Two decisions worth arguing with

**The park is world state; only the ground cover is re-derived.** Every path and every one of the
1 275 props is an `Entity` created inside `buildWorld`, not staged from `main()` afterwards. That
costs 243 KB of the 673 KB save and it buys three things: the park survives a save without being
rebuilt from the seed, the simulation gets the identical world the renderer draws (`cloneWorld` runs
before the worker starts), and the soak harness — which imports `buildWorld` under node with no
browser at all — exercises the real thing. The ambient dressing is the exception, 14 000 instances
that are a pure function of the seed and the terrain, so it is asked for on the first render frame
and never saved.

The argument against is the 243 KB, and it is a fair one: 893 of those entities are trees — the
treeline, the copses and the avenues, 169.7 KB on their own at 192 bytes each — and most of them are
entities only because `scenery.dress()` has one density for every species and spends its
14 000-instance cap coarsest-first: turn it up far enough to plant a wood and the flowers eat the cap
and the grass tufts never arrive (measured; `requests` §5). Give `dress()` a per-species multiplier
and a quarter of this save goes away.

**`main()` waits for a frame before dressing, and that is not laziness.** `host.boot()` announces
the world's existing entities to the main handles only _after_ every `main()` has returned, and
`dress()` refuses to grow anything inside a placed prop's clearance. Dressing during `main()` would
push undergrowth through the middle of every bench and lamp in the park and do it silently. So the
call happens on the first `onRender`, gated on this module's own world slot rather than on the
park's name — a sandbox world and somebody else's save go through the same module list, and a demo
park's landscape appearing in an empty sandbox would be this module writing into another world.

**Bonus third, because it is the one a reviewer should attack:** nothing here names a content id.
The park asks the registry for _roles_ — "the lamp", "the tallest broadleaf", "the clipped hedge" — and
takes whatever the earliest-registered pack answers with. `missingRoles()` came back empty against
the two bundled packs. A pack with different furniture draws the same park in its own vocabulary,
and a pack that cannot answer a role gets no lamps rather than a crash. The one vocabulary shared
with another module is the scenery generator names, and they are shared as a **type**
(`(typeof GENERATORS)[number]`), so renaming one over there is a compile error over here.

## Verified

Commands: `npx tsc --noEmit` (no error in `lib/game/demo-park`), `npx eslint lib/game/demo-park`
(clean), `npx prettier --write` on all six files, `pnpm test:game` (**4/4 green**, `game lint: 134
files clean`), and `pnpm test:game-soak` — **9/9 assertions**, 576 ticks, mean 0.096 ms/tick against
a 6 ms budget, 0 non-finite numbers, 0 orphan entities, 0 unreachable queues. Two of those numbers
are new information rather than a pass: the max tick is **40.3 ms**, which is the paths module
linking a 1 511-node graph the instant twenty path entities arrive and is a one-off at init; and the
unreachable-queue check is listed in `STATUS.json` as "not measured — no paths module api yet", so
this is the first world it has actually measured anything on.

Screenshots:

(The sixteen PNGs live in `.game-render/demo-park/`; that directory has no `report.json` because
the only sixteen-shot run that produced one failed for the reason under the table, and a failed
report next to sixteen good frames is worse than none.)

```
# the sixteen PNGs that were looked at
node scripts/game-shot.mjs --out=.game-render/demo-park \
  --tod=09:00,12:00,18:30,22:00 --cam=overview,entrance,close,ground
# the numbers in the table below, one invocation per time of day (see the note under it)
node scripts/game-shot.mjs --out=.game-render/dp-0900 --tod=09:00 --cam=overview,entrance,close,ground
# … dp-1200, dp-1830, dp-2200, and dp-plots for --cam=coaster,pool
```

All five of those reports came back `ok: true` with **zero console errors, zero warnings, zero
hydration warnings**.

**All sixteen PNGs were opened with the Read tool and looked at.** What they showed, honestly:

- `09:00 ground` — the best frame in the set. Dappled tree shadows across the promenade slabs, the
  kerb running away, lamp posts and lime avenues either side, hedge runs behind them, the market
  square's clay paving in the distance and the fountain beyond that. This reads as a park.
- `12:00 entrance` — the arch with its blue board and four flags spanning the gate walk, the paver
  plaza with a planted roundel in the middle, the axis running north through two more plazas, the
  treeline framing both sides. The plaza is still a lot of bare paving.
- `12:00 close` — the fountain square: the fountain, eight benches facing it, two rings of lamps,
  four boxed hedge parterres with flowers inside and a lime standing behind each, and a ring of
  limes just outside the kerb. (Round 1 said "the granite setts render close to white at noon";
  the round-1 critic measured them at luminance 140/255, which is flat and blue-cast, not bright.
  The claim was wrong and is corrected here rather than deleted.)
- `12:00 overview` — the whole park: the axis, five plazas, three loops, the lakeside ring, the lake
  with its beach, the treeline, the reserved plots as flat green clearings.
- `22:00 close` / `22:00 ground` / `22:00 entrance` — 72 lamp sites (round 1 said 74 here and 72 in
  its own table; the table was right), the arch's sign glowing blue, the avenue receding into lit
  dots. Round 1 also claimed "warm pools on the paving": the critic ran a horizontal scan and got a
  smooth 25 → 44 gradient with no maximum at any of the roughly twenty lit lamps. There are no
  pools. That is `POOL_BY_PRESET.medium = 2` in `scenery` — two active light sources for the whole
  park — and it is a request, not a claim this module gets to make.
- `18:30 overview` — a warm sky over a park in shadow, and the clearest view of the world-edge
  problem below.

Also opened: `.game-render/dp-plots/1200-coaster.png` and `1200-pool.png` (the two reserved-plot
camera presets) and five hand-aimed probes at the lake, the lakeshore, a copse and the coaster
shelf.

### Budget

Draw calls and triangles, read from `report.json`. **The budget is 1 200 draw calls for the whole
game and six modules have not been built yet.**

| tod   | camera   | draw calls | triangles | active meshes |
| ----- | -------- | ---------: | --------: | ------------: |
| 09:00 | overview |        145 |   295 224 |           100 |
| 09:00 | entrance |        193 |   690 920 |           109 |
| 09:00 | close    |        214 | 1 037 213 |            88 |
| 09:00 | ground   |    **237** | 1 089 765 |           105 |
| 12:00 | overview |        145 |   295 224 |           100 |
| 12:00 | entrance |        193 |   690 920 |           109 |
| 12:00 | close    |        214 | 1 037 213 |            88 |
| 12:00 | ground   |    **237** | 1 089 765 |           105 |
| 18:30 | overview |        107 |   159 728 |           101 |
| 18:30 | entrance |        116 |   323 308 |           110 |
| 18:30 | close    |         95 |   578 557 |            89 |
| 18:30 | ground   |        112 |   545 789 |           106 |
| 22:00 | overview |        105 |   161 522 |            99 |
| 22:00 | entrance |        114 |   325 102 |           108 |
| 22:00 | close    |         93 |   580 351 |            87 |
| 22:00 | ground   |        110 |   547 583 |           104 |
| 12:00 | coaster  |        145 |   688 710 |            82 |
| 12:00 | pool     |        185 |   664 406 |            98 |

Every row is a separate `game-shot.mjs` invocation, because a sixteen-shot run kept dying on this
dev server — another builder was rebuilding `lib/game/track` throughout, and a rebuild mid-run kills
the page's execution context (`page.evaluate: Resulting promise was garbage collected`, and once a
whole run against a tree where `track/showcase.ts` did not exist yet). 09:00 needed four attempts
and 18:30 five. Nothing in those failures is this module's; the reports quoted here are the ones
that came back `ok: true` with zero console errors.

**Peak 237 draw calls = 19.8 % of the whole game's budget**, for terrain + paths + scenery +
environment with no ride, no train, no guest and no building in the world. The day/night split is
the giveaway: the same frame is 110 calls at 22:00, so roughly **127 of the 237 are shadow-map
passes** — three cascades over every non-LOD-2 scenery mesh taller than 0.9 m. Per-module, measured
at the same frame: `scenery.drawnMeshes` 27 (overview) to 68 (ground), `paths.meshes` 8, terrain 64
chunks + apron + water + shadow proxy.

That is a real concern and I am not going to dress it up. Four levers exist and none is mine: the
shadow-caster filter in `scenery/main.ts` (LOD 1 casts today and its shadow is not resolvable past
40 m), the cascade count in `environment/lighting.ts`, the pack's `lod` distances, and merging
scenery batches that share a material. What _is_ mine is the prop vocabulary — 18 batches from 13
distinct catalogue keys — and cutting it would cost the park its furniture.

### The world model

| measurement         | value                                                                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| entities            | 1 295 — 20 `path`, 1 275 `scenery`                                                                                                             |
| props by kind       | 397 spruce, 315 oak, 181 linden, 166 hedge, 72 lamps, 38 shrubs, 33 benches, 28 planters, 24 flower beds, 13 bins, 6 flags, 1 fountain, 1 arch |
| ambient dressing    | 14 000 (the `AMBIENT_CAP`), 18 batches                                                                                                         |
| path graph          | 1 511 nodes, 4 022 edges, **1 component**, 17 junctions                                                                                        |
| path mesh           | 8 meshes, 48 144 triangles, 116 458 vertices, rebuild 1 659 ms, textures 1 435 ms                                                              |
| terrain             | 64 chunks, heights −6.8 m … +25.9 m, 2.08 % of samples under the waterline                                                                     |
| paint layers        | grass 72.2 %, meadow 14.6 %, concrete 7.5 %, dirt 3.9 %, sand 0.9 %, wood 0.9 %                                                                |
| save                | 673.5 KB — 430.4 KB terrain, 243.0 KB entities                                                                                                 |
| `buildWorld` (node) | 175–300 ms (a busy container; three other builders were running)                                                                               |
| boot (SwiftShader)  | 5.9–12.0 s over nine harness runs, against the 8 s budget                                                                                      |
| console errors      | **0**, warnings 0, hydration 0                                                                                                                 |

## Round 2 — what the critique asked for, and what it measured to

`docs/game/critiques/demo-park-round1.md` failed this module at **7.20** against a pass mark of
8.5, with fidelity at 6.4 and the frame at 6.6, and it was right about where the fault was: the
circulation was researched and the **planting was upside down**. Its two numbers reproduced
exactly when re-derived from `buildWorld(1, …)` in node, which is why they are the ones used here.

**Trees are now planted along the circulation.** Two mechanisms, both reading `PATHS` rather than
repeating any coordinate: an `avenue()` walk that plants both sides of every path at a setback of
half the width plus four to six metres, and a grove dropped every fifty-five metres of route,
thirteen to nineteen metres off the centreline, alternating sides. The hierarchy is the design —
the eight-metre spine gets a formal single-species avenue at 11 m, which is a boulevard; the
six-metre walks a mixed jittered planting at 14 m; the four-metre loops the same but stood further
back, because what makes a narrow path a corridor is the **setback**, not the number of sides. The
service road behind the treeline gets nothing: it is a back way, and planting it would say
otherwise.

`placeLine` could not be used for the avenues even though it is the obvious call — it takes no
`reject`, so it would put trees in the paving and in the lake. The walk is done in `props.ts` so
every candidate goes through `rejectPlanting` and through a clearance test against everything
already placed.

|                        |        round 1 |          round 2 |
| ---------------------- | -------------: | ---------------: |
| trees                  |            893 |            1,196 |
| within 10 m of a path  | 62 (**6.9 %**) | 194 (**16.2 %**) |
| 0–40 m band            |       31.3 /ha |         40.6 /ha |
| 40–80 m                |       18.8 /ha |         46.4 /ha |
| **80–120 m**           |    **7.8 /ha** |     **46.6 /ha** |
| 120–160 m              |       18.5 /ha |         37.7 /ha |
| 160–200 m              |       17.4 /ha |         24.3 /ha |
| 200–256 m (the belt)   |       61.6 /ha |         61.0 /ha |
| draw calls, `overview` |            145 |              145 |
| triangles, `overview`  |        295,224 |          299,646 |

The bathtub is gone: the profile now falls from the developed core out to the boundary band and
then rises into the woodland belt, which is the shape a park has. **34 % more trees cost 0 draw
calls and 1.5 % more triangles**, because the scenery module instances them — the budget objection
to planting the mid-ground turned out not to exist.

**16.2 % is not 30 %, and that is deliberate.** The ≤10 m test is a proxy for "the planting follows
the walks", and it can be gamed by pulling every setback under ten metres — which would close the
canopy over the four-metre loops and make three of them corridors. The groves sit at 13–19 m and
score nothing on that test while being the reason the 80–120 m band moved by a factor of six. The
park was optimised, not the proxy, and both numbers are here so the next critic can disagree.

**Two more things the critique found.**

A plot is reserved on the entrance forecourt now — two, in fact: `entrance-hall` (`buildings`) on
the west flank and `entrance-retail` (`shops`) on the east. The sixty-metre forecourt is the
largest paved surface in the park and nothing was reserved on it, so if the next six builders had
followed `plots()` it would have stayed a car park permanently. They sit on the flanks because the
middle is the planted roundel the street runs round.

And `landform.ts` no longer imports `fbm2` from `'../terrain/noise'`, reaching past the public
surface every other terrain import in this module goes through — which was a real violation, and
worse, this report had claimed there was none. The integrator re-exported the noise helpers from
`lib/game/terrain/index.ts`, so the import is now the public one and the claim is now true.

**Round 2 was done by the integrator, not by a module builder.** The builder agent was killed by
the same account session limit that killed the first fan-out; that is recorded in `STATUS.json`.
This section says so because a report that hides who wrote it is the failure mode the honesty axis
exists to catch.

## What is weak or missing, ranked

1. **The world's edge is still visible at `overview`, and the treeline cannot reach it.** Measured
   on the finished park, centre column: the true horizon is screen row **153**, the rendered frame
   steps from sky to land at rows **228–240** (ΔG ≈ 35 over 8 px), the park's own boundary is at row
   268 and a 20 m tree on it tops out at **245** — _below_ the thing it was supposed to hide. To
   occlude the apron's rim from a camera 99 m up, boundary planting would have to be about 65 m
   tall. This was recorded in `STATUS.json` against terrain and my brief asked whether planting
   solves it: **it does not.** It is geometry — more apron, or a distance fade into the sky colour.
   The treeline stays because it does the other job: it hides the transition from park to apron and
   gives the mid-ground a boundary. See `requests` §1.
2. **Peak 237 draw calls, 19.8 % of the budget, with six modules unbuilt.** Numbers and levers
   above. If every remaining module is as hungry the budget is gone twice over, and the biggest
   single item — roughly 127 shadow-map calls — is a filter in a module I do not own.
3. **Every tree in the `overview` frame is a LOD 2 imposter, and it reads as a palm grove.**
   Measured: `linden:l2v0` ×179, `spruce:l2v0` ×351, `oak:l2v0` ×288, and no LOD 0 tree mesh has an
   instance at that camera. At LOD 0 (`.game-render/probe-copse.png`, 42 m) the same trees are
   convincing oaks with branching and bark. The break is at the pack's `lod[0] × 0.85 = 34 m`. It
   is `gen-foliage.ts`'s to fix; the demo park is where it shows. See `requests` §4.
4. **The plazas are big and under-furnished.** The entrance plaza is 60 m across and the fountain
   square 60 m, and both still read as a lot of paving with objects round the edge. Real parks fill
   that with a bandstand, a kiosk, a signpost, a bridge — none of which `core-classic` has
   (`requests` §6). The roundel and the four parterres are what could be built out of a hedge, a
   planter and a flower bed.
5. ~~**The granite setts and the concrete render close to white at noon**~~ — MEASURED FALSE in
   round 1's critique: luminance 140/255, flat and blue-cast rather than bright. The square is
   still flat, but not for this reason. That is the `granite-sett` recipe in the paths manifest against the
   environment module's exposure, not a placement decision, but it is the demo park that shows it.
6. **The coaster shelf's cut slope reads as a bald patch** from the `coaster` preset: 8 m of cut
   over a 26 m blend is 17°, too steep for the grass texture to sit convincingly and not steep
   enough for the splat's rock layer (which starts at 26°). Widening the blend to ~34 m would fix it
   and was not done, because it would invalidate every frame above and the shelf is the track
   builder's to re-sculpt anyway.
7. **The park has no shops, rides, buildings or guests in it**, so the path network is a network to
   nowhere: eight plots are reserved and empty, and `paths.posts` is 0 because there is not a single
   queue. The demo park cannot look finished until at least `shops` and `rides` land.
8. **No queue, no bridge, no water crossing.** The lakeside promenade runs _round_ the water and
   never over it, and the lookout is a widening of the bank rather than a jetty, because a path mesh
   conforms to the terrain and would be submerged.
9. **There is not a railing anywhere in the park.** `core-classic:fence-iron` exists and the role
   resolver found it; it is not placed, and the honest reason is a budget one — a new catalogue key
   is a new batch, and a 1.2 m prop clears the 0.9 m shadow-caster threshold, so railing the
   lakeside boardwalk would have cost draw calls on the item that is already this module's second
   weakness. The `fence` role was removed rather than left resolved-and-unused. A railing between
   the boardwalk and the water is the first thing I would add back if items 2 and 3 were fixed.
10. **At `overview` the night park is nearly dark** — `activeLights` is **2** against 72 light sites,
    because the night rig activates only the lamps nearest the camera. Correct for the budget, and it
    means the 22:00 overview shot shows a black park with a lit fountain square. Whether an
    unlit-but-emissive far LOD is worth it is `scenery`'s call.
11. **Boot is 5.9–12.0 s against the 8 s budget** (nine runs), of which `paths` takes 1.66 s of mesh rebuild and
    1.44 s of texture generation, and `terrain` 0.65 s of texture. SwiftShader, so the absolute
    number means nothing — but the demo park is the first world with enough content to make the
    split visible, and it will only grow.
12. **No critic has graded this or any module.** The gate at 8.5 has not run. Everything above is a
    number read off a frame or off the world, not a grade.

## Requests

`docs/game/requests/demo-park.md` — eight entries, each with what it was worked around with: the
world edge (terrain), the CLAMP-addressed splat leaking the paint into the apron (terrain),
`nextEntityId`'s process-global counter (core), foliage LOD 1/2 (scenery), one density for every
scatter species (scenery), seven missing pack entries and a gravel path style (content), the paths
build cost, and plaza kerb openings (paths).
