# `ui` — critic round 2

**Score: 7.8 · Verdict: FAIL** (pass is ≥ 8.5). Graded at commit `c3d669b`
(`git log -1` → `c3d669b game: die drei Kosten der Coaster-Kacheln waren falsch zugeordnet`,
2026-09-10 07:58:39 +0000; working tree clean).

The skin work is real and it verifies: the key colour is on the structure, the panel head is
genuinely a three-stop ramp, and the chrome is legible over noon cloud, dusk foliage and a black
sky. Four of round 1's findings are visibly paid off. What holds it under the mark is a new set of
things that are in every frame — a park panel reporting **RUNNING 6 / 6 in green at 22:44 over
zero riders and zero queue**, a stacked bar that draws eight colours under a four-entry key, two
identical `N / M` meters where only one is tone-coded, a top bar that slides 115 px sideways when
the queue empties — and one thing about the artefact itself: **all 28 frames were taken against a
dev server**, with the Next.js indicator sitting on top of the build bar's `COST` readout in every
one of them.

And the artefact cannot answer round 1. Every frame is English, every frame shows the same single
HUD state (Park panel + Scenery tray), and no notice is on screen anywhere. The English-sentence-
in-a-German-HUD finding, the breakdown warning that outlives its breakdown, the raw `thirst` and
the °C-only weather panel are all untestable here, so none of them is credited as fixed.

---

## 1. The six axes

| # | Axis                       | Weight |  Score | One sentence                                                                                                                                                                          |
| - | -------------------------- | -----: | -----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | The frame                  |   30 % |    7.6 | The material is a clear step up and holds at 09:00, 13:00, 18:30 and 22:30 from all seven cameras; the one panel the artefact shows carries eight visible defects, and the default HUD covers 66.9 % of a 1280×720 screen. |
| 2 | Fidelity to the real thing |   20 % |    7.4 | Luna is recognisable and measurable — saturated title bar, three-stop ramp, gloss break at 38 %, an 8 px tab lip — but the title bar it is proudest of carries a number that is not its tab's, and the glyphs inside the chunky keys are hairline. |
| 3 | Extensibility              |   20 % |    8.2 | `panels/index.ts` is byte-identical to the tree round 1 proved from outside, so round 1's result carries; the half-fix to the hook signatures is offset by `BUILTIN_PANELS` still listing nine of ten panels. |
| 4 | Budget and behaviour       |   15 % |    7.8 | Still zero draw calls and zero triangles, suite and soaks green — but nothing in this round's artefact measures `ui` at all, and the one bundle figure in it (9.59 MB) is a dev-server number. |
| 5 | Determinism and state      |   10 % |    8.6 | Save round-trip, resume and entity-id reproducibility green in both soaks, the new `docked` roster key defaults empty so an older reader still works, nothing of `ui`'s is persisted. |
| 6 | Honesty of the report      |    5 % |    7.2 | The two claims I could measure both verified to within noise; the build mode goes unmentioned with the dev badge sitting in the frame, and the 390×844 claim is stated without the measurement the same harness records elsewhere. |

**Weighted total: 7.6×0.30 + 7.4×0.20 + 8.2×0.20 + 7.8×0.15 + 8.6×0.10 + 7.2×0.05
= 2.280 + 1.480 + 1.640 + 1.170 + 0.860 + 0.360 = 7.790 → 7.8.**

Round 1 was 7.9. This is not a regression in the chrome — it is a better-looking HUD graded on a
thinner artefact, with two axes (budget, honesty) losing what round 1's measurements had earned
them and axis 1 losing what the new frames show.

### What round 1 asked for and got

Checked in the frames, not in the source:

- **The default panel fits a 1280 × 720 laptop.** Round 1: 547 px of body in a 512 px column,
  73 px clipped. Now the panel runs y = 125…630 in a 720 px frame (col x = 1265 in
  `1300-overview.png`, one contiguous HUD run 164…630 under a head at 125…163) with the last row
  at y = 611 and ~19 px to spare. Finding 5 paid.
- **The panel no longer repeats the top bar.** The four tiles round 1 measured — GUESTS / MOOD /
  CASH / TAKINGS, three of them identical in label *and* value to the bar 150 px above — are gone.
  What is left of finding 6 is one duplicate (`IN A QUEUE 7` in the bar, `In a queue 7` in the
  panel) and the section headed **PARK** inside the panel titled **Park**.
- **The crowd bar is visible when everybody is doing one thing.** Round 1: `leaving` at
  `bg-white/20` on a `bg-white/10` track read as an empty bar. At 22:44 with 215 of 215 leaving
  (`2230-overview.png`) the bar is a full-width ramp from rgb(111,113,115) to rgb(50,57,63) on a
  panel body at rgb(20,36,53) — a real 0.25 L step, plainly a filled bar. Finding 11b paid.
