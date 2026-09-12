# `scenery` — builder report

Procedural props, foliage, path furniture and the landscape scatter. Sixteen files in
`lib/game/scenery/`, no file touched outside the folder.

## What exists

### Module

`lib/game/scenery/index.ts` exports `sceneryModule` (`deps: ['core','terrain']`, `kinds:
['scenery']`) with `sim`, a dynamically imported `main`, and `showcase`. `index.ts` is worker-safe:
it reaches Babylon only through `await import('./main')`, and everything a sim file can reach —
`catalog.ts`, `placement.ts`, `scatter.ts`, `noise.ts` — is DOM-free and Babylon-free.

### Public API — main (`@/lib/game/scenery/main`, `SceneryMainApi`)

| Call                                 | What it does                                                                                    |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `catalog()` / `spec(key)`            | every placeable prop, `pack:item` keyed, plus the module's own `ambient:*` species              |
| `place(key, x, z, opts?)`            | one prop; returns the entity id. `y` from the terrain unless given                              |
| `placeLine(key, a, b, opts?)`        | a run — fence panels, an avenue of lamps. Spacing adjusts so the run ends where it was asked to |
| `scatterBrush(key, x, z, r, opts?)`  | a disc of props with Poisson-ish spacing, optional weighted species mix                         |
| `remove(id)`                         | dispatches `entity:remove`                                                                      |
| `dress({bounds, density, woodland})` | the landscape scatter. **Not entities** — re-derived from the seed. Returns the instance count  |
| `clearDressing()`                    | drops it again                                                                                  |
| `preview(key)`                       | a standalone `TransformNode` copy at LOD 0 for a build ghost; the caller disposes it            |
| `stats()`                            | props, ambient, batches, drawn meshes, triangles, light sites, active lights, texture/build ms  |

Placement goes through `ctx.dispatch('entity:add', …)`, never straight into a batch — so a save,
the demo-park factory, the tools module and a player's click all arrive down one path.

### Public API — sim (`ScenerySimApi`)

`list()`, `count()`, `catalog()`, `near(x,z,r)`, `nearestFurniture(kind,x,z,max?)` (benches, bins
and lamps for guests and staff), `blocked(x,z,r)` (placed props **and** the ambient dressing),
`ambient(bounds)`, `settings()`. The index is built from the `entity:*` event stream and rebuilt in
`rebuild()`.

### Owned state

`world.modules.scenery = { woodland: string[], density: number, dressed: boolean }` — three fields,
the dressing settings and not the dressing. Command: `scenery:dress`. Event: `scenery:dressed`.
Entity kind: `scenery` (both pack `scenery` and pack `foliage` items are this kind).

### Generators — 23, all parametric

`tree-broadleaf`, `tree-conifer`, `tree-palm`, `shrub`, `hedge`, `flowers`, `grass-tuft`, `rock`,
`bench`, `bin`, `lamp-victorian`, `lamp-modern`, `planter-round`, `fence-iron`, `flag`,
`entrance-arch`, `sign-post`, `fountain-tier`, `parasol`, `lounger`, `light-strip`, `neon-palm`,
`marker`. Every one reads the manifest entry's own `footprint`, `height` and `night.light`.

### Materials and textures

Eleven shared materials over eight procedurally generated PBR sets (albedo + normal + ORM, all
three derived from one height field): bark, leaf (alpha-tested), needle, moss (solid foliage),
paint, metal, wood, stone, fabric, plus a still-water material for the fountain and one emissive
per night-light colour. `metadata.foliage = true` on the three foliage materials, `envExempt` on
the emissives and the contact decal; everything else is left modulated, so a wet bench darkens.

Wind is a `MaterialPluginBase` injecting at `CUSTOM_VERTEX_UPDATE_WORLDPOS`, driven by a custom
`swayWeight` vertex attribute (0 at a root plate, 1 at a leaf tip) and by `EnvironmentState.windMs`.
GLSL only; on WebGPU it is not attached and the foliage stands still.

### The extensibility gate

`catalog.ts` resolves a manifest's `procedural` string through five steps: exact name → family
before the first dash (`lamp-art-deco` → `lamp`) → `furniture` → `category` / foliage `kind` → a
sized marker, logged once with the key and the name that missed. `fallback: true` travels with the
spec so `main.ts` warns exactly once per key.

## What I verified

`npx tsc --noEmit` prints nothing for `lib/game/scenery`. `npx eslint lib/game/scenery` clean,
`prettier --check` clean, `pnpm test:game` green (save round-trip, registry, lint over 108 files,
i18n, 48-hour soak). `pnpm game:teardown` green across three dispose/reboot cycles — the module's
lights, meshes, materials and textures come back.

