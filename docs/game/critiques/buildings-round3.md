# buildings — critic round 3

**Score: 8.3 · Verdict: FAIL** (pass is ≥ 8.5). Every hard gate passes. It misses by **0.20**.

Graded at **`123f3e5`**, the last commit that touched `lib/game/buildings/`
(`git log -1 --format=%H -- lib/game/buildings/`). HEAD was **`2d1a7db`** while I measured; the two
commits in between are `3736688` (D-023, `lib/game/core/sun.ts`) and `2d1a7db` (D-006,
`core/types.ts` + `guests/manifest.ts` + three scripts), neither of them this module's.

Every figure below came from the **dev server, `http://localhost:3001`**, unless the line says
otherwise. Harness `medium`, WebGL2 through SwiftShader, 1280 × 720. `:3100` is a build from before
this round and is used nowhere in this grade; `:3000` is dead.

---

## 0. The two integrator changes, and why they cost this grade nothing

D-023 moved the park clock 92 minutes ahead of solar time, so the gauntlet's `09:00` is now the old
07:28 and its `18:30` is a bright afternoon. Rather than argue about it I re-shot the module at the
**solar-equivalent** clock (`10:32` and `20:02`) into `.game-render/critic-b3-solar/`, and the result
is worth recording because it validates both sides at once:

