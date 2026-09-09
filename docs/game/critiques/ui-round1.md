# `ui` — critic round 1

**Score: 7.9 · Verdict: FAIL** (pass is ≥ 8.5). Zero console errors, zero hydration warnings,
budget met, extensibility well clear of its floor. It fails on what is in the frames: an English
sentence standing in a German HUD, a warning that outlives the thing it warns about, a message log
whose first line is the word `cores`, and a panel column that gives a scrolling notification log
442 px while the ride list gets 135 and shows one ride of four.

Graded at commit `b4f47ff` (`git rev-parse HEAD`), against `pnpm start` on a production build.

---

## 1. The six axes

| # | Axis                       | Weight |  Score | One sentence                                                                                                                                                                            |
| - | -------------------------- | -----: | -----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | The frame                  |   30 % |    8.0 | The chrome is one designed object and holds at noon and at midnight; the panel column is where it comes apart, and it comes apart in the panel that opens itself.                        |
| 2 | Fidelity to the real thing |   20 % |    7.2 | It is built from the site's own components and the German was written rather than translated — and it still shows a raw `thirst`, a raw `cores`, an English notice and °C only.          |
| 3 | Extensibility              |   20 % |    8.2 | I registered a panel, a stat and an inspector from outside the module and all three appeared, sorted correctly and unregistered cleanly — but the hook that makes a panel cheap is not on the public contract. |
| 4 | Budget and behaviour       |   15 % |    8.3 | Nothing in the HUD runs per rendered frame, and 4.1–6.7 React commits per 4 Hz publish over 221–572 DOM nodes is a defensible share of a 60 fps frame; the reported figures do not reproduce. |
| 5 | Determinism and state      |   10 % |    8.6 | Nothing persistent, nothing in the save, no `Math.random`, one documented `Date.now`; the three optimistic mirrors are the one place a fact is held on both sides.                        |
| 6 | Honesty of the report      |    5 % |    7.2 | Ten ranked weaknesses and two self-inflicted bugs written up with their post-mortems — and a mitigation claim the artefact contradicts, plus commit figures that do not reproduce.       |

**Weighted total: 8.0×0.30 + 7.2×0.20 + 8.2×0.20 + 8.3×0.15 + 8.6×0.10 + 7.2×0.05 = 7.945 → 7.9.**

### Why honesty is 7.2 and not 9

The report is unusually candid — ten ranked weaknesses, both bugs the module caused itself written
up with their post-mortems, and the "no wait time" claim, which I went looking to break and could
not. Four things pull it down, all checkable:

- **"The entry stays in the messages panel, so nothing is hidden"** (weakness 6, request 8). The
  entry that stays is the string `sim:timeout`. Finding 1.
- **"`i18n` … is EN + DE complete"** (decision 8). The most frequent runtime notice in a running
  park is English in both languages, and lands in the log one line from its own German translation.
  Finding 2.
- **"Nine panels"**, three times, plus a `BUILTIN_PANELS` constant that lists nine. There are ten;
  `STATUS.json` says ten.
- **The commit figures** are single nine-publish samples quoted to two decimals, and the
  "transferable" per-publish ratio is not transferable — see §3.

None of these is spin. They are the four places a careful reader of the report would have been
misled, in a document that is otherwise a model of the form.

### What "budget" means for a module that draws nothing

`ui` adds zero draw calls and zero triangles, and that earns it nothing. Over a canvas that wants
60 fps the questions are:

1. **Does it do any work per rendered frame?** No, and this is the one that matters. `UiRuntime.pump()`
   is called from `onRender` and returns immediately unless 250 ms have passed (`runtime.ts:176`,
   `PUBLISH_MS`); nothing subscribes to the frame. Right by construction.
2. **What does one publish cost?** Measured below: ~4 commits for the chrome plus one per open panel
   that subscribes to the whole snapshot. 16–27 commits/s at the 4 Hz cadence.
