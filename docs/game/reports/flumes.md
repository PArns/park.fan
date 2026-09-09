# `flumes` — water slides on the track core

**Folder:** `lib/game/flumes/` (11 files) · **deps:** `core`, `track`, `pools` · **kind:** `flume`

**Verified, round 2:** `npx tsc --noEmit -p tsconfig.json` silent over `lib/game`,
`npx eslint lib/game/flumes` clean, `npx prettier --write lib/game/flumes` no change,
`pnpm test:game` exit 0 (the chain now runs this module — request §1 is done), `selftest.mjs`
**143/143**, and **33 frames rendered and opened with the Read tool**: the nine-frame showcase at
three times × three cameras, the same nine again with `--step=1200` so there are people on the
slides, fourteen hand-posed detail shots and a one-frame smoke render after the last edit.
**Zero console errors** in every run. Every figure below says which server it came from; unless
stated it is the **dev server at `http://localhost:3001`**.

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

**Water on the surface.** A separate sheet a few centimetres above the shell's floor, stopping well
short of the lip, carrying a per-vertex channel: RGB is foam, alpha is how much of the trough the
sheet hides — both baked from the local gradient and the rider's speed, so one material draws a
lazy run-out and a 48° plunge without a uniform per slide. Its limits are measured in §5.4.

**The tower and the landing.** Every slide starts on a steel or timber tower with columns, a deck
cut around the chute, a handrail, a switchback stair and a canopy; every slide ends in a `pools`
basin and calls that module's `splash(x, z, strength)` on the exact frame a rider lands, with the
strength scaled by the speed they arrived at. The lattice **under the run** is `track`'s
`buildSupports`, not part of the tower, and the two are visibly different objects in the frames.

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

### 4.1 The towers, which is what this round existed to settle

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

### 4.2 Frames — 33, every one opened with the Read tool

```
node scripts/game-shot.mjs --url=http://localhost:3001 --showcase=flumes \
  --cam=overview,close,ground --tod=09:00,18:30,23:00 --out=.game-render/flumes-r2-final
#  … and the same with --step=1200 → .game-render/flumes-r2-final-step
```

Both runs `ok: true`, 0 console errors, 0 hydration warnings, boot 10.5 s and 10.3 s. Two WebGL warnings
appear (`INVALID_VALUE: bufferSubData: buffer overflow`) and they are **not this module's** —
re-checked this round rather than repeated: `?showcase=pools` loads **0 flume meshes** and logs the
same two, twice and only twice.

The detail shots are posed by hand through `__parkfan_game.scene().activeCamera` at coordinates
computed from the measured tower boxes above, with the DOM overlay hidden so the frame is the scene.

