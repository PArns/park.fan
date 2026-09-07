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
