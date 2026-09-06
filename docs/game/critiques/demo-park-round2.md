# demo-park — critic, round 2

Module: `lib/game/demo-park/` · the world behind `/game` and behind `?park=demo`, which is the
default · commit `7dffc29`.

Round 1 (`demo-park-round1.md`) graded **7.20** against 8.5 and put the fault in the right place:
the circulation was researched and correct, the **planting was upside down**, and the widest camera
of the default scene read as scrubland at every hour.

Round 2 planted along the circulation, put shops on the plots it had reserved, reserved two more on
the forecourt, and fixed a deep import the report had claimed did not exist.

**Weighted total: 7.99. FAIL** (pass is 8.5), no hard gate failed. Both round-1 headline numbers
reproduce, and one of them needed the `scenery` module's round 2 as well as this one.

Who graded this: the integrator, for the reason in `terrain-round2.md`.

## 1. Scores

| #   | Axis                       | Weight | R1  | R2      | One sentence                                                                                                                                          |
| --- | -------------------------- | -----: | --: | ------: | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The frame                  |   30 % | 6.6 | **7.8** | `overview` reads as parkland now — a planted mid-ground and a woodland belt — and it took **two** modules: this one's trees and `scenery`'s imposter profile. |
| 2   | Fidelity to the real thing |   20 % | 6.4 | **7.5** | Planting follows the walks with a real hierarchy (11 m formal avenue on the spine, 14 m mixed on the walks, groves at 13–19 m), and 6 of the 10 reserved plots are still bare ground because their modules do not exist. |
| 3   | Extensibility              |   20 % | 7.6 | **8.3** | Roles resolve against the registry with no content id anywhere, `missingRoles` is `[]` live, shops are chosen by **need**, and the one deep import past a sibling's public API is gone. |
| 4   | Budget and behaviour       |   15 % | 7.0 | **7.2** | 34 % more trees for **0 extra draw calls**, which is the objection to planting the mid-ground turning out not to exist — and boot is still over the 8 s budget in 7 of 7 runs. |
| 5   | Determinism and state      |   10 % | 9.5 | **9.5** | Unchanged; the regression test for the core id-counter bug this module found is still green.                                                          |
| 6   | Honesty of the report      |    5 % | 8.4 | **9.2** | It states the limits of its own proxy metric, names who wrote it, and **retracts a claim from its own earlier version** rather than quietly fixing it. |

**7.8 × 0.30 + 7.5 × 0.20 + 8.3 × 0.20 + 7.2 × 0.15 + 9.5 × 0.10 + 9.2 × 0.05 = 7.99.**

## 2. Hard gates

| Gate                                | Command                                        | Result                                                     |
| ----------------------------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| Console errors / hydration warnings | `.game-render/_probe/demopark-r2.mjs` + harness | **PASS** — `errors: []`, `failedModules: []`                |
| Extensibility ≥ 5                   | §4.2                                             | **PASS — 8.3**                                              |
| Coupling                            | `grep -rn "from '\.\./" lib/game/demo-park/*.ts` | **PASS** — every sibling import is that module's index now  |
| `pnpm test:game` / `tsc` / `eslint` | as written                                       | **PASS** — exit 0                                           |

## 3. What I measured, independently

`.game-render/_probe/demopark-r2.mjs` walks the built world, takes every path entity's polyline as
line segments and measures each tree's distance to the nearest one:

| quantity                       | round 1 | round 2 report | **my measurement** |
| ------------------------------ | ------: | -------------: | -----------------: |
| trees                          |     893 |          1,196 |          **1,196** |
| within 10 m of a path          |  6.9 %  |         16.2 % |          **15.9 %** |
| within 20 m of a path          |       — |              — |          **32.8 %** |
| path entities / segments       |      20 |             20 |     **20 / 136**   |
| shops placed                   |       0 |              8 |          **7**     |
| `missingRoles`                 |       — |             [] |          **[]**    |
| draw calls at `overview`       |     145 |            145 |          **207**   |