`lib/game/scenery/selftest.mjs`, **20 checks, all passing** (not in `pnpm test:game` yet — request
1). Each step of the fallback chain; all 21 shipped scenery and foliage entries resolve with no
fallback; a synthetic third pack's new bench/lamp/birch resolve and keep their own numbers; two
`scatterBrush` runs on one seed are identical and on another seed are not; no two scattered props
are closer than the species clearance; `placeLine` lands on its endpoint; `evaluateScatter` gives
the same 794 instances whether the field is asked for whole or in two halves, and nothing is
scattered on paving or under water.

### Screenshots I opened and what I saw

`node scripts/game-shot.mjs --showcase=scenery --cam=overview,close,ground --tod=09:00,18:30`
→ `.game-render/showcase-scenery/`. **0 console errors, 0 warnings, 0 hydration warnings** in every
run.

- **`0900-close.png`** — the fountain plaza: a tiered stone fountain with water discs at three
  levels, six benches ringing it at 7.6 m (iron end frames, timber slats, both reading as separate
  materials), four Victorian lamps, four planters with flowers over soil, boulders on the lawn, a
  clipped hedge run and an iron railing along the path, tree stands behind. Contact decals are
  visible as soft ellipses under the benches and lamp bases. This reads as a park.
- **`0900-ground.png` / `1200-ground.png`** — eye level under the entrance arch, looking down the
  avenue. The two stone piers frame the shot, the pennant run crosses the top, the path recedes to
  a vanishing point with lamps, benches, a bin, railings, hedge and grass tufts along it, and trees
  on both sides with real trunks and layered canopies.
- **`1830-ground.png`** — the same avenue at dusk: the lantern lenses light up and recede down the
  path in a line. Legible and, to my eye, the best frame in the set.
- **`1830-close.png`** — the plaza at dusk, four lit lamps, the fountain lit from beside it.
- **`*-overview.png`** — from 340 m the layout reads: path, plaza, three meadow patches, seven tree
  stands and the woodland thinning towards the edges.

### Numbers

| Preset (12:00)   | Frame draw calls | Frame triangles | Scenery active meshes | Scenery instances drawn |
| ---------------- | ---------------- | --------------- | --------------------- | ----------------------- |
| `overview` 340 m | 118              | 165 k           | 18                    | 299                     |
| `close` 40 m     | 217              | 617 k           | 59                    | 3 333                   |
| `ground` 12 m    | 251              | 640 k           | 68                    | 3 242                   |

Measured with a Playwright probe over `scene.getActiveMeshes()`. The frame totals include terrain
(26–39 active meshes), the sky dome and the four cascaded shadow passes; scenery's own share is the
mesh column. 86 meshes exist in total across every batch, LOD level, variant and material part —
3 242 props drawn from 68 of them at the busiest camera. Boot cost of the module: procedural
textures 9 sets, `stats().textureMs` and `buildMs` are reported live.

Headless Chromium is SwiftShader, so the 0.7–1.3 fps in `report.json` means nothing; draw calls and
triangles are the budgeted numbers.

## Round 2 — three fixes, and one correction to another critic

`docs/game/critiques/scenery-round1.md` failed this module at **7.10** against 8.5: frame 6.8 ·
fidelity 6.5 · extensibility 7.0 · budget 7.2 · determinism 9.5 · report honesty 6.5, every hard
gate passing. It is the most useful critique written on this branch so far, partly because it
**corrected an earlier one**.

**The far imposter is not species-blind — both species end in a rectangle.** The demo-park critic
had reported the LOD 2 form as species-blind and blamed a missing branch; `gen-foliage.ts` branches
per species and always did. What both branches shared was `addCard`, which draws a quad, so a
spruce's silhouette was a rectangle and a broadleaf's a disc of leaves above a bare stick — a palm.
At the `overview` camera 1,289 of the demo park's 1,290 trees are drawn this way, so those few
vertices are what the entire mid-ground of this game looks like.

`addCard` takes a `profile` now — half-width multipliers from the bottom edge to the top — so a
card is a strip rather than a quad, and the two imposters get `CONIFER_SPIRE` and
`BROADLEAF_CROWN`. The broadleaf's crown also drops from 0.68 h to 0.66 h with the trunk running to
0.46 h, so it sits _in_ the canopy instead of holding it up at arm's length. Costed against the
alternative before it was written, and the critique did the costing: pushing the LOD break out far
enough to draw real trees at that distance adds **263,000 triangles and doubles the frame**; giving
the imposter a profile added **18,648, i.e. 6.2 %**, at unchanged draw calls.

**The triangle allocation was upside down, and neither earlier critic saw it.** Measured by the
scenery critic: at `ground`, `meadow-flowers` is 154,848 triangles (**35.9 %**) of this module's
431,300 and `hedge-box` 73,364 — 62 % of the budget on ground cover against 16 % for all 1,344
trees. At `overview`, `hedge-box` alone is 29,184 of 79,490 (**36.7 %**) for seventy-six one-metre
hedges seen from 340 m, more than every tree in the frame. So: at LOD 2 a hedge is one blob at
subdivision 1 across its whole footprint instead of four at subdivision 3, and a flower bed is
three clumps at subdivision 1 instead of four at 3. The near and mid forms are untouched.