3. **How much DOM sits over the canvas?** 221 nodes as chrome, 531–572 with three panels.
4. **Does the cost scale down with what is closed?** No — the collector rebuilds every ride row,
   every shop row and a full walk of the guest byte buffer on every publish whether a panel is open
   or not (`telemetry.ts:380–470`). Cheap today at 4 rides and 6 shops; it is the thing that will
   not scale.

---

## 2. Hard gates

| Gate                                          | Result | How it was answered                                                                                                       |
| --------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| Zero console errors                           | ✅ PASS | `console.errors: []` in `.game-render/critic-ui/report.json`, `critic-ui-1280/report.json`, `critic-ui-phone/report.json` and `critic-ui-probe/probe.json` (a ~7 min session with panel churn, registration, viewport changes and a menu cycle) |
| Zero hydration warnings                       | ✅ PASS | `console.hydration: []` in all four                                                                                       |
| Extensibility ≥ 5                             | ✅ PASS | 8.2 — proven by registering from outside, see §4                                                                          |
| Touched only its own                          | ⚠️ n/a  | `git status` is clean and `git show --name-only 9d3b42f` is `ui/hud.tsx` + its own two docs; earlier commits are integrator batches carrying several builders at once, so git cannot answer this cleanly for this module |
| No `from '@babylonjs/core'`                   | ✅ PASS | `grep -rn "from '@babylonjs/core'" lib/game/` → no hits; `lib/game/ui` references babylon nowhere at all                   |
| No `window`/`document`/`navigator` at module scope | ✅ PASS | `pnpm test:game-lint` → `✓ game lint: 249 files clean`                                                                    |
| `pnpm test:game` green                        | ✅ PASS | all 12 steps green, incl. `✓ game i18n: 289 keys × en/de` and `✓ no runtime errors` in both soaks                          |
| `npx tsc --noEmit -p tsconfig.json`           | ✅ PASS | 0 lines of output                                                                                                         |
| `npx eslint lib/game/ui lib/game/i18n`        | ✅ PASS | exit 0, no output                                                                                                         |
| `lib/game/ui/selftest.mjs`                    | ✅ PASS | `✓ game ui: 22 checks`. At the graded commit these ran in no pipeline: `git show HEAD:package.json` line 105 has no `test:game-ui`, which is request 7. The integrator added it to the working tree during this review (`git diff --cached package.json`), so it is fixed but not at `b4f47ff` |

---

## 3. Numbers

All from files the harness wrote. Probe script: `.game-render/critic-ui-probe.mjs` (gitignored),
output `.game-render/critic-ui-probe/probe.json`.

### React commits per telemetry publish — reproduced, and they do not match

`useCommitTally` writes into `HUD_METRICS`, published on `window.__parkfan_hud`. Reset, then
sampled for 40 s at speed 3 on the demo park at tick 2,463, 1920×1080, `locale: de-DE`:

| Open panels                | commits | publishes | **per publish** | report claims |
| -------------------------- | ------: | --------: | --------------: | ------------: |
| none                       |      45 |        11 |        **4.09** |          4.78 |
| park + rides + shops       |      67 |        10 |        **6.70** |          5.67 |
| guests + weather + settings |      69 |        11 |        **6.27** |          5.36 |

The shape of the claim survives and is a real result: with 17 tallied components mounted and nothing
open, ~4 commits per publish rather than 17, which is what the cached selectors buy. The figures
themselves do not survive, for two reasons the report should have named.

**n is nine.** Both sides are single samples — the builder's own
`.game-render/ui-measure4/report.json` is `43/9 = 4.778` and `ui-measure5` is `51/9 = 5.667`, so the
two decimal places in the report and in `STATUS.json` rest on nine publishes, and one commit of
jitter moves the ratio by 0.11.

**And the ratio is not the transferable number the report says it is.** The publish is driven from
`onRender`, so a slow renderer lengthens the interval between publishes — and a longer interval
means more figures have moved when one lands, so more components commit. Under SwiftShader at
0.3 fps a publish covers seconds of wall clock and minutes of park time; at 60 fps it covers 250 ms.
The per-publish ratio therefore drifts *upward* with contention, which is the direction my
three-panel samples went. Neither side's figure transfers to a real browser. What does transfer is
the model: **chrome ≈ 4 commits per publish, plus exactly one per open panel that calls
`useTelemetrySnapshot`** — a structural statement, checkable by reading which panels use the whole
snapshot, and it is the thing worth putting in `STATUS.json`.

