# guests — module report

Needs, thoughts, wallets, wayfinding, groups, money — and the crowd on screen.
Folder: `lib/game/guests/` (13 files, ~5,000 lines).

> **Who wrote this.** The builder agent was killed by the account session limit with the sim and
> the crowd renderer written and nothing wired: no `main.ts`, a scaffold `index.ts`, and a module
> that had **never been run**. The integrator finished it — `main.ts`, the module registration,
> four bugs, the harness change that made the crowd photographable, and this report. That is said
> here because a report that hides its author is the failure mode the honesty axis exists for, and
> because the four bugs below are what "never been run" looks like.
>
> **Round 2** added the shops bridge, and that section is marked as such. Everything above it is the
> first round's text with its numbers left where they were.

## What exists

| File                                             | What it owns                                                                                                               |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `sim.ts`                                         | The park's day: arrivals against an attendance curve, needs, decisions, groups, walking, queueing, money, leaving. Pure.   |
| `store.ts`                                       | A struct-of-arrays store with stable slots and a min-heap of free ones, so slot `i` is the same person between two frames. |
| `manifest.ts`                                    | Archetypes, parties and thoughts as pack content, with `attachGuestContent`.                                               |
| `needs.ts`                                       | The need columns, read from the registry in `needOrder()` and re-indexed.                                                  |
| `decide.ts` / `thoughts.ts`                      | What a guest wants next; what it is thinking and why.                                                                      |
| `geometry.ts` / `appearance.ts` / `materials.ts` | The body parts, the 16-bit appearance word both sides decode, three shared PBR materials.                                  |
| `crowd.ts`                                       | Three LOD levels of thin instances, camera-driven, with a near band for shadows.                                           |
| `main.ts`                                        | The wiring.                                                                                                                |

## Numbers, measured

At 12:44 on day 1 of the demo park, 900 stepped ticks, `close` camera:

|                                    |                 |
| ---------------------------------- | --------------: |
| Guests in the park                 |         **713** |
| Drawn / culled                     |         713 / 0 |
| LOD 0 / 1 / 2                      |  15 / 163 / 535 |
| **Draw calls, the whole crowd**    |          **14** |
| Triangles, the whole crowd         |         154,018 |
| Triangles per guest, LOD 0 / 1 / 2 | 676 / 386 / 148 |
| Mesh build                         |          8.8 ms |
| Textures                           |         28.8 ms |

Fourteen draw calls is **1.2 % of the game's 1,200 budget** for the thing the game is about, and it
does not grow with the crowd — it is fourteen meshes with a thin-instance buffer each. Two thousand
guests all at LOD 2 would be 296,000 triangles behind the same fourteen calls. The scene around
them is what costs: 261 calls and 1.13 M triangles in that frame, of which the crowd is 5 %.

Sim cost, from `pnpm game:soak` over 48 park-hours at 100×: **mean 0.80 ms/tick** against the 6 ms
whole-sim budget, max 28.7 ms on the tick that rebuilds the venue index.

And two assertions that used to print `not measured: stuckGuests / guests — no guests module api
yet` now run for real and pass: **no stuck guests, no unreachable queues.** `notMeasured` is `[]`.

## Four bugs, and what each one was

**`destKind` was declared and never allocated.** `allocate` builds the store with
`as unknown as GuestStore`, so the compiler was told the column existed and never checked; `grow`,
`zero`, `serialize` and `load` each listed their byte columns by hand and each missed the same one.
Every tick threw `Cannot read properties of undefined (reading '0')`. A cast that lies is the bug,
so the fix is a `BYTE_FIELDS` list the five sites share, a `GuestColumn` union the type is checked
against, and a runtime guard in `allocate` that names an unallocated column.

**Three unsaved accumulators broke save → resume**, and finding them took a field-by-field diff of
two serialisations rather than a guess. The four xoshiro streams were the obvious one. The other
two were not: the gate's **fractional party debt**, which made the first guest to arrive after a
save come in at park minute 2006 in the uninterrupted run and 2006.25 in the resumed one — one
tick, with the people, their ids and their slots identical — and the thought scanner's **cursor and
budget**, which made a resumed run visit different people in a different order and show up as
exactly three differing columns (`thought`, `thoughtAt`, and the `happiness` a thought nudges).
`test-game-save-roundtrip` is green and the diff is now zero fields.

