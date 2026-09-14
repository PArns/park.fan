# buildings — critic round 4

**Score: 8.6 · Verdict: PASS** (pass is ≥ 8.5). Every hard gate passes. Rounds 1–3 were 7.50, 8.20,
8.30.

Graded at **`5a25e8b`**, which is both HEAD and the last commit that touched `lib/game/buildings/`
(`git log -1 --format=%H -- lib/game/buildings/`). Nothing has landed since.

Every figure below came from the **dev server, `http://localhost:3001`**, unless the line says
otherwise. Harness `medium`, WebGL2 through SwiftShader, 1280 × 720. `:3100` is used nowhere in this
grade; `:3000` is dead. Every scratch edit was made on a **copy of the module outside the
repository** (`$SCRATCH/g/buildings`, run against the real `lib/game/content` and
`lib/game/core`); `git status --porcelain` was empty before and after, and the served tree was never
touched.

**The headline is two things, and they point opposite ways.** Round 3's closing instruction was
executed literally and it works: the probe scales, the count is printed, the assertion fires when
the constant is put back, and all three sabotages in the report's table reproduce **to the digit**.
And there is a fourth hole, in the same check, of the same shape as the first three: **reversing
every window reveal in the module — 652 triangles over 113.8 m², all upright, all inside §5d's own
scope — passes `66024/66024` with not one printed number moving.** That is not enough to fail the
module against this rubric, and I say why in §1 and §6.

---

## 1. The six axes

| #   | Axis                       | Weight | Score | One sentence                                                                                                                                                                                                                                                                    |
| --- | -------------------------- | -----: | ----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The frame                  |   30 % |   8.6 | Three of round 3's four named frame defects are closed and I reproduced each measurement exactly (dormer band p95 34.8 → 52.5, the gravel verge, both kit samples reading); `overview` is still 60.7 % lawn, 25 light sites still share 2 lamps, and the door fix opened a small see-through slot round every door. |
| 2   | Fidelity to the real thing |   20 % |   8.6 | The grand pavilion has a front door for the first time and it is built like a door — stiles and rails proud of sunk panels, a transom bar, a fanlight, an architrave — plus a dormer sill and bargeboard and a paving→kerb→gravel sequence; the leaf still does not fill its own opening and there are no interiors. |
| 3   | Extensibility              |   20 % |   8.7 | `sign.mass` and `mass.clockFaces` are live **through `registerPack`** and deleting the two schema lines fails four checks; I checked every field of all nine manifest interfaces against the zod schemas and against the builder and found no dead field left — roof forms, bay codes and kit pieces are still TypeScript. |
| 4   | Budget and behaviour       |   15 % |   8.8 | My own A/B gives **128 draw calls / 384,836 triangles / 10.67 %** — the reported figure to the digit — with `stats()` matching on every field, +9,448 triangles for zero extra calls, sim tick 0.00 on all nine shots and a clean five-check teardown over three cycles.        |
| 5   | Determinism and state      |   10 % |   9.0 | The selftest is byte-stable over six runs today, `test:game` is green through both soaks and a save round-trip, no `Math.random`, no `Date.now`, no leak.                                                                                                                        |
| 6   | Honesty of the report      |    5 % |   7.2 | **Every single number I re-measured reproduced exactly**, which is a first for this module — but §5 item 15 contradicts §4.19 in the same file, two of the selftest's own comments quote numbers its own tree no longer produces, and §3 again claims the check concludes something about every upright triangle when 29 % of the judged area gets no answer from the probe at all. |

**Weighted: 2.580 + 1.720 + 1.740 + 1.320 + 0.900 + 0.360 = 8.620 → 8.6**

Extensibility 8.7 clears the 5.0 floor.

**Robustness of the verdict.** It is not a comfortable pass and I have tested it against my own
judgement. Holding frame and fidelity at round 3's 8.4 — i.e. giving the round no credit at all for
the door, the dormers or the verge — the total is **8.52** and it still passes. Dropping honesty to
6.5 gives **8.585**. The one axis it does turn on is extensibility: at 8.3 with frame and fidelity
also held at 8.4 it would fail at 8.44. I did not take extensibility on trust — §5 has the field-by-
field audit, and round 2's independent critic scored this axis **8.6 with `mass.id` still dead**.
That field is now live and measured, so 8.7 is the conservative reading of the same evidence.