### DOM nodes — reproduced within 1 %

| State                       | under `[data-game-hud]` | document | report |
| --------------------------- | ----------------------: | -------: | -----: |
| chrome only                 |                 **221** |      367 |    220 |
| park + rides + shops        |                 **572** |      718 |      — |
| guests + weather + settings |                 **531** |      677 |    538 |

### Does the default panel fit? (`ParkPanel` body, measured `scrollHeight` vs `clientHeight`)

The park panel's body is **547 px** tall.

| Viewport      | dock column | body gets | clipped below the fold |
| ------------- | ----------: | --------: | ---------------------: |
| 1920 × 1080   |      872 px |    547 px |                   0 px |
| 1440 × 900    |      692 px |    547 px |                   0 px |
| **1280 × 720** |  **512 px** | **474 px** |              **73 px** |
| 390 × 844     |  sheet only |    388 px |              **159 px** |

### Phone, 390 × 844, park panel open (the known finding)

`document.scrollWidth` = 390 = viewport, so the "it fits" half is confirmed exactly: nothing
overflows, the top row splits, the rail wraps to two rows (100 px tall, 366 px wide), the sheet sits
**above** the build bar rather than over it. Coverage: top cluster 0–194, sheet 273.3–699.5, build
bar 707.5–832. Free park: 79.3 px + 12 px = **91.3 px of 844, so the chrome is 89.2 %** — a little
worse than the ~85 % the brief names. Verdict below.

### Scene metrics (the HUD contributes none of these)

`.game-render/critic-ui/report.json`, 18:30, 1920×1080: overview 183 draw calls / 354,762 tris,
entrance 197 / 509,222, ground 191 / 797,999. Probe: 134 / 318,933. Chunk total 1.60 MB.

### Suites

`✓ game ui: 22 checks` · `✓ game i18n: 289 keys × en/de` · `✓ game lint: 249 files clean` ·
`pnpm test:game` all green · `tsc` clean · `eslint lib/game/ui lib/game/i18n` clean.

---

## 4. Extensibility, tested rather than read

The claim is that there is no privileged path. I registered a panel, a stat and an inspector from
**outside** the module, through `__parkfan_game.handle.module('ui')`, with no edit to `ui`:

```
railBefore 10 → railAfter 11        statsBefore 4 → statsAfter 5      inspectorFor('critic-thing') true
foreignDrawn: true                  (the body's text was in the DOM)
statOrder: cash, guests, critic-rating, happiness, queue     ← order:25 landed between 20 and 30
after the three unregisters: panels 10, stats 4, inspector false, and 'critic-probe' gone from openPanels()
```

`.game-render/critic-ui-probe/foreign-panel.png` shows it: a **Critic probe** panel in the dock, a
new rail button carrying my `badge` as a `live` pill, and **742 RATING** in the top bar between
GÄSTE and STIMMUNG. In the same frame the `queue` stat is *absent* because it returned `null` with
nobody queuing — the documented "a figure that is not measurable yet is better absent than zero",
working. The ten built-ins really do go through the same three calls (`panels/index.ts`), and
`UiRegistry`'s replace / stale-unregister / insertion-order rules are unit-tested. This axis is
genuinely earned; the deductions are all about what a foreign panel gets *after* it is registered.

Two things `management` cannot yet do that the report implies it can: it has **no `main()` at all**
(`lib/game/management/index.ts` is a 13-line scaffold), and the three-line snippet in request 6 —
like the one in `api.ts`'s own docblock — omits adding `'ui'` to the module's `deps`, so it works
only because `uiModule` happens to sit 5th in `GAME_MODULES` and `management` 19th.

---

## 5. The frames I looked at

