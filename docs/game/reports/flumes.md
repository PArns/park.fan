# `flumes` — water slides on the track core

**Folder:** `lib/game/flumes/` (11 files) · **deps:** `core`, `track`, `pools` · **kind:** `flume`
**Verified:** `npx tsc --noEmit` clean over `lib/game`, `npx eslint lib/game/flumes` clean,
`npx prettier --write` applied, `pnpm test:game` green, `selftest.mjs` **94/94**, showcase rendered
at three times × three cameras with **zero console errors**.

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
until the rider sits flat; a slide is deliberately under-banked and the rider rides *up the wall*.
So the trough is built at a fraction of the coaster-perfect bank (`bankFactor`, 0.3 on a body
chute, 0.55 on a tube) and the remainder is answered by growing the shell on the loaded side:

```
f     = v²·κ⃗ + g⃗            the specific force pressing the rider into the trough
θ     = atan2(f·right, f·up)  the angle they climb to, signed
wall  = wrap + response · (|θ| + halfWidth/R + freeboard − wrap),  clamped to [wrap, maxWrap]
```

`v` is `speedAt(physics, s)` from **`track`'s own energy march** — the same integrator a coaster is
validated with — so the wall is a function of the speed the rider really carries there and not of
the curve radius. Measured, on a 0.5 m body-slide trough through a 9 m hook: **27 cm of wall at
6 m/s, 58 cm at 12 m/s.** The section is asymmetric through every turn, which is what a photograph
of a real flume shows. A closed pipe declares `wallResponse: 0` and keeps its section — by data,
not by a special case.

**Water on the surface.** A separate sheet a few centimetres above the shell's floor, stopping well
short of the lip, carrying a per-vertex channel: RGB is foam, alpha is how fast the water runs
there — both baked from the local gradient and the rider's speed, so one material draws a lazy
run-out and a 48° plunge without a uniform per slide.

**The tower and the landing.** Every slide starts on a steel or timber tower with columns, cross
bracing, a deck cut around the chute, a handrail, a switchback stair and a canopy; every slide ends
in a `pools` basin and calls that module's `splash(x, z, strength)` on the exact frame a rider
lands, with the strength scaled by the speed they arrived at.

---

## 2. Public API

`lib/game/flumes/index.ts` (worker-safe; `FlumesMainApi` deliberately not re-exported — import it
from `@/lib/game/flumes/main`).

### `FlumesSimApi` (worker) — `ctx.module('flumes')` in a `sim`

| Member | What |
| --- | --- |
| `ids()` | flume ids in the frame-buffer order (sorted) |
| `view(id)` / `views()` | `FlumeView`: length, drop, top speed, ride seconds, riders/hour, riders in the air, running, descents |
| `length(id)` | metres of trough |
| `exit(id)` | where the run-out ends, world metres |
| `riders(id)` | riders in the air |
| `setRunning(id, on)` | the pumps; a dry slide dispatches nobody and stops costing water |
| `stats()` | `FlumesStats`: flumes, riders, trough metres, m³/h, kW, descents |

### `FlumesMainApi` (main thread)

`catalogue()` (every registered layout), `styles()`, `registerContent(pack, block)`,
`create(spec)` → entity id, `remove(id)`, `flumes()`, `view(id)`, `exit(id)`, `meshes()`,
`stats()`, `focus(id)`.

### Commands, events, owned state

- Commands: `flumes:running { id, running }`, `flumes:rebuild`.
- Events emitted: `flumes:changed { id, type }` on the bus of whichever thread raised it. **Not
  forwarded across threads** — `flume:`/`flumes:` is not in core's `FORWARDED_PREFIXES`
  (`sim-runtime.ts:30`); request §5.
- World slot `world.modules.flumes`: `{ [id]: { descents, sinceDispatch, running } }` and nothing
  else. Riders in the air are **transient by design** — a save taken mid-descent reloads with an
  empty slide that refills over the next few seconds, which keeps the byte-identical round trip
  exact without rounding an arc length.
