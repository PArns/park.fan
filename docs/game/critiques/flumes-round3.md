# flumes — critic round 3

**Score: 8.72 · Verdict: PASS** (pass is ≥ 8.5)

Graded at `5a25e8b`; `lib/game/flumes/` and `docs/game/reports/flumes.md` are **unchanged since
`e93766e`** (`git diff --name-only e93766e HEAD -- lib/game/flumes/ docs/game/reports/flumes.md` →
0 lines), so the buildings round-4 commit on top of it grades nothing here. Working tree clean
(`git status --porcelain` → 0 lines). Harness `medium` preset, WebGL2 through SwiftShader,
1280 × 720.

**Which server every figure came from.** Every number below is the **dev server on
`http://localhost:3001`** — my own harness run into `.game-render/critic-f3`, my own Playwright
probes, and my own node runs of the module's geometry against two `git worktree`s (`3dde084` for
the "before", `e93766e` for sabotage). I did **not** use production `:3100` at all this round: it
predates round 3 and the round-2 critic already used it as a "before". Port 3000 is dead.

**Rounds 1–3 were 7.30 FAIL, 8.30 FAIL, and this. Round 2's whole gap was the frame axis (7.5) and
its five findings there are all closed** — four of them decisively, one of them (the torrent lane)
half-closed and correctly named as half-closed. Two clock changes landed under the module and are
not its doing: **D-023** (18:30 is daylight, not dusk) and **D-006**. Neither costs it a tenth.

**One number in the report does not survive checking, and it is not a rounding error**: the night
rig's headline "22,505 px changed" is two thirds a **UI toast notification** that is present in one
of the two A/B screenshots and absent from the other. Finding 1 below. It does not move the verdict.

---

## 1. The six axes

| #   | Axis                       | Weight | R2      | R3      | One sentence                                                                                                                                                                                                                                                                                       |
| --- | -------------------------- | -----: | ------: | ------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The frame                  |   30 % | 7.5     | **8.5** | The mat racer goes from a white ribbon to a teal trough with water in it, the water is no longer the brightest thing at midnight (p90 0.800 → 0.576 against grass at 0.121, both reproduced on my own render), five riders sit in the raft instead of over its edge, the stair is a stair and the `overview` frame finally contains the subject — against a torrent lane that is still a pale ribbon at 111 m, a trough interior that is now simply black after dark, and a lighting rig that is still two point lights lighting nothing. |
| 2   | Fidelity to the real thing |   20 % | 8.0     | **8.7** | The foam is a real self-aerated chute-flow model now — a literature equilibrium, a development length, a three-times-longer decay and a hydraulic-jump impulse, marched down the run in one pass and speed-independent to 1e-12 — plus a pose that follows the seating and a switchback with two stringers and a continuous rail; against a worked example of its own formula that is wrong by 11 %, invented development/decay lengths (admitted), a calm run-out where a real braking lane is white (admitted), and still no queue, turnstile or exit path. |
| 3   | Extensibility              |   20 % | 9.0     | **9.0** | Nothing regressed: `rig.hull` is still the one closed enum, and round 3's `onRim` reads it once and feeds both the seat ring and the pose rather than adding a second switch — the one new item is that `AERATION` is a TypeScript constant a pack cannot tune per style.                          |
| 4   | Budget and behaviour       |   15 % | 8.5     | **8.7** | 53 / 49 / 18 / 127,344 and all six per-frame draw-call and triangle pairs reproduced on my own run **to the digit**, the module's share of the 1,200 is stated at last, the rope light really did cost zero draw calls (59 at 23:00 `ground`, identical to round 2), and the leak test has teeth — but it is blind to both of the module's cross-module registrations, which are the two things that actually outlive a scene dispose. |
| 5   | Determinism and state      |   10 % | 9.5     | **9.5** | Unchanged and still clean: no `Math.random`/`Date.now` anywhere in the folder, the byte-identical rebuild and save round trip still pinned, and the one new mutable global (`AERATION`) is written only by the selftest, which restores it.                                                        |
| 6   | Honesty of the report      |    5 % | 8.0     | **7.5** | Everything I could re-derive reproduced — the pixel table to within 0.004 on frames I rendered myself, the buffer table to three decimals, the rider figures exactly, 181/190 exactly — and §4.3 de-weights its own headline before I could; against a night-rig A/B whose headline is two-thirds UI toast, an overview preset that changed two more fields than claimed, `0.9·sin 30° = 0.40`, and a shipped artifact that contradicts the report's own table with no note. |

**Weighted: 2.550 + 1.740 + 1.800 + 1.305 + 0.950 + 0.375 = 8.720 → 8.72**

Extensibility 9.0, far clear of the 5.0 floor; the axis-3 gate does not fire.

**How sensitive is the verdict.** It survives a pessimistic read of any one axis and of any two:
frame 8.0 gives 8.57; frame 8.0 with honesty 7.0 gives 8.545. It does **not** survive a pessimistic
read of three at once (frame 8.0, fidelity 8.0, budget 8.0 → 8.325). I do not think that read is
available: I opened the frames, the improvement is large and visible, and I re-derived the physics,
the geometry and the budget independently rather than reading them. I have not rounded anything up.

