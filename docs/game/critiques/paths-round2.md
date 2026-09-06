# paths — critic, round 2

Module: `lib/game/paths/` · showcase `/game?showcase=paths` · also every walk, street and plaza in
the demo park (20 `path` entities) · commit `77b6025`.

Round 1 (`paths-round1.md`) failed this module at **6.26** — the lowest grade on the branch — with
extensibility at exactly 5.0, the floor rather than clearance, and honesty at 6.0 for a report that
claimed a green selftest which was red at HEAD.

Round 2 shipped four things and the report names all four without flinching: the selftest wired into
`pnpm test:game` with its assertion changed to the per-query time, `maxSimultaneousLights = 6` on
the paving materials, `attachPathStyles` claiming `pathStyles` + `pathMaterials`, and the concrete
slab texture retiled from 2 m to 4 m with its per-slab tint raised to 1.15.

**Weighted total: 7.13. FAIL** (pass is 8.5). No hard gate failed. Two of the module's three worst
measured defects are gone — the flagship paving's tone and the unlit night avenue — and the three
that remain are the ones nobody worked on: no camber or crossfall, no LOD, and half the triangles
are kerb.

Who graded this: the integrator, not an independent critic agent, for the reason recorded in
`terrain-round2.md`. Numbers come from `.game-render/_probe/paths-r2-2200.json` (albedo read back
off the GPU, the light sources each paving mesh actually gets, a triangle census) and from the
commands in §2. Every frame in §3 was opened and looked at.

## 1. Scores

| #   | Axis                  | Weight | R1  | R2      | One sentence                                                                                                                                                                                                        |
| --- | --------------------- | -----: | --: | ------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The frame             |   30 % | 6.5 | **7.6** | The flagship paving's tone range went **2.9 % → 15.7 %** on the round-1 critic's own metric, two lamps reach the paving instead of one, and `2200-ground.png` is the best frame in the project.                     |
| 2   | Fidelity              |   20 % | 5.8 | **5.8** | Untouched. Still no camber, no crossfall, no gutter, no drainage; an 8 m avenue still has two vertices across its width; the 8/6/4 hierarchy is still a width number.                                               |
| 3   | Extensibility         |   20 % | 5.0 | **7.0** | `attachPathStyles` claims both categories, walks `registry.packs()` **and** subscribes to `onPack`, and `test:game-registry` proves a pack style resolves (6 → 7). No shipped pack carries one, so it is unphotographed. |
| 4   | Budget and behaviour  |   15 % | 6.0 | **6.0** | Unmoved and re-measured: **48,144 triangles, of which 24,243 (50.4 %) are kerb**, byte for byte the round-1 figures, and still no LOD and no spatial split.                                                          |
| 5   | Determinism and state |   10 % | 9.5 | **9.6** | Same guarantees, now actually run: `pnpm test:game-paths` is in the chain and green, 0.276 µs per query against a 2 µs assertion that no longer depends on `QUERIES`.                                               |
| 6   | Honesty of the report |    5 % | 6.0 | **8.5** | The round-2 section opens "the lowest grade on the branch, and a report that was not true", states the red selftest, sharpens the lamp finding **against itself**, and keeps five unfixed items at the top of the weak list. |

**7.6 × 0.30 + 5.8 × 0.20 + 7.0 × 0.20 + 6.0 × 0.15 + 9.6 × 0.10 + 8.5 × 0.05 = 7.13.**

## 2. Hard gates

| Gate                                | Command                                                                              | Result                                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Console errors / hydration warnings | `node scripts/game-shot.mjs --cam=ground,close --tod=12:00,22:00 --step=600` + probe | **PASS** — `errors 0 · warnings 0 · hydration 0`, 4 shots; the probe logged `errors: []`                        |
| Extensibility ≥ 5                   | §4.2                                                                                 | **PASS — 7.0** (round 1 sat exactly on the floor)                                                               |
| `pnpm test:game`                    | as written                                                                           | **PASS** — exit 0, and it now contains this module's own selftest, which is the round-1 honesty failure closed  |
| `pnpm test:game-paths`              | as written                                                                           | **PASS** — green, `0.276 µs each, 5.52 ms for 20000`. Red at HEAD in four runs of four in round 1.              |
| `npx tsc --noEmit` / `eslint`       | as written                                                                           | **PASS** — exit 0 both                                                                                          |

## 3. The frames I looked at

`.game-render/critic-paths-r2/`, demo park, `--step=600`, one process, `errors 0`.

