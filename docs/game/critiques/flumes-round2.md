# flumes — critic round 2

**Score: 8.3 · Verdict: FAIL** (pass is ≥ 8.5; it misses by 0.2)

Graded at `2d1a7db`, `lib/game/flumes/` unchanged since `3dde084` (round 2 = `e4c27f9` + `3dde084`).
Working tree clean (`git status --porcelain` → 0 lines). Harness `medium` preset, WebGL2 through
SwiftShader, 1280 × 720.

**Which server every figure came from.** Everything below is the **dev server on `http://localhost:3001`**
unless it says otherwise. `http://localhost:3100` is the production build from this morning; it
predates round 2, D-023 and D-006, and I used it exactly once, deliberately, as a **"before"** — it
is labelled as such at every mention. Port 3000 is dead.

**Two changes landed under this module after its round, and I have graded around both.** D-023 moved
the park clock 92 minutes ahead of solar, so every `18:30` frame here is **late-afternoon daylight**,
not the dusk the report describes; D-006 tripled archetype speeds. Neither is this module's doing and
neither costs it a tenth. Where the report's frame table says "dusk" and my frame says "daylight",
that is D-023 and I have not counted it against honesty.

**Round 1 scored 7.30 FAIL** (frame 6.0 · fidelity 7.0 · extensibility 8.5 · budget 8.0 ·
determinism 9.0 · honesty 5.5). Every one of its blocking findings is closed. The round still fails,
on the axis that carries 30 % of the weight and on the two surfaces closest to the camera.

---

## 1. The six axes

| #   | Axis                       | Weight | R1  | R2      | One sentence                                                                                                                                                                                                                                                                                     |
| --- | -------------------------- | -----: | --: | ------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The frame                  |   30 % | 6.0 | **7.5** | The towers stand, carry their chutes and are photographable; the trough is a real moulded object with a visibly asymmetric wall — and the largest surface the module draws is washed out over the whole length of the two slides its own `ground` preset points at, the night rig lights nothing, and the deck and stair the tower fix just put in frame are the least-finished geometry in the folder. |
| 2   | Fidelity to the real thing |   20 % | 7.0 | **8.0** | The wall rule, the section grammar, the manufacturer numbers, the water manifold at the top and a landing that ends at +0.40 m on every layout including one I invented — against a raft whose five riders sit outside the tube, a stair with one stringer, and no queue, turnstile or exit path anywhere. |
| 3   | Extensibility              |   20 % | 8.5 | **9.0** | Two of round 1's three deductions are closed and the critic's dead-coefficient finding with them; I registered an eight-seat 1.6 m-radius slide on a canopy-less concrete mast with a 2.5-turn helix and it built clean, and the one remaining switch on a content id is `rig.hull`. |
| 4   | Budget and behaviour       |   15 % | 8.0 | **8.5** | 53 meshes / 49 drawable / 119,548 / 94,060 triangles / 18 materials reproduced exactly and the three stepped daylight frames matched **to the triangle**, the trough LOD is real and correctly caveated — minus a report that no longer states the module's own share of the 1,200 and a dispose/reboot leak nothing measures. |
| 5   | Determinism and state      |   10 % | 9.0 | **9.5** | The one consequence round 1 left open — a save silently losing the airborne riders' descents — is fixed at `sim.ts:363` and pinned by a check that names the critic's own `{16,6,13} → {14,5,11}`. |
| 6   | Honesty of the report      |    5 % | 5.5 | **8.0** | Every headline number reproduces, several to the triangle and to the centimetre, and §5 names four things before I could — against one arithmetic claim that is off by one, two of its own fixes it forgets to claim, and three things a detail crop shows that §5 does not name. |

**Weighted: 2.25 + 1.60 + 1.80 + 1.275 + 0.95 + 0.40 = 8.275 → 8.3**

Extensibility is 9.0, well clear of the 5.0 floor; the axis-3 gate does not fire.

**The verdict is not sensitive to the one judgement call in it.** If a fairer critic put the frame at
8.0 the total is 8.425, and if fidelity also went to 8.5 it is 8.525 — the only route to a pass runs
through *both*, and I do not think either is available while two of five slides render as pale
ribbons and the night rig is one emissive strip. I have not rounded 8.275 up.

---

## 2. Hard gates