---

## 2. Hard gates

| Gate                                            | Result                                                                                                                                 | Command / evidence                                                                                             |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Zero console errors                             | **PASS** — `console.errors: []` in my harness run and `errors: []` in all four of my own Playwright probes                              | `.game-render/critic-f3/report.json`                                                                           |
| Zero hydration warnings                         | **PASS** — `hydration: []`                                                                                                             | same                                                                                                           |
| Warnings attributable to this module            | **PASS** — exactly the two project-wide `WebGL: INVALID_VALUE: bufferSubData: buffer overflow`, which the commission excludes           | `.game-render/critic-f3/report.json` (2 warnings, both that string)                                            |
| Extensibility ≥ 5                               | **PASS** — 9.0                                                                                                                         | §5                                                                                                             |
| Touched only its own folder                     | **PASS** — `e93766e` is six files under `lib/game/flumes/` plus its own report and request, and nothing else                            | `git show --name-only e93766e`                                                                                 |
| No `from '@babylonjs/core'` barrel              | **PASS** — 0 hits                                                                                                                      | `grep -rn "from '@babylonjs/core'" lib/game/flumes/` → exit 1                                                  |
| No module-scope `window`/`document`/`navigator`  | **PASS** — 0 hits anywhere in the folder                                                                                               | `grep -rn "window\.\|document\.\|navigator\." lib/game/flumes/` → exit 1                                        |
| No `Math.random` / `Date.now`                   | **PASS** — 0 hits; four `performance.now()` time the main-thread build only (`materials.ts:366,538`, `main.ts:301,435`)                 | `grep -rn "Math\.random\|Date\.now" lib/game/flumes/` → exit 1                                                  |
| `pnpm test:game` green                          | **PASS** — exit 0, and `test:game-flumes` runs in the chain at **190/190**                                                              | my own full run, `EXIT=0`; the chain's tail prints `190/190 checks passed`                                     |
| `npx tsc --noEmit` clean                        | **PASS** — exit 0, no output                                                                                                           | `npx tsc --noEmit`                                                                                             |
| `npx eslint lib/game/flumes` clean              | **PASS** — exit 0, no output                                                                                                           | `npx eslint lib/game/flumes`                                                                                   |

---

## 3. The claims I was sent to attack

### 3.1 The water sheet — the model really was replaced, and the physics is applied as described

**Read, not just named.** `geom.ts:505-525` marches an air concentration down the run:

```ts
const target = clamp(AERATION.equilibrium * station.fall + AERATION.wall * Math.abs(station.climb), 0, AERATION.ceiling);
const scale  = air < target ? AERATION.growth : AERATION.decay;
air += (target - air) * (1 - Math.exp(-ds / scale));
if (previous) air += Math.max(0, previous.fall - station.fall) * AERATION.jump;
```

Four things check out and each is the claim rather than a name for it.

- `station.fall` is `Math.max(0, -frame.tangent[1])` (`resolve.ts:299`) on a unit tangent, i.e. it
  really is `sin θ`, so `equilibrium * fall` really is Wood's `0.9·sin θ`.
- `ds` is arc length in metres (`station.s - previous.s`), and the relaxation is the exact solution
  of a first-order approach to a constant target over that step — not an Euler step with a
  resolution-dependent gain.
- The growth/decay asymmetry is a **branch on which side of the target it is**, 4 m up against
  14 m down, which is the "carried" half of the claim and is what puts the white below the drop.
- The jump impulse is `max(0, Δ(−sin θ))·0.5`, i.e. only ever a gain and only at a gradient break,
  and over a monotone break it telescopes, so it is independent of how finely that break is
  sampled. `v` appears **nowhere** in the function.

**Continuity across pieces.** `buildWaterSheet` (`geom.ts:554`) calls `aerationProfile` once, on the
whole run's station list, so there is no per-piece reset by construction. Measured on the three
built-in layouts I could build headlessly, the largest change in air between two adjacent stations
is:

| layout         | stations | air min / max / mean  | largest step change | at |
| -------------- | -------: | --------------------- | ------------------: | -- |
| `spiral-tower` |      191 | 0.000 / 0.604 / 0.186 |               0.071 | s = 21.8 |
| `family-bowl`  |      137 | 0.000 / 0.526 / 0.208 |               0.062 | s = 22.8 |
| `plunge-drop`  |      114 | 0.000 / 0.708 / 0.274 |               0.075 | s = 22.5 |

No seam anywhere. Note the maxima: `AERATION.ceiling` is 0.72 and the jump can in principle push
past it (`air` is clamped to 1, not to the ceiling), but on the shipped catalogue the peak is 0.708
and the ceiling is never breached.