- **`--game-good` has a token.** Round 1: `oklch(0.82 0.15 155)` written out five times.
  `grep -rn "oklch(0.82 0.15 155)" lib/game/` now returns one hit, the declaration at
  `core/game.css:47`; every consumer reads `--game-good` (one residual literal inside a shadow
  alpha at `surface.ts:312`). Finding 10 bullet 3 paid.
- **`noticeText` is shared.** `runtime.ts:435` runs core's notices through the same helper
  `NoticeLine` uses, so `cores` and `sim:timeout` should no longer reach the log raw. Source only —
  no notice is on screen in any of the 28 frames and no log panel is open, so **not credited**.

---

## 2. Hard gates

| Gate                                          | Result | The command that answered it                                                                                                         |
| --------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Zero console errors                           | ✅ PASS | `.game-render/regrade/report.json` → `console.errors: []`; `.game-render/xp-phone/report.json` → `[]`. Two `WebGL: INVALID_VALUE: bufferSubData: buffer overflow` **warnings** in both — warnings, not errors, present identically in the pre-change baseline per `git show c3d669b`, and `ui` draws nothing. |
| Zero hydration warnings                       | ✅ PASS | `console.hydration: []` in `regrade/report.json` and `xp-phone/report.json`                                                          |
| Extensibility ≥ 5                             | ✅ PASS | 8.2 — see §4                                                                                                                          |
| Touched only its own                          | ⚠️ UNRESOLVED | `git log --name-only -8` shows integrator batches, so the gate cannot be answered per-module — but the one commit that *is* the HUD skin, `2f6744b`, changes `lib/game/ui/surface.ts` **and** `lib/game/tools/build-bar.tsx` together (`git show --stat 2f6744b`: 19 lines in tools, 26 in ui). `STATUS.json` declares it `CLOSED (ui + tools)`, so it is a sanctioned crossing rather than a silent one. It does not decide this verdict; the total already does. |
| No `from '@babylonjs/core'`                   | ✅ PASS | `gates.txt` → `=== deep import check === 0`; `lib/game/ui` references Babylon nowhere                                                |
| No `window`/`document`/`navigator` at module scope | ✅ PASS | `pnpm test:game-lint` → `✓ game lint: 265 files clean` (`suite.txt`)                                                            |
| `pnpm test:game` green                        | ✅ PASS | `suite.txt` → `suite exit=0`, incl. `✓ game ui: 24 checks` (22 → 24), `✓ game i18n: 294 keys × en/de, plurals en/de/fr`, `soak 48 park-hours` and `soak 6 park-hours` both clean with `✓ save round-trips after the run` |
| `npx tsc --noEmit`                            | ✅ PASS | `gates.txt` → `=== tsc === (exit 0)`                                                                                                  |
| `npx eslint lib/game/ui`                      | ✅ PASS | `gates.txt` → eslint over `lib/game`: `0 errors, 3 warnings`, all three in `guests/crowd.ts` and `rides/selftest.mjs`, none in `lib/game/ui` |
| Working tree clean                            | ✅ PASS | `gates.txt` → `=== git status (must be clean) ===` empty                                                                              |
| **Site-component boundary** (asked separately) | ✅ PASS, no regression | `grep -rho "from '@/[^']*'" lib/game/ui/` returns exactly three non-game paths: `@/components/layout/brand-lockup`, `@/components/ui/button`, `@/lib/utils`. The same three round 1 saw. No `@/lib/media` (the 107 KB catalog), no `@/lib/blog`, nothing that reaches the site's data layer. |

**Not a rubric gate but it should be one: the artefact is a dev build.**
`regrade/report.json` lists `chunks/1f0u_next_dist_compiled_next-devtools_index_0h122ps.js`
(250,001 B) among 40 files totalling **9,589,599 B**, against the **1.60 MB** production figure
round 1 recorded. `scripts/game-shot.mjs:48` defaults to `http://localhost:3000` and its own
docblock says it runs against `pnpm dev` or `pnpm build && pnpm start`; this run took the first.
Round 1 stated its build mode in its second line. This round's does not, and the consequence is
visible rather than theoretical — see finding 4.

---

## 3. Numbers

Every figure below comes from a file the harness wrote, or from a pixel measurement over one of
those files, and the file is named. Measurement scripts live in the session scratchpad, not in the
repo; the OKLCh conversion is the standard one and the sRGB values of the tokens it produced check
out against `core/game.css` (`--game-accent` → rgb(32,145,211), `--game-good` → rgb(104,224,153),
`--game-warning` → rgb(243,176,29)).

