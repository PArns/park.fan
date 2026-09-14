# buildings — critic round 2

**Score: 8.2 · Verdict: FAIL** (pass is ≥ 8.5). Every hard gate passes. It misses by **0.28**, and
the two axes holding it under are not the ones round 1 failed on: the frame is genuinely repaired.

Graded at `b39101a`, the last commit that touched `lib/game/buildings/` (`git log -1 -- lib/game/buildings/`).
HEAD was `5250d38` while I measured; the four commits in between are `core`, `STATUS.json` and
`flumes`, none of them this module's. Harness `medium`, WebGL2 through SwiftShader, 1280 × 720.

---

## 0. The frames in the brief were the wrong build, and I nearly graded round 1 twice

**`http://localhost:3000` serves a production build made at 08:31, against a tree whose buildings
files were last written at 13:02 today.** `pnpm start` does not rebuild, so every frame it produces
is round 1. It is a perfect trap on this module, because the tell is that there is no tell: the nine
frames look plausible, and the whole-scene metrics come back **byte-identical to round 1's table** —
163 / 392,020 · 156 / 391,124 · 153 / 381,998 · 98 / 125,346 · 91 / 124,450 · 88 / 115,324 ·
96 / 127,140 · 89 / 126,244 · 86 / 117,118. Nine matches to the digit is what made me look.

Proved rather than inferred, by asking the running page (`.game-render/_critic-b2/probe-stats.mjs`):

| `handle.module('buildings').stats()` | :3000 | :3001 | report claims |
| ------------------------------------ | ----: | ----: | ------------: |
| drawn meshes                          |    47 |    57 |            57 |
| triangles drawn                       | 82,452 | 86,314 |        86,314 |
| unique triangles                      | 70,384 | 74,458 |        74,458 |
| windows / lit                         | 366 / 200 | 363 / 200 |   363 / 200 |
| meshes whose name ends `:halo`        |     0 |    10 | 10 (the spill ring) |

`ls -la --time-style=full-iso .next/static/chunks | head` — every chunk 08:31:22; `.next/BUILD_ID`
08:32:09; `lib/game/buildings/*.ts` 11:32–13:02. **Everything below is measured against :3001.**
The :3000 set is kept as the **before** picture and is labelled as such; it is the best control this
round has, and two of the findings are proved by diffing the two.

The coordinator sent the same correction while I was re-shooting. It arrived after I had already
re-shot; nothing in this grade rests on a :3000 frame except where I say "round-1 build".

---

## 1. The six axes

| #   | Axis                       | Weight | Score | One sentence                                                                                                                                                                                                       |
| --- | -------------------------- | -----: | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | The frame                  |   30 % |   7.8 | Both see-through classes are gone and I photographed the before and the after of each; what is left is a rotunda whose drum reads as a featureless pale sheet, roofs that still dissolve after dark, and one point light for twenty-four light sites. |
| 2   | Fidelity to the real thing |   20 % |   8.0 | The 17.7 m terrace, the two-box lantern, the 180 mm downpipe and the one-faced clock tower are all genuinely fixed and measurable; a park main street with no shopfront on any ground floor is not.                |
| 3   | Extensibility              |   20 % |   8.6 | I put a two-blueprint pack through it: `wallUpper`, `sign.side` and `night.spill` all now change the geometry, the round-mass sign warns by name with an actionable message, and `mass.id` is still dead.          |
| 4   | Budget and behaviour       |   15 % |   8.5 | The corrected share is right to the digit — my own A/B gives **120 draw calls / 330,958 triangles, 10.0 %** — and the round added 10 meshes for a decal.                                                          |
| 5   | Determinism and state      |   10 % |   9.0 | `dispose()` resets the content registry now, the sim owns no save slot and derives its index from `world.entities`, save round-trip and lint green.                                                                |
| 6   | Honesty of the report      |    5 % |   7.8 | It opens by correcting two of its own claims and a share, and every correction reproduces — but "two checks with no categories in them at all" is not true of §5d, and one frame caption describes a building the frame does not show. |

**Weighted: 2.340 + 1.600 + 1.720 + 1.275 + 0.900 + 0.390 = 8.225 → 8.2**

Extensibility 8.6 clears the 5.0 floor. The verdict is robust to my frame judgement: at a frame
score of **8.5** — more than I think it deserves — the total is 8.435 and it still fails.

---