| Gate                                           | Result                                                                                                                                                | Command / evidence                                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Zero console errors                            | **PASS** — `console.errors: []` in both harness runs and in all six of my own Playwright probes                                                        | `.game-render/critic-f2/report.json`, `.game-render/critic-f2-step/report.json`                        |
| Zero hydration warnings                        | **PASS** — `hydration: []`                                                                                                                            | same                                                                                                  |
| Warnings attributable to this module           | **PASS** — exactly the two project-wide `WebGL: INVALID_VALUE: bufferSubData: buffer overflow`, which the commission excludes                          | `.game-render/critic-f2/report.json`                                                                  |
| Extensibility ≥ 5                              | **PASS** — 9.0                                                                                                                                        | §5                                                                                                    |
| Touched only its own folder                    | **PASS** — `3dde084` is `lib/game/flumes/{main,showcase}.ts` + its own report and request; the flumes half of `e4c27f9` is ten files under `lib/game/flumes/` and nothing else (that commit also carries `buildings`, which is the integrator batching two rounds, not this module reaching outside itself) | `git show --name-only 3dde084`, `git show --name-only e4c27f9`                                        |
| No `from '@babylonjs/core'` barrel             | **PASS** — 0 hits                                                                                                                                     | `grep -rn "from '@babylonjs/core'" lib/game/flumes/` → exit 1                                          |
| No module-scope `window`/`document`/`navigator` | **PASS** — 0 hits anywhere in the folder, not merely at module scope                                                                                   | `grep -rn "window\.\|document\.\|navigator\." lib/game/flumes/` → exit 1                                |
| No `Math.random` / `Date.now`                  | **PASS** — 0 hits; four `performance.now()` time the main-thread build only                                                                            | `grep -rn "Math.random\|Date.now" lib/game/flumes/` → exit 1                                            |
| `pnpm test:game` green                         | **PASS** — exit 0, and the chain runs `test:game-flumes` (`package.json:105`, `:128`) at **143/143**                                                   | `pnpm test:game` → `EXIT=0`; selftest run in a clean worktree of `2d1a7db`                             |
| `npx tsc --noEmit` clean                       | **PASS** — exit 0                                                                                                                                     | `npx tsc --noEmit`                                                                                    |
| `npx eslint lib/game/flumes` clean             | **PASS** — exit 0, no output                                                                                                                          | `npx eslint lib/game/flumes`                                                                          |

---

## 3. The claims I was sent to refute

### 3.1 The tower — claim upheld, and I walked every mesh

`towerPlacement` (`resolve.ts:336`) takes a `FlumeBuild` and reads `build.flume`, which is the object
`buildFlume` writes the derived height onto (`resolve.ts:258-259`). `main.ts:301` names the pre-build object
`request` and **never reads it again**: `grep -n "request" lib/game/flumes/main.ts` returns six hits,
the last live one at `:309` and the rest comments, including the one at `:313-317` that says why. The type also refuses the mistake — a
`ResolvedFlume` is not a `FlumeBuild`.

Walked in the running scene, world bounding boxes of every `flume-*` mesh (dev :3001, my own probe):

| slide      | layout         | tower steel, y  | chute shell, y max | deck y max | canopy y max | report says       |
| ---------- | -------------- | --------------- | ------------------ | ---------- | ------------ | ----------------- |
| `flume-2`  | `spiral-tower` | −0.25 → **18.25** | 17.55            | 16.30      | 18.73        | −0.25 → 18.25 / 17.54 ✓ |
| `flume-4`  | `family-bowl`  | −0.21 → **16.64** | 15.37            | 14.69      | 17.12        | 16.64 / 15.37 ✓   |
| `flume-6`  | `plunge-drop`  | −0.25 → **16.00** | 14.32            | 14.05      | 16.48        | 16.00 / 14.32 ✓   |
| `flume-8`  | `mat-straight` | −0.25 → **13.73** | 12.02            | 11.79      | 14.21        | 13.74 / 12.02 ✓   |
| `flume-10` | `torrent-lane` | −0.25 → **14.65** | 13.18            | 12.70      | 15.13        | 14.65 / 13.18 ✓   |

Every number reproduces to a centimetre. Every tower stands on the ground and tops out above its own
chute's high point.

**"Carries" rather than "reaches", measured rather than eyeballed.** For each slide I counted the
shell's own vertices lying inside the deck mesh's XZ footprint and read their Y range:

