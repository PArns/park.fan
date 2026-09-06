# track — builder report

The coaster track system: an arc-length spline with a roll channel, a data-driven element grammar,
the extruded rails and their supports, and an energy model that decides whether a layout works.
Folder: `lib/game/track/` (19 files). Nothing outside it was touched except this report and
`docs/game/requests/track.md`.

## What exists

### Pure half (no Babylon, no DOM, no clock, no RNG — runs on the worker and in node)

| File          | What it owns                                                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vec.ts`      | Vector maths and the frame convention: `right = cross(up, dir)`, so `(right, up, forward)` is a right-handed triple.                                                |
| `spline.ts`   | C² cubic through the control nodes, arc-length table, rotation-minimising frame, roll channel. `pointAt`, `tangentAt`, `curvatureAt`, `rollAt`, `frameAt`, `length`. |
| `cursor.ts`   | The frame integrator every element is written against. Midpoint integration; emits nodes at a curvature-derived spacing.                                            |
| `ops.ts`      | Ten primitives: `straight turn pitch bank roll crest loop spin hill ramp`. The only `switch` in the module, and it switches on the instruction set.                 |
| `expr.ts`     | A 180-line recursive-descent evaluator so an element's op arguments can be expressions over its parameters. Not `Function()`.                                        |
| `elements.ts` | The element table — 19 entries as data — plus `registerTrackElement` and `registerTrackElementsFromPack`.                                                            |
| `build.ts`    | Pieces → nodes → circuit closure → spline → physics → resultant banking → spline. The two-pass design.                                                              |
| `physics.ts`  | The energy model and the verdict. Fixed Δs march, five-point train, load-dependent friction.                                                                        |
| `profile.ts`  | Rails, spine and crossties extruded along the spline into three vertex buffers.                                                                                     |
| `supports.ts` | Load-adaptive columns, timber bents, footings, X-bracing, and the clearance test against the track's own geometry.                                                  |
| `resolve.ts`  | Content pack → style, train, limits. Nothing else in the module names a pack.                                                                                       |
| `layouts.ts`  | Three complete circuits as piece lists.                                                                                                                             |
| `types.ts`    | `TrackData`, `TrackPiece`, `DriveSection`, `HEARTLINE_HEIGHT`.                                                                                                      |
| `noise.ts`    | Tileable value noise for the materials.                                                                                                                             |
| `sim.ts`      | The worker handle: builds from `coaster` entities, exposes the spline and the physics to `trains`.                                                                  |

### Main half (Babylon)

`textures.ts` generates four PBR sets (bare rail, painted steel, timber, concrete) from one height
field each; `materials.ts` shares them and tints only the paint; `main.ts` turns the geometry into
five meshes per coaster with an LOD level on the ties and the footings; `showcase.ts` stages
`/game?showcase=track`.

### Public API

```ts
// ctx.module<TrackMainApi>('track')  — and the same shape on the worker as TrackSimApi
styles(): { key, def }[]              // from the packs' trackStyles
elements(): TrackElementDef[]         // from the element table
create(data: TrackData, id?): string  // build + draw
remove(id): void
spline(id): TrackSpline               // pointAt / tangentAt / curvatureAt / rollAt / length
frameAt(id, s): TrackFrame            // { p, tangent, up, right }, heartline-centred
drives(id): DriveSection[]            // station | lift | launch | brake | block | transport, with s-ranges
physics(id): TrackPhysics             // per-station v, t, gVert, gLat, gLong, jerk, rollRate + verdict
validate(data): TrackPhysics          // without drawing
meshes(), stats()
```

Owned entity kind: `coaster`, with the layout in `entity.data` as `TrackData`. Nothing is stored in
`world.modules.track`: a layout is its piece list, so a saved coaster is a few hundred bytes and
gets whatever the generators learn next time it is built. Event: `track:changed { rideId }` (already
in core's `FORWARDED_PREFIXES`).

## The reference, and where it shows

Researched before any of it was written; the numbers below are in the code with the source named in
the docblock.

- **A vertical loop is a clothoid because the centripetal load is held constant, not because the
  shape is pretty.** Stengel, 1976. `ops.ts`'s `loop` integrates κ(s) = a_c / v(s)² with v from
  energy, so the radius tracks v² — wide at the bottom where the train is fast, tight at the top
  where it has slowed. The teardrop is the consequence. Measured on `Nordwind`: a 3.4 g loop enters
  on a 17.8 m radius and tops out on 6.3 m, and the rider's vertical g runs 4.20 at the bottom to
  2.4 at the top instead of the 6-and-0 a circle would give.
- **Banking follows the resultant acceleration vector, not the curve radius.** `build.ts` sets each
  auto-banked node's up-vector to `normalise(v²κ⃗ + g⃗)` at the speed the physics says the train
  really carries. It ramps itself, because the clothoid takes κ from zero.
- **Curvature never steps.** Every op that curves has clothoid transitions whose length comes from a
  roll-rate limit, not from a typed number.
- **Chain lifts sit at 20–30°** (Coaster101). The catalogue's default is 28.
- **Support spacing follows load.** Base spacing scaled by the local vertical g and by the column's
  own height.
- **Rolling resistance calibrated against a real ride** rather than picked from a table: Wodan at
  Europa-Park is 40 m of lift, 1050 m of track, arriving at a brake run ~10 m up → ~0.28 m/s² of
  average loss → µ ≈ 0.019. The first pass used 0.030 and could not get a 32 m wooden coaster round
  850 m of its own track.

## Two decisions worth arguing with

**The spline is the heartline, not the rails.** Modern coasters roll the track around a line through
the riders' chests rather than around the rails, and this module takes that literally: the curve the
generators integrate and the physics reads IS the rider's path, and `profile.ts` derives the rails
by stepping 1.1 m down the up-vector. The payoff is that there is nothing to correct — no roll-rate
term in the g calculation, no heartline offset in a transition — because the curve being integrated
is the one the rider travels. The costs are real and two: the heartline height is a constant here
rather than a property of the train (an inverted coaster wants a negative one, and
`trainStyleSchema` has no field for it — request §2), and every consumer has to know that
`frameAt(s).p` is 1.1 m above the rail, which is written on the API but is a thing to get wrong.

**The physics marches in arc length, not in time, and that is a deliberate reading of "fixed
20 Hz".** The question a validation pass exists to answer is whether the train crests the hill, and
at a crest the train is slow — so a fixed Δt puts its fewest samples exactly where the answer is
decided (0.05 s is 15 cm at the top of a lift and 1.7 m at the bottom of a drop). A fixed Δs samples
the geometry evenly and updates v² by the work done, which conserves energy by construction rather
than by being small enough. The 20 Hz tick still exists; `sim.ts` runs it, and it reads speeds out
of this table. The argument against: a Δs march cannot represent a train that stops, so a stall is
reported as an event rather than simulated, and the ride time comes out of ∫ds/v rather than out of
a clock.

## Verified

Commands run, and what they said.

| Command                                                            | Result                                                                                          |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `npx tsc --noEmit`                                                  | clean                                                                                           |
| `npx eslint lib/game/track`                                         | clean                                                                                           |
| `npx prettier --write lib/game/track/**`                            | applied                                                                                         |
| `pnpm test:game`                                                    | green (save round-trip, registry, i18n, soak, `game lint: 134 files clean`)                     |
| `node … lib/game/track/selftest.mjs`                                | **95 checks clean**                                                                             |
| `node scripts/game-shot.mjs --showcase=track --tod=… --cam=…`        | 9 shots, **0 console errors, 0 warnings, 0 hydration warnings** in every run                    |

The selftest is not a smoke test. It asserts the curvature of a splined circle is 1/R to within
1 %, that a frictionless 40 m drop arrives at √(2gh), that a fully banked circle has zero lateral g
and pulls sec(φ) vertically, that a 4 m, a 10 m and an 18 m hill peak at exactly their heights and
return to level, that a 46 m drop falls 46.00 m, that a one-turn corkscrew exits on the heading and
bank it entered and inverts on the way, that a runtime-registered element builds, that an unknown
one warns rather than throwing, that no index in any vertex buffer is out of range and no NaN
reaches one, and that none of the three layouts floats a footing or breaks its own comfort limits.

### The three layouts, measured

Through the registry, with the train each ride definition resolves to:

| Layout             | Style        | Length | Top speed | Drop   | Vertical g     | Lateral | Airtime | Ride  | Closure |
| ------------------ | ------------ | ------ | --------- | ------ | -------------- | ------- | ------- | ----- | ------- |
| **Nordwind**       | `steel-box`  | 979 m  | 104 km/h  | 46.0 m | −0.40 … 4.20   | 0.74    | 4.9 s   | 88 s  | 0.85 m  |
| **Alte Mühle**     | `wood`       | 900 m  | 82 km/h   | 30.0 m | −0.66 … 3.02   | 0.44    | 12.0 s  | 104 s | 1.33 m  |
| **Kleiner Kreisel**| `steel-tube` | 610 m  | 58 km/h   | 21 m   | 0.18 … 2.15    | 0.51    | 1.2 s   | 72 s  | 2.17 m  |

All three complete with **zero issues** against their own pack limits (5.0/2.6/−1.8, 4.2/2.4/−1.5,
3.5/2.0/−1.0) and arrive at their stations at 4.1, 4.0 and 2.3 m/s. Nordwind's 4.20 g is its loop;
Alte Mühle's twelve seconds of airtime are what an out-and-back is for.

### Budget

Track only, read off `api.stats()` in the running scene: **14 meshes, 181,656 triangles, 223,700
vertices** for 2,484 m of track, 556 columns and 1,392 braces. Build 490 ms, textures 725 ms at
512². Whole scene with the terrain: **48–107 draw calls** and 140k–610k triangles depending on the
camera, against a budget of 1,200 draw calls. The 1.0–1.6 fps is SwiftShader and means nothing.

### What the screenshots actually showed

Nine PNGs, all opened and looked at.

- `1200-close` — the family coaster from 40 m: twin rails, a round tube spine, the ladder of
  crossties down to it, blue steel columns with an X-brace in every bay, concrete pads at their
  feet, and the coaster's own shadow across the grass. Behind it the steel looper's loop and
  airtime hill. This is the frame the module stands on.
- `1200-ground` — a visitor's eye at 1.7 m: the wooden coaster on the right reads as a real timber
  lattice in warm brown, the family coaster's helix in the middle as a clean spiral, the looper on
  the left as a silhouette. The wood is the best thing in the set.
- `1200-overview` — from 340 m all three are readable and all three are thin. The wooden structure's
  members are under a pixel wide at that distance and alias into a dark smear (see "what is weak").
- `1830-close` / `1830-ground` — sunset behind the structures; the footings read as light pads
  against dark grass, and the paint goes warm without going orange.
- `1830-overview` — the weakest frame in the set: the whole scene is dim and the coasters are dark
  scribbles on dark grass.
- `2200-*` — night. The three coasters silhouette against a starfield and stay individually
  identifiable; nothing lights them, because ride light rigs belong to `effects`/`scenery` and the
  pack declares none on a coaster.

## What is weak or missing, ranked

1. **The overview frame aliases the wooden structure into a smear.** At 340 m a timber member is
   0.26 m of real width against roughly 0.5 m per pixel, so the 556 columns and their bracing
   sub-pixel-alias to a dark mass. Bracing alternate bays (done) halved the member count and it is
   still visible in `1830-overview`. The real fix is a distance LOD that replaces the timber lattice
   with a coarser silhouette, or MSAA the preset does not offer. Not attempted.
2. **Supports are vertical only.** A column meets the underside of the structure at whatever point
   is directly below it, and any stretch of track rolled past 78° is skipped entirely, because a
   vertical column would meet its underside edge-on. Real coasters cantilever off a neighbouring
   column there. On the three layouts this affects the corkscrew and the top half of the loop —
   which are, correctly, unsupported in reality too, so nothing floats; but a heavily overbanked
   layout would show gaps.
3. **A layout is tuned for a train, and nothing warns you.** The ops shape themselves from a running
   speed estimate that reads the train's drag area and rolling resistance, so a car 5 cm narrower
   builds a different track: two of the three layouts closed 5 m worse under a hand-written train
   spec than under the one the registry resolves. That is a real property of a physics-driven
   generator, but a build tool that lets a player change the train on an existing layout will need
   to rebuild and re-check the closure, and there is no API that says "this layout no longer meets
   itself".
4. **`drop` is the one element whose height is not exact.** `ramp` measures the arcs on a throwaway
   cursor and solves the straight, so a 46 m drop falls 46.00 m — but only for the radii it was
   given; ask for a height smaller than the two arcs can deliver on their own and the straight
   clamps to zero and the drop is deeper than requested. There is no warning. The selftest pins the
   working case, not that one.
5. **Nothing renders the station.** The station block is a `DriveSection` with an arc-length range
   and a length in metres; the platform, the shed and the gates are `buildings` and `rides`. On the
   showcase that leaves 22–24 m of ordinary track where a station should be, which reads as a gap.
6. **The physics assumes one train.** `simulateTrack` dispatches a full train from rest and runs one
   lap. Block sections exist as `DriveSection`s with `kind: 'block'` and a hold speed, and nothing
   uses them to keep two trains apart — that is `trains`, and this module exposes what it needs.
7. **The corkscrew's ends are a blended helix, not a real transition.** The rate is windowed so the
   curvature ramps from zero, which means the first and last fifth are not on the cylinder the
   middle is on. It looks right and the forces are right; it is not the shape a manufacturer's
   CAD would produce.
8. **No critic has graded it.** The numbers here — 0 console errors, 181,656 track triangles, 95
   checks, three layouts inside their limits — are all real and none of them says whether the frame
   is good.