**Why the fourth hole does not fail it.** The hard gates in `CRITIC.md` are enumerated and "the
module's self-test has no blind spots" is not one of them. The rubric scores the frame, the
fidelity, the extensibility, the budget, the determinism and the honesty of the report — and a
latent blind spot in a check costs the module on **honesty**, where it is priced, and in the
round-5 instruction, where it belongs. Round 3 failed this module at 8.30 on two findings, one of
which was a dead manifest field that broke a **claim about shipped behaviour**; this round's
equivalent finding is about a test's coverage, with no defect behind it: the catalogue's reveals
are wound correctly today (I verified, §4), and the check is strictly stronger than round 3's.
Inflating that into a fail would mean grading the module against a seventh axis nobody wrote down.

---

## 2. Hard gates

| Gate                                                | Result   | Evidence                                                                                                                                                                                          |
| --------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zero console errors / hydration warnings            | **PASS** | `.game-render/critic-b4/report.json` → `console.errors: []`, `console.hydration: []`, `ok: true`, 9 shots. Same in `.game-render/critic-b4-insp/report.json` (9 shots), and 0 errors in both Playwright probes. |
| Warnings attributable to this module                | **PASS** | Two, both `WebGL: INVALID_VALUE: bufferSubData: buffer overflow`, in every run of every showcase in this repo.                                                                                    |
| Extensibility ≥ 5                                    | **PASS** | 8.7, §5.                                                                                                                                                                                          |
| Touched only its own folder                          | **PASS** | `git show --name-only --format='' 5a25e8b` → seven files under `lib/game/buildings/`, plus `docs/game/reports/buildings.md` and `docs/game/requests/buildings.md`. Nothing else.                   |
| No `from '@babylonjs/core'` barrel                   | **PASS** | `grep -rc "from '@babylonjs/core'" lib/game/buildings/` → 0                                                                                                                                       |
| No module-scope `window` / `document` / `navigator`  | **PASS** | Every hit is the English word "window" in prose or a piece id (`wall-window`, `emissive(…, 'window')`). No DOM reference anywhere in the folder.                                                   |
| No `Math.random` / `Date.now`                        | **PASS** | 1 hit, the comment at `kit.ts:1397` saying `Date.now()` is banned                                                                                                                                 |
| `pnpm test:game` green                               | **PASS** | exit 0; `game lint: 264 files clean`; buildings `66024/66024`; soak 1,728 ticks mean 1.90 ms and 10,800 ticks mean 0.89 ms against a 6 ms budget; save round-trips after both                      |
| `npx tsc --noEmit`                                   | **PASS** | exit 0                                                                                                                                                                                            |
| `npx eslint lib/game/buildings`                      | **PASS** | exit 0                                                                                                                                                                                            |
| Budget met                                           | **PASS** | 128 draw calls at the worst camera against 1,200 whole-game — 10.67 %, my own A/B                                                                                                                 |
| No leak across three dispose/reboot cycles           | **PASS** | `node scripts/check-game-teardown.mjs --url=http://localhost:3001` → all five checks green, live engine 1/0/1/0/1/0/1, no console errors                                                            |

**No gate fails.**

---

## 3. The frames I opened

Every file below was opened with the Read tool and looked at.

### My own gauntlet — `.game-render/critic-b4/` (dev, `:3001`)

**Control first:** my nine frames are **pixel-identical** to the module's own
`.game-render/buildings-r4/` set except for **32 pixels at x[151,156] y[54,59]**, which is the
animated HUD clock — and `0900-overview.png` differs in **0 pixels of any channel**. The report's
evidence is current and reproducible; every claim it makes about those files I can check on mine.