- Frame buffer `flumes.riders`: `MAX_RIDERS(64) × 10` floats — flume index + 1, arc length,
  position, quaternion, speed. Stats: `flumes.count`, `flumes.riders`, `flumes.waterM3`,
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

| From | Used for |
| --- | --- |
| `track` `buildTrack` + element grammar | the centreline, from a piece list, with `quick: true` so `bankFactor` survives |
| `track` `TrackSpline` / `TrackFrame` | frames, curvature and roll — no second spline exists in this module |
| `track` `simulateTrack` / `speedAt` | the speed at every station, which is what the wall is computed from |
| `track` `extrusionStations` | adaptive spacing: a chord that never sags more than a centimetre |
| `track` `buildSupports` | the columns and footings under the run, spaced by the local vertical g |
| `pools` `splash` / `create` / basins | the landing; the showcase places every basin at a **measured** exit |

Two derivations replaced numbers that would have had to be kept in sync by hand, and both were
bugs before they were derivations:

- **The tower is as tall as the descent needs.** A layout used to carry `towerHeight`, and every
  edit to a drop moved the exit: the five built-in descents ended at **−4.45, −3.43, −2.34, −5.24
  and −1.07 m** relative to the ground the tower stands on. `buildFlume` now builds the layout once
  from the ground to measure the fall and again from a tower that tall, so every run-out ends
  **0.40 m** above it.
- **Under-banking is a property of the STYLE**, injected into every piece that does not name its
  own `bankFactor`, so a layout is not the place to restate it.

---

## 4. What was verified, and how

### Screenshots — every one of them opened with the Read tool and looked at

```
node scripts/game-shot.mjs --url=http://localhost:3001 --showcase=flumes \
  --cam=overview,close,ground --tod=09:00,18:30,23:00 --step=1200
```

**`ok: true`, boot 15.3 s, 0 console errors, 0 hydration warnings** — over the full nine-frame run.
Two WebGL warnings appear (`INVALID_VALUE: bufferSubData: buffer overflow`) and they are **not this
module's**: the same two appear, twice and only twice, in `?showcase=pools`, which loads zero flume
meshes. Measured with a probe rather than assumed.