Two of those need saying out loud.

**The 16.2 % is 15.9 % on my filter** — a four-tree difference out of 1,196, from a different guess
at which catalogue keys are trees. That is agreement, not a discrepancy, and I am recording both
because the metric is a proxy and the next critic should be able to reproduce either.

**Seven shops, not eight.** `placeDemoShops` plans eight and skips a plot whose need no registered
pack answers rather than inventing one, which is the right behaviour; the eighth is the information
point (`need: 'none'`) and no bundled pack ships one. So the `entrance-retail` plot has a souvenir
counter and an empty neighbour. Worth a line in the report it does not have.

**207 draw calls, not 145.** That is not a regression in this module: `shops` and `guests` landed
between the two measurements. It is the number the next builder inherits, and it is 17.3 % of the
1,200 budget with 8 of 24 modules built.

## 4. Findings

### 4.1 The frame is fixed, and one module could not have fixed it

Round 1: "`overview` — the default scene's widest camera — is scrubland at every hour, because
99.9 % of the 1,008 tree instances it draws are LOD 2 imposters." That sentence names two problems
owned by two modules: **how many** trees there are and where (this one), and **what an imposter
looks like** (`scenery`). Both shipped a round 2, and the frame needed both.

At 4× magnification of `.game-render/cam-presets/1200-overview.png` the mid-ground now carries
distinguishable spires and crowns over a planted core with a woodland belt behind it. The 80–120 m
band went from 7.8 trees/ha to 46.6 — the "bathtub" in the density profile is gone, which is the
actual reason the wide frame used to read as scrubland with a park in the middle of it.

### 4.2 Extensibility: the retraction is the interesting part

`landform.ts` used to import `fbm2` from `'../terrain/noise'`, reaching past the public surface
every other terrain import in this module goes through — and the report had claimed there was no
such violation. Round 2 does not quietly fix it: it says the claim was false, records that the
helpers were re-exported from `lib/game/terrain/index.ts`, and states that the claim is true now.
That is what the honesty axis is for, and it is why this module scores 9.2 there.

Verified live: `missingRoles` is `[]`, the ten reserved plots come back with owners, and nothing in
`props.ts` or `build.ts` names a pack id — shops are picked by **need** (`hunger`, `thirst`,
`toilet`, `happiness`), which is why a pack shipping a different burger stand still opens this park.

### 4.3 What round 2 chose not to do, and said so

"16.2 % is not 30 %, and that is deliberate." The ≤10 m proxy can be gamed by pulling every setback
under ten metres, which would close the canopy over the four-metre loops and turn three of them into
corridors. The groves sit at 13–19 m, score nothing on the proxy, and are the reason the 80–120 m
band moved by a factor of six. A report that optimises the park and then explains why it did not
optimise the number is doing the job.

### 4.4 Boot is still over budget, and I cannot cleanly measure it

Round 1: boot over the 8 s budget in 16 of 16 runs. Mine: **7 of 7 demo-park boots between 9,936
and 14,950 ms**, against showcases at 4,470–6,919 ms.

The caveat matters more than the number: the dev server was being recompiled throughout by the
`tools` builder working in the same tree, so these figures carry Turbopack rebuild time that a
player would not pay. What survives the caveat is the shape — the demo park boots roughly twice as
slowly as a showcase — and round 1's finding that it once tripped the sim watchdog in front of the
player. **This needs re-measuring against `pnpm build && pnpm start` before anybody tunes it.**

## 5. What round 3 should do, in order

1. **Measure boot properly**, against a production build with nothing else touching the tree, and
   then attack whatever it actually is. It is the only budget item this module still owns.
2. **An information point in a bundled pack**, so the eighth plot is not empty for the reason that
   nothing sells nothing.
3. **Fill the plots** — but that is `buildings`, `rides`, `pools` and `flumes`, not this module.
   Six of ten reserved plots are bare ground and the park reads as unfinished because it is.