| Frame                              | What is actually in it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `flumes-r2-final/0900-overview`    | The whole complex from the preset's 400 m. Five runs read as coloured lines on grass — purple tube spiral, magenta raft trough, teal body chute, two racing lanes, the pools between them. **The towers do not read as silhouettes at this distance**; they are ~10 px of dark speck and it is the trough colour that carries the frame. The complex occupies about a fifth of the frame width. Legible, not impressive — and round 1's "five silhouettes between 12 and 16 m" is not what this preset shows. |
| `.../0900-close`                   | The body slide's teal trough sweeping across the foreground on steel columns over the lagoon, water running inside it, the two northern towers and their chutes behind. The frame that shows the trough as an object.                                                                                                                                                                                                                                                                                         |
| `.../0900-ground`                  | Eye level at (0, 1.5, −79) looking −Z: a run-out lane 16 m ahead, and at 111 m the two racers — a steel tower with the teal mat chute leaving its deck, a timber tower with the cream torrent chute leaving its own. Both chutes start at the top of a tower.                                                                                                                                                                                                                                                 |
| `.../1830-*`                       | Dusk. The pools' underwater lamps carry the close and ground frames; the slides go to near-silhouette, and the teal rim strip along the mat racer's trough is the first thing that reads as the module's own light. The overview at dusk is the complex as a smudge.                                                                                                                                                                                                                                          |
| `.../2300-*`                       | Night. `2300-close` is the best of the three: the rim strip draws the whole teal trough as a glowing outline across the lagoon, and the timber racer's chute is lit warm along its length by the pack's `torrent-racer` night light. `2300-overview` is a scatter of magenta, purple and teal lines on black — the park reads as a water park from 400 m at night, which it does not by day.                                                                                                                  |
| `flumes-r2-final-step/*`           | The same nine with 1,200 ticks (one minute of slide clock) run first. Riders are present and small: one orange rider on the teal trough in `0900-close`, one on the mat racer in `1830-ground`. **The clock in these frames reads 09:59 / 19:29 / 00:00** — `--step` advances the world clock after `--tod` is applied, so the label and the light do not match. Harness behaviour, said out loud rather than cropped out.                                                                                    |
| `flumes-r2-detail/tower-tube-0900` | §4.1. The 18 m steel tower, its stair, its canopy, the pipe leaving the deck, the support bents under the run.                                                                                                                                                                                                                                                                                                                                                                                                |
| `.../tower-body-0900`              | Two towers in one frame — the timber one carrying a magenta trough with the water sheet white on its steep upper section, the steel one carrying the pink body chute — plus the purple helix and a teal trough behind.                                                                                                                                                                                                                                                                                        |
| `.../tower-raft-0900`              | The raft tower from behind with the sun low: timber lattice, pink canopy, the stair descending to the right and its shadow on the grass, the magenta trough leaving the deck to the left onto the timber bents.                                                                                                                                                                                                                                                                                               |
| `.../tower-mat-1830`               | Both racers in silhouette against the sunset, chutes leaving both decks.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `.../tower-tube-2300`              | The same tower at night: the pipe glows faintly, the tower is a black lattice against stars. Nothing on the tower itself is lit — §5.8.                                                                                                                                                                                                                                                                                                                                                                       |
| `.../trough-riders-0900`           | Close on the crossing over the lagoon: the raft trough's pale sheet, the body chute's white one, `track`'s columns and X-bracing underneath, sun-lounger furniture from `pools` on the deck.                                                                                                                                                                                                                                                                                                                  |
| `.../runout-0900`                  | The lagoon in the foreground with three slides behind it — the single frame that reads as a water park. Also the clearest view of §5.4: the body slide's plunge is a solid white band.                                                                                                                                                                                                                                                                                                                        |
| `.../rider-top-raft-0` + `-zoom`   | **The colour fix, §4.3.** Five riders in a family raft, from above: a yellow ring hull and five swimmers in teal, purple, orange, white and teal — `rig.colors[0]` and the five entries of `rig.wear`, in order.                                                                                                                                                                                                                                                                                              |
| `.../rider-top-tube-0`, `-1`       | A closed pipe from above: the purple tube with the slot along its crown, the pale sheet visible through the slot, and the rider's red tube glimpsed through it on the helix — inside and invisible from outside, which is correct. The helix's central column with its radial bracing is `track`'s.                                                                                                                                                                                                           |
| `.../rider-top-mat-0`              | One rider in purple on an orange mat, on the mat racer's shallow kerbed lane, over the support bents, with the tower's deck at the top of frame. The whole lane's sheet is a white ribbon — §5.4 at its most visible.                                                                                                                                                                                                                                                                                         |
| `.../park-all-0900`, `-2300`       | The five slides framed together from 424 m (the presets cannot — see §5.9). Day: coloured lines on a large empty field. Night: the same lines glowing.                                                                                                                                                                                                                                                                                                                                                        |

### 4.3 A bug the frames found: every vehicle in the park drew white

Round 1 recorded `FlumeRider.tint` as computed and **written nowhere**. Round 2 wired it — an
eleventh float in the frame buffer, a per-thin-instance colour buffer beside the matrix one, a
palette walk that gives everyone in a raft a different colour. It still reached no pixel, and no
test could have said so.