**The twelve checks are real checks**, not restatements. I read them (`selftest.mjs:320-410`): the
speed-independence one compares two 60-station runs at 4 and 14 m/s to 1e-12; the settling one
asserts `steady[79] ≈ 0.9 × 0.6`; the carry one asserts a 40° chute is still above 0.5 two metres
past its foot and below 0.05 seventy metres later; and each coefficient is zeroed one at a time
against the **real** `plunge-drop` stations and must move the mean.

### 3.2 The measurements — reproduced, and the mask trick is legitimate

**The buffer table (§4.3) reproduces exactly.** My own probe of the running scene, walking every
`flume-water:*` vertex colour buffer:

| sheet                | verts | near-white (r > 0.95) | red mean | sat mean | alpha mean | red max |
| -------------------- | ----: | --------------------: | -------: | -------: | ---------: | ------: |
| `flume-2` (tube)     | 4,393 |              **0.0 %** | 0.368    | 0.521    | 0.383      | 0.701   |
| `flume-4` (raft)     | 2,055 |              **0.0 %** | 0.393    | 0.494    | 0.397      | 0.671   |
| `flume-6` (body)     | 1,710 |              **0.0 %** | 0.439    | 0.450    | 0.441      | 0.797   |
| `flume-8` (mat)      | 1,144 |              **0.0 %** | 0.436    | 0.455    | 0.430      | 0.790   |
| `flume-10` (torrent) |   832 |              **0.0 %** | 0.469    | 0.425    | 0.455      | 0.773   |

Every cell is the report's, to three decimals. And the **before** column is not quoted from the
round-2 critique — I rebuilt it: a `git worktree` at `3dde084`, its own `buildWaterSheet`, and the
result is 5.24 / 7.54 / 9.47 % near-white with red means 0.499 / 0.511 / 0.506 and saturation means
0.392 / 0.388 / 0.396. Those are the report's before figures including the three saturation numbers
the round-2 critic never published, so the report computed them rather than copying them.

The report's own caveat on the 0.0 % column is honest and, if anything, understated: the reachable
red is capped at 0.797 on the shipped slides, not the 0.87 it names.

**The mask trick is legitimate, and I checked the premise rather than accepting it.** The claim is
"nothing in this round moved a vertex POSITION, so the mask taken on this tree is valid on the
round-2 critic's own PNGs". Built the sheets on both trees and compared the position arrays:

| sheet     | floats | Σ positions, `3dde084` | Σ positions, `e93766e` | first 9 equal |
| --------- | -----: | ---------------------- | ---------------------- | ------------- |
| `flume-2` | 13,179 | 156293.2027551105      | 156293.2027551105      | yes |
| `flume-4` |  6,165 | 136355.66819582265     | 136355.66819582265     | yes |
| `flume-6` |  5,130 | 106053.60074454198     | 106053.60074454198     | yes |

Bit-identical. The premise holds.

**The pixel table reproduces on frames I rendered myself.** I scored the round-2 critic's
`critic-f2/{1830,2300}-ground.png` and **my own** `critic-f3/{1830,2300}-ground.png` through the
report's shipped mask (`.game-render/flumes-r3/lane-masks.json`, 6,631 / 2,677 / 8,813 / 4,962 px):

| frame        | sheet     |    px | saturation    | value         | p90 value     | report says                   |
| ------------ | --------- | ----: | ------------- | ------------- | ------------- | ----------------------------- |
| 18:30 ground | torrent   | 6,631 | 0.279 → 0.235 | 0.625 → 0.505 | 0.808 → 0.773 | 0.279→0.235 · 0.625→0.505 · 0.808→0.773 ✓ |
| 18:30 ground | mat racer | 2,677 | 0.495 → 0.678 | 0.655 → 0.569 | 0.796 → 0.714 | 0.495→0.677 · 0.655→0.569 · 0.796→0.714 ✓ |
| 23:00 ground | torrent   | 8,813 | 0.399 → 0.464 | 0.585 → 0.415 | 0.800 → 0.580 | 0.399→0.464 · 0.585→0.415 · 0.800→0.576 ✓ |
| 23:00 ground | mat racer | 4,962 | 0.437 → 0.621 | 0.498 → 0.390 | 0.796 → 0.537 | 0.437→0.620 · 0.498→0.390 · 0.796→0.537 ✓ |

Eight before-cells and eight after-cells, every one within 0.004, on a frame this critic rendered.
The night-grass control (x 150–480 × y 306–326) is **0.1206** in both frames against the report's
0.121. That is the strongest arithmetic I have checked in this project.

I also built a mask of my own (each sheet isolated and rendered `unlit` black and white at 12:00,
4,854 px torrent / 2,167 px mat) and scored the same two pairs through it, so the result does not
depend on the builder's mask: 18:30 mat saturation 0.423 → 0.635, 23:00 torrent p90 0.800 → 0.506,
23:00 mat p90 0.804 → 0.545. Same direction, same order, in one case stronger.

**One methodological caveat the report does not state.** Its mask is derived per time of day — the
same torrent lane is 6,631 px at 18:30 and 8,813 px at 23:00, which a pure silhouette could not be.
Within a time of day the same pixels score both frames, so the comparison is sound; across the two
rows it is two different samples of the same object. Worth a sentence next time.

