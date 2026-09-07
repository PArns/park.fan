# scenery — critic, round 2

Module: `lib/game/scenery/` · showcase `/game?showcase=scenery` · also every tree, bench, lamp,
hedge, planter, bin and blade of grass in the demo park · commit `b6ef2bb`.

Round 1 (`scenery-round1.md`) graded **7.10** against 8.5, all hard gates passing, and it is still
the most useful critique on this branch: it corrected an earlier critic's diagnosis, and it found a
triangle allocation that two previous rounds had walked past.

Round 2 shipped three fixes — a profile for the far imposter, coarser LODs for hedges and flower
beds, and a catalogue that rebuilds when a pack arrives after boot.

**Weighted total: 7.86. FAIL** (pass is 8.5), no hard gate failed. Every one of the three fixes
verifies, two of them by a large margin, and what is left is the fidelity of a handful of objects.

Who graded this: the integrator, for the reason in `terrain-round2.md`.

## 1. Scores

| #   | Axis                  | Weight | R1  | R2      | One sentence                                                                                                                                                       |
| --- | --------------------- | -----: | --: | ------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The frame             |   30 % | 6.8 | **7.7** | At 4× magnification the far trees now read as **spires and crowns** rather than as palms; the smallest ones are still a stick with a dot on it.                    |
| 2   | Fidelity              |   20 % | 6.5 | **6.9** | The spruce imposter is no longer a rectangle. The clipped hedge is still a row of topiary balls, the fountain is still dry, and the LOD-2 hedge got **coarser**.   |
| 3   | Extensibility         |   20 % | 7.0 | **8.0** | A pack registered after boot now reaches the module: catalogue **26 → 27** and `probe-late:probe-tree` resolves, measured live. `themes` and `materials` are still read by nothing. |
| 4   | Budget and behaviour  |   15 % | 7.2 | **8.0** | The upside-down allocation is largely righted: at `overview` `hedge-box` went **29,184 → 3,360 triangles, −88.5 %**, and ground cover at `ground` fell from 62 % of the module to 49.5 %. |
| 5   | Determinism and state |   10 % | 9.5 | **9.5** | Unchanged.                                                                                                                                                          |
| 6   | Honesty of the report |    5 % | 6.5 | **8.4** | Round 2 **costs the alternative before choosing it** (263,000 triangles for real trees against 18,648 for a profile), corrects another critic with numbers, and says plainly that neither earlier critic saw the allocation problem. |

**7.7 × 0.30 + 6.9 × 0.20 + 8.0 × 0.20 + 8.0 × 0.15 + 9.5 × 0.10 + 8.4 × 0.05 = 7.86.**

## 2. Hard gates

| Gate                                | Command                                                              | Result                                                        |
| ----------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| Console errors / hydration warnings | harness runs + `.game-render/_probe/scenery-r2.mjs`, `scenery-ext.mjs` | **PASS** — `errors []` in both probes and every report          |
| Extensibility ≥ 5                   | §4.2                                                                   | **PASS — 8.0**                                                  |
| `pnpm test:game` / `tsc` / `eslint` | as written                                                             | **PASS** — exit 0                                               |

## 3. The frames I looked at

Judging a 14-triangle imposter at 340 m needs magnification, so both crops below are 4× nearest
neighbour out of a frame the harness took, written by `.game-render/_probe/crop.mjs`.

| File                                          | What is actually in it                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_probe/crop-trees-overview.png` (4×)         | The demo park's mid-ground at `overview`. Conifers are **narrow tapering spires**, broadleaves are **rounded crowns on short trunks**, and the two are distinguishable at a glance. Round 1's "reads as a palm" is gone. The smallest instances are still a bare stick with a dot of green on top. |
| `_probe/crop-trees-mid.png` (4×)              | Near-field foliage over the plaza: layered needle and leaf cards with real depth. The module's near form was never the problem and still is not.                                                                              |
| `critic-paths-r2/2200-ground.png`             | Night: the bench, hedge and planter under the lamp pools are the objects carrying that frame, and they hold up at reading distance.                                                                                           |

## 4. Findings

### 4.1 The budget was upside down and is now roughly the right way up

Per-mesh census in the running demo park (`.game-render/_probe/scenery-r2.mjs`), noon, boot:

| at `overview`             | round 1 | round 2 |
| ------------------------- | ------: | ------: |
| `hedge-box` LOD 2         |  29,184 |**3,360**|
| module total              |  79,490 |  73,550 |
| module share of the frame |  ~27 %  |  25.2 % |

At `overview` the largest scenery item is now `oak` LOD 2 at 18,624 — trees, which is what a park
seen from the air is made of — with the Victorian lamp second at 14,000 and the hedge seventh. Round
1's complaint was that seventy-six one-metre hedges cost more than every tree in the frame. They now
cost less than a fifth of the oaks.

At `ground`: module total 387,082, of which ground cover (`meadow-flowers` LOD 1+2 111,648,
`meadow-grass` 30,240, `undergrowth` 12,672, `hedge-box` LOD 0 37,240) is **191,800, i.e. 49.5 %**,
against round 1's 62 %. Better, and `meadow-flowers` is still the single largest item in the module
at 23 % — a flower bed costs more than every tree in the same frame.

And the tree profiles were bought, not printed: round 2 measured the alternative (pushing the LOD
break out far enough to draw real trees adds 263,000 triangles and doubles the frame) before
spending 18,648 on a strip. That is the right way to make this decision and it is the first time
anybody on this branch did it in writing.

### 4.2 A late pack reaches the module now, and two categories still reach nothing

Round 1's test, repeated: register a pack **after** boot and ask the module's own catalogue.

    before: catalog 26, probe-late:probe-tree → null
    after:  catalog 27, probe-late:probe-tree → resolves

In round 1 the catalogue stayed at 26 and every new key resolved to `null` while
`registry.items('foliage')` grew — the module built its catalogue once and nothing subscribed to
`onPack`. That is the path `loadPackFromUrl` exists for, and it was invisible to the one module
whose job is drawing content.

Still true from round 1: `grep` across the module's files finds **no read of a pack's `themes` or
`materials`** — every `materials` reference is the module's own internal `MaterialLibrary`. A pack
can add a species or a prop; it cannot say what anything is made of or which theme it belongs to.
That is what keeps this axis at 8.0 rather than higher.

### 4.3 What is left is fidelity, and it is a short list

The clipped box hedge is still a row of topiary balls rather than a clipped block, and round 2 made
its far form **coarser** on purpose — a defensible trade for 25,824 triangles, but it does mean the
hedge is now the module's least convincing object at both ends of the distance range. The fountain
is still dry in every frame. The smallest tree instances are a stick with a dot.

None of that is expensive to fix and all of it is 20 % of the grade.

## 5. What round 3 should do, in order

1. **The clipped hedge**, near form: a block with a clipped top and a visible cut face, not a row of
   spheres. It is in the near field of every path frame in the park.
2. **Water in the fountain**, which is the one object in the module that is currently a lie.
3. **A floor under the imposter size**, so a 3 m tree at 340 m is a smudge of canopy rather than a
   stick with a dot.
4. **Read `themes` and `materials` from packs**, which is the rest of the extensibility axis.