**A step control that does nothing while paused.** The screenshot harness runs at `speed=0` so a
frame is repeatable, and `SimRuntime.tick()` computes `dt` from `clock.speed` and skips its whole
body at `dt <= 0` — so the worker's `step` message ran the scheduler over a world that stood still.
Every frame of this module photographed an empty avenue with "Guests 0" in the HUD. `runtime.step()`
now forces one tick at speed 1, which is the only reading of "one tick" that does not depend on a
speed the caller deliberately set to zero, and `game-shot.mjs` takes `--step=N`.

## Round 2 — buying goes through the `shops` module

### What changed

This module ran its own model of a shop: an entity from `ctx.world.entities`, a definition from the
registry, a price and a `throughput` in `rebuildVenues`, one park minute of `BUYING` on arrival, the
manifest's relief taken, `world.finance.cash` credited here and a `shop:sale` emitted. The `shops`
module meanwhile simulated a queue per shop, a till per counter, stock, deliveries, refusals and a
staffing demand, and had **no caller at all** — its own report: _"No frame shows a queue at a
counter, because nothing queues."_

A shop is now asked rather than modelled, at exactly the two places
`docs/game/requests/shops.md` §3 named:

| where                | call                                         | what it replaced                                          |
| -------------------- | -------------------------------------------- | --------------------------------------------------------- |
| `chooseDestination`  | `shops.find(need, x, z, cash, 3)`            | shop venues built from the entity list in `rebuildVenues` |
| — walk to            | `offer.frontage`                             | `entity.position`                                         |
| `arriveAt`, kind 2   | `shops.join(id, guest, cash)`                | `state = BUYING; busyUntil = now + 0.6…2.2`               |
| every tick, queueing | `place` → stand · `collect` → sale · `leave` | nothing — there was no queue behaviour at a shop          |
| refused              | `shops.lastRefusal(id)`                      | nothing; the guest wandered off without a word            |

`serve()` — the function that moves the money **and** takes the relief — is now unreachable whenever
a counter answered, which is the "`shops` banks the sale, `guests` debits the wallet" half of the
contract. The proof is arithmetic rather than reading: over one demo-park day
`world.finance.cash` moved by **273,550 cents**, `guests.stats().spentToday` was **273,550** and
`shops.stats().takingsToday` was **273,550**. One sale, one credit.

Rides keep the old venue model, deliberately: that module does not exist yet and nothing else can
answer for them.

### The queue is a place

`place(id, ticket)` says where the holder should be standing **this tick**, and it moves every time
the line advances. A guest walks to it off the path graph — a queue slot is on the shop's own apron
and `paths.next()` answers `null` for it, which this module reads as "lost" — through a dedicated
`KIND_QUEUE` branch that never touches `stuckFor` and never asks the router.

| measured over 90 park minutes from 15:00, 960 guests |                                          |
| ---------------------------------------------------- | ---------------------------------------- |
| Standing ticket-holders sampled                      | 976                                      |
| …further from the spot `place()` named than 0.55 m   | **0** (worst 0.549 m)                    |
| Largest single-tick move by a ticket holder          | **0.1229 m**                             |
| …against the walk budget of the fastest archetype    | 2.3 × 1.07 × 0.05 = **0.1229 m**         |
| Longest unbroken stand on one spot                   | 100 ticks = **5.00 park minutes**        |
| Longest line at one shop                             | **5** (lemonade, souvenirs); 4 (toilets) |

So nobody teleports: the largest step any queueing guest takes in a tick is exactly the distance
they could have walked. The first version of this got the pace wrong in the other direction — the
whole approach ran at `SHUFFLE_PACE`, so a guest took six park minutes to reach the front of an
**empty** queue, longer than the counter took to serve them, and the line read as a trickle of people
walking past a shop. Full pace past `SHUFFLE_STEP` (1.2 m), a shuffle inside it.

### A/B against the same day

Same seed, same demo park, 09:00 → 22:00 at speed 5, `scripts/` untouched on both sides:

|                                  | before (old venue model) | after (shops API) |
| -------------------------------- | -----------------------: | ----------------: |
| Counters served                  |                      292 |           **534** |
| Takings                          |                €2,165.50 |     **€2,735.50** |
| Longest line at any instant      |                    **0** |             **9** |
| Guests holding a ticket, peak    |                        0 |                11 |
| Refusals recorded, guest side    |                        0 | 415 price, 2 balk |
| Stock enforced at the counter    |                       no |               yes |
| A `price: 0` shop can be visited |                       no |               yes |