| slide | deck top | shell vertices over the deck | their Y range |
| ----- | -------: | ---------------------------: | ------------- |
| `flume-2`  | 16.30 | 232 | 16.24 … 17.54 (a 1.2 m pipe, crown 1.2 m over the boards) |
| `flume-4`  | 14.69 | 224 | 14.62 … 15.37 |
| `flume-6`  | 14.05 | 178 | 14.00 … 14.32 |
| `flume-8`  | 11.79 |  68 | 11.74 … 12.02 |
| `flume-10` | 12.70 |  60 | 12.64 … 13.18 |

The trough passes across the deck at deck height on all five. It is carried.

And it is in the pictures. `.game-render/critic-f2-tower/flume-tower-flume-2-a.png` is the frame that
settles it — an 18 m steel lattice, a switchback stair zig-zagging up its outside, a teal canopy, the
purple closed pipe leaving the deck at the top and running away into its helix on `track`'s white
support bents, which are visibly a different object at a different height.

**The "before", taken by me rather than quoted.** Production :3100 still runs round 1. Its probe:
all five towers **−0.25 → 2.00 m**, all five decks at **1.00 m**, under chutes at 12.02–17.55 m; 44
flume meshes, 81,424 triangles, no `flume-rim`, no `flume-shell-lod`.
`.game-render/critic-f2-before/towers-crop.png` (:3100) against
`.game-render/critic-f2/crops/0900-close-towers.png` (:3001) is the same camera before and after: two
chutes hanging in mid-air over 2 m tables in the grass, then two towers with stairs holding them up.

### 3.2 The selftest — claim upheld; I reintroduced the bug and it fails

`selftest.mjs:387` calls the same `towerPlacement(build, 0)` the renderer calls and then walks the
returned geometry's own Y extents (`:413-424`), rather than recomputing a number from the spec.

I reintroduced the bug in a clean worktree of `2d1a7db` — `deckY = flume.position[1] + 0`, which is
what the pre-build sentinel gives — and re-ran:

```
✗ plunge-drop: the tower steel stands to its own deck — 2.0038 vs 16.0028 (±0.15)
✗ plunge-drop: the deck boards are at the derived height — 1.0000 vs 14.0528 (±0.02)
✗ plunge-drop: the chute leaves the deck rather than 12 m above it — chute 14.32 m, deck 1.00 m
…                                                                    (three per slide)
128/143 checks passed — 15 FAILED
```

Fifteen failures, three on every slide, and the printed values are round 1's exact numbers
(2.0038 / 1.0000). The suite would catch it. Restored; both trees clean.

### 3.3 `INSTANCESCOLOR` — mechanism verified, not just the outcome

**Outcome.** My probe of the live scene: `instanceColor` present and **`INSTANCESCOLOR` true on 9 of
9** rig meshes (`flume-hull:{tube,raft,mat,torrent}`, `flume-rider:{tube,raft,body,mat,torrent}`), all
carrying live thin instances. On production :3100 the same nine report `instanceColor` **false** and
`INSTANCESCOLOR` **false** — the round-1 build had no colour buffer at all, which is consistent with
the report's account that round 2 wired the buffer first and then found it reaching no pixel.

**Mechanism.** Both halves of the claimed trap are in the shipped Babylon:

- `@babylonjs/core/Materials/materialHelper.functions.js:1093-1095` — `PrepareDefinesForAttributes`
  early-returns while `_areAttributesDirty` is false.
- `:1110-1112` — `if (mesh.isVerticesDataPresent('instanceColor') && (mesh.hasInstances || mesh.hasThinInstances)) defines['INSTANCESCOLOR'] = true;`. It only ever sets **true**.
- `Meshes/mesh.pure.js:224` — `hasThinInstances` is `(forcedInstanceCount || _thinInstanceDataStorage.instancesCount || 0) > 0`.
- `Meshes/thinInstanceMesh.pure.js:214-224` — `thinInstanceCount = 0` writes exactly that field.
- `:277-299` — the colour path calls `setVerticesBuffer`, which dirties the attributes.

So `rigFor` (`main.ts:288-293`) dirties the attributes and then empties the mesh, and the one compile
that saw a dirty list saw `hasThinInstances === false`.

**And I reproduced the trap live**, on a clone of the module's own `flume-rider:raft` and a clone of
its shared `flume-vehicle` material, in the running page:

| step                                                                | `instanceColor` | `hasThinInstances` | `INSTANCESCOLOR` |
| ------------------------------------------------------------------- | --------------- | ------------------ | ---------------- |
| set matrix buffer, set colour buffer, `thinInstanceCount = 0`, render | true            | false              | **false**        |
| `thinInstanceCount = 8`, `thinInstanceBufferUpdated`, render          | true            | true               | **false**        |
| `material.markAsDirty(8)` — the module's fix — render                 | true            | true               | **true**         |