**How the frames on disk were produced, because it was not one clean run.** The nine-frame set was
rendered complete and clean (`ok: true`, 0 errors); two visual fixes then landed — the water's
colour floor and the raft hull's colour — and the re-render of the whole set was killed twice by
the dev server hot-reloading under another agent's edits (`page.evaluate: Cannot read properties of
undefined (reading 'metrics')`, i.e. the page reloaded and took `__parkfan_game` with it). So the
**three 09:00 frames and the three `detail-*` frames are current** and the **six dusk/night frames
predate the water tweak** — they differ only in how blue a calm sheet is, and the report.json now on
disk is that three-frame re-run rather than the nine-frame one. Said plainly rather than presented
as one run.

Nine frames in `.game-render/showcase-flumes/`, plus three hand-posed detail shots taken through
`__parkfan_game.scene().activeCamera` at coordinates computed offline from the build (the max-climb
station of each layout). What is in them, honestly:

| Frame | What I actually see |
| --- | --- |
| `0900-overview` | Five towers and their runs read as one water-park complex from 400 m: the purple tube spiral, the magenta raft trough, the teal body chute, two white racing lanes, the pools between them. It occupies about a fifth of the frame width — the preset is a fixed 400 m from the park centre and the complex is 150 m across, so it is small. Legible, not impressive. |
| `0900-close` | The body slide's teal trough sweeping across the foreground on steel columns over the lagoon, water running white-blue inside it, the two racers and their towers behind. This is the frame that shows the trough as an object. |
| `0900-ground` | Eye level: a run-out lane 16 m ahead, two racing lanes coming down at the camera, and both towers — the steel one and the timber one, with their stair shafts — at 70 and 85 m. A rider is visible on the right-hand lane as a small dark shape. |
| `1830-*` | Dusk. The pools' underwater lamps carry the frame; the slides go to near-silhouette because only two of the five carry a `night.light` block and the trough has no emissive trim. The water sheet still reads as a pale ribbon down each chute. Honest weakness, §5.8. |
| `2300-*` | Night. Same, darker. One warm chase light spills onto a run-out lane — the pack's `torrent-racer` rig doing its job. The towers are silhouettes against the sky. |
| `detail-raft-hook` | **The frame the module is for.** A 2.4 m magenta raft trough through its 12 m hook: the wall on the OUTSIDE of the turn is visibly taller than the one on the inside, a yellow raft with five riders sits in it, steel columns underneath. Measured at that station: **100 cm of wall on the loaded side against 64 cm on the other**, at 7.6 m/s and a 19° climb. |
| `detail-body-hook` | The body slide's near-level hook over the lagoon: the sheet reads as pale blue-green water with the trough's teal lip either side of it. The wall difference on a 0.5 m trough (27 → 36 cm here) is real and subtle. |
| `detail-tower-stair` | The raft trough leaving the timber tower: tall magenta walls, the flow-normal streaks visible in the water, the tower's cross bracing and its magenta canopy. The sheet is white here, which is what a 32° chute looks like, and is the same ramp that leaves the run-out blue. |

**Two real bugs were found by looking at these and fixed**, both invisible to every test:

- The switchback stair mirrored each return flight instead of reversing along it, so every other
  flight was thrown to the far side of the tower — the frame showed a lattice wall and a landing
  floating in mid-air with no stair under it.
- The canopy material was named `flume-canopy:…`, and `environment/surfaces.ts:29` identifies
  foliage by a regex over the material NAME that contains `canopy`. Every slide tower had a
  seasonally tinted green roof. `metadata.foliage = false` does not help (the test is
  `foliage === true || NAME.test(name)`); the material is called `flume-shade` now.

### Budget

Measured in the running showcase with a scene probe, at tick 1,200:

| | |
| --- | --- |
| Flume meshes | **44** — 7 per slide (shell, water, legs, footings, tower, deck, canopy) + 9 shared rig meshes |
| Flume triangles | **82,472** including rider instances, of 349,702 in the whole scene |
| Rider instances | **18** in the air across five slides |
| Flume materials | **18** — one per surface × colour, four texture sets shared |
| Whole scene draw calls | **233** at 09:00 overview, 161 at ground, 58–130 at night — against a 1,200 budget |
| Boot | 15.3 s under SwiftShader with five slides, five towers and six pools |

`fps` in `report.json` is 0.3–0.9 and is meaningless: headless Chromium here is SwiftShader. Draw
calls and triangles are real.

### `selftest.mjs` — 94/94

`node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/flumes/selftest.mjs`

The measured table it prints, which is where every number quoted above comes from:

| Layout | Style | Trough | Drop | Top | Ride | Exit Y | Tower | Span x×z | Δwall | Tris | /h |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `plunge-drop` | body | 113 m | 13.7 m | 10.9 m/s | 23 s | +0.40 | 14.1 m | 38 × 76 m | 12° | 12,856 | 327 |
| `spiral-tower` | tube | 170 m | 15.9 m | 10.1 m/s | 29 s | +0.40 | 16.3 m | 60 × 42 m | 0° | 31,504 | 277 |
| `family-bowl` | raft | 144 m | 14.2 m | 10.2 m/s | 27 s | +0.40 | 14.6 m | 65 × 55 m | 18° | 15,248 | 643 |
| `mat-straight` | mat | 89 m | 11.4 m | 11.5 m/s | 14 s | +0.40 | 11.8 m | 7 × 84 m | 17° | 9,108 | 400 |
| `torrent-lane` (pack) | torrent | 70 m | 12.3 m | 12.1 m/s | 11 s | +0.40 | 12.7 m | 0 × 67 m | 1° | 6,396 | 514 |

`Δwall` is the largest difference between the two wall extents anywhere on the run — the wall rule
doing its job. It is 0° on the tube because a closed pipe declares `wallResponse: 0`, and ~1° on the
torrent lane because that layout has no turn in it.

Nine things the selftest pins that a screenshot cannot settle: the cross-section is
tangent-continuous where the flat floor becomes the wall; the climb angle is exactly
`atan(v²/gR)` and the outer wall grows with it while the inner one never does; a front face winds
against its shading normal; every descent runs without stalling and arrives still moving; a pack
registered **before** `attachFlumeContent` and one registered **after** both land, and a broken
entry beside them is named and skipped; two builds of the same entity are byte-identical and the sim
touches no clock and no random stream; save → load → save is byte-identical on a world that has been
run 2,000 ticks; no NaN reaches a vertex or a save; and the triangle budget is printed rather than
asserted from memory.

---

## 5. What is missing or weak — ranked, honest

### 5.1 No guest can queue for or board a flume. Nobody rides these slides.

**The riders in the pictures are the module's own vehicles, not guests.** They have no needs, no
money, no height and no opinion; the park's guest count does not move when a slide runs; the HUD's
"On a ride" stays at 0. They exist so the geometry has something in it and so the throughput
arithmetic has a subject.

This is not fixable from this folder and is not a defect of this module. `rides/sim.ts:263` is
`if (entity.kind !== 'ride') return;`, so a `flume` never reaches the module that owns
`join`/`place`/`board`/`leave`, the balking rules, the refusal reasons and the height check —
exactly as a `coaster` does not. `TrainsSimApi` has no boarding call either. The cross-module design
is written up in **[`docs/game/requests/rides.md` §4](../requests/rides.md)** and pointed at from
[`requests/flumes.md` §2](../requests/flumes.md); the shape it wants is "a queueable kind declares
itself", not a third string in that check.

### 5.2 The demo park has not been touched, and the placement is a REQUEST

`lib/game/demo-park/` is not this module's folder. [`requests/flumes.md` §7](../requests/flumes.md)
carries an exact placement — two slides, two basins, coordinates, yaws and the ground sampling —
and **none of it is executed and none of it is verified in the demo park.** The standing lesson from
the `buildings` module (it proposed a placement, the record said it had been executed, and the park
shipped with zero buildings for weeks) is why this paragraph exists.

It also cannot be executed as-is: the reserved `flumes` plot is **36 × 30 m** and the smallest
descent in the catalogue needs **38 × 76 m**. §6 of the requests doc asks for 80 × 60 m and gives
the measurements behind the ask.

### 5.3 The slide has no queue line, no entrance and no exit path

There is no queue rail, no turnstile at the deck and no path from the run-out. `paths` is not a
dependency and the showcase does not load it. A tower with a stair and nobody on it is honest as far
as it goes, but the object is not finished until somebody can walk up to it.

### 5.4 The water sheet is a scrolled normal map, not a flow simulation

The sheet's colour and its scroll rate are baked per station and the material scrolls one bump
texture at a fixed rate. It reads as running water at ten metres and as a moving texture at two.
There is no spray at the bottom of a plunge, no bow wave in front of a raft, and no particle
anywhere — `effects` is still a placeholder module (`effects/index.ts` returns an empty handle), so
there is nothing to ask for spray from yet.

**And the foam ramp saturates early.** White is `1.6·sin(slope) + 0.3·(v/vmax)`, so anything above
about 25° of gradient is fully white — which is what a real chute at that angle looks like, and
also means most of the visible trough on a steep slide is a white ribbon rather than water. It was
worse (the first version's floor was already near-white at zero gradient, and every chute in the
park looked full of snow); the run-out and the shallow hooks read as blue-green now and the plunges
do not. Whether the ramp is right is a judgement I have made and not measured against anything.

### 5.5 The rider is four capsules

`buildRig` draws a torso, a head and two arms — 112 triangles, blunt on purpose, because at the
distance a rider is ever drawn a detailed body is invisible and `guests` owns what a person looks
like. It does not animate; a rider does not raise their arms, and a raft's five riders are five
copies of one mesh in one colour. In `detail-raft-hook` at 16 m they read as teal blocks. A style
declares a `wear` palette of up to five colours and this module uses `wear[0]` for every rider in
the park: `FlumeRider.tint` is computed at dispatch, is deterministic, and is then **written
nowhere** — it is not in the ten floats the frame buffer carries and the renderer has no
thin-instance colour buffer to put it in. Dead state, named here rather than left to be found. A
colour buffer beside the matrix one is the cheapest visible improvement left in the module.

### 5.6 Dispatch is a timer, and its clock is not the park's

A rider descends on a fixed `SLIDE_SECONDS_PER_TICK` (0.05 s per tick), never scaled by
`clock.speed`, for the reason `rides` and `trains` both give — a rider driven by park minutes would
cover 130 m in a third of a second. The dispatch interval is in the same clock, so the visible
dispatch rate is **not** the park's hourly capacity. `FlumeView.ridersPerHour` is the honest figure
and is derived from the interval and the seat count; nothing reconciles the two, and nothing can
until 5.1 is done.

### 5.7 Not modelled at all

No height restriction is enforced (the pack's `minHeightCm` is resolved and then read by nothing),
no wind or weather effect on a slide, no closing the slide at night, no maintenance or breakdown, no
lifeguard, no capacity limit on the run-out basin, no cost accounting beyond reporting `cost`,
`upkeep`, `power` and `water` — `management` never sees them because nothing asks.

### 5.8 Cosmetic gaps found in the frames and left

- The night rig is a **point light at the tower top** and only two of the five slides carry one
  (`tube-slide` in the pack, `torrent-racer` in the showcase pack) — the trough itself has no
  emissive trim, so a slide with no `night.light` block is simply dark at 23:00.
- The trough's shell carries no LOD. At `overview` a 1 m trough is two pixels wide and is still
  drawn at its full station count; the towers carry the frame at that distance, which is why they
  are the tallest thing the module draws, but a distance LOD is the obvious next saving.
- The stair is drawn but has no gate, no queue rail and no signage at its foot.

---

## 6. Requests

[`docs/game/requests/flumes.md`](../requests/flumes.md) — eight items, none blocking:

1. `pnpm test:game` does not run `lib/game/flumes/selftest.mjs`.
2. **No guest can queue or board** — points at `requests/rides.md` §4 rather than restating it.
3. `core/pack-schema.ts`: `flumeStyle` and `riderKind` are closed four-way enums (worked around —
   the drawn style comes off the layout, and the showcase proves a fifth style from a pack).
4. `buildSupports` measures from the heartline; a flume's spline is the trough floor, so `main.ts`
   passes a negative `structureDepth`.
5. `flume:` is not in `FORWARDED_PREFIXES` (worked around; the splash is drawn on the main side).
6. The demo park's `flumes` plot is 36 × 30 m and nothing in the catalogue fits.
7. The demo-park placement, exactly specified — **a request, not a change.**
8. i18n: nothing needed yet; the words a HUD panel would want are listed.

---

## 7. Assumptions made without asking

- **A slide's start chute is a `launch` drive.** A level start at a push-off speed stalls a rider
  in 1.2 m under a real friction coefficient — correctly, which is why every real slide has a water
  manifold at the top pushing you off. Each layout begins with `launch { length: 5, speed: 4.5 }`.
- **The style, not the ride's enum, decides what is drawn**, because the enum is core's and closed.
- **`FLUME_LIMITS` are reported, never enforced.** A slide's lateral load is what throws the rider
  up the wall rather than something to be cancelled.
- **Vehicle colours are derived from the flume's descent counter**, not from `ctx.rng`: a module
  that draws from the shared stream on a transient event shifts every later draw in it after a
  reload.
