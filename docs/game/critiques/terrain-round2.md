# terrain — critic, round 2

Module: `lib/game/terrain/` (13 files) · showcase `/game?showcase=terrain` · also the ground under
every frame of the default demo park · commit `4a39904`.

Round 1 (`terrain-round1.md`) graded **6.04 and failed a hard gate**: extensibility 4.0, under the
5.0 floor. Round 2 shipped two things and says so plainly — `manifest.ts`, which turns the seven
ground layers into data and claims a `groundLayers` pack category, and a shadow proxy at stride 4
instead of 2. Nothing else. Five weaknesses are listed in the module's own report as unfixed.

**Weighted total: 7.09. FAIL** (pass is 8.5). **The hard-gate failure is closed** — extensibility
is 6.8, above the floor — and every other gate passes. So the module is no longer disqualified; it
is simply not good enough yet, and the reason is the landform rather than the plumbing.

Who graded this: the integrator, not an independent critic agent — the account's session limit has
killed every builder and critic fan-out so far, and one agent is already running on `tools`. Every
number below comes from a command in §2 or from `.game-render/_probe/terrain-r2-park.json`, and
every frame named in §3 was opened and looked at.

## 1. Scores

| #   | Axis                  | Weight | R1  | R2      | One sentence                                                                                                                                                                                            |
| --- | --------------------- | -----: | --: | ------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The frame             |   30 % | 6.8 | **6.8** | Unchanged, and honestly so: neither round-2 change is meant to move a pixel. The eye-level grass is the best surface in the game; the escarpment is still a smooth ramp with a straight crest and the world still ends in a hard line. |
| 2   | Fidelity              |   20 % | 6.2 | **6.2** | Nothing in round 2 touched the landform. One slope break at 26°, 17.4 % of the park drawn as lawn between 10° and 26°, no talus, no erosion, no wet band at the waterline — all still true in my frames. |
| 3   | Extensibility         |   20 % | 4.0 | **6.8** | The category is claimed (`unclaimedPackKeys()` is `[]` live), the manifest is read at boot **and** on `onPack`, a bad recipe is named and skipped. But an added layer is never drawn, the pattern set is closed, the splat rule is still two module constants, and **no bundled pack uses the category at all**. |
| 4   | Budget and behaviour  |   15 % | 6.0 | **7.4** | The shadow proxy went 32,768 → **8,192** triangles, i.e. 98,304 → 24,576 per frame across 3 cascades, 33.9 % → **8.4 %** of the demo park at `overview`. The saving was real and has already been spent by other modules. |
| 5   | Determinism and state |   10 % | 9.3 | **9.3** | Unchanged. `pnpm test:game` green, save round-trips, no `Math.random`, no wall clock.                                                                                                                    |
| 6   | Honesty of the report |    5 % | 2.5 | **8.2** | The report exists now, opens by naming its own hard-gate failure, corrects two fixes previously recorded against this module that were **wrong**, and ends with "no critic has re-graded any of this". Two claims in it are still unbacked. |

**6.8 × 0.30 + 6.2 × 0.20 + 6.8 × 0.20 + 7.4 × 0.15 + 9.3 × 0.10 + 8.2 × 0.05 = 7.09.**

## 2. Hard gates

| Gate                                                | Command                                                                    | Result                                                                                          |
| --------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Console errors / hydration warnings                 | `node scripts/game-shot.mjs --showcase=terrain --cam=overview,close,ground --tod=12:00` and the park probe | **PASS** — `errors 0 · hydration 0`. Two warnings, `bufferSubData: buffer overflow`, in the showcase only; see §4.4. |
| Extensibility ≥ 5                                   | §4.1                                                                       | **PASS — 6.8.** This is the gate round 1 failed.                                                |
| Barrel import                                       | `grep -rn "from '@babylonjs/core'" lib/game/terrain/`                      | **PASS** — 0 hits                                                                               |
| `window` / `document` / `navigator`                 | `grep -rn "window\.\|document\.\|navigator\." lib/game/terrain/*.ts`       | **PASS** — 0 hits anywhere, not merely at module scope                                          |
| Coupling                                            | `grep -rn "from '\.\./" lib/game/terrain/*.ts` minus `core/types`          | **PASS** — nothing imports a sibling module                                                     |
| `npx tsc --noEmit`                                  | as written                                                                 | **PASS** — exit 0                                                                               |
| `npx eslint lib/game/terrain`                       | as written                                                                 | **PASS** — exit 0                                                                               |
| `npx prettier --check lib/game/terrain`             | as written                                                                 | **PASS**                                                                                        |
| `pnpm test:game`                                    | as written                                                                 | **PASS** — exit 0, 92 checks. Terrain still ships **no `selftest.mjs`**; what covers it now is `test:game-registry`'s ground-layer case, which is new in round 2. |

