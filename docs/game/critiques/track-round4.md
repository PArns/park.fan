# track — critic, round 4

Module: `lib/game/track/` · commit **`c3d669b`** · graded by an independent critic, not the builder.

Round 3 graded **8.54, a pass by 0.04**, and said so in its own first paragraph: *"inside the noise of
my own axis judgement, and the grader is the same person who wrote the fix … it should be re-taken by
anyone able to grade independently."* This is that re-take. The module has gained four things since —
a boarding station, a night light on it, a fourth layout, and placement by the player — and one of
them is built on a number that does not mean what three documents say it means.

**Weighted total: 7.95. FAIL** (pass is 8.5).

The verdict is not close and it does not rest on the axis I am least sure of. Hold **the frame** at
round 3's 8.4 instead of my 8.0 and the total is 8.07. Hold **report honesty** at round 3's 8.0 as
well and it is 8.20. Both still fail. What moves the grade is §4.1 and §4.2, and neither is a
judgement call: they are two measurements that disagree with the text beside them.

---

## 1. Scores

| #   | Axis                  | Weight |  R3 |      R4 | Why it moved                                                                                                                                                                                                                                                                             |
| --- | --------------------- | -----: | --: | ------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The frame             |   30 % | 8.4 | **8.0** | Two of round 3's three frame complaints are gone — it stands in a park now, not on a plain, and 18:30 reads. But the round's headline object is the weakest surface in the module: a card-flat canopy, a "railing" invisible from eye level, and a platform 4 m in the air on stilts.  |
| 2   | Fidelity              |   20 % | 8.2 | **7.6** | The station's reference work is real and the heartline geometry is right. Against it: the circuit does not close **vertically** (dy up to −3.99 m against \|dxz\| 0.089), the module ships that error as a feature called `footprintDip`, and the platform cannot be boarded.            |
| 3   | Extensibility         |   20 % | 8.8 | **7.8** | Still nothing in a shipped pack (unchanged), and now a regression in kind: `coasterLayouts` is a **manifest** storefront in front of a **TypeScript** catalogue, so a pack can ship a purchasable tile that draws nothing and logs nothing.                                             |
| 4   | Budget and behaviour  |   15 % | 8.5 | **8.5** | Held. 8 meshes per coaster, station 456–864 triangles, the light is a pool and not one-per-ride. Worst frame 589 draw calls against a 1,200 budget. No module dispose/reboot test of its own, and the pool silently unlights a second station.                                          |
| 5   | Determinism and state |   10 % | 9.4 | **9.2** | Still excellent — one owner, wholesale rebuilds, no clock, no RNG. Docked 0.2 because the entire station block is proved on **one** of four layouts, after three station bugs that only measurement found.                                                                              |
| 6   | Honesty of the report |    5 % | 8.0 | **5.5** | `docs/game/reports/track.md` predates every round-4 commit and still lists "**Nothing renders the station**" as weakness 5. And the round's headline figure — "0.089 m of residual" — is a 2-D number set against three 3-D ones, inverting the ranking it claims.                     |

**8.0 × 0.30 + 7.6 × 0.20 + 7.8 × 0.20 + 8.5 × 0.15 + 9.2 × 0.10 + 5.5 × 0.05**
**= 2.400 + 1.520 + 1.560 + 1.275 + 0.920 + 0.275 = 7.950 → 7.95.**

---

## 2. Hard gates

