# flumes — critic round 1

**Score: 7.3 · Verdict: FAIL** (pass is ≥ 8.5; it misses by 1.2)

Graded at commit `5250d38`, `lib/game/flumes/` unchanged since. Harness `medium` preset, WebGL2
through SwiftShader, 1280 × 720.

**Read this first, because it decides which numbers below are worth anything.** The commission says
to grade against the production server on `localhost:3000`. That build is from **08:32**; the flumes
commit is **13:37**. My first nine frames came back with `showcase:flumes:missing` in the corner and
an empty meadow — 21–77 draw calls, 32–52 k triangles, a grade of a park with no flumes in it
(`.game-render/critic-f1/0900-overview.png`). Everything from §3 on is therefore taken against the
**dev server on 3001**, as the `buildings` round was. Two runs were killed mid-set by another
agent's save reloading the page (`.game-render/critic-f1b/2300-close.png` is the aftermath — a white
frame and "A part of the game did not start (ui)"); those frames are discarded and re-shot, not
graded.

---

## 1. The six axes

| #   | Axis                       | Weight | Score | One sentence                                                                                                                                                                                                                             |
| --- | -------------------------- | -----: | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | The frame                  |   30 % |   6.0 | The trough is a real object — glossy gelcoat, moulding seams, an asymmetric wall you can see in a photograph — and then **every one of the five towers is a 2 m picnic shelter lying on the grass 12–17 m below the chute it is supposed to carry**, and at 23:00 the module contributes nothing but grey ribbons over the pools module's lighting. |
| 2   | Fidelity to the real thing |   20 % |   7.0 | The wall rule is correct physics and I reproduced both headline numbers to the centimetre from my own arithmetic; the manufacturer idioms, the flat-floored raft trough and the top-of-chute water manifold are researched — but the most recognisable object in a water park is missing as drawn, and the `wallResponse: 0` mechanism the report rests a paragraph on does nothing. |
| 3   | Extensibility              |   20 % |   8.5 | I put an eight-seat, 0.85-flat-floor, 20°-wrap slide nothing in this repository resembles into a pack with a new tower spec and a helix layout, and it built clean with the wall rule live; the deductions are a closed `rig.hull` enum, a flat un-namespaced id space and one hard-coded content default. |
| 4   | Budget and behaviour       |   15 % |   8.0 | 233 / 175 / 161 draw calls and 349,702 triangles reproduced **exactly**, 44 flume meshes / 82,836 flume triangles / 18 materials confirmed by my own scene probe — minus no LOD on a 22,040-triangle pipe drawn whole at 340 m, and a reported budget that is missing 8,308 triangles of the tower that isn't there. |
| 5   | Determinism and state      |   10 % |   9.0 | My own three-flume world, 3,333 ticks: save → load → save byte-identical, two independent runs byte-identical, no `Math.random`, no `Date.now`; the transient-rider decision is disclosed but its consequence for the saved lifetime counter is not. |
| 6   | Honesty of the report      |    5 % |   5.5 | §5 names the guest hole, the stale dusk frames, the four-capsule rider, the dead `tint` and the LOD gap before I could, and every budget figure re-measured — but four separate frame descriptions describe towers, stair shafts and silhouettes that are not in the frames, which is the rubric's own definition of a 3. |

**Weighted: 1.80 + 1.40 + 1.70 + 1.20 + 0.90 + 0.28 = 7.28 → 7.3**

Extensibility is 8.5, well clear of the 5.0 floor; the axis-3 gate does not fire.

---

## 2. Hard gates

