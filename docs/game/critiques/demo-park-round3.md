# demo-park — critic, round 3

Module: `lib/game/demo-park/` · the world behind `/game` and behind `?park=demo`, which is the
default · commit `c3d669b`.

Round 1 graded **7.20**, round 2 **7.99**, both against a pass mark of 8.5. Round 2's three asks
were: measure boot properly, ship an information point, and fill the plots. The plots are the one
that moved — the park now carries a coaster on the `coaster` shelf, a tube slide with its own
splashdown lane on the `flumes` pad, and a new 72 × 128 m `build-plot` reserved for the player and
left empty on purpose.

**Weighted total: 7.30. FAIL** (pass is 8.5). No hard gate failed. The score is *below* round 2's
and the reason is not that the park got uglier: it is that putting two machines on two pads proved
that the pads are 2.3–2.9× too small for the content the game ships, that the park's own centre of
mass sits on nothing, that nothing in it stands against the sky, and that the largest single
reservation in the park is now a lawn. Round 3 did not create those faults. It made them
measurable, and this critique measures them.

Every number below comes from `.game-render/regrade/report.json`, `.game-render/place/log.txt`,
the two harness transcripts in the scratchpad (`gates.txt`, `suite.txt`), `pnpm game:day-budget`
run fresh at this commit, or a pixel measurement of a named PNG. All 28 regrade frames and three
of the four `place/` frames were opened and looked at (§3).

## 1. Scores

| #   | Axis                       | Weight |  R2 |      R3 | One sentence                                                                                                                                                                                                            |
| --- | -------------------------- | -----: | --: | ------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The frame                  |   30 % | 7.8 | **7.6** | `1300-entrance.png` is a real theme-park photograph now — axis, crowd, pavilion, coaster, wheel — but `close` and `night` both anchor on the centroid of everything built and both frame empty lawn.                  |
| 2   | Fidelity to the real thing |   20 % | 7.5 | **6.8** | Neither machine fits its plot (coaster 90.2 × 90.2 m box on a 58 × 48 m pad), the coaster stands 153 m from the nearest other ride where the flat rides sit 23–35 m apart, and the park has no skyline and no centre. |
| 3   | Extensibility              |   20 % | 8.3 | **7.3** | `missingRoles` is still `[]` and shops are still chosen by need, but the world factory now names two layout ids and pins three coordinate constants to them, with fallbacks that place an unmeasured machine.          |
| 4   | Budget and behaviour       |   15 % | 7.2 | **6.6** | Peak **589 draw calls = 49.1 %** of the whole-game budget with 8 of 24 modules built, and boot is **17,911 ms** against 8 s — on the dev server again, which is round 2's number-one ask undone.                       |
| 5   | Determinism and state      |   10 % | 9.5 | **9.3** | Still seeded-only, still byte-identical, no wall clock — with the pad re-roll found, measured and written down, and accepted rather than fixed.                                                                        |
| 6   | Honesty of the report      |    5 % | 9.2 | **5.5** | `docs/game/reports/demo-park.md` was last written 2026-09-07 and contains **zero** occurrences of `build-plot`, `kleiner-wirbel` or `splashdown`; it still ranks "the park has no shops, rides, buildings or guests".  |

**7.6 × 0.30 + 6.8 × 0.20 + 7.3 × 0.20 + 6.6 × 0.15 + 9.3 × 0.10 + 5.5 × 0.05
= 2.28 + 1.36 + 1.46 + 0.99 + 0.93 + 0.275 = 7.295 → 7.30.**

## 2. Hard gates