| Gate                                          | Result      | Command / file that answered it                                                                                                                                             |
| --------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zero console errors and hydration warnings    | **✓ pass**  | `.game-render/regrade/report.json` → `console.errors: []`, `console.hydration: []`, `ok: true`. Two `WebGL: INVALID_VALUE: bufferSubData: buffer overflow` **warnings**, filed to terrain and shown to be present in the baseline run by `c3d669b`. Warnings, not errors. `failedModules: []` on all 28 shots. |
| Extensibility ≥ 5                             | **✓ pass**  | Axis 3 = 7.8. Clear of the floor.                                                                                                                                            |
| Diff touches only the module folder           | **✗ BREACH** | `git show --stat --name-only <sha>` over the round's five commits. See below.                                                                                                |
| No barrel import from `@babylonjs/core`       | **✓ pass**  | `grep -rn "from '@babylonjs/core'" lib/game/ \| wc -l` → **0**. `gates.txt` agrees.                                                                                          |
| Nothing at module scope touching `window`/`document`/`navigator` | **✓ pass** | `pnpm test:game-lint` → *265 files clean* (`suite.txt`). Independent grep over `lib/game/track/*.ts` → no hits. |
| `pnpm test:game` green, `tsc` clean, `eslint` clean | **✓ pass** | `suite.txt`: `suite exit=0`; track selftest **163 checks clean**; `gates.txt`: tsc exit 0, eslint 0 errors / 3 warnings (all in `guests` and `rides`, none in `track`), `git status` clean. |

### The scope breach, precisely

Three of the round's five commits reach outside `lib/game/track/`:

- `ce3778c` — the fourth layout. Touches `lib/game/track/layouts.ts` and `types.ts`, **and**
  `lib/game/trains/sim.ts`, `lib/game/trains/selftest.mjs`, `lib/game/demo-park/build.ts`.
  The `trains/sim.ts` change is a rule change (fleet size moves from `min(trainsMax, blocks−1)` to
  the layout's own cap), not a rename.
- `b961728` — placeable. Touches three `lib/game/track/` files **and**
  `lib/game/content/packs/core-classic/pack.json`, three `lib/game/tools/` files,
  `scripts/test-game-registry.mjs`.
- `e3a25ae` — the build plot. Touches `lib/game/track/selftest.mjs` **and** `lib/game/tools/`,
  `lib/game/demo-park/plan.ts`, the content pack, `scripts/test-game-lint.mjs`.

`CRITIC.md` names *"core, another module, **the content packs**, and everything outside `lib/game/`"*
as integrator territory. All four categories are in this diff. The changes are argued in their commit
bodies and none of them looks careless — but the gate is not about care, it is about who signs the
change, and one author playing both roles is exactly the case it was written for. Recorded as a
breach; it is **not** the reason for the verdict, which the weighted total reaches on its own.

`172d692` (the station) and `16d99cb` (the night light) touch `lib/game/track/` and `STATUS.json`
only. Clean.

---

## 3. The frames I opened

All 28 `.game-render/regrade/*.png`, the two `.game-render/place/` shots, the palette sheet, and
crops of those files written to a scratch directory (crops of harness output — no re-render; the
screenshot harness was not run).

### The regrade set is 20 % viewport

**The build palette is open in all 28 frames.** Measured on `1300-coaster.png`: the panel occupies
rows **305–708** — 404 px of 720, **56.1 %** of frame height — across x 12–968, plus the Park panel
at x 982–1268 / y 128–620 and the HUD band above y 118. The unobstructed 3-D area is the band
y 118–304 left of x 982: **183,668 px, 19.9 % of the frame**. Of that band, track geometry is
**6,381 px — 3.5 %** (structural-blue pixel count over the visible band, `1300-coaster.png`).

Six of the seven cameras contain no coaster at all. I opened them to check rather than assume.

- **`1300-overview.png`** — an empty green hillside, the palette, and the Park panel. No coaster,
  no station, no track. Blue-pixel count in the visible band: 850, all sky.
- **`1300-close.png`** — trees, the ferris wheel, a roofline. 1,013 blue px, none of it track.
- **`2230-night.png`** — a dark park with one warm lamp at (375,192) and two faint ride glows. The
  module is not in frame.
- **`1300-ground.png`** — a guest silhouette, trees, and a ~40 px fragment of blue rail at the left
  edge around y 250–290.
- **`0900-coaster.png`** — the coaster is cut by the right frame edge; the station is a 20 px blue
  blob at x ≈ 175. The morning sun is behind it and it reads as a dark tangle.
- **`1830-coaster.png`** — the best of the 28. At 3.4× the structure reads clearly: lift hill with
  its chain dogs, a banked return, distinguishable support bents, and the train parked at the crest
  as a teal box. Grass mean rgb (54.5, 87.0, 58.6) against noon's (72.1, 108.9, 74.7) — **78 % of
  noon luma**, i.e. properly lit. Round 3's *"18:30 is almost unlit"* was measured on the
  **showcase**, and this set contains no showcase frame, so that finding is neither confirmed nor
  cleared here; in the demo park at 18:30 the module is fine.
- **`2230-coaster.png`** — the structure is a flat dark-blue silhouette with no rim light and no lit
  member anywhere. The station light is a single blob about **15 × 6 px**. Its brightest pixel is
  **rgb(106, 124, 143)** at (217, 180) — blue-dominant. `STATION_LIGHT_COLOR` is
  `[1, 0.86, 0.68]`, warm white; the brightest pixel under a warm light should be red-dominant.
  Mean over the station box is (19.8, 28.8, 34.4) against grass (12.2, 25.4, 25.2): **+7.6 R,
  +3.4 G, +9.2 B** — blue gains most. The light is doing work (hotspot luma 121.5 against grass
  luma 22.6, a 5.4× ratio, where at 18:30 the same ratio is 1.55×) but what a viewer sees is a
  cool smudge, not a warm platform. There is no visible pool of light on the ground beneath it.

### The two frames that actually show the module

- **`.game-render/place/build-plot-near.png`** — a player-placed `kleiner-wirbel` on grass, HUD
  hidden. This is the best evidence in the set and it is genuinely good: a legible out-and-back with
  a helix, correct support bents (paired columns, X-bracing between bays, a longitudinal top chord),
  two round rails over a box spine with grey crossties, and a full, well-formed shadow on the grass.
  At 7× the profile holds up — the rails are continuous tubes with a specular roll-off and the ties
  are a **different, desaturated material**, so the "everything is one blue" read I expected is not
  fair to the track itself. Column footings exist but are ~2 px pale-grey slivers that read as
  shadow-map artefacts rather than concrete.
- **`.game-render/place/build-plot-wide.png`** — silhouette holds at distance and the shadow carries
  it. Two things show only here: the far return leg runs at grass height with 1–2 px of support
  under it, and the far rails LOD into a **dotted line** (the ties survive, the sub-pixel rail does
  not).
- **The station, at 4.5× and 12× crops of `build-plot-near.png`** — the round's headline object, and
  the weakest thing I looked at. Two white decks either side of a dark track slot: correct, and the
  arrangement reads at a glance. Above them a **completely featureless flat blue slab** — no fascia,
  no ribs, no gutter, no surface of any kind — which is the largest single-colour area in any frame
  in this review. The "railing" is a pale ribbon lying on the deck edge (see §4.4 for why). There
  are **no stairs, no ramp, no gate and no queue**, and the whole platform stands on stilts in open
  grass with daylight under it.
- **`.game-render/bar-coaster/1300-coaster-bar.png`** and the four tiles in `tiles/coaster/` —
  the layouts render as fine line drawings and are individually recognisable (out-and-back, twister,
  compact loop). The tile PNGs are 99.7 % transparent (mean channel value **0.8/255** over
  320 × 160), so in the bar's 182.4 × 91.2 px well they read as hairline scribbles beside the
  scenery tab's full-colour, shadowed 3-D thumbnails. `report.json` ink fill: nordwind 0.481,
  alte-muehle 0.567, kleiner-kreisel 0.466, **kleiner-wirbel 0.297** — the newest layout, and the
  one a starter plot points you at, is drawn a third smaller than its neighbours. The framing lives
  in `lib/game/tools/thumb-sources.ts`, so this is shared with `tools`.

---

## 4. What to fix, ranked

### 4.1 — The circuit does not close vertically, and the error ships as a feature

Measured over the four layouts by rebuilding them **open** (`closed: false`), which is what
`scripts/game-solve-layout.mjs` does, and comparing the plan residual with the height residual:

| layout          | \|dxz\| (the solver's metric) | dy (excluded by the solver) | \|3-D\| (`ClosureReport.position`) | declared `footprintDip` |
| --------------- | ----------------------------: | --------------------------: | ---------------------------------: | ----------------------: |
| nordwind        |                         0.120 |                      +0.837 |                              0.845 |                    6.00 |
| alte-muehle     |                         0.715 |                      +1.121 |                              1.329 |                       0 |
| kleiner-kreisel |                         0.060 |                      −2.167 |                              2.168 |                    2.18 |
| kleiner-wirbel  |                     **0.089** |                  **−3.990** |                          **3.991** |                **3.99** |

Three things follow, and each contradicts something written down.

**The "0.089 m" is the plan residual and nothing else.** `game-solve-layout.mjs:86-96` defines
`residual()` as a 2-vector, `[b[0]−a[0], b[2]−a[2]]`, with the docstring *"Y is not in it — a
circuit's height closes through its own drops and the blend absorbs centimetres."* On the one layout
the tool was used for, the blend absorbs **3.99 metres**. `layouts.ts:152`, the `ce3778c` commit body
and `STATUS.json` all set that 0.089 against *"the 0.85, 1.33 and 2.17 m the three above were
hand-solved to"* — which are `ClosureReport.position`, i.e. 3-D. Compared like for like,
`kleiner-wirbel` closes to **3.991 m and is the worst of the four**, not 24× the best. The solver
worked; the metric it was pointed at was the wrong half of the problem.

**`footprintDip` is that vertical error renamed.** For kleiner-kreisel and kleiner-wirbel the declared
dip equals −dy to the centimetre. The low point is not a valley: for kleiner-wirbel it sits at
**s/L = 0.748**, which is where the closure blend begins (L−86 m = 0.751·L), and the element table's
own algebra is net zero (+15 m lift, −11, −4, the airtime hill returning). The track simply arrives
4 m low and `closeCircuit` lifts it home. `nordwind` is the counter-example that proves the reading:
its 6.00 m dip is at **s/L = 0.240**, real designed geometry mid-ride, and its tail still comes home
at y = −0.14 with dy of only +0.837.

**The cost is paid twice, and both are visible.** `closeCircuit` spreads the residual over the last
25 % (`CLOSE_BLEND_FRACTION`, capped at 140 m), so on 345 m the brake run and the last two curves are
displaced by up to 3.99 m over 86 m — **4.62 % of the blend**, against 0.60 / 0.95 / 1.55 % for the
other three. And the dip is then handed to `tools` as an anchor lift: `.game-render/place/log.txt`
records the same click at screen (754, 408) resolving to `pos [148.6, 8, -91.5]` in the 07:33 run and
`pos [148.6, 12, -91.5]` in the 07:39 run — **a 4 m rise for an identical click**, which is the
station standing 4 m over open grass in `build-plot-near.png`.

*Fix:* put `dy` in the solver's residual and give it a third free parameter, or state the dip
per-layout as an intentional figure the way `nordwind`'s is. Either way, stop quoting a 2-D number
against 3-D ones.

### 4.2 — The selftest cannot catch any of that

`selftest.mjs:324` asserts `built.closure.position < 15`. Fifteen metres, on a circuit as short as
345 m — 4.3 % of its length. The shipped worst case is 3.991 m, so the check has **11 m of headroom
over the worst thing that has ever shipped** and would pass a layout with a fourteen-metre hole in it.
Every other tolerance in this file is tight (`near(..., 0.001)` for platform length, `0.2` for the
dip, `1` for footprint, `2` for length). This one is the only assertion standing between the module
and the failure mode described in §4.1, and it is two orders of magnitude loose. Pin `|dxz|` and `dy`
separately, at the scale the layouts actually achieve.

Second coverage hole in the same file: the **entire station block** (`selftest.mjs:431-561`, the
winding check, the deck normals, the rider soffit, the boarding height, the burial check) runs on
`TRACK_LAYOUTS[0]` — `nordwind` — and nothing else. `station.ts` shipped with three defects that only
measurement found; a one-in-four sample is not the response to that. The block is already a loop
body away from covering all four.

### 4.3 — A boarding platform nobody can board

No stairs, no ramp, no gate, no entrance — visible in `build-plot-near.png` and confirmed by grep
over `station.ts` (`stair|ramp|gate|entrance|exit` matches only prose in the docblock and a loop
variable named `steps`). Combined with §4.1's 4 m anchor lift the deck floats in mid-air. The
docblock lists four elements of a real station and defers only theming to a scenery pack, so access
is neither built nor deferred — it is unnamed. `STATUS.json` already carries the sibling issue
(*"A PLAYER CAN BUILD A COASTER NOBODY CAN QUEUE FOR"*, filed to tools + paths, station head 28.2 m
from the nearest path against a 14 m service radius); this is the other half of it and it is track's.

### 4.4 — The railing is two horizontal quads and disappears from eye level

`station.ts:337-353` emits, per step and per side, one quad at `ya` and one at `ya − RAIL_THICK`,
both spanning `RAIL_THICK` laterally — i.e. **a top face and a bottom face and nothing else**. No
posts, no lateral faces, no end caps. `RAIL_HEIGHT = 1.05`, `RAIL_THICK = 0.05`. From directly above
(the only angle in this frame set) it reads as a pale kerb; from a guest's eye height it is two
edge-on planes 5 cm apart and vanishes. The docblock's argument — *"a continuous low rail … is what
the eye reads as 'you cannot walk off the side', and it is 40 quads instead of 400"* — is sound, but
the 40 quads were spent on the two faces you cannot see it from. Four more quads per step buys the
sides. The selftest asserts only `station.rail.indices.length > 0`, which is why this is the fourth
station defect of the same class.

### 4.5 — A pack can sell a coaster that does not exist

`elements.ts:451` claims `coasterLayouts` as a pack category and the docblock says a pack entry
*"becomes a placeable tile without this module doing anything"* — true, `lib/game/tools/palette.ts`
reads the raw manifest. But `main.ts:414` resolves the pieces with
`TRACK_LAYOUTS.find(p => p.id === entity.item)`, a TypeScript array, and returns `null` on a miss.
So a third-party pack shipping a `coasterLayouts` entry with a new id gets a purchasable tile, a
ghost, a price, an approved placement, money taken — and **nothing drawn, with nothing logged**.
Compare `rides`, which prints `[game/rides] ride "…" names rig "…", which no pack declares — drawing
a generic machine` (visible in `suite.txt`), and `buildings` and `shops`, which do the same. Track is
silent. The selftest cross-checks the two halves, but only against `core-classic/pack.json`
(`selftest.mjs:577`), so the guard does not reach the packs the gate is about. Minimum fix: a warning
on the miss. Real fix: let a manifest carry pieces, which the element table already supports.

Also unchanged from round 3: **no shipped pack declares a single `trackElements` entry.** Both
bundled packs' keys were enumerated — `core-classic` has `trackStyles`, `trainStyles`,
`coasterLayouts`; `neon-lagoon` has `trackStyles`, `trainStyles`. The extension path is tested and
unexercised.

### 4.6 — The canopy is the flattest surface in the game

At 12× the station roof is one untextured blue rectangle. Every neighbouring module puts a material
on its large flat areas — `suite.txt` shows `buildings` shipping fifteen atlas tiles with measured
per-unit tone spread (pantile sd 12.3 %, zinc 4.7 %, canvas 3.6 %) and `flumes` carrying its night
frames on an emissive material rather than a light. The canopy is 456–864 triangles of the module's
budget and the single largest thing a guest stands under. This is also the cheapest route to a better
night: an emissive strip in the soffit costs no light and no mesh, which is what `STATUS.json`
already proposes.

### 4.7 — At `medium`, a second coaster's station goes dark

`STATION_LIGHT_POOL = { low: 0, medium: 1, high: 2, ultra: 3 }` and `rebuildLights()` sorts by
platform length and slices to the budget. The harness runs `medium` (`report.json`:
`preset: "medium"`). Build a coaster with a longer platform and last night's lit station is unlit
tonight, chosen by a rule the player cannot see. The pool itself is right — `flumes`, `rides`,
`shops` and `scenery` all arrived at it — but the eviction needs to be visible or the light needs to
stop being a light (see 4.6).

### 4.8 — The report is a round behind

`docs/game/reports/track.md` was last written at **`f03034e` (2026-09-09)**, before every round-4
commit. It still says, as ranked weakness 5: **"Nothing renders the station."** It says "the three
layouts, measured" (there are four), "95 checks" (there are 163), and weakness 8 is "No critic has
graded it" (three critiques precede this one). None of §4.1–§4.7 is in it, because it does not know
they exist.

`STATUS.json` is a different matter and mostly does the job the rubric asks of the report: it names
the one-PointLight simplification **as** a simplification, carries the 3.99 / 6.00 dip, both
placement bugs and the un-queueable coaster as open issues, and records the sabotage test that proved
`CONTENT_ID_FREE`. Its one bad claim is the 0.089 m of §4.1, and that same sentence is in
`layouts.ts` and the commit body. Axis 6 is scored on the report; a good STATUS is why it is 5.5 and
not lower.

---

## 5. What is genuinely strong, so the next round does not undo it

Named because a critique that only lists faults invites the wrong repairs.

- **The station's reference work.** Taron, Winja's, Wodan, Baron 1898, cited before the code, with
  the right conclusion drawn: the spline is the **rider's** path, so the deck is `DECK_BELOW_SEAT`
  under the spline and not under the rails, and the canopy soffit is measured off a seated rider's
  raised arms (`RIDER_HEADROOM = 2.2`) rather than off a standing guest. The selftest pins all of it,
  including winding against `FRONT_FACE_SIGN` and UVs in metres. This is what axis 2 exists to
  reward.
- **The track profile.** Two round rails, a box spine, crossties in a different material, and
  support bents with real X-bracing. At 7× in `build-plot-near.png` it holds up.
- **The budget.** Measured by running the pure builders over all four layouts:

  | layout          | track  | supports | station |  total | columns | braces |
  | --------------- | -----: | -------: | ------: | -----: | ------: | -----: |
  | nordwind        | 50,608 |    5,400 |     864 | 56,872 |      42 |    324 |
  | alte-muehle     | 37,296 |   32,712 |     784 | 70,792 |     161 |    584 |
  | kleiner-kreisel | 39,492 |    1,776 |     648 | 41,916 |      20 |     88 |
  | kleiner-wirbel  | 23,092 |    1,308 |     456 | 24,856 |      14 |     67 |

  `.game-render/place/log.txt` reports **16 track meshes for two coasters** — 8 draw calls each,
  **0.67 % of the 1,200-call whole-game budget** in `STATUS.json`. The whole park's worst frame is
  589 calls / 2,163,396 triangles (`1300-ground`). The station costs 456–864 triangles and no light
  of its own beyond the pool. That is a defensible share, stated as a share.
- **Determinism.** `night` is *"written by `onEnvironment`, read by the lights and nothing else"*;
  lights are rebuilt wholesale with the reason written down; the placed entity carries
  `{pack, item, position, yaw}` and no `data`, so one side owns it. `test:game-save-roundtrip` and
  `test:game-lint` (265 files) are green.
- **`nordwind` closing to 0.845 m in 3-D with a real 6 m dip mid-ride** is the proof that this
  generator can do the thing §4.1 says the newest layout does not.

---

## 6. Verdict

**FAIL — 7.95 against a pass mark of 8.5**, and separately a breach of the module-scope hard gate
(§2). This is round 4 of a maximum of four, so per `CRITIC.md` the outcome is recorded in
`STATUS.json` with these six scores and the reason, and the reason the next builder should read first
is §4.1: **a layout was declared solved on a metric that excluded the axis it fails on, and the
failure was then given a name in the manifest.**

I did not write the `STATUS.json` entry — this critique was scoped to one file. It needs
`modules.track` set to round 4, scores `{frame 8.0, fidelity 7.6, extensibility 7.8, budget 8.5,
determinism 9.2, reportHonesty 5.5}`, total 7.95, `gated: false`, `gradedAtCommit: "c3d669b"`.

One process note for whoever runs the next harness: **the build palette was open in all 28 frames of
`.game-render/regrade/`**, leaving 19.9 % of each frame as viewport and this module about 3.5 % of
that. Six of seven cameras contain no coaster. A module cannot be graded on its frame from a set
where it is not in the frame, and the two `place/` shots — HUD hidden, module centred — carried this
entire review. Render the next set with the HUD off.