`Constants.MATERIAL_AttributesDirtyFlag` is 8 (`Engines/constants.js:454`), which is what
`ATTRIBUTES_DIRTY` resolves to at `main.ts:105`. The diagnosis is exactly right and the fix is the
minimal one.

In the frame: `.game-render/critic-f2-detail/raft-zoom.png` shows five riders in five distinct
colours — white, orange, blue, teal, teal — against `family-bowl`'s five-entry
`wear: ['#16e0c8','#7c4dff','#ff6b35','#f4f6f7','#2ec4b6']`. I could not reproduce the
15,450 → 30,330 saturated-pixel figure without the intermediate build, and I do not need to.

### 3.4 `wallResponse` — I deleted it again, and this time it fails

`geom.ts:200-204`. I hard-coded the coefficient to 1 in a clean worktree:

```
✗ a narrow pipe at response 0 keeps its 90° — 1.7738 vs 1.5708 (±1e-9)
✗ and at response 1 it grows — 101.6° vs 90.0°
✗ response 0.5 is exactly half of it
✗ plunge-drop / family-bowl / mat-straight: response 0 is a wall that never answers
✗ family-bowl / mat-straight: and a fractional one is not the same wall as 1 — 0.00°
✗ deleting `wallResponse` from the formula would change a shipped slide
134/143 checks passed — 9 FAILED
```

The round-1 finding is closed: the checks now drive the real `wallExtents` at responses 0 / 0.5 / 1
rather than pinning a pipe where the clamp's lower bound is doing the work. The selftest's own run
prints the 90°-wrap pipe at **90.0 / 95.8 / 101.6°**, which is the report's figure, and the shipped
table `family-bowl 18.45° vs 21.71°`, `mat-straight 17.20° vs 21.50°`.

Nine failures, not the **ten** the docblock at `geom.ts:178` claims. See finding 8.

### 3.5 Budget and LOD — re-measured

Scene probe, dev :3001, `?showcase=flumes`, 1,200 ticks stepped:

| quantity                 | measured                                             | report |
| ------------------------ | ---------------------------------------------------- | ------ |
| flume meshes             | **53** (49 drawable + 4 `flume-shell-lod`)           | 53 / 49 ✓ |
| per slide                | 8 kinds × 5 (shell, rim, water, legs, pads, tower, deck, canopy) + 9 rig meshes | ✓ |
| flume triangles          | **119,548**; **94,060** excluding the coarse copies  | ✓ ✓ |
| flume materials          | **18**                                               | ✓ |
| whole scene              | 274 meshes, 39 materials, 379,288 triangles          | 274 / 39 ✓ |
| flume share of the scene | **24.8 %** of triangles                              | not stated |

`.game-render/critic-f2-step/report.json`, the stepped run, matches the report **to the triangle**:
09:00 overview **250 / 314,678**, close **191 / 364,986**, ground **177 / 342,750**. Unstepped
(`.game-render/critic-f2/report.json`): 250 / 313,630, 191 / 363,814, 177 / 341,826, and at 23:00
**132 / 73 / 59** against a reported 132 / 73 / 61 — two draw calls on the night ground frame, which
is a rider-count difference between runs and is the only figure in the report I did not land on.

**The LOD claim is true and the caveat about how to read it is the interesting half.** Asking each
shell `getLOD(camera)` after forcing a view-matrix update:

| preset     | distance to shells | resolves               | trough triangles drawn |
| ---------- | ------------------ | ---------------------- | ---------------------- |
| `overview` | 376.4 – 524.2 m    | 4 of 5 → coarse        | 50,660 → **29,268**    |
| `close`    | 15.8 – 118.4 m     | 5 of 5 → fine          | 50,660                 |
| `ground`   | 41.6 – 95.1 m      | 5 of 5 → fine          | 50,660                 |

Over the four shells that *have* an LOD level that is 46,880 → 25,488, **45.6 %**, exactly as
reported; over all five troughs it is 42.2 %. The fifth, `flume-shell:flume-10`, is 3,780 triangles
against `LOD_MIN_TRIANGLES = 4000` (`main.ts:102`) and correctly has no level. And
`scene.getActiveMeshes()` lists all five by their **master** name at `overview` while four of them
are drawing their coarse copy — the report's warning is right, and a critic who read that list would
have concluded the LOD does nothing.

---

## 4. The frames I looked at

