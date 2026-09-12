# shops — requests

Things this module needs that live outside `lib/game/shops/`. Each one has a workaround in place, so
nothing here blocks the module; each one costs something that is named.

---

## 1. Wire `lib/game/shops/selftest.mjs` into `pnpm test:game` — integrator, `package.json`

```jsonc
"test:game-shops": "node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/shops/selftest.mjs",
"test:game": "… && pnpm test:game-track && pnpm test:game-paths && pnpm test:game-shops && pnpm test:game-soak",
```

Green at the commit this was written, 51 checks, exit 0. It is the only thing that covers four of
this module's claims — the pack-declared style, the geometry measurements, the per-unit tone spread
and **save → resume field by field**, which found a real byte-stability bug that
`pnpm test:game-save-roundtrip` structurally cannot see: its world has no shop entities in it, so
this module's slot is `undefined` on both sides of its comparison. Same request `scenery` and
`paths` both made; `paths` shipped a selftest that was red at HEAD in four runs of four because
nothing ran it.

---

## 2. Needs do not rise at any speed a player can select — `lib/game/guests/sim.ts:861`

**This one comes first because it is why a park with 922 people in it buys almost nothing, and
because it is one line.** `d.needs` is a `Uint8Array` (0–255) and `stepNeeds` writes back through
`Math.round`:

```ts
const rise = need.decayPerHour * weight * weatherFactor(need, env) * hours; // hours = dt / 60
const level = d.needs[base + c] + rise;
d.needs[base + c] = level > 255 ? 255 : level < 0 ? 0 : Math.round(level); // ← line 861
```

At 20 Hz a tick is `speed / 20` park minutes, so the rise per tick for the hungriest need in
`core-classic` (`decayPerHour: 26`) is:

| speed | min/tick | hunger rise per tick | mean hunger after 300 park minutes |
| ----: | -------: | -------------------: | ---------------------------------: |
|     1 |     0.05 |           **0.0217** |                             **25** |
|     3 |     0.15 |           **0.0650** |                             **24** |
|     5 |     0.25 |           **0.1083** |                             **24** |
|   100 |     5.00 |               2.1667 |                                100 |

Every playable speed writes an increment under 0.5, `Math.round` throws it away, and the level never
moves. Only the soak harness's 100× is above the threshold — which is exactly why every test in the
repo is green: `game-soak.mjs` runs at 100 and `test-game-save-roundtrip` at 5 with no shops in the
world to notice. Measured with `.game-render/_probe/needs.mjs` (left beside the frames), one
`SimRuntime` per speed, same seed, same 300 park minutes.

The consequence in the demo park is total: with needs frozen at ~24 of 255 and `urgentAt` at 165–200,
`decide()` scores every candidate below its own `FLOOR` of 0.05 and returns null, so **934 of 944
guests stand `idle` with `dest: null`** and the eight shops take nothing. The only trade that ever
happens is the burst after a clock jump, because `resettle()` re-seeds needs from the time a guest
has "already spent inside" — which is what the browser frames caught: **€255 through the tills
immediately after the 09:00 → 12:00 jump and not one cent in the next three park hours**
(`.game-render/demo/*/probe.json` and `.game-render/demo-b/*/probe.json`, `takingsToday: 25500` at
both minute 990 and minute 1170).

The fix is to carry the fraction rather than round it away — a `Float32Array` shadow of the
accumulating part, or the same trick this module uses for its own accumulators (keep the fraction in
a saved field and add whole points when it crosses 1). Either way it is `guests`'s file and its save
format, so it is a request and not a patch. There is nothing to work around on this side: this
module's till is exercised end-to-end by `selftest.mjs` through its own API instead
(join → serve → pay → collect, with `world.finance.cash` moving by exactly the price, once).

---

## 3. `guests` should buy through the shops API — `lib/game/guests/sim.ts`

This is the big one, and the module works without it. Today `guests` walks to a shop entity, spends
0.6–2.2 park minutes in `BUYING`, takes the manifest's `needRelief`, credits
`world.finance.cash` itself and emits `shop:sale`. `shops` subscribes to that event and treats it as
a customer already served — stock comes off, takings go up, the till's clock advances — so the
numbers in `stats()` are real demand from real people. What the bridge cannot do:

- **A free shop is invisible.** `guests.serve()` only emits when `venue.price > 0`, so first aid,
  the cash machine and information (`price: 0`) never reach this module. Their counters read as
  idle whatever the demand, and their staffing figure is a floor rather than a measurement.
- **Nobody ever stands in a queue.** `guests` has no queue behaviour at a shop, so `queue`,
  `waitMinutes`, balking and `place()` are exercised only by the selftest. The visible line in the
  frames is guests clustering inside `REACH_RADIUS` of the entity position, not a served line.
- **A stock-out cannot refuse a sale.** `guests` has already taken the relief by the time the event
  arrives, so an empty counter is recorded (`refusedToday.stock`) and not enforced.
- **`refusedToday.price` is always 0.** A guest who reaches the counter too poor to pay is refused
  inside `guests` without a word.

The API is designed to be called from exactly where `chooseDestination` and `arriveAt` already are:

```ts
const shops = ctx.module<ShopsSimApi>('shops');

// in chooseDestination, instead of scoring shop venues off the entity list:
const offers = shops?.find(need.id, d.x[slot], d.z[slot], d.cash[slot], 4) ?? [];
// offer.frontage is where to walk; offer.waitMinutes is the number `decide()` wants for `incoming`

// on arrival:
const join = shops.join(offer.id, d.id[slot], d.cash[slot]);
if (!join) {
  /* refused; shops.lastRefusal(id) says why */
} else {
  setDestination(slot, join.stand[0], join.stand[1], QUEUE);
}

// each tick while queuing:
const stand = shops.place(offer.id, ticket); // shuffle forward
const sale = shops.collect(offer.id, ticket); // null until served
if (sale) {
  d.cash[slot] -= sale.cents;
  applyRelief(slot, sale.need, sale.relief);
}
```

Two contracts to keep straight when this lands:

- **`shops` banks the sale, `guests` debits the wallet.** `completeSale` already does
  `world.finance.cash += price` and emits `shop:sale` with `source: 'shops'`; the bridge ignores its
  own event. `guests.serve()` must stop crediting `finance.cash` on the same sale or the park is
  paid twice. Two writers of one number is what the determinism axis fails a module for.
- **Walk to `offer.frontage`, not to `entity.position`** — they are the same point today (see §3 and `frontSetback`),
  and they will stop being the same the moment a build tool lets a player rotate a shop into a
  corner.

`shops` is created before `guests` in `lib/game/modules.ts`, so `ctx.module('shops')` resolves at
`createGuestsSim` time; no ordering change is needed.

---

## 4. `demo-park` should place shops on its four reserved plots — `lib/game/demo-park/plan.ts` / `props.ts`

`PADS` reserves `shops-west` (−19, 120), `shops-east` (19, 120), `shops-market` (19, 44) and
`entrance-retail` (33, 178) for this module, and nothing places anything on them: the demo park has
**zero `shop` entities**, so the default `/game` frames contain no shops at all and `guests` has
nothing to want. The frames in this module's report that show a crowd were taken by dispatching
entities into the running demo park from a probe, which is not a park anybody else can open.

Eight shops that fit the plots and the camera presets, in the same role-not-id style `props.ts`
already uses (`first((s) => s.kind === 'food')` rather than `core-classic:burger`):

| plot              | x   | z   | yaw    | role                          |
| ----------------- | --- | --- | ------ | ----------------------------- |
| `shops-west`      | −11 | 128 | `π/2`  | food (kiosk)                  |
| `shops-west`      | −11 | 108 | `π/2`  | drink                         |
| `shops-east`      | 11  | 128 | `−π/2` | food (a second, different id) |
| `shops-east`      | 11  | 108 | `−π/2` | toilet                        |
| `shops-market`    | 11  | 52  | `−π/2` | drink                         |
| `shops-market`    | 11  | 36  | `−π/2` | souvenir                      |
| `entrance-retail` | 26  | 186 | `−π/2` | souvenir                      |
| `entrance-retail` | 26  | 170 | `−π/2` | info                          |