`.game-render/buildings-r3-final/0900-overview.png` (the module's own frame, taken before D-023)
against `.game-render/critic-b3-solar/1032-overview.png` (mine, today) differ in **941 pixels, all of
them inside the HUD clock at x[72,156] y[26,82]** — the rendered scene is byte-identical
(`.game-render/_critic-b3/diff.mjs`). D-023 is a pure relabel of the clock, the module's evidence
frames are current, and every daylight number in its report can be checked against today's tree at a
shifted clock. I did exactly that.

D-006 shows up only as ~1,002 triangles of other modules' geometry in the whole-scene totals; the
module's own A/B delta is unaffected (§4).

One consequence the integrator should know: after D-023 the standard three-time gauntlet gives this
module **two daylight frames and one night frame and no dusk frame at all**
(`.game-render/critic-b3/1830-ground.png` is broad afternoon with the shopfronts unlit). Dusk is the
light this module is best in — `.game-render/critic-b3-solar/2002-ground.png` is the frame that sells
it. That is a harness problem, not a module one, and it is not in the score.

---

## 1. The six axes

| #   | Axis                       | Weight | Score | One sentence                                                                                                                                                                                                                              |
| --- | -------------------------- | -----: | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | The frame                  |   30 % |   8.4 | The rotunda, the night roofscape and the unsettled night pool are all genuinely closed and I reproduced every A/B behind them to the digit; dormers are still flat dark quads at 44 m, three fifths of `overview` is lawn, two kit pieces are boxes, and every apron is a hard-edged mat. |
| 2   | Fidelity to the real thing |   20 % |   8.4 | `shop-terrace` closes round 2's largest fidelity gap with content and no code, and the drum now carries voussoirs, keystone, plinth and cornice; the principal elevation of the grand pavilion still has no door that reads, and a dormer has no cheek, bargeboard or sill. |
| 3   | Extensibility              |   20 % |   7.4 | A pack blueprint still builds from JSON alone and `sign.side` is live — but **both** fields §0 row 9 records as this round's extensibility fix, `sign.mass` and `mass.clockFaces`, are stripped by `manifest.ts`'s own zod schemas and do nothing from a pack (§6). |
| 4   | Budget and behaviour       |   15 % |   8.8 | My own A/B gives **128 draw calls / 375,388 triangles, 10.67 %** — the reported figure to the digit — with `stats()` matching on seven of seven fields, sim tick 0.00 on all nine shots and a clean three-cycle teardown.                  |
| 5   | Determinism and state      |   10 % |   9.0 | Selftest byte-stable over three runs, `test:game` green through a 6-hour soak and a save round-trip, no `Math.random`/`Date.now`, no leak; the one surprise is a render-state one and does not touch the world (§8).                       |
| 6   | Honesty of the report      |    5 % |   7.0 | Every pixel claim I re-measured reproduced exactly and the two volunteered self-corrections are real — but a fix that does not work is recorded as fixed, the flagship residue number is 8 % off its own test's output, and "judges every upright triangle" is again more than the check can conclude. |

**Weighted: 2.520 + 1.680 + 1.480 + 1.320 + 0.900 + 0.350 = 8.250 → 8.3**

Extensibility 7.4 clears the 5.0 floor. The verdict is robust to my judgement: at a frame score of
**8.8** and an extensibility of **8.0** — both more generous than I think defensible — the total is
**8.49** and it still fails.

---

## 2. Hard gates

| Gate                                               | Result   | Evidence                                                                                                                                     |
| -------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Zero console errors / hydration warnings            | **PASS** | `.game-render/critic-b3/report.json` → `console.errors: []`, `console.hydration: []`, `ok: true`, 9 shots. Same in `critic-b3-insp`, `critic-b3-solar`, `critic-b3-settled`. |
| Warnings attributable to this module                | **PASS** | Two, both `WebGL: INVALID_VALUE: bufferSubData: buffer overflow`, present in runs with no building in them.                                    |
| Extensibility ≥ 5                                   | **PASS** | 7.4, §6.                                                                                                                                     |
| Touched only its own folder                         | **PASS** | `git show --stat 123f3e5` → `lib/game/buildings/main.ts`, `lib/game/buildings/showcase.ts`, plus its own report and request. See the note below. |
| No `from '@babylonjs/core'` barrel                  | **PASS** | `grep -rc "from '@babylonjs/core'" lib/game/buildings/` → 0                                                                                    |
| No module-scope `window` / `document` / `navigator` | **PASS** | 3 hits, all the English word "window" in prose (`bays.ts:7`, `kit.ts:998`, `types.ts:83`)                                                       |
| No `Math.random` / `Date.now`                       | **PASS** | 1 hit, the comment at `kit.ts:1284` saying `Date.now()` is banned                                                                              |
| `pnpm test:game` green                              | **PASS** | exit 0; `game lint: 263 files clean`; `66020/66020 checks passed`; soak 10,800 ticks, mean 0.84 ms against 6, save round-trips after the run    |
| `npx tsc --noEmit`                                  | **PASS** | exit 0                                                                                                                                       |
| `npx eslint lib/game/buildings`                     | **PASS** | exit 0                                                                                                                                       |
| Budget met                                          | **PASS** | 128 draw calls at the worst camera against 1,200 whole-game — 10.67 %                                                                          |
| No leak across three dispose/reboot cycles          | **PASS** | `node scripts/check-game-teardown.mjs --url=…:3001` → all five checks green, live engine contexts 1/0/1/0/1/0/1, no console errors. (Round 3's report predicted a core boot error here; it is gone.) |

**No gate fails.** One note that is not a failure: the round's largest change — the `Solid`
mechanism plumbed through `geometry.ts`, `build.ts`, `kit.ts`, `roofs.ts`, `pack.ts`, `types.ts` and
`selftest.mjs` — did not land in `123f3e5` at all. It landed in **`e4c27f9`**, an integrator rescue
commit that carries `lib/game/flumes/**` in the same diff. The buildings half of it is confined to
`lib/game/buildings/`, so the gate holds; the commit hygiene is the integrator's, and it is worth
saying out loud because "the round's commit" and "the round's code" are two different commits here.

---

## 3. The frames I opened

Every file below was opened with the Read tool and looked at.

### The gauntlet, dev server — `.game-render/critic-b3/`

| File                | What is actually in it                                                                                                                                                                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `0900-overview.png` | Dawn under D-023 (07:28 solar). The whole street is in raking shadow: brick terraces under blue-grey mansards down both sides, the clock tower, the ticket hall, the rotunda's terracotta cone, the market hall's vault, the teal guest-services pavilion, the grand pavilion closing the vista. Left third and bottom-left are lawn. |
| `0900-ground.png`   | Eye level at dawn. Two shopfronts on the near-left terrace — dark green fascia over an amber glazed window on a stallriser. Brick courses, sashes with bars, sills, string courses, quoins. The lower half of the frame is the paths module's paving.                                                       |
| `1830-ground.png`   | Now broad afternoon (D-023). The shopfronts read as green fascia over **dark** glass; the module's best light is no longer in the gauntlet's three times.                                                                                                                                                   |
| `2300-overview.png` | Night. **The roofs read**: mansards, hipped roofs and the barrel vault sit as blue-grey slate against dark grass. The street reads as inhabited. The bright band at the lower right is a **shopfront**, not a lamp pool — checked at 4×, below.                                                            |
| `2300-close.png`    | Night on the clock tower: individually varied panes with glazing bars still in them, a warm wash on the brick round each, three lit dormers on the slope, the lit clock dial, the tower lantern, the rotunda's drum lit at the left edge with two arches reading.                                          |
| `2300-ground.png`   | The receding street of lit windows, the shopfront glowing on the left and the pavement in front of it lit — in the standard frame, at the harness's own wait. Two thirds of the frame is unlit paving.                                                                                                    |

### Solar-equivalent re-shoot — `.game-render/critic-b3-solar/`

| File                | What is actually in it                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `1032-overview.png` | The module's `0900-overview` light, scene byte-identical to `buildings-r3-final/0900-overview.png`. Three fifths of the judged frame is lawn (§5, finding 6).                 |
| `1032-ground.png`   | The street at the old 09:00. Brick reads red with courses, the two shopfronts read, the sky is clean. The lower-left half is paving.                                          |
| `2002-ground.png`   | Dusk-equivalent. **The two shopfronts are lit sheets of amber at eye level** — the one frame in the set that reads as a place that trades. The module's best frame.           |

### Inspection cameras at noon — `.game-render/critic-b3-insp/`

| File               | What is actually in it                                                                                                                                                                                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `1200-rot.png`     | The rotunda. **The drum is fixed.** Crop at 3× (`.game-render/_critic-b3/rot-drum-3x.png`): three facets, one round-arched opening each, a pale voussoir surround with a wider stone at the crown, a grid of glazing bars behind amber glass, a plinth course under them and a dark eaves band over them, then the cone and the glazed lantern with its finial. Each facet at its own angle to the sun. |
| `1200-facade.png`  | Two metres from a terrace flank in shade. Brick courses, mortar joints, sills, two string courses, glazing bars — all there, all soft. `.game-render/buildings-r3-kit/1200-facade.png` is the same wall at solar noon and is brighter and no sharper.                                |
| `1200-inn.png`     | The extensibility exhibit. Jettied first floor with its shadow under it, a wing swung 35° off the block, pantiles, three chimneys, two dormers — all JSON. The apron is a hard-edged grey rectangle on the lawn.                                                                    |
| `1200-hall.png`    | The grand pavilion: a long cream ashlar elevation of round-arched bays with dark warm interiors, hipped wings, red pantiles, a cupola with a glazed lantern. **No front door reads on the principal elevation** — round 2's observation, unaddressed. Pink octagonal apron, hard edge. |
| `1200-market.png`  | The market hall's back: brick with round-headed windows under a slate barrel vault whose courses follow the curve. Vault two thirds, wall one third.                                                                                                                                |
| `1200-kit.png`     | The west aisle. Four or five kit pieces standing on a clay-paver aisle with a grass verge — the paving is real and it is an improvement. The lower right ~40 % of the frame is still the promenade.                                                                                |
| `1200-kit-east.png`| The east aisle, and it is **still a picture of the promenade**: the 10 m walk runs up the middle, the pieces sit at both edges, three of them clipped by the HUD panel. The Panorama window is a dark teal box and the Double door a flat brown leaf on a white frame, exactly as the module says. Byte-identical to the module's own `buildings-r3-kit/1200-kit-east.png`. |

### The module's own evidence, re-opened and re-measured

`buildings-r3-final/0900-close.png` (the clock tower at 44 m: solid brick gable, **three dormers that
are flat dark quads**, the rotunda's drum reading at the left edge), `_r3-crops/drum-before-3x.png`
(not a blank wall — the drum's own floor slab, the far side's arches as ghost lines, and the paving
beyond, exactly as the report says), `_r3-crops/drum-after-3x.png` (plinth, arch, voussoirs, glazing
bars, cornice — and identical to my own re-shoot), `buildings-r3-kit/1200-kit-east.png`,
`buildings-r3-kit/1200-facade.png`, `critic-b2-dev/0900-overview.png` (round 2's framing, for the
lawn comparison).

### My own crops and A/Bs — `.game-render/_critic-b3/`

`rot-drum-3x.png`, `night-brightband-4x.png` (the "lamp pool" at 4×: it is a long horizontal glazed
shopfront with brick and sashes above it — the report's self-correction is right),
`2300-ground-pool2-on.png` / `-off.png`, `sky-ov-on.png` / `sky-ov-off.png` (with the sky term off,
**every roof in the overview is black** and the street's silhouette dissolves — round 2's finding 4
reproduced on this build), `critic-b3-settled/2300-ground.png`.

---

## 4. Every number in the report, re-measured

| Report claim | My measurement | Verdict |
| ------------ | -------------- | ------- |
| Widened §5d catches the round-2 critic's dormer demonstration: `✗ … 32 triangles, 16.2 m²`, `terrace-house` 16 / 8.1, `shop-terrace` 16 / 8.1 | scratch copy, `roofs.ts` dormer face `back:` flag flipped: **`✗ nothing standing on a solid faces into it — 32 triangles, 16.2 m²`**, same two blueprints, same areas | **exact** — and incomplete, §5 finding 1 |
| Round 2's `roundFrames` ring order put back: `✗ rotunda: 475 triangles, 117.2 m²` | scratch copy, `build.ts:560-561` reverted to increasing angle: **`✗ … 475 triangles, 117.2 m²`, `parkfan-architecture:rotunda`** | **exact** |
| Drum band (x490–800, y388–452) mean 130.6 → 88.7, p95 220.2 → 186.3, p5 65.4 → 19.8 | `r3-drum-{before,after}/1200-rot.png`: **130.6 → 88.7, 220.2 → 186.3, 65.4 → 19.8** | **exact** |
| The sunlit paving beside it (x845–935, y330–360) is 143.2 / 149.9 in both, byte for byte | **143.2 / 149.9 in both**, and the crop is byte-identical (`Buffer.equals` on 8,100 bytes → true). The whole-frame diff is **31,599 px, bbox x[151,797] y[54,493]** — the rotunda and 28 px of HUD clock; nothing else in the frame moved | **exact, and it is a real control** |
| Gradient energy on that band goes the wrong way, 11.65 → 9.43 | central-difference over the same crop: **5.81 → 4.74**, i.e. their figures at exactly 2× (no /2 in the operator) | **exact under their convention; the direction and the −19 % are right** |
| The 23:00 bright band is a shopfront, not a lamp pool | `_critic-b3/night-brightband-4x.png` — a glazed shopfront under brick and sashes | **exact** |
| Settle control: `--wait=1200` vs `--wait=20000` differ in 32 px, 0 in the scene; near-wall band 69.7 / 80.4 / 12.6 in both | my own pair (`critic-b3/2300-ground.png` vs `critic-b3-settled/2300-ground.png`): **32 px, bbox x[151,156] y[54,59]**, all HUD clock; band **69.7 / 80.4 / 12.6 in both** | **exact** |
| The two pooled lights lift the near paving band (x340–975, y560–630) 31.5 → 35.3 and the mid-street band (x430–760, y420–500) 36.9 → 38.5; everything else moves 0.4–0.6 luma | my A/B: **31.5 → 35.3** and **36.9 → 38.5**; the west shopfront's own pavement **38.0 → 38.6** | **exact** |
| The pool picks `buildings-spill-0` at (11.0, 4.29, 74.0) i=9 r=9 and `buildings-spill-1` at (11.1, 4.53, 65.1) i=7 r=10 at 23:00 `ground` | probe after a 15 s settle: **(11.00, 4.29, 74.00) i=9 r=9** and **(11.10, 4.53, 65.08) i=7 r=10** | **exact** |
| Sky term at 23:00 `overview`: mansard 26.4 → 35.9 (p5 15.1 → 29.9), brick 49.6 → 58.4 (p5 11.8 → 20.1), lawn 19.8 both ways | my A/B on the same three crops: **26.4 → 35.9 / 15.1 → 29.9**, **49.6 → 58.4 / 11.8 → 20.1**, **lawn 19.8 both ways to the decimal** | **exact — and it contradicts the sentence above it, §5 finding 4** |
| `overview` is 60.8 % lawn, down from 71.8 % | on the mask that reproduces their "after" (x < 980, y > 120, toast excluded): **61.5 %** against round 2's **71.9 %** | **reproduced, −10.4 pts.** Whole-frame it is 48.8 % → 47.9 %, which is the same street with a tighter camera |
| 128 draw calls / 375,388 triangles, 10.7 % of 1,200 | my own A/B at 09:00 `overview`: **179 / 443,536 → 51 / 68,148, Δ 128 / 375,388**, 10.67 % | **exact** (their whole-scene totals are 1,002 triangles lower — that is D-006, not them) |
| 57 calls at 23:00 `ground` | my A/B: **100 → 43 = 57** | **exact** |
| 25 buildings, 22 batches, 62 drawn meshes, 98,092 drawn, 80,360 unique, 441 windows, 254 lit, 25 light sites, 2 active at 23:00 | `stats()` against :3001: identical on all nine | **exact** |
| 62 colour meshes + 22 kit × 3 cascades = 128 | shadow probe: one `sun` generator, `numCascades 3`, render list 23, **22** of them `buildings:` | **exact** |
| Atlas 386 ms, build 148 ms | my run: **404.3 ms / 178.1 ms** | **≈, run variance** — quoted as facts without a range |
| Sim tick 0.00 ms on all nine shots; soak mean 1.22 ms against 6 | `simTickMs: 0` on all nine; `pnpm test:game` soak **0.84 ms mean, max 31.78** | **exact / ≈** |
| §5d residue: **248 triangles over 132.4 m²**, 1.6 % (§3, §5.9, and `selftest.mjs:905`) | the shipped selftest prints **250 triangles over 143.2 m²**, deterministically, three runs out of three | **wrong in its own test's output**, §5 finding 5 |
| The sim's door is within 6 m, 0.00 m on three of eight and **5.41 m at worst on the rotunda** (§3, §4.11) | selftest output: rotunda **0.61 m**, worst overall **1.88 m** (grand pavilion), 0.00 m on three | **stale — and stale against itself**, §5 finding 5 |
| `LIGHT_POOL.medium` is 2 | `main.ts:84` → `{ low: 0, medium: 2, high: 3, ultra: 4 }` | **exact** |
| The sky light is scoped to this module's meshes | probe: `buildings-sky`, `HemisphericLight`, `includedOnlyMeshes.length = 62` = `drawnMeshes` | **exact** |
| Nineteen distinct types across 22 batches | the batch list has **twenty** distinct `blueprint` values | trivial, but wrong |

**Nothing in the pixel measurements is off in a way that flatters the module.** Everything that is
off is a claim about code or about the module's own test output.

---

## 5. Findings, ranked

### 1. A different sabotage turns 352.7 m² of the catalogue inside out and the suite answers `66020/66020`

This is the one the round asked for and the one it does not survive. I reversed the **front face of
`addBand`** (`geometry.ts:884`) — one quad's vertex order, the single most ordinary slip in this
file's history — which inverts every cornice, string course, sill band, sign fascia, shopfront
transom and stall riser in the module. Measured over exactly the catalogue §5d walks: **4,014
triangles / 352.7 m², every one of them upright (`|ny| ≤ 0.35`) and therefore inside §5d's own
scope.** That is **1.5× the 233.6 m² that failed round 1**, and `materials.ts:74` sets
`kit.backFaceCulling = true`, so on screen every one of those faces is a hole.

The suite says:

```
winding
    70387 triangles across the catalogue, 0 inverted
outward faces
    38237 upright triangles stand on a recorded solid (8897 m²), 250 stand on none (143.2 m²)
66020/66020 checks passed
```

Not one number moves. The residue is unchanged, so the coverage counter the round is proudest of
does not notice either.

**The mechanism is `selftest.mjs:855`.** §5d decides a triangle "looks out" by stepping **0.25 m**
along its normal and asking whether that point is outside the solid. Every band in this module is
0.09–0.12 m deep (`build.ts:321`, `build.ts:324`, `kit.ts:1005-1008`), so the probe goes straight
through the band and out the back, lands outside, and reads clean. Proved rather than argued: with
the same sabotage in place and the step reduced to 0.05 m the check names it — **clock-tower 57 /
29.4 m², market-hall 44 / 86.1 m², terrace-house 16 / 10.6 m², shop-terrace 16 / 10.6 m²,
watermill 49 / 12.6 m², wall-oculus 12 / 1.1 m²** — while at the shipped 0.25 m it names nothing.
(0.05 m is not the fix; on the clean tree it produces 2,178 false positives. The point is that the
step, not the coverage, is what decides this class.)

§0 row 1 says the check "judges **every** upright triangle in the build". It *looks at* every upright
triangle; what it can *conclude* about one standing on any solid thinner than 0.25 m is nothing at
all. That is round 2's sentence in a new place, and the round-2 critique's own words apply
unchanged: a check with a category in it is a check with a hole, and the hole is where the bug lives.

**Fixed looks like** a probe depth taken from the solid being stepped into rather than a constant —
`min(0.25, half the solid's own thickness along n)` — plus a printed count of triangles whose solid
is thinner than the probe, so the next thin-solid blind spot is a number rather than a surprise.

### 2. The reproduced dormer demonstration catches half of what it inverts

The round's headline proof reproduces exactly (§4), and it is incomplete. My instrumented run shows
the catalogue's dormer faces are **clock-tower 6, terrace-house 4, shop-terrace 4, watermill 2**. The
sabotage inverts all sixteen. §5d names **terrace-house and shop-terrace only**. Disabling
`facingNothing` (`selftest.mjs:770-802`) and subtracting the clean-tree baseline shows what is being
forgiven: **clock-tower 40 − 8 = 32 triangles / ~12.1 m², watermill 32 − 28 = 4 triangles / ~4.0 m²**.

The cause is the other exemption: `facingNothing` forgives an inward face whenever anything within
**1.6 m** in front of it faces back, and a dormer front turned into a 46° gable slope has that roof
plane about 1.1 m behind it. The code comment at `selftest.mjs:774-777` says this case was fixed —
but it was fixed only in the *covering* branch (tightened to 0.25 m); the *facing-back* branch is
still 1.6 m, which is what the same comment says "silently exempted every dormer in the catalogue".

Neither exemption is named as a limitation anywhere. §5.9 names the residue and the coincident-envelope
case, and those are the two that are honest.

### 3. `sign.mass` and `mass.clockFaces` — the round's extensibility fix — cannot be set from a pack

§0 row 9 records round-2 finding 9 (`mass.id` dead, the clock count hard-coded) as **fixed**:
"`sign.mass` names the mass a sign hangs on; `mass.clockFaces` overrides the 1.6 : 1 ratio". Both are
typed (`types.ts:184`, `types.ts:269`), both are read (`build.ts:348`, `build.ts:387`,
`build.ts:395`), both have docstrings explaining that they exist because the critic found the field
dead — and **neither is in the schema a pack's JSON has to pass through**. `massSchema`
(`manifest.ts:112-147`) has no `clockFaces`; the `sign` object in `blueprintSchema`
(`manifest.ts:169-176`) has no `mass`. `readPack` uses `parsed.data` (`manifest.ts:199`), and zod
strips unknown keys.

Measured, not read. I registered a two-mass pack blueprint through `Registry.registerPack` +
`attachBuildingContent` and built it five ways:

| pack declares                | `masses[1].clockFaces` after parse | `bp.sign` after parse           | kit triangles | sign centroid          |
| ---------------------------- | ---------------------------------- | ------------------------------- | ------------: | ---------------------- |
| nothing (baseline)           | `undefined`                        | `{"band":0.8}`                  |         8,190 | `[0, 3.7, 5.31]`       |
| `mass.clockFaces: 1`         | `undefined`                        | `{"band":0.8}`                  |         8,190 | `[0, 3.7, 5.31]`       |
| `mass.clockFaces: 4`         | `undefined`                        | `{"band":0.8}`                  |         8,190 | `[0, 3.7, 5.31]`       |
| `sign.mass: "tower"`         | `undefined`                        | `{"band":0.8}`                  |         8,190 | `[0, 3.7, 5.31]`       |
| `sign.mass: "block"`         | `undefined`                        | `{"band":0.8}`                  |         8,190 | `[0, 3.7, 5.31]`       |
| **control** `sign.side: "right"` | `undefined`                    | `{"band":0.8,"side":"right"}`   |         8,178 | **`[7.31, 3.7, 0]`**   |

The control moves the sign to the same coordinates round 2's critic measured, so the harness detects
a live field. The two new ones are byte-identical to the baseline in every case. Nothing in the
shipped pack sets either (`grep -rn "clockFaces\|sign\.mass" lib/game/buildings/pack.ts` → 0), so no
frame in this gauntlet is wrong — but the manifest says the fields work and they do not, which is
worse than not offering them, in the module's own words at `build.ts:351`.

This is round 1's finding — four dead manifest fields — re-committed in the round that closed the
last of them, and recorded as fixed in the summary table a reader checks first.

**Fixed looks like** two schema lines, plus a selftest case that builds a pack blueprint with each
field and asserts the geometry changes. The existing "watermill" fixture already proves that shape
of test is cheap.

### 4. The sky term is claimed directional and its own A/B says it is barely directional

§4.14: "The fix has to be **directional** … so an up-facing slate takes it and a vertical brick wall
barely does". The A/B printed two lines below it, which I reproduced exactly: the mansard slope goes
**26.4 → 35.9 (+9.5)** and the brick wall **49.6 → 58.4 (+8.8)**. The wall takes 93 % of what the
roof takes. On the fifth percentile the separation is better (roof +14.8, wall +8.3, a factor of 1.8)
but it is still not "barely".

The frame is genuinely better for it — `_critic-b3/sky-ov-off.png` has every roof black and the
street's silhouette gone, `critic-b3/2300-overview.png` has slate — so this is a claim finding, not a
fix finding. But §4.14 rejected its own first attempt for exactly the reason its shipped attempt also
exhibits ("it lifted the roof *and* the wall together"), and the numbers to notice that are on the
page.

### 5. Two figures in the report disagree with the module's own test output

- **The residue.** §3, §5.9 and `selftest.mjs:905` all say **248 triangles over 132.4 m²**. The
  shipped selftest prints **250 triangles over 143.2 m²** — three runs out of three, deterministic.
  It is the round's flagship "counted, printed and asserted" number and it is 8 % off in the file
  that prints it. (The 2 % assertion is `looseArea < judgedArea * 0.02` = 177.9 m², so the pass is
  real; the quoted number is not.)
- **The sim's worst door.** §3 and §4.11 both say **5.41 m on the rotunda**, with a paragraph
  explaining why an octagon's facet midpoint is not its arch. The selftest prints **rotunda 0.61 m**
  and a worst case of **1.88 m** on the grand pavilion. The `roundFrames` fix moved that door and
  the sentence explaining the old number survived it.

Both errors run against the module's own interest, which is the good kind of wrong. They are here
because the round's whole argument is that a printed, asserted number beats a claim — and two of its
printed numbers were not read back.

### 6. `overview` is still three fifths lawn, and `kit-east` is still a picture of the promenade

The reframe is real and reproduces: **71.9 % → 61.5 %** on the mask that matches their "after"
(`.game-render/_critic-b3/lawn3.mjs`). It is also worth saying that on the whole image it is
**48.8 % → 47.9 %** — the same street, a tighter crop. The module says this itself (§5.3) and its
diagnosis is right: what fixes it is content on the west side, not another camera.

`kit-east` is the part I would not have accepted. §4.15 says the two new presets "look ALONG one
aisle from 20° off its axis so the near piece is three-quarters on and the four behind it step back
in the same pose". `.game-render/critic-b3-insp/1200-kit-east.png` — byte-identical to the module's
own — has the 10 m promenade running up the middle of the frame with pieces scattered along both
edges and three of them clipped by the HUD panel. The paved aisles under the pieces are a genuine
improvement (`1200-kit.png` shows the clay pavers and the grass verge); the camera claim is not.
`bearing: 20` at `distance: 34` puts the camera at x ≈ −3.1, i.e. west of the promenade centreline,
looking across it.

### 7. The dormers are flat dark quads, and they are the roofscape

`.game-render/buildings-r3-final/0900-close.png` at 44 m: three dormers on the clock tower's slate and
each is a dark rectangle. They have cheeks, a face, a pitched cap and a window and none of it
separates, because the face is in shade and nothing outlines it. The module says so (§5.2) and it is
the largest remaining frame item after the rotunda: `overview` and `close` are both roofscape frames,
and this is what is on the roofs. A cheek in a lighter tone, a bargeboard, or a sill that catches the
sun would each do it, and all three are `roofs.ts`.

### 8. Two kit samples are still boxes, three rounds open

`1200-kit-east.png`: the Panorama window is a dark teal box, the Double door a flat brown leaf on a
white frame. Round 1's finding 11. The module now says correctly that it is not the half hour round 2
estimated — but it is still the only place in the set that reads as programmer art, and it is now
photographed by a camera that exists to photograph it.

### 9. The aprons are hard-edged paving mats

`1200-hall.png` (a pink octagon meeting the lawn on a straight line), `1200-inn.png` (a grey
rectangle), `buildings-r3-final/0900-close.png` (the same octagon read from 44 m as a coloured shadow
under the building). Round 2's finding 8, the module's own §5.15, untouched. It is `ground.apron`
content and a verge or a gravel margin would break the line.

### 10. Twenty-five light sites still share two lamps, and the frame says so

Reproduced exactly: turning both off costs the near paving **3.8 luma of 35.3** and everything past
about fifteen metres **0.4–0.6**. Open
`.game-render/_critic-b3/2300-ground-pool2-off.png` beside `-on.png` and the two are the same
picture. What lights this street is lit windows plus an additive decal. The module names this itself
(§5.5, §5.6) and names the ceiling (`maxSimultaneousLights = 6` minus the sun). It stays on the list
because the round closed finding 3 and the thing finding 3 was about is unchanged.

---

## 6. Extensibility, tested rather than read

I built a fresh two-mass pack blueprint (`critic-b3:crit-tower`, four-storey tower on a two-storey
block) through `Registry` + `attachBuildingContent` + `buildBuilding`, with no code change anywhere:

- **It builds from JSON alone** — resolves, and produces 8,190 kit triangles.
- **`sign.side` is live** and moves the band from `[0, 3.7, 5.31]` to `[7.31, 3.7, 0]`.
- **Per-entry validation** still names the pack, the key and the reason, and falls back to a block
  rather than a hole.
- **The module's own catalogue is a pack** through the same `readPack` — confirmed by the probe,
  which sees the built-in blueprints and mine through one code path.
- **Round 3's `Solid` mechanism widens this axis structurally**: a kit piece nobody has written yet
  is covered by being built out of `addBox` / `addPrism` / `addBand` / `addTube` / `boxLocal`. That
  is a real extensibility gain and it should not be lost in the deduction above.

Against that: finding 3, two dead fields recorded as fixed; and the standing structural limit the
module names itself (§5.8) — `round` masses take polygons only, the eight roof forms are functions in
`roofs.ts`, and a pack cannot add a dome, a gambrel or a sawtooth.

Round 2 scored 8.6 here with `mass.id` dead as one of two deductions. `mass.id` is read now, but only
through a field a pack cannot set, so a pack author is exactly where they were and the report says
otherwise. **7.4.**

---

## 7. What is genuinely good, and must not be lost

- **The find of the round is real, and it is the largest single frame repair this module has made.**
  Every round mass was built inside out; the rotunda's drum was see-through, not featureless; the
  band goes 130.6 → 88.7 mean and 220.2 → 186.3 p95 with the paving beside it **byte-identical** and
  the whole-frame diff confined to the rotunda. I opened the before, the after and my own re-shoot,
  and `1200-rot.png` now shows what the frame table has claimed since round 1: a drum with an arch
  on every facet, voussoirs, a keystone, glazing bars, a plinth course and a cornice.
- **It was found by the check, not by looking.** The round-2 critique's closing instruction was
  followed literally and paid off on the first run. That is the process working.
- **Both sabotage reproductions land to the digit** — `32 triangles, 16.2 m²` and
  `rotunda: 475 triangles, 117.2 m²` — from a scratch copy, with the repo left clean.
- **The night frames are frames of this module at last.** 32 pixels between the harness's own wait
  and a 20-second control, all of them the HUD clock, on my runs as well as theirs. Three rounds of
  night grading were of the wrong thing and this one is not.
- **The self-corrections are real and complete enough to check.** Gradient energy really does move
  the wrong way (−19 %, my operator, same direction and ratio); the "lamp pool" really is a
  shopfront; §0 marks round 2's "no categories in them at all" withdrawn rather than quietly deleting
  it.
- **The budget is exact.** 179 / 443,536 → 51 / 68,148 → **128 / 375,388**, reproduced independently,
  with the 62 + 22 × 3 arithmetic confirmed off the shadow generator's own render list, and the
  night figure (57) reported separately rather than used as the headline.
- **`shop-terrace` closes round 2's fidelity finding with one blueprint and no TypeScript**, which is
  the extensibility claim demonstrated on the module's own street.
- **Teardown is clean over three dispose/reboot cycles** and the sim now owns its kind.

---

## 8. One thing for the next critic, which is not a finding

`light.setEnabled(false)` on `buildings-spill-*` is undone within one rendered frame: the pool
re-sorts on its own clock in `onRender` (`main.ts:496-534`) and calls `setEnabled(true)` again, even
at `speed=0`. My first night A/B therefore came back "**0 scene pixels changed**", which reads
exactly like a fix that does nothing. The A/B that works pins the intensity behind a getter. It is
render state, not world state, so it costs the determinism axis nothing — but it is a trap, and it is
the reason this critique's night numbers took two passes.

Related, and worth the integrator's attention: at the harness's `--wait=1200` the camera has often
not arrived yet (probed: at 1.2 s after `setCamera('ground')` the camera was still at the previous
pose and the lights were still the previous shot's pair). What saves the frame is the `waitFrames(2)`
after the settle, which at 0.5–0.9 fps is another 2–4 s. The control proves the outcome is right
today; the margin is one slow frame.

---

## 9. Verdict

**FAIL at 8.3**, short of 8.5 by 0.20.

The round did the work it was set and did it well: the widened check found a defect two rounds of
frames and two rounds of checks had missed, the rotunda is fixed and photographed from three
directions, the night roofscape and the light pool are closed with A/Bs that reproduce to the
decimal, and a park's main street has shops on it. The frame axis moves 7.8 → 8.4 on repairs I could
break and re-verify myself.

It does not pass for two reasons, and they are the same reason twice. **A different one-line winding
slip — `addBand`'s front face, 4,014 triangles and 352.7 m² across the catalogue, 1.5× the area that
failed round 1 — passes 66,020 of 66,020 checks**, because §5d's 0.25 m probe is deeper than any
moulding in the module; and the same sabotage the round *does* catch is caught on two of the four
blueprints it inverts. So "it judges every upright triangle" is, for the third round running, a
stronger sentence than the check can support. And **both manifest fields this round added to close
the last extensibility finding are stripped by the module's own zod schemas and do nothing from a
pack**, while §0 row 9 records them as fixed — round 1's dead-field finding, re-committed in the
round that closed it.

**Round 4 should make §5d's outward probe scale to the solid it is stepping into and print how many
triangles stand on a solid thinner than the probe** — reproduce the `addBand` sabotage first, then
fix it, then re-run both of round 3's demonstrations to prove nothing was lost — and in the same
commit put `clockFaces` and `sign.mass` into `massSchema` and the sign schema with a selftest case
per field, because a manifest field that the manifest parser deletes is the one class of bug this
module has now shipped in three consecutive rounds.

---

## 10. For `STATUS.json`

```
"buildings": { "round": 3, "commit": "123f3e5",
  "frame": 8.4, "fidelity": 8.4, "extensibility": 7.4,
  "budget": 8.8, "determinism": 9.0, "honesty": 7.0,
  "total": 8.25, "pass": false }
```

(Not written by me — this critique is read-only against the repo. `.game-render/` is gitignored;
`git status --porcelain` is empty, and the scratch copy used for the three sabotages
(`/tmp/.../b3tree`, `node_modules` symlinked, never a git tree) was restored and re-verified at
`66020/66020 checks passed` before this file was written.)