Measured, before: `instanceColor` present as a vertex-data kind on all nine rig meshes,
`hasThinInstances: true` on all nine, and **`INSTANCESCOLOR` absent from all nine compiled effects**
— so the buffer was built, written, uploaded and dropped at the attribute boundary, and every hull
and every rider drew with the vehicle material's white albedo. In the frame: `family-bowl`'s
five-entry `wear` palette rendered as five identical grey cylinders around a grey ring.

The cause is an ordering trap worth writing down. `thinInstanceSetBuffer('color', …)` hot-switches
the kind to `instanceColor`, and the define that makes a shader declare that attribute is set in
exactly one place, in `PrepareDefinesForAttributes`:

```js
if (mesh.isVerticesDataPresent('instanceColor') && (mesh.hasInstances || mesh.hasThinInstances))
  defines['INSTANCESCOLOR'] = true;
```

Two things about that line decide it: it only ever sets the define to **true**, and the whole
function early-returns while the attributes are clean. `rigFor` registers the buffer — which dirties
the attributes — and then sets `thinInstanceCount = 0`, which _is_
`_thinInstanceDataStorage.instancesCount = 0`, which _is_ `hasThinInstances === false`. So the one
compile that ever saw a dirty attribute list saw a rig with no vehicles in it, left the define off,
and cleaned the flag. The riders arriving a minute later dirty nothing.

`commitRiders` now marks the material's attributes dirty on every empty → occupied transition
(`Constants.MATERIAL_AttributesDirtyFlag`, by name rather than as an 8). Re-armed per transition
rather than once for good, because the material is shared by every rig and anything that dirties it
while a rig is empty resets that rig's define. **After: `INSTANCESCOLOR` true on 9 of 9**, saturated
pixels in the raft crop 15,450 → 30,330, and hue buckets at 160–180° (teal) and 20–60° (orange,
yellow) where there were none at all. `rider-top-raft-0-zoom.png` is the before/after.

### 4.4 Budget

Dev server, `?showcase=flumes`, at tick 1,280 (1,200 stepped), scene probe:

|                        |                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Flume meshes           | **53** in the scene, of which **49** are drawable — 8 per slide (shell, rim, water, legs, footings, tower, deck, canopy) + 4 coarse LOD copies + 9 shared rig meshes                                                                                                                                                                                                                             |
| Flume triangles        | **119,548** total; **94,060** excluding the coarse copies, which are never drawn beside their master                                                                                                                                                                                                                                                                                             |
| Whole scene            | 274 meshes, 39 materials                                                                                                                                                                                                                                                                                                                                                                         |
| Flume materials        | **18** — one per surface × colour, plus one shared `flume-vehicle` and one `flume-water`; four texture sets shared                                                                                                                                                                                                                                                                               |
| Vehicles in flight     | **6 hulls, 12 riders** across five slides after one minute of slide clock                                                                                                                                                                                                                                                                                                                        |
| Draw calls / triangles | one run, `flumes-r2-final-step/report.json`: at 09:00 overview **250 / 314,678**, close **191 / 364,986**, ground **177 / 342,750**, against a 1,200 draw-call budget. At 23:00 the same three are **132 / 128,166**, **73 / 114,422**, **61 / 105,478** — the daylight figures are two to three times the night ones because the sun casts shadows and the shadow pass re-submits the geometry. |
| Boot                   | 10.3–14.2 s under SwiftShader with five slides, five towers and six pools                                                                                                                                                                                                                                                                                                                        |

`fps` in `report.json` is 0.6–1.4 and is meaningless: headless Chromium here is SwiftShader. Draw
calls and triangles are real.