| File                | What is actually in it                                                                                                                                                                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0900-overview.png` | Raking dawn under D-023. Brick terraces under blue-grey mansards down both sides, the clock tower, the ticket hall's red pantiles, the rotunda's cone, the market hall's vault, the teal canopy, the grand pavilion closing the vista. The left third and the bottom-left corner are lawn. |
| `0900-close.png`    | The clock-tower block at 44 m. **The three dormers read as boxes**: a pale sill line under each window and a bargeboard down each rake. Solid brick gable with courses; the rotunda's drum with arches at the left edge.                                                    |
| `0900-ground.png`   | Eye level. Shopfronts with an amber fascia on the near-left terrace, brick courses, sashes with bars, sills, string courses, quoins, and a pale wedge of sky in the top-left corner of every unlit pane. Lower ~55 % of the frame is the paths module's paving.            |
| `1830-overview.png` | Broad afternoon (D-023). Roofs, aprons and the gravel verges all legible from 116 m; the verge reads as a lighter fringe round each apron.                                                                                                                                 |
| `1830-close.png`    | The clock tower in afternoon sun — the clearest daylight view of the dormer trim: three white sill lines and three bargeboard Vs on the slate.                                                                                                                             |
| `1830-ground.png`   | The street in flat afternoon light. The shopfronts are dark glass under a fascia; roughly 60 % of the frame is empty paving. The weakest of the nine, and after D-023 it is a harness problem rather than the module's.                                                    |
| `2300-overview.png` | Night. The mansards, hipped roofs and the barrel vault sit as blue-grey slate against dark grass; four lit cupolas, warm windows, the teal shopfront on the right.                                                                                                        |
| `2300-close.png`    | Night on the clock tower: three lit dormers with their sills catching the glow, individually varied panes with bars in them, the lit clock dial, the tower lantern, the rotunda's drum lit at the left edge.                                                              |
| `2300-ground.png`   | The receding street of lit windows with the shopfront glowing on the left and the pavement in front of it lit — at the harness's own 1.2 s wait. Two thirds of the frame is unlit paving.                                                                                 |

### My own inspection cameras at noon — `.game-render/critic-b4-insp/`

| File                | What is actually in it                                                                                                                                                                                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `1200-hall.png`     | The grand pavilion. **There is a front door on the principal elevation** — the centre bay carries two leaves, a lit fanlight and an architrave, with steps up to it. Round 2's finding, open for two rounds. The big pink octagon is the showcase's `paths` plaza, as §4.19 says.        |
| `1200-kit.png`      | The west rank: an arched window three-quarters on with glazing bars and a sky reflection, a slate roof behind it, a stone column, a lit shopfront. A rank of samples, standing on clay pavers with a gravel verge.                                                                        |
| `1200-kit-east.png` | The east rank, near piece the Double door, which now reads as a door. The lower left ~third of the frame is still promenade paving.                                                                                                                                                       |
| `1200-inn.png`      | The extensibility exhibit, all JSON: jettied first floor with its shadow, a wing at 35°, pantiles, three chimneys, two dormers with sills. **The apron's edge against the lawn is a gravel band that wanders**, not a ruled line.                                                        |
| `1200-rot.png`      | The rotunda, unchanged from round 3 and still correct: three facets to camera, each with a round-arched opening, voussoirs, a keystone, glazing bars, plinth course, dark eaves band, cone, glazed lantern with finial.                                                                  |
| `1200-facade.png`   | Two metres from a terrace flank in shade. Brick courses, mortar joints, sills, two string courses, glazing bars — all soft at 160 px/m. And **fourteen panes carrying the identical pale wedge in the identical top-left corner**, §6 finding 5.                                        |
| `1200-market.png`   | The market hall's back: brick with round-headed windows under a slate barrel vault whose courses follow the curve. Vault two thirds of the elevation, wall one third.                                                                                                                    |
| `1200-ticket.png`   | The ticket hall's long flank, hipped slate, a door with a fanlight and two lanterns at the centre.                                                                                                                                                                                        |
| `1200-gate.png`     | Opened; the west end of the street with the ticket hall's colonnade.                                                                                                                                                                                                                      |

### The module's own crops, re-opened

`_r4/dormer-before-4x.png` / `-after-4x.png` (three dark quads against three boxes with a lit sill
and a barge — and I cut the same 300 × 90 band out of both frames myself as
`_critic-b4/dormer-r3-4x.png` / `dormer-b4-4x.png` and they match), `_r4/door-3x.png` (a blank
timber wall inside a white architrave — the "flat brown leaf" was the wall), `_r4/door-fixed-3x.png`
(a panelled slate-blue leaf with stiles, rails, a transom bar and a fanlight),
`_r4/hall-door-4x.png`, `_r4/pano-5x.png` (mullions, a transom, a lit amber interior — not a teal
box), `_r4/inn-verge-before.png` / `-after.png` (a ruled line against a gravel band whose edge
wanders).

### My own crops — `.game-render/_critic-b4/`

`hall-door-6x.png` (the pavilion's centre bay at 6×: two leaves, stiles and rails, a lit fanlight
over a transom bar, a white architrave), `kit-door-6x.png` (the Double door sample at 6× — and
**grass and clay pavers visible through the slots beside the leaf and inside the fanlight**, §6
finding 2), `arch-5x.png` (the arched window sample at 5×, with a thin green sliver at its left
jamb), `ticket-door-12x.png` (the ticket hall's door at 12×: leaf, fanlight, transom, architrave,
two lanterns; no slot visible in shade), `dormer-{r3,b4}-4x.png`.

---

## 4. Every claim in the report, re-measured

| Report claim | My measurement | Verdict |
| ------------ | -------------- | ------- |
| The shipped test prints `39000 upright triangles stand on a recorded solid (8827 m²), 250 stand on none (127.9 m²)` and `21258 of them (3320.3 m²) … thinner than the 0.25 m cap — thinnest 0.008 m` | Six runs, identical every time, byte for byte | **exact** |
| Restoring the constant probe fails the new assertion | `probeInto` forced to `return PROBE_MAX`: `0 of them (0.0 m²) … thinnest n/a` and `✗ the outward probe scales to solids thinner than its cap … 0 triangles, thinnest Infinity m`, **66023/66024** | **exact — the self-guard fires** |
| `addBand` front quad reversed → **✗ 350 triangles / 25.4 m²**, ticket-hall 53, clock-tower 88, shop-terrace 64, terrace-house 39, guest-services 36, watermill 31, +4 more | scratch copy, `addBand`'s front quad reversed (`geometry.ts:913`, round 3's `:884`): **✗ 350 triangles, 25.4 m²**; ticket-hall 53 / 3.5, grand-pavilion 20 / 2.1, clock-tower 88 / 7.0, market-hall 7 / 0.7, rotunda 4 / 1.0, terrace-house 39 / 2.3, shop-terrace 64 / 3.3, guest-services 36 / 2.9, canopy-glass 8 / 0.7, watermill 31 / 1.9 | **exact, per item** |
| Dormer fronts reversed → **✗ 52 / 25.3 m², all four**: clock-tower 24 / 9.1, terrace-house 12 / 6.1, shop-terrace 12 / 6.1, watermill 4 / 4.1 | scratch copy, dormer-face `back:` flag flipped (`roofs.ts:635-637`): **✗ 52 triangles, 25.3 m²**, those four blueprints, those four areas | **exact** |
| `roundFrames` ring order put back → **✗ 598 / 162.6 m²** | scratch copy, `build.ts:560-561` reverted to increasing angle: **✗ `parkfan-architecture:rotunda: 598 triangles, 162.6 m²`** | **exact** |
| Deleting the two schema lines fails 4 checks, with that failure text | `manifest.ts` `clockFaces:` and the sign's `mass:` removed: **66020/66024**, and the four lines are verbatim what the report quotes, down to `6452 → 6452 triangles` | **exact** |
| The strengthened check found `neon-lagoon:window-panorama`, 2 triangles / 6.2 m², on the clean tree | `frameSlabSolid(… 'pane-interior' …)` removed from `addPane`: **✗ `neon-lagoon:window-panorama: 2 triangles, 6.2 m²`** | **exact** |
| Budget 128 draw calls / 384,836 triangles / 10.67 % at 09:00 `overview` | my own A/B (disable `api.meshes()`): **179 / 452,984 → 51 / 68,148 = 128 / 384,836**, 10.67 % | **exact** |
| 57 calls at 23:00 `ground` | my A/B: **100 → 43 = 57** (134,605 → 47,480 triangles) | **exact** |
| Round 3 was 375,388 triangles, so the round added 9,448 (+2.5 %) at the same draw-call count | round 3's critic measured 375,388 on the same A/B; 384,836 − 375,388 = **9,448 = +2.52 %**, calls 128 both rounds | **exact** |
| 25 buildings → 22 batches → 62 drawn meshes, 100,454 drawn / 82,314 unique, 441 windows, 254 lit, 25 light sites, **twenty** distinct blueprint values | `stats()` against `:3001`: identical on every field; I counted the `batchList` blueprints and there are **20** | **exact** |
| 62 colour meshes + 22 kit × 3 cascades = 128 | shadow probe: one `sun` generator, `numCascades 3`, render list 23 of which **22** are `buildings:` | **exact** |
| `activeLights` reads 2 at 23:00 in both poses | probe after a 4 s settle: `activeLights 2, lightSites 25, litWindows 254` at both `ground` and `overview` | **exact** |
| The selftest catalogue went 72,822 → 74,517 triangles over 22 items | round 3's tree (`123f3e5`) prints `22 items, 72822 triangles`; HEAD prints `22 items, 74517` | **exact** |
| §4.18 dormer band, `0900-close.png` x[500,800] y[220,310]: mean 29.0 → 29.2, p5 17.8 → 19.0, p95 34.8 → **52.5**, gradient 4.61 → **5.73** | the module's own `_r4/stats.mjs` on round 3's frame and on **my own re-shoot**: `29.0 / 17.8 / 34.8 / 4.61` → `29.2 / 19.0 / 52.5 / 5.73` | **exact, and on my frame not theirs** |
| The sim's worst door is 1.88 m on the grand pavilion, rotunda 0.61 m, 0.00 m on three of eight | shipped test: grand-pavilion 1.88, rotunda 0.61, 0.00 on market-hall, terrace-house and watermill | **exact — round 3's stale 5.41 m is genuinely corrected** |
| `overview` is 60.8 % lawn | the module's own `lawn.mjs` mask on my `critic-b4/0900-overview.png`: **60.7 %**, and 60.7 % on round 3's frame — unchanged, as claimed | **exact** |
| Sim tick 0.00 ms on all nine shots | `simTickMs: 0` on all nine of mine, and on all nine of the inspection set | **exact** |
| Atlas 388 ms, build 153 ms, "±10 % run to run" | my probe on the same server: **477.4 ms / 171.8 ms**, i.e. +23 % on the atlas; round 3's critic got 404 / 178 | **≈, and the stated ±10 % is not the range** — §6 finding 9 |

**Nothing in this report is off in a way that flatters the module.** That is not a sentence I
expected to write about this module: round 1, round 2 and round 3 each had at least one figure that
did not survive re-measurement, and this round has none. Where the round-3 critique named a wrong
number, the correction is real and the corrected number is what the shipped test prints.

---

## 5. Extensibility, audited field by field

Round 3 scored this 7.4 because both fields its §0 recorded as the round's extensibility fix were
stripped by `manifest.ts`'s own zod schemas. That is fixed, and it is fixed in the way that matters:

- **Deleting the two schema lines fails four checks** (reproduced above), so the schema cannot
  silently lose them again.
- **The two cases go through `registerPack` + `resolveBuilding`.** `selftest.mjs:275-330` builds a
  real pack manifest, registers it through `freshRegistry`, resolves it through `resolveBuilding`
  and asserts both on `resolved.blueprint` and on the geometry. That is the path a pack author
  takes, and it is the seam round 3's test skipped.
- **No other field is dead.** I extracted the property names of `MassDef`, `BlueprintDef`,
  `BuildingStyleDef`, `RoofDef`, `TrimDef`, `GroundDef`, `NightDef`, `SignDef` and `ArcadeDef` from
  `types.ts` and compared them with the zod schemas in `manifest.ts`: **every one of the 20 mass
  fields, 8 blueprint fields, 9 style fields, 10 roof fields, 6 trim fields, 3 ground fields,
  3 night fields, 5 sign fields and 5 arcade fields is in its schema**, and every one of them is
  read by `build.ts`, `kit.ts`, `roofs.ts`, `main.ts` or `materials.ts`. There is no third dead
  field waiting for round 5.
- A blueprint from a pack nothing in the module anticipated still builds from JSON alone: the
  synthetic watermill resolves `source: 'pack'`, builds 5,558 triangles and exactly one door, and
  its footprint, entrance and plan all check out.

What caps this below 9: **the class fix is per-field, not structural.** Two fields have a seam test;
nothing compares the schema's key set with the type's, so the next field added to `types.ts` and
forgotten in `manifest.ts` dies exactly the same way and the suite stays green. And a pack still
cannot add a roof form, a bay code or a kit piece — `ROOFS`, the bay-code switch and `PIECES` are
TypeScript maps, which the report names honestly in §5.8.

---

## 6. Findings, ranked

### 1. The fourth hole: the probe has a third answer, it means "I cannot tell", and §5d records it as "looks out" — 29 % of the judged area

`selftest.mjs:997`:

```js
if (ahead - back <= probe) { looksOut = true; break; }
```

The docstring above it says a clean signed distance answers `−2·probe` looking out and `+2·probe`
looking in, so the line sits at `+probe`. It also says a face lying **tangentially** across a skin
— the jamb of an opening, a band's return, the side of a quoin — "reads 0, which is the honest
answer … and it falls through to `facingNothing` where it belongs."

**It does not.** `0 ≤ probe` is true for every probe, and `PROBE_MIN` is 4 mm, so a tangential face
is recorded as looking out, `break`s the solid loop and never reaches `facingNothing`. The answer
is identical whichever way the triangle is wound.

**Measured on the clean tree**, by instrumenting the branch: **15,728 of the 39,000 judged
triangles — 2,562.3 m² of the 8,827 m², 29.0 % of the judged area — are decided by
`|ahead − back| < 0.01`.** That number is neither printed nor asserted anywhere; `thinStood` counts
the thing round 3's critic asked for and is silent about this.

**The sabotage.** I reversed both jambs in `addReveal` (`geometry.ts:823` and `:830`) — one quad
order each, on the four faces whose own docstring at `geometry.ts:809-820` says they shipped wound
the wrong way through rounds 1–3 on "every window, door, shopfront, louvre and niche in the
module", and that this "survived three rounds because §5b measures roof planes, §5c only asks the
winding to agree with the normal (it did — both wrong), and round 2's §5d judged nothing that was
not on a mass's plan prism."

Measured over exactly the catalogue §5d walks, by diffing normals against a clean build:
**652 triangles / 113.8 m², every one of them upright (`|ny| ≤ 0.35`) and therefore inside §5d's own
scope**, and `materials.ts:74` sets `kit.backFaceCulling = true`, so on screen every one of them is
a hole in the thickness of a reveal.

The suite says:

```
winding
    72082 triangles across the catalogue, 0 inverted
