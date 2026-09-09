# buildings — critic round 1

**Score: 7.5 · Verdict: FAIL** (pass is ≥ 8.5; every hard gate is clear, the weighted total is not)

Graded at commit `356fbb3`. `lib/game/buildings/` has not changed since `00e5da6` — the four commits
that landed while I was measuring are `ui`/`core` work — so every frame and every number below is
about the same tree. Harness `medium` preset, WebGL2 through SwiftShader, 1280 × 720, against the
**dev server on http://localhost:3001** as commissioned.

---

## 1. The six axes

| #   | Axis                       | Weight |     Score | One sentence                                                                                                                                                                                                              |
| --- | -------------------------- | -----: | --------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The frame                  |   30 % |       6.5 | The brick at 2 m is a real PBR surface and the night street is genuinely handsome — but **83 arch heads and 233.6 m² of gable and mansard end wall are back-faces**, so you see the meadow through the rotunda, the sky through the pavilion and the street's paving through the terrace roof, at every camera. |
| 2   | Fidelity to the real thing |   20 % |       7.2 | The bay module, the mansard break, the 2.05 m door head, the impost blocks and the arcade's lean-to are things somebody looked up; the two-box wall lantern, the 180 mm downpipe, the one-faced clock tower and a 17.7 m three-storey house are not. |
| 3   | Extensibility              |   20 % |       8.0 | I put a lighthouse nothing in the module anticipated into a third pack and it built, styled and resolved `source: 'pack'` with no code change — minus four manifest fields the code never reads. |
| 4   | Budget and behaviour       |   15 % |       8.4 | 47 draw calls / 82,452 triangles at night, reproduced exactly — but A/B'd against a build with the meshes disabled it is **110 draw calls and 324,552 triangles in daylight**, which the report attributes to core and which is this module's own geometry in the cascades. |
| 5   | Determinism and state      |   10 % |       8.6 | No `Math.random`, no `Date.now`, seed off the batch key, byte-identical builds; the gap is a module-scope content registry that `dispose()` never resets. |
| 6   | Honesty of the report      |    5 % |       6.8 | Every number I re-measured was right to the digit, including the pad fit and the Buildings tab — and the two largest things in the frame are a fix §4.2 records as working and a bug the §4.1 check was written not to see. |

**Weighted: 1.950 + 1.440 + 1.600 + 1.260 + 0.860 + 0.340 = 7.450 → 7.5**

Extensibility is 8.0, well clear of the 5.0 floor, so the axis-3 gate does not fire. The module
fails on the weighted total alone.

---

## 2. Hard gates

| Gate                                             | Result                                                                                                                                                                                 | Command / file                                                                          |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Zero console errors / hydration warnings          | **PASS** — `errors: []`, `hydration: []` in both runs                                                                                                                                    | `.game-render/critic-buildings2/report.json`, `.game-render/critic-buildings-park/report.json` |
| Warnings attributable to this module              | **PASS** — the two `WebGL: INVALID_VALUE: bufferSubData: buffer overflow` appear byte-identical in the demo-park run, which contains **0 `building` entities and 0 building meshes**       | scene probe: `pre.buildings = 0`, `stats.drawnMeshes = 0`                                   |
| Extensibility ≥ 5                                 | **PASS** — 8.0                                                                                                                                                                          | §5 below                                                                                    |
| Touched only its own folder                       | **PASS** — `lib/game/buildings/` and both doc files clean; the working tree was clean at `356fbb3`                                                                                        | `git status --porcelain lib/game/buildings docs/game/{reports,requests}/buildings.md`       |
| No `from '@babylonjs/core'` barrel                | **PASS** — 0 hits                                                                                                                                                                       | `grep -rn "from '@babylonjs/core'" lib/game/buildings/`                                     |
| No module-scope `window`/`document`/`navigator`   | **PASS** — 3 hits, all in prose comments (`bays.ts:7`, `kit.ts:794`, `types.ts:83` — the word "window")                                                                                  | `grep -rn "window\.\|document\.\|navigator\." lib/game/buildings/*.ts`                       |
| No `Math.random` / `Date.now` / enums / param props | **PASS** — 1 hit, a comment in `kit.ts:1047` saying `Date.now()` is banned                                                                                                             | `grep -rn "Math\.random\|Date\.now\|export enum\|constructor(private" lib/game/buildings/*.ts` |
| `pnpm test:game` green                            | **PASS** — exit 0 end to end, and `test:game-buildings` **is** in the chain now (`package.json:105,108`)                                                                                 | `pnpm test:game`                                                                            |
| `npx tsc --noEmit` clean                          | **PASS** — exit 0                                                                                                                                                                       | `npx tsc --noEmit`                                                                          |
| `npx eslint lib/game/buildings` clean             | **PASS** — exit 0                                                                                                                                                                       | `npx eslint lib/game/buildings`                                                             |
| Budget met                                        | **PASS** — 110 draw calls at the worst camera against 1,200 whole-game (9.2 %)                                                                                                            | A/B scene probe, §4                                                                         |