The 415 price refusals are not noise and not a bug: `find()` filters on the wallet, then the guest
walks for several park minutes, and a **group follower copies the leader's shop** — a child with
€3 in its pocket arriving at a €15 souvenir shop is refused at the counter, counted, and re-plans.
That number is 0 in the old model because nothing could refuse anybody.

### The fourth unsaved accumulator: `incoming`

`Venue.incoming` is the soft reservation — how many people said they were on their way — and
`scoreVenue` divides a candidate's worth by the wait it implies. It was rebuilt from the entity list
on every load, i.e. **the first plan made after a resume was scored against an empty park**. Same
class as `partyDebt` and the thought cursor, found the same way: a field-by-field diff of two
serialisations, not by reading.

Measured on the demo park, save at tick 1200, **one** tick on both sides:

| after 1 tick                                                                               | before     | after         |
| ------------------------------------------------------------------------------------------ | ---------- | ------------- |
| `rng.choice` (4 words)                                                                     | all differ | **identical** |
| `decideIn`, `destX`, `destZ`, `busyUntil`, `lostFor`                                       | differ     | **identical** |
| positions (`x`, `z`, `wpX`, `wpZ`, `node`, `wpNode`, `heading`, `phase`, `lastX`, `lastZ`) | differ     | still differ  |
| save → load → save with 0 ticks                                                            | identical  | identical     |

Everything that is a _decision_ now survives a save. What is left is ten position columns, and the
cause is not in this module: `paths`' router builds at most `TREES_PER_TICK = 2` route trees a tick
and keeps a warm LRU of 64, so a resumed park has a cold cache and `next()` falls through to its
greedy neighbour step for a tick or two. `docs/game/requests/guests.md` §1 has the numbers and three
ways out. **This is pre-existing** — the same probe on the tree before this round diverged at the
same tick and in more columns, including the four `rng.choice` words.

`pnpm test:game-save-roundtrip`'s fourth case stays at **zero** differing fields; its world has no
shop entities, so it never sees any of the above, which is why the probe exists.

### `shops` may be absent

`ctx.module<ShopsSimApi>('shops')` is resolved lazily and re-asked for until it answers, and every
call site has a branch for `undefined` that is the old venue model, entity list and all. Run as a
48-park-hour soak at 100× with `shops` dropped from the module list:

```
shops handle present: false     guests 24   stuck 0   errors 0   failed modules []
cash delta 32650                 reload byte-identical: true
```

The legacy path still trades (€326.50), nobody is stuck, nothing throws. With `shops` present the
same run banks €870.50.

### Frames

`node scripts/game-shot.mjs --out=.game-render/g2 --tod=12:00 --cam=ground,close --step=900
--wait=7000 --timeout=280000` — 0 console errors, 0 warnings, run twice with identical pixels and
identical HUD.

- **`1200-ground.png`** (332 draw calls, 1.33 M triangles, 887 guests, HUD "12:44 · €2,500,027").
  The main street looking north from z = 120. The burger kiosk's dark-green cone at mid-left, the
  toilet block's brick gable at the right margin, both of them 15–20 m off and half behind the lime
  avenue. A crowd of ~120 on the promenade at the far end. **No line at either counter**, and the
  HUD says why: €27 of sales in 45 park minutes.
- **`1200-close.png`** (316 calls, 1.23 M tris, 888 guests). The fountain square, two dense knots of
  guests at the left and right margins, benches, planters. **No shop is in this frame at all** — the
  `close` preset targets the origin at radius 40 and the nearest shop is at (11, 36).

So the prescribed frame does **not** show the thing this round was for, and the reason is the demand
curve rather than the bridge: at 12:00 the park has just been re-seeded, needs are aged to at most
~120 of an `urgentAt` of 170, and 45 park minutes buys five sales across seven shops. A camera
pointed at a counter, at an hour when people are hungry, does show it. Pointing one is legitimate —
`__parkfan_game.scene()` is handed out for exactly this (`host.ts`) — so, at 15:00 + 1800 steps
(16:29, 960 guests, €782 taken):

- **`g2-counters/smoothie.png`** — five guests on the kiosk's apron: three abreast at the serving
  window and two a step behind, which is `standAt`'s switchback with `perRow = 5` doing exactly what
  it says. A sixth is sitting on the bench beside it.
- **`g2-counters/lemonade.png`** — four in a row across the counter under the conical roof, two more
  behind them on the apron, and the promenade crowd walking past at the right, clearly not part of
  it.
