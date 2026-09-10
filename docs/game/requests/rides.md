# rides — requests

Things this module needs that live outside `lib/game/rides/`. Each names the exact patch and the
workaround that shipped instead. The module is complete and green without any of them.

---

## 1. `guests` has no hook for a ride, and the one it needs is eleven lines

**Owner:** `guests` · **Value:** the whole queue, wait, balk and satisfaction path becomes real
rather than exercised only by the selftest and a demo flag.

`guests/sim.ts` already builds a `kind: 'ride'` venue out of every ride entity, scores it against
the archetype's `thrill`, walks a guest to it — and then, on arrival:

```ts
case 3: {
  // A ride exists as a venue but nothing boards yet: the `rides` and `trains` modules own
  // that. Until they do, a guest reaching a ride waits at it and then moves on, which is
  // what somebody does at a ride that is not running.
  d.state[slot] = GuestState.QUEUING;
  d.busyUntil[slot] = now + 2 + rngChoice.next() * 4;
  break;
}
```

The `shops` wiring beside it is the shape the fix takes. `RidesSimApi` is deliberately the same
five verbs as `ShopsSimApi` so the diff is small:

```ts
// near `shopsApi()`
const ridesApi = () => ctx.module<RidesSimApi>('rides');

// case 3, replacing the block above
const api = ridesApi();
const venueId = nearestVenueId(slot);
if (api && venueId) {
  const join = api.join(venueId, d.id[slot], {
    heightCm: Math.round(archetype.height * 100),
    cash: d.cash[slot],
  });
  if (join) {
    rideErrands.set(slot, { ride: venueId, ticket: join.ticket, joined: now });
    setDestination(slot, join.x, join.z, KIND_RIDE_QUEUE); // a new destKind, like KIND_SHOP
    return;
  }
}
d.state[slot] = GuestState.QUEUING;
d.busyUntil[slot] = now + 2 + rngChoice.next() * 4;
```

…plus, in the per-tick pass that already polls `shops.collect()`, the same for
`rides.board(ride, ticket)`: on a receipt, `d.state[slot] = GuestState.RIDING`,
`d.busyUntil[slot] = now + receipt.rideMinutes`, take the happiness relief, and call
`rides.leave()` when it expires or when patience runs out. `place(ride, ticket)` moves them up the
line exactly as `shops.place()` does.

**What shipped instead:** `sim.ts` → `bridge()`. It scans the guest store round-robin
(`SCAN_PER_TICK = 96` slots a tick) through `guests.inspect(slot)`, and a guest in state `queuing`
within 7 m of a ride's entrance is put in that ride's line, with a height taken from
`guests.archetypes()`. It is the same "records a sale it did not make" bridge `shops` describes in
§2 of its own report, and it is blind in the same three ways: the guest does not know it is in a
line, cannot balk, and its happiness does not move. It also costs `inspect()` calls that a real
hook would not — measured in the report.

---

## 2. A pack cannot say how reliable a machine is

**Owner:** core (`lib/game/core/pack-schema.ts`) · **Value:** one field, and breakdowns stop being
derived.

`rideBase` has `excitement`, `fear`, `nausea`, `power`, `upkeep` and no reliability. Patch:

```ts
const rideBase = visual.extend({
  // …
  /** Mean park minutes between breakdowns. Derived from the ride's intensity when absent. */
  mtbfMinutes: z.number().positive().optional(),
});
```

**What shipped instead:** `mtbfFor()` in `manifest.ts` derives it from the ride's own intensity —
`3200 / (1 + (0.5·excitement + 0.3·fear + 0.2·nausea) · 0.55)`, which gives the bundled carousel
1,860 park minutes and the top spin 726. That is defensible (fairground operators do budget
maintenance by intensity) but it is a number no pack can override, which is exactly the thing this
project grades.

---

## 3. `flatRideSchema.footprint` disagrees with `rig-ferris` about which way the wheel faces

**Owner:** `core-classic` pack · **Value:** one swapped pair, and a build tool's ghost stops being
sideways.

`core-classic:ferris-wheel` declares `"footprint": [12, 30]` while its rig turns the wheel about
**z** (`rig-ferris` → `wheel.animate.roll.axis = "z"`), so the wheel's plane is XY and the drawn
machine is 27.2 m across in **x** and 7.3 m in z. Measured with
`node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/rides/selftest.mjs`
and the extent probe in the report. The fix is `"footprint": [30, 12]`.