Twenty-five PNGs, every one opened with the Read tool. The nine-frame showcase set from
`node scripts/game-shot.mjs --url=http://localhost:3001 --showcase=flumes --cam=overview,close,ground --tod=09:00,18:30,23:00 --out=.game-render/critic-f2`
(**no `--step`**, so the clock reads the time on the label and the park is empty — the trade the
commission names); one frame from the same command with `--step=1200`, whose clock then reads 09:20;
eight hand-posed through `__parkfan_game.scene().activeCamera` at coordinates computed from the
measured mesh boxes; and seven crops, one of them of a frame taken against the production build on
:3100 as a deliberate "before". 9 + 1 + 8 + 7 = 25.

| Frame                                                | What is actually in it                                                                                                                                                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `critic-f2/0900-overview.png`                        | The complex from 400 m, occupying ~19 % of frame width (x ≈ 490–730 of 1280) on an otherwise empty field. Towers are ~10 px specks with a coloured canopy. The report's own description, confirmed. |
| `critic-f2/crops/0900-overview-zoom.png`             | The same, magnified: five towers legible as dark specks, purple helix, magenta raft trough, teal chutes, two racers, three pools.                                                                 |
| `critic-f2/0900-close.png`                           | **The best daylight frame.** The teal body chute sweeps the foreground on braced steel columns over the lagoon; two towers behind carry their chutes down into blue run-out basins.                |
| `critic-f2/crops/0900-close-towers.png`              | The two racers magnified: both towers full height, both chutes leaving the deck. This is the round-1 blocker, fixed, in a photograph.                                                             |
| `critic-f2/crops/0900-close-trough.png`              | The foreground trough at arm's length: gelcoat with butt seams every ~2.4 m, the wall visibly taller on the loaded side through the bend, the sheet running inside it, X-braced columns and cast shadows. |
| `critic-f2/0900-ground.png`                          | Eye level at (0, 1.5, −79.1) — measured, matches the showcase docblock. A run-out lane 16 m ahead, the two racers at ~111 m, both chutes starting on a tower.                                     |
| `critic-f2/1830-overview.png`                        | Daylight, not the dusk the report describes (**D-023**). The complex as a small pale smudge.                                                                                                      |
| `critic-f2/1830-close.png`                           | Late-afternoon light on the same close framing; sun from the other side. Nothing new.                                                                                                            |
| `critic-f2/1830-ground.png`                          | The clearest view of the sheet problem: the torrent lane is a pale desaturated ribbon from the deck to the basin, orange kerb either side.                                                        |
| `critic-f2/2300-overview.png` + `crops/2300-overview-zoom.png` | Coloured lines glowing on black — purple helix, magenta trough, teal rims, amber lane, lit pools. It reads as a water park from 400 m, which the day frame does not. Real improvement on round 1's "dim patch of ground". |
| `critic-f2/2300-close.png`                           | **The best night frame.** The rim strip draws the whole teal trough as a glowing outline across the lagoon; one warm spill on the far basin.                                                      |
| `critic-f2/2300-ground.png`                          | Both racers as silhouettes; the torrent lane lit warm along its length. The sheet is the brightest thing on the tower side — peak V 0.81 against a night-grass mean of 0.43.                     |
| `critic-f2-step/0900-close.png`                      | The same close frame with people on the slides: one orange rider on the teal trough at ~(845, 325), a handful of pixels. The colour fix pays at detail range and not here — as §5.5 says.         |
| `critic-f2-detail/flume-rider-raft.png` + `raft-zoom.png` | Five riders in five distinct colours in a yellow ring hull. Also five **detached blocks** on a ring, three of them past the hull's outer edge, heads separated from torsos by a visible gap. |
| `critic-f2-tower/flume-tower-flume-2-a.png`          | The 18 m steel tube tower: columns, cross bracing, a four-flight switchback stair, teal canopy, the pipe leaving the deck. §3.1's settling frame.                                                 |
| `critic-f2-tower/flume-tower-flume-4-a.png`          | The timber raft tower, magenta canopy, stair climbing the left face, the magenta trough leaving the deck to the right; the steel tube tower behind it.                                            |
| `critic-f2-tower/flume-tower-flume-6-b.png`          | The magenta trough through a big banked turn with the outer wall unmistakably taller than the inner, a tower and canopy behind. The module's one idea, visible.                                   |
| `critic-f2-deck/deck-tube-0900.png`                  | Deck level on the tube tower: stair flights and landings inside the shaft, a near-black featureless deck plate, a flat canopy slab, the pipe coiling out.                                          |
| `critic-f2-deck/deck-raft-0900.png` + `stair-zoom.png` | The stair at close range: open treads with a stringer on the outer side only and nothing under the inner, a bare handrail tube with no balusters that ends in mid-air at each flight's head.    |
| `critic-f2-deck/tower-tube-2300.png`                 | The same tower at 23:00: a black lattice, a faintly glowing pipe. The point light at the deck illuminates essentially none of it.                                                                 |
| `critic-f2-deck/plunge-0900.png`                     | The raft trough from two metres: flat magenta gelcoat with seam lines, the sheet reading as a thin transparent layer over it, the asymmetric wall through the turn.                               |
| `critic-f2-before/towers-crop.png` (crop of `0900-close.png`, :3100) | **:3100, round-1 code, deliberate "before".** Two chutes hanging in mid-air on thin posts, two 2 m tables lying in the grass, white run-out basins reading as drained.                          |