| File                                             | What is in it                                                                                                                                                                                                                                                                     |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.game-render/critic-ui/1200-overview.png`       | 1920×1080, clock 13:59 after stepping. Chrome + park panel over a bright noon sky: the top-right chip sits directly on pale cloud and every label still reads — the scrims are doing their job. 1,450 guests, mood 46, €2,502,461, crowd bar, RIDES 4/4, path nodes 1,534.        |
| `.game-render/critic-ui/1200-entrance.png`       | Same, entrance camera over the lit plaza. **Bottom left: "Top spin has broken down" — in English — while the panel 800 px away reads RUNNING 4/4 green, has no "Out of action" row and the Rides rail button has no badge.**                                                       |
| `.game-render/critic-ui/1830-overview.png`       | Clock 20:29, deep dusk. The glass reads as glass against a near-black park; MOOD 37 in the danger tone; the crowd legend's membership has changed (Buying out, Queuing in) because it is sorted by count.                                                                          |
| `.game-render/critic-ui/1830-entrance.png`       | The honest version of the same state: RUNNING **3 / 4** with an amber meter, "Out of action 1" in red, and a **1** badge on the Rides rail button — the tone and badge system works exactly as designed when the condition actually holds.                                        |
| `.game-render/critic-ui/1830-ground.png`         | Ground camera, a crowd on a lamp-lit avenue. The HUD is legible over both black foliage and lamp glare; the bottom scrim carries the build bar over bright paving. Notice still standing, RUNNING 4/4 again.                                                                       |
| `.game-render/critic-ui/2300-overview.png`       | Day 2, 00:59, park shut: 16 guests all Leaving, RUNNING **0 / 4**, SHOPS 0 / 6, €0 takings, mood 37 red, and the top bar has dropped IN A QUEUE because the stat returned `null`. Fully legible on near-black. Two flaws show only here — see finding 12.                          |
| `.game-render/critic-ui/2300-entrance.png`       | The same shut park at the entrance, Day 3. The clock chip's day strip has its marker at the far left in the night band. Same two flaws.                                                                                                                                            |
| `.game-render/critic-ui/2300-ground.png`         | Day 4, 00:59, ground camera: a handful of guests walking out under the lamps. MOOD 45 in the amber tone. The HUD is the most legible it is anywhere — the panel over near-black is the case `HUD_PANEL`'s 0.86 fill was written for.                                              |
| `.game-render/critic-ui-1280/1200-overview.png`  | 1280×720. The default park panel is **cut mid-label**: the "PARK / Path nodes / Path networks" section is below the fold of a 512 px column.                                                                                                                                       |
| `.game-render/critic-ui-phone/1200-overview.png` | 390×844. Nothing overflows: menu + clock + cash on one row, the rail wrapped to two, the sheet above the build bar. And 89 % of the screen is chrome, with an 79 px band of park visible.                                                                                          |
| `.game-render/critic-ui-probe/foreign-panel.png` | de-DE, four panels open. The foreign **Critic probe** panel is in the dock with a header and **nothing else** — the column had no room left. Wetter is clipped mid-row. `RATING 742` and a `live` badge prove the registry from outside.                                          |
| `.game-render/critic-ui-probe/de-panels.png`     | de-DE, three panels. **The message log contains „Top Spin läuft wieder." (1 h 30), „Top spin has broken down" (1 h 42) and „Top Spin ist stehen geblieben." (1 h 42)** — the same event twice, one line apart, in two languages. The log takes 442 px; the ride list gets 135 px and shows **1 of 4 rides**. |
| `.game-render/critic-ui-probe/de-selection.png`  | Four panels. Park is a header plus the words WAS DIE LEUTE TUN; Fahrgeschäfte shows one clipped row; Auswahl is clipped at „SCHLANGE / WARTEN". Selection itself works: Riesenrad, `core-classic:ferris-wheel`, Einsteigen 0/48.                                                  |
| `.game-render/critic-ui-probe/de-menu.png`       | The pause menu on the real `BrandLockup`, „park.fan Resort · Tag 1 · 19:29", six rows, the park paused behind a dimmed blur. This looks like park.fan and not like a game menu, which is the point.                                                                                |

The 12:00 `ground` frame could not be taken at 1920×1080: Playwright's 30 s screenshot deadline
expired twice on that camera under SwiftShader with two other harnesses on the box
(`page.screenshot: Timeout 30000ms exceeded`). `1830-ground.png` covers the camera.

---

## 6. Findings, ranked

### 1. The messages panel's first line is the word `cores`

`UiRuntime.ingestNotices` (`runtime.ts:403`) copies core's notices into the log **verbatim**, and
core's notices are keys, not sentences: `capabilities.ts:152` sets `notice = 'cores'` for any
machine with ≤ 4 cores, `'mobile'` on a phone, `'webgl1'` on an old browser, and `host.ts:359`
raises `'sim:timeout'`. `NoticeLine` (`hud.tsx:543`) translates them (`notice.${text}`); the log
does not. Probed directly on this container:

```
caps:         { cores: 4, preset: "medium", notice: "cores" }
storeNotices: [ { level: "info", text: "cores", key: "preset" } ]
ui.telemetry().log: [ { kind: "info", text: "cores" } ]
```

This also falsifies the report's own mitigation for `sim:timeout` — "the entry stays in the messages
panel, so nothing is hidden — it just stops claiming to be true". What stays is the token
`sim:timeout`.
**Fixed looks like:** one shared helper used by both `NoticeLine` and `ingestNotices`, so the two
cannot drift again. Four lines.

### 2. A notice is English in a German HUD, and lands in the log beside its own German translation

`rides/sim.ts:536` emits `notify` with `text: \`${r.profile.name.en ?? r.id} has broken down\``,
a prose string built in the simulation. `hud.tsx:543` finds no `notice.` key for it and renders it
raw. Meanwhile `runtime.ts:110` already builds the localized sentence for the *same* event
(`log.ride.breakdown` → „Top Spin ist stehen geblieben.") — and the pack carries
`{en: 'Carousel', de: 'Karussell'}` for every ride. Seen in `de-panels.png` as two adjacent log
lines with the same timestamp, and in three separate frames as an English toast in a `lang="de"`
document.
**Fixed looks like:** `notify` carries `key` + `params` instead of prose (`Notice` already has a
`key` field, for dedupe — this needs a second one), `ui` translates it, and it becomes request 11 in
`docs/game/requests/ui.md`. The module owns the string table *and* the renderer and did not notice.

### 3. A warning that has stopped being true stays on screen — the bug this module wrote an essay about

`RETRACTED_WHEN_LIVE` (`hud.tsx:463`) contains exactly one string, `sim:timeout`. A breakdown raises
a `warning`, and `AUTO_DISMISS_MS` only applies to `info` (`hud.tsx:496`), so it stays until
somebody clicks the X; `ride:fixed` retracts nothing. Three of my frames
(`1200-entrance`, `1830-ground`, `de-panels`) show "Top spin has broken down" standing while the
park panel reads RUNNING 4/4, carries no "Out of action" row and the Rides rail button has no badge
— and in `de-panels.png` the log dates the breakdown 1 h 42 ago and „Top Spin läuft wieder." 1 h 30
ago, so the ride had been running again for an hour and a half of park time with the warning still
on screen. `1830-entrance.png` proves the machinery is right when the condition holds (3/4, amber,
badge 1).
**Fixed looks like:** retract by key when the condition ends — `ride:fixed` dismisses
`ride:breakdown:<id>` in the same effect that retracts `sim:timeout`. The generalisation is the
useful version: a notice that describes a *condition* names the event that ends it.

### 4. Three panels open, and the notification log eats the column

Docked panels are flex items with content-sized bases and equal shrink
(`panel-host.tsx:94–120`), so each keeps **the same fraction of the column that its content is of
the total content** — the panel with the most to say wins the most room. Measured off
`de-panels.png` at 1920×1080 (872 px column): Meldungen **442 px**, Park 253 px, Fahrgeschäfte
**135 px showing 1 of 4 rides**, with nothing on screen saying there are three more. With four open
(`de-selection.png`, `foreign-panel.png`) the last panel is a header and a section label. This is
the exact failure the module's own decision note says the shared column was chosen to fix ("the
inspector under it was a header and a sliver, which reads as a panel that did not open") — the fix
moved it from two panels to three.
**Fixed looks like:** a floor per panel (`min-height` ≈ 3 rows + header) and a cap on the panel
whose content is unbounded — the log is the only one that grows without limit (`LOG_HISTORY` 80).

### 5. The panel that opens itself does not fit a 1280 × 720 laptop, and takes 89 % of a phone

547 px of body against a 512 px column: **73 px clipped**, and what is clipped is the whole
path-network section (`critic-ui-1280/1200-overview.png`). On a phone the sheet is capped at
`max-h-[46svh]` = 388 px against the same 547, and the chrome covers 89.2 % of 844 px.
`main.ts:31` opens `park` unconditionally; the decision note behind it reasons about "344 px of a
1920 px frame" and was never re-taken for the other two viewports the module says it verified.
**Fixed looks like:** don't auto-open below `sm` (one `matchMedia` in `main.ts`, which is already a
client module), and shorten the default panel — see the next finding.