**What shipped instead:** nothing — the module sizes the rig off the footprint's _shorter_ and
_longer_ side rather than off x and z, so it draws the right wheel; only the plot the footprint
claims is wrong, and that belongs to whatever build tool reads it.

---

## 4. `pnpm test:game` does not run this module's selftest

**Owner:** `package.json` (integrator).

```jsonc
"test:game-rides": "node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/rides/selftest.mjs",
"test:game": "… && pnpm test:game-rides && …"
```

267 checks, exit 0, ~2 s. Six of them are the ones that caught real bugs in this module (the
facing mapping, the nested-unit parenting, the hollow drum, the rounded accumulator).

---

## 5. Two constants are duplicated from `guests`

**Owner:** core · **Value:** small, and the duplication is real.

`PARK_OPEN = 9 * 60` and `PARK_CLOSE = 23 * 60` in `sim.ts` are copies of `guests/sim.ts`'s. There
is nothing in core that answers "is the park open", and importing them would pull the guest
simulation into a worker bundle that has no guests in it (`shops` records the same problem, §5 of
its requests). A `world.meta.hours` or a `core` helper would end it for both modules.

---

## 6. The demo park's `fairground` plot: what I would put on it

**Owner:** `demo-park` (integrator places it). The plot is `(96, −46)`, 48 × 42 m, flattened to
2.6 m, ringed by its own path loop.

Six machines fit with room to walk between them. Positions are the plot's own frame, `yaw` turns
the loading gate towards the ring path (the module puts the entrance on `queueSide` of the
footprint, rotated by the yaw):

| item                        | position     | yaw    | why there                                                                                                                                  |
| --------------------------- | ------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `core-classic:ferris-wheel` | `(112, −60)` | `0`    | The tallest thing on the plot (27 m), on the far corner, so it reads against the sky from the main street rather than over the other five. |
| `core-classic:carousel`     | `(84, −34)`  | `π/2`  | Nearest the loop's west side and the first machine a visitor meets — a carousel is what a fairground opens with.                           |
| `core-classic:swing-ride`   | `(110, −34)` | `-π/2` | 22 m footprint, needs the clear middle of the north half; its chairs fly out to 10.5 m at speed.                                           |
| `neon-lagoon:wave-swinger`  | `(84, −58)`  | `π/2`  | The second-tallest and the only themed one, diagonally opposite the wheel so the plot has two anchors.                                     |
| `core-classic:top-spin`     | `(108, −58)` | `π`    | 16 × 12 and only 8 m tall; it sits under the wheel without competing with it.                                                              |
| a food kiosk (`shops`)      | `(96, −30)`  | `0`    | Not mine to place. A fairground with no chip stand is a rendering of one.                                                                  |

`stats().ratedThroughput` for those five is **2,904 riders an hour**, which is a plausible
fairground for a park of the demo's size. With the `guests` patch in §1 they would fill; without
it they run on `rides:demo`, which the demo park must **not** set.

Two cautions. The wheel's own extent is 27.2 m in **x** (see §3), so it needs the long axis of the
plot; and every machine lays a hard standing of `max(halfShort, halfLong × 0.72) + 0.9` m radius,
so the five above put about 1,050 m² of paving on a 2,016 m² plot — which is what a fairground
looks like, but the path loop should not also pave under them.

---

## 4. A coaster has no queue and no boarding, and the scoreboard described it as a string mismatch

**Owner:** cross-module — `rides` owns the machinery, `track`/`trains` own the coaster, `guests`
is the consumer · **Value:** the game's headline object becomes playable. Today a coaster is
scenery that moves.

**Written up here because the open issue was wrong about the size of it.** `STATUS.json` recorded
"NO GUEST IN THIS GAME CAN RIDE A COASTER" as a kind mismatch: `track` claims `kinds: ['coaster']`,
`rides` claims `kinds: ['ride']`, and `guests/sim.ts` builds a ride venue from
`entity.kind === 'ride'`. That is all true and it is not the problem. Adding `'coaster'` to that
check would send guests walking to a coaster where they would stand for ever, which is worse than
the honest nothing they do now. Measured on the tree:

