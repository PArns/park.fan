# guests — critic, round 1

Module: `lib/game/guests/` · the crowd in every demo-park frame · commit `0405618`.

**Weighted total: 7.91. FAIL** (pass is 8.5), no hard gate failed.

Graded by the integrator, who also did this module's round-2 rewiring onto the shops API. Not an
independent grade; none exists on this branch. Frames in `.game-render/critic-gs/`, numbers from
`.game-render/_probe/guests-shops.mjs` and `money2.mjs`.

## 1. Scores

| #   | Axis                  | Weight | Score   | One sentence                                                                                                                                     |
| --- | --------------------- | -----: | ------: | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | The frame             |   30 % | **7.2** | A crowd of 850 on a promenade reads genuinely well; the individual does not survive being stood next to.                                        |
| 2   | Fidelity              |   20 % | **6.8** | Archetypes, parties, thoughts, needs, queueing, balking and price refusals are all real — and **the park takes nothing for the first four hours** because every guest arrives with its needs at zero. |
| 3   | Extensibility         |   20 % | **8.8** | Three pack categories claimed, both halves of the `onPack` read, needs appended so a save written before `neon-lagoon` keeps its columns, and no branch on a pack id anywhere. |
| 4   | Budget and behaviour  |   15 % | **9.0** | **850 guests for 14 draw calls and 100,654 triangles**, LOD 11/12/597 at 676/386/148 triangles each, 11 shadow casters. The largest object count in the game costs 1.2 % of the draw budget. |
| 5   | Determinism and state |   10 % | **8.5** | Four unsaved accumulators found by a field-by-field diff of two serialisations and fixed — and ten position columns still diverge after a save.  |
| 6   | Honesty of the report |    5 % | **8.5** | The weaknesses section names the time-compression tension that produces its own thinnest queues, with the arithmetic.                            |

**7.2 × 0.30 + 6.8 × 0.20 + 8.8 × 0.20 + 9.0 × 0.15 + 8.5 × 0.10 + 8.5 × 0.05 = 7.91.**

## 2. Hard gates

Console errors 0 and hydration 0 across every run; extensibility 8.8, well clear of the floor;
`pnpm test:game` green including the 48-hour soak (0 stuck guests, 0 unreachable queues, 0 orphan
entities, mean 1.02 ms/tick); `tsc` and `eslint` clean.

## 3. Findings

### 3.1 The crowd is right and the person is not

`critic-gs/0900-ground.png`, 852 guests at 16:59: people walking in both directions down the
promenade, clothing colours varied enough that the crowd has texture, density falling off with
distance, and the whole thing for **14 draw calls**. It is the single most convincing thing in the
game at a glance.

Then look at the guest in the bottom-left corner, two metres from the lens: a box torso, a slab
head, flat slabs for arms, no hands and no face. LOD 0 is 676 triangles and eleven guests are drawn
at it. The module has budget it is not spending — 850 guests at 676 triangles each would be 574,000,
which is a lot, but the eleven nearest ones could be four times what they are for nothing.

### 3.2 The park takes nothing until the early afternoon

Stepped from the 09:00 boot at speed 1, reading the shops' own till:

| park minute | guests | `takingsToday` |
| ----------: | -----: | -------------: |
|         720 |    620 |          **0** |
|         780 |    833 |          **0** |
|       1,020 |    854 |        171,300 |

Four hours of a fourteen-hour operating day with 620 people in the park and not one sale. This is
not the frozen-needs bug — that is fixed, and the shops bridge pays to the cent once it starts. It
is the **arrival state**: every guest is admitted with its needs at zero, and the hungriest need in
`core-classic` rises 26 points an hour against an `urgentAt` of 165–200. Somebody who walks through
the gate at 15:00 is as fresh as somebody who arrived at opening, which is not how a person works
and costs the park a third of its revenue day.

### 3.3 What the numbers are good at

14 draw calls, 100,654 triangles, LOD split 11 / 12 / 597 with 597 of them at 148 triangles. Build
6.7 ms, textures 33.7 ms. The 48-hour soak at 100× runs 576 ticks in 591 ms with no stuck guest and
no unreachable queue. This is the cheapest thousand-object system in the project by a wide margin.

### 3.4 Determinism: four found, one left

Round 2 found four accumulators that were not serialised — the four RNG streams, the gate's party
debt, the thought cursor and budget, and `Venue.incoming` — every one by diffing two serialisations
field by field rather than by reading. That method is worth copying.

What is left: ten position columns still diverge after a save, attributed to `paths`'
`TREES_PER_TICK = 2` and a warm LRU rather than to this module. It is recorded and it is the reason
this axis is 8.5 rather than 9.5.

## 4. What round 2 should do

1. **Admit guests with a plausible history.** A guest arriving at 15:00 should carry six hours of
   need. It is the single largest behavioural defect in the game and it is a seed, not a system.
2. **Spend the LOD-0 budget.** Eleven guests are drawn at full detail and they are the ones a player
   looks at.
3. **The ten diverging columns**, jointly with `paths`.