| Gate                                            | Result                                                                                                                                                                        | Evidence                                                                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Zero console errors                             | **PASS** — `errors: []` in all three of my harness runs and in both hand-posed runs                                                                                           | `.game-render/critic-f1c/report.json`, `.game-render/critic-f1d/report.json`, `.game-render/critic-f1-detail2/report.json` |
| Zero hydration warnings                         | **PASS** — `hydration: []`                                                                                                                                                    | same                                                                                                                |
| Warnings attributable to this module            | **PASS** — the two `WebGL: INVALID_VALUE: bufferSubData: buffer overflow` are the project-wide pair the commission excludes; nothing else                                      | `.game-render/critic-f1c/report.json`                                                                               |
| Extensibility ≥ 5                               | **PASS** — 8.5                                                                                                                                                                | §5                                                                                                                  |
| Touched only its own folder                     | **BREACHED IN LETTER, WAIVED** — `git show --name-only 5250d38` is eleven files under `lib/game/flumes/`, its report, its request file **and `package.json`**                    | see note below                                                                                                      |
| No `from '@babylonjs/core'` barrel              | **PASS** — 0 hits; 12 distinct deep paths                                                                                                                                     | `grep -rn "from '@babylonjs/core'" lib/game/flumes/` → exit 1                                                        |
| No module-scope `window`/`document`/`navigator`  | **PASS** — 0 hits anywhere in the folder, not merely at module scope                                                                                                          | `grep -rn "window\.\|document\.\|navigator\." lib/game/flumes/`                                                       |
| No `Math.random` / `Date.now`                   | **PASS** — 0 hits. Four `performance.now()` in `main.ts`/`materials.ts` time the build on the main thread only, as 28 other call sites in `lib/game` do                        | `grep -rn "Math.random\|Date.now" lib/game/flumes/`                                                                  |
| `pnpm test:game` green                          | **PASS** — exit 0, and it now runs `test:game-flumes` (94/94)                                                                                                                 | `pnpm test:game`; `pnpm test:game-flumes`                                                                            |
| `npx tsc --noEmit` clean                        | **PASS** — exit 0                                                                                                                                                             | `npx tsc --noEmit`                                                                                                   |
| `npx eslint lib/game/flumes` clean               | **PASS** — exit 0, no output                                                                                                                                                  | `npx eslint lib/game/flumes`                                                                                         |
| `pnpm test:game-lint`                            | **PASS** — 260 files clean                                                                                                                                                    | `pnpm test:game-lint`                                                                                                |

**On the diff gate.** The two lines in `package.json` are `"test:game-flumes": …` and its insertion
into the `test:game` chain — i.e. request §1 of this module's own request file, executed. It carries
no logic, no content and no behaviour, and the commission handed it to me as an established fact
("now wired into `pnpm test:game`"). I record it because the rubric's wording is absolute and a
future critic should not find it unmentioned; I do not fail the round on it, and the round fails on
its total anyway. If the project wants the gate to stay absolute, the fix is for the integrator to
land that hunk as its own commit.

---

## 3. The frames I looked at

Nine harness frames, six hand-posed. `--step=1200` is required for riders (the report says so) and
it also advances the clock ~59 park-minutes **after** `setTimeOfDay`, so every "18:30" frame in this
project — the builder's and mine — is really **19:29**, and every "23:00" is 23:59. Harness
behaviour, not the module's; noted so nobody re-derives it.