Net at `overview`, including the +18,648 the tree silhouettes cost: **299,646 → 290,262 triangles,
down 9,384, at an unchanged 145 draw calls.** Better trees for fewer triangles.

**A pack registered after boot never reached this module.** `buildCatalog(ctx.registry)` ran once.
The critic registered a pack afterwards and watched `registry.items('foliage')` go 7 → 9 while this
module's catalogue stayed at 26 with every new key resolving to `null` — nothing subscribed to
`registry.onPack`. A pack loaded from a URL, which `loadPackFromUrl` exists for, was invisible to
the one module whose job is drawing content. It rebuilds on `onPack` now and detaches in `dispose`.

**The two lamps: both earlier critics were right and they do not conflict**, which the scenery
critic settled with its own numbers. 74 light sites, 72 lamp entities, `POOL_BY_PRESET.medium = 2`.
Both pool lights run at 63.0 at 22:00 and visibly light bench, hedge and grass — the environment
critic's finding. No lamp puts a pool on _paving_ in any night frame — the demo-park critic's
finding. The mechanism is that all eight `path-*` materials and `terrain-ground` carry
`maxSimultaneousLights = 4` while scenery's carry 6, the scene holds five lights, and the lamps are
at `renderPriority = -1`: two of seventy-two sites hold a light, and what they reach is scenery,
not path. Raising the pool is not the fix on its own; the path materials' light budget is the other
half, and it belongs to `paths`.

**Round 2 was done by the integrator**, the builder having been killed by the account session
limit. What is left open, with the critic's numbers, is below.

## What is weak, ranked and honest

1. **The sky is black at 09:00 and 12:00 in every one of my shots.** That is the environment
   module's known wave-1 failure, not mine — but it means I have judged foliage colour, the
   seasonal tint and the wet-surface response under a light rig that is wrong. When the sky lands,
   the leaf and bark palettes want re-checking; I have deliberately **not** compensated by making
   the albedos brighter than they should be.
2. **Only one pooled lamp reaches the ground.** Two on `medium`, four on `high`, six on `ultra` —
   but the terrain material's `maxSimultaneousLights` is Babylon's default 4 and `sun`, `sky` and
   `env-moon-light` take three of those slots. The props under a lamp are lit correctly (scenery
   materials ask for 6); the path is lit by one lamp at a time. Request 2.
3. **The trees are card-based canopies and read as cards from inside one.** At LOD 0 within about
   four metres you can see individual quads. The alpha mask, the outward-bent normals and the
   subsurface translucency get it most of the way; a proper answer is a second canopy layer of
   cross-cards under the shell, which I have not written.
4. **The far LOD (level 2) is three crossed cards and a two-segment trunk.** It holds at 120 m+ in
   the overview, and it pops when it takes over — there is no cross-fade. A dither fade over the
   switch distance is the fix and needs a shader define I did not add.
5. **The contact decal is a flat disc.** On a slope its rim clips into the ground; the showcase is
   flat so no screenshot shows it. Projecting it or reading the terrain normal would fix it.
6. **`refresh()` calls `thinInstanceRefreshBoundingInfo` per mesh per rebucket**, which walks every
   matrix. At 3 300 instances and three passes a second it is a millisecond or two of main-thread
   work I have not profiled properly under a real GPU. A tile-based bucket (assign an LOD per 64 m
   tile, rewrite only tiles whose level changed) would make it free; the per-instance version is
   what is written.
7. **The stone on the entrance-arch piers reads as rough rock, not dressed masonry.** One
   generated stone texture serves boulders, planters, the fountain and the arch, and the arch is
   the one place it is wrong.
8. **`neon-palm`'s `cycle` mode animates the pooled light's colour but not its emissive geometry** —
   the tubes glow one fixed colour while the light beneath them cycles. It needs a per-material
   colour animation for cycle-mode props, which I scoped out.
9. **The ambient scatter is a single `dress()` over a rectangle, not streamed.** It is capped at
   14 000 instances and evaluated once; a full 512 m park at close-up density would exceed that and
   thin out. Streaming it in tiles around the camera is the real answer.
10. **Season and weather are read, wind direction is invented.** `EnvironmentState` carries
    `windMs` but no direction, so the flags and the foliage lean along an angle derived from the
    day and minute. It is plausible and it is not the weather's.

## Requests for core

`docs/game/requests/scenery.md` — six, none blocking: wire the self-test into `pnpm test:game`;
raise `maxSimultaneousLights` on the ground material (or put it in `QualitySettings`); a
documentation fix (`SimHandle` has `rebuild`, not `deserialize`); a note that the `overview`
fallback preset sits outside most LOD ranges; the showcase paints its own path until `paths`
exists; and localized prop names are the ui module's `Registry.name` call, not new keys.