**The trough LOD works, and the way it is observed matters.** `scene.getActiveMeshes()` lists the
_master_ mesh's name whichever level is drawn, so reading that list says "five fine shells" at every
distance and proves nothing. Asking each mesh `getLOD(camera)` instead: at `overview` (camera 376–524 m
from the shells) **four of five resolve to their coarse copy**, taking the trough geometry from
46,880 to 25,488 triangles — a 45.6 % saving on the frame that needs it. At `close` (16–118 m) all
five resolve to the fine mesh. The fifth, `torrent-lane`, has no LOD level at all: its shell is
3,780 triangles, under the module's own `LOD_MIN_TRIANGLES` of 4,000, which is the rule doing its
job rather than a gap.

### 4.5 `selftest.mjs` — 143/143

`node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/flumes/selftest.mjs`
— and `pnpm test:game` runs it, which it did not in round 1.

Up from 94. The two additions that matter are both about what the earlier suite could not see:

- **The tower is measured off the built mesh.** Round 1 rebuilt the placement from
  `flume.towerHeight` on the pre-build resolve — the same wrong argument the renderer used — and
  printed the derived height beside the triangle count of a tower nobody would have shipped. It
  calls `towerPlacement(build, 0)` now and walks the Y extents of the geometry, which is the
  quantity a probe reads out of the running scene.
- **`wallResponse` is asserted where it is load-bearing**, and the pipe's section is asserted
  against its _resting wrap_ instead. See §1.

The measured table it prints, which is where every number quoted above comes from:

| Layout                | Style   | Trough | Drop   | Top      | Ride | Exit Y | Tower  | Span x×z  | Δwall | Tris   | /h  |
| --------------------- | ------- | ------ | ------ | -------- | ---- | ------ | ------ | --------- | ----- | ------ | --- |
| `plunge-drop`         | body    | 113 m  | 13.7 m | 10.9 m/s | 23 s | +0.40  | 14.1 m | 38 × 76 m | 12°   | 14,924 | 327 |
| `spiral-tower`        | tube    | 170 m  | 15.9 m | 10.1 m/s | 29 s | +0.40  | 16.3 m | 60 × 42 m | 0°    | 34,040 | 277 |
| `family-bowl`         | raft    | 144 m  | 14.2 m | 10.2 m/s | 27 s | +0.40  | 14.6 m | 65 × 55 m | 18°   | 17,364 | 643 |
| `mat-straight`        | mat     | 89 m   | 11.4 m | 11.5 m/s | 14 s | +0.40  | 11.8 m | 7 × 84 m  | 17°   | 10,696 | 400 |
| `torrent-lane` (pack) | torrent | 70 m   | 12.3 m | 12.1 m/s | 11 s | +0.40  | 12.7 m | 0 × 67 m  | 0°    | 8,368  | 514 |

`Δwall` is the largest difference between the two wall extents anywhere on the run. It is 0° on the
tube because that pipe rests at 170° and cannot be asked for more, and 0° on the torrent lane
because that layout has no turn in it.

What the selftest pins that a screenshot cannot settle: the cross-section is tangent-continuous
where the flat floor becomes the wall; the climb angle is exactly `atan(v²/gR)` and the outer wall
grows with it while the inner one never does; a front face winds against its shading normal; every
descent runs without stalling and arrives still moving; a pack registered **before**
`attachFlumeContent` and one registered **after** both land, and a broken entry beside them is named
and skipped; two builds of the same entity are byte-identical and the sim touches no clock and no
random stream; save → load → save is byte-identical on a world that has been run 2,000 ticks; no NaN
reaches a vertex or a save; and the triangle budget is printed rather than asserted from memory.

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

### 5.4 The water sheet saturates, and the number is 23.9°

The sheet's colour and its scroll rate are baked per station and the material scrolls one bump
texture at a fixed rate. It reads as running water at ten metres and as a moving texture at two.
There is no spray at the bottom of a plunge, no bow wave in front of a raft and no particle anywhere
— `effects` is still a placeholder module, so there is nothing to ask spray from yet.