| Frame                                            | What is actually in it                                                                                                                                                                                                                                             |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `critic-f1/0900-overview.png`                    | An empty green field, a "showcase:flumes:missing" toast, 77 draw calls. The production build predates the module. **Not evidence about the module** — evidence about which server to use.                                                                            |
| `critic-f1d/0900-overview.png`                   | The complex from 340 m: a legible little water park occupying ~18 % of the frame width, purple pipe spiral, magenta raft trough, teal chute, two racing lanes, pools between. Legible, and no more than the report claims for it.                                    |
| `critic-f1d/0900-close.png`                      | The best daylight frame: the teal body chute sweeps the foreground on braced steel columns over the lagoon, a white-blue sheet running inside it, sun shadows on the pool deck. The two mid-distance run-out lanes read as **empty white boxes** — the showcase gave them `white-ceramic` tile and at 09:00 they look drained. |
| `critic-f1d/0900-ground.png`                     | Eye level behind a lit run-out lane; two chutes descend at the camera from a steel and a timber lattice. No rider is resolvable at 40–80 m. The right-hand chute is a **flat white ribbon** with no water colour left in it.                                          |
| `critic-f1b/1830-overview.png` (19:29)           | Near-black. The whole complex is a smudge with two faint cyan pool glows in it. Nothing this module draws is visible at 340 m after sunset.                                                                                                                          |
| `critic-f1b/1830-close.png` (19:29)              | The pools' underwater lamps carry the entire frame; the flume trough crossing it is a **pale grey kerb**, its teal gone, unlit, with no emissive trim and no reflection of the water it hangs over.                                                                   |
| `critic-f1b/1830-ground.png` (19:29)             | Same, from the deck. The timber lattice reads well as a silhouette. The chutes are white plastic.                                                                                                                                                                    |
| `critic-f1c/2300-overview.png` (23:59)           | A dim patch of ground. I cannot find the warm chase light from here.                                                                                                                                                                                                |
| `critic-f1c/2300-close.png` (23:59)              | One warm spill on a basin at the top left — the `torrent-racer` rig doing its job — and otherwise the pools again. 72 draw calls.                                                                                                                                    |
| `critic-f1c/2300-ground.png` (23:59)             | The one night frame with any flume colour in it: amber on a timber column. The chute above it is unlit.                                                                                                                                                              |
| `critic-f1-detail/raft-hook.png`                 | 16 m from the raft hook: a yellow raft with **five teal capsule-clusters heaped in it**, two of them over the rim. They do not read as five people sitting down; they read as a pile of cylinders. The sheet under them is opaque white.                              |
| `critic-f1-detail/raft-hook-2.png`               | **The frame that proves the module's one idea.** From outside the hook, the near (loaded) wall is unmistakably taller than the far one, moulding seams visible across it. This is a photograph of a real flume detail and nothing else in the project does it.        |
| `critic-f1-detail/body-hook.png`                 | The purple closed pipe with its crown slot and helix reads correctly as a tube slide; the magenta raft trough, the teal body chute and a bracing forest underneath. Good frame.                                                                                       |
| `critic-f1-detail2/mat-lane.png`                 | The mat racer from below: low kerbs, a pale blue-white sheet with sparkle. The run-out really is blue-green, as claimed.                                                                                                                                             |
| `critic-f1-detail2/raft-night.png` (22:19)       | At midnight the water sheet is the **brightest thing in the frame** with nothing lighting it — a strip of white paper down a plum trough.                                                                                                                            |
| `critic-f1-tower/chute-start-body.png`           | The teal deck-and-canopy plate lying flat **on the grass** while its chute runs 12 m overhead on `track` supports; a second (magenta) stub on the lawn behind it.                                                                                                    |
| `critic-f1-tower/chute-start-raft.png`           | Same for the raft: chute starts at 14.6 m on timber columns, canopy + deck + stair on the ground beside them, tube slide's teal stub visible in the mid-distance.                                                                                                     |
| `critic-f1-tower/tower-stub-body.png`            | Eye level. The tower is a knee-high teal table under the flume.                                                                                                                                                                                                     |
| `critic-f1-detail2/tower-stair.png`, `tower-timber.png` | The same thing framed as the report frames it. What the report calls "the tower's cross bracing" is `flume-legs` — `track`'s support lattice, painted with the tower spec's steel colour.                                                                       |

---

## 4. Findings, ranked

### 1. Every tower in the game is 2 metres tall and stands on the ground under the flume

`main.ts:306`

```ts
const deckY = flume.position[1] + flume.towerHeight;
```

`flume` here is the **pre-build** resolve (`main.ts:252`), and `resolve.ts:209` sets
`towerHeight: data.towerHeight ?? layout.towerHeight` — which is **0 for every built-in layout**,
because 0 is the sentinel that means "derive it from the descent". The derived height lives on
`build.flume.towerHeight` (`resolve.ts:256-257`), and `main.ts` reads that correctly in three other
places — the night light at `:416`, its range at `:422`, the focus target at `:650` — and not here.