## 3. The frames I looked at

`.game-render/critic-terrain-r2/`, showcase, 12:00, one process, `errors 0`.

| File                | What is actually in it                                                                                                                                                                                                                                                             |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `1200-overview.png` | The plateau reads as **long straight parallel bands** of pale sand and two greens running diagonally across it, the near hill as a smooth plane, the lake as flat navy with a hard straight far edge, and the land ends against sky in a hard line with no atmospheric fade. |
| `1200-close.png`    | A big smooth green slope with one dark shadow band across it, the escarpment top-left a grey wedge under a nearly straight crest with a 6–10 px green rim. The shaded band carries a visible **stepped diamond lattice**.                                                     |
| `1200-ground.png`   | The module's best frame and the best surface in the game: eye-level grass with real clumping and tonal variation, sand plain beyond it, escarpment at left. The crest is still a straight line and the far land still ends in a hard sky boundary.                             |

Demo park, from the camera re-grade run (`.game-render/cam-presets/`, park minute 764):
`1200-ground.png` shows the promenade verges reading much better than round 1's "flat bright green
with no readable tile", though the tree canopies and the kerb do most of that work.

## 4. Findings

### 4.1 Extensibility: the seam is real, and nothing in the shipped game goes through it

What works, measured live in `.game-render/_probe/terrain-r2-park.json`:

- `registry.unclaimedPackKeys()` is **`[]`** in the running demo park. In round 1 a pack carrying
  `groundLayers` came back unclaimed; the category is claimed now (`main.ts:82`).
- `attachGroundLayers` walks `registry.packs()` **and** subscribes to `onPack`, which is the trap
  four earlier modules fell into, and the order in `main.ts` is right: attach at line 82, textures
  built at line 94, so a pack's retint reaches the generated texture array.
- `parseGroundLayer` names the offending field, and a bad recipe is skipped rather than thrown, so
  one broken entry in a third-party pack cannot take the other six layers down.
- `pnpm test:game-registry` pins the retint and the skip.

What holds it at 6.8 rather than 8:

1. **No bundled pack uses it.** `grep -rn "groundLayers\|pathStyles\|trackElements\|cameraPresets"
   lib/game/content/packs/` returns **nothing** — neither `core-classic` nor `neon-lagoon` carries
   a single entry for any of the four categories that were added to the packs by
   `registerPackCategory` after the schema was written. Be precise about what that does and does
   not say: the schema's **own** categories are used heavily and do reach the game (`neon-lagoon`
   alone ships 5 scenery items, 4 shops, 5 rides, 4 track styles, and
   `registry.unclaimedPackKeys()` is `[]`, which is how we know every key in both packs has an
   owner). It is specifically the four passthrough extensions that no shipped content exercises, so
   the mechanism four modules added to clear this axis is unit-tested and has never been
   photographed — in this module or in any other. That is an integrator finding as much as a
   terrain one, and it is the cheapest large improvement left in the extensibility axis across the
   whole game. **Acted on while writing this:** `neon-lagoon` now carries a `cameraPresets` entry,
   the running game reports 8 presets instead of 7 with `unclaimedPackKeys()` still `[]`, and
   `--cam=lagoon` frames the demo park's lake (`.game-render/packpreset/1200-lagoon.png`) — the
   first frame in this project taken through a pack's entry in a claimed category. It does not
   move terrain's score, because `groundLayers` is the one of the four that a pack cannot exercise
   without repainting every park: see the next point.