**Emissive zero at every hour: confirmed twice.** `materials.ts:479` sets the sheet's
`emissiveColor` to `(0,0,0)`, and `applyNight` (`:424-431`) returns early for everything whose key
does not start with `glow:` or `gelcoat:` — the water material is not in that map at all, so no
code path can give it one. Probed live: emissive `(0,0,0)` and `environmentIntensity` **0.85** at
09:00, emissive `(0,0,0)` and **1.20** at 23:00, exactly as `materials.ts:522` says.

### 3.3 The torrent lane's saturation — naming it was the right call, and it is half a real regression

The number is real and it went the wrong way: 0.279 → 0.235 at 18:30 in the shared mask, and
0.317 → 0.256 in my own. The stated cause is right — I opened
`.game-render/flumes-r3-detail/torrent-sheet-0900.png` and the pale part of that lane is
unmistakably the **trough**, a cream `#f6f1e8` gelcoat between amber kerbs, with a blue-grey band
of textured water running down the middle of it. At two metres the sheet reads as water and the
saturation figure is measuring the shell through it.

Where I part company slightly: the report frames this as a measurement artefact and stops. At
**111 m**, which is where the module's own `ground` preset puts this lane, the cream shell and the
pale water still blur into one washed-out ribbon — I cropped it from both rounds and the change is
modest (`critic-f2/1830-ground.png` vs `critic-f3/1830-ground.png`, x 660–990 × y 175–355: round 3
has a visible tonal split between a lit and a shaded side where round 2 was flat, and both still
read as a pale ribbon). So the round-2 finding "the sheet is washed out on the two slides the
module's own preset frames" is **fully closed on the mat racer and half-closed on the torrent
lane**: the water was fixed, the composite was not.

Declining to repaint `showcase.ts:262` is nonetheless the right call and I would have said so
unprompted — the fix has to stand on the water, and a cream slide is a legitimate thing for a park
to have. It costs the frame axis a little and it should.

### 3.4 The night rig — mesh and draw-call claim verified, headline pixel figure contaminated

**The claim that costs nothing is true.** Probed live: **53** flume meshes (49 drawable + 4
`flume-shell-lod`) and **exactly five** `flume-rim:*` meshes, identical to round 2's counts. The
tower light really is welded: `main.ts:373-375` is `buildRimLights(...)` then
`appendGeo(rim, tower.lights)` into one `meshFrom`. Built the two halves separately in node —
`spiral-tower` 760 strip + 384 tower = 1,144, `family-bowl` 544 + 360 = 904, `plunge-drop`
452 + 360 = 812 — and the live meshes are 1,144 / 904 / 812. And the draw calls: toggling all five
rim meshes off and on in the running scene at 23:00, **56 → 59** at `ground` and **69 → 73** at
`close`; the round-2 critic measured **59** at 23:00 `ground` and so does my run of round 3. The
rope light added zero.

The rim meshes now run from **1.019 / 1.005 / 0.605 / 0.484 / 0.814 m** up to **18.323 / 16.710 /
16.076 / 13.808 / 14.724 m**, matching the report to the centimetre, and the tower bounding boxes
are unchanged from §4.1.

**The 22,505-pixel figure is not a measurement of the rope light.** I diffed the report's own two
A/B PNGs (`.game-render/flumes-r3-detail/tower-tube-2300-{with,without}-rope.png`, 1280 × 840). At
a threshold of 20/765 the diff is 22,991 px with mean value 0.129 → 0.373 — which reproduces the
report. But the y-histogram puts **15,227 of them below y = 730**, and the reason is plain when you
crop that band: the `with-rope` screenshot carries a **"Medium graphics preset chosen for this
machine" toast** at bottom-left and the `without-rope` screenshot does not. I opened both crops.
Two thirds of the headline is a UI notification.

Honest figures, same diff with the toast band excluded:

|                     | reported                | actually the rope light |
| ------------------- | ----------------------- | ----------------------- |
| pixels it changes   | 22,505 (2.09 % of frame) | **7,764** (0.72 %)      |
| their mean value    | 0.127 → 0.376           | **0.251 → 0.583**       |
| of those, over 0.30 | 2,952 → 8,376           | **3,080 → 6,216**       |

The rope light itself is real and correctly described. I rendered the diff as a mask and looked at
it: the changed pixels are the canopy eave, the deck fascia, the top rail, and the stair's outer
handrail zig-zagging all the way down — which is exactly `geom.ts:922`'s per-flight
`addTube(lights, …)` plus the eave loop, and is more than the pictures alone show. Note the honest
"before" is 0.251, not 0.127: the error inflates the extent by 3× while *understating* the
brightness lift. Nobody gained from it, which is why it reads as carelessness rather than as spin —
and it is still the one number in the report that does not survive being checked.

### 3.5 The riders — the assertion exists, it is vertex-level, and both figures reproduce