- **`g2-counters/souvenirs.png`** — three at the glazed shopfront: two at the glass, one a pace
  back.
- **`g2-counters/toilets.png`** — one guest at the left-hand door of the block, nobody behind. Its
  utilisation was 0.48; a one-counter shop at half load is one person at the door.
- **`g2-counters/burger.png`** — two on the apron under the striped awning, beside the queue rail.
- **`g2-counters/ice-cream.png`** — **empty**, one guest walking past on the grass. It sold 28 all
  day against lemonade's 170; an empty kiosk is the honest picture of that.
- **`g2-counters/info.png`** — empty, rails up, nobody. It declares `need: 'none'` and `find(need)`
  can never match `'none'`, so nothing will ever queue there.
- **`g2-1830/1830-ground.png`** (139 calls, 697 K tris, 764 guests, 19:14, €250 taken) — the street
  at dusk with the lamps lit, guests walking toward the camera, the two kiosks again too far off to
  read a queue at.

### Cost

`pnpm test:game` green, 16 checks. Soak mean tick over three runs each side: **0.95 / 1.03 /
0.98 ms** against **0.91 / 0.87 / 0.89** before this round — the bridge costs about **0.1 ms** of a
6 ms whole-sim budget. Max tick unchanged at 27–30 ms, which is the venue rebuild and not this.
`find()` is asked once per **pressing** need rather than once per need: the gate is the exact relief
term `scoreVenue` would compute, tested against the same `FLOOR`, and since every later factor is
≤ 1 a need that fails it cannot produce a candidate that clears it — so skipping the query changes
no decision. In the demo park that is one or two calls per plan where the naive version made seven.

## Extensibility

`attachGuestContent` claims `guestArchetypes`, `guestParties` and `guestThoughts`, walks
`registry.packs()` **and** subscribes to `onPack` — both, because `onPack` fires on registration and
the bundled packs are registered before any module is built, which is the trap `scenery`, `paths`
and `terrain` each fell into. Needs are core's own category: `core-classic` declares six,
`neon-lagoon` adds `cooling` with a shop that relieves it, and the sim reads whatever
`registry.needOrder()` gives it — the store re-indexes its columns by id on load, so a save written
before a pack was added still opens.

## What is weak or missing, ranked

1. **A park of 960 people is never busy enough to make a line worth photographing.** 534 sales over
   a thirteen-hour day across seven shops is 6 per shop per hour against a service time of 33 s to
   5 min, so counter utilisation runs 0.03–0.48 and the park-wide instantaneous queue is 0–9. It is
   not a bug in the bridge — the same guests through the same counters is what the numbers say — but
   the cause is worth naming: the **distance term**. `speed` is metres per PARK minute, so a shop
   60 m away is a 43-park-minute walk and `scoreVenue` divides its worth by 5.8. That is the D-006
   time-compression tension `sim.ts` already documents at the top of the file, and it is a decision
   about the compression rather than about shops.
2. **A resumed demo park still walks a different first leg.** Ten position columns, cause identified
   and outside this module (`docs/game/requests/guests.md` §1). It is pre-existing and smaller than
   it was, and it is still a save that does not reproduce its own run.
3. **A guest at the counter and a guest third in line are the same pose.** Both are
   `GuestState.QUEUING`, because `place()` gives a position and not a state. Requested from `shops`
   (§2 there); until it lands the crowd cannot draw somebody being served.
4. **71 % of ticket-holder samples are moving rather than standing.** With lines of one to five, the
   person at the front is usually walking the last metre to a spot that just moved. Correct, and it
   makes the line read looser than a photograph of a real one; it would tighten on its own with the
   demand in (1).
5. **No selftest.** Every number in this report came from a throwaway probe.
   `pnpm test:game-save-roundtrip` cannot see a ticket held across a save (no shop entities in its
   world) and cannot see the shops-absent branch (it always loads every module). Requested as §9.
6. **The crowd bunches into tight knots.** Visible again in `.game-render/g2/1200-close.png`: two
   dense clusters at the margins of the fountain square with open paving between them. Unchanged
   from round 1, and still possibly just the wayfinding funnelling everyone down one lane.
7. **No critic has graded it.** Every number here is self-measured with the same harness the critics
   use. That is not a grade.
8. **The walk cycle is unverified beyond a still**, including the new shuffle: the per-tick step is
   bounded by measurement, but nothing has watched a line advance over time.