So `buildTower` gets `deckY = ground`, `height = max(1, 0) = 1` (`geom.ts:562`), and everything
downstream collapses: `storeys = 1` (`:579`), `flights = 1` (`:629`), one 1 m flight of stairs, a
deck at ground level, a canopy at 2 m. Measured from the running scene, world bounding boxes of all
five slides (`.game-render/critic-f1-detail2/probe.json` and my `_critic-probe2` run):

| Mesh                 | world minY … maxY | should reach          |
| -------------------- | ----------------- | --------------------- |
| `flume-tower:*` (×5) | −0.25 … **2.00**  | 11.8 / 14.1 / 14.6 / 16.3 / 12.7 m |
| `flume-deck:*` (×5)  | −0.18 … **1.00**  | the deck              |
| `flume-canopy:*` (×5)| 1.98 … **2.43**   | above the deck        |
| `flume-shell:*`      | 0.32 … **12.0–17.5** | (correct)          |

Every number in that table is reproduced by hand from the code with `deckY = 0`: railY = 1.05,
canopy posts to 1.95, canopy boxes 1.98–2.04 and 2.15–2.43, tower steel top 2.00. It is not a
rendering artefact.

Three consequences.

- **The report's §1 pillar is false as drawn.** "Every slide starts on a steel or timber tower with
  columns, cross bracing, a deck cut around the chute, a handrail, a switchback stair and a canopy"
  — all of that geometry exists and all of it is on the lawn. What the frames show holding the
  chute up is `flume-legs`, `track`'s `buildSupports`, painted `flume.tower.steel`.
- **The switchback stair cannot happen.** `flights = max(1, round(1/3.2)) = 1`, so the mirrored-
  return-flight bug the report says it found by opening the pictures and fixed is not exercised by
  anything in the shipped scene. It may well be fixed; nothing in this build can show it.
- **The night light hangs in mid-air.** `:416` puts it at `towerHeight + 0.5` ≈ 15 m, correctly,
  above a structure whose top is at 2.00 m.

Fixed: `const deckY = build.flume.position[1] + build.flume.towerHeight;`. Cost, measured by
building each tower at both heights: **+8,308 triangles over the four built-in slides**
(1,104 → 2,692–3,640 each), which takes the module from 82,836 to ~93,000 and changes nothing about
the budget verdict.

### 2. The selftest makes the identical mistake, which is why 94/94 is green

`selftest.mjs:314-321` builds its tower from `flume.towerHeight` — the same pre-build zero — and
then prints `tower: build.flume.towerHeight` (`:349`), the derived 14.1 m, in the same table row.
The suite therefore reports a 14.1 m tower beside the triangle count of a 1 m one, and nothing
compares them. That is also why the per-layout `tris` column (12,856 for `plunge-drop`) matches the
scene probe exactly (8,588 shell + 3,164 water + 912 + 168 + 24): both halves are wrong in the same
direction.

A check that would have caught it: the tower's own vertex extents against `build.flume.towerHeight`.

### 3. `wallResponse: 0` is not what keeps a closed pipe's section, and the check that says so is vacuous

The report and `geom.ts`'s docblock both rest on "A closed pipe declares `wallResponse: 0` and keeps
its section — by data, not by a special case." There is indeed **no branch** (verified: I registered
a fifth style from a pack and the same code path drew it). But the coefficient is dead on that
style. The clamp at `geom.ts:184-188` floors the result at `style.wrap`, and the `tube` style's
resting wrap is 170°, while the largest extent the rule can ever ask for on a 0.6 m pipe is

```
climb 86.8° (40 m/s in a 9 m hook) + body 23.9° + freeboard 12° = 122.7°  <  170°
```

so `needed − wrap` is negative at any speed and the clamp returns `wrap`. Measured directly, at
6 / 14 / 25 / 40 m/s × `wallResponse` 0 / 0.5 / 1, with `maxWrap` opened to 178°: **170.0° in all
twelve cases.** The selftest's proof (`:244-246`) pins `wrap === maxWrap === 170°`, so it would pass
with any response value whatsoever.

Worse, the parameter is not pinned anywhere else either. I re-ran the four built-in layouts with the
coefficient deleted from the formula (hard-coded 1) and checked every assertion that touches it:

| layout         | `wallResponse` | Δwall as shipped | Δwall with the coefficient deleted | selftest gate |
| -------------- | -------------: | ---------------: | ---------------------------------: | ------------- |
| `plunge-drop`  |            1   |          11.9°   |                             11.9°  | still passes  |
| `spiral-tower` |            0   |           0.0°   |                              0.0°  | still passes  |
| `family-bowl`  |         0.85   |          18.5°   |                             21.7°  | still passes  |
| `mat-straight` |          0.8   |          17.2°   |                             21.5°  | still passes  |

**`wallResponse` could be removed from `wallExtents` and all 94 checks would stay green.** That is
the answer to "would the selftest fail on a reintroduced bug": for this parameter, no. Everything
else it pins — the tangent continuity, `climb = atan(v²/gR)` to 1e-9, the sign of the loaded side,
the winding, the arrival speed, the exit clearance, the byte-identical round trip — is real and
would fail.

### 4. Both headline wall numbers are correct, and the shipped slides never reach them

I recomputed from scratch — my own `θ = atan(v²/(gR))`, my own `R(1 − cos φ)` — rather than calling
their function, and then compared:

| case                                    | my arithmetic | `wallExtents` | report |
| --------------------------------------- | ------------: | ------------: | -----: |
| 0.5 m body trough, 9 m hook, 6 m/s      |       27.2 cm |       27.2 cm |  27 cm |
| same, 12 m/s                            |       57.9 cm |       57.9 cm |  58 cm |
| raft, 12 m hook, max-climb station      |             — | **100 / 64 cm** at −18.9°, 7.6 m/s | 100 / 64 cm at 19°, 7.6 m/s |

Confirmed to the centimetre, including the asymmetry. The derivation is the motorcycle-lean
argument and it is right; adding the vehicle half-width as an arc rather than an `asin` is right and
is necessary (a 2.6 m raft in a 2.4 m trough has no `asin`).

The caveat the report does not put beside the headline: those two figures are computed on a **level,
unbanked** trough. A built slide banks at `bankFactor` of the perfect bank, so the largest climb
anywhere in the catalogue is **28.8° at 9.3 m/s** and the body slide's real wall difference is
**27 → 36 cm**, not 27 → 58. The report does give 27 → 36 under `detail-body-hook`, so this is a
framing nit rather than a false claim — but "58 cm" is a number no slide in the game produces.

### 5. At night this module contributes grey ribbons and one light

Confirmed as admitted (§5.8) and worse than the wording suggests. Of five slides, two declare a
`night.light`; the `medium` light pool is 2, so raising the preset adds nothing. The scene probe
found exactly two `flumes-night:*` point lights. There is no emissive trim, so at 19:29 and 23:59
the gelcoat's colour is gone entirely and the trough reads as a concrete kerb
(`critic-f1b/1830-close.png`, `critic-f1c/2300-close.png`), while at 340 m the module is invisible
(`critic-f1c/2300-overview.png`). Against the art bible's "the park is alive … ride light rigs,
water reflecting it all", the flumes are the dead part of the night frame — and a water park at
night is one of the two pictures this module exists to make.

The inverse problem at close range: the water sheet is `envExempt` and keeps a high albedo, so at
22:19 it is the **brightest surface in the frame** with no light source on it
(`critic-f1-detail2/raft-night.png`).

### 6. The water reads as white plastic, and the report's diagnosis of why is incomplete

§5.4 blames the foam ramp: "anything above about 25° of gradient is fully white … most of the
visible trough on a steep slide is a white ribbon". Measured over arc length, the ramp is kinder
than that — the fraction of each run where the centre of the sheet saturates (`foam ≥ 0.95`) is
**7 % / 6 % / 5 % / 10 %** for the four built-ins (15–18 % at the sheet's edges, where the `+0.22`
edge term lands), and the mean `foam` is 0.34, i.e. a pale blue-green vertex colour.