## 2. Hard gates

| Gate                                            | Result | Evidence                                                                                                              |
| ----------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| Zero console errors / hydration warnings         | **PASS** | `.game-render/critic-b2-dev/report.json`: `errors: []`, `hydration: []`, `ok: true`, 9 shots. Same in `.game-render/critic-b2-insp2/report.json`. |
| Warnings attributable to this module             | **PASS** | Two, both `WebGL: INVALID_VALUE: bufferSubData: buffer overflow`, present in runs with no building in them.            |
| Extensibility ≥ 5                                | **PASS** | 8.6, §5.                                                                                                              |
| Touched only its own folder                      | **PASS** | `git show --stat b39101a` — 10 files under `lib/game/buildings/` plus its own report and request. The core fix is a separate integrator commit, `49d8d28 lib/game/core/sim-runtime.ts`, filed as request §8. |
| No `from '@babylonjs/core'` barrel               | **PASS** | `grep -rc "from '@babylonjs/core'" lib/game/buildings/` → 0                                                            |
| No module-scope `window`/`document`/`navigator`  | **PASS** | 3 hits, all the English word "window" in prose (`bays.ts:7`, `kit.ts:998`, `types.ts:83`)                              |
| No `Math.random` / `Date.now` / enums / param props | **PASS** | 1 hit, the comment at `kit.ts:1278` saying `Date.now()` is banned                                                    |
| `pnpm test:game` green                           | **PASS** | exit 0, 126 checks, `game lint: 263 files clean`, `test:game-buildings` in the chain (`package.json:105`), soak 9/9 twice |
| `npx tsc --noEmit`                               | **PASS** | exit 0                                                                                                                |
| `npx eslint lib/game/buildings`                  | **PASS** | exit 0                                                                                                                |
| Budget met                                       | **PASS** | 120 draw calls at the worst camera against 1,200 whole-game — 10.0 %                                                   |

**No gate fails.** One thing I could not complete: `node scripts/check-game-teardown.mjs --url=…:3001`
died on `__parkfan_game.handle.dispose is missing`, which is a harness/core mismatch and not this
module's — the report predicted a teardown failure that is not its own and it is right that it is
not, though for a different reason than the one recorded.

Two things in my runs that are **not** findings against this module and should not be read as such:
`.game-render/critic-b2-insp/0900-facade.png` and `0900-kit.png` carry a banner reading
"A part of the game did not start (hud) … HUD_PANEL is not defined", and that run and two others died
with `Cannot read properties of undefined (reading 'metrics')`. Both are another agent saving into
`lib/game/ui/` under the dev server. The retry, `critic-b2-insp2`, is clean.

---

## 3. The frames I opened

### Round 2, showcase — `.game-render/critic-b2-dev/`