### Key colour coverage — the claim verifies

`STATUS.json` `closedIssues[6]`: *"Measured on a 1280x720 frame it covered 1.46 % of the picture …
Key colour now 4.84 % of the frame."*

Counting pixels in OKLCh with chroma ≥ 0.08, hue 225–258°, L 0.35–0.85 — a band that admits
**zero** sky pixels (the noon sky in `1300-overview.png` peaks at C = 0.043 over rows 0–120,
cols 300–800, against C = 0.128 in the panel title bar):

| Frames                            | key colour           |
| --------------------------------- | -------------------: |
| all 28 in `.game-render/regrade/` | **4.35 – 4.81 %**, mean **4.53 %** |
| `1300-overview.png`, strict band  | 4.54 % |
| `1300-overview.png`, loose band (C ≥ 0.06, H 220–262, L 0.30–0.90, still zero sky pixels) | 4.69 % |

4.84 % sits at or just above the top of that range, which is a claim that survives. The caveat is
the one round 1 already made and the module repeated: it is **one frame's number quoted as the
frame's number**, and the spread across 28 frames is 0.46 pp.

**Where the colour actually is** (`1300-overview.png`, 41,868 key pixels):

| Region                              | key px | pp of frame | share of key |
| ----------------------------------- | -----: | ----------: | -----------: |
| build tray (y 300–660, x 0–980)      | 27,570 |     2.99    |    65.8 %    |
| — of which its title bar alone       | 22,165 |     2.41    |    52.9 %    |
| panel column (x 980–1280)            | 10,789 |     1.17    |    25.8 %    |
| — of which the panel head alone      |  8,049 |     0.87    |    19.2 %    |
| top bar (y 0–120)                    |  2,396 |     0.26    |     5.7 %    |
| build belt (y 660–720)               |  1,113 |     0.12    |     2.7 %    |

**72 % of the key colour is two title bars.** That is exactly what the decision says it did, and
it is worth knowing that the figure is a statement about two strips, not about the interface.

### `PANEL_HEAD` is a three-stop ramp — verified exactly

Sampled down column x = 1105 through the park panel's head in `1300-overview.png`:

| row | rgb            |     L | C     |     H |
| --- | -------------- | ----: | ----- | ----: |
| 125 (0 %)  | 110,195,250 | 0.785 | 0.114 | 238.9 |
| 131        |  89,179,236 | 0.735 | 0.119 | 239.1 | ← `--game-accent-lit` 0.735
| 140 (38 %) |  35,145,209 | 0.628 | 0.134 | 240.7 | ← `--game-accent` 0.628 0.137 241.3, on the nose
| 163 (100 %)|  15,103,165 | 0.499 | 0.124 | 246.7 |

Three stops, the middle one landing at 38 % of a 39 px strip, exactly as `surface.ts:183` writes
it. The step at row 135→136 (L 0.699 → 0.653) is the gloss's own edge and reads as a highlight,
not as a seam.

Head geometry: **39 px tall** (y 125–163) × **288 px** (x 980–1267), against the "40 px raised
strip" the docblock claims. Tray title bar: **24 px** of key rows (y 306–329) × **954 px**
(x 13–966), against the claimed 32 px for the element.

### The dark body — it reads as intentional

At 22:44 the panel body is L 0.237 against a visible park at L 0.261 and the title bar at
L 0.628 (`2230-night.png`, body sampled rows 400–600 × cols 1000–1260). At 13:00 the body is
L 0.270 against a park at L 0.647. In both, the title bar is the brightest element in the
interface and the panel has an edge without a border. The argument in `STATUS.json` is the right
argument and the frames back it. This is not the oversight it could have been.

### The park panel's own contradictions

| Figure                                         | `1300-overview.png` | `2230-night.png` |
| ---------------------------------------------- | ------------------: | ---------------: |
| RUNNING                                        |  6 / 6, green meter |  6 / 6, green meter |
| OPEN (shops)                                   |  6 / 6, grey meter  |  3 / 6, grey meter |
| In a queue                                     |  7                  |  0 |
| On a ride                                      | 58                  |  0 |
| Riders per hour                                | 153                 |  0 |
| Crowd legend                                   | Walking 1167, Standing about 279, Leaving 176, Lost 97 | Leaving 219 |

Meter fills sampled: rides rgb(106,224,154) = `--game-good`; shops rgb(140,146,150), untoned.
`park.tsx:116` passes `tone`, `park.tsx:139` does not.