| Gate                                | Command that answered it                                                             | Result                                                                                                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Console errors / hydration warnings | `.game-render/regrade/report.json` → `console`                                       | **PASS** — `errors: []`, `hydration: []` over 28 shots. Two `WebGL: INVALID_VALUE: bufferSubData: buffer overflow` warnings, which appear in ten other modules' reports and are not this module's |
| Extensibility ≥ 5                   | §4.4                                                                                 | **PASS — 7.3**                                                                                                                                                     |
| Touched only its own                | `git log --oneline 7dffc29..c3d669b -- lib/game/demo-park/` then `git show --stat`   | **PASS, but git alone cannot answer it** — see §4.8                                                                                                                |
| Deep import                         | `grep -rn "from '@babylonjs/core'" lib/game/demo-park/` · `gates.txt` deep-import check | **PASS** — 0 and 0                                                                                                                                                 |
| `window`/`document`/`navigator`     | `grep -rn "window\.\|document\.\|navigator\." lib/game/demo-park/`                   | **PASS** — no hits at all                                                                                                                                          |
| `pnpm test:game` / `tsc` / `eslint` | `gates.txt`, `suite.txt`                                                             | **PASS** — `tsc (exit 0)`, eslint 0 errors / 3 warnings (none in this module), `suite exit=0`, `pnpm game:fit` "fit check clean", soak 9/9 twice                    |
| `Math.random` / wall clock          | `grep -rn "Math.random\|Date.now" lib/game/demo-park/`                               | **PASS** — one hit and it is a docblock saying there are none                                                                                                      |

## 3. The frames I looked at

All 28 of `.game-render/regrade/*.png` plus `place/build-plot-near.png`, `build-plot-wide.png` and
`build-plot.png`. I did **not** open `place/build-plot-hud.png`, `dispatched.png`, `placed.png` or
`tab.png` — they are HUD and dispatch probes from earlier runs, outside this brief.

