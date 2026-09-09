# Requests from the `flumes` module

Everything here is outside `lib/game/flumes/`. Each item says what it is, who owns it, and what the
module does in the meantime — nothing below is blocking. **§1 is done** (round 2); §3 to §7 were
re-checked against the tree at the end of round 2 and are all still open, with the file and line
each was measured at.

---

## 1. ~~`pnpm test:game` does not run this module's selftest~~ — **DONE**

**Owner:** `package.json` (integrator) · **Closed:** `test:game-flumes` is at `package.json:128`
and in the `test:game` chain at `:105`; the run is green at **143** checks, ~3 s. Nothing is asked
for here any more — the paragraph stays because the round-2 additions are what the tower bug cost.

Five of the original checks caught real bugs while this module was being written: the
run-out ending 4.45 m underground (§ tower height, below), the wall rule that never fired because
the resting section was already taller than the rider needed, riders leaning to a side derived by
comparing two wall extents (which is always zero on a closed pipe), a level start chute that stalls
a rider in 1.2 m, and a save-round-trip comparison that was really testing the terrain.

---

## 2. A guest cannot queue for or board a flume — the same wall `rides.md` §4 describes

**Owner:** cross-module (`rides` owns the queue machinery, `guests` is the consumer) ·
**Value:** slides become a ride rather than moving scenery.

This is not a new finding and it is not restated here: **read
[`docs/game/requests/rides.md` § 4](./rides.md)**, which measured it on this tree. The one line that
concerns this module is already in it — `rides/sim.ts:263` is `if (entity.kind !== 'ride') return;`,
so a `flume` entity never reaches the module that owns `join`/`place`/`board`/`leave`, the balking
rules, the refusal reasons or the height check, exactly as a `coaster` does not.

**What this module does in the meantime, stated plainly so nothing here reads as more than it is:**
`sim.ts` dispatches its own riders on a timer. They are the module's own vehicles, not guests; they
have no needs, no money, no height and no opinion, and no guest is ever in one. The park's guest
count does not move when a slide runs. That is a deliberate placeholder for the picture and for the
throughput arithmetic, and the report says so in the same words.

**Do not fix it by adding `'flume'` to that check.** A guest routed to a slide with nothing to
board stands at the bottom of the tower for ever, which is worse than the honest nothing. The shape
`rides.md` §4 proposes — a queueable kind DECLARES itself, and a dispatcher behind the queue answers
"how many may board and when" — is the one this module wants too: its dispatcher is
`FlumeStyleSpec.dispatchSeconds` and its seat count is `FlumeRig.seats`, both already content.

---

## 3. `core/pack-schema.ts`: `flumeStyle` is a closed four-way enum

**Owner:** `lib/game/core/pack-schema.ts` (integrator) · **Value:** removes the last place a pack
has to pick from a list this module does not own.

```ts
export const flumeSchema = rideBase.extend({
  kind: z.literal('flume'),
  flumeStyle: z.enum(['body', 'tube', 'raft', 'mat']),   // ← closed
  riderKind: z.enum(['body', 'tube', 'raft', 'mat']),    // ← closed, and unread
  …
});
```

**Worked around rather than blocked.** A flume's drawn style comes off its **layout**
(`flumes.layouts[].style`), which is a `flumes`-category entry and therefore an open string; the
ride's `flumeStyle` is read for exactly one thing — picking the default layout when an entity names
none. So a pack can already ship a fifth kind of slide, and `showcase.ts` does: `torrent`, a wide
flat-floored racing lane with its own cross-section, wall response, friction, vehicle and dispatch
interval, registered after `main()` has run, with no line about it anywhere in `lib/game/flumes/`.

The ask is `z.string()` for both, the way `shopSchema.need` was opened for the same reason and with
the same fix (check it against the registered set at pack-registration time). `riderKind` is
currently read by nothing at all — the vehicle comes from the style's `rig` — so it is either an
open string or it should go.

---

## 4. `buildSupports` measures from the heartline, and a flume has none

**Owner:** `lib/game/track/supports.ts` · **Value:** removes a subtraction that reads as a bug.

`supports.ts:257` places a column's top at `HEARTLINE_HEIGHT + options.structureDepth` below the
spline, because on a coaster the spline is the rider's chest. This module's spline is the trough
FLOOR, so `main.ts` passes `structureDepth: CRADLE_DEPTH - HEARTLINE_HEIGHT` — a negative depth,
correct arithmetic, and a line nobody reading it would trust.

Suggested: an optional `offset` that replaces the heartline term rather than adding to it.

```ts
export interface SupportOptions {
  /** How far below the SPLINE the underside of the structure sits. Defaults to the heartline. */
  structureOffset?: number;
  …
}
```

Everything else in that file is reused as-is and works: the load-scaled spacing, the footings, the
self-crossing clearance test. It is a good piece of code doing a job it was not written for.

---

## 5. `flume:` is not forwarded from the worker

**Owner:** `lib/game/core/sim-runtime.ts:30` (`FORWARDED_PREFIXES`) · **Value:** cosmetic today.

`pools:`, `track:`, `ride:` and eleven others are forwarded; `flume:` is not, so an event this
module emits on the worker bus never reaches the main thread. The two events it would like to send
are `flume:splash` (a rider hit the water) and `flumes:changed`.

**Worked around and arguably better where it is:** the splash is detected on the MAIN side, from
the rider slot going empty between two frames, and drawn through `pools.splash(x, z, strength)`.
That is the right thread for a visual effect anyway. The request is for whoever adds a HUD panel
that wants to hear about a slide being switched off.

---