outward faces
    39000 upright triangles stand on a recorded solid (8827 m²), 250 stand on none (127.9 m²)
    21258 of them (3320.3 m²) were judged against a solid thinner than the 0.25 m cap — thinnest 0.008 m
66024/66024 checks passed
```

**Not one number moves.** Not the residue, not `thinStood`, not the thinnest solid.

**Isolated, so the mechanism is not in doubt.** With `facingNothing` forced to `return true` on both
trees, the clean tree and the sabotaged tree report the **identical** `✗ 69 triangles, 12.0 m²`. All
652 reversed jambs are forgiven by the probe itself, not by the exemption round 3's critic tightened.

**And the obvious repair does not work either**, which is worth writing down so round 5 does not
spend the day I spent: moving the line to `ahead - back < -probe * 0.5` — the behaviour the
docstring describes, tangential faces falling through to `facingNothing` — catches the sabotage
(ticket-hall 108 / 19.8, clock-tower 69 / 17.0, terrace-house 41 / 6.5, shop-terrace 39 / 5.8, …)
and flags **222 triangles / 49.4 m² on the clean tree** (against 355 / 73.0 with the sabotage in),
most of them the same jambs wound
correctly. The tangential case needs an answer of its own, not a threshold: the solid's depth field
cannot say which side of a jamb the air is on, and the only thing that can is the code that cut the
opening.

**Fixed looks like** a third outcome recorded and printed beside `thinStood` — "N triangles the
solid has no opinion about" — plus something that does have an opinion for them (the opening's own
plan, or the pane the reveal lines), and, until then, §3 and §0 saying "judges" rather than
"asserts it looks out of a solid it stands on".

### 2. The door fix opened a see-through slot round every door in the catalogue

`kit.ts:773` insets the leaf 40 mm inside its opening on each side, `kit.ts:843` insets the fanlight
pane 50 mm, the reveal has jambs but no back, and the far wall of a mass is back-face culled. So
head-on there is **no front-facing surface at all** over a thin frame round every door leaf and
every fanlight. Rasterised along each door's own normal at 5 mm, over the leaf's bounding box plus
0.4 m:

| item             | round 3 (`123f3e5`) | round 4 (`5a25e8b`) |
| ---------------- | ------------------: | ------------------: |
| `rotunda`        |           0.000 m²  |       **0.940 m²**  |
| `grand-pavilion` |           0.000 m²  |       **0.868 m²**  |
| `ticket-hall`    |           0.000 m²  |       **0.806 m²**  |
| `market-hall`    |           0.000 m²  |       **0.692 m²**  |
| `guest-services` |           0.000 m²  |       **0.456 m²**  |
| `clock-tower`    |           0.000 m²  |       **0.429 m²**  |
| `door-double`    |           0.000 m²  |       **0.401 m²**  |
| `terrace-house`  |         0.222 m²    |         0.222 m²    |

Round 3's zeroes are the bug: a sheet of wall covered the whole opening. `terrace-house` is the
tell — it was the one door no wall covered, and it has had the slot since round 1. Fixing the wall
uncovered the slot on the other seven.

It is visible: `.game-render/_critic-b4/kit-door-6x.png`, the Double door sample at 6×, has **grass
at the left of the leaf, clay pavers at the right and the sky, a timber building and grass inside
the fanlight**. On a blueprint the same slot shows whatever is beyond the building. At the
gauntlet's own cameras it is sub-pixel (`ticket-door-12x.png` at 12× shows nothing), so this is a
close-range defect, not an overview one — but it is round 2's finding 1 class ("you could see the
landscape through the buildings"), and nothing in the suite looks for it: §5c and §5d both judge
winding, and neither asks whether an elevation is closed. The same rasteriser finds a standing
**0.171 m²** at the springing of every arched opening (`core-classic:window-arched`, present in both
rounds, a green sliver at the left jamb in `_critic-b4/arch-5x.png`).

Cheapest fix is a back to the reveal, or the leaf widened to its own jamb; the check that would
have caught it is "no cell of a closed elevation lacks a front-facing surface", which is the
frame-adjacent check §5.12 already says the module does not have.

### 3. Two of the selftest's own comments quote numbers its own tree no longer produces — one of them the exact figure round 3 flagged

- `selftest.mjs:1069`: *"It is 248 triangles over 132.4 m² now — 1.6 % of the upright area"*. The
  shipped test prints **250 / 127.9 / 1.4 %**, three lines below. That is round 3's critique finding
  5, which §0 row 4 records as fixed — it is fixed in the report and not in the file that prints
  the number.
- `selftest.mjs:791-793` carries a sabotage table reading `364 tris / 23.7 m²`, `68 / 32.4 m²`,
  `616 / 172.7 m²`. The tree answers **350 / 25.4**, **52 / 25.3**, **598 / 162.6** — I measured all
  three. The report's own §4.16 explains the 68 → 52 (the dormer trim landed after that run) and
  prints the current numbers; the code does not.

Round 3's own §0b row 12 was "a code comment quoting numbers from a frame that no longer exists",
recorded as fixed.

### 4. §5 item 15 contradicts §4.19 in the same document

Under "**What is weak, ranked. Round 4.**", item 15 reads: *"The aprons are hard-edged paving mats.
Every isolated building sits on a rectangle or polygon of paving that meets the lawn on a straight
line with a 0.15 m kerb and nothing else … a verge or a gravel margin would break the line."* §0 row
6 and §4.19 record exactly that verge as done, and `_r4/inn-verge-after.png` and my own
`critic-b4-insp/1200-inn.png` show it. A stale entry in the one section a critic reads for what the
module admits.

### 5. The sky reflection varies in size and never in shape, and at two metres a facade is a stamped tile

`kit.ts:315-325` draws one triangle per unlit pane with `skyCut` seeded per pane — so the wedge
changes size — but it is always the **top-left corner at the same 45°**. In
`.game-render/critic-b4-insp/1200-facade.png`, fourteen panes carry the identical pale wedge in the
identical corner. The code's own comment says the seeding is there "so a facade does not read as one
stamped tile". Varying the corner (or the angle) is the same two triangles.

### 6. `overview` is 60.7 % lawn, and it is the preset a player looks at most

Measured with the module's own `lawn.mjs` mask on my own `critic-b4/0900-overview.png`: **60.7 %**,
identical to round 3's frame. Correctly diagnosed in §5.3 — the street is 34 × 110 m and the preset
has to see all of it, so the answer is content on the west side, not another camera. It has now
survived three rounds and it is the largest thing left in the frame axis.

### 7. `kit-east` still spends its lower left third on the promenade

Confirmed on my own `1200-kit-east.png`. §4.21's constraint argument — the ticket hall reaches
x = −9.3 and the market hall x = 13.9, so every camera stands on the 10 m promenade — is consistent
with the geometry in `showcase.ts:171-209`; I did not re-shoot the five alternatives. The near piece
is the Double door and it reads, which is most of what the finding asked for.

### 8. Twenty-five light sites, two lamps

`stats()` at 23:00: `lightSites 25, activeLights 2`, in both the `ground` and the `overview` pose,
with `LIGHT_POOL.medium = 2` at `main.ts:84` and `maxSimultaneousLights = 6` at `materials.ts:78`.
Unchanged and admitted in §5.6. What a night street in this module mostly has is lit windows plus
the additive decal.

### 9. The atlas cost is quoted tighter than it varies

§3 gives 388 ms atlas / 153 ms build and says both "vary by ±10 % run to run". My probe on the same
server read **477.4 ms / 171.8 ms** (+23 % / +12 %); round 3's critic read 404 / 178. Three
measurements spanning 388–477 ms are not a ±10 % band. It is a main-thread cost paid once on the
first building, so it matters; quote the range.

---

## 7. What round 5 would be, if there were one

There is not one: this passes at **8.6** and the module is done. Defending that plainly —

The two things that failed round 3 are both closed and both closed **provably**. The probe scales to
the solid it steps into, the coverage number is printed, and putting the constant back fails the
suite at that line rather than at the next critic's sabotage; all three of the round's sabotages
reproduce per item, to the digit, on my tree. `sign.mass` and `mass.clockFaces` are live through the
parser a pack's JSON actually goes through, deleting the schema lines fails four checks, and I
audited all nine manifest interfaces field by field and found no third dead one. On top of that, the
round found and fixed the largest single fidelity defect in the module's history — **every door
above a 3.05 m storey had been a picture of the wall behind it since round 1**, which I confirmed
independently: rasterised head-on, round 3 draws **0.0 %** of the door leaf on seven of eight items
and round 4 draws **67.8–99.8 %**. Round 2 and round 3 each wrote that finding down as a frame
observation and neither found the line; this round found it with a magenta test and then wrote the
test down.

And the report is, for the first time in four rounds, arithmetically clean: I re-measured nineteen
of its claims and every single one reproduced, several of them on frames I shot myself rather than
on the ones it shipped.

What I would hand the whole-game gate rather than another round of this module, in order:

1. **The tangential class in §5d** (finding 1) — 29 % of the judged area gets no answer from the
   probe, a real historical inversion in that class passes the suite, and the report's description
   of what happens to those faces is not what the code does. This is the third round in a row that
   the check's coverage sentence has been wider than the check, and it is now the only structural
   thing left in the module.
2. **The slot round every door leaf and every fanlight** (finding 2), 0.22–0.94 m² per door, and the
   0.171 m² at every arch springing — the "is this elevation closed" check the module does not have.
3. The three documentation defects (findings 3–4), which are twenty minutes and would have cost
   nothing had anyone read the file back.
4. `overview`'s 60.7 % lawn and the 25 sites / 2 lamps ceiling — both content and engine decisions
   that belong to the whole-game frame, not to this folder.

---

## 8. For `STATUS.json`

I did not edit `docs/game/STATUS.json` — this grade was run read-only. The block to record under
`modules.buildings`:

```json
{
  "round": 4,
  "score": 8.6,
  "gated": true,
  "consoleErrors": 0,
  "axes": {
    "frame": 8.6,
    "fidelity": 8.6,
    "extensibility": 8.7,
    "budget": 8.8,
    "determinism": 9,
    "reportHonesty": 7.2
  },
  "gradedAtCommit": "5a25e8b",
  "hardGates": "all pass."
}
```
