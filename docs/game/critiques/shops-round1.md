# shops — critic, round 1

Module: `lib/game/shops/` (6,170 lines, 13 files) · showcase `/game?showcase=shops` · seven shops in
the demo park · commit `0405618`.

**Weighted total: 8.23. FAIL** (pass is 8.5), no hard gate failed. Graded by the integrator; not an
independent grade.

## 1. Scores

| #   | Axis                  | Weight | Score   | One sentence                                                                                                                             |
| --- | --------------------- | -----: | ------: | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | The frame             |   30 % | **7.4** | Kiosks and shop blocks read as built structures — hipped roofs, striped awnings, signage, their own paving — and they are small, simple and repeat. |
| 2   | Fidelity              |   20 % | **7.6** | A queue, a till per counter, stock, deliveries, upkeep, staffing demand, balking, and refusals separated into stock and price.           |
| 3   | Extensibility         |   20 % | **9.0** | Two categories claimed with both halves of the read, a menu selector that takes `core-classic:burger`, `burger`, `kind:food` or `*`, and generators declared by packs. |
| 4   | Budget and behaviour  |   15 % | **8.8** | **Seven shops = 15 meshes, 10,436 triangles**, batched by type key so a park of eight burger stands costs what one costs. Sim tick 0.0007 ms. |
| 5   | Determinism and state |   10 % | **9.2** | A 51-check selftest that includes save → resume **field by field**, which is how it found a real bug in another module.                  |
| 6   | Honesty of the report |    5 % | **9.0** | Its requests file is the best document on this branch: it diagnosed `guests`' frozen needs with a per-speed table and the measured consequence, for a bug in somebody else's file. |

**7.4 × 0.30 + 7.6 × 0.20 + 9.0 × 0.20 + 8.8 × 0.15 + 9.2 × 0.10 + 9.0 × 0.05 = 8.23.**

## 2. Findings

### 2.1 Role, not id — and it shows in the demo park

`placeDemoShops` picks by **need**, so the park's seven shops came out as
`core-classic:burger`, `souvenirs`, `toilets`, `ice-cream`, `lemonade`, `info` — and
**`neon-lagoon:smoothie`**, a second pack's content standing on the main street because it answers
`thirst` and nothing named it. That is the extensibility rule producing a visible result rather than
a passing test, and it is one of only two places in this game where pack content reaches a frame.

Seven shops, seven batches, one instance each, 1,124–2,112 triangles per type. The claim that draw
calls are per type and not per shop is not provable from this park (every type has one instance);
the showcase is where it was measured.

### 2.2 Seven, not eight

The plan has eight plots. The eighth is an information point (`need: 'none'`) and no bundled pack
ships one, so `placeDemoShops` leaves the plot empty rather than inventing a shop — the right
behaviour, unrecorded in the report.

### 2.3 The till works, and it waits four hours for its first customer

`world.finance.cash` and `stats().sim.takingsToday` agree, and the money arrives exactly when the
guests get hungry: 0 at park minute 780, 171,300 cents by 1,020. The four-hour dead start is
`guests`' arrival state, not this module's — see `guests-round1.md` §3.2 — but it is why every frame
of this park shows shops with no queue at them.

### 2.4 What holds the frame axis at 7.4

The buildings are honest small structures and there are six distinct massings, but the park's seven
shops are five kiosks and two blocks, and at street level they repeat. A shop that a player has
looked at twice should have something the second one does not: a different counter, a menu board
that is legible, a queue rail. The frame gets better the moment a queue actually forms in it.

## 3. What round 2 should do

1. **Make a queue visible.** Once `guests` arrives hungry, the line is the thing that makes a shop
   read as a shop, and `place()` already publishes where each customer stands.
2. **A legible menu board**, which is the cheapest per-shop differentiation available.
3. **An information point in a bundled pack**, so the eighth plot fills.