| File                | What is actually in it                                                                                                                                                                                                                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2200-ground.png`   | A **lit avenue**: lamp pools falling on the paving and running up the kerb, the receding lamp line down the street, two lit shopfronts, guests silhouetted against them, 254 people still in the park. The slab joints and the per-slab tone are readable in the foreground. The best frame in this project. |
| `1200-close.png`    | The clay-paver plaza under dappled tree shadow with the concrete walk in front of it. The slab grid reads; the tint variation is present but subtle at this distance.                                                                                                                                     |
| `1200-ground.png`   | Noon down the promenade: kerbs, verges and the joint pattern all legible, and the surface no longer reads as one flat tone. Compare round 1's "every walking surface is a flat tone with a grid on it".                                                                                                   |
| `2200-close.png`    | The plaza at night from above; the lamp throw is legible on the pavers and the junction caps hold up under it.                                                                                                                                                                                            |

## 4. Findings

### 4.1 The surfaces: the round-1 measurement repeated, on the same metric

Albedo read back off the GPU with `texture.readPixels()`, luminance per texel, in the running demo
park. Round 1's headline was the flagship concrete "spanning 5.5 of 255, **2.9 %**":

| material               | full range | p5–p95 |
| ---------------------- | ---------: | -----: |
| `path-concrete-slab`   | **15.7 %** |  7.9 % |
| `path-timber-deck`     |     23.9 % | 15.4 % |
| `path-kerb-timber`     |     20.8 % | 13.6 % |
| `path-granite-sett`    |     17.6 % | 15.3 % |
| `path-kerb-granite`    |     16.1 % | 13.4 % |
| `path-kerb-concrete`   |     13.3 % |  3.0 % |
| `path-clay-pavers`     |     11.8 % |  8.7 % |
| `path-asphalt-service` |     10.6 % |  7.5 % |

The flagship went **2.9 % → 15.7 %, a 5.4× increase**, and it is no longer the flattest thing in
the game. Two caveats keep this from being worth more: it is still the **second-lowest p5–p95** of
the eight, so most of its area is within 20 of 255 and the range comes from a minority of texels;
and `path-kerb-concrete` at 3.0 % p5–p95 is now the flat one, on a surface that catches lamp light
edge-on all night. For scale, terrain's grass measures 85.1 % on the metric the same critic used.

### 4.2 Extensibility: the seam is closed, and nothing ships through it

`attachPathStyles` claims `pathStyles` **and** `pathMaterials`, walks `registry.packs()` and
subscribes to `onPack` — both halves, which is the trap this project has now hit in four modules.
`unclaimedPackKeys()` is `[]` in the running game and `pnpm test:game-registry` pins a pack style
resolving (`styles before: 6 → after: 7`, `brick-walk resolved: true`).

What holds it at 7.0: **no bundled pack carries a `pathStyles` entry**, so nothing in the shipped
game exercises it and no frame has ever contained a pack-supplied path. Unlike a camera preset — 
which `neon-lagoon` now carries and which `--cam=lagoon` photographs — a path style is only visible
once something is **built** with it, so proving this one end to end waits on `tools`. That is a fair
reason for the delay and not a reason to score it as proven.

### 4.3 The night lights: one lamp became two, and the ceiling is still there

At 22:00 in the demo park, every paving mesh reports its light sources as
`sun@0.000, sky@0.100, env-moon-light@0.000, scenery-lamp-0@63.000, scenery-lamp-1@63.000`.

So the fix works — and read the list, because it says more than "one became two". Of the six slots,
**three go to lights at intensity 0.000 or 0.100**: the sun and the moon light are both dark at this
hour and still occupy the front of `mesh.lightSources`, which sorts by `renderPriority` and not by
whether a light contributes anything. At `medium` the night rig's pool holds two lamps, so both get
in and the avenue is lit. At `ultra` the pool holds six and there are three usable slots — the
disparity the round-2 report itself pointed out is unchanged, and it widens the more the machine can
afford. The fix is a `renderPriority` on the two dark lights, or a rig that drops a light at zero
intensity, and neither is this module's file.

### 4.4 Budget: byte for byte where it was

`paths-r2-2200.json`, per-mesh census: **48,144 triangles**, of which `paths-kerb-granite` 16,210 +
`paths-kerb-concrete` 4,280 + `paths-kerb-timber` 3,753 = **24,243, i.e. 50.4 %** — the round-1
figure to the triangle. Still no LOD, still no spatial split, so that number is identical at every
camera and every hour. Eight materials, and the grouping remains the module's best engineering.

### 4.5 What the remaining 1.4 points are

Fidelity, and nothing else. No camber, no crossfall, no gutter; two vertices across an eight-metre
avenue; the width hierarchy carries no other signal. A kerb that is half the module's triangles and
carries no LOD is the second item, and the two are related: the geometry budget to give a walk a
cross-section is sitting in a kerb nobody has LOD'd.

## 5. What round 3 should do, in order

1. **A cross-section.** Camber on the running surface, a gutter at the kerb line, and enough
   vertices across an avenue to carry them. This is the whole fidelity axis and most of the frame's
   remaining headroom.
2. **LOD on the kerb**, which pays for item 1 out of triangles the module already spends.
3. **Raise `path-kerb-concrete` off 3.0 %** — it is the surface lamp light rakes along all night.
4. **A `pathStyles` entry in a bundled pack**, once `tools` can build with it, so this axis is
   photographed rather than unit-tested.