The x of ±11 is not arbitrary: the main street's lamp avenue is at ±6.2 and its lime avenue at ±8
(`props.ts:312`, `plan.ts` street hierarchy), and `SERVICE_RADIUS` in the path graph is 14 m, so ±11
is the only band that is clear of both rows of trees and still served by the street's nodes. The
whole `STREET_HALF_WIDTH = 26` corridor is already flat, so no landform change is needed.

One thing the frames showed that the arithmetic did not: at ±11 a shop stands **behind** the lime
avenue, and from the `ground` camera the canopies cut across its roof (`.game-render/demo/ground/`).
That reads well — a kiosk under the trees is what a park looks like — but if a plot is meant to be a
shopfront rather than a pavilion, the trees on that stretch have to move rather than the shop, since
±13 is already at the edge of the graph's service radius.

Also worth knowing before placing them: a shop lays its own paving forward of `entity.position` by
`style.apron` (1.8–4.5 m), so at ±11 the hard standing stops about two metres short of the
promenade's kerb and reads as an island. The showcase settled on **7.4 m** from an 8 m walk for
exactly that reason; on the demo park's plots the equivalent is either a shorter offset or a strip
of the park's own paving between the two.

`entity.position` is the point a **guest stands**, not the centre of the building — see §3 and
`frontSetback` in `lib/game/shops/sim.ts`. The building is laid out backwards from it, so a shop at
(−11, 128) with `yaw = π/2` puts its counter facing the street and its back to the plot.

---

## 5. Core should own the park's opening hours — `lib/game/core/`

`PARK_OPEN`/`PARK_CLOSE` are exported from `lib/game/guests/index.ts` (09:00–23:00) and this module
cannot import them: `guests/index.ts` pulls `createGuestsSim`, which would drag the whole guest
simulation into the worker bundle of a showcase that has no guests in it. So the shop hours here are
a per-menu `hours` field with defaults chosen to sit inside that window, and the duplication is a
constant nobody is comparing. `world.meta` or a `world.park` slot would be the right home; two
numbers, read by three modules.

Same shape as the `WALK_PACE = 1.25` constant in `shops/sim.ts`, which exists because the guest
archetypes' speeds are also on the wrong side of that import — that one is used for ranking only, so
being 20 % out reorders two shops that were nearly equal and does nothing else.

---

## 6. `management` should book the cost of goods and the upkeep — `lib/game/management/`

This module reports `cogsToday` and `upkeepPerHour` in `stats()` and emits `shop:restock` with a
`cost`, and it deliberately writes **neither** to `world.finance`. It banks sales (it is the seller)
and books no expenses (it is not the accountant), because `finance.cash` written from two modules is
the failure the determinism axis names. When `management` lands, the ledger it wants is:

- `shop:restock { shop, units, cost }` — cost of goods, at delivery
- `shops.stats().upkeepPerHour` — the sum of every shop's manifest `upkeep`, per open hour
- `shops.list()[].staffWanted` — wages, once `staff` can hire against it

---

## 7. `staff` should read `staffWanted` — `lib/game/staff/`

`ShopView.staffWanted` is one per busy till plus one when the line is longer than the counters can
clear in a round, and zero when the shop is shut. It is a demand figure, not an assignment: nothing
here knows whether anybody turned up, and a shop with no staff currently serves anyway. When `staff`
exists, the honest coupling is a `staffed(id): number` that this module multiplies its counter count
by — one line in `tickShop`, and the request is recorded here so it is not invented twice.

---

## 8. `pathStyles` for a shop forecourt — `lib/game/paths/`, optional

Each shop lays its own paving (`apron` in `build.ts`), because without it the queue stands on grass
— which is what the first render of this module actually showed. It is a small concrete unit paver,
deliberately a different module from the paths module's slabs, so the change of surface at the kerb
says the ground under the awning belongs to the shop. If `paths` would rather own that surface, the
seam is `apron()` and the shape is a plaza polygon per shop; this module would rather not compete
with it and is happy to drop its own.