`selftest.mjs:745-766` loops every registered style whose `rig.hull` is `raft` or `ring`, rotates
**every vertex of the rider mesh** into each seat's frame, and asserts the furthest radius is
inside `hullRadius`. That is the right quantity — a seat is a point, the complaint was about a
body — and it is per style, so a pack's own ring slide is covered. A second check clamps an absurd
`seatSpread: 5`.

Reproduced by running the same computation against both trees:

| style     | hull | R      | seats | furthest, `3dde084` | over | furthest, `e93766e` | over | rider tris |
| --------- | ---- | ------ | ----: | ------------------: | ---: | ------------------: | ---: | ---------- |
| `raft`    | raft | 1.30 m |     5 |         **1.418 m** | **5** |         **1.156 m** |    0 | 112 → 160  |
| `tube`    | ring | 0.62 m |     1 |             0.481 m |    0 |             0.314 m |    0 | 112 → 160  |
| `mat`     | mat  | 0.50 m |     1 |             0.423 m |    0 |             0.397 m |    0 | 112        |

1.418 → 1.156 and 5-of-5 → 0-of-5, exactly as reported, and the round-2 critic's "three of them"
really was an undercount from one angle. The report saying so about its own predecessor's finding
is the right instinct.

It is also visible. I opened `.game-render/critic-f2-detail/raft-zoom.png` against a matched crop
of `.game-render/flumes-r3-detail/raft-riders.png`: round 2 is five detached blocks with heads
floating clear and three torsos past the tube; round 3 is five people sitting on the rim, facing
inward, with legs and arms, every one inside the hull. The §4.5 refusal to assert "do the parts
overlap" — because that check would have been green on round 2's rider — is exactly right and is
the best paragraph in the report.

### 3.6 The leak test — it disposes what the scene owns, and is blind to what it hands away

It is a real test. `selftest.mjs:942-1015` builds the **actual** `createFlumesMain` against a
Babylon `NullEngine`, censuses `scene.{meshes,materials,textures,geometries,lights}`, disposes, and
repeats three times, asserting both that each cycle returns to empty **and** that each rebuild is
identical — so a slow leak cannot hide. It prints `32 / 15 / 13 / 32 / 1 → 0 / 0 / 0 / 0 / 0`, which
I reproduced verbatim. The `EnvironmentBRDFTexture0` exclusion is correct and correctly argued: it
is one per scene, and the module does not own the scene.

**It has teeth.** I broke three separate lines in a worktree of `e93766e`:

| sabotage                                          | result                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| `main.ts:882` `materials.dispose()` removed        | **185/190** — 15 → 30 → 45 materials, 13 → 26 → 39 textures across cycles |
| `main.ts:872` light disposal removed               | **185/190** — 1 → 2 → 3 lights                                            |
| `main.ts:877-878` rig hull/rider disposal removed  | **185/190** — 5 → 10 → 15 meshes and geometries                           |

**And it is blind in exactly one place, which is the interesting half.** The census counts
`scene.*`. The module's two references that live **outside** the scene are the ones a `dispose()`
has to hand back, and neither is exercised:

| sabotage                                                          | result          |
| ----------------------------------------------------------------- | --------------- |
| `main.ts:870-871` — the `env?.removeShadowCaster?.(mesh)` loop deleted | **190/190** ✗ |
| `main.ts:867` — `offTerrain()` deleted                              | **190/190** ✗ |

Both are green because the selftest's context passes `module: () => undefined` (so `environment` is
never reached and no shadow caster is ever registered) and a **fresh `EventBus` per cycle** (so an
un-removed `terrain:changed` listener cannot accumulate). In the running game those are the two
leaks that actually survive: disposed meshes left in another module's shadow render list, and a bus
subscription holding the whole closure. §5.9 names the GL-handle blindness of `NullEngine`, which
is fair and real, and does not name this one, which is cheaper to fix — a stub `environment` with a
counting `addShadowCaster`/`removeShadowCaster`, and one `EventBus` shared across the three cycles.

### 3.7 Budget — reproduced to the digit

Scene probe, dev :3001, `?showcase=flumes`:

| quantity                  | measured                                           | report |
| ------------------------- | -------------------------------------------------- | ------ |
| flume meshes              | **53** (49 drawable + 4 `flume-shell-lod`)          | ✓ |
| flume materials           | **18**                                              | ✓ |
| flume triangles           | **127,344**; **101,856** excluding the coarse copies | ✓ ✓ |
| whole scene               | 274 meshes / 39 materials / **386,036** triangles   | ✓ |
| module's share of triangles | 32.99 %                                           | 33.0 % ✓ |
| module's share of 1,200 draw calls | 49 / 1200 = 4.08 %                         | 4.1 % ✓ |
| sim tick                  | 0.0–0.1 ms against a 6 ms budget                    | not stated |

Per-frame, `.game-render/critic-f3/report.json` (mine) against `.game-render/critic-f2/report.json`:

