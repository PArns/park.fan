# track — critic, round 1

Module: `lib/game/track/` · showcase `/game?showcase=track` · commit `0425afb`.

Frames taken by me with `scripts/game-shot.mjs` into `.game-render/critic-track/`,
`.game-render/critic-track-1830/`, `.game-render/critic-track-2200/`, plus seven of my own camera
probes into `.game-render/critic-track-mine/` (the harness only offers the three core presets, and
none of them puts the loop side-on). Every PNG named below was opened and looked at. Numbers come
from `report.json`, `.game-render/critic-track-mine/probe.json`, `.game-render/soak.json` and three
probe scripts left beside them in `.game-render/` (`probe.mjs`, `leak.mjs`, `save.mjs`, `ext2.mjs`).

**Weighted total: 8.00. FAIL** (pass is 8.5). Every hard gate passes; extensibility is well clear
of the 5.0 floor. This is a strong module with one axis dragging it: the wooden coaster's structure
is wrong at every distance, and the report blames a distance-aliasing problem for something that is
already wrong at 60 m.

## 1. Scores

| #   | Axis                  | Weight | Score | One sentence                                                                                                                                                                  |
| --- | --------------------- | -----: | ----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The frame             |   30 % |   7.4 | The steel half is photographic — clothoid loop, X-braced bents, concrete pads, real shadows, four working times of day — and the timber half is a row of bare poles.          |
| 2   | Fidelity              |   20 % |   7.6 | The physics fidelity is the best thing here (the loop's radius really does run 29.5 → 7.2 → 21.3 m), the structural fidelity of the timber and of the loop's supports is not. |
| 3   | Extensibility         |   20 % |   8.4 | A whole new coaster type is one manifest entry and builds; a new _element_ is data too, but the pack path that would deliver it is connected to nothing.                      |
| 4   | Budget and behaviour  |   15 % |   8.6 | 14 draw calls for 2,489 m of track, zero leak over three rebuild cycles, and a 0.9 s main-thread hitch the first time a coaster is built.                                     |
| 5   | Determinism and state |   10 % |   9.4 | No `Math.random`, no `Date.now`, no owned world state, and save → load → save is byte-identical at 447,765 bytes.                                                             |
| 6   | Honesty of the report |    5 % |   7.0 | Eight ranked weaknesses, most of which I confirmed — spoiled by five numbers in it that the running scene does not agree with.                                                |

**7.4 × 0.30 + 7.6 × 0.20 + 8.4 × 0.20 + 8.6 × 0.15 + 9.4 × 0.10 + 7.0 × 0.05 = 8.00.**

## 2. Hard gates

| Gate                                            | Command                                                                                                  | Result                                                                                                                                                                        |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Console errors / hydration warnings             | `node scripts/game-shot.mjs --showcase=track …` ×3 runs                                                  | **PASS** — `errors 0 · warnings 0 · hydration 0` in all three `report.json`, 12 shots                                                                                         |
| Barrel import                                   | `grep -rn "from '@babylonjs/core'" lib/game/track/`                                                      | **PASS** — no hits                                                                                                                                                            |
| `window`/`document`/`navigator` at module scope | `grep -rn "window\.\|document\.\|navigator\." lib/game/track/*.ts`                                       | **PASS** — no hits anywhere, not just at module scope                                                                                                                         |
| Coupling                                        | `grep -rn "from '\.\./" lib/game/track/`                                                                 | **PASS** — 10 imports, all into `core` (`types`, `world`, `registry`, `pack-schema`); core has no barrel and `paths`, `scenery`, `demo-park` import `core/world` the same way |
| `npx tsc --noEmit`                              | as written                                                                                               | **PASS** — exit 0, clean                                                                                                                                                      |
| `npx eslint lib/game/track`                     | as written                                                                                               | **PASS** — exit 0, no output                                                                                                                                                  |
| `npx prettier --check lib/game/track`           | as written                                                                                               | **PASS** — "All matched files use Prettier code style!"                                                                                                                       |
| `pnpm test:game`                                | as written                                                                                               | **PASS** — save round-trip, registry, lint, i18n, `test:game-track` (**95 checks clean**), soak all green                                                                     |
| Module selftest                                 | `node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/track/selftest.mjs` | **PASS** — `✓ track selftest: 95 checks clean`                                                                                                                                |
| Extensibility ≥ 5                               | see §4.4                                                                                                 | **PASS** — 8.4                                                                                                                                                                |
| Touched only its own folder                     | answered by the integrator                                                                               | **PASS**                                                                                                                                                                      |

## 3. The frames I looked at

Twelve harness frames (4 times × 3 cameras) and seven probes of my own.

| File                                  | What is actually in it                                                                                                                                                                                                                                                                                                           |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `critic-track/1200-overview.png`      | Three layouts on a bare green plain from ~340 m. The two steel ones read as coaster shapes — the loop is a legible ring on the left. The wooden one is a brown-grey speckle field, not a structure. No station, no train, no scenery anywhere.                                                                                   |
| `critic-track/1200-close.png`         | The looper from ~40 m: red twin rails on a box spine, a ladder of crossties, X-braced bents with ledgers, grey concrete pads, the loop and a turnaround behind, and the whole structure's shadow across the grass. The frame the module stands on.                                                                               |
| `critic-track/1200-ground.png`        | Eye height under the blue family coaster's airtime hill — the round tube spine reads as a separate member from the rails, the columns read as steel, the looper's dense red columns behind.                                                                                                                                      |
| `critic-track/0900-overview.png`      | Same as 12:00 with longer shadows; the wooden coaster's shadow is more legible than the coaster.                                                                                                                                                                                                                                 |
| `critic-track/0900-close.png`         | Best of the harness set: raking light, the loop standing clear against the sky at frame right, footings and their shadows sharp.                                                                                                                                                                                                 |
| `critic-track/0900-ground.png`        | As 1200-ground, warmer. Grass tiling is visible as a repeat in the near field.                                                                                                                                                                                                                                                   |
| `critic-track-1830/1830-close.png`    | Sunset behind the structures, paint goes warm without going orange, footings read as pale pads on dark grass. Shadows are nearly gone, so the frame flattens.                                                                                                                                                                    |
| `critic-track-1830/1830-ground.png`   | Blue coaster against a graded dusk sky; the silhouette survives.                                                                                                                                                                                                                                                                 |
| `critic-track-1830/1830-overview.png` | The weakest frame in the set, exactly as the report says: dark scribbles on dark grass, the loop barely findable.                                                                                                                                                                                                                |
| `critic-track-2200/2200-close.png`    | Night. Unlit red steel against a starfield, moon visible. Reads as a silhouette study; nothing on the ride is lit.                                                                                                                                                                                                               |
| `critic-track-2200/2200-ground.png`   | Blue coaster silhouetted, still individually identifiable by its hill shape.                                                                                                                                                                                                                                                     |
| `critic-track-2200/2200-overview.png` | Starfield over a dark plain; the three layouts are faint outlines.                                                                                                                                                                                                                                                               |
| `critic-track-mine/loop-side.png`     | **The loop, side-on at 55 m.** It is a teardrop: the entry and exit legs splay apart at the bottom and the crown pinches tight. It is also standing entirely on its own — nothing touches the loop between the two footings under its entry and exit.                                                                            |
| `critic-track-mine/loop-side-far.png` | Same at 95 m: the whole looper reads, the loop still reads, the wooden coaster behind is a speckle band.                                                                                                                                                                                                                         |
| `critic-track-mine/bank-turn.png`     | Three-quarter view over the overbanked return leg: the bank is visible and correct, the loop reads as a teardrop from this angle too, the blue coaster's structure sits behind. The prettiest frame the module produces.                                                                                                         |
| `critic-track-mine/family-helix.png`  | The descending helix from above: banked inward, X-braced bents inside the helix, crossties legible, its shadow a clean double spiral.                                                                                                                                                                                            |
| `critic-track-mine/wood-hill.png`     | **The frame that costs the module the round.** The wooden coaster's big hill from ~60 m — no aliasing at this distance — is a row of bare vertical poles about 2–3 m apart with a single thin X low down in occasional bays. No continuous lattice, no tiered bracing, no ledgers up the height. It reads as a vineyard trellis. |
| `critic-track-mine/wood-station.png`  | Where the station is: ordinary track on ordinary bents, no platform, no shed, no gate. The lift hill behind is a black jagged mass at ~100 m.                                                                                                                                                                                    |
| `critic-track-mine/loop-3q.png`       | Loop from 70 m at three-quarters: the teardrop is unmistakable — a tight crown over splayed legs — and so is the fact that nothing touches it; columns pick up again only where the track leaves the loop. Wooden coaster a grey smear at ~200 m top-left.                                                                       |

## 4. What I measured myself

### 4.1 The loop, which is the module's headline claim

Sampled `frameAt(id, s)` every 1 m along `coaster-1` and differenced the tangent to get κ
(`probe.mjs` → `probe.json`). The loop occupies s = 246…330 m:

| s (m) | height (m) | radius 1/κ (m) |  up·y |
| ----: | ---------: | -------------: | ----: |
|   246 |        4.4 |           29.5 |  0.99 |
|   258 |        8.9 |           21.8 |  0.80 |
|   270 |       18.5 |           15.9 |  0.28 |
|   282 |       29.8 |            8.9 | −0.66 |
|   288 |       32.6 |        **7.2** | −1.00 |
|   300 |       25.5 |           11.0 | −0.20 |
|   324 |        7.7 |           21.3 |  0.96 |

The radius falls monotonically to the crown and opens again on the way out — a genuine clothoid,
not a circle with a fillet, and the frame (`loop-side.png`) shows the teardrop it produces. Loop
height 28.6 m over a 33.2 m footprint. Vertical g runs −0.40 … **4.20** on this layout
(`track.physics('coaster-1')`), which is the number the report gives, and a circle of the same
crown radius would have given ~6 and ~0.

**Where the report and the spline disagree:** the report says the loop "enters on a 17.8 m radius
and tops out on 6.3 m". The shipped spline enters on 23.7–29.5 m and bottoms out at 7.2 m at the
crown. The energy model agrees with the spline and not with the report — v at loop entry is
28.85 m/s, so v²/(3.4 g) = 24.9 m, and at the crown v² ≈ 250–271 gives 7.5–8.1 m. The shape claim is
confirmed; the two radii quoted for it are not.

### 4.2 The other reference claims, checked

- **Banking follows the resultant.** Visible in `family-helix.png` and `bank-turn.png`, and the
  numbers back it: lateral g peaks at 0.74 (Nordwind), 0.44 (Alte Mühle, deliberately under-banked
  at `bankFactor: 0.78`) and 0.30 (Kleiner Kreisel) — from `probe.json`.
- **Support spacing follows load, and differs by material.** `BASE_SPACING = { timber: 3.2, steel:
9.5 }` (supports.ts:67) scaled by local g and column height, which is why the close frames show
  crowded bents under the pull-out and open bays on the straights. Defensible and researched.
- **Wooden airtime.** `Alte Mühle` measures 11.96 s below 0.3 g on a 900 m out-and-back. That is
  the right shape for the ride it claims to be.
- **All three layouts complete with zero issues** and closures of 0.85 / 1.33 / 2.17 m over 979 /
  900 / 610 m — printed by the showcase itself to `console.info`, captured in `probe.json`.

### 4.3 Fidelity failures the report did not name

1. **The timber structure is not a wooden coaster's structure.** `wood-hill.png` at 60 m, with no
   aliasing to blame, shows bare poles. supports.ts:269 skips bracing on every second bay and
   justifies it as "how a real wooden coaster is braced" — real wooden coasters brace every bay,
   longitudinally and laterally, and the bracing is stacked in roughly square panels up the height.
   Here `drawBracing` puts **one X in a bay whatever the bay's height**, so a 3.2 m wide, 20 m tall
   bay gets a single near-vertical member instead of six stacked panels. The report's weakness #1
   frames this as a 340 m aliasing problem and proposes a distance LOD; a distance LOD would not fix
   `wood-hill.png`.
2. **The loop stands on nothing for 25 m.** `loop-side.png` and `bank-turn.png`: between the footing
   under the entry and the one under the exit, no member touches the loop. The report (weakness #2)
   calls this "correctly unsupported in reality too". The top _half_ of a loop is; the crown of a
   real vertical loop is normally tied back to a column that runs up beside it, which is also what
   stops the thing reading as a decal in the frame.
3. **The circuit-closure residual is never escalated.** Rebuilding `Nordwind` against a different
   train (`ext2.mjs`) gives `closure.position = 8.87 m` with `closure.pitch = 0.396 rad` (22.7°) —
   and `built.warnings` is `[]`, `physics.issues` is `[]`. The blend over the last quarter absorbs it
   silently. The report names the underlying property (weakness #3, "closed 5 m worse") but the
   measured figure is 8.87 m and 22.7° of pitch, and nothing in the module says so at any magnitude.
4. **Nothing renders a station** (report weakness #5, confirmed in `wood-station.png`) and nothing
   lights the ride at night (`2200-*.png`). Both are correctly assigned to other modules; both are
   why the showcase does not read as a place.

### 4.4 Extensibility, probed rather than read

**The op layer holds up.** `TRACK_OPS` (ops.ts:525) is exactly the ten claimed —
`straight turn pitch bank roll crest loop spin hill ramp`. `grep -rn "switch ("` over the module
returns two hits and neither switches on a content id: `build.ts:344` on `DriveKind` and
`textures.ts:68` on `SurfaceKind`. No `new Function`, no `eval` — the expression evaluator is
hand-written, as claimed.

**A new coaster type is one manifest entry, and I built one** (`ext2.mjs`). A pack with a
`trackStyles` entry (`chrome`, wider gauge, denser ties), a `trainStyles` entry and a `rides` entry,
registered through `registry.registerPack()` with no TypeScript anywhere:

```
styles now: core-classic:wood, core-classic:steel-box, core-classic:steel-tube, critic-pack:chrome
new type: len 994 m · closure 8.87 m · maxG 4.10 · issues none
```

It resolves, builds, banks, simulates and extrudes. That is the axis's own worked example and it is
a clean pass.

**A new element is data — but the pack seam is dead.** The element format works: a `dive-drop`
defined as JSON (`ops: [{ op: 'ramp', args: { height: '-$height', … exitRadius: '$height * 0.9' } }]`)
registered through `registerTrackElementsFromPack` and built a 274.3 m layout with 5 segments
(`ext-test`). But the delivery path does not exist:

```
trackElements present after registerPack():        false
trackElements present in onPack listener arg :     false
registerTrackElementsFromPack(parsed) registered:  0
registerTrackElementsFromPack(rawJSON)  registered: 1 → Dive drop
```

Core's `parsePack` is plain `z.object(…)`, which **strips** unknown keys, so the field is gone
before any consumer sees it. elements.ts:76 claims the opposite — "a pack that ships one now
(through `loadPackFromUrl`, whose JSON zod simply passes unknown keys through) works already" — and
that is false as measured. Worse, `grep -rn registerTrackElementsFromPack lib/ scripts/` finds
**zero call sites** outside the module's own `index.ts` re-export: nothing calls it on boot, on pack
load, or anywhere else. Core already publishes `registry.onPack(fn)` (registry.ts:130), so a
listener in `main.ts` and `sim.ts` would wire this today with no core change and no request pending.

Verdict on the question the brief asks: the module's own `registerTrackElement` path is a **pass**
for "elements are data", and a **fail** for "an element arrives by manifest". Since the axis's
named test — a new coaster type — is a full pass and the element grammar itself is exemplary, this
is a deduction and not a gate: **8.4**.

### 4.5 Budget and behaviour

From `probe.json` (`track.stats()` in the running scene) and the three `report.json`:

- **14 meshes, 177,196 triangles, 217,724 vertices** for 2,489 m of track, 569 columns, 1,101
  braces. Five meshes per coaster except the wooden one, which has no spine (4). Ties and footings
  carry `addLODLevel(d, null)`. The report's figures match to the triangle.
- **Whole scene: 47–107 draw calls** (peak at `12:00 overview`), against ≤ 300 for a module's
  showcase and ≤ 1,200 for the whole game. Track's own share is the 14 meshes. Triangles 135k–773k
  depending on camera, the spread being shadow passes.
- **Zero instances, zero thin instances** — 1,670 support members are welded into 14 meshes. That is
  the right call over instancing here (14 draws beats 1,670) and it is argued in `main.ts`. No
  penalty.
- **No leak.** Three `remove()` → `create()` cycles on all three coasters (`leak.mjs`) return to
  exactly `216 meshes / 16 materials / 30 textures / 215 geometries / 14 track meshes / 177,196
triangles` every time, with 0 console errors. Materials and textures are shared, not per-coaster.
- **Sim tick 0.00 ms** in all 12 shots — the showcase has no trains, so this measures nothing;
  `.game-render/soak.json` gives the whole-game mean 0.045 ms against a 6 ms budget (max 22.19 ms on
  one tick, which is the first).
- **A 0.9 s main-thread hitch.** `buildMs 314` + `textureMs 607` (probe.json). Textures are
  generated once and shared, so this lands the first time a player finishes a coaster, on the main
  thread, in one block. The report prints both numbers and never calls it a hitch.
- 71 triangles per metre of track, 51 % of the vertices in crossties (110,664 of 217,724). Ten
  coasters in a real park is ~600k triangles from this module alone; there is no whole-game triangle
  budget written down to weigh that against, and the report states a share of the draw-call budget
  only.

### 4.6 Determinism and state

- `grep -rn "Math.random\|Date.now\|performance.now" lib/game/track/*.ts` → four hits, all
  `performance.now()` used only to report `buildMs` / `textureMs`. Nothing seeded from a clock.
- The module owns no world state; a layout is its entity's `data`.
- `save.mjs`: `save()` → `load()` → `save()` is **byte-identical**, 447,765 bytes, 3 coaster
  entities, and after the load the module rebuilds to the same 14 meshes and the same 177,196
  triangles. 0 console errors.
- Same input → same triangle count across nine rebuilds (§4.5), which is the geometry half of the
  same property.

### 4.7 What the report gets wrong about itself

Five things the running scene contradicts, none fatal, all avoidable:

| Report says                                 | Measured                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| loop "enters on 17.8 m … tops out on 6.3 m" | 23.7–29.5 m entering, 7.2 m at the crown (`probe.json`)                        |
| Kleiner Kreisel lateral **0.51**            | `maxLateralG` = **0.298**                                                      |
| "`lib/game/track/` (19 files)"              | 21 (20 `.ts` + `selftest.mjs`); the file table omits `index.ts`                |
| "the element table — **19 entries**"        | **21** (`grep -c "^    id: '"`, and the registry reports 22 after I added one) |
| weakness #8: "181,656 track triangles"      | 177,196, which is what its own budget section says four paragraphs earlier     |
| weakness #1: "the 556 columns"              | 569 across all three layouts                                                   |

Against that: the weakness list is eight items long, ranked, and items #1, #2, #3 and #5 all
describe real things I found in the frames before reading them. That is what keeps this axis at 7.0
rather than below.

## 5. What to fix, most valuable first

1. **Give the timber structure a real lattice.** `wood-hill.png` at 60 m is bare poles; the
   alternate-bay rule (supports.ts:269) and the one-X-per-bay rule in `drawBracing` are what produce
   it, and the docblock defends them with a claim about real wooden coasters that is not true. Brace
   every bay, and stack the X's in roughly square panels so a 20 m column gets six and not one. This
   is 30 % of the grade and the wooden coaster is a third of the showcase. Worth: the difference
   between 7.4 and ~8.3 on axis 1, and it also fixes the overview smear the report ranks first —
   a coarser silhouette at distance is the LOD half of the same job.
2. **Tie the loop's crown to a column.** Nothing touches the loop over 25 m of its height
   (`loop-side.png`, `bank-turn.png`). The module already skips columns where `frame.up[1] < 0.2`
   (supports.ts:243); the missing piece is a member that meets the track from the side rather than
   from below. Also the largest single reason the steel frames read as CAD rather than as a ride.
3. **Wire the element seam, or delete the claim.** `registerTrackElementsFromPack` has zero call
   sites and core's zod strips `trackElements` before any listener sees it — measured, both. A
   `registry.onPack(m => registerTrackElementsFromPack(m))` in `main.ts` and `sim.ts` needs no core
   change; keep the schema request for validation, but stop the docstring saying it "works already".
4. **Escalate the closure residual to an issue.** 8.87 m and 22.7° of pitch on a train swap, with
   `warnings: []` and `issues: []`. `closure` is already computed; a `severity: 'warn'` above (say)
   1 m of position or 2° of pitch costs nothing and is exactly the "this layout no longer meets
   itself" API the report says is missing.
5. **Fix the six numbers in §4.7.** Two of them (the loop radii, the 0.51 lateral) are the report's
   own headline fidelity evidence, and a critic who checks them finds them wrong, which discounts the
   sixty that are right.
6. **Move or chunk the 607 ms of texture generation.** One-off and shared, but it lands on the main
   thread the first time a coaster is built, next to 314 ms of build.
7. **Say what the triangle share is.** 177,196 for three coasters is defensible; it is stated
   without a whole-game denominator, and at 71 tris/m a ten-coaster park is a number somebody should
   have decided on deliberately.

## 6. Verdict

**FAIL — 8.00 weighted, pass is 8.5.** No hard gate is failed: zero console errors across 12 shots,
no barrel import, no DOM at module scope, tsc/eslint/prettier/`pnpm test:game` all clean, 95
selftest checks, no cross-module reach past `core`, and extensibility at 8.4 is far clear of the
5.0 floor.

The physics and the grammar in this module are the best work I have graded: the loop is a measured
clothoid, the closure of three circuits was solved rather than eyeballed, a new coaster type is
genuinely one manifest entry, and save → load → save is byte-identical. What it does not yet have is
a wooden coaster — and a third of every frame in its own showcase is one.