And yet the sheet renders white at 13 m on a moderate hook (`critic-f1-detail/raft-hook-2.png`) and
on a level mat lane it renders pale blue (`critic-f1-detail2/mat-lane.png`). So the ramp is not the
whole cause: the material's own response under a bright sun is taking a (0.49, 0.68, 0.80) vertex
colour to near-white. Round 2 should not spend its effort re-tuning the ramp on the strength of the
report's diagnosis; it should look at the sheet's albedo and its lack of any transparency — you
cannot see the trough through the water at any distance, which is the single largest reason it reads
as plastic rather than as 3 cm of running water.

### 7. The riders are a heap, not five people

Admitted (§5.5) as "four capsules … teal blocks"; what the frame adds is the **arrangement**.
`buildRig` lays `rig.seats > 1` out on a **circle** of radius `seatSpread` (`geom.ts:800-806`), so
the raft's five riders sit in a ring — from any camera they overlap into one clump and two of them
hang over the hull's rim (`critic-f1-detail/raft-hook.png`). A raft seats people around the tube
facing in; a ring of identical capsules at 0.66 m does not say that. This is cheaper to fix than the
colour buffer the report nominates as "the cheapest visible improvement left".

### 8. The showcase's own basins read as drained in daylight

Both run-out lanes are created with `tile: 'white-ceramic'` (`showcase.ts`), and at 09:00 they are
white boxes with no water read at all (`critic-f1d/0900-close.png`, mid-distance). The lagoon
beside them, with `aqua-mosaic`, reads as water immediately. The staging choice is this module's.

### 9. Extensibility: three real limits behind a genuinely open system

- `rig.hull` is a closed four-way enum in this module's **own** schema (`manifest.ts` `rigSchema`)
  and `buildRig` branches on it (`geom.ts:712 / 740 / 781`). A pack can ship a new slide style, a
  new tower and a new descent with no code — it cannot ship a new **vehicle shape**. Defensible
  (somebody has to generate a mesh), worth stating, and it is the one place the module switches on
  a content-declared value.
- Styles, towers and layouts are keyed by **bare id** in three module-scope maps
  (`manifest.ts` `registerFlumes`), while `key` carries `pack:id`. Two packs that both ship a style
  called `body` silently overwrite each other, last one wins, no warning. The docblock frames this
  as the feature ("a pack that redefines `body` overwrites it by id"); it is also a collision.
- `resolve.ts:181`: `const trackStyleId = def.trackStyle ?? 'fiberglass-open'` — one content id from
  the bundled packs written into TypeScript as a default.

### 10. A save loses the riders in the air, and with them their descents

Disclosed as a design decision, and it is the right one. The consequence is not stated: `descents`
is a saved lifetime counter, so every save/load permanently drops the riders who were mid-descent.
Measured on my own three-flume world — 3,333 ticks, save, reload, then 777 more ticks on both:

```
original  {"f-a":{"descents":16},"f-b":{"descents":6},"f-c":{"descents":13}}
reloaded  {"f-a":{"descents":14},"f-b":{"descents":5},"f-c":{"descents":11}}
```

`sinceDispatch` is identical in both (7.5 / 9.5 / 10.5), so the phase survives exactly as designed.
A park saved often enough will under-report its own ride count.

---

## 5. Extensibility, tested rather than read

The claim in the report is that the showcase registers a pack **after** `main()` has run, adding a
fifth style, a layout and a ride, and that it draws with no line about it in the module. It does.
The scene probe finds `flume-shell:flume-10` wearing `flume-gelcoat:#ffb03a`, `flume-hull:torrent`
and `flume-rider:torrent` with live thin instances — a style, a rig and a colour that exist only in
`showcasePack()`. `grep -rn "torrent" lib/game/flumes/` finds it in `showcase.ts` and in the
selftest's late-pack fixture, nowhere in the module's own code paths.

Then I tried to break it, with a style deliberately unlike all five:

```jsonc
{ "id": "wave-lane", "wrapDeg": 20, "maxWrapDeg": 178, "floorFlat": 0.85, "thickness": 0.4,
  "sectionSamples": 4, "friction": 0.5, "dragArea": 6, "vehicleMass": 400, "bankFactor": 1,
  "rig": { "hull": "raft", "hullRadius": 3, "seats": 8, "seatSpread": 1.4 } }
```