|         | 09:00 overview | 09:00 close   | 09:00 ground  | 23:00 overview | 23:00 close  | 23:00 ground |
| ------- | -------------- | ------------- | ------------- | -------------- | ------------ | ------------ |
| round 2 | 250 / 313,630  | 191 / 363,814 | 177 / 341,826 | 132 / 127,242  | 73 / 113,250 | 59 / 91,262  |
| round 3 | 234 / 352,142  | 191 / 390,578 | 177 / 368,230 | 116 / 142,654  | 73 / 116,914 | 59 / 94,566  |

All twelve cells match the report exactly, on my own run. `overview` is a different pose (§4.7) and
the report says so rather than claiming the improvement. Selftest **190/190**, and `pnpm test:game`
green with it in the chain. Hard-coding `wallResponse` to 1 at `geom.ts:217` gives **181/190,
9 FAILED** — the docblock at `geom.ts:193` says nine and it is nine.

### 3.8 Honesty — the two round-2 items are corrected; three new ones are not

Round 2's two items are closed and I checked both: `geom.ts:193` now says nine and prints the nine;
§4.8 claims the descents fix (`sim.ts:362-366` folds airborne riders into `descents` on serialize)
and the `aqua-mosaic` basins (`showcase.ts:117,143`), both of which are in the code.

Three new inaccuracies, none of them large on its own:

1. The night-rig headline, §3.4 above. This is the one that matters.
2. §4.7 says the `overview` replacement changes "only the anchor … and `frameRadius: 'auto'`" while
   keeping the built-in's numbers. `showcase.ts:169-176` also sets `height: 10` against the
   built-in's `height: 8` (`camera/manifest.ts:50`) and adds `fill: 0.95`. Four fields changed, not
   two.
3. `geom.ts:473` and `docs/game/reports/flumes.md:98` both give the worked example of the
   equilibrium as "**0.40** at 30°". `0.9 · sin 30° = 0.450`. The 48° figure (0.67) is right. This
   is the same species as round 2's "ten where it was nine", in the paragraph that argues the
   physics is from the literature.

And one thing that is not an inaccuracy in the report but is a contradiction in what shipped beside
it: `.game-render/flumes-r3/lane-pixels-before.json` gives the 18:30 torrent lane 6,634 px,
val 0.685, p90 0.82 — different numbers from the report's table and taken through a slightly
different mask, against `before-1830-ground.png`, which is **not** the round-2 critic's file
(100,165 pixels differ by more than 10 from `critic-f2/1830-ground.png`). I chased this because the
report's §4.3 says the before column is the critic's PNG "rather than a reconstruction" and the
shipped artifact looked like a reconstruction. **The report is right and the artifact is stale**: I
scored `critic-f2/1830-ground.png` through the shipped mask and got 0.279 / 0.625 / 0.808, the
report's exact before column. But an artifact directory that contradicts the table with no note
costs the next critic an hour, as it cost me one.

---

## 4. The frames I looked at

Thirty-two PNGs, every one opened with the Read tool. Nine from
`node scripts/game-shot.mjs --url=http://localhost:3001 --showcase=flumes --cam=overview,close,ground --tod=09:00,18:30,23:00 --out=.game-render/critic-f3`
(**no `--step`**, so the clock reads its label and the park is empty — the trade the commission
names); eleven of the round-2 critic's and the builder's, used as the before; eight crops I cut
myself; and four renders and masks from my own A/B probes.