| Question                            | Answer                                                                                                         | Where                                                      |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Does `rides` see a coaster at all?  | No, it returns on the first line                                                                               | `rides/sim.ts:263` — `if (entity.kind !== 'ride') return;` |
| Does `trains` have a boarding API?  | No. `ids`, `status`, `statuses`, `trains`, `profile`, `setFleetSize` and nothing else                          | `trains/sim.ts:54-66`                                      |
| Does `trains` know about a station? | Yes — `plan.station`, `dwellSeconds`, dispatch, block holding                                                  | `trains/sim.ts:214-356`                                    |
| Does anything queue for a coaster?  | No. Grepping `coaster` across `guests/` and `rides/` returns an archetype name, two comments and one docstring | —                                                          |

So a coaster's trains dispatch on a dwell timer with nobody in them, and the machinery that would
put somebody in them — `join`, `place`, `board`, `leave`, balking, the refusal reasons, the height
check — exists once, in `rides`, wired to flat rides only.

**The shape this wants, and the reason it is not three lines.** `RidesSimApi`'s queue half is not
about flat rides; it is about a line of people and a vehicle that takes some of them. What makes it
flat-ride-specific is where the throughput comes from: `rig.ts` says as much in its own docstring —
"a flat ride's throughput is a number a park manager plans with and a coaster's lap time is not".
A coaster's capacity is the fleet's, and `trains` already computes it (`profile`, `cycleSeconds`,
the block plan). So the split is: `rides` keeps the queue and the boarding contract, and a
**dispatcher** behind it answers "how many may board, and when" — a constant for a flat ride, the
station block's arrival for a coaster. `trains` would then need to say a train is standing at the
platform with N seats and take a boarding count back.

**And `flumes` walks into the identical wall.** A flume is `kind: 'flume'`, `rides/sim.ts:263`
refuses it too, and its riders queue exactly like a coaster's. Whoever does this should do it as
"a kind that can be queued for declares itself" rather than as a second string in the check —
`registry.registerKind` already claims an open union, and this module's own rule is that core never
switches on a kind. Three kinds in the switch is the point at which the switch is the bug.

**Not done here** because it spans four modules and is a round of its own, not an integrator patch.

---

## 5. ~~The two plots reserved for a coaster and a flume are still empty~~ — DONE, with two corrections

**Owner:** `demo-park` · **Done** in `lib/game/demo-park/build.ts` §4f. `buildWorld` now answers a
`coaster` and a `flume` and `pnpm game:day-budget` reports both.

**Neither coordinate in the original request survived, and the reason is worth keeping.** What
this section measured was the STATION's distance to a footpath — whether a queue can form, which
is a fair and necessary thing to measure. It says nothing about the other 200 m of the machine.
Placed exactly as proposed and then measured against the terrain:

| machine | as proposed | measured |
| ------- | ----------- | -------- |
| coaster `(-66, 8, -30)`, yaw `-π/2` | dock 1.3 m off `coaster-loop` | **293 of 1201 samples underground**, -2.68 m into the ridge at (-184, -27); crosses `coaster-loop` at **0.6 m** and `garden-walk` at 2.5 m |
| flume `(160, 2.2, 18)`, yaw `π/2` | stair 9 m off the lakeside link | **95 of 601 samples underground**, -1.19 m; overhangs its pad by 30 m north; run-out ends in mid-air over grass |

The build was green, `pnpm test:game` passed including the soak's `no unreachable queues`, and both
machines took riders all day. Nothing in the project asked the question, so
**`scripts/game-fit-check.mjs`** (`pnpm game:fit`, in `pnpm test:game`) now does, per placed
coaster and flume: samples below ground, minimum clearance over any footpath, overhang past the
reserved plot, dock against the 14 m service radius.

**What shipped instead**, picked by scanning the shelf on a 5 m grid over 24 headings and keeping
what clears every path by 3 m:

| entity | pack:item | position | yaw | measured |
| ------ | --------- | -------- | --- | -------- |
| `coaster` | `core-classic:family-invert`, layout `kleiner-kreisel` | `(-75, 11.8, -30)` | `-π/2` | 0 underground, **3.84 m** over `coaster-loop`, dock 3.4 m from it |
| `flume` | `neon-lagoon:tube-slide`, layout `spiral-tower` | `(148, 3.69, 6)` | `π/2` | 0 underground, crosses no path, dock 5.9 m from `lake-link` |
| `pool` | `runout-lane`, `splashdownFor` the slide | `(167.1, 60)` | `0` | ground varies 0.23 m over the basin, 11 m from `lake-link` |