### 6. The default panel mostly repeats the bar that is always on screen

`1200-overview.png`: the top bar reads CASH €2,502,461 / GUESTS 1,450 / MOOD 46 / IN A QUEUE 2, and
the park panel's four tiles read GUESTS 1,450 / MOOD 46 / CASH €2,502,461 / TAKINGS TODAY — three of
four identical in label *and* value, 150 px apart, plus "In a queue 2" again in the RIDES section.
The one figure those 90 px add is Takings today. Trimming that block is also most of finding 5.
Same family, smaller: the Wetter panel prints 9,4 °C as its headline and again as its first row
(`foreign-panel.png`), and `park.network` is the string `Park` / `Park` — a section header inside
the panel titled *Park*, for the paths.

### 7. A ride with no reading is reported as **Closed**

`telemetry.ts:457`: `state: state && i < state.length ? (RIDE_STATE_NAMES[state[i]] ?? 'closed') : 'closed'`.
Both fallbacks are `closed`. `rides.state.unknown` exists in both tables ('No reading' /
'Kein Messwert'), `rideTone` already maps it to neutral, and **nothing can ever produce it** — I
grepped. It feeds the counters too: `ridesOpen`/`ridesDown` are derived from these strings
(`telemetry.ts:392`), so a roster entry the frame has not covered becomes a *closed* ride in
"4 / 5 running" rather than an unmeasured one. This is the house rule of this repository
(CLAUDE.md, "Parks we cannot read": a missing measurement is not a state) applied to the module's
own domain. The 22 selftest checks never build a roster longer than the state buffer.
**Fixed looks like:** both fallbacks → `'unknown'`, and a 23rd check.