| Frame                                                       | What is actually in it                                                                                                                                                                                     |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `critic-f3/0900-overview.png`                               | The whole complex legible at last: five runs as coloured lines, three basins, five towers, the lagoon, occupying roughly the middle third of the frame. Round 2's smudge is gone.                            |
| `critic-f2/0900-overview.png`                               | The "before" for that: the same complex as a ~200 px smear in an empty field.                                                                                                                              |
| `critic-f3/0900-close.png`                                  | The teal body chute across the foreground on braced steel over the lagoon, two racers and two basins behind. The best daylight frame the module has.                                                        |
| crops of `critic-f2/0900-close.png` and `critic-f3/0900-close.png` (x 300–760 × y 300–560) | Side by side, the fix and its cost: round 2's chute has a pale white sheet inside a teal trough; round 3's is teal all through with only a faint darker band of water. Better, and the water is now nearly invisible on a calm run. |
| `critic-f3/0900-ground.png`                                 | Visitor's eye over the lagoon: the mat racer's teal lane and the torrent's cream one at 111 m, both leaving a tower.                                                                                        |
| `critic-f3/1830-ground.png` / `critic-f2/1830-ground.png`   | **The frame round 2's finding 1 was made on.** The mat racer is teal now where it was a white ribbon. The torrent lane is a cream trough with a blue sheet and still reads pale at this range.               |
| crops of both at x 500–700 (mat) and x 660–990 (torrent)    | The mat racer's change is unmistakable at 4× — a white ribbon becomes a teal trough with water in it. The torrent's is a tonal split appearing in what was a flat pale band.                                |
| `critic-f3/1830-close.png`, `critic-f3/1830-overview.png`   | Late-afternoon light on the same two framings; the troughs hold their own colour. Daylight, not dusk (D-023).                                                                                              |
| `critic-f3/2300-ground.png` / `critic-f2/2300-ground.png`   | Round 2's torrent lane is a white glowing ribbon; round 3's is an amber trough lit by its point light with no torch of its own. The water is no longer the brightest thing in the frame.                    |
| `critic-f3/2300-close.png` / `critic-f2/2300-close.png`     | Round 2's foreground trough is a bright white sheet inside a teal rim; round 3's is a dark trough drawn by its rim strip. Correct, and the trough interior is now empty after dark.                          |
| `critic-f3/2300-overview.png` / `critic-f2/2300-overview.png` | Coloured lines glowing on black, with the tower lights as small lit rectangles and dots. Round 3's is much the better picture, mostly because of the reframing.                                            |
| `flumes-r3-detail/tower-tube-2300-{with,without}-rope.png`  | The A/B. The canopy eave, deck fascia and top rail are drawn in purple in one and absent in the other — and the "with" frame also carries a graphics-preset toast the other does not. Finding 1.            |
| my `ropediff-full.png` (mask of that diff)                  | Where the rope light actually lands: the eave rectangle, the deck rail, and the stair's zig-zag all the way to the ground — plus the toast blob at bottom-left, two thirds of the pixel count.               |
| `flumes-r3-detail/raft-riders.png` (+ my 4× crop) vs `critic-f2-detail/raft-zoom.png` | Five people sitting on the rim facing inward with legs, all inside the hull, against five detached blocks with floating heads and three past the edge.                                                  |
| `flumes-r3-detail/stair-timber-1600-crop.png` vs `critic-f2-deck/stair-zoom.png` | A stringer under both edges, an upright every third tread and a rail turning the landing corner, against bare tubes ending in mid-air over treads carried on nothing.                                    |
| `flumes-r3-detail/torrent-sheet-0900.png`                   | Two metres from the torrent lane: cream gelcoat, amber kerbs, and a textured blue-grey sheet down the middle that unmistakably reads as running water. Settles §3.3.                                       |
| my `tower/tower-rim-on.png`                                 | My own rim A/B at the tube tower, one pose, both halves with the same UI: the deck outline and the eave lit, the stair a dark zig-zag. Measured against its `-off` twin: 2,274 px changed against a 771 px same-pose noise floor, mean value 0.259 → 0.386. |

---

## 5. Findings, ranked

### 1. The night rig's headline measurement is two-thirds a UI toast

`.game-render/flumes-r3-detail/tower-tube-2300-with-rope.png` contains the "Medium graphics preset
chosen for this machine" notification and `-without-rope.png` does not. Of the 22,991 pixels that
differ at threshold 20/765, **15,227 lie below y = 730** and are that toast. The rope light's own
figure is **7,764 px (0.72 % of the frame), mean value 0.251 → 0.583, over 0.30 3,080 → 6,216**.
The report prints 22,505 / 2.09 % / 0.127 → 0.376 / 2,952 → 8,376. The feature is real, the
description of it is right, the number is not a number about it. Fix: take both halves of an A/B in
one uninterrupted session with the UI in the same state, or crop the HUD out of the diff.

### 2. The leak test does not cover either of the module's two cross-module registrations

`main.ts:867` (`offTerrain()`) and `main.ts:870-871` (`env?.removeShadowCaster?.(mesh)`) can both be
deleted with the suite still at **190/190**, because the selftest's context passes
`module: () => undefined` and a fresh `EventBus` per cycle (`selftest.mjs:988-1000`). Those are
precisely the references that outlive a `scene.dispose()`: disposed meshes stranded in another
module's shadow render list, and a live bus subscription pinning the whole closure. Three other
sabotages each caught it at 185/190, so the census works — it is the fixture that is too kind. Two
lines: a stub `environment` module with counting add/remove, and one `EventBus` shared across the
three cycles with its listener count asserted back to zero.

### 3. The torrent lane is still a pale ribbon in the module's own `ground` frame

Round-2 finding 1 is closed on the mat racer (saturation 0.495 → 0.677, value 0.655 → 0.569, and
visibly a teal trough now) and half-closed here: the water is right at two metres
(`flumes-r3-detail/torrent-sheet-0900.png`) and at 111 m the cream `#f6f1e8` shell and the
transparent calm sheet still average out to a washed-out band — saturation **0.279 → 0.235**, the
one number that went backwards. Naming it rather than repainting `showcase.ts:262` was the right
call and I would defend it, but the frame axis pays for it, and the honest next move is a second
torrent slide in a colour, so the style is proved on a shell that is not nearly white.

### 4. After dark the trough interior is now empty

Round 2's sheet glowed and was the brightest thing in a night frame; round 3's has zero emissive at
every hour and `environmentIntensity` 0.85 → 1.20, which is correct and which I verified in the
material. The consequence in `critic-f3/2300-close.png` is that the module's largest surface is
simply black inside a glowing outline. Correct PBR for an unlit slide; not what a real water park
looks like, because a real one lights its slides. §5.8 owns the cause — two point lights, only two
of five slides declaring one, the `medium` pool capped at two — and the answer is content plus a
measurement, not more code.