**No gate fails.**

One process note. The commissioned showcase run died twice before it produced a report — once on
`page.evaluate: TypeError: Cannot read properties of undefined (reading 'metrics')` at
`game-shot.mjs:253` after five shots, once with `WebGL context lost` + `importScripts … failed to
load` and `boot failed … setting 'exposure'` and zero shots. Both are the dev server recompiling
underneath the harness — the exact hazard `readyHandle`'s own docblock names, except that the
`metrics()` call two lines after it is the one evaluate in the file with no `.catch`. The third run
was clean and is what is graded. Anyone repeating this should expect to run it twice.

---

## 3. The frames I looked at

```
node scripts/game-shot.mjs --url=http://localhost:3001 --showcase=buildings --cam=overview,close,ground --tod=09:00,18:30,23:00 --out=.game-render/critic-buildings2
node scripts/game-shot.mjs --url=http://localhost:3001 --cam=entrance,overview --tod=13:00,22:00 --step=2400 --out=.game-render/critic-buildings-park
```

### Showcase — `.game-render/critic-buildings2/`

| File                | What is actually in it                                                                                                                                                                                                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0900-overview.png` | A street of eight buildings from 132 m: three brick terraces under near-black mansards, a cream arcaded pavilion with a red pantile roof, a rotunda with a terracotta cone, a market hall with a black barrel vault, a teal flat-roofed pavilion, and ten kit pieces on the grass. Reads as a town, not as a field of primitives — and the near end of the terrace has the street's paving showing through its roof. |
| `0900-close.png`    | The clock-tower block at ~44 m, three-quarter. Brick with quoins, sashes with glazing bars, white lintels and sills, two chimneys, a pyramid-roofed tower with a glazed lantern, the rotunda behind. Its **gable end above the eaves is transparent**: the horizon line runs straight through it. |
| `0900-ground.png`   | Eye level on the street: the best daylight frame. Real brick courses, a string course, wall lanterns beside a door, a paved street with a kerb, the pavilion closing the vista. The pavilion's five arched windows each carry a pale blue semicircle — the sky, through the fanlight. |
| `1830-overview.png` | Dusk from 132 m: lit windows scattered over the terraces, four glowing cupolas, one teal sign, a mauve sky. A hard-edged bright green wedge lies across the grass at the left (a shadow-cascade boundary; core's, not this module's). |
| `1830-close.png`    | The clock tower at dusk with two storeys of warm windows, three lit dormers, the tower lantern and the rotunda's lantern alight. Pretty, and already dark: the sun is down.                                                                                                                                |
| `1830-ground.png`   | The street at dusk. Fewer lit panes than 23:00, the left wall dark, one blown-out white pool of lamp light. The report calls this "the best frame in the set"; `2300-ground.png` is better.                                                                                                                |
| `2300-overview.png` | Night. The street reads as inhabited — scattered lit panes, four glowing lanterns, the teal sign legible at 132 m. Every roof is pure black and the silhouettes dissolve into the ground.                                                                                                                  |
| `2300-close.png`    | The clock-tower block at night: individually varied warm panes with the glazing bars still legible, lit dormers, the tower lantern glowing. The brick between the windows is black. Above each lit arched window on the rotunda behind, a dark hole where the fanlight should glow.                        |
| `2300-ground.png`   | The strongest frame the module has: a receding street of lit windows, a warm lamp pool on the near wall, the paving picking up the light, cupolas at the far end. Also the frame where the single point light clips the brick to near-white.                                                             |

### Demo park — `.game-render/critic-buildings-park/`

| File                  | What is actually in it                                                                                                                                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `1300-entrance.png`   | The entrance forecourt with 1,471 guests, the gate, the planted roundel, the avenue north — and **no ticket hall and no grand pavilion**. Both reserved pads are empty ground.                        |
| `1300-overview.png`   | The whole park at 400 m, 1,462 guests, paths, lake, woodland. Nothing from this module is in it.                                                                                                     |
| `2200-entrance.png`   | The same forecourt at night, lamps and the gate sign lit, both pads still dark grass.                                                                                                                |
| `2200-overview.png`   | The park at night. Neutral; this module contributes nothing.                                                                                                                                        |

**The brief's premise is wrong about the tree**: there is no `grand-pavilion` at (−8, −162) and no
`ticket-hall` at (−33, 178). `grep -rn "'building'" lib/game/demo-park/*.ts` returns nothing and the
world I booted holds 1,550 entities of kinds `path`, `scenery`, `shop`, `ride`, `pool` and **zero**
`building`. `requests/buildings.md` §1 is still open.

### The pads, placed by me — `.game-render/critic-buildings-pads/`

| File                        | What is actually in it                                                                                                                                                                       |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `1300-entrance-placed.png`  | Both buildings dispatched into the running park. The pavilion closes the axis 340 m up and looks like it belongs there; the ticket hall is **swallowed by conifers**.                          |
| `2200-entrance-placed.png`  | The same at 22:00 — the hall's lantern and a few windows are the only warm light on the largest paved surface in the park, which is the argument for placing it.                              |

### Crops I read at 4–16× — `.game-render/critic-buildings-crops/`

`rot-arch-zoom.png` (grass through the rotunda's fanlight) · `pav-arch-zoom.png` (sky through five of
the pavilion's) · `gable.png` (the horizon through the clock tower's gable) · `terrace-end-zoom.png`
(blue paving through the terrace's mansard end) · `day-door.png` and `day-lamp.png` (the brick, the
architrave and the two-box lantern at 2 m) · `night-lamp.png` (the clipped lamp pool) ·
`ov-market.png` (the barrel vault and the arcade's lean-to, both right) · `kit-row.png` ·
`tower.png` / `tower2.png` · `terrace-ends.png` · `pads-hall.png` / `pads-pavilion.png`.

---

## 4. Numbers, all from a file the harness or a probe wrote

### Frame metrics — `.game-render/critic-buildings2/report.json`

| tod   | cam      | draw calls | triangles | active meshes | sim ms |
| ----- | -------- | ---------: | --------: | ------------: | -----: |
| 09:00 | overview |        163 |   392,020 |            91 |   0.00 |
| 09:00 | close    |        156 |   391,124 |            84 |   0.00 |
| 09:00 | ground   |        153 |   381,998 |            81 |   0.00 |
| 18:30 | overview |         98 |   125,346 |            92 |   0.00 |
| 18:30 | close    |         91 |   124,450 |            85 |   0.00 |
| 18:30 | ground   |         88 |   115,324 |            82 |   0.00 |
| 23:00 | overview |         96 |   127,140 |            90 |   0.00 |
| 23:00 | close    |         89 |   126,244 |            83 |   0.00 |
| 23:00 | ground   |         86 |   117,118 |            80 |   0.00 |

Boot 10,743 ms, chunks 5,450 KB, `ok: true`. The report claims "153–163 at 09:00, 86–98 after dark".
**Exact.**

Note what that table also says: 18:30 costs 98 draw calls against 96 at 23:00 and 163 at 09:00, so
the sun's shadow cascades are already off — **two of the three commissioned times of day are after
sunset**, and this module is judged on one daylight time.

### The module's own share — scene probe reading `handle.module('buildings').stats()`

Every figure in the report's "what the numbers say" reproduced, at the digit:

| claim                  | report | measured |
| ---------------------- | -----: | -------: |
| buildings              |     23 |       23 |
| batches                |     21 |       21 |
| drawn meshes           |     47 |       47 |
| triangles drawn        | 82,452 |   82,452 |
| unique triangles       | 70,384 |   70,384 |
| windows / lit          | 366 / 200 | 366 / 200 |
| atlas build            | 403–801 ms | 407 ms |
| geometry build (all 23) | ~163 ms | 140 ms |
| heaviest building (pavilion kit + glass + lit) | 15,854 + 208 + 316 | 15,854 + 208 + 316 |
| three terrace houses = one batch | yes | `…terrace-house…:kit inst 3` |

`pools` was caught reporting 32 where the scene said 31. This module is exact on all of it.

### But 47 is the night figure — A/B with the meshes disabled

`for (const m of api.meshes()) m.setEnabled(false)`, same camera, same frame:

| tod / cam        | with buildings | without | **Δ draw calls** | **Δ triangles** |
| ---------------- | -------------: | ------: | ---------------: | --------------: |
| 09:00 overview   |            163 |      53 |          **110** |     **324,552** |
| 09:00 ground     |            153 |      47 |          **106** |     **312,802** |
| 23:00 overview   |             96 |      49 |           **47** |      **82,452** |

The shadow probe says why, and it is not core's: the sun's generator has **3 cascades** and its
render list is 22 meshes, **21 of them this module's `kit` meshes** (glass, lit and sign are
correctly excluded). 47 + 3 × 21 = 110; 82,452 × 3.94 = 324,552. So the report's

> Draw calls in the whole frame: 153–163 at 09:00 … of which this module is 47. (The daytime figure
> is higher because the sun's shadow cascades add passes; that is core's.)

is wrong on the attribution. The passes are core's mechanism and **this module's geometry**: its
daylight share of the 1,200-call budget is **9.2 %, not 3.9 %**. Still inside budget, and the
exclusion of the three non-casting meshes is the right call already made — but a share stated at
night and spent in daylight is not the share.

### Demo park

`.game-render/critic-buildings-park/report.json`: 453 / 403 / 197 / 183 draw calls, 0 errors, 0
hydration. This module's contribution is **0** — 0 entities, 0 batches, 0 meshes, and the lazy atlas
(§4.7) means 0 ms and 0 MB too. With both pad buildings dispatched: **2 batches, 7 meshes, 22,830
triangles**, exactly as claimed.

### Pad fit — reproduced

Dispatched `entity:add` with the two payloads from `requests/buildings.md` §1 and read the meshes'
world bounds back:

| item             | pad (`demo-park/plan.ts:209,242`) | measured world extent                   | overhang |
| ---------------- | --------------------------------- | --------------------------------------- | -------- |
| `grand-pavilion` | x [−36, 20], z [−178, −146]       | x [−35.21, 19.21], z [−174.31, −149.32] | **0.00** |
| `ticket-hall`    | x [−44, −22], z [159, 197]        | x [−42.56, −23.44], z [162.24, 193.76]  | **0.00** |

Identical to the report to two decimals on all eight edges; clearances 0.79/0.79/3.69/3.32 and
1.44/1.44/3.24/3.24 m; pavilion ridge y = 28.54 on a pad at 7 m. `entrance()` returns
`[−6.125, −150.6]` and `[−25.6, 176.375]` — both on the correct side, towards the forecourt and
towards the roundel. **This is the strongest measured claim in the report and it holds.**

### The Buildings tab — reproduced, in two locales

Opened the tab in the demo park and read the DOM: **20 items, all enabled, all localized**, prices
exactly as listed. de: Ziegelwand 24 €, Putzwand 20 €, Rundbogenfenster 32 €, Doppeltür 36 €,
Schieferdach 30 €, Holzboden 12 €, Steinsäule 15 €, Betonwand 22 €, Flachdach 26 €,
Panoramafenster 42 €, Kassenhalle 42.000 €, Wandelhalle 96.000 €, Uhrturmhaus 54.000 €,
Markthalle 61.000 €, Rotunde 33.000 €, Reihenhaus 21.000 €, Gästeservice 26.000 €,
Glasvordach 9.000 €, Bogenwand 3.200 €, Ochsenaugenwand 3.400 €. en identical. No request to `tools`
is needed and none should be filed.

### Light and material, walked

23:00 close (`luma = 0.2126 R + 0.7152 G + 0.0722 B`, 8-bit):

| sample                            | luma |
| --------------------------------- | ---: |
| lit pane                          | 209.7 |
| brick ~0.4 m beside a lit pane    |  22.1 |
| brick between two window rows     |  18.9 |
| brick away from any window        |  29.8 |
| slate roof                        |   8.8 |
| night sky                         |  67.0 |

The wall next to a lit window is **darker** than the wall away from one: the spill is not small, it
is zero. Weakness #2 is accurate and understated on that side.

23:00 ground, where the single pooled `PointLight` is on (`activeLights: 1` at `medium`):

| sample                | luma |
| --------------------- | ---: |
| wall 1 m left of lamp | 246.8 |
| wall in the lamp pool | 216.7 |
| wall above the lamp   | 185.1 |
| wall with no lamp     |  46.3 |
| paving under the lamp |  99.0 |
| paving away           |  65.6 |

So weakness #2 is wrong on the other side: where the module *does* have a light, it clips the brick
to 247 and erases the texture inside a ~3 m pool. It reads as a lens flare, not a lantern.

09:00 overview, direct sun:

| sample                     | luma |
| -------------------------- | ---: |
| sunlit ashlar (pavilion)   | 151.9 |
| sunlit pantile             |  90.5 |
| sunlit grass               |  92.4 |
| sunlit brick               |  89.4 |
| sunlit barrel vault        |  22.8 |
| sunlit mansard slate       |  20.8 |

Slate at 0.23× the brick beside it where the albedo ratio (`#454b54` vs `#9c4b3c`) is about 0.6×.
The roofs are the largest single surfaces in the composition and they carry the least information in
the frame.

### Atlas arithmetic

`TILE_SIZE.medium = 144` (`main.ts:63`) over `TILE_METRES[brick] = 0.9` (`geometry.ts:122`) =
**160 px/m**; `high` 213, `ultra` 249. 4 × 4 tiles × 144 = 576² × 3 maps × 4 B = 3.98 MB, 5.3 MB with
mips. Every figure in weakness #1 checks out, against the art bible's 256 px/m for mid-ground and
512 for what a camera can touch.

### Tests

- `pnpm test:game-buildings` → **65,918 / 65,918 checks passed**, ~1 s.
- `pnpm test:game` → exit 0 end to end, buildings included.
- `pnpm test:game-soak` inside it: 48 park-hours at 100× — 576 ticks in 708 ms, mean 1.23 ms, max
  40.59, **9/9**; 6 park-hours at 2× — 3,600 ticks in 3,819 ms, mean 1.06, max 32.77, **9/9**.

---

## 5. Extensibility, tested rather than read

**The code path**: `manifest.ts:239` `attachBuildingContent(registry)` claims `buildings`,
`buildingStyles` and `buildingBlueprints` through `registry.registerPackCategory` and then reads
**both halves** — `for (const pack of registry.packs()) readPack(pack)` at `:247` and
`registry.onPack(...)` at `:248`; `readPack` at `:197` zod-parses each entry;
`resolveBuilding` at `:447` looks the blueprint up at `:461-468`; `build.ts:105` `buildBuilding`
turns it into three vertex buffers. `grep` for a pack id or item id in `lib/game/buildings/*.ts`
outside `pack.ts` and `showcase.ts` returns nothing.

**The test**: I registered a third pack (`critic-pack`) declaring a *lighthouse* — a 12-sided round
tower on a rubble plinth with a cone roof and a glazed lantern, plus a gabled keeper's cottage
offset beside it, a `lighthouse-white` style with quoins and 1 × 3 glazing, `ground`, `night` and
`sign` blocks. With **no code change** it resolved `critic-pack:lighthouse source=pack
style=lighthouse-white`, appeared among the visible blueprints, built **8,764 triangles / 70 windows
/ 61 lit / 1 door / 3 light sites**, and took a cross-pack style override
(`data.style: 'old-town-brick'` → `#9c4b3c`). `registry.unclaimedPackKeys()` returned `[]`. That is
the best extensibility result I have seen in this project, and it was run, not asserted.

**Is it luck?** Half of it. The route into the build bar rests on three things that predate the
module by the whole project (`037ee79`): `ItemCategory` includes `'buildings'`
(`core/registry.ts:8-22`), `buildingSchema.category` already had `'blueprint'`
(`core/pack-schema.ts:255`), and `tools/palette.ts:34` hard-codes `'buildings'` in
`PALETTE_CATEGORIES`. `pools` has no tab because none of that was there for it. But the module
**checked** rather than assumed — and the part that carries the actual expressiveness, the style and
blueprint vocabulary, is its own, claimed through `registerPackCategory` and readable by any pack.
The shop window was already open; the goods in it are the module's.

**Four manifest fields the code never reads** (−1 each where a property is hard-coded instead):

1. `sign.side` (`manifest.ts:151`, `types.ts`) — the band is always mass 0's `front`
   (`build.ts:262-276`). A pack asking for a sign on the `right` gets one on the front.
2. `night.spill` (`manifest.ts:166`, `types.ts:240`) — the light count is `LIGHT_POOL[preset]`
   (`main.ts:66`), never the blueprint's.
3. `style.wallUpper` (surface, `manifest.ts:79`) and `palette.wallUpper` (colour, `:55`) — declared,
   typed, and read nowhere in `lib/game`. A rendered upper storey over a brick ground floor is one
   of the commonest European facades and the schema advertises it.
4. `mass.id` — declared and unread (cosmetic; `pack.ts` writes `id: 'house'`, `'tower'`).

And one silent drop: **a `sign` on a blueprint whose first mass is `round` produces no geometry at
all** (`build.ts:261` `if (!round)`) — my lighthouse declared `sign: { band: 0.9, side: 'front' }`
and got a sign surface with **0 triangles**, no warning.

One more thing a pack author will meet: `def.size` is documented as "the built extent without the
apron", and `tools/palette.ts` builds the placement ghost from it. My lighthouse declared
`[16, 22, 7]` and landed at **20.8 × 28.1 × 14.2 m** — the ground works alone add up to 3.6 m a
side. `requests/buildings.md` §6 records that nothing validates this; worth saying that the apron is
part of what a building occupies on the ground, so a ghost that fits can still land on a path.

---

## 6. Findings, ranked

### 1. Every arch head is a hole through the building — 83 of them in the shipped packs

`kit.ts:557` `fanTriangles` walks its ring from `cu − r` up and over to `cu + r`, which is
**clockwise as seen from the front**, and hands that to `tri()` — whose contract (`geometry.ts:10`,
`:197`) is *counter-clockwise from the front*. So both fans it emits, the opaque interior backing in
`ctx.kit` and the glass/lit fan in front of it, come out as back-faces and are culled by
`materials.ts:63,85`. What you see through the fanlight is the landscape on the far side of the
building.

Measured, in node, over the shipped catalogue — the fan triangles are the **only** triangles in the
whole build whose winding disagrees with their own vertex normal:

| blueprint        | fans | inverted triangles (kit + lit) |
| ---------------- | ---: | -----------------------------: |
| `grand-pavilion` |   49 |                      392 + 392 |
| `market-hall`    |   25 |                      200 + 200 |
| `rotunda`        |    7 |                        56 + 56 |
| `wall-arch` (kit piece) | 1 |                        8 + 8 |
| `wall-window-arched` (kit piece) | 1 |               8 + 8 |
| the other four blueprints | 0 |                          0 |

In the frames: `.game-render/critic-buildings-crops/rot-arch-zoom.png` — a bright grass-green
semicircle sitting on a correctly-backed dark sash, at 44 m; `pav-arch-zoom.png` — five pale blue
caps on the pavilion's arched windows at 132 m; `kit-row.png` — the same five from the street.
At night the `lit` fan is inverted too, so a lit arched window glows in its rectangle and is a black
hole above it (`2300-close.png`, the rotunda).

The report's §4.2 records this as fixed — "The backing is in `fanTriangles` now and both callers use
it" — and its own next sentence is the warning it needed: *"The second render looked identical to
the first and I nearly recorded the fix as working."* It still is not working. **Fixed looks like**
`tri(target, centre, ring[i + 1], ring[i])` (or walking the ring the other way), and a check in
`selftest.mjs` that no triangle in any build disagrees with its own vertex normal — twenty lines,
and it would have caught this and finding 2 together.

### 2. The gable and mansard end walls are inside out — 233.6 m² across three of seven blueprints

`roofs.ts:200-207` authors the gable wall as `p(end*along, −span, eaveY) → p(end*along, +span,
eaveY) → apex`, and `addTriangle` (`geometry.ts`) derives the normal from that winding. At the `+x`
end the normal comes out `(−1, 0, 0)`; at the `−x` end `(+1, 0, 0)`. **Both point into the
building.** `mansardRoof` has the same bug independently. Measured off the built geometry:

| blueprint        | inward-facing end wall | colour    |
| ---------------- | ---------------------: | --------- |
| `grand-pavilion` | 2 × 54.6 = **109.2 m²** | `#efe4cd` render |
| `terrace-house`  | 2 × 36.3 = **72.6 m²**  | `#454b54` slate  |
| `clock-tower`    | 2 × 25.9 = **51.8 m²**  | `#9c4b3c` brick  |

That is not a subtle artefact. `.game-render/critic-buildings-crops/gable.png`: the clock tower's
gable at 44 m, with the horizon line running unbroken through the triangle between the barge board
and the roof plane. `terrace-end-zoom.png`: the near end of the terrace row at the **overview**
camera, with a wedge of the street's blue paving visible through the mansard. Three terrace houses
stand on that street, so 217.8 m² of it is on the screen at once.

This is the same class of error as §4.1's `addPrism`, and it survived because the check written for
§4.1 measures *roof planes* — and `roofs.ts:200` says, in a comment, "The gable walls … they are
wall, not roof". The check was written around the surface that was about to break.
**Fixed looks like** swapping the two eaves vertices in both `gableRoof` and `mansardRoof`, and the
same all-triangles normal check as finding 1.

### 3. A night facade is lit windows on a black wall, and where it is not, it is blown out

Numbers in §4. Lit pane 209.7 against brick 22.1 fifteen pixels away, and the brick beside a lit
window is *darker* than brick with no window near it — so the emissive contributes nothing to the
wall at all. Meanwhile the one `PointLight` the `medium` preset allows clips the brick to 246.8 over
a ~3 m pool (`night-lamp.png`: the mortar joints vanish inside it and the lantern itself is a dark
blob in the middle of its own glare). The module names half of this in weakness #2 and misses the
other half. **Fixed looks like** a small emissive halo quad around each lit pane (it is two triangles
on a surface that already exists) and an intensity/falloff on the pooled light that does not clip a
0.37-albedo brick at 1.5 m.

### 4. The roofs are black holes at every camera

Sunlit slate 20.8 against sunlit brick 89.4 and sunlit grass 92.4 — 0.23×, where the albedos differ
by about 0.6×. The barrel vault (22.8) is the single largest surface in `0900-overview.png` and
carries no readable information at all; the mansards are the second largest. At 23:00 the slate is
8.8 against a 67.0 sky, so the silhouettes dissolve. The atlas tile is not the problem (`slate` sd
10.9 %, `pantile` 12.3 % in the selftest); the palette hex `#454b54` on a steep plane at a low sun
is. **Fixed looks like** lifting the slate palette entries — content, one line in `pack.ts` per
style — and checking the result at 09:00 and 23:00, not at noon.

### 5. The wall lantern and the downpipe are placeholder geometry at 2 m

`day-door.png` and `day-lamp.png` at 4–5×: the lantern is a dark cuboid hood on a mustard cuboid,
axis-aligned, with no bracket, no glazing bars and no bottom; the downpipe is a 6-sided tube of
radius 0.09 m — **180 mm**, twice a real one — in the same off-white as the string course, with no
hopper, no shoe and no brackets. They are the two props a visitor's eye lands on beside a front door
and they are the only things in that crop that read as programmer art. The brick beside them does
not, which makes them worse rather than better.

### 6. A clock tower with one clock

`build.ts:283` draws exactly one dial, on the `front` frame, for a box mass; the four-faces-on-an-
octagon branch at `:288-300` is for `round` masses only. `clock-tower`'s tower is a 5.6 × 5.6 m box,
so three of its four faces are blank, and I could not find the dial in any of the nine showcase
frames — `tower.png` shows the facet a street visitor sees carrying a louvred vent and nothing else.
A town-hall clock tower has a dial on every face it can be read from. This is also a hard-coded
property where the manifest has a field: `mass.clock` is a diameter and says nothing about how many.

### 7. The reported budget share is the night one

§4. 110 draw calls and 324,552 triangles in daylight, not 47 and 82,452. The engineering is right —
21 casting meshes, glass/lit/sign correctly excluded — but the report calls the difference core's
and it is this module's geometry going through the cascades three more times. **Fixed looks like**
one sentence in the report and, if it ever matters, merging the per-type `kit` meshes for the shadow
pass.

### 8. `dispose()` does not reset the module-scope content registry

`manifest.ts:181-185` keeps `styles`, `blueprints` and `warned` in module scope; `main.ts:508-519`
disposes batches, lights, materials and the atlas and never calls `resetBuildingContent()`, which
exists and is used only by the selftest. Across a dispose/reboot a blueprint from a pack that is no
longer registered stays resolvable by bare id (the `blueprints.get(wanted)` fallback at
`manifest.ts:463`), and a malformed pack warns **once per process** rather than once per boot —
which is precisely the case where somebody is reloading to see whether they fixed it.

### 9. Four manifest fields with no effect, and a sign that silently disappears

§5. `sign.side`, `night.spill`, `style.wallUpper` + `palette.wallUpper`, `mass.id`; and `sign` on a
round first mass builds 0 triangles with no warning.

### 10. A three-storey terrace house 17.7 m to the ridge

`pack.ts` `terrace-house`: 3 storeys × 3.4 m + 0.45 plinth = 10.65 m to the eaves, and the mansard
takes it to 17.67 (measured off the build; the declared `size[1]` is 17.6, so §4.3's 22.9 → 17.6 fix
worked and the declaration was moved to meet the geometry). A three-storey European terrace runs
13–15 m to the ridge. With `cornice: 0.4` / `corniceOut: 0.3` on top the eaves band reads as a heavy
white ledge (`terrace-end-zoom.png`) that visibly widens the building. Content, not code.

### 11. Kit pieces: fixed, but still ten slabs on a lawn

§4.6's fix is real — they face the visitor and the roof pieces sit on a metre of wall
(`kit-pieces.png`, `kit-row.png`). But a Panorama window is still a teal rectangle standing in
grass and a Double door is a brown leaf leaning at an angle beside it. The showcase would read
better with them on a short plinth run along the pavement, which is what a builders' merchant's yard
looks like.

---

## 7. One finding that is the integrator's, not the module's

**The reserved pads are planted over, and the exclusion mechanism cannot see them.**

`.game-render/critic-buildings-pads/1300-entrance-placed.png` and its crop `pads-hall.png`: with the
ticket hall dispatched onto its own reserved pad, conifer crowns grow **through the roof plane** over
roughly 40 % of it and across most of the front wall. The building is not readable as a building.

The diagnosis is not "the derived radius is too small". I queried the world: **no scenery entity
stands inside either pad rectangle except street furniture** — the `pavilion` pad
(x [−36, 20], z [−178, −146]) holds **0** entities, and the `entrance-hall` pad
(x [−44, −22], z [159, 197]) holds exactly three: `lamp-victorian` at (−26.1, 185.0),
`lamp-victorian` at (−26.1, 171.1) and `planter-round` at (−29.0, 178.0). All three fall **inside
the built footprint** x [−42.56, −23.44] × z [162.24, 193.76] — two lamp posts and a planter inside
the ticket hall. The trees are outside the pad and overhang it.

So two things are needed and `scenery/main.ts`'s footprint-derived radius gives neither:

1. A **reserved pad is an exclusion zone even when it is empty.** `PADS` in `demo-park/plan.ts`
   carries `owner`, `halfX`, `halfZ` — a pad whose owner is not `park` should keep planting and
   street furniture off it, or the first builder to place a building on it places it in a wood.
2. The radius must come from the **crown**, not the trunk. These conifers are outside the pad and
   their canopies are on the roof.

The pavilion pad is clean, which is the control that makes the point: it is not that the derived
radius fails, it is that nothing was ever derived for a pad with nothing on it.

---

## 8. What is genuinely good, and should not be lost fixing the above

- **The brick.** `day-lamp.png` at 2 m: stretcher bond, mortar joints, per-brick tone, a normal map
  that lights each brick's top arris. Nothing in this frame is flat colour, and the selftest's tone
  spreads (brick sd 10.2 %, shingle 14.1 %, pantile 12.3 %) are measured rather than asserted.
- **The pattern language.** `"w* D w*"` on a 26 m wall and on a 14 m one, flexible groups absorbing
  the remainder outer-first, `d` becoming a full-height casement above the ground floor. It is the
  reason a pack can write a building instead of a mesh, and it is 125 lines.
- **The extensibility, which is real and which I broke a lighthouse against.** Two extension
  categories claimed properly, both halves of the registry read, no id switches anywhere, a warning
  and a fallback block instead of a hole when a blueprint is missing.
- **The batching.** Two to four meshes per building *type*, three terrace houses in one batch and
  three matrices, seed off the batch key so two copies cannot silently inherit one another's
  variation.
- **The lazy atlas.** A park with no buildings pays nothing — measured, 0 meshes and 0 batches in the
  demo park — and the rng draw stays at `main()` so the stream does not fork.
- **The pad measurement.** Executed against the running park, read back out of the scene, and it
  reproduces to two decimals. That is the standard for a claim of this kind.
- **The night street at eye level** (`2300-ground.png`). Individually varied panes, glazing bars
  still legible inside them, a warm pool on the paving, four cupolas at the vanishing point. Fix the
  wall spill and this is the frame that sells the module.
- **The self-test.** 65,918 checks in a second, and the two things it proves that no frame can — a
  synthetic third pack building, and the declared `size` matching the geometry within 8 %.

---

## 9. Verdict

**FAIL at 7.5.** No hard gate fails; the module is well built, honestly reported on every number,
and genuinely extensible. It fails because two classes of geometry in it are inside out — 83 arch
heads and 233.6 m² of roof-end wall — and both are visible as holes in the buildings at every camera
and every time of day I photographed. Both are one-line winding fixes. The check that would keep
them fixed, and would have caught them the first time, is the one the module already knows how to
write: it wrote it for roof planes after §4.1, and the next round should generalise it to *every*
triangle in a build rather than to the surface that happened to break last.