## 6. The demo park's `flumes` plot is too small for any slide in the catalogue

**Owner:** `lib/game/demo-park/plan.ts:198` + `build.ts` (integrator) · see §7 for the placement.

`plan.ts` reserves `flumes` at **(168, 18), halfX 18, halfZ 15** — a 36 × 30 m pad. Measured
footprints of the four built-in descents, on flat ground (`selftest.mjs` prints this table):

| Layout         | Style | Trough | Drop   | Tower  | Footprint (x × z) | Top speed | Ride |
| -------------- | ----- | ------ | ------ | ------ | ----------------- | --------- | ---- |
| `plunge-drop`  | body  | 113 m  | 13.7 m | 14.1 m | **38 × 76 m**     | 10.9 m/s  | 23 s |
| `spiral-tower` | tube  | 170 m  | 15.9 m | 16.3 m | **60 × 42 m**     | 10.1 m/s  | 29 s |
| `family-bowl`  | raft  | 144 m  | 14.2 m | 14.6 m | **65 × 55 m**     | 10.2 m/s  | 27 s |
| `mat-straight` | mat   | 89 m   | 11.4 m | 11.8 m | **7 × 84 m**      | 11.5 m/s  | 14 s |

None of them fits, and shrinking them is the wrong answer: these are the real dimensions. A
ProSlide family raft turns on a 12 m radius because a six-seat raft cannot turn on less, and a
tower that drops 14 m over 113 m of trough is a 12 % average gradient, which is what a body slide
is. A slide park that fits in 36 × 30 m is a paddling pool with a chute.

**Asked for: 80 × 60 m** (halfX 40, halfZ 30) at (168, 18), same pad height and blend. That takes
the plot from x ∈ [150, 186] to [128, 208] and z ∈ [3, 33] to [−12, 48]. The neighbouring
`water-park` plot is at (112, 50) halfX 22 halfZ 16 — i.e. x ∈ [90, 134] — so the enlarged pad
clears it by 6 m on the x axis. The park is 512 m across, so x = 208 is 48 m inside the east edge.

If that is refused, the fallback is one slide instead of two and a compact layout added to the
manifest; say so and this module will add a `plunge-short` (one hook, ~30 × 46 m, 9 m drop) in the
next round. It is not added speculatively, because a layout nobody places is a layout nobody looks
at.

---

## 7. Demo-park placement — **a request, and unverified until the integrator executes it**

**Owner:** `lib/game/demo-park/build.ts` (integrator) · **This module has not touched
`lib/game/demo-park/` and cannot verify any of the below in the demo park.** The standing lesson
from the `buildings` module — it proposed a placement, the integrator's notes recorded it as
executed, and the park shipped with zero buildings in it for weeks — is why that sentence is here
and in the report as well.

Assuming §6 (the enlarged pad). Ground heights are the pad's, so `y` is
`sampleHeight(world.terrain, x, z)` at each point, exactly as `placeDemoPools` does it.

```ts
import { attachFlumeContent, makeFlumeEntity } from '../flumes';

// …alongside placeDemoPools(), and after attachFlumeContent(registry):
function placeDemoFlumes(world: World, allocId: (kind: string) => string): Entity[] {
  const y = (x: number, z: number) => sampleHeight(world.terrain, x, z);
  return [
    // The tube spiral, on the west of the pad, running east-north-east so the helix stands
    // against the lake and the tower is the silhouette from the lakeside link.
    makeFlumeEntity({
      id: allocId('flume'),
      pack: 'neon-lagoon',
      item: 'tube-slide',
      layout: 'spiral-tower',
      x: 146,
      z: 40,
      y: y(146, 40),
      yaw: 1.15, // ≈ 66°, pointing east-north-east
    }),
    // The body slide, on the east, running west so its run-out ends beside the spiral's.
    makeFlumeEntity({
      id: allocId('flume'),
      pack: 'neon-lagoon',
      item: 'body-slide',
      layout: 'plunge-drop',
      x: 196,
      z: 4,
      y: y(196, 4),
      yaw: -1.9, // ≈ −109°, pointing west-south-west
    }),
  ];
}
```

and the two basins they land in. **Take these from `FlumesMainApi.exit(id)` rather than from the
numbers below** if you place them at runtime; the coordinates here are the measured exits of those
two layouts at those origins and yaws, and they move if either changes:

```ts
makePoolEntity({ id: allocId('pool'), shape: 'runout-lane', x: 172, z: 26,  y: y(172, 26),  yaw: 1.15,  size: [9, 20] }),
makePoolEntity({ id: allocId('pool'), shape: 'runout-lane', x: 160, z: -4,  y: y(160, -4),  yaw: -1.9,  size: [9, 20] }),
```

`attachFlumeContent(registry)` must be called before `makeFlumeEntity` for the same reason
`placeDemoPools` calls `attachPoolContent`: the factory refuses to invent a layout it does not know.

**What the integrator should check after placing them**, because this module cannot: that both
towers stand ON the pad rather than on its blend slope (the tower footprint is 4.8 × 4.8 m for the
steel one, 6.2 × 5.4 m for the timber one), and that neither run-out lands in the lake.

---

## 8. i18n keys

**Owner:** `lib/game/i18n/` (integrator). `build.flumes` ("Rutschen"/"Slides") and
`tools.group.flume` already exist and are enough for the build bar. Nothing in this module renders
a string to a human yet — there is no HUD panel for a slide — so no keys are requested. When one
lands it will want, per slide: name, style, length, drop, top speed, ride time, riders per hour and
a running/stopped toggle. The English words are in `FlumeView`.