### 5. `0.9 · sin 30° = 0.45`, not 0.40

`geom.ts:473` and `docs/game/reports/flumes.md:98`. The 48° figure is right. Same species as round
2's "ten where it was nine", in the paragraph whose whole job is to say the model came from the
literature.

### 6. §4.7 understates what the camera preset replacement changes

`showcase.ts:169-176` sets `height: 10` and `fill: 0.95` alongside the anchor and `frameRadius`;
the built-in is `height: 8` with no `fill` (`camera/manifest.ts:48-54`). The report says only two
fields moved. Separately, and larger than the inaccuracy: a showcase silently redefining `overview`
means this module's `overview` frame is no longer comparable with any other module's, which the
report acknowledges for round 2 but which will also be true of round 4 and of the whole-game
critic. Worth a line in `camera`'s own docs rather than only in this module's §7.

### 7. A shipped artifact contradicts the report's own table

`.game-render/flumes-r3/lane-pixels-before.json` was scored against `before-1830-ground.png`, a
re-render that differs from `critic-f2/1830-ground.png` in 100,165 pixels, through a mask 3–9 px
different from the shipped one. Its 18:30 torrent row (6,634 px, val 0.685, p90 0.82) is not the
report's (6,631, 0.625, 0.808). The report's table is the correct one — I verified it against the
critic's PNG through the shipped mask — but the stale file is left in the directory beside it with
no note, and it is what a reader checking the work finds first.

### 8. The aeration mask is per-time-of-day and is described as one mask

6,631 px at 18:30 against 8,813 px at 23:00 for the same lane. Within a row it is the same pixels
before and after, which is what the comparison needs, so nothing is wrong with the result — but
"the same mask scores both frames" is one sentence short of what happened.

### 9. `AERATION` is a TypeScript constant a pack cannot reach

`geom.ts:485-500`. The whole point of the module elsewhere is that a pack ships a slide with no
code, and a themed pack whose water behaves differently — a rapids, a foam channel — has to change
this file. It is a small item and the same class as `rig.hull`; it is also the only new one this
round added. The selftest mutating the object in place to zero each coefficient is a hint that it
wants to be per-style content.

### 10. Not this module's fault — noted and moved past

`rides/sim.ts:263` still refuses a `flume`, so no guest can queue or board and the HUD reads "On a
ride 0" in every frame above; written up in `docs/game/requests/rides.md` §4 and named first in the
module's own §5.1. `demo-park/build.ts` still contains no flume and `plan.ts:198` still reserves
36 × 30 m against a smallest footprint of 38 × 76 m — a request, correctly not executed from this
folder. The two `bufferSubData` warnings are project-wide.

---

## 6. What is genuinely good, and must survive round 4

- **The aeration march.** It is the right physics for the right reason, it is one exported function
  rather than a ramp inside a mesh builder, and it is pinned by twelve checks that assert
  *properties* (speed-independence to 1e-12, carried past a break, settling at `0.9·sin θ`) rather
  than snapshots. Do not turn it back into a per-vertex formula.
- **The arithmetic.** Sixteen pixel cells within 0.004 on frames I rendered myself, a buffer table
  to three decimals, `1.418 → 1.156` to the millimetre, twelve draw-call and triangle cells to the
  digit, `181/190` on the nose. That is the standard the rest of this project is measured against.
- **§4.5's refusal to write a test that would have passed either way.** "The obvious check — do the
  parts overlap — would have been GREEN on round 2's rider" is the single best sentence in the
  report, and it is why the seating check is a good check.
- **The welded rope light.** A night silhouette for zero meshes and zero draw calls, verified by
  toggling. That is the right shape of answer to "the night rig lights nothing" in a project where
  lights are rationed.
- **§5, all nine items.** It names the one number that went the wrong way, the `NullEngine`'s
  blindness, the demo park, the missing queue and the missing spray, before a critic could.

---

## 7. Round 4, or rather: it passes, and here is what I would defend

**It passes at 8.72 and I would defend that against a harder critic.** The round-2 gap was one
axis, its five findings were named in order, and four of the five are closed with numbers I
re-derived from a clean tree and from frames I rendered myself rather than from the report. The
fifth — the torrent lane — is half-closed and is correctly identified as a shell colour rather than
a water problem, which I checked at two metres and agree with. The physics is not decoration: it
is a marched, carried, speed-independent air concentration with an asymmetric relaxation, and every
consequence the report claims for it is in the buffers and in the pixels.

**If there is a round 4, the first thing is finding 2, not finding 1.** The contaminated pixel count
is embarrassing and costs five per cent of the grade; the leak test's blind spot costs nothing today
and is the kind of hole that ships a real leak later, because it is the two lines that hand
something to another module and the fixture is the only reason they are green. Two lines of test
fixture close it. Then re-take the rope-light A/B with the HUD in one state, and fix `0.40` to
`0.45` in both places.