Two rules came out of it. **The Y of a machine is set by its whole footprint, not by the ground
under its station** — `kleiner-kreisel` dips 2.18 m below its own origin before the terrain is
consulted, so an origin at ground level is a trench; both Y values above are the lowest at which
nothing is buried, plus 30 cm — 3.80 m of station above an 8.00 m shelf, 1.42 m of tower above
2.27 m of ground. And **a slide has to end in water**: `flumes` resolves a splashdown
by proximity when the entity does not name one, the nearest pool was 34 m away, so the trough
simply stopped over open grass with a support column under it — clean by every check, wrong in the
first screenshot. Both ends name each other by id now.

**Two things this did NOT fix**, both reported rather than hidden:

- The machines are bigger than the plots. The coaster reaches 95.7 m west and 58.9 m east of a
  58 × 48 m shelf, the slide 18 m north of a 36 × 30 m pad. They land on open grass and cross
  nothing, so this is plot sizing and not a broken frame — the fix is still a fourth bundled
  layout drawn for a starter plot (STATUS.json).
- **`track` draws no station.** Screenshotted at 48 m: the two trains stand on bare track, no
  platform, no roof, no queue rail, no boarding edge. `flumes` draws a tower, a deck and a shade
  roof, which is what makes the gap obvious side by side.

And the cost of the placement, measured with `pnpm game:boarding --flat-only` as the before column:
arrivals 2261 → 2738 (+21 %), rides **5418 → 4277 (−21 %)**, interactions per visitor 7.01 → 5.14,
both machines at 18–19 % utilisation with an empty line. That is the walk and not the ride — a
guest covers 1–1.5 m per park minute (D-006) and the shelf is 200 m west of the fairground — so the
number that would change it is the walking speed, not the plot.

## 6. A coaster and a flume are as exciting as the default

**Owner:** `core-classic` and `neon-lagoon` packs · **Value:** four numbers per entry, and the
thrill model starts telling machines apart.

`rideBase` carries `excitement`, `fear`, `nausea` and `minHeightCm`, and every **flat** ride in
both packs declares them. Not one `coaster` or `flume` entry does:

```
core-classic  wooden-classic  coaster  minHeight 120  excitement —  fear —  nausea —
core-classic  steel-hyper     coaster  minHeight 130  excitement —  …
core-classic  family-invert   coaster  minHeight 100  excitement —  …
neon-lagoon   neon-launch     coaster  minHeight 130  excitement —  …
neon-lagoon   body-slide      flume    minHeight —    excitement —  …
```

So `resolveDockedRide` falls back to 6 / 3 / 2 for all six, and `guests/decide.ts`'s thrill match
— which is a MATCH, not a maximum, so a nervous visitor should be steered away from a hyper and
towards a family invert — gives every coaster in the game the same score. The rating model in
`rides` is content-driven precisely so this is a manifest edit; it is only a manifest edit.

A steel hyper is not a family invert and both are not a body slide. Rough shape: hyper 8.6 / 7.2 /
3.4, wooden 7.4 / 6.0 / 4.1, family invert 5.8 / 3.4 / 1.9, neon launch 8.9 / 7.8 / 3.0, tube
slide 5.2 / 3.0 / 1.4, body slide 6.0 / 4.2 / 1.8, raft slide 4.4 / 2.2 / 1.2.

## 7. A train reports the last load it took, not who is on it

**Owner:** `trains` · **Value:** the mass in the physics is honest, and a car can be drawn with
people in it.

`TrainsSimApi.seat(rideId, n)` records `FleetState.riders` — one number per fleet, the load the
queue last handed over. That was the narrowest thing that could be added without restructuring the
fleet, and it is enough for a HUD and for this round. Two things it is not:

- **`trainMassKg(profile)` is computed once at fleet creation** and never sees a rider. A full
  train and an empty one accelerate identically down the same drop, which is wrong by about 25 %
  of the mass on a 20-seat train at `riderMass`.
- **`geometry.ts` draws empty seats.** With a per-train rider count the front cars could be
  filled first, which is what a real dispatch looks like.

Both want `riders` on `TrainState` rather than on `FleetState`, set when a train leaves the
platform and cleared when it returns — which is a change to `placeTrains`, the save shape and the
motion context, i.e. exactly the restructuring this round was told not to do.

## 8. The park clock and the ride clock cannot both be right, and a queue has to pick one

**Owner:** core (D-006) · **Value:** the dispatch you watch and the dispatch a guest experiences
become the same event.

