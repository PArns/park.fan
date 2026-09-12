# guests — requests

Things this module needs that live outside `lib/game/guests/`. Each one has a workaround in place,
so nothing here blocks the module; each one costs something that is named.

---

## 1. The router's tree budget is unsaved state — `lib/game/paths/graph.ts`

**This is the only reason a resumed demo park is not byte-identical to the run it was saved from**,
and it is not in this module. Measured on the demo park at seed 1, speed 5: save at tick 1200, then
**one** tick on both sides.

| what                                            | before this round                                                                                                   | after                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| save → load → save, 0 ticks                     | identical                                                                                                           | identical                                   |
| fields differing after 1 tick                   | 13+: `rng.choice` ×4, `busyUntil`, `decideIn`, `destX`, `destZ`, `lostFor`, `heading`, `phase`, `x`, `z`, `node`, … | 10, and **every one of them is a position** |
| any decision, count, rng or money field differs | yes                                                                                                                 | **no**                                      |

The decision half was this module's own (`incoming`, §see the report) and is fixed. What is left is
`x`, `z`, `wpX`, `wpZ`, `node`, `wpNode`, `heading`, `phase`, `lastX`, `lastZ` — a guest walking a
slightly different first leg, and `createRouter` says why in its own source:

```ts
const TREES_PER_TICK = 2;                       // graph.ts:64
const trees = new Map<number, TreeEntry>();     // warm LRU, 64 entries
…
    misses++;
    if (budget <= 0) return null;               // → next() falls through to the greedy neighbour step
```

A running park has warm route trees; a resumed one has none, so for the first few ticks after a load
`next()` answers with "whichever neighbour gets closest" instead of the tree's hop, and the guest is
a metre off for the rest of the day. It converges — the trees get built — but the positions never
re-converge, because nothing re-plans on position alone.

Three ways out, cheapest first, all in `paths`:

- **Warm the cache in `rebuild()`**: build the trees for the destinations the guests already hold
  (`d.destX/destZ` are saved). Bounded by the number of distinct destinations, which is what
  `ROUTE_TREE_LIMIT` already caps at 64.
- **Serialize the tree keys** (not the trees — those are `4·nodes` bytes each) and rebuild them on
  load, ignoring the budget for that one pass.
- **Drop the budget on the first tick after a rebuild.** One expensive tick after a load is a load.

This module cannot work around it: it does not own the router, and it must not cache waypoints of
its own — `wpNode` is already saved and is the thing being answered differently.

---

## 2. `shops`: `place()` cannot tell "at the till" from "gone"

`place(id, ticket)` answers `null` for four different endings — served, sold out at the counter,
thrown out at closing, balked by the shop's own patience — and a position for two states that are
not the same thing: standing in the line, and standing AT the counter being served.

Both cost this module a call it should not need.

- **Balking** has to be `leave()` and then `place()` again, because `leave` only reaches the queue
  and a guest already at a till cannot be pulled back; the second call is how the two are told
  apart. It works and it is two calls where one would do.
- **The renderer cannot pose them differently.** A person at a counter and a person third in line
  are both `GuestState.QUEUING`, so the crowd draws them the same. `state(id, ticket)` answering
  `'queued' | 'serving' | 'gone'` would be one call, would make the balk exact, and would let the
  guest at the counter get a `BUYING` pose while the line behind stays `QUEUING`.

## 3. `shops`: `collect()` gives a refusal the same answer as "not yet"

A sold-out counter pushes a receipt with `sale: null`; `collect` consumes it and returns `null`,
which is the same value as "no receipt on this ticket". This module only notices because `place()`
goes `null` in the same tick, so it counts the outcome as `dropped` — one bucket for "sold out at
the counter", "still there at closing" and "the shop's own balk timer". A discriminated answer
(`ShopSale | { refused: ShopRefusal } | null`) would put each under its own name on both sides of
the till, which is the whole reason `ShopRefusal` exists.

## 4. `shops`: `ShopOffer` carries the line but not the counter

`waitMinutes` is how long until somebody is served; `serviceMinutes` is how long they then stand
there. A guest choosing between a two-minute line for a 33-second transaction and a two-minute line
for a five-minute one is choosing between 2.5 and 7 park minutes, and `decide()` cannot see the
difference. One more field on `ShopOffer` (`serviceMinutes`, straight off the menu) and the walk +
wait + serve total becomes the number the decision actually spends.

## 5. `shops`: a balk and a full line are one counter

`leave()` books `refusedToday.full`, which is also what `join()` books when the line was at capacity
on arrival. "Twelve people gave up" and "twelve people were turned away at the back of the line" are
different facts about a shop, and `tickShop` already keeps that distinction for its own two cases.
This module counts its side separately (`balk` vs `full` in `GuestStats.refusedToday`), so the two
reports disagree by construction until this lands.

## 6. `shops`: receipts vanish across a save, and the safety of that is an ordering rule nobody wrote down

`applyState` deliberately drops `receipts` — right, because a ticket handle means nothing to a caller
that no longer exists. It is safe today only because `shops` ticks **before** `guests` inside one
scheduler step, so a receipt pushed by `completeSale` is always collected in the same step and never
survives a save boundary. That is a dependency on the order in `lib/game/modules.ts`, it is load-
bearing for money (a dropped receipt is a sale the guest paid nothing for and got no relief from),
and neither module states it. Either `deps: ['shops']` on the guests module or a line in both
docblocks.

---

## 7. Core should own the park's opening hours — `lib/game/core/`

`PARK_OPEN` / `PARK_CLOSE` (09:00–23:00) are exported from this module because nothing in the world
model carries them, and `shops` cannot import them without dragging the whole guest simulation into
the worker bundle of a showcase that has no guests in it — so it duplicates the window as a per-menu
`hours` default instead. Two numbers, read by at least three modules, compared by nobody.
`world.meta` or a `world.park` slot. Same request `shops` §5 makes from the other side.

## 8. `demo-park` places six of the seven needs — `lib/game/demo-park/build.ts`

`shops.stats().unanswered` on the demo park reads `['cash', 'cooling', 'energy']` all day: no ATM,
no first-aid post, no misting station. The consequence is visible in `guests.stats().unmet` —
47 guests past `urgentAt` on `cooling` at 18:00 with nothing in the park that answers it — and it is
a fair state for a park to be in, so this is a note rather than a complaint. Worth knowing when
reading either module's numbers.

One placement is inert rather than unanswered: the info kiosk at (26, 170) declares `need: 'none'`,
and `find(need)` can never match `'none'`, so nothing will ever queue at it. Its close-up
(`.game-render/g2-counters/info.png`) is an empty counter with the queue rails up, which is correct
and is also the only shop in the park that cannot be otherwise.

## 9. A selftest for this module wired into `pnpm test:game`

Every claim in the report below was measured with a throwaway probe. `shops` and `paths` both ship a
`selftest.mjs`; this module has none, and the two things it most needs covered are exactly the two
`pnpm test:game-save-roundtrip` structurally cannot see: a **ticket held across a save** (its world
has no shop entities, so both sides of its comparison are empty) and the **shops-absent** branch
(its module list is always the whole list). Same request `shops` §1 and `paths` both made.