---

## 5. Findings, ranked

### 1. The water sheet is the module's largest surface and it is worst on the two slides its own preset frames

`geom.ts` foam ramp; §5.4 names the ceiling (white at 23.9° of gradient at top speed, 15.6° at the
foamed outer edge) and I reproduce the floor it claims exactly — measured over the vertex colour
buffers in the running scene:

| sheet                 | verts | near-white (r > 0.95) | red min / mean | alpha min / mean |
| --------------------- | ----: | --------------------: | -------------- | ---------------- |
| `flume-water:flume-2`  (tube)    | 4,393 | **5.2 %**  | 0.248 / 0.499 | 0.333 / 0.587 |
| `flume-water:flume-4`  (raft)    | 2,055 | **7.5 %**  | 0.243 / 0.511 | 0.327 / 0.572 |
| `flume-water:flume-6`  (body)    | 1,710 | **9.5 %**  | 0.250 / 0.506 | 0.336 / 0.577 |
| `flume-water:flume-8`  (mat)     | 1,144 | **12.4 %** | 0.253 / 0.560 | 0.339 / 0.612 |
| `flume-water:flume-10` (torrent) |   832 | **19.2 %** | 0.243 / 0.631 | 0.328 / 0.672 |

What §5.4 does not say is **which two are worst and where they are pointed**. The mat racer and the
torrent lane carry 12.4 % and 19.2 % against the tube's 5.2 %, and they are the two slides the
`ground` preset — the module's own choice of a visitor's eye, at (0, 1.5, −79.1) looking down −Z — puts
in the middle of the frame at 111 m. Traced along the torrent lane in
`.game-render/critic-f2/1830-ground.png`, eleven samples from the deck to the basin: **mean saturation
0.444, mean value 0.724**, with the run reading as one pale blue-white ribbon rather than as water.
At 23:00 (`critic-f2/2300-ground.png`) it peaks at **V 0.81, rgb(154,188,207)** against a night-grass
mean of 0.43 and no light source on it — round 1's "the sheet is the brightest surface in the frame"
inverse problem, still present, and **not in §5** at all.

Credit where it is due: `hasVertexAlpha` and the two `…OverAlpha` flags are fixed
(`VERTEXALPHA` true on all five, alpha 0.33–1.0, `useSpecularOverAlpha`/`useRadianceOverAlpha` both
false), and on the raft and the plunge the sheet now genuinely reads as a thin transparent layer
(`critic-f2-deck/plunge-0900.png`, `critic-f2-detail/raft-zoom.png`). It is the steep, straight,
fast slides where the ramp saturates, and those are the ones on show.

### 2. The night rig is one emissive strip, and the two point lights light nothing

`.game-render/critic-f2-deck/tower-tube-2300.png`: an 18 m tower rendered as a black lattice under a
`PointLight` sitting at its deck. Probed: exactly two lights, `flumes-night:flume-2` at y 16.80 with
range 22.82 and `flumes-night:flume-10` at y 13.30 with range 17.78, of 7 in the scene; only 2 of 5
slides declare a `night.light` block, so raising the quality preset adds nothing.

What carries `.game-render/critic-f2/2300-close.png` and `2300-overview.png` is the rim strip —
`materials.glow` ramping its emissive with `night` — and that is a genuine round-2 addition
(`flume-rim` ×5 exists on :3001 and does not exist on :3100). §5.8 says this out loud and calls the
point lights "close to decoration", which is honest and is also the finding: a module whose two
signature pictures are a water park by day and a water park by night has one of them drawn by a
material and none of it by a lighting rig.