### The crowd bar draws eight colours under a four-entry key

Row y = 200 of `1300-overview.png`, run-length across x = 988…1259:

| x range     | width | rgb            | in the key? |
| ----------- | ----: | -------------- | ----------- |
| 991–1162    |  172  |  41,143,205    | Walking 1167 |
| 1163–1203   |   41  | 102,110,116    | Standing about 279 |
| 1204–1229   |   26  |  68, 78, 86    | Leaving 176 |
| 1230–1244   |   15  | 255,113,107    | Lost 97 |
| 1245–1250   |    6  | 105,224,154    | **no** |
| 1251–1252   |    2  | 243,177, 31    | **no** |
| 1253–1254   |    2  |  79, 88, 94    | **no** |
| 1255–1256   |    2  |   3,228,219    | **no** |

The four named rows sum to **1,719** of the top bar's **1,803** guests. **84 guests have a colour
and no name.** The 12 px of unlabelled bar is 4.5 % of its width; 84/1803 is 4.7 %.

And the key's membership and order change under the reader, in four frames:

| Frame                | legend, in the order drawn |
| -------------------- | -------------------------- |
| `0900-entrance.png`  | Walking 110, Standing about 103, Lost 3, Riding 2 |
| `1300-overview.png`  | Walking 1167, Standing about 279, Leaving 176, Lost 97 |
| `1830-ground.png`    | Walking 782, **Leaving 232**, Standing about 209, Lost 50 |
| `2230-overview.png`  | Leaving 215 |

`Riding` appears and disappears; `Leaving` and `Standing about` swap between 13:14 and 18:44. This
is round 1's finding ("`buildCrowd()` sorts by count") still standing, now provable in four frames
of this round's own set.

### The top bar slides 115 px when the queue empties

Left edge of the stat cluster, measured off the chip's outer contour:

| Frame                | stats shown                        | left edge |
| -------------------- | ---------------------------------- | --------: |
| `1300-overview.png`  | CASH, GUESTS, MOOD, IN A QUEUE (7) | x = 817 |
| `0900-entrance.png`  | CASH, GUESTS, MOOD, IN A QUEUE (3) | x = 817 |
| `1830-ground.png`    | CASH, GUESTS, MOOD, IN A QUEUE (2) | x = 797 |
| `0900-close.png`     | CASH, GUESTS, MOOD                 | x = 932 |
| `2230-overview.png`  | CASH, GUESTS, MOOD                 | x = 932 |

