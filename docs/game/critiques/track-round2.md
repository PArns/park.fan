# track — critic, round 2

Module: `lib/game/track/` · showcase `/game?showcase=track` (three layouts: two steel, one timber) ·
commit `4c97cb2`.

Round 1 (`track-round1.md`) graded **8.00** against a pass mark of 8.5 — the highest on the branch
and still a fail — with two structural findings: elements-by-manifest did not work although the
report said it did, and the wooden coaster was a row of bare poles defended by a comment that was
factually wrong about how a woodie is braced.

Round 2 fixed both, and the fix for the first one was core's rather than this module's.

**Weighted total: 8.41. FAIL by 0.09** (pass is 8.5), no hard gate failed. This is the closest
anything has come. What costs it the pass is not the engineering: it is one stale sentence in its
own report and one unfixed aliasing defect that is visible in every wide frame.

Who graded this: the integrator, for the reason in `terrain-round2.md`. Frames in
`.game-render/critic-track-r2/` and `-r2b/`, census in `.game-render/_probe/census.mjs`. Every frame
named in §3 was opened and looked at.

## 1. Scores

| #   | Axis                  | Weight | R1  | R2      | One sentence                                                                                                                                                                                            |
| --- | --------------------- | -----: | --: | ------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The frame             |   30 % | 7.4 | **8.2** | The timber half went from bare poles to a braced lattice that reads as engineering, and the steel close-up is still the best structural frame in the game — but the overview still aliases the timber into a smear and the 18:30 frame is barely lit. |
| 2   | Fidelity              |   20 % | 7.6 | **8.2** | Tiered bracing every bay is what a woodie's bents actually look like. The loop's supports are unchanged: vertical only, and anything rolled past 78° is skipped.                                        |
| 3   | Extensibility         |   20 % | 8.4 | **8.8** | A new element is a manifest entry and now genuinely arrives: 21 → 22 through a pack, `probe-wave` resolved, a typo reported by name. Still nothing in a shipped pack.                                   |
| 4   | Budget and behaviour  |   15 % | 8.6 | **8.2** | 14 meshes for three coasters, **181,656 → 210,040 triangles (+15.6 %)** spent on the bracing, and the aliasing that money makes worse is unaddressed. Ties carry one LOD level; rails and supports carry none. |
| 5   | Determinism and state |   10 % | 9.4 | **9.4** | Unchanged and still the strongest axis in the module.                                                                                                                                                  |
| 6   | Honesty of the report |    5 % | 7.0 | **7.5** | Round 2 corrects the five disputed numbers and says plainly that its own manifest claim was false and its own bracing comment wrong — then leaves a sentence in the weakness list claiming the opposite of what it just shipped. |

**8.2 × 0.30 + 8.2 × 0.20 + 8.8 × 0.20 + 8.2 × 0.15 + 9.4 × 0.10 + 7.5 × 0.05 = 8.405 → 8.41.**

## 2. Hard gates

| Gate                                | Command                                                                     | Result                                                                                                       |
| ----------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Console errors / hydration warnings | `node scripts/game-shot.mjs --showcase=track --cam=… --tod=12:00` and `18:30` | **PASS** — `errors 0 · hydration 0` in both reports. Two `bufferSubData` warnings, which are terrain's showcase landscape and are filed there. |
| Extensibility ≥ 5                   | §4.2                                                                          | **PASS — 8.8**                                                                                               |
| `pnpm test:game` / `test:game-track`| as written                                                                    | **PASS** — exit 0                                                                                            |
| `npx tsc --noEmit` / `eslint`       | as written                                                                    | **PASS** — exit 0 both                                                                                       |

## 3. The frames I looked at

| File                             | What is actually in it                                                                                                                                                                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `critic-track-r2/1200-ground.png` | The finding of this round. The wooden coaster from the ground: **tiered X-bracing in every bay**, ledgers between tiers, bents on concrete footings, the track with its crossties running over the hill. It reads as a structure that could hold a train. Round 1 called this "a row of bare poles" and was right then. |
| `critic-track-r2/1200-close.png`  | Red steel: X-braced bents, footings, rails with ties, the timber lattice legible behind it. Still the best structural frame in the game.                                                                                                       |
| `critic-track-r2/1200-overview.png` | Three layouts on a bare green plain. The timber structure is a **brown speckled smear**, exactly as weakness 1 predicts, and the steel reads as thin lines. Nothing in the frame gives the layouts scale — no terrain relief, no scenery, no buildings. |
| `critic-track-r2b/1830-coaster.png` | Sunset: the coasters are faint outlines on a dark plain. The scene has almost no light on it at this hour, which is `environment`'s, but it is this module's weakest frame.                                                                   |