2. **A retint is global, by index.** Indexing by paint byte is the right call for save
   compatibility and it means two themed packs cannot disagree about grass: `neon-lagoon` retinting
   `grass` would repaint the demo park too. A theme pack wants park- or theme-scoped layers, and
   there is no scope in the design.
3. **An added layer is accepted and never drawn** (`LAYER_COUNT` stays 7). The report states this as
   a limit rather than hiding it, which is why it costs little here.
4. **The splat rule is untouched.** `CLIFF_SLOPE_START` / `CLIFF_SLOPE_FULL` are still two module
   constants in the shader UBO. The round-1 critique named this in the same breath as the switch
   statement; half the finding was fixed.

### 4.2 Budget: the shadow proxy was cut by 75 %, and the park ate the saving

Census at `overview`, demo park, boot (0 guests), `terrain-r2-park.json`:

| item                                | round 1 | round 2 |
| ----------------------------------- | ------: | ------: |
| `terrain-shadow-proxy`, one mesh    |  32,768 |   8,192 |
| × 3 cascades, per frame             |  98,304 |  24,576 |
| share of the demo park at overview  |  33.9 % |   8.4 % |
| demo park total at overview         | 290,262 | 291,258 |

The proxy cut is exactly the 73,728 the report claims. The last row is the part the report does not
say: the park grew by 74,724 triangles in the same period (the path-side avenues, ~300 more trees,
seven shops), so the frame costs what it did before. That is not terrain's fault and it is worth
writing down, because "we saved 25 %" and "the frame is 25 % cheaper" are different sentences and
only the first one is true.

The remaining shadow cost is now other modules': the sun's render list is **73 meshes / 52,568
triangles** per cascade, of which the proxy is 15.6 %.

### 4.3 The claim I could not verify

The report says the coarser proxy leaves a frame "indistinguishable from the one before it". I have
no stride-2 build to compare against and would have had to edit terrain's folder to make one, so
this is unverified. What I can say is that `1200-close.png` carries a stepped diamond lattice along
the shadow edge which is consistent with an 8 m proxy quad — and that round 1 reported the same
lattice in a 3× crop **before** the change, so I cannot separate the two. Somebody should A/B it in
one session and either drop the claim or back it.

### 4.4 Two WebGL warnings belong here, not to whoever triggers them

`/game?showcase=terrain` logs `WebGL: INVALID_VALUE: bufferSubData: buffer overflow` twice, and so
does `/game?showcase=camera`, which reuses `generateShowcaseLandscape` and has no meshes of its
own. So the write-back after the landscape is regenerated is sized for the previous mesh. No errors,
nothing visibly wrong, but it is two warnings on every showcase that stages this terrain, and the
gauntlet's console gate is warnings-tolerant only by accident.

### 4.5 Still unfixed from round 1, and still the reason this module fails

Every item in the module's own "what is weak" list is confirmed by my frames: the hard land/sky
step with no distance fade (§3, all three), one slope break with 17.4 % of the park drawn as lawn
between 10° and 26°, `env-probe.ts` dead in every scene that loads `environment`, the outcrop
documented as broken up and still a cone, and `ground()` documented pickable while measuring
`isPickable: false`. **This is where the remaining 1.4 points live**, and none of it is plumbing:
the distance fade is a fragment-shader injection this module already owns, and the slope rule is
one more break plus a talus band.

## 5. What round 3 should do, in order

1. **A distance fade at the world's edge**, in terrain's own fragment injection point. It is the
   single most visible defect in every wide frame the game takes, it is named in three reports, and
   two previously recorded fixes for it were false.
2. **A second slope break and a talus band**, so that the 17.4 % of the park between 10° and 26°
   stops being lawn and the escarpment crest stops being a drawn line.
3. **Put a `groundLayers` entry in `neon-lagoon`** (integrator work, not terrain's folder) so the
   extensibility seam is exercised by the shipped game and can be photographed.
4. **A `selftest.mjs`**, in the shape of `camera`'s: the sampling functions, the brush, the apron
   profile and the LOD selection are all pure and none of them is asserted anywhere today.