plus a `concrete-mast` tower (9 × 3 m footprint, 1 m columns, `canopy: false`, 6 m flights) and a
324 m layout built from a 2.5-turn helix, an s-bend and a 55° drop. Registered through
`registerFlumes` as a third pack: **3 entries accepted, resolves to the new style and the new tower,
324.2 m of trough, 22.8 m drop, exit at +0.40 m, wall spread 69.6°, no NaN in any vertex array, no
warnings.** The tower spec, the section, the vehicle, the friction model and the wall rule all came
off the manifest. That is a real 8.5.

---

## 6. Budget, re-measured

`.game-render/critic-f1d/report.json` (09:00, `--step=1200`), against the builder's figures:

| camera   | draw calls | triangles | active meshes | report says |
| -------- | ---------: | --------: | ------------: | ----------- |
| overview |    **233** | **349,702** |         125 | 233 / 349,702 |
| close    |    **175** | 321,922   |            67 | 175 |
| ground   |    **161** | 300,212   |            53 | 161 |

At 23:59, with no sun cascade to draw into, the same scene is **130 / 72 / 58** draw calls
(`critic-f1c/report.json`) — the daylight figure is mostly shadow passes, which is worth knowing
before anyone optimises the wrong thing.

My own scene probe, at tick 2848 with 9 vehicles and 16 riders in the air:

- **44 flume meshes** — exactly as reported: 7 per slide (shell, water, legs, pads, tower, deck,
  canopy) + 9 shared rig meshes (5 riders, 4 hulls; the body slide's hull is `none`).
- **82,836 flume triangles** of **341,528** in the scene — 24 %. The report's 82,472 is the same
  measurement with fewer riders in the air.
- **18 materials**, exactly as reported, four texture sets shared across them.
- 2 night lights, the `medium` pool, and only two slides declare one.

One mesh per surface per slide with `freezeWorldMatrix()`, thin instances for hulls and riders, one
texture set per look: this is the right shape, and 44 draw calls of a 1,200 whole-game budget for
five slides is a defensible share. The two costs: **no LOD** — `flume-shell:flume-2` is 22,040
triangles (27 % of the module) and is drawn whole at 340 m where it is two pixels wide — and the
figures above are of a scene missing the tower.

---

## 7. What is genuinely good, and must survive round 2

- **The wall rule.** It is correct physics, correctly derived, evaluated at `track`'s own adaptive
  stations against `track`'s own energy march, and it is **visible in a photograph**
  (`critic-f1-detail/raft-hook-2.png`). No other module in this project has an idea this specific
  and then delivers it in the frame.
- **The content path.** Built-ins go through the same parser as packs, per-entry so one bad entry is
  skipped rather than taking the pack with it, `registry.packs()` **and** `onPack`, and a fifth
  style from a late-registered pack really draws. Do not refactor this.
- **Reuse.** The centreline, the spline, the frames, the curvature, the energy march, the adaptive
  spacing and the columns are all `track`'s. There is no second spline in this module. That is why
  a slide's geometry is right in the first place.
- **The derived tower height** (`resolve.ts:242-257`) — build once from the ground, measure the
  fall, rebuild from a tower that tall — is a good derivation that replaced five hand-kept numbers.
  It is not the derivation that is broken; it is one line that fails to read it.
- **The closed pipe reads as a closed pipe** (`critic-f1-detail/body-hook.png`), crown slot and all.
- **The report's §5.** It named the guest hole, the unexecuted demo-park placement, the stale dusk
  frames, the dead `tint` field and the two clocks before I could, and its budget numbers reproduce
  to the triangle. That is worth more than the 5.5 the frame descriptions cost it.

---

## 8. Round 2, first thing

**Fix `main.ts:306` to read `build.flume.towerHeight`, take the same three frames again, and then
fix `selftest.mjs:314-321` so the tower it measures is the tower the scene draws** — every other
finding here is smaller than a five-slide park whose towers are lying on the grass.