### 3. The riders are five detached blocks on a ring, and several sit outside the hull

`.game-render/critic-f2-detail/raft-zoom.png`. The colour fix works and is the right fix; what it
now reveals is the arrangement. `manifest.ts` gives the raft `hullRadius: 1.3`, `hullTube: 0.34`,
`seatSpread: 0.96` — deliberately the rim centreline, with a comment explaining the choice — and
`riderRadius: 0.24`, but `buildRig`'s body is a torso, a head and two arm slabs wider than that, so
three of the five overhang the tube's outer edge and every head floats clear of its torso. §5.5
admits "no pose"; it does not admit that the five do not read as people sitting in a raft at the one
range where their colours are visible at all.

### 4. The tower's deck and stair are the least-finished geometry in the folder, and the tower fix is what put them on screen

`geom.ts:740-747`: each flight gets a stringer and a handrail **along the open side only**
(`addTube(steel, at(outer, …))`), so the treads cantilever off nothing on the inner side, and the
handrail is a bare 0.032 m tube with no balusters that simply stops at each flight's head — visible
as two lines running off into empty air in `.game-render/critic-f2-deck/stair-zoom.png`. The deck
itself is a near-black plate with no board relief at deck range
(`.game-render/critic-f2-deck/deck-tube-0900.png`). None of this mattered in round 1, because none of
it was in the frame; it is in the frame now on all five slides.

### 5. The showcase does not frame itself for the preset a third of every harness run uses

Measured: `overview` is radius **400** at target (0, 8, 0); the complex spans z +54 → −196, so it
occupies ~19 % of frame width and the towers are ~10 px (`critic-f2/0900-overview.png`). §5.9 states
the trade honestly and declines it, which is a defensible call — but the showcase is this module's,
and one extra preset in its manifest would cost the `ground` frame nothing.

### 6. `rig.hull` is the last closed enum, and the last place the module switches on a content id

`manifest.ts:59` — `hull: z.enum(['none','ring','raft','mat'])` — with `buildRig` branching on it
(`geom.ts:811`, `:839`, `:880`). A pack can ship a new slide style, a new tower, a new descent and a
new track style with no code; it cannot ship a new vehicle shape. Defensible (somebody has to
generate a mesh) and the only remaining item of round 1's three.

The other two are **closed**: `resolve.ts:183` is now `def.trackStyle ?? ''` resolving through
`track`'s own `FALLBACK_STYLE`, with a per-style `radius` escape hatch, so no bundled content id is
written into this module's TypeScript; and `claim()` (`manifest.ts:458-474`) now warns by name when
one pack overwrites another pack's id while staying silent for a deliberate override of the built-ins.

### 7. The report no longer states the module's own share of the 1,200-draw-call budget, and nothing measures a leak

§4.4 gives the scene's 250 / 191 / 177 "against a 1,200 draw-call budget", which is the *scene's*
share, not the module's. The convention on this branch is the module's own — `pools` records "32 of
the frame's 117 draw calls (2.7 % of the 1,200 budget)", `shops` "1.4 % of the 1,200", and round 1's
own report said "44 of a 1,200 whole-game budget". Measured here: **49 drawable meshes**, one per
surface per slide plus nine shared rig meshes, i.e. at most **4.1 % of the 1,200** in the base pass
for five slides, and 24.8 % of this showcase's triangles. That is a good number and it is missing.

The rubric's other budget bullet — "no leak across three dispose/reboot cycles" — is measured by
nobody. `scripts/game-soak.mjs` loads no flume (`grep -n flume` → nothing), the selftest disposes two
runtimes but counts no scene resources, and I could not reach the renderer's `clear()` from outside
the module: `__parkfan_game.dispatch('flumes:rebuild', {})` three times rebuilds the **sim** and
leaves the main-thread meshes untouched (`flume-shell:flume-2` keeps `uniqueId 800`), with scene
meshes / materials / textures / geometries unchanged at 274 / 39 / 61 / 265 and zero console errors.
So: no evidence of a leak, and no measurement of one either.

### 8. One arithmetic claim in the report is off by one

`geom.ts:178`: "Deleting the term from this line fails **ten** checks in `selftest.mjs`." Deleting it
(hard-coding the coefficient to 1) gives **134/143, 9 FAILED**. Nine. Small, and it is the kind of
number this report otherwise gets exactly right.