### 8. The hook that makes a panel cheap is not on the public contract

`useTelemetry`/`useTelemetrySnapshot`/`useChrome` take `UiRuntime`, the concrete class
(`hooks.ts:81, 99, 106`), not `UiMainApi`. All ten built-in panels therefore open with
`const runtime = ui as UiRuntime` — **10 casts** — and reach seven methods that are not on the
interface (`setRideShut`, `setShopPrice`, `setShopClosed`, `world()`, `entityName()`,
`resetAfterLoad()`, `ingestNotices()`). A foreign panel is handed `UiMainApi` and must either cast
to a class outside `api.ts` — which `module.ts` explicitly says is *not* the import path — or
hand-roll `useSyncExternalStore(ui.subscribe, ui.telemetry)`, which `hooks.ts`'s own docblock calls
"works and is wrong". So the 6.7-commits-per-publish figure is a number about `ui`'s own panels.
**Fixed looks like:** the three hooks only ever touch `subscribe`, `subscribeChrome` and
`telemetry()`, all of which are public — widen the parameter type to `UiMainApi` and export them
from `api.ts`. That is a two-word change and it is the difference between a registry and a registry
foreigners can use well.

### 9. The time-of-day scrubber writes a command per input event into the saved world log

`park.tsx:290` calls `handle.setTimeOfDay(…)` from `onChange`, which for `<input type="range">`
fires on every pointer move. `host.ts:485` dispatches `clock:set`; `sim-runtime.ts:204` pushes every
command into `world.log`, capped at 2000; `world.ts:168` serialises `log` into the save. One drag
across the day at `step={5}` is up to **288 commands**, evicting the player's actual build history
from a log that ships in the file. D-022 refuses exactly this shape for the camera pose ("a pose
changes on every mouse move… would put dozens of entries a second into `world.log`").
**Fixed looks like:** local state during the drag, one `setTimeOfDay` on pointer-up.

### 10. Four leaks between the HUD and the site it lives in

- **A raw manifest id on screen.** `inspector.tsx:210` renders `shop.need` — the string `thirst` —
  where `core-classic/pack.json` declares `needs[].name = {en:'Thirst', de:'Durst'}` and the
  registry has a whole `needs` category (`registry.ts:96`). The manifest owns the label and the
  panel ignores it.
- **°C only.** `park.tsx:261,264` hardcode `°C` and `m/s`. This site resolves a `temp_unit` cookie
  before paint and documents the whole mechanism as a requirement; `app/game/layout.tsx` already
  reads cookies for the locale and does not read this one.
- **Three status tokens re-invented.** The site already has a dark-mode triple for exactly these
  three states — `--status-operating: oklch(0.792 0.209 151.711)`, `--status-down:
  oklch(0.78 0.188 56.113)`, `--status-closed: oklch(0.704 0.191 22.216)` (`app/globals.css:763–765`)
  — and the HUD's `good` / `--game-warning` / `--game-danger` are
  `oklch(0.82 0.15 155)` / `oklch(0.8 0.16 80)` / `oklch(0.65 0.2 25)`: two near-duplicates and one
  hue moved 24° into yellow. Worse, `good` has no token at all: `oklch(0.82 0.15 155)` is written out **five times**
  across `surface.ts:73,80,87` and `panels/park.tsx:35,208` — and `panels/park.tsx:36` writes
  `bg-[oklch(0.82_0.16_190)]`, which is byte-identical to `--game-accent-2` in `core/game.css`,
  which it does not use. The whole argument of `surface.ts` is that a call site cannot write part of
  a recipe.
- **The rated-throughput disclaimer is missing where it is most needed.** `RideFacts` gives
  `rides.rated.hint` as a `title=`; `operations.tsx:170` prints "Riders per hour 480" in the ride
  row's action strip, beside a queue chip, with no hint at all — the one place a reader is invited
  to divide one by the other. (The wider claim holds: I grepped the module and **no panel anywhere
  computes a wait time**. `queuePressure` is a dimensionless capped meter. That part of the report
  is true.)

### 11. The shut park is drawn as a healthy one, and its crowd bar is invisible

Only visible at 23:00, which is why it is worth taking that shot. In `2300-overview.png` and
`2300-entrance.png` the park is closed: 16 guests, all Leaving, nothing running.

- **`RUNNING 0 / 4` is drawn in the `good` tone**, i.e. green. `park.tsx:106` is
  `tone={totals.ridesDown > 0 ? 'warn' : 'good'}` — a two-way rule with no case for "none of them
  are open". At 00:59 the reading happens to be benign; shut every ride from the panel at noon and
  the HUD will still colour it green. **Fixed:** three ways — `ridesDown > 0` warn, `ridesOpen === 0`
  neutral, else good.
- **The crowd bar reads as empty when everybody is doing one thing.** `leaving` is `bg-white/20`
  (`park.tsx:37`) and `StackBar`'s track is `bg-white/10` (`parts.tsx:272`), so a bar that is 100 %
  leaving is a 10 %-alpha difference across its whole width — in both frames it looks like an
  unfilled track. The two greys that carry the two most common end-of-day states (`leaving`
  `white/20`, `sitting` `white/25`) are the two weakest in the palette.

### 12. Smaller, all checked

- `rides.waiting` renders as "Warten 12" / "Waiting 12" on the inspector's queue meter
  (`inspector.tsx:144`) — a bare duration-shaped word beside a bare number, in the panel that
  carries the "we do not publish a wait time" note.
- `KEY_ROWS` (`system.tsx:334`) is thirteen hard-coded rows of keys owned by `camera` and `tools`.
  Accurate today — I checked every one against `camera/input.ts:50–69` and `tools/main.ts:505–514` —
  and there is no `registerShortcut`, so nothing keeps it accurate.
- `BUILTIN_PANELS` (`api.ts:179`) is exported, referenced nowhere, and lists **nine** panels: `log`
  is missing. The report says "nine" in three places; `STATUS.json` says ten; there are ten.
- `panels()` sorts by `order` across all groups, so my `group:'system', order:5` panel came back
  first in the list; only the rail re-groups. `order`'s docblock says "inside the group".
- `entityLabel` (`telemetry.ts:547`) hard-codes five of the registry's thirteen categories.
- 13 of 289 i18n keys are unreferenced, including a `tool.undo`/`tools.undo` near-duplicate pair
  that a foreign module could pick the wrong half of. (`hud.rating` is deliberate.)
- `buildCrowd()` sorts by count, so the legend's membership and row order change under the reader
  four times a second (Buying → Queuing between two of my frames).
- The pause menu is `role="dialog" aria-modal="true"` with no focus trap and no initial focus; Tab
  walks the HUD behind it. Notices use `role="status"` (polite) for warnings and errors.
- `SavesPanel.download` revokes the object URL synchronously after `a.click()` on an anchor never
  added to the document (`system.tsx:166–170`) — works in this Chromium, historically fragile.

---

## 7. What is genuinely good, and should not be removed

- **The registry is real and it is tested by its own tenants.** Ten panels and two inspectors go
  through the same three public calls a stranger would use, `Body` is a component so a foreign
  panel's hooks are its own, every registration hands back its exact undo, and the insertion-order
  tiebreak means a panel does not move when an unrelated module registers. I registered from
  outside and everything worked, including the unregisters and the `null` stat taking its slot back.
- **The two-channel subscription and the cached selectors.** Splitting the 4 Hz telemetry from the
  once-a-session chrome changes is the right cut, and the measurement backs it: ~4 commits per
  publish against 17 mounted subscribers.
- **The refusal to compute a wait time**, and the sentence in the ride inspector saying why. I
  looked for the division and it is not there.
- **The German.** „Auf dem Heimweg" rather than „Gehen", „Bau den Park, für den du dich anstellen
  würdest.", „Eisdiele hat 110 Einheiten nachgefüllt.", „Der Schnellspeicher liegt in diesem Browser
  und hält einen Park." This was written, not translated, and it is better than most German in
  shipped games.
- **The scrims**, and the argument for them. Verified over noon cloud and over black foliage.
- **The pause menu**, which uses the real `BrandLockup` and looks like it belongs to this site.
- **The `useSyncExternalStore` unbound-method docblock** (`runtime.ts:316`) — a real bug with a real
  post-mortem, written where the next person will hit it.
- **The report itself**, which ranks ten weaknesses and names both bugs the module caused. The two
  places it is wrong are worth fixing precisely because the rest of it is trustworthy.

---

## 8. Verdict

For `STATUS.json`, which this critic was told not to edit — `modules.ui`: `round: 1`,
`axes: { frame: 8.0, fidelity: 7.2, extensibility: 8.2, budget: 8.3, determinism: 8.6, honesty: 7.2 }`,
`score: 7.9`, `consoleErrors: 0`, `gated: false`, `verdict: "fail"`,
`gradedAtCommit: "b4f47ffae301681aff91c80cc688224b18ee3d7a"`.

**FAIL — 7.9.** No hard gate is broken and the budget is met with room. What keeps it under the mark
is that four of the twelve findings above are visible in a screenshot a player would take: an
English toast in a German HUD, the same event logged twice in two languages, a warning about a ride
that was repaired an hour ago, and a ride list showing one ride of four. Findings 1, 2, 3, 7 and 8
are between four lines and a two-word type change each; 4, 5 and 6 are one afternoon on the panel
column. Round 2 should be short.
