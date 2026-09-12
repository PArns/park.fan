# `flumes` — water slides on the track core

**Folder:** `lib/game/flumes/` (12 files) · **deps:** `core`, `track`, `pools` · **kind:** `flume`

**Verified, round 3:** `npx tsc --noEmit -p tsconfig.json` silent over `lib/game`,
`npx eslint lib/game/flumes` clean, `npx prettier --write lib/game/flumes` no change,
`pnpm test:game` exit 0, `selftest.mjs` **190/190** (up from 143 — it now measures the water, the
seating and the module's own teardown). **36 frames opened with the Read tool**: 32 of this build
(the nine-frame showcase at three times × three cameras, a stepped pair with people on the slides,
a one-frame smoke render after the last edit, three overview iterations and seventeen hand-posed
detail frames) and four of the round-2 critic's, used as the before. **Zero console errors** in every run. Every figure below says which
server it came from; unless stated it is the **dev server at `http://localhost:3001`**, and where a
"before" is quoted it is measured on the round-2 critic's own frames under `.game-render/critic-f2*`
so the two are the same pixels.

> **Round 3 answers `docs/game/critiques/flumes-round2.md` (8.30 of 8.5).** Its whole gap was the
> frame axis. Fixed here, in his order: the water sheet's ceiling (§4.3), the sheet glowing after
> dark (§4.3), the night rig lighting nothing (§4.4), the riders reading as cargo (§4.5), the
> stair's one stringer and its handrail ending in mid-air (§4.6). Plus his finding 5, which he
> called defensible and which turned out to be one JSON object (§4.7), the two honesty items
> (`geom.ts:190` said ten failures and it is nine; the two fixes this report forgot to claim are
> claimed in §4.8), and the leak nothing measured, which is measured now from inside this folder
> (§4.10).

> **Round 1's frame descriptions in this file were wrong and have been deleted, not edited.** They
> described towers carrying chutes at a moment when `main.ts` read `towerHeight` off the _pre-build_
> resolve — where `0` is the sentinel for "derive it from the descent" — so every tower in the park
> was **2.00 m tall and lay in the grass twelve to seventeen metres under its own chute**. What
> those four descriptions called "the tower's cross bracing" was `track`'s support lattice under
> the run. The selftest was green over it because it rebuilt the tower from the same wrong argument.

---

## 1. What a water slide is here

A flume is **not a coaster with water in it**, and the module is organised around the four things
that make the difference.

**The trough, not the rail.** The drawn object is a shell swept along the centreline: an open
half-pipe for a body slide, a nearly closed pipe with a slot along the crown for a tube slide, a
wide flat-floored trough for a family raft, a shallow kerbed lane for a mat racer. Which of those
gets drawn is a **cross-section in a manifest** — an angular extent, a flat-floor fraction, a
thickness and a sample count — never a branch.

**The wall answers the speed, and that is the module's one real idea.** A coaster banks its track
until the rider sits flat; a slide is deliberately under-banked and the rider rides _up the wall_.
So the trough is built at a fraction of the coaster-perfect bank (`bankFactor`, 0.3 on a body
chute, 0.55 on a tube) and the remainder is answered by growing the shell on the loaded side:

```
f     = v²·κ⃗ + g⃗            the specific force pressing the rider into the trough
θ     = atan2(f·right, f·up)  the angle they climb to, signed
wall  = wrap + response · (|θ| + halfWidth/R + freeboard − wrap),  clamped to [wrap, maxWrap]
```

`v` is `speedAt(physics, s)` from **`track`'s own energy march** — the same integrator a coaster is
validated with — so the wall is a function of the speed the rider really carries there and not of
the curve radius. Measured on this build, at each layout's hardest station:

| Layout                | R      | station  | speed   | climb | inner wall | outer wall |
| --------------------- | ------ | -------- | ------- | ----- | ---------- | ---------- |
| `plunge-drop` (body)  | 0.50 m | s = 39.7 | 9.3 m/s | 28.8° | **27 cm**  | **36 cm**  |
| `family-bowl` (raft)  | 1.20 m | s = 95.4 | 7.6 m/s | 18.9° | **64 cm**  | **100 cm** |
| `mat-straight` (mat)  | 0.50 m | s = 45.4 | 9.8 m/s | 6.8°  | 15 cm      | 27 cm      |
| `spiral-tower` (tube) | 0.60 m | —        | —       | —     | 119 cm     | 119 cm     |

and on the selftest's synthetic 9 m hook with a 0.5 m trough, **27 cm of wall at 6 m/s against
58 cm at 12 m/s**. The section is asymmetric through every turn, which is what a photograph of a
real flume shows. All four figures the round-1 critic reproduced independently still hold after the
tower fix, which is the point of listing them again rather than citing the old ones.

**`wallResponse: 0` is not what keeps the bundled pipe's section, and round 1 said it was.** The
critic deleted the coefficient and all 94 checks stayed green. The clamp's _lower bound_ is
`style.wrap`, the shipped tube rests at **170°**, and the largest extent the rule can ask of a 0.6 m
pipe is 122.7° (40 m/s in a 9 m hook) — 85.6° below where it already sits, so `needed − wrap` is
negative at every speed this module can produce and the clamp returns `wrap` for _any_ response.
Both halves are asserted separately now: the pipe holds its section **at `wallResponse: 1`** (its
resting wrap is the reason), and a narrow closed pipe — 90° wrap, 178° cap, the same station at
14 m/s — reads **90.0° / 95.8° / 101.6° of wall at response 0 / 0.5 / 1**, which is 34.6° of
geometry the coefficient decides. The selftest prints both tables.

**Water on the surface, and how much air is in it.** A separate sheet a few centimetres above the
shell's floor, stopping well short of the lip, carrying a per-vertex channel: RGB is foam, alpha is
how much of the trough it hides. Both come off ONE quantity, marched down the run —
`aerationProfile` — so one material draws a lazy run-out and a 48° plunge with no uniform per slide.

Round 2 had that quantity as `foam = 1.6·sin θ + 0.3·(v/vmax)`, evaluated per station, and it was
wrong twice in ways no single frame could show. **Speed is not aeration**: a thin sheet running fast
and straight down a mat racer is glassier than the same water dawdling round a bowl, because what
puts air in water is turbulence and not velocity, and that term alone added a flat 0.27 of white to
every vertex of every slide including the run-outs. **And aeration is carried**: it is air in a body
of water, not a property of the ground under it, so it cannot appear the instant the trough tips
over and vanish the instant it levels. Three terms replace them, all of them things that happen to
water:

| term          | what it is                                                                                                                                       | value |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| `equilibrium` | the mean air concentration a long chute settles at, ≈ `0.9·sin θ` (Wood's fit as Chanson gives it): 0.40 at 30°, 0.67 at 48°                     | 0.9   |
| `ceiling`     | and no chute is three quarters air                                                                                                               | 0.72  |
| `growth`      | metres of trough over which it reaches that equilibrium. Short, because a moulded trough has a butt seam every 2.4 m and each one trips the flow | 4 m   |
| `decay`       | metres over which the bubbles rise back out. Three times longer, which is what puts the white BELOW a drop rather than on it                     | 14 m  |
| `jump`        | the hydraulic jump at a gradient break, per unit of `sin θ` given up between two stations                                                        | 0.5   |
| `wall`        | what a rider climbing the wall throws up, per radian of climb                                                                                    | 0.2   |

The consequences are measured in §4.3 and pinned by twelve checks in `selftest.mjs`, including the
one that matters most: **the same chute at 4 m/s and at 14 m/s is the same water**, to 1e-12.

**The tower and the landing.** Every slide starts on a steel or timber tower with columns, a deck
cut around the chute, a handrail, a switchback stair and a canopy; every slide ends in a `pools`
basin and calls that module's `splash(x, z, strength)` on the exact frame a rider lands, with the
strength scaled by the speed they arrived at. The tower also carries a rope light — the deck fascia,
the top rail, the canopy eave and the stair rail, in the slide's trim colour — which is what draws
it after dark and which rides in the trough's rim mesh rather than in one of its own (§4.4). The
lattice **under the run** is `track`'s `buildSupports`, not part of the tower, and the two are
visibly different objects in the frames.

---

## 2. Public API

`lib/game/flumes/index.ts` (worker-safe; `FlumesMainApi` deliberately not re-exported — import it
from `@/lib/game/flumes/main`).

### `FlumesSimApi` (worker) — `ctx.module('flumes')` in a `sim`

| Member                 | What                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| `ids()`                | flume ids in the frame-buffer order (sorted)                                                          |
| `view(id)` / `views()` | `FlumeView`: length, drop, top speed, ride seconds, riders/hour, riders in the air, running, descents |
| `length(id)`           | metres of trough                                                                                      |
| `exit(id)`             | where the run-out ends, world metres                                                                  |
| `riders(id)`           | riders in the air                                                                                     |
| `setRunning(id, on)`   | the pumps; a dry slide dispatches nobody and stops costing water                                      |
| `stats()`              | `FlumesStats`: flumes, riders, trough metres, m³/h, kW, descents                                      |

### `FlumesMainApi` (main thread)

`catalogue()` (every registered layout), `styles()`, `registerContent(pack, block)`,
`create(spec)` → entity id, `remove(id)`, `flumes()`, `view(id)`, `exit(id)`, `meshes()`,
`stats()`, `focus(id)`.

### Commands, events, owned state

- Commands: `flumes:running { id, running }`, `flumes:rebuild`.
- Events emitted: `flumes:changed { id, type }` on the bus of whichever thread raised it. **Not
  forwarded across threads** — `flume:`/`flumes:` is not in core's `FORWARDED_PREFIXES`
  (`sim-runtime.ts:30`, re-checked this round); request §5.
- World slot `world.modules.flumes`: `{ [id]: { descents, sinceDispatch, running } }` and nothing
  else. Riders in the air are **transient by design** — a save taken mid-descent reloads with an
  empty slide that refills over the next few seconds, which keeps the byte-identical round trip
  exact without rounding an arc length.
- Frame buffer `flumes.riders`: `MAX_RIDERS(64) × RIDER_STRIDE(11)` floats — flume index + 1, arc
  length, position, quaternion, speed, **tint**. The eleventh is new in round 2; what it took to
  make it reach a pixel is §4.3. Stats: `flumes.count`, `flumes.riders`, `flumes.waterM3`,
  `flumes.descents`.

### What a pack must declare

Top-level key **`flumes`**, three arrays:

```jsonc
"flumes": {
  "styles":  [{ "id", "wrapDeg", "maxWrapDeg", "wallResponse", "floorFlat", "thickness",
                "sectionSamples", "waterDepth", "waterWrap", "friction", "dragArea",
                "vehicleMass", "riderMass", "dispatchSeconds", "entrySpeed", "bankFactor",
                "rig": { "hull", "hullRadius", "hullTube", "seats", "riderRadius",
                         "seatSpread", "colors", "wear" }, "shell", "trim" }],
  "towers":  [{ "id", "footprint", "column", "rail", "stairWidth", "flightRise", "going",
                "riser", "canopy", "steel", "deck", "canopyColor" }],
  "layouts": [{ "id", "style", "tower", "towerHeight", "pieces": [{ "element", "params" }] }]
}
```

Plus a `rides` entry with `kind: 'flume'` and a `trackStyles` entry whose `rail.radius` is the
**trough radius** — that number is read from the pack and never invented here.

**A layout's `pieces` are `track`'s own elements** (`launch`, `drop`, `curve`, `helix`, `s-bend`,
`straight`, `slope`). A slide's centreline is not a different problem from a coaster's, that grammar
is the highest-graded thing in the project, and reusing it means clothoid transitions, a C² spline
with a roll channel and a real energy model for free.

---

## 3. What is reused rather than rewritten

| From                                   | Used for                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| `track` `buildTrack` + element grammar | the centreline, from a piece list, with `quick: true` so `bankFactor` survives |
| `track` `TrackSpline` / `TrackFrame`   | frames, curvature and roll — no second spline exists in this module            |
| `track` `simulateTrack` / `speedAt`    | the speed at every station, which is what the wall is computed from            |
| `track` `extrusionStations`            | adaptive spacing: a chord that never sags more than a centimetre               |
| `track` `buildSupports`                | the columns and footings under the run, spaced by the local vertical g         |
| `pools` `splash` / `create` / basins   | the landing; the showcase places every basin at a **measured** exit            |

Two derivations replaced numbers that would have had to be kept in sync by hand, and both were bugs
before they were derivations:

- **The tower is as tall as the descent needs.** A layout used to carry `towerHeight`, and every
  edit to a drop moved the exit: the five built-in descents ended at **−4.45, −3.43, −2.34, −5.24
  and −1.07 m** relative to the ground the tower stands on. `buildFlume` builds the layout once from
  the ground to measure the fall and again from a tower that tall, so every run-out ends **0.40 m**
  above it.
- **Under-banking is a property of the STYLE**, injected into every piece that does not name its own
  `bankFactor`, so a layout is not the place to restate it.

The tower derivation is also where round 1 failed, and the shape of the fix matters more than the
line. `buildFlume` writes the resolved height onto `build.flume`; `main.ts` was reading the
_request_ object it had passed in, where the manifest's `0` still sat. There is no corrected read
now — there is **`towerPlacement(build, ground)`**, one exported function that both the renderer and
the selftest call, because two call sites computing the same placement from the same fields is the
bug and not the arithmetic. Nothing downstream can reach the pre-build value any more.

---

## 4. What was verified, and how

### 4.1 The towers, which round 2 existed to settle and round 3 leaves alone

Measured in the **running scene** (dev server, `?showcase=flumes`) by walking every `flume-*` mesh's
world bounding box — the same probe the round-1 critic used to find all five at 2.00 m:

| Slide      | layout                | tower steel, y    | chute shell, y max | deck, y max | derived tower |
| ---------- | --------------------- | ----------------- | ------------------ | ----------- | ------------- |
| `flume-2`  | `spiral-tower`        | −0.25 → **18.25** | 17.54              | 16.30       | 16.3 m        |
| `flume-4`  | `family-bowl`         | −0.21 → **16.64** | 15.37              | 14.69       | 14.6 m        |
| `flume-6`  | `plunge-drop`         | −0.25 → **16.00** | 14.32              | 14.05       | 14.1 m        |
| `flume-8`  | `mat-straight`        | −0.25 → **13.74** | 12.02              | 11.79       | 11.8 m        |
| `flume-10` | `torrent-lane` (pack) | −0.25 → **14.65** | 13.18              | 12.70       | 12.7 m        |

Every tower stands **on the ground and above its own chute**: the steelwork's top is the deck plus
the handrail plus the canopy, the shell's highest point is the trough leaving that deck, and the
deck mesh runs from the ground up because it carries the switchback stair. The tower is the tallest
thing the module draws, in every case, which is the sentence round 1 wrote without a frame under it.

And it is visible. `tower-tube-0900.png` is the frame that settles it: an 18 m steel lattice with
the stair zig-zagging up its outside and a teal canopy on top, the purple closed pipe leaving the
deck at the top and running away right into its helix — with `track`'s white support bents standing
under the run beside it, a different object at a different height, which is what round 1 was looking
at when it wrote "the tower's cross bracing".

### 4.2 Frames — 36, every one opened with the Read tool

```
node scripts/game-shot.mjs --url=http://localhost:3001 --showcase=flumes \
  --cam=overview,close,ground --tod=09:00,18:30,23:00 --out=.game-render/flumes-r3
#  … plus --cam=close,ground --tod=09:00 --step=1200 → .game-render/flumes-r3-step
#  … plus seventeen hand-posed detail frames          → .game-render/flumes-r3-detail
```

`ok: true`, **0 console errors**, 0 hydration warnings in both harness runs. The same two
`INVALID_VALUE: bufferSubData: buffer overflow` warnings appear and are project-wide, not this
module's — re-checked in round 2 against `?showcase=pools`, which loads zero flume meshes and logs
both.

Two harness facts stated rather than cropped out. **`--step` advances the clock after `--tod` sets
it**, so `flumes-r3-step` reads 09:19 on its HUD and is a frame of the park nineteen minutes later;
the un-stepped nine read the time on their label and have nobody on the slides. And **`18:30` is
daylight now** (D-023 moved the park clock 92 minutes ahead of solar, sunset 18:21 → 19:53), so the
round-2 report's "dusk" frames do not exist any more.

| Frame                                                                               | What is actually in it                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `flumes-r3/0900-overview`                                                           | The whole complex, filling **35.6 % of the frame width** against round 2's 18.4 % (§4.7): five runs as coloured lines, three basins, five towers, the lagoon.                                                                                                                                                                               |
| `.../0900-close`                                                                    | The teal body chute across the foreground on braced steel over the lagoon. The sheet inside it now reads as **water over teal gelcoat** — you see the colour of the trough through it — where round 2 drew a pale ribbon.                                                                                                                   |
| `.../0900-ground`                                                                   | Visitor's eye. The mat racer's teal lane and the torrent's amber one at 111 m, both leaving a tower, both with water in them rather than snow.                                                                                                                                                                                              |
| `.../1830-overview`                                                                 | The same complex in late-afternoon light. Daylight, not dusk (D-023).                                                                                                                                                                                                                                                                       |
| `.../1830-close`                                                                    | Sun from the other side; the trough's own colour holds.                                                                                                                                                                                                                                                                                     |
| `.../1830-ground`                                                                   | **The frame the round-2 critic used to make finding 1.** The teal lane is teal. The torrent lane is a cream trough with a blue sheet in it, which is its `shell: '#f6f1e8'` and is discussed honestly in §4.3.                                                                                                                              |
| `.../2300-overview`                                                                 | Coloured lines glowing on black, with the towers now drawn as lit rectangles above them.                                                                                                                                                                                                                                                    |
| `.../2300-close`                                                                    | The rim strip draws the whole teal trough; both racers' towers carry a lit deck edge and a lit canopy eave at the top of the frame.                                                                                                                                                                                                         |
| `.../2300-ground`                                                                   | The water is no longer the brightest thing in a night frame. Measured: §4.3.                                                                                                                                                                                                                                                                |
| `flumes-r3-step/0900-close`, `0900-ground`                                          | People on the slides — one rider on the teal lane at ~(597, 293) in `ground`. Clock reads 09:19; see above.                                                                                                                                                                                                                                 |
| `flumes-r3-detail/raft-riders`                                                      | **Finding 4.** Five people in five colours sitting ON the rim of a family raft, facing the middle, legs in, every one of them inside the hull.                                                                                                                                                                                              |
| `.../tube-riders`                                                                   | The closed purple pipe from above: the slot along its crown, the sheet through it, a rider's red tube on the helix.                                                                                                                                                                                                                         |
| `.../tower-tube-2300`, `tower-timber-2300`                                          | **Finding 3.** The 18 m steel tower as a shape rather than a black lattice: canopy eave, deck fascia, top rail and the stair's zig-zag all drawn in the slide's trim colour.                                                                                                                                                                |
| `.../tower-tube-2300-with-rope`, `-without-rope`                                    | The A/B for that, one pose, one build (§4.4).                                                                                                                                                                                                                                                                                               |
| `.../stair-timber-1600-crop`                                                        | **Finding 5.** A flight at close range: a stringer under BOTH edges, an upright every third tread, and the handrail turning the corner round the landing instead of stopping in the air.                                                                                                                                                    |
| `.../stair-timber-0900`, `stair-under-0900`, `stair-wide-0900`, `stair-timber-2300` | The same stair from three more angles and after dark, where the rail's rope light follows the zig-zag. `stair-0900`, `stair-2300` and `stair-lit-1100` are three poses that ended up INSIDE the steel tower's lattice and show nothing about a stair; they are listed because they were taken and looked at, not because they are evidence. |
| `.../torrent-sheet-0900`                                                            | Two metres from the torrent lane. This is the frame that settles what is left of finding 1: the pale part is the **trough**, cream `#f6f1e8` with amber kerbs, read through a sheet that is now transparent where it is calm.                                                                                                               |
| `.../plunge-sheet-0900`                                                             | The body chute's teal trough with the sheet whitening into the drop.                                                                                                                                                                                                                                                                        |
| `.../tower-tube-0900`                                                               | The same tower by day: the fascia and eave read as trim, not as light.                                                                                                                                                                                                                                                                      |

### 4.3 The water sheet, measured twice — in the buffer and in pixels

**In the buffer**, the round-2 critic's own method: walk every `flume-water:*` mesh's vertex colour
buffer in the running scene. Dev :3001, `?showcase=flumes`.

| sheet                | verts | near-white (r > 0.95) | red mean          | saturation mean   | alpha mean        |
| -------------------- | ----: | --------------------- | ----------------- | ----------------- | ----------------- |
| `flume-2` (tube)     | 4,393 | 5.2 % → **0.0 %**     | 0.499 → **0.368** | 0.392 → **0.521** | 0.587 → **0.383** |
| `flume-4` (raft)     | 2,055 | 7.5 % → **0.0 %**     | 0.511 → **0.393** | 0.388 → **0.494** | 0.572 → **0.397** |
| `flume-6` (body)     | 1,710 | 9.5 % → **0.0 %**     | 0.506 → **0.439** | 0.396 → **0.450** | 0.577 → **0.441** |
| `flume-8` (mat)      | 1,144 | 12.4 % → **0.0 %**    | 0.560 → **0.436** | 0.346 → **0.455** | 0.612 → **0.430** |
| `flume-10` (torrent) |   832 | 19.2 % → **0.0 %**    | 0.631 → **0.469** | 0.288 → **0.425** | 0.672 → **0.455** |

The "before" column is the critic's table and it reproduces to three decimals. **Read the
near-white column with the caveat it deserves**: it is 0.0 % on every sheet partly BY CONSTRUCTION,
because `AERATION.ceiling` (0.72) plus the edge term caps the reachable red at 0.87 and the test is
`> 0.95`. It is not the load-bearing figure any more and it is quoted only because it is the one the
critic used. The load-bearing figures are the distribution — every sheet's mean red down by 0.07 to
0.16, every sheet's mean saturation UP, which is the sheet reading as coloured water rather than as
paper — and the pixels below.

**In pixels**, on the module's own `ground` preset at 1280 × 720. Each sheet's silhouette is found
by rendering it twice through its own material with `unlit` on, once black and once white, and
keeping the pixels that moved by more than 180 of 765; an exposure drift between two renders is an
order of magnitude under that, and the pass respects occlusion because it is the real scene with one
material swapped. **The same mask scores both frames** — nothing in this round moved a vertex
POSITION, so the mask taken on this tree is valid on the round-2 critic's own PNGs, and the "before"
column below is `.game-render/critic-f2/{1830,2300}-ground.png` rather than a reconstruction.

| frame        | sheet     |    px | saturation        | value             | 90th pct value    |
| ------------ | --------- | ----: | ----------------- | ----------------- | ----------------- |
| 18:30 ground | torrent   | 6,631 | 0.279 → 0.235     | 0.625 → **0.505** | 0.808 → 0.773     |
| 18:30 ground | mat racer | 2,677 | 0.495 → **0.677** | 0.655 → **0.569** | 0.796 → **0.714** |
| 23:00 ground | torrent   | 8,813 | 0.399 → **0.464** | 0.585 → **0.415** | 0.800 → **0.576** |
| 23:00 ground | mat racer | 4,962 | 0.437 → **0.620** | 0.498 → **0.390** | 0.796 → **0.537** |

The night half is finding 2 and it is the cleaner result: the critic measured the sheet peaking at
V 0.81 against night grass at 0.43 with no light source on it, and its ninetieth percentile is
**0.576 and 0.537** now against a grass patch in the same frame (x 150–480 × y 306–326) at **0.121**.
It is still brighter than the grass and it should be: the torrent lane has an amber `night.light` on
it. What it no longer has is a torch of its own. `materials.ts` used to give the sheet an emissive
term ramped with `night` up to (0.09, 0.18, 0.24); that is **zero** now, at every hour, and what
replaced it is `environmentIntensity` rising from 0.85 to 1.20 after dark — a wet, nearly specular
surface picking up more of a dark sky, which is a reflection and goes dark when nothing is lit.

**What is left, named rather than fixed.** The torrent lane's saturation went the wrong way
(0.279 → 0.235) and it is the one number in this section that did. The cause is in
`.game-render/flumes-r3-detail/torrent-sheet-0900.png`: that style declares `shell: '#f6f1e8'`, a
cream gelcoat with a saturation of 0.057, and the sheet over it is now transparent where the water
is calm, so what shows through is the trough. The same change moved the mat racer, whose shell is
teal, from 0.495 to 0.677. Repainting one line of `showcase.ts` would move the number and it has
deliberately **not** been done: the water fix has to stand on the water.

### 4.4 The night rig is a material, and it costs no draw call

Round 2's answer to a dark park was two `PointLight`s, and the critic's frame of an 18 m tower under
one of them is a black lattice. A point light inside an open steel frame has almost no surface to
fall on, and the `medium` pool is two lights whatever the content declares, so more of them is not
available either. What already carried the night frames was the trough's **rim strip**, a material.
The tower gets the same treatment: `buildTower` now returns a `lights` geometry — the deck fascia
round all four sides, the top handrail as a coaxial sleeve a centimetre fatter than the rail, the
canopy eave, and the stair's outer handrail per flight — and `main.ts` **welds it into the rim
mesh's buffer** with `appendGeo`. Same material, same world frame, so the tower gains a night
silhouette for **zero extra meshes and zero extra draw calls**.

A/B from one pose, one build, `flume-rim:flume-2` hidden and shown at 23:00
(`.game-render/flumes-r3-detail/tower-tube-2300-{with,without}-rope.png`):

|                     | without the rope light | with it                          |
| ------------------- | ---------------------- | -------------------------------- |
| pixels it changes   | —                      | **22,505** (2.09 % of the frame) |
| their mean value    | 0.127                  | **0.376**                        |
| of those, over 0.30 | 2,952                  | **8,376**                        |

Probed in the running scene, the `flume-rim:*` meshes' world Y extents are **1.02 → 18.32**,
**1.00 → 16.71**, **0.61 → 16.08**, **0.48 → 13.81** and **0.81 → 14.72** — one mesh per slide,
running from the foot of the stair to just over the top of the tower's steel (18.25 m on `flume-2`)
and under its canopy (18.73 m). Round 2's rim strips followed the trough only. The tower boxes themselves are unchanged to the centimetre from §4.1.

The two point lights are unchanged and are still close to decoration; the honest description of this
module's night rig is now "an emissive trim line on the trough and on the tower, plus two point
lights that catch the deck".

### 4.5 The riders sit in the raft rather than on it

`.game-render/flumes-r3-detail/raft-riders.png` against the critic's
`.game-render/critic-f2-detail/raft-zoom.png`. Two faults, both arithmetic.

**They hung over the edge, and it was all five rather than three.** A seat is a point and a rider is
a body: the ring sat exactly on the rim centreline at 0.96 m, which is well inside a 1.30 m raft,
while the torso ran 1.5 rider-radii BEHIND the seat with a cap on the end of it. Rebuilt from round
2's own four `addTube` calls and measured at round 2's own ring, the furthest rider vertex is
**1.418 m of a 1.30 m hull** and **5 of 5** seats overhang, by up to 11.8 cm. The critic wrote
"three of them", which is what a crop from one angle shows; the geometry says all of them.

Now: **1.156 m of the same 1.30 m hull**, measured the same way, and `selftest.mjs` asserts it per
ring-hulled style — including against a deliberately absurd `seatSpread: 5`, because the clamp is
code and the spread is content.

**And the pose was for the wrong vehicle.** One shape was drawn for every hull: a torso reclining at
24°, which is right for a body slider and a mat racer and wrong for somebody in a family raft, who
sits up with their back to the tube and their legs toward the middle. The pose follows the seating
now (`onRim`, the same derivation the seat ring uses, not a second switch on `rig.hull`), every joint
overlaps the part it grows out of, and a ring-hulled rider gains legs: 112 → 160 triangles.

**What is not tested, said out loud.** Whether four tubes read as a person is a judgement about a
picture. The obvious check — do the parts overlap — would have been GREEN on round 2's rider, whose
head cap sat 1.6 % of a rider radius off the torso's axis, i.e. inside it. `selftest.mjs` says so in
place of asserting it.

### 4.6 The stair has two stringers and a handrail that ends somewhere

`geom.ts`, the switchback block. Round 2 gave each flight one stringer and one handrail, both on the
open side, so the treads cantilevered off nothing on the inner side and a bare 32 mm tube stopped in
mid-air at every flight's head. None of it mattered until the tower fix, because none of it was in
frame. Now: a stringer under both edges (the inner ones of two neighbouring flights meet on the
shaft's centreline, which is where a real switchback puts its shared stringer), an upright every
third tread, and a **continuous** handrail — at each landing it turns the corner, runs the landing's
outer edge and comes back to meet the next flight's rail at the same height, which is `spec.rail`
rather than the old hard-coded 0.98 so the top landing meets the deck's own rail.

Visible in `.game-render/flumes-r3-detail/stair-timber-1600-crop.png`. Cost: the stair detail and the
rope light together are **+7,796 triangles** across five slides, +6.5 %, and no new mesh or material.

### 4.7 The `overview` preset frames the slides

Finding 5, which the critic called defensible and declined to press. It is one JSON object: a camera
preset is content (`camera/manifest.ts`: "A pack that disagrees replaces this entry with one JSON
object"), so `stageFlumesShowcase` replaces `overview` for the duration of its own session, keeping
the built-in's bearing and its 15.5° pitch — the two numbers that file records two rounds of tuning
— and changing only the anchor (`kinds:flume | park:centre`) and `frameRadius: 'auto'`. **No
placement moved**, so `ground`, the best frame the module has, is the frame it was.

Measured on the two `0900-overview` PNGs by counting the columns carrying non-grass content between
rows 200 and 520: **18.4 % of the frame width → 35.6 %**. (18.4 % reproduces the critic's "~19 %".)

### 4.8 Two fixes round 2 made and forgot to claim

Both are the critic's finding 9 and both are real.

- **A save no longer loses a descent.** `sim.ts:363` folds the airborne riders into `descents` on
  serialize, which closes round 1's consequence — the round-1 critic measured `{16, 6, 13}` becoming
  `{14, 5, 11}` over one save. `selftest.mjs` pins it ("a save loses no descent"), and §2 below no
  longer says only that riders are "transient by design" as though nothing had been done about it.
- **The run-out basins read as water.** Round 1's finding 8 was that both lanes were `white-ceramic`
  and looked drained. `showcase.ts:115` and `:143` are `aqua-mosaic`, and the difference is plain in
  `.game-render/flumes-r3/0900-close.png`.

And one arithmetic correction: `geom.ts` claimed that deleting `wallResponse` fails **ten** checks in
`selftest.mjs`. Hard-coded to 1 in a clean tree it fails **nine** (181/190). The docblock says nine.

### 4.9 Budget

Dev :3001, `?showcase=flumes`, scene probe.

|                              | round 2                         | round 3                  |
| ---------------------------- | ------------------------------- | ------------------------ |
| Flume meshes                 | 53 (49 drawable + 4 coarse LOD) | **53** (49 drawable + 4) |
| Flume materials              | 18                              | **18**                   |
| Flume triangles              | 119,548                         | **127,344** (+6.5 %)     |
| …excluding the coarse copies | 94,060                          | **101,856**              |
| Whole scene                  | 274 meshes / 39 materials       | 274 / 39                 |

**The module's own share of the 1,200-draw-call budget**, which the round-2 report dropped and the
critic asked for: **49 drawable meshes for five slides, at most 4.1 %** in the base pass — one mesh
per surface per slide plus nine shared rig meshes, whatever is in the air. The tower's rope light
added none of them, which is the point of §4.4. Of this showcase's triangles the module is now
**33.0 %** of 386,036 (28.3 % counting only what is drawable), against the round-2 critic's 24.8 %.

Draw calls and triangles per frame, `flumes-r3/report.json` against `critic-f2/report.json` — the
same command on the same server:

|         | 09:00 overview | 09:00 close   | 09:00 ground  | 23:00 overview | 23:00 close  | 23:00 ground |
| ------- | -------------- | ------------- | ------------- | -------------- | ------------ | ------------ |
| round 2 | 250 / 313,630  | 191 / 363,814 | 177 / 341,826 | 132 / 127,242  | 73 / 113,250 | 59 / 91,262  |
| round 3 | 234 / 352,142  | 191 / 390,578 | 177 / 368,230 | 116 / 142,654  | 73 / 116,914 | 59 / 94,566  |

`close` and `ground` are draw-call-identical; `overview` is a different pose (§4.7), so its two
numbers are not comparable with round 2's and are quoted only so nobody reads the change as a
regression — it draws 16 fewer calls and 38,512 more triangles because it now stands closer to the
slides and further from everything else. The extra triangles on the other five frames are the stair
and the rope light. `fps` in `report.json` is 0.6–1.4 and is
meaningless: headless Chromium here is SwiftShader. Draw calls and triangles are real.

**The trough LOD is unchanged and still works**, and how it is observed still matters:
`scene.getActiveMeshes()` lists the MASTER mesh's name whichever level is drawn, so reading that list
says "five fine shells" at every distance. Asking each mesh `getLOD(camera)` instead, four of five
resolve to their coarse copy at `overview`. The fifth, `torrent-lane`, is 3,780 triangles against
`LOD_MIN_TRIANGLES = 4000` and correctly has no level.

### 4.10 The teardown, which nothing measured

The budget rubric asks for "no leak across three dispose/reboot cycles" and the round-2 critic found
that nobody measures it: `scripts/game-soak.mjs` loads no flume, and from outside the module the
renderer's teardown is unreachable — `dispatch('flumes:rebuild')` rebuilds the SIM and leaves every
main-thread mesh where it was. It is measured from inside now, in `selftest.mjs` section 10, against
a real Babylon **`NullEngine`**:

```
built:          32 meshes / 15 materials / 13 textures / 32 geometries / 1 lights
after dispose:   0 meshes /  0 materials /  0 textures /  0 geometries / 0 lights
```

three cycles, identical every time, with three slides placed. Two things make it work in node and
both are worth knowing: `NullEngine` is a real engine with no GL behind it, so `Mesh`,
`PBRMaterial`, `RawTexture` and `thinInstanceSetBuffer` all behave; and `main.ts` imports Babylon
deep and EXTENSIONLESS, which bare node ESM refuses, so **`babylon-resolve.mjs`** beside the selftest
is registered through `module.register()` for that one thing. It is node-only and nothing the bundler
can see imports it.

`EnvironmentBRDFTexture0` is excluded by name and is not a leak: Babylon builds one BRDF lookup per
SCENE on the first PBR material and hangs it off `scene.environmentBRDFTexture`. It appears once
however many cycles run, and disposing it out from under a scene this module does not own would be
the actual bug. Nothing else survives a `dispose()`.

Left open and written up rather than done: the same measurement inside the real WebGL renderer, and
`game-soak.mjs` loading a flume at all. See `docs/game/requests/flumes.md` §9.

### 4.11 `selftest.mjs` — 190/190

`node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/flumes/selftest.mjs`,
and `pnpm test:game` runs it. Up from 143. What round 3 added:

- **The sheet** (twelve checks). The same chute at 4 m/s and at 14 m/s is the same water, to 1e-12 —
  the round-2 bug, stated as a property. It enters a chute clear and whitens down it, settling at
  `0.9·sin θ`. It is still aerated two metres past the foot of a drop and clear again seventy metres
  later, and the gradient break is the whitest point on a run rather than the drop itself. And each
  coefficient is zeroed one at a time and must change a shipped slide, the shape `wallResponse`
  taught this module: deleting `jump`, `wall` or `equilibrium`, or setting the development length to
  zero, all fail.
- **The seating** (three checks). No rider vertex outside the hull, per ring-hulled style, plus the
  absurd-`seatSpread` case.
- **The tower's rope light** (five checks per slide). It exists, it welds onto the rim strip with its
  indices offset rather than overlaid, and it spans from below half the tower's height to above the
  deck — i.e. it follows the stair down as well as drawing the deck.
- **The teardown** (seven checks). §4.10.

The measured table it prints:

| Layout                | Style   | Trough | Drop   | Top      | Ride | Exit Y | Tower  | Span x×z  | Δwall | Tris   | /h  |
| --------------------- | ------- | ------ | ------ | -------- | ---- | ------ | ------ | --------- | ----- | ------ | --- |
| `plunge-drop`         | body    | 113 m  | 13.7 m | 10.9 m/s | 23 s | +0.40  | 14.1 m | 38 × 76 m | 12°   | 16,468 | 327 |
| `spiral-tower`        | tube    | 170 m  | 15.9 m | 10.1 m/s | 29 s | +0.40  | 16.3 m | 60 × 42 m | 0°    | 35,804 | 277 |
| `family-bowl`         | raft    | 144 m  | 14.2 m | 10.2 m/s | 27 s | +0.40  | 14.6 m | 65 × 55 m | 18°   | 18,908 | 643 |
| `mat-straight`        | mat     | 89 m   | 11.4 m | 11.5 m/s | 14 s | +0.40  | 11.8 m | 7 × 84 m  | 17°   | 12,080 | 400 |
| `torrent-lane` (pack) | torrent | 70 m   | 12.3 m | 12.1 m/s | 11 s | +0.40  | 12.7 m | 0 × 67 m  | 0°    | 9,832  | 514 |

Everything the round-2 suite pinned is still pinned: the tower measured off the built mesh rather
than off the spec, `wallResponse` driven through the real `wallExtents` at responses 0 / 0.5 / 1, the
winding, the byte-identical rebuild and save round trip, the pack registered before and after
`attachFlumeContent`, and no NaN anywhere.

### 4.12 Kept from round 2, because the round-2 critic reproduced it and it must not be lost

**Every vehicle in the park drew white**, and the cause was an ordering trap in Babylon worth
keeping written down. Round 1 recorded `FlumeRider.tint` as computed and written nowhere. Round 2
wired it — an eleventh float in the frame buffer, a per-thin-instance colour buffer beside the matrix
one, a palette walk giving everyone in a raft a different colour — and it still reached no pixel:
`instanceColor` was present on all nine rig meshes, `hasThinInstances` was true, and
**`INSTANCESCOLOR` was absent from all nine compiled effects**.

`thinInstanceSetBuffer('color', …)` hot-switches the kind to `instanceColor`, and the define that
makes a shader declare that attribute is set in exactly one place, in `PrepareDefinesForAttributes`:

```js
if (mesh.isVerticesDataPresent('instanceColor') && (mesh.hasInstances || mesh.hasThinInstances))
  defines['INSTANCESCOLOR'] = true;
```

Two things about that line decide it: it only ever sets the define to **true**, and the whole
function early-returns while the attributes are clean. `rigFor` registers the buffer — which dirties
the attributes — and then sets `thinInstanceCount = 0`, which _is_
`_thinInstanceDataStorage.instancesCount = 0`, which _is_ `hasThinInstances === false`. So the one
compile that ever saw a dirty attribute list saw a rig with no vehicles in it, left the define off,
and cleaned the flag. `commitRiders` marks the material's attributes dirty on every empty → occupied
transition (`Constants.MATERIAL_AttributesDirtyFlag`, by name rather than as an 8), re-armed per
transition rather than once, because the material is shared by every rig. The round-2 critic
reproduced all three steps live on a clone of this module's own `flume-rider:raft`.

The four additions above are **12 + 3 + 25 + 7 = 47** new checks, which is 143 → 190 exactly.

---

## 5. What is missing or weak — ranked, honest

### 5.1 No guest can queue for or board a flume. Nobody rides these slides.

**The riders in the pictures are the module's own vehicles, not guests.** They have no needs, no
money, no height and no opinion; the park's guest count does not move when a slide runs; the HUD in
every frame above reads "On a ride 0" and "Riders per hour 0" while six vehicles are in the air.

Not fixable from this folder and not a defect of this module: **read
[`docs/game/requests/rides.md` §4](../requests/rides.md)**, which measured it on this tree.
`rides/sim.ts:263` refuses a `flume` exactly as it refuses a `coaster`. The shape that doc proposes
— a queueable kind declares itself — is the one this module wants; a third string in that check
would route guests to a slide with nothing to board.

### 5.2 The demo park has not been touched, and the placement is a REQUEST

Re-checked this round: `lib/game/demo-park/build.ts` contains **no flume**, and `plan.ts:198` still
reserves **36 × 30 m** while the smallest descent in the catalogue needs **38 × 76 m**.
[`requests/flumes.md` §6–§7](../requests/flumes.md) carry the enlarged pad and an exact placement —
two slides, two basins, coordinates, yaws, ground sampling — and **none of it is executed and none of
it is verified in the demo park.** The standing lesson from the `buildings` module (it proposed a
placement, the record said it had been executed, and the park shipped with zero buildings for weeks)
is why this paragraph is here in this form.

### 5.3 The slide has no queue line, no entrance and no exit path

There is no queue rail, no turnstile at the deck and no path from the run-out. `paths` is not a
dependency and the showcase does not load it. A tower with a stair and nobody on it is honest as far
as it goes, but the object is not finished until somebody can walk up to it.

### 5.4 The sheet is one material and one scrolling bump map, and there is no spray

The colour and the alpha are baked per station (§1, §4.3) and the material scrolls one normal map at
a fixed rate for the whole park. It reads as running water at ten metres and as a moving texture at
two — `.game-render/flumes-r3-detail/torrent-sheet-0900.png` is that second case, honestly.

What is still absent is everything particulate: no spray at the foot of a plunge, no bow wave in
front of a raft, nothing thrown off a wall in a hook. `effects` is a placeholder module, so there is
nothing to ask spray from yet, and the aeration march (§1) is exactly the quantity a spray emitter
would want when there is one — it already says where on a run the water is breaking up.

Two smaller things the round-3 model does not do. The **run-out is calm** in it: real water piling
into a braking lane is turbulent and white, and here `equilibrium` is zero on the level so the sheet
clears over `decay`. And the aeration is a scalar per station, so it cannot streak — real aerated
flow is white lines rather than a white wash, and that wants a texture channel rather than a vertex.

### 5.5 The rider does not move, and it is still four or six tubes

`buildRig` draws a torso, a head, two arms and (on a rim) two legs — 112 or 160 triangles, blunt on
purpose, because at the distance a rider is ever drawn a detailed body is invisible and `guests`
owns what a person looks like. Round 3 fixed where they sit and which way they face (§4.5); the
colours were fixed in round 2 (§4.12). What is left is animation: nobody grips, leans, raises an arm
or gets thrown against a wall, and five people in a raft sit at five identical angles round a ring.
At the `close` preset a rider is a handful of pixels, so this only shows at detail range.

### 5.6 Dispatch is a timer, and its clock is not the park's

Unchanged and still true. A rider descends on a fixed `SLIDE_SECONDS_PER_TICK` (0.05 s per tick),
never scaled by `clock.speed`, for the reason `rides` and `trains` both give — a rider driven by
park minutes would cover 130 m in a third of a second. **D-006 makes a park minute three real
seconds and does not touch this**: the slide clock was already independent of `clock.speed`, so the
tripled archetype speeds move guests past the slides and nothing on them. The dispatch interval is in
the same slide clock, so the visible dispatch rate is **not** the park's hourly capacity.
`FlumeView.ridersPerHour` is the honest figure and is derived from the interval and the seat count;
nothing reconciles the two, and nothing can until 5.1 is done.

### 5.7 Not modelled at all

No height restriction is enforced (the pack's `minHeightCm` is resolved and then read by nothing),
no wind or weather effect on a slide, no closing the slide at night, no maintenance or breakdown, no
lifeguard, no capacity limit on the run-out basin, no cost accounting beyond reporting `cost`,
`upkeep`, `power` and `water` — `management` never sees them because nothing asks.

### 5.8 The two point lights are still close to decoration

Round 3 gave the tower a lit edge and it is a material, not a light (§4.4) — so the sentence round 2
wrote about its own night rig is still half true. `flumes-night:flume-2` at y 16.8 with range 22.8
and `flumes-night:flume-10` at y 13.3 with range 17.8 are the whole lighting rig, only two of five
slides declare a `night.light` block, and the `medium` pool is two lights however many declare one.
What they buy is a warm wash on the deck and on the top of a chute; what draws a tower after dark is
`materials.glow`. Raising the quality preset to `high` would allow four, and there is no content for
them: giving the other three slides a night block is a `showcase.ts` edit nobody has measured, and
adding it without measuring is how round 2's night rig got written up as working.

### 5.9 The teardown is measured under a NULL engine, not the real one

§4.10 counts scene resources across three dispose/reboot cycles and finds nothing left behind, which
is a real answer to a rubric line that had none. It is not the whole answer: `NullEngine` has no GL
behind it, so a leaked texture handle, a leaked vertex buffer or a leaked shader program is
invisible to it — what is measured is the module's own bookkeeping, not the driver's. The two things
that would close it are outside this folder and are written up as `requests/flumes.md` §9:
`game-soak.mjs` loading a flume at all, and a WebGL-side resource count the harness can take.

---

## 6. Requests

[`docs/game/requests/flumes.md`](../requests/flumes.md) — nine items, none blocking, **one done**:

1. ~~`pnpm test:game` does not run `lib/game/flumes/selftest.mjs`~~ — **done**, `test:game-flumes`
   is in the chain (`package.json:105`, `:128`) and the run is green at 190 checks.
2. **No guest can queue or board** — points at `requests/rides.md` §4 rather than restating it.
3. `core/pack-schema.ts:188,190`: `flumeStyle` and `riderKind` are still closed four-way enums
   (worked around — the drawn style comes off the layout, and the showcase's `torrent` proves a
   fifth style from a pack with no code in this folder).
4. `buildSupports` still measures from the heartline (`supports.ts:257`), so `main.ts` passes a
   negative `structureDepth`. Correct arithmetic, a line nobody reading it would trust.
5. `flume:` is still not in `FORWARDED_PREFIXES` (worked around; the splash is drawn on the main
   side, which is the right thread for it anyway).
6. The demo park's `flumes` plot is still 36 × 30 m and nothing in the catalogue fits.
7. The demo-park placement, exactly specified — **a request, not a change**, and §5.2 above.
8. i18n: nothing needed yet; the words a HUD panel would want are listed.
9. **New in round 3.** `scripts/game-soak.mjs` loads no flume and the harness reports no GPU
   resource counts, so the "no leak across three dispose/reboot cycles" line of the budget rubric is
   answered here under a `NullEngine` (§4.10) and not under the driver. Two small asks, both outside
   this folder: a flume in the soak world, and `webglVersion`-side counts in `game-shot.mjs`'s
   metrics block.

---

## 7. Assumptions made without asking

- **A slide's start chute is a `launch` drive.** A level start at a push-off speed stalls a rider in
  1.2 m under a real friction coefficient — correctly, which is why every real slide has a water
  manifold at the top pushing you off. Each layout begins with `launch { length: 5, speed: 4.5 }`.
- **The style, not the ride's enum, decides what is drawn**, because the enum is core's and closed.
- **`FLUME_LIMITS` are reported, never enforced.** A slide's lateral load is what throws the rider up
  the wall rather than something to be cancelled.
- **Vehicle colours are derived from the flume's descent counter**, not from `ctx.rng`: a module that
  draws from the shared stream on a transient event shifts every later draw in it after a reload.
- **The equilibrium air concentration of a chute is `0.9·sin θ`** (§1). That is Wood's fit as
  Chanson reports it, for spillways rather than for gelcoat water slides, and nobody has measured a
  slide. The development and decay lengths (4 m and 14 m) are not from anywhere: they are set so a
  48° plunge is glassy at its lip and white at its foot, which is what a photograph of one shows.
- **A showcase may replace a camera preset for its own session** (§4.7). `camera/manifest.ts` says a
  pack that disagrees replaces the entry with one JSON object; a showcase is not a pack, and this
  reads that permission as covering it. The demo park never runs `showcase.ts`, so nothing outside a
  `?showcase=flumes` session sees it.