### 9. Two of round 2's own fixes are not claimed, and one of them leaves a round-1 finding reading as open

- **The descents fix.** `sim.ts:363` folds the airborne riders into `descents` on serialize, with a
  docblock naming the round-1 critic's own `{16,6,13} → {14,5,11}`, and `selftest.mjs` pins it
  ("a save loses no descent"). The report's §2 still says only that riders are "transient by design",
  so a reader comes away thinking round 1's consequence is unaddressed. It is fixed.
- **The basins.** Round-1 finding 8 was that both run-out lanes were `white-ceramic` and read as
  drained. `showcase.ts:115,143` are `aqua-mosaic` now and both basins read as water in
  `critic-f2/0900-close.png`. Not mentioned anywhere.

Under-claiming is a much smaller sin than over-claiming, and it is why honesty is 8.0 rather than
lower — but a report that leaves a critic's finding looking open is costing itself a round.

### 10. Not this module's fault — noted and moved past

`rides/sim.ts:263` is `if (entity.kind !== 'ride') return;`, so no guest can queue for or board a
flume, exactly as it refuses a coaster; the HUD in every frame above reads "On a ride 0" and "Riders
per hour 0" with vehicles in the air. Written up in `docs/game/requests/rides.md` §4 and named first
in this module's own §5.1. `demo-park/plan.ts:198` still reserves 18 × 15 half-extents (36 × 30 m)
against a smallest catalogue footprint of 38 × 76 m, and `demo-park/build.ts` contains no flume — a
request, correctly not executed from this folder. The two `bufferSubData` warnings are project-wide.

---

## 6. Extensibility, tested rather than read

I registered a third pack through `Registry.registerPack` with a slide nothing in this repository
resembles — an eight-seat, 1.6 m-radius, 0.85-flat-floor, 20°-wrap lane at `wallResponse: 0.65`, on a
`concrete-mast` tower with a 9 × 3 m footprint, 1 m columns and **`canopy: false`**, running a 273 m
layout built from a 2.5-turn helix, an s-bend and a 55° drop. Result:

```
registered: 1 styles, 1 towers, 1 layouts
style wave-lane · tower concrete-mast · radius 1.6 (from the STYLE, not a track style)
length 273.4 m · drop 27.96 m · towerHeight 28.36 m · exit +0.40 m · wall spread 44.0°
tower steel −0.25 → 29.49 m over a shell top of 29.17 m
no NaN in shell, sheet, tower steel, rider or hull; no warnings
```

Every one of those came off the manifest, and `towerPlacement` scales to a tower spec it has never
seen: the derived height, the deck, the stair and the exit clearance all land. (One false alarm of my
own, recorded so the next critic does not repeat it: `buildRig` takes a `FlumeRig`, not a
`FlumeStyleSpec`, and handing it the style produces 404 NaN positions with no error. My bug, not the
module's.)

---

## 7. What is genuinely good, and must survive round 3

- **The tower derivation and its single call site.** `towerPlacement(build, ground)` is the right
  shape of fix — not a corrected line but one function both the renderer and the test call, taking an
  argument from which the pre-build value is unreachable. Verified by reintroducing the bug.
- **The wall rule, still.** 27 cm at 6 m/s against 58 cm at 12 m/s on the synthetic hook, the section
  asymmetric through every turn, and it is **visible in a photograph**
  (`critic-f2-tower/flume-tower-flume-6-b.png`, `critic-f2/crops/0900-close-trough.png`).
- **The selftest.** 143 checks that fail on both of the things the last critic broke by hand.
- **The content path.** A fifth style from a pack registered after `main()` draws, and a sixth of my
  own invention builds. Do not refactor this.
- **The report's arithmetic.** Draw calls and triangles reproduce to the digit, mesh boxes to the
  centimetre, LOD distances to a tenth of a metre, sheet vertex statistics to three decimals.

---

## 8. Round 3, first thing

**Take the `ground` preset's own frame and fix the water on the two slides in it** — the mat racer and
the torrent lane run at 12.4 % and 19.2 % near-white vertices against the tube's 5.2 %, they are the
straightest and fastest slides in the catalogue, and they are what the module's own visitor's-eye
camera is pointed at. The frame axis carries 30 % of the grade and it is the only axis still below 8;
the sheet is the largest continuous surface this module draws, and on those two runs it is a pale
ribbon from the deck to the basin at every time of day. Second, and cheaper than it looks: give the
night something other than an emissive strip, because two point lights on a steel lattice light
nothing and the module says so itself.