At speed 1 one tick is `MINUTES_PER_TICK_AT_SPEED_1 = 1/60` park minutes and `0.05` ride seconds,
so twenty park minutes pass per real minute; at speed 20, four hundred do. A machine's animation
is therefore real time and the park around it is not, and a 92.5-second coaster cycle is 30 park
minutes of a guest's day at speed 1 and ten park HOURS at speed 20.

`Dock` resolves it by converting — the machine's own interval read as real seconds, expressed in
park minutes — which is the same conversion `rides/sim.ts` has always made between a flat ride's
cycle and its `spin`, and the same one `trains`' `FleetStatus.ridersPerHour` and `flumes`'
`ridersPerHour` both already make and both already document as "reported rather than counted".
Three modules now paper over one arithmetic problem in three places.

Measured consequence: over one park day the coaster's line boarded about **70** loads while its
trains completed **2** physical dispatches. Nothing is wrong with either number; they are answers
to different questions, and a visitor watching the platform sees the queue drain without a train
leaving.

There is no small fix. It is a decision about whether `clock.speed` scales the machines too (which
makes a coaster at speed 20 a blur, and steps a train clean over a 24 m block brake in one tick —
`trains/types.ts` gives that reason at length), or whether the park day slows down to real time
(which makes a park day fourteen real hours). Anything in between is what is shipping.

## 9. A coaster breaks down and its trains keep going round

**Owner:** cross-module, `rides` + `trains` · **Value:** one event, and a breakdown looks like one.

`rollBreakdown` runs for every machine with a line in front of it, including a coaster — derived
MTBF 951 park minutes, so about once a park day. When it fires, `rides` closes the queue, lets the
line go and emits `ride:breakdown`; `trains` is not listening, so the fleet carries on dispatching
empty trains past a station nobody may join.

The fix is small and is not mine: `trains` subscribes to `ride:breakdown` / `ride:fixed` and holds
its trains at their block stop lines while the ride is down. It belongs with the fleet because
holding a train is `advance()`'s business and this round was not allowed to touch it.

## 10. `pnpm test:game` and `pnpm game:day-budget` do not see any of this

**Owner:** `package.json` (integrator).

```jsonc
"game:ride-boarding": "node --experimental-strip-types --import ./scripts/register-path-alias.mjs scripts/game-ride-boarding.mjs",
```

`scripts/game-ride-boarding.mjs` is the before/after rig for §5 and takes `--flat-only`,
`--hours`, `--speed`, `--seed`, `--json`. `scripts/game-shot-coaster-queue.mjs` is the frame: it
dispatches both entities into a running `/game`, steps twenty thousand ticks and photographs the
station. Both are runnable as they are; neither is wired to a script name. Once §5 lands, the
first can be deleted and `pnpm game:day-budget` answers the question on its own.

## 11. The park panel lists four rides and counts six

**Owner:** `ui` · **Value:** the HUD stops contradicting itself the moment a park has a coaster.

`ui/telemetry.ts` builds its ride list from the `ride:roster` event, and that event is — and has to
stay — **the flat rides only**: `rides.motion` and `rides.state` are indexed by roster position and
`rides/main.ts` builds one rig per entry, so a coaster in the roster would shift every index after
it and hand the renderer a machine with no rig. `totals.rides`, `ridesOpen`, `ridesDown`, `queued`
and `riding` are all computed from that list.

`ridersToday` and `throughputHour` are not: they come from `num('rides.ridersToday')` and
`num('rides.throughputHour')`, i.e. the frame stats, which are the whole park. Measured on a demo
park with one coaster added, at 16:33 on day 1:

```
RIDES   RUNNING 3 / 4        ← the four flat rides
In a queue        0
On a ride        13
Rides taken today 1,842      ← includes the coaster's share
Riders per hour     608      ← includes the coaster's share
Out of action         1
```

Two ways out and the second is better. Either read `num('rides.count')` / `num('rides.open')` /
`num('rides.queued')` / `num('rides.riding')` unconditionally — the frame already carries all four
for every machine with a line, and the `rides.length ? … :` fallbacks exist only so the number and
the list agree — or list the docked machines too. The second needs a name to put in the row, which
the roster event does not carry (`profile ? localized(profile.name) : entry.id` would print
`demo-coaster`); `rides` can add `name` to the roster payload the moment `ui` wants to read it.

Related: a coaster's own row would be the natural place for `trains.status(id)` —
`trains × seats`, `cycleSeconds`, `dispatches` and the `riders` the queue last put on board — none
of which the park panel shows today beyond `Trains and cars 2 · 10`.