| File                | What is actually in it                                                                                                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `0900-overview.png` | The street from 132 m: three brick terraces under **blue-grey** mansards, the ticket hall, the clock tower, the cream pavilion with a red pantile roof, the rotunda's terracotta cone, the market hall's vault, the teal pavilion. The left 40 % of the frame is empty lawn and a soft shadow-cascade step (core's). |
| `0900-close.png`    | The clock-tower block at 44 m. **The gable end is a solid brick triangle with courses in it** — the round-1 hole is gone (crop below). Three dormers read as flat dark rectangles on the slope; the facade is in shade and reads dark maroon.     |
| `0900-ground.png`   | Eye level. Brick courses, sashes with glazing bars, sills, string courses, quoins, two wall lanterns, the pavilion closing the vista with **five dark arched heads instead of five sky-blue ones**. Half the frame is grey paving.               |
| `1830-overview.png` | Dusk from 132 m; lit windows scattered, four cupolas alight, the sky holding red.                                                                                                                                                               |
| `1830-close.png`    | **The best frame the module has.** Warm panes at three or four brightnesses, three lit dormers, the tower lantern, the rotunda's cupola at the left edge, and the clock dial legible on the tower face a street visitor sees.                    |
| `1830-ground.png`   | The street at dusk; the lanterns glow, the paving is unlit and flat.                                                                                                                                                                            |
| `2300-overview.png` | Night; the street reads as inhabited from 132 m, warm halos round the ground-floor windows, the teal sign legible. Every roof is black.                                                                                                          |
| `2300-close.png`    | Night on the clock tower: individually varied panes with glazing bars still inside them, **a warm wash on the brick around each one** where round 1 had bare black, the lit clock face, the tower lantern.                                       |
| `2300-ground.png`   | The receding street of lit windows. No light on the paving at all — the pooled lantern has not settled at the moment the harness shoots (§4).                                                                                                    |

### Round 2, the module's own inspection cameras — `.game-render/critic-b2-insp2/`, `critic-b2-insp/`

| File               | What is actually in it                                                                                                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0900-facade.png`  | A terrace house at 17 m: brick courses, mortar joints, quoins, string courses, sashes with bars. The sills and lintels read as heavy pale slabs; every opening on every storey is a residential window.                    |
| `0900-kit.png`     | The kit row. The wall, arch and roof samples now stand on a plinth on paving and read as samples; a dark teal Panorama window and a flat brown Double door still read as slabs — the module's own open item, accurately.  |
| `0900-hall.png`    | The grand pavilion: nine round-arched bays, hipped wings, pantiles, the cupola over the crossing, a pink octagonal apron with a hard edge on the lawn. No front door reads on the principal elevation.                     |
| `0900-market.png`  | The market hall: brick with round-headed windows under a slate barrel vault whose courses follow the curve. The wall is one third of the elevation and the vault two thirds.                                               |
| `0900-ticket.png`  | The ticket hall's back elevation: ashlar courses, eight small openings, a hipped slate roof, a lantern. Plain, and plain is right for a back elevation.                                                                   |
| `0900-inn.png`     | **The extensibility exhibit.** The showcase pack's inn — jettied first floor with its shadow under it, a wing swung 35°, an oculus in the gable, pantiles, two chimneys — all of it JSON.                                 |
| `0900-rot.png`     | The rotunda. **Finding 1**: the drum under the cone is a featureless pale sheet in which no render texture, no arch and no shading reads.                                                                                 |

### The before/after crops I cut myself — `.game-render/_critic-b2/`

| File                            | What is in it                                                                                                                          |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `gable-r1.png` / `gable-r2.png` | The clock tower's gable at 4×. **r1: the horizon, the grass, the rotunda's roof and the street's paving run straight through it. r2: brick.** |
| `arch-r1.png` / `arch-r2.png`   | The pavilion's five arched heads at 6×. **r1: five pale blue caps (the sky). r2: the same warm interior as the rectangle below them.**    |
| `rot-drum.png`, `rot-isolated.png`, `rot-noglass.png`, `rot-nokit.png` | The rotunda alone at noon, and with its `:glass` and then its `:kit` mesh disabled. |
| `0900-close-halo-{on,off}.png`  | The 09:00 spill A/B: **32 pixels differ in the whole image and 0 of them are in the scene.**                                            |
| `2300-ground-halo-{on,off}.png` | The 23:00 spill A/B with the light pool settled: 31,361 scene pixels lifted by more than 2 luma.                                        |
| `2300-ground-settled.png`       | 23:00 ground after 20 s, with the pooled lantern actually on. Compare `critic-b2-dev/2300-ground.png`, which is 15 luma darker.         |
| `market-vault.png`, `kitrow-a.png`, `ov-left.png` | The barrel vault at 3×, the terrace roofs from above, and the empty left half of the overview frame.  |

### Round 1's build, for the control — `.game-render/critic-b2/`

Nine frames from :3000. Used only as the **before** in the two crops above and in the lantern
measurement.

### The demo park — `.game-render/critic-b2-park2/` and a census probe

Four frames at 12:00 and 22:00. The build bar opens over the lower two thirds of every one of them
in this build, so they are not gradeable as pictures; what is in the visible strip is the avenue,
the forecourt, and the pavilion's red roof closing the axis 340 m up. I read the world instead
(`.game-render/_critic-b2/probe-census.mjs`): `{path:21, scenery:1516, shop:6, ride:4, pool:3,
building:2}` — **the two pads are built now**, `building-1551 grand-pavilion` at `[-8,0,-162]` yaw 0
and `building-1552 ticket-hall` at `[-33,0,178]` yaw π/2, with `entrance()` answering
`[-6.125, -150.6]` and `[-25.6, 176.375]`, the same two points round 1 measured. The module's share
of that park is **2 batches, 9 meshes, 23,930 triangles**, atlas 399 ms, build 81 ms.

---

## 4. Every number in the report, re-measured

| Report claim | My measurement | Verdict |
| ------------ | -------------- | ------- |
| §5c walks 64,811 triangles, 0 inverted | selftest: `64811 triangles across the catalogue, 0 inverted` | **exact** |
| §5c reproduces the critic's 1,328 on the pre-fix tree | scratch copy, `fanTriangles` ring order reverted: `✗ … 1328 of 64811, 201.3 m²` | **exact** |
| §5d: 0 m² of any mass envelope faces in | selftest: no offenders, check green | **exact** |
| §5d reproduces 109.3 / 51.8 / 72.6 m² | scratch copy, `facing` dropped from `roofs.ts:230,502`: pavilion 54.6, clock tower 25.9, market hall 45.7, watermill 19.1 = **145.2 m²**; dropped from `roofs.ts:451-453`: terrace-house **20.0 m²** | **check goes red, magnitudes not reproduced** — reverting `facing` restores the literal winding, which is correct at one end of each roof and inverted at the other, so I get one end where they report two. The check works; the quoted areas are theirs, not mine. |
| 173 / 398,426 with meshes, 53 / 67,468 without, Δ **120 / 330,958**, 10.0 % | my own A/B at 09:00 overview: 173 / 398,426 → 53 / 67,468, Δ **120 / 330,958** | **exact** |
| 57 colour meshes + 21 kit × 3 cascades = 120 | shadow probe: one `sun` generator, `numCascades 3`, render list 22, **21** of them `buildings:` | **exact** |
| 23 buildings, 21 batches, 57 meshes, 86,314 drawn, 74,458 unique, 363 windows, 200 lit | probe against :3001: identical on all seven | **exact** |
| The halo changes **0 scene pixels at 09:00**; the 32 that move are the HUD clock | my A/B: 32 pixels differ in the image, **0** outside the HUD | **exact** |
| The halo lifts **30,906** pixels at 23:00 | 31,361 scene pixels lifted by > 2 luma (37,774 by > 1, 23,865 by > 4) | **≈, within 1.5 % at one threshold** — the report does not say over what region or at what threshold, which is the only reason this is not "exact" |
| The lantern clipped brick to **254.1 over 0.673 %** of the 23:00 street and now peaks at **250.2 / 0.000 %** | round-1 build, terrace wall band: max **255.0**, 0.199 % ≥ 254, 0.628 % ≥ 250. Round-2 settled: 0.008 % ≥ 254, 0.018 % ≥ 250, and those pixels are the lantern's own glazing | **direction and magnitude confirmed, 35× less clipped area; the literal 0.000 % is crop-dependent and I measure 0.008 %** |
| Selftest 66,000 / 66,000 in ~2 s | ran it: `66000/66000 checks passed` | **exact** |
| Atlas 160 px/m at `medium`, 213 `high`, 249 `ultra` | `TILE_SIZE.medium 144` / `TILE_METRES[brick] 0.9` = 160.0; 192/0.9 = 213.3; 224/0.9 = 248.9 | **exact** |
| Sim tick 0.00 ms; soak mean 2.35 ms against 6 | `simTickMs: 0` on all nine shots; my soak 2.41 and 1.49 ms | **exact / ≈** |
| `canvas` and `copper` are named by nothing | `grep "'canvas'\|'copper'" pack.ts content/packs/*/pack.json` → 0 | **exact** |
| Two demo-park buildings = 7 draw calls, 22,830 triangles | **9 meshes, 23,930 triangles** now | stale — it is the round-1 figure, in a paragraph the report does say is kept as a historical measurement, but it is 2 meshes and 1,100 triangles out of date |

**Nothing in the report is off in a way that flatters it.** The one figure that moved against them —
the demo-park draw calls — moved up.

---

## 5. The checks, broken on purpose

The round's central claim is that its two new checks have no categories in them. I copied the module
into a scratch tree (`/tmp/.../tree`, `node_modules` symlinked, nothing committed) and reintroduced
each of the three winding bugs this module has ever had.

| Bug put back                                                             | What the suite did                                             |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `kit.ts:671` ring order → `tri(target, centre, ring[i], ring[i+1])`      | **§5c red**: `1328 of 64811, 201.3 m²`                          |
| `roofs.ts:230,502` gable `facing` argument removed                       | **§5d red**: 13 triangles, 145.2 m², named per blueprint        |
| `roofs.ts:451-453` mansard end `facing` removed                          | **§5d red**: `terrace-house: 2 triangles, 20.0 m²`              |
| `geometry.ts:418` `addPrism` facet order → `addQuad(s, p0, p1, p2, p3)`  | **§5b red** (`cone: 0 %`) **and §5d red** (rotunda, 7.6 m²)      |

All three real bugs are caught. That is the claim, and it holds.

**But §5d does have a category in it, and it is a large one.** It judges only triangles with
`|ny| ≤ 0.35` that stand within 0.1 m of a mass's own plan prism (`selftest.mjs:737,751`). Everything
that stands upright *off* that envelope — dormer cheeks and faces, chimneys, cupolas and lanterns,
arcade columns, the whole roofscape — is judged by §5d not at all, by §5b not at all (it measures
roof planes), and by §5c only in the case where the normal was written independently of the winding,
which `addTriangle`/`addQuad` never do.

Measured over the seven shipped blueprints (`probe-coverage.mjs`): of 55,942 triangles, 25,226 are
flat enough for §5d to skip outright, **18,393 upright triangles / 4,602 m² stand on an envelope and
are judged**, and **12,323 upright triangles / 2,650 m² stand off every envelope and are judged by
nothing.** That uncovered surface is **eleven times the area of the 233.6 m² that failed round 1.**

Demonstrated, not argued: I flipped the `back:` flag on the dormer face quad (`roofs.ts:598-600`) so
that **every dormer front on every building in the catalogue points into its own roof** — the exact
class of bug that failed round 1, on a surface that is lit in three of the nine frames. The suite
answered **`66000/66000 checks passed`**.

§5.6 of the report names one limitation of §5d, the coincident-envelope case. It does not name this
one, and §0's "two checks with no categories in them at all" is not true of §5d.

---

## 6. Extensibility, tested rather than read

I wrote a two-blueprint third pack (`ext.mjs`, `ext2.mjs`) exercising precisely the four fields
round 1 found dead and the sign that vanished silently.

- **It builds from JSON alone.** `critic-b2:critic-tower` — a twelve-sided drum, four storeys, cone
  roof, rubble plinth — resolves `source: 'pack'` and builds 4,878 triangles, 48 windows, 26 lit,
  with no code change. `registry.unclaimedPackKeys()` returns only `neon-lagoon:cameraPresets`.
- **`style.wallUpper` + `palette.wallUpper` are read.** Same blueprint with and without them:
  41,064 vs 40,168 colour components and 20,532 vs 20,084 uvs — a different atlas surface on the
  upper storey. Dead in round 1.
- **`sign.side` is honoured.** `side: 'front'` puts the sign band's centroid at `[0, 2.75, 5.31]`;
  `side: 'right'` at `[7.31, 2.75, 0]`. Dead in round 1.
- **`night.spill` is read.** `spill: 0` → 0 light sites on a building that has one; `spill: 2` → 1.
- **The silent sign drop now speaks, and speaks usefully**: *"blueprint "critic-tower" declares a
  sign band, and its first mass is round — a sign hangs on a flat elevation, so nothing was drawn.
  Put a box mass first, or drop the "sign" block."* Once per process, resettable.
- **Validation is per entry and names the pack, the key and the reason.** My first pack had two
  genuine mistakes (`'#c33'`, `kerb: 0.15`) and got two lines naming both, then a fallback block
  rather than a hole.

Two deductions stand.

1. **`mass.id` is still declared, typed (`manifest.ts:113`, `types.ts:144`) and read nowhere** — `grep` over
   `build.ts` returns every other `mass.*` and not that one. §0 row 9 says "Four dead manifest
   fields … fixed" and fixes three.
2. **A new hard-coded rule where the manifest has a field.** How many clock dials a mass gets is now
   `Math.max(hx,hz)/Math.min(hx,hz) < 1.6` (`build.ts:359`). It is a good default and it fixed a real
   finding, but `mass.clock` is still only a diameter, so a pack that wants one dial on a square
   tower, or four on an oblong one, cannot say so.

---

## 7. Findings, ranked

### 1. The rotunda's drum is a featureless pale sheet, and the report's own frame caption says otherwise

`.game-render/critic-b2-insp2/0900-rot.png`, crop `.game-render/_critic-b2/rot-drum.png`, and the
isolated `rot-isolated.png` (every other building disabled, noon). Measured off `rot-isolated.png`:

| sample                    | mean luma | p95 |
| ------------------------- | --------: | --: |
| the drum below the cone   |     137.3 | 220.0 |
| the sunlit cone above it  |      61.8 | 104.4 |
| the sunlit paving beside it |   144.4 | 155.5 |
| sunlit grass              |      82.9 | 100.6 |

The drum's 95th percentile is **65 luma above the sunlit paving's**, on a `render` surface whose
measured tone spread is 3.3 % (the selftest's own number), one 5.4 m storey with `bay: 6.5` on a 16 m
octagon — so one small arched window in a 33 m² facet. What the eye gets is a white polygon with a
red hat and two dark holes in it; the arch soffits and the impost blocks float in it as ghost lines.
Two things I checked before saying so: it is not the glass (disabling the rotunda's `:glass` mesh
changes **0 scene pixels**, `rot-noglass.png`) and it is not see-through (a 1,083-ray scan through
the plan finds 2 rays that miss the far side, 0.2 %).

The report's §3 frame table describes `.game-render/buildings-detail5/1200-rot.png` as "an octagonal
drum with an arch on every facet, a conical terracotta roof, a glazed lantern with a finial". I
opened that file. The cone and the lantern are there; the drum is the same white blob. **Fixed looks
like** either giving the drum a real order — a plinth course, a pilaster per angle, a cornice with a
shadow line — or turning `facades: { all: 'a' }` into an arcade with a floor and a dark interior, and
then re-photographing from `rot` before writing the caption.

### 2. §5d cannot see 2,650 m² of upright surface, and the report says it has no categories in it

§5 above, with the dormer demonstration: every dormer front in the catalogue turned inward, and
`66000/66000` still passes. 12,323 triangles / 2,650 m² of the seven blueprints stand off every mass
envelope. **Fixed looks like** the same "does it face nothing" test applied to *every* upright
triangle regardless of where it stands, with the sub-solids (dormer boxes, chimney stacks, lantern
drums, arcade columns) contributed by the code that builds them rather than derived from
`blueprint.masses` — and, either way, §0 losing the words "no categories in them at all".

### 3. At `medium` the whole module has one point light, and the harness never photographs it

`LIGHT_POOL.medium = 1` (`main.ts:73`) against 24 light sites. Worse for the grade: the pool re-picks
on a 0.45 s clock driven by `onRender(dtSeconds)`, and under SwiftShader it takes about ten seconds
of wall time to converge. Read straight off the running page at 23:00 `ground`:

| after | `activeLights` | the light it picked |
| ----- | -------------: | ------------------- |
| 1.2 s (the harness's `settleMs`) | 0 | — |
| 4 s   | 1 | intensity 40, range 16, at y = 20.7 — a cupola 100 m away |
| 10 s  | 1 | intensity 7, range 10, at (−10.1, 4.33, 57.08) — the wall lantern |
| 20 s  | 1 | unchanged |

The difference this makes to the picture is not small: the near-wall band of
`critic-b2-dev/2300-ground.png` has a mean luma of **39.3**, and of `_critic-b2/2300-ground-settled.png`
**54.4** — the standard night frame is 28 % darker than what a player sees. The report says this
about itself, and it is why round 1's lantern fix was recorded twice before it worked. It is still
the case that **every night frame in this gauntlet under-reports this module.** **Fixed looks like**
`--wait` raised for night shots in the harness (integrator), and a `game-shot` invocation in the
report that names it.

### 4. The night roofscape is still black, and it is the largest surface in every overview

Round 1's finding 4 was fixed for daylight and only for daylight: `#454b54 → #6f7783` lifted the
sunlit slate, and my 09:00 frames show slate with courses in it. After dark the mansards, the barrel
vault and the pyramid roofs are indistinguishable from the ground in `2300-overview.png`, so the
street's silhouette dissolves exactly where the composition needs it. **Fixed looks like** a small
sky-tinted ambient term on the roof material at night — the same trick the spill decal proves the
module is willing to do — checked at 23:00 rather than at noon.

### 5. A park's main street with no shopfront on it

`pack.ts` `terrace-house` is `facades: { all: 'w*', front: 'w d w / w w w' }`: three storeys of
domestic sash windows, ground floor included, and it is the unit the showcase repeats three times and
the demo park will repeat more. The pattern language already has `g` for a glazed shopfront and
nothing uses it. The module lists this itself as weakness #10 and did not write it; it is the single
cheapest thing left that changes what the street *is*. **Fixed looks like** one more blueprint in
`pack.ts`, no code.

### 6. The showcase does not frame itself at `overview`, and half the kit row hides behind the HUD

`.game-render/_critic-b2/ov-left.png`: the left 40 % of `0900-overview.png` is empty lawn, the HUD
panel takes the right 25 %, and the kit row — the module's own open item #9 — sits under the panel.
The module has eight further camera presets and they are good ones; the three the gauntlet actually
uses are the three that show this least well. **Fixed looks like** moving the kit row and the inn onto
the west side of the street, where `overview` is currently photographing grass.

### 7. Two kit samples still read as slabs

`0900-kit.png`: the wall, arch and roof samples now stand on a plinth on paving and read as a
merchant's yard; the Panorama window is a dark teal box and the Double door a flat brown leaf on a
white frame. The module says so (weakness #9). It is half an hour of `showcase.ts` and it is the last
place in the set that reads as programmer art.

### 8. The aprons are hard-edged paving mats

Every isolated building sits on a rectangle or polygon of paving that meets the lawn on a straight
line with a 0.15 m kerb and nothing else — `0900-inn.png`, `0900-hall.png`, `kitrow-a.png`. At
overview they read as coloured shadows under the buildings. It is content (`ground.apron`), and a
verge, a gravel margin or a scatter of the `paths` module's own edge would break the line.

### 9. `mass.id` is dead and the clock count is hard-coded

§6. Cosmetic on its own; it matters because §0 records the field group as fixed.

### 10. The report's two pixel claims do not say what they measured

"30,906 lifted" and "0.000 % at 254" are both region-and-threshold dependent, and neither names the
region or the threshold. I get 31,361 and 0.008 %. **Fixed looks like** one clause per claim.

---

## 8. What is genuinely good, and must not be lost

- **The two round-1 blockers are actually closed, and I have the before and after in one pose.**
  `gable-r1.png` → `gable-r2.png` and `arch-r1.png` → `arch-r2.png`. That is what a fixed round looks
  like.
- **The checks are real checks.** Every one of the three winding bugs this module has ever shipped
  goes red when put back, and §5c reproduces the critic's 1,328 to the digit on the pre-fix tree.
  Finding 2 is a criticism of the claim's *scope*, not of the work.
- **The budget correction is exact.** 173/398,426 → 53/67,468 → 120 draw calls / 330,958 triangles,
  reproduced independently, with the 57 + 21 × 3 arithmetic confirmed off the shadow generator's own
  render list. A module that corrects its own headline number downward-in-its-own-favour-never is the
  point of the honesty axis.
- **The night facade works now.** 31,361 pixels lifted at 23:00 and exactly 0 at 09:00, with the
  courses still legible inside the lamp pool. `2300-close.png` and `1830-close.png` are the two frames
  that sell the module.
- **The extensibility is real and I broke a second pack against it.** Three dead fields alive,
  per-entry validation that names the pack and the key, and a warning for the round-mass sign that
  tells the author what to do instead.
- **The pad measurement survived a round.** `entrance()` still answers `[-6.125, -150.6]` and
  `[-25.6, 176.375]`, the two entities are in the world factory now, and the pad fit is in the
  selftest so a blueprint edit cannot break it quietly.
- **The lantern, the downpipe and the clock.** A bracket-cage-cap carriage lantern, an 80 mm pipe
  with hopper, clips and shoe, and a dial on every elevation of a square tower.

---

## 9. Verdict

**FAIL at 8.2**, short of 8.5 by 0.28. No hard gate fails and the round did the work it was set: the
frame axis moves 6.5 → 7.8 on repairs I photographed before and after, the budget claim is now exact,
the dead manifest fields are alive and the content registry resets on dispose. It does not pass
because the frame still has one building in seven that does not read at all, a night roofscape that
dissolves, and one real light for a street of twenty-three; because a main street with no shopfront
is a fidelity gap the module has named twice and not closed; and because the round's proudest claim —
checks with no categories in them — is true of one of the two checks and demonstrably false of the
other.

**Round 3 should start by making §5d judge every upright triangle rather than only those standing on
a mass's plan envelope** — the dormer demonstration in §5 takes ten minutes to reproduce, it is the
same class of bug that failed round 1, and until that check has no hole in it nothing else about this
module's geometry can be trusted to stay fixed.