## 4. Findings

### 4.1 The bracing is right now, and it is worth saying what changed

One X per bay whatever its height meant a twenty-metre bay carried a single diagonal across the
whole of it, and every second bay carried nothing at all under a comment claiming that is how a real
wooden coaster is braced. It is not. A ledger roughly every 4.5 m with an X in each tier, capped at
four tiers, and no bay skipped, is — and `1200-ground.png` is the proof, not the changelog.

Census: track owns **14 meshes, 210,040 triangles** for three coasters at the `close` camera,
against 181,656 in round 1. **+28,384 triangles, +15.6 %**, at 14 meshes either way. That is a fair
price for the frame it buys at ground level, and it is spent in the worst place for the frame it
already had trouble with — see below.

### 4.2 Extensibility: it works now, and this was core's fault

Round 1's finding was two independent failures stacked: `packManifestSchema` was a plain
`z.object()` and **stripped** unknown keys, so `'trackElements' in parsed` was false for every
manifest and the `onPack` listener received the stripped copy too; and
`registerTrackElementsFromPack` had **zero call sites**. Neither is this module's design being
wrong — no module could own a content category at all.

Core landed `passthrough()`, `registerPackCategory(category, owner)` and `unclaimedPackKeys()`;
this module's half is `attachTrackElements`, called from both `createTrackSim` and
`createTrackMain` and detached in both. `pnpm test:game-registry` pins it: elements 21 → 22,
`probe-wave` resolved to `["hill", { "height": "height", "length": "height * 4" }]`, and a
misspelled `trackElments` comes back named in `unclaimedPackKeys()` instead of silently doing
nothing. That last part is what takes this axis to 8.8 rather than 8.4: the failure mode is now a
line of output, not an empty array.

What it is still short of: no bundled pack ships a `trackElements` entry, so like `pathStyles` this
has never been photographed. Unlike a camera preset, an element only becomes a frame once something
is **built** with it, which waits on `tools`.

### 4.3 The overview aliasing, unfixed, and now fed more geometry

At overview distance a timber member is about 0.26 m against roughly 0.5 m per pixel, so the lattice
sub-pixel-aliases into a mass. Round 2 **doubled down**: the bracing change adds members exactly
where they are already too fine to resolve, and there is no silhouette LOD. Measured: the ties carry
one LOD level, the rails and the supports carry none — so the structure a wide frame cannot resolve
is drawn at full density at every distance.

This is now the module's largest open item and it is a frame item, which is the heaviest axis.

### 4.4 The report contradicts itself, in the same file

Round 2's own section says bracing is tiered and **no bay is skipped**. Weakness 1, four paragraphs
later, still reads:

> Bracing alternate bays (done) halved the member count and it is still visible in `1830-overview`.

That is the round-1 behaviour, described as done, immediately after the section that undid it. A
reader tuning the aliasing would take exactly the wrong lever. It is one stale sentence and it costs
the module 0.09 of a point, which is the whole margin: with the honesty axis at 9.0 this module
scores 8.48, so the sentence is not what fails it — but it is the difference between "8.41, and here
is why" and a report I could trust without re-checking it against the scene.

*(Corrected by the integrator in the same commit as this critique, with a note. The score above is
for the state I graded.)*

## 5. What round 3 should do, in order

1. **A silhouette LOD for timber.** Replace the lattice past ~150 m with a coarser stand-in. It is
   the frame axis, it is the module's own weakness 1, and round 2 made it worse rather than better.
2. **Cantilevered supports** where a stretch is rolled past 78°, so a heavily overbanked layout does
   not show gaps.
3. **A `trackElements` entry in a bundled pack** once `tools` can build with it.
4. **Give the showcase somewhere to stand.** Three coasters on a flat green plain read as models on
   a table; the terrain showcase's own landscape generator is public and one call away.