The cluster is right-anchored with variable content, so **every stat moves 115 px sideways the
moment the last person leaves a queue**, and 20 px on a digit count alone — at a 4 Hz publish, on
a figure that crosses zero many times a day. Round 1 praised the `null` stat ("better absent than
zero"); this is what it costs, and this repository has a written rule against exactly this shape
(CLAUDE.md, the header's °C/°F button: *"Its width may not depend on which unit is active … the
button changed width under the finger that pressed it and slid its neighbours over with it"*).

### How much of the screen is chrome

Boxes read off `1300-overview.png` (build cluster's lower edge confirmed at y = 708: grass from
y = 709 at both x = 60 and x = 500):

| Box                    | position     | size      |      px |    of frame |
| ---------------------- | ------------ | --------- | ------: | ----------: |
| build cluster          | (13, 302)    | 956 × 407 | 389,092 |    42.2 %   |
| park panel             | (980, 125)   | 288 × 506 | 145,728 |    15.8 %   |
| top-right cluster      | (815, 8)     | 457 × 107 |  48,899 |     5.3 %   |
| clock chip + menu      | (8, 8)       | 332×80 + 42×42 | 28,324 | 3.1 %   |
| watermark              | (1140, 672)  | 132 × 32  |   4,224 |     0.5 %   |
| **total**              |              |           | **616,267** | **66.9 %** |

`build-bar.tsx:205` — *"There is always one — a palette with no open category is …"* — so the tray
has no closed state, and `ui/main.ts` opens `park` unconditionally. **The park gets 33 % of a
1280 × 720 screen in the state the game boots in.** Of the 66.9 %, `ui`'s own share is 24.7 %; the
42.2 % build cluster is `tools`, rendered from `hud.tsx:281` and skinned by `ui/surface.ts`.

At 1440 × 900 the same cluster measures **448 × 1024 px** (`bar-base/report.json`, tab `scenery`),
i.e. 49.8 % of the viewport height, and its height is tab-dependent: **280.6 px** on `ride`
(5 tiles) against **448 px** on `scenery`/`shop`/`building` and **431.2 px** on `coaster`. The
notice stack is anchored to the top of this cluster (`hud.tsx`, `bottom-full`), so switching tab
moves every live notice **167 px**.

### The tray's ten thumbnails are the brightest object in the midnight frame

Mean OKLCh L, tile wells (rows 345–425 × cols 30–950) against the visible park band (rows 120–300
× cols 0–975):

| Frame               | tile wells | visible park |
| ------------------- | ---------: | -----------: |
| `1300-overview.png` |      0.693 |        0.647 |
| `2230-night.png`    |      0.693 |    **0.261** |

Identical, because the studio renders each tile once. At 22:44 the tray is **2.7× the lightness of
the park it sits on** and 42 % of the screen is a picture of a sunny afternoon. `tools` owns the
studio; it lands in `ui`'s chrome and it is the single loudest thing in the night frames.

### Scene metrics (the HUD contributes none of these)

`.game-render/regrade/report.json`, 1280 × 720, preset `medium`, engine `webgl2`, boot 17,911 ms:
draw calls 490–589 and 0.68–2.16 M triangles across 09:00 / 13:00 / 18:30; 174–230 and
0.31–0.63 M at 22:30. `simTickMs: 0` throughout (`speed=0`). `failedModules: []` in all 28.
`ui` adds zero of all of it.

### Suites

`✓ game ui: 24 checks` · `✓ game i18n: 294 keys × en/de, plurals en/de/fr` ·
`✓ game lint: 265 files clean` · `✓ game save round-trip, NaN guard, determinism, resume,
entity-id reproducibility` · `soak 48 park-hours at 100×` mean 1.88 ms/tick and
`soak 6 park-hours at 2×` mean 1.10 ms/tick, both with all nine assertions green ·
`suite exit=0` · `tsc` exit 0 · `eslint lib/game` 0 errors.

---

## 4. Extensibility, and why it is carried rather than re-earned

I did not re-run round 1's from-outside probe — the brief forbids running the harness and there is
no probe artefact in this round. What I can establish is that **the thing round 1 proved has not
moved**: `git log -1 -- lib/game/ui/panels/index.ts` → `d2f8609` (2026-09-07), which predates
round 1's graded commit `b4f47ff`. All ten built-in panels still register through the same three
public calls (`grep -n "registerPanel" lib/game/ui/panels/index.ts` → ten hits: park, rides, shops,
guests, weather, inspector, log, saves, settings, help), and the rail in every frame shows nine
buttons — the tenth, `inspector`, appearing on selection. So round 1's 8.2 carries.

Two deltas, and they cancel:

- **Half of finding 8 is paid.** `useTelemetry` and `useTelemetrySnapshot` now take a structural
  `TelemetrySource` (`hooks.ts:95, 113`) with a docblock naming the bug. But `useChrome`
  (`hooks.ts:120`) and `useTotal` (`hooks.ts:170`) still take the concrete `UiRuntime`, there are
  still **10** `as UiRuntime` casts across the panels, and none of the hooks is exported from
  `api.ts` (`grep -n "^export" lib/game/ui/api.ts` lists types, `BUILTIN_PANELS` and `UiRegistry`,
  no hooks). A foreign panel still cannot subscribe the cheap way.
- **`BUILTIN_PANELS` still lists nine.** `api.ts:179` — park, rides, shops, guests, weather,
  settings, saves, help, inspector. `log` is missing, `STATUS.json` says ten, there are ten. Round
  1 named this exactly and it is unchanged.

---

## 5. The frames I looked at

All seven cameras and all four times of day. Every frame below was opened with the Read tool and
looked at.

| File                                              | What is in it                                                                                                                                                                                                                                                |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.game-render/regrade/0900-entrance.png`          | 09:14, 221 guests. Chrome over a hazy morning plaza; every label reads. Legend is Walking 110 / Standing about 103 / Lost 3 / **Riding 2** — a membership no other frame has. MOOD 73 drawn in `--game-good` green (rgb 104,224,153), so the tone system works. |
| `.game-render/regrade/0900-close.png`             | 09:14, close camera in the trees. Top-right cluster is **three** tiles — IN A QUEUE has dropped out at 0 — and its left edge has moved to x = 932. SHOPS 4 / 6 grey, RUNNING 6 / 6 green.                                                                     |
| `.game-render/regrade/1300-overview.png`          | 13:14, 1,803 guests, the reference frame for most of §3. Park panel, Scenery tray, crowd bar with eight segments and four legend rows, `IN A QUEUE 7` in the bar and `In a queue 7` in the panel 130 px below it.                                             |
| `.game-render/regrade/1300-coaster.png`           | 13:14 over the coaster. The visible park is one 185 px band on the left half; the right column is panel and the bottom 42 % is tray. Bell badge 6. Everything else identical to the overview frame.                                                            |
| `.game-render/regrade/1300-pool.png`              | 13:14 over the lagoon. Same HUD state again; legend Walking 1143 / Standing about 291 / Leaving 173 / Lost 103 = 1,710 of 1,790.                                                                                                                              |
| `.game-render/regrade/1830-ground.png`            | 18:44, standing among guests under trees. Chrome legible over both the lit path and black foliage. **Legend order has swapped** — Walking, Leaving 232, Standing about 209, Lost. Stat cluster edge at x = 797. Second tile row's price line sliced.          |
| `.game-render/regrade/2230-overview.png`          | 22:44, 215 guests all leaving. `IN A QUEUE` gone, cluster at x = 932. Crowd bar a full-width grey band with one legend row — visible, which is round 1's finding 11b paid. **RUNNING 6 / 6 green** over In a queue 0, On a ride 0. SHOPS 3 / 6 grey.          |
| `.game-render/regrade/2230-night.png`             | 22:44 from the night camera. The worst frame the panel has: **RUNNING 6 / 6 full green**, `Riders per hour 0`, `On a ride 0`, `In a queue 0`, `Leaving 219`. And ten daylight thumbnails at L 0.693 over a park at L 0.261.                                    |
| `.game-render/bar-base/1300-ride-bar.png`         | 1440-wide crop of the bar with the Rides tab open. Five 3D machine renders, instantly distinguishable. Title bar reads **Rides** … **70 IN THE PACKS YOU HAVE LOADED** over a tab that says **5**. The belt's first control is a **COST —** readout.            |
| `.game-render/bar-coaster/1300-coaster-bar.png`   | Coasters tab: four buildable layouts drawn as thin black track plans, four dimmed entries reading **needs the track tool** — an honest disabled reason, well done. The four plans are four grey scribbles at 182 × 91; the Rides tab beside them is legible at a glance. |
| `.game-render/xp-phone/1300-coaster.png`          | 390 × 844 with the XP skin (05:20, minutes before `2f6744b`). Rows split, rail wraps 5 + 4, tray becomes one tile per row, nothing appears to overflow. The park gets a 194 px band = **23 % of the screen**. The Next.js badge again covers the belt's first control. |

Four more frames were opened as crops rather than whole (`0900-ground`, `1830-coaster`,
`1300-entrance`, `2230-night`, the build bar's left corner at 6×) to confirm the Next.js indicator
is in the same place in all of them.

**All 28 regrade frames carry exactly one HUD state**: the Park panel open, the Scenery tray open,
no notice on screen, locale English. Nine of the ten panels, both inspectors, the pause menu, the
notice stack and every German string in the module are absent from this round's evidence.

---

## 6. Findings, ranked

### 1. `RUNNING 6 / 6`, green and full, at 22:44 over zero riders and zero queue

`2230-night.png` and `2230-overview.png`. The park has 219 guests, all of them Leaving; `On a
ride 0`, `In a queue 0`, `Riders per hour 0`, and half the shops have shut (`OPEN 3 / 6`). The
panel's headline reads six of six machines running, in `--game-good`, over a meter filled to
100 %. `park.tsx:120` is still `tone={totals.ridesDown > 0 ? 'warn' : 'good'}` — the identical
two-way rule round 1's finding 11a named, unchanged, and round 2 catches it in a worse state than
round 1 did: round 1 saw `0 / 4` drawn green, round 2 sees `6 / 6` drawn green on a park nobody is
riding.
**Fixed looks like:** three ways at minimum (`ridesDown > 0` → warn, `ridesOpen === 0` → neutral,
else good), and the case this frame adds — a full green meter is a claim about a park that is
open, so `onRide + inQueue === 0` with everybody leaving is not `good` however many machines
report OPERATING.

### 2. The crowd key names four of the eight colours the bar draws

`1300-overview.png`, measured at row y = 200: eight runs, four legend rows, **1,719 of 1,803
guests named**. The four unlabelled segments are 12 px wide between them (green, amber, grey,
cyan — `--game-good`, `--game-warning`, a neutral and `--game-accent-2`), which is 4.5 % of the
bar against 4.7 % of the guests. And the key's membership and order change under the reader across
four frames (§3). A stacked bar whose key does not close is a bar a reader cannot use.
**Fixed looks like:** a fixed order rather than a sort by count, and an `Other N` row that closes
the sum. The bar already knows the total; the key should be forced to add up to it.

### 3. Two identical `N / M` meters, one tone-coded and one not

`1300-overview.png`: `RUNNING 6 / 6` in green (fill rgb 106,224,154) sits 170 px above
`OPEN 6 / 6` in neutral grey (fill rgb 140,146,150), the same component, the same shape, the same
statement. `park.tsx:116` passes `tone`, `park.tsx:139` passes none. At 22:44 `OPEN 3 / 6` is the
same grey as `OPEN 6 / 6` was at noon, so the one meter that is genuinely reporting a degraded
park is the one with no tone at all.

### 4. Re-shoot on a production build, and open more than one panel

This is the finding that decides whether round 3 can grade anything.

- **Dev build.** `regrade/report.json` carries `next-devtools` among its chunks and a 9,589,599 B
  total against round 1's 1.60 MB. Every bundle number in this artefact is void.
- **And the dev overlay is inside the HUD.** The Next.js indicator — a black circle with the `N`
  mark and a clipped `T` — sits at roughly (20, 662)–(58, 700) in all 28 frames and in
  `xp-phone/1300-coaster.png`, directly on top of the build belt's first control. That control is
  the **COST** readout, which is legible only in the 1440-wide `bar-base/1300-ride-bar.png`, where
  the bar is centred and the badge falls outside it. A critic grading the 1280 frames cannot see
  it at all.
- **One HUD state, one language.** Twenty-eight frames of the same panel over seven cameras is
  seven pictures of the scene and one picture of the interface. Round 1's four headline findings
  — the English sentence in a German HUD, the same event logged twice in two languages, the
  breakdown warning that outlives the breakdown, the ride list showing one ride of four — are all
  in panels and notices this set does not contain. `RETRACTED_WHEN_LIVE` (`hud.tsx:527`) still
  holds exactly one entry, `sim:timeout`, so the generalisation round 1 asked for was not made;
  whether it matters on screen is unknowable from here.
  **Round 3 needs:** `--locale=de`, the log / rides / weather / inspector panels open, a frame with
  a live notice in it, and the phone at 390 × 844 with a panel open.

### 5. The top bar slides 115 px sideways when the queue empties

§3's table: x = 817 with four stats, x = 932 with three, x = 797 on a digit count. The cluster is
right-anchored and its content is variable, at a 4 Hz publish, over a figure that crosses zero
several times a day. Round 1 called the disappearing stat a feature; it is a feature that moves
every other figure in the row.
**Fixed looks like:** the slot stays and takes an em dash, which is what the ride inspector already
does for an unmeasurable figure — or the row is laid out on a fixed grid so a missing tile leaves
a gap instead of a shove.

### 6. Two thirds of a 1280 × 720 screen is chrome in the state the game boots in

66.9 % measured (§3), of which 24.7 % is `ui`'s. `build-bar.tsx:205` gives the tray no closed
state and `ui/main.ts` opens the park panel unconditionally, so nothing a player has done put it
there. Round 1 raised the phone version of this (89.2 % of 844 px; the same measurement on
`xp-phone/1300-coaster.png` gives 77 % with the panel closed) and the decision note behind the
auto-open reasons about "344 px of a 1920 px frame". It was never re-taken for 1280, which is the
laptop most people have.

### 7. Ten pictures of a sunny afternoon, at 22:44, over 42 % of the screen

Tile wells at L 0.693 against a park at L 0.261 (`2230-night.png`), identical to their 13:00 value
because the studio renders once. The chrome itself is excellent at night — this is the one thing
in the night frames that is not. `tools` owns the studio; the fix is a night variant or a scrim on
the well, and it is worth an entry in `docs/game/requests/ui.md`.

### 8. The tray's title bar carries a number that is not its tab's

`bar-base/1300-ride-bar.png`: **Rides** on the left, **70 IN THE PACKS YOU HAVE LOADED** on the
right, over a tab strip whose Rides tab reads **5**. 70 is the sum of all six tabs
(21 + 12 + 8 + 5 + 21 + 3). Same in `bar-coaster/1300-coaster-bar.png` under **Coasters 8**. This
is the one heading the key-colour decision was written around, and the sentence in it is right
about the packs and wrong about the strip it sits in.

### 9. The second tile row's price line is sliced through the x-height

`1830-ground.png` at y ≈ 603, and the same in every 1280 × 720 frame: `€1.200`, `€25`,
`0.3 × 0.3 m`, `2 × 0.1 m` all cut horizontally by the tray's scroll edge, with the active tab's
8 px lip cutting the first of them a second time. A half-visible row is how a scroll container says
there is more; a row cut through the middle of a digit is how it says it is broken.

### 10. Four grey curved-arrow keys inside 250 px

`1300-overview.png`, x 225–480: rotate-CCW, rotate-CW, `free`, undo, redo. All five disabled, all
four arrows hairline strokes in 36 px keys, two pairs from the same glyph family separated only by
the grid button. XP separated or labelled these; this bar does neither.

### 11. `BUILTIN_PANELS` still lists nine of the ten panels

`api.ts:179`, `log` missing. Named in round 1, unchanged, and the constant is exported and
referenced nowhere — so it is a published claim about the module that is wrong and that nothing
would catch.

### 12. Smaller, all checked in a frame

- **`In a queue` is still printed twice** — `IN A QUEUE 7` in the top bar and `In a queue 7` in
  the panel 130 px below (`1300-overview.png`). The other three duplicates round 1 found are gone.
- **A section headed `PARK` inside the panel titled `Park`** (`2230-overview.png`), carrying one
  row. Round 1's finding 6, unpaid.
- **`Trains and cars 1 · 5`** — the middle dot is doing work no reader has been told about, and it
  is the panel's last row in every frame.
- **`free`** is the only English word among icon-only controls in the belt; whether it has a
  German string is not visible in this artefact.
- **The `Slides 3` tab is permanently dimmed while showing a count of 3** in every frame
  (`bar-base/1300-ride-bar.png` and all 28 regrade frames) — a control that advertises three
  things and opens none of them, with no `needs the …` line of the kind the coaster tab gets right.
- **Four of the eight coaster tiles are drawn** (`bar-coaster/report.json`: `tiles 8, drawn 4,
  distinct 4`). The four that are drawn are distinct by SHA and, looked at, four grey scribbles at
  182 × 91 — a weaker tile than the Rides tab's 3D renders in the same skin.

---

## 7. What is genuinely good, and should not be touched

- **The skin.** Looked at at four times of day from seven cameras: the title bars, the bevels, the
  rim light and the gloss break at 38 % read as one designed object, and the key colour on the
  structure is the right call — it is what makes the panel and the tray read as the same family
  rather than as a dark box and another dark box. The claimed 1.46 → 4.84 % is real.
- **The dark body, and the argument for it.** The frames support it exactly as written: the title
  bar is the brightest thing in the interface at 13:00 and at 22:44, and the panel has an edge
  against grass at L 0.647 and against night at L 0.261 without needing a border.
- **The docked roster fix.** `RUNNING 6 / 6` and `SHOPS 6 / 6` in a park with six of each — the
  4-listed-against-6-counted contradiction round 1 would have found is gone, `pnpm test:game-ui`
  went 22 → 24 checks, and both defaults are empty so an older reader still works.
- **The panel fits a 1280 × 720 laptop now**, with 19 px to spare, and it stopped repeating the
  top bar.
- **The `null` stat and the empty crowd row.** `IN A QUEUE` really does take its slot back at 0
  (`0900-close.png`, `2230-overview.png`) and the crowd key drops to a single row rather than
  printing four zeros. The idea is right; only the geometry around it is wrong (finding 5).
- **`needs the track tool`** on the four undrawable coaster tiles. A disabled control that says
  what would enable it is the correct answer and most of this bar does not do it.
- **The boundary.** Exactly three site imports, the same three as round 1, and `BrandLockup` still
  the real one. Nothing about the skin work reached for the site's data layer.

---

## 8. Verdict

For `STATUS.json`, which this critic was told not to edit — `modules.ui`: `round: 2`,
`axes: { frame: 7.6, fidelity: 7.4, extensibility: 8.2, budget: 7.8, determinism: 8.6,
reportHonesty: 7.2 }`, `score: 7.8`, `consoleErrors: 0`, `gated: true`, `verdict: "fail"`,
`gradedAtCommit: "c3d669b8032b822cc20bb24ac7983e86f21bd3ed"`, `scoreIsStale: false`.

**FAIL — 7.8.** No hard gate is broken; the "touched only its own" gate is unresolvable from a
batched history and one declared `ui + tools` crossing. The skin is better than round 1's and the
two claims it makes about itself both verify under measurement. What keeps it under the mark is
the same category of thing as last time — defects a player would photograph. A park panel that
says six of six machines are running, in green, at 22:44, with nobody on a ride and nobody in a
queue. A stacked bar with eight colours and a four-entry key that leaves 84 guests unnamed. Two
identical meters, one green and one grey. A top bar that jumps 115 px when the last queue empties.
Findings 1, 2, 3, 5, 8 and 11 are between one line and one afternoon each.

The other half of the round-3 job is the artefact. Twenty-eight frames of one panel in one
language against a dev server, with the Next.js badge sitting on a HUD control, cannot show
whether round 1's four headline findings were fixed — and this critic did not credit them.