Round 1 wrote "anything above about 25° of gradient is fully white"; the critic repeated it; here is
the arithmetic. `foam = 1.6·sin(slope) + 0.3·(v/vmax)` and the colour is
`(0.22, 0.52, 0.70) + white·(0.78, 0.48, 0.30)`, so **at the centreline the sheet is white at 23.9°
of gradient when the slide is at its top speed**, and **at the sheet's outer edge — which carries a
further 0.22 of foam because that is where it breaks against the wall — at 15.6°**. What round 2
changed is the _floor_, not the ceiling: measured across the five sheets in the running scene, the
calmest vertex is at red 0.243–0.253 (the ramp's foot, a green-blue) and only **5.2 % to 19.2 % of
each sheet's vertices are near-white**. The run-out and the shallow hooks read as water now and the
plunges are a white band, which `runout-0900.png` shows plainly. Whether that band is right for a
48° chute is a judgement I have made and not measured against a photograph.

### 5.5 The rider is four capsules, and now they are the right colours

`buildRig` draws a torso, a head and two arms — 112 triangles, blunt on purpose, because at the
distance a rider is ever drawn a detailed body is invisible and `guests` owns what a person looks
like. It does not animate; a rider does not raise their arms.

The palette half of this is **fixed** (§4.3) and the round-1 text saying `wear[0]` is used for
everyone is struck. What is left: at the `close` preset a rider is a handful of pixels, so the
colours only pay at detail range, and the rig has no pose — five people in a raft sit at five
identical angles.

### 5.6 Dispatch is a timer, and its clock is not the park's

Unchanged and still true. A rider descends on a fixed `SLIDE_SECONDS_PER_TICK` (0.05 s per tick),
never scaled by `clock.speed`, for the reason `rides` and `trains` both give — a rider driven by
park minutes would cover 130 m in a third of a second. The dispatch interval is in the same clock,
so the visible dispatch rate is **not** the park's hourly capacity. `FlumeView.ridersPerHour` is the
honest figure and is derived from the interval and the seat count; nothing reconciles the two, and
nothing can until 5.1 is done. Naming it again rather than pretending the tint fix touched it.

### 5.7 Not modelled at all

No height restriction is enforced (the pack's `minHeightCm` is resolved and then read by nothing),
no wind or weather effect on a slide, no closing the slide at night, no maintenance or breakdown, no
lifeguard, no capacity limit on the run-out basin, no cost accounting beyond reporting `cost`,
`upkeep`, `power` and `water` — `management` never sees them because nothing asks.

### 5.8 The night rig lights nothing you can see

Two `PointLight`s exist in the showcase (`flumes-night:flume-2` at y 16.8 with range 22.8,
`flumes-night:flume-10` at y 13.3 with range 17.8) and only two of five slides carry a `night.light`
block at all. In `tower-tube-2300.png` the tower is a black lattice: the light is at the deck, the
steelwork is thin, and a point light on a lattice illuminates almost no surface area. What actually
carries a night frame is the **rim strip** — `materials.glow` ramping its emissive with `night`,
which draws the whole trough as an outline in `2300-close.png`. The honest conclusion is that the
trim is the night rig and the point lights are close to decoration.

### 5.9 The showcase is not framed for the `overview` preset

The preset anchors on `park:centre` — the map origin — at 400 m, and this showcase spreads from
z = +54 to z = −196 because the two racers are placed on the `ground` preset's axis. So the complex
sits off-centre and small in all three overview frames, and no camera in the manifest frames the
five slides together; `park-all-0900.png` had to be posed by hand at 424 m off the content centroid
to do it. Either the placements move toward the origin (which costs the `ground` frame, the best one
the module has) or the showcase wants its own preset. Not fixed, because the trade is real.

---

## 6. Requests

[`docs/game/requests/flumes.md`](../requests/flumes.md) — eight items, none blocking, **one now
done**:

1. ~~`pnpm test:game` does not run `lib/game/flumes/selftest.mjs`~~ — **done**, `test:game-flumes`
   is in the chain (`package.json:105`, `:128`) and the run is green at 143 checks.
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