**A finding about the evidence before the evidence.** Every regrade frame was taken with the build
palette and the Park panel open. A rectangle model of that chrome covers **65.8 %** of the
1280 × 720 frame. On `overview` — the one camera whose whole job is "does this read as a place" —
the sky/land boundary sits at row **250** (the camera manifest's docblock promises 153), so the
park occupies rows 250–303: a **53-pixel strip, 7 % of the frame height**. Four of the 28 frames
are therefore worthless for the axis they exist to answer, and I graded composition off `entrance`,
`coaster`, `pool`, `night` and the two HUD-free `place/` frames instead.

| File                                       | What is actually in it                                                                                                                                                                                                                    |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0900-overview.png`                        | 53 px of distant green plain above the palette, one red roof at x≈510. 64 guests. No park visible.                                                                                                                                        |
| `1300-overview.png`                        | Same strip, 1,803 guests in the HUD, `Lost 97`, mood 47. Still no park visible.                                                                                                                                                           |
| `1830-overview.png`                        | Same strip under a warm sky; mood 44; `Rides taken today 1,722`.                                                                                                                                                                          |
| `2230-overview.png`                        | Black, stars, a faint red smudge at the fairground. 215 guests, all `Leaving`.                                                                                                                                                            |
| `0900-entrance.png`                        | The best frame in the set with `1300-entrance`. Main axis running north, plazas, the pavilion's red roof on the ridge, a blue coaster lattice in the left mid-ground behind trees. Reads as a wooded park with rides in it.               |
| `1300-entrance.png`                        | The same at full crowd: a dark speckled mass of guests along the street. The coaster is 1,062 blue pixels, 0.36 % of the visible park band.                                                                                               |
| `1830-entrance.png`                        | Long shadows, the coaster down to 131 px (0.04 %) as the light leaves it.                                                                                                                                                                 |
| `2230-entrance.png`                        | Four or five light points in an otherwise black frame — one on the pavilion, two on the street, one orange at the right. The coaster is not visible at all.                                                                               |
| `0900-close.png` / `1300-close.png`        | A wall of oak canopy across the middle, a long white building at the left edge, the ferris wheel top-right, a big empty lawn along the bottom. The preset targets the centroid of everything built and there is nothing there (§4.3).     |
| `1830-close.png`                           | Same, warmer. The wheel is the only object with a silhouette.                                                                                                                                                                             |
| `2230-close.png`                           | Black. Lit windows in the building at the left; the ferris wheel is an **unlit** silhouette. Draw calls 553 → 174 at the same camera.                                                                                                     |
| `0900-ground.png`                          | Standing on the main street: lime avenue both sides, kerb, hedges, the market square ahead. Genuinely good, and only the top 300 px of it survive the palette.                                                                            |
| `1300-ground.png`                          | The same with a guest 1–2 m from the lens filling 210 px of frame height, and 38 % of columns with no sky in them.                                                                                                                       |
| `1830-ground.png` / `2230-ground.png`      | Dusk, then near-black with one lamp visible up the street.                                                                                                                                                                                |
| `0900-coaster.png` / `1300-coaster.png`    | The `coaster` preset. Rolling green with scattered conifers, the paved shelf loop on the left, and the blue coaster in the **right third running off the bottom-right corner** — 1,640 px, 0.56 % of the visible band, top 58 px below the horizon. |
| `1830-coaster.png`                         | Same, the steel gone matte in the low sun.                                                                                                                                                                                                |
| `2230-coaster.png`                         | A dark blue-grey wireframe against black. No lighting of its own.                                                                                                                                                                         |
| `0900-pool.png` / `1300-pool.png`          | A wide vista: coaster top-left, water park and lagoon centre, pavilion and fairground right, the purple flume tower and chute bottom-right. The middle third is lawn and trees. Content at the corners, nothing in the middle.           |
| `1830-pool.png` / `2230-pool.png`          | Same, then black with two faint glows.                                                                                                                                                                                                    |
| `0900-night.png`                           | The `night` preset in daylight: pavilion, fairground (wheel + top spin), coaster at the left edge, flume at the right. It is a fourth wide shot, not a close one.                                                                         |
| `1300-night.png` / `1830-night.png`        | The same view at crowd and at dusk.                                                                                                                                                                                                       |
| `2230-night.png`                           | **One** bright lamp at x≈378, a red glow on the pavilion roof, a magenta smear at the fairground, a purple line at the flume. The park at night is unlit.                                                                                 |
| `place/build-plot-near.png` (HUD-free)     | The player-built coaster on the build plot: blue out-and-back with a helix, station a small blue canopy **standing in bare grass with no path to it**, the fairground and pavilion to the left, and the right half of the frame empty lawn running to a hazy world edge. |
| `place/build-plot-wide.png`, `build-plot.png` | The same scene wider: fairground roundabouts, ferris wheel, the blue coaster north-east of them, the purple flume tower and chute at the right. The top 40 % of the frame is featureless grass with scattered conifers.                 |

## 4. Findings

### 4.1 Neither machine fits the plot that was reserved for it

`pnpm game:fit`, from `suite.txt`:

| machine                       | bounding box                      | box size      | pad         | pad size | overhang                             |
| ----------------------------- | --------------------------------- | ------------- | ----------- | -------- | ------------------------------------ |
| `core-classic:family-invert`  | x −119.6…−29.4, z −64.1…26.1      | 90.2 × 90.2 m | `coaster`   | 58 × 48  | W −5.4 · **E 37.6** · S −11.9 · **N 54.1** |
| `neon-lagoon:tube-slide`      | x 148…190.4, z −8.5…51            | 42.4 × 59.5 m | `flumes`    | 36 × 30  | W 2 · E 4.4 · S 11.5 · **N 18**       |

The coaster's footprint is **2.92×** its pad's area and the slide's **2.34×**. The reserved plot is
this module's single deliverable to every other builder — the report calls it "the reserved,
flattened land … each one served by a path" and other modules measure their proposals against it.
Two machines have now been placed on two pads and neither is on its pad; both sit mostly on
unflattened ground that happened to clear. The fit check reports the overhang rather than failing
on it, which its own docblock defends as "a plot-sizing decision and not a broken frame". It is a
plot-sizing decision, and it is wrong: a plot that does not contain the thing it reserves reserves
nothing.

### 4.2 The build plot: 9,216 m² of lawn, 94.2 % of which no queue can reach

The plot is 72 × 128 m at (176, −72), `height: null`, `blend: 0`. Measured on the built world:

- **9,216 m².** That is **larger than the `coaster`, `fairground`, `water-park`, `flumes` and
  `pavilion` pads put together** (2,784 + 2,016 + 1,408 + 1,080 + 1,792 = 9,080 m²). The biggest
  single reservation in the park holds **0 entities**.
- **3.52 %** of the 512 × 512 m park square.
- Its centre is **43.1 m** from the nearest path; the worst point inside it, the north-east corner
  at (212, −136), is **105.6 m** from any path. Sampling the plot on a 2 m grid, **139 of 2,405
  cells — 5.8 % — are inside the 14 m queue service radius.**
- The ground falls 4.58 m across it (3.61 → 8.20 m), so a machine placed anywhere but along one
  contour needs its own cut.

`plan.ts`'s docblock says "the west side is where the paths are: `lake-link` runs 4.3 m off that
kerb … which is what puts a station built on that side inside the queue graph's `SERVICE_RADIUS`
of 14 — one built against the east edge is not." I reproduce the 4.3 m exactly — at **one point**,
the plot's south-west corner (140, −8). Over the whole west kerb the figure is 10.2 m at the
midpoint, and over the whole plot it is the 5.8 % above. The docblock frames as an east/west choice
what is really a corner: the reachable part of this plot is a strip, not a side.

And the harness proves it. `.game-render/place/log.txt` records the successful placement at world
origin (148.6, −91.5), box centre (176.6, −68.3) — dead centre of the plot, exactly where the
Jacobian solve aims a player's pointer. That origin measures **28.2 m from the nearest path**, two
service radii out. `build-plot-near.png` shows the result: a station canopy in bare grass with no
path to it and no queue, on a coaster the player just paid for. The commit message for `e3a25ae`
already says so — "eine selbst gebaute Bahn kann 28.2 m von jedem Weg entfernt stehen, und nichts
sagt es einem" — and my independent measurement lands on the same 28.2. It is recorded and it is
still true.

**As composition, judged as a park designer:** reserving expansion land is real practice. Real
parks put it behind a hoarding, behind a treeline, at the back of house, where a paying visitor
does not look at it. This one is bare mown lawn immediately east of the fairground, in frame in
`1300-pool.png`, `1300-night.png` and both `place/` shots, on the visitor side of the park, with
its own scatter deliberately suppressed so that it reads as flatter and emptier than the
surrounding meadow. It reads as a field the park has not got round to, because that is what it is.
The functional argument for it is sound and I accept it — `evaluatePlacement` over an 8 m grid
found **zero** legal positions for the smallest bundled layout, and a build tool nobody can use is
worse than a lawn. That argument justifies reserving the ground. It does not justify reserving it
*there*, unscreened, unserved, and larger than every machine plot combined.

### 4.3 The park has no centre, and two of its seven cameras prove it

The `close` and `night` presets both anchor on `kinds:shop,ride,coaster,flume,pool,building`, i.e.
the centroid of everything built. Computed on the built world, that centroid is **(52.7, 39.5)**,
and:

- the **nearest** built thing to it is `neon-lagoon:smoothie`, **44 m** away;
- the **median** built thing is **101 m** away; the farthest is 210 m.

So the park's own centre of mass lands on open grass between the market square and the water
forecourt. That is why `1300-close.png` — the preset whose docblock says "`close` means close" and
which is aimed at "the densest built thing in the park" — is a wall of trees and a lawn, and why
`2230-night.png` is a wide dark landscape with one lamp in it instead of a lit street. The camera
module is doing exactly what it says; the composition is what makes the answer empty.

A park with a centre has something *on* the centre: a castle, a bandstand, a lake, a tower. This
one has a fountain 30 m across on the axis and three content clusters — entrance/street in the
south, fairground + coaster + build plot in the north, water park + flume in the east — arranged
around a hole.

### 4.4 There is no skyline

Measured by walking the alpha of each frame against a per-column sky/land boundary:

| frame                | tallest built object's top vs the local horizon                                    |
| -------------------- | ---------------------------------------------------------------------------------- |
| `0900-entrance.png`  | coaster steel tops **6 px below** the skyline; red-roof pixels above the horizon: **0** |
| `1300-entrance.png`  | **6 px below**; red roof above: **0**                                              |
| `1830-entrance.png`  | **34 px below**                                                                    |
| `1300-coaster.png`   | **58 px below**                                                                    |
| `1300-pool.png`      | **28 px below**                                                                    |
| `1300-night.png`     | **76 px below**                                                                    |
| `1300-close.png`     | the ferris wheel's rim: **3 pixels** of red steel, 39 px above the skyline         |

Three pixels, in one frame of twenty-eight. In world space the same thing: the tallest point of the
tallest machine is **27.5 m** (fit check, coaster box `y 8.5..27.5`) and the park's natural ridge
peaks at **25.90 m** at (−130, −102) (terrain scan on a 2 m grid). Everything the park has built
out-tops its own hill by **1.6 m**. From the gate — the one view a visitor definitely gets — the
park presents a treeline, a red roof below it, and nothing against the sky.

### 4.5 The coaster does not belong where it stands, and the day budget prices it

Straight-line distances between the six machines, on the built world:

```
                 ferris  swinger  topspin  carousel  coaster  slide
ferris-wheel          0       25       23        34      176     77
wave-swinger         25        0       35        25      178     56
top-spin             23       35        0        25      154     91
carousel             34       25       25         0      153     76
family-invert       176      178      154       153        0    224
tube-slide           77       56       91        76      224      0
```

The four flat rides sit **23–35 m** apart and the slide is 56 m from its nearest neighbour. The
coaster is **153 m** from the nearest thing anyone can ride — four to six times the spacing of
everything else, on the far side of the axis, behind the ridge. It is not on a midway, it is not on
a loop with anything else, and the only path that serves it is its own ring.

`pnpm game:day-budget` at this commit, seed 1, one park day:

- **interactions per visitor 5.6396** (4,884 rides + 10,388 purchases over 2,708 arrivals);
- guests are **walking in 47–62 % of every hourly census** and **riding in 0–2 %**, all day;
- every one of the six machines runs at **18–37 % utilisation with `queue 0`**;
- refusals: `full 3142`, `balk 715`, `price 41`, `broken 47`, `height 36`.

Against `STATUS.json`'s own record of the same park with the two new machines removed —
"interactions per visitor 7.01 → 5.14 … that drop is the WALK, not the ride" — the park today
delivers **5.64 against the 7.01 it managed with only the fairground**. The trains fix recovered
most of what the coaster cost, and the coaster is still a net **−19.5 %** on what a visitor gets
out of a day. Walkability, answered with a number: the first thing a visitor can ride is 274 m from
the gate (carousel), the coaster is 282 m, and the first 270 m of the walk is six shops and trees.

**And the STATUS claim of 5.74 does not reproduce.** At `c3d669b`, seed 1, default speed, I measure
**5.6396** and **4,884** riders against the recorded 5.74 and 4,955 — 1.8 % and 1.4 % out. Small,
but the figure is quoted in `STATUS.json` as a measured before/after and it is not what the tree
answers.

### 4.6 The scatter re-roll: the planting that was designed survived, and the rest was never design

`plan.ts` records that reserving a pad re-rolls the entire park's scatter — 1,061 props gone, 1,020
new, 494 unchanged, only 39 removals inside the plot, 532 new ones more than 150 m away. Judged on
whether the result still reads as designed:

- **Trees: 1,093** (473 oak, 444 spruce, 176 linden) against round 2's independently measured
  **1,196** — the round cost the park **103 trees, −8.6 %**.
- **The 382 non-tree props are unchanged item for item** against round 1's census: 166 hedge, 72
  lamps, 38 shrubs, 33 benches, 28 planters, 24 flowerbeds, 13 bins, 6 flags, 1 sign, 1 fountain.
  Those are rule-placed and the re-roll did not touch one of them.
- **Trees within 10 m of a path edge: 210 of 1,093 = 19.2 %** (round 2's critic measured 15.9 %);
  within 20 m, **33.6 %** against 32.8 %. The "planting follows the circulation" proxy went **up**.
- **The formal avenue survived exactly where it is authored.** On `main-street-south`, the 8 m
  spine: 5 lindens each side, along-track gap **12.0 m with sd 0.0**, setback **9.5 m with sd 0.0**,
  single species. That is a boulevard and it is byte-perfect.

So the honest answer to "does the planting still read as designed after that" is **yes, because the
part that is designed is not the part that re-rolls.** The avenue walk and the furniture are
deterministic placements; the scatter was never authored and rolling it again costs nothing except
that every screenshot taken before the pad existed is now non-comparable — which the docblock says
in as many words and is the right call to have written down.

What the re-roll *did* leave is one visible seam, and it is on the most-walked object in the park.
The other half of the same spine, `main-street-north`, measures: side −, 7 trees, gaps **7.0 ± 4.4 m**
(CV 0.62), setback **10.8 ± 6.0 m**; side +, 12 trees, gaps **3.8 ± 3.5 m** (CV 0.93), setback
**14.5 ± 4.4 m**, linden mixed with oak on both. A visitor walking north up an 8 m boulevard with
five matched limes each side at twelve-metre centres crosses the market square and is in a thicket
with seven trees on the left and twelve on the right. Nothing in the design says why.

### 4.7 Extensibility: two content ids in the world factory, and a fallback that misplaces a machine

The good half is intact and I re-verified it on the built world: `missingRoles` is **`[]`**,
`plots()` answers with all 11 owned pads, nothing in `props.ts` names a pack, shops are still
picked by `need`, and the ride *item* for both new machines is resolved by kind and by style —
`def.kind === 'coaster'`, `def.flumeStyle === layout.style` — so a pack with a different vehicle
still opens both plots. That is the mechanism working.

The regression is `build.ts`:

```ts
const MEASURED_COASTER_LAYOUT = 'kleiner-wirbel';
const MEASURED_FLUME_LAYOUT   = 'spiral-tower';
const COASTER_AT     = { x: -70,    y: 12.53, z: -45, yaw: -Math.PI / 4 };
const FLUME_AT       = { x: 148,    y: 3.69,  z: 6,   yaw: Math.PI / 2 };
const FLUME_RUNOUT_AT= { x: 167.1,  z: 60,    yaw: 0 };
```

Two content ids named in the world factory, and three coordinate constants whose docblock says
outright that `y` "is the output of a measurement" — of *those two layouts*. The fallback is
`?? TRACK_LAYOUTS[0]` and `?? flumeLayouts()[0]`. `TRACK_LAYOUTS[0]` is `nordwind`; `STATUS.json`
records `nordwind` at 52.6 × 212.6 m against `kleiner-wirbel`'s 56 × 112, and the ghost fix in
`e3a25ae` measured `nordwind`'s footprint offset at **114.7 m** against `kleiner-wirbel`'s 23.2.
`flumeLayouts()[0]` is `plunge-drop`, 38 × 76 m per the flumes selftest, against `spiral-tower`'s
60 × 42. A pack set without those two ids does not fail safely: it builds a machine twice the
length at coordinates certified for a different one, on a shelf whose west side is a hill, and the
fit check that would catch it only ever runs against the two bundled packs.

The docblock is honest that this is a workaround and names the real fix (a `footprint` on
`LayoutPreset` and `FlumeLayoutSpec`). It is still a step back on the axis whose round-2 claim was
"nothing here names a content id", and the failure mode is concrete rather than theoretical.
7.3 — clear of the 5.0 floor, no hard-gate failure.

### 4.8 Budget: 589 draw calls, and boot is worse than it was two rounds ago

From `.game-render/regrade/report.json`:

| camera            | 09:00 | 13:00     | 18:30 | 22:30 |
| ----------------- | ----: | --------: | ----: | ----: |
| overview          |   490 |       495 |   490 |   216 |
| entrance          |   540 |       540 |   540 |   230 |
| close             |   553 |       553 |   553 |   174 |
| **ground**        |   589 |   **589** |   589 |   210 |
| coaster           |   520 |       520 |   518 |   175 |
| pool              |   529 |       534 |   529 |   222 |
| night             |   516 |       516 |   516 |   203 |

**Peak 589 draw calls = 49.1 % of the 1,200 whole-game budget**, with 8 of 24 modules built and
1,804 guests in the frame. Peak triangles **2,163,396** (`1300-ground`). Round 2's independent
measurement was 207; the harness note in `STATUS.json` is properly careful that 579-vs-210 is not
an A/B (different server, 1,495 guests against 887), and I repeat that caveat rather than treating
the growth as this module's regression. What is not caveated is the level: half the budget is gone.

**Boot: 17,911 ms** against the 8 s budget — 2.24×. Round 2's number-one recommendation was, in
full: "Measure boot properly, against a production build with nothing else touching the tree, and
then attack whatever it actually is. It is the only budget item this module still owns." The
regrade ran against `next dev` again — `report.json`'s `chunks.files` lists
`1f0u_next_dist_compiled_next-devtools_index_0h122ps.js` and `1f0u_next_dist_client_0v6okvb._.js`,
and the total is 9.59 MB of dev chunks. So the number is still uninterpretable and the ask is still
open, three rounds in. This is the cheapest item on the fix list and the only one nobody has
started.

The simulation half is fine and I record it as such: soak mean **1.88 ms/tick** at 100× and
**1.10 ms/tick** at 2× against the 6 ms budget, no stuck guests, no unreachable queues, no orphan
entities, save round-trips after the run, and teardown leaves 0 meshes / 0 materials / 0 textures
over three cycles (`suite.txt`).

### 4.9 Ownership

`git log --oneline 7dffc29..c3d669b -- lib/game/demo-park/` returns six commits. The module's own
source is confined to the six files in `lib/game/demo-park/` and nothing else was added to it. But
`git show --stat` on those six shows that the same commits also changed
`lib/game/tools/{ghost,main,palette,types,selftest}`, `lib/game/track/{layouts,types,selftest}`,
`lib/game/trains/{sim,selftest}`, `lib/game/guests/sim.ts`, `lib/game/rides/sim.ts`,
`lib/game/content/packs/core-classic/pack.json`, `package.json` and three files under `scripts/`.
`STATUS.json` attributes that work to the integrator, and CRITIC.md routes exactly those files
through the integrator, so the gate passes — but it passes on a claim in a JSON file, not on the
command CRITIC.md says answers it in one line. Worth saying out loud so the next round does not
read this as a clean git answer.

### 4.10 The report describes a different park

`docs/game/reports/demo-park.md` was last committed on **2026-09-07** (`bc9c3da`, "der demo-park-Report
kannte den Wasserpark noch nicht") and `grep -c "build-plot\|Bauplatz\|kleiner-wirbel\|splashdown\|runout"`
over it returns **0**. Its ranked "what is weak or missing" list still reads:

- #7 "**The park has no shops, rides, buildings or guests in it**, so the path network is a network
  to nowhere" — the park has 6 shops, 4 flat rides, a coaster, a flume, 4 pools, 2 buildings and
  1,804 guests;
- #12 "**No critic has graded this or any module.** The gate at 8.5 has not run" — two rounds have
  been graded and both are on disk;
- a budget table peaking at **237 draw calls**, against the **589** the harness reports at this
  commit. A factor of **2.49**.

Everything round 3 is being graded on lives in `STATUS.json` and in the commit messages instead,
and *that* writing is excellent: the pad re-roll is written up with all four numbers before anyone
asked, the 28.2 m unreachable station is filed as an open finding by the builder, and the harness
note refuses to read 579 against 210 as an A/B. It is not enough. Axis 6 grades the report, the
report is the artefact the next builder opens first, and this one would send them looking for
rides that are already there. 5.5 rather than 3 only because nothing in it is a false claim about a
frame — it is a true description of a park that no longer exists.

## 5. What to fix, most valuable first

1. **Size the pads to the content.** Coaster: 90.2 × 90.2 m box on a 58 × 48 m pad, overhanging
   54.1 m north and 37.6 m east. Flume: 42.4 × 59.5 on 36 × 30, overhanging 18 m. Either the pads
   grow or `Pad` stops being what other modules measure against.
2. **Put a path round the build plot.** 5.8 % of 9,216 m² is inside the 14 m queue radius and the
   worst point is 105.6 m out; the coaster the harness actually built has its station 28.2 m from
   any path (`place/log.txt`, `build-plot-near.png`). One entry in `PATHS` — a `service-road` loop —
   makes the whole plot buildable instead of a 16 m strip along one kerb.
3. **Give the park a centre.** Centroid of the 18 built things is (52.7, 39.5) with nothing within
   44 m of it; `close` and `night` both aim there and both frame lawn. A building, a lake edge or a
   tower on that point fixes two camera presets and the composition at once.
4. **Give the park a skyline.** Tallest built point 27.5 m against a 25.9 m natural ridge; from the
   entrance camera the coaster's top sits 6 px *below* the local horizon and the only thing in 28
   frames that silhouettes is 3 pixels of the ferris wheel. Something has to be taller than the
   hill.
5. **Move the coaster or move the park to it.** 153 m to the nearest other ride against 23–35 m
   among the flat rides; 5.64 interactions per visitor against 7.01 without it; guests walk 47–62 %
   of every hour and ride 0–2 %.
6. **Screen the build plot or move it back.** It is 136 m² larger than all five machine pads
   combined and it is in frame from `pool`, `night` and both `place/` cameras. A treeline on its
   east and north edges costs nothing the scatter is not already spending.
7. **Measure boot against `pnpm build && pnpm start`.** 17,911 ms against 8 s, on `next dev` for
   the third round running. Round 2's first recommendation, untouched.
8. **Finish the avenue.** `main-street-south` 12.0 ± 0.0 m centres and 9.5 ± 0.0 m setback;
   `main-street-north`, the same street, 7.0 ± 4.4 and 3.8 ± 3.5 with oak mixed into the limes.
9. **Get the two layout ids out of `build.ts`.** The fallbacks put `nordwind` (52.6 × 212.6 m) and
   `plunge-drop` (38 × 76 m) at coordinates certified for a 56 × 112 and a 60 × 42 machine.
   `footprint` on `LayoutPreset` and `FlumeLayoutSpec` is the fix the docblock already names.
10. **Rewrite the report.** Zero mentions of the three things this round shipped; a budget table
    2.49× low; two ranked weaknesses that are no longer true.
11. **Re-shoot the regrade set with the HUD closed.** The chrome covers 65.8 % of every frame and
    leaves `overview` — the composition camera — with a 53-pixel strip of park.

## 6. Verdict

**FAIL. 7.30 against 8.5.** Round 3 of a maximum of four.

No hard gate failed. The module did the hardest and most useful thing available to it this round —
it put real machines on the pads, and doing so produced the fit check, the build plot and the
re-roll finding, all three of which are genuine contributions to the project. It also demonstrated,
with its own harness, that the plot system it exists to provide does not size to the content the
game ships, that the park has neither a centre nor a skyline, and that its largest reservation is a
lawn nobody can queue on. Those are composition problems, they are this module's alone, and none of
them is in its report.
