# `ui` — builder report

The interface of park.fan Coaster: the chrome around a running park, and the registry every other
module hangs its own panel off. Two folders, `lib/game/ui/` and `lib/game/i18n/` (DECISIONS #24).

Every number below comes from a file the harness wrote and every frame named was opened and looked
at. Where a frame contradicts a claim, the frame is what is written down.

---

## 1. What exists

### Files

| File                        | Lines | What it is                                                                                                                      |
| --------------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------- |
| `api.ts`                    |   234 | The public contract: `PanelDef`, `InspectorDef`, `StatDef`, `UiMainApi`, `UiRegistry`. No React at runtime, safe on the worker. |
| `telemetry.ts`              |   560 | `TelemetryCollector` — the park as the interface sees it, republished 4×/s. Pure.                                               |
| `runtime.ts`                |   452 | `UiRuntime`: registries, open-panel state, event wiring, the two subscription channels.                                         |
| `main.ts`                   |   139 | The module's main handle; registers the built-in panels and the top-bar figures.                                                |
| `module.ts`                 |    31 | `uiModule`, worker-safe, React behind a dynamic import.                                                                         |
| `hud.tsx`                   |   797 | The HUD shell: clock, speeds, figures, rail, notices, keys, the menu layer.                                                     |
| `panel-host.tsx`            |   400 | The panel frame and the dock: drag out, drop back, collapse, close; the phone sheet.                                            |
| `panels/park.tsx`           |   387 | Park overview, crowd, weather.                                                                                                  |
| `panels/operations.tsx`     |   302 | Rides list, shops list.                                                                                                         |
| `panels/inspector.tsx`      |   254 | The selection panel plus the ride, shop and generic inspectors.                                                                 |
| `panels/system.tsx`         |   381 | Settings, saves, the message history, the controls sheet.                                                                       |
| `panels/index.ts`           |   127 | Registers all nine, through the same calls a foreign module makes.                                                              |
| `menu.tsx`                  |   167 | The pause menu.                                                                                                                 |
| `parts.tsx`                 |   383 | `Figure`, `Meter`, `DataRow`, `StatusDot`, `Chip`, `StackBar`, the two HUD buttons.                                             |
| `hooks.ts`                  |   173 | The cached selector hooks, the media query, the commit tally.                                                                   |
| `surface.ts`                |   317 | The glass recipes and the four tones, as class strings.                                                                         |
| `format.ts`                 |   142 | Money, clock, counts, percentages. Pure.                                                                                        |
| `selftest.mjs`              |   402 | 22 checks over the registry, the formatters and the collector. Wired into `pnpm test:game` as `test:game-ui`.                   |
| `scripts/game-shot-hud.mjs` |   318 | Not in the module folder and deliberately so: the coverage harness §6 measures with.                                            |
| `i18n/en.ts`, `i18n/de.ts`  |   664 | 294 keys each, up from 117.                                                                                                     |

### Public API (`@/lib/game/ui/api`)

```ts
const ui = ctx.module<UiMainApi>('ui');
const off = ui?.registerPanel({ id, title, icon, group, order, rail, width, Body, badge });
ui?.registerInspector({ kind, icon, title, Body }); // per entity kind
ui?.registerStat({ id, label, icon, order, size, phone, value }); // a figure in the top bar
```

Every call returns its own unregister. `Body` is a **component**, not a render function, so a
foreign panel may use as many hooks as it likes without reordering the host's. The title is a
plain string rather than a key, so a module can ship before its i18n keys land.

Also on `UiMainApi`: `open/close/toggle/isOpen/openPanels`, `menuOpen/setMenu`, `telemetry()`,
`subscribe` (4 Hz park data) and `subscribeChrome` (panel opened/closed/registered),
`handle()`, `dispatch()`, `setSpeed()`, `notify()`, `select()`, `selected()`, `focus()`,
`locale()`, `t`.

### Owned state

Nothing persistent, as the architecture table says. The open-panel set, the menu flag and a panel's
floating position live in the runtime and in React and are deliberately not in the save: a save is
shared, and loading somebody else's park should not rearrange your windows. Same argument
D-022 makes for the camera pose.

### Events consumed

`ride:roster`, `ride:breakdown`, `ride:fixed`, `shop:sale`, `shop:restock`, `guest:thought`,
`clock:day`, `entity:add/update/remove`, plus the tool state through `ToolsMainApi.subscribe`.
It emits none: the HUD acts through `ctx.dispatch` and through other modules' APIs.

### What the panels draw

Nine panels, and the thing worth saying about them is what is **not** in them.

| Panel         | Drawn from                                                                                                                                                                                   |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Park**      | guests, mood, cash, takings today; the crowd breakdown; rides open/total, queueing, riding, rides taken today, riders per hour; shops open/total, at a counter; path nodes and path networks |
| **Rides**     | one row per machine: state, queue with a pressure meter, riders/capacity; sort by queue, name or state; select, focus, shut, repair or service                                               |
| **Shops**     | name, kind, live price with a ±10 ct stepper, open/shut, sold today, takings today                                                                                                           |
| **Guests**    | count, mood meter, the full behaviour breakdown with shares, and the live thought feed                                                                                                       |
| **Weather**   | season, weather, temperature, wind, cloud, wet ground, what is falling, and a time-of-day scrubber                                                                                           |
| **Selection** | whatever `tools` has selected, through the inspector registered for its kind                                                                                                                 |
| **Messages**  | the notification history, aged in park time                                                                                                                                                  |
| **Saves**     | quick save/load in `localStorage`, export to a file, copy the JSON, import a file                                                                                                            |
| **Settings**  | engine, preset, cores, pixel ratio, input; the four presets as a reload; live frame metrics                                                                                                  |

**There is no park rating and no daily ledger.** `DayLedger.rating`, `income` and `expenses` are
written as zeros by `core/module.ts` on the day rollover and computed by nobody, because
`management` is a scaffold. A rating derived from guest mood would be a number wearing a name it
had not earned, so the slot is empty and `registerStat` is waiting for it (request 6).

**There is no wait time.** The sim computes one per ride (`RideView.waitMinutes`) and does not
publish it. The list shows the measured queue length and the rated throughput
(`capacity / cycleMinutes × 60`, which is arithmetic on figures the main thread holds), and the
ride inspector carries one line saying so in both languages.

---

## 2. What was verified

Zero console errors and zero hydration warnings in every run listed. Frames were opened with the
Read tool and judged; the numbers are from the `report.json` beside them.

### Frames

| File                                    | What is in it                                                                                                                                                                                                                                                                                                           |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.game-render/ui-day/1300-overview.png` | 1920×1080, 13:00, demo park after 2,400 ticks. Chrome plus the park panel: 1,471 guests, mood 40, €2,502,771, €2,771 takings, crowd bar (leaving 750 / walking 621 / standing 42 / lost 27 / riding 13), rides 4/4, 471 rides taken, 311 riders per hour, shops 6/6, 12 at a counter, 1,534 path nodes, 1 path network. |
| `.game-render/ui-states/operations.png` | Rides and Shops docked together. Carousel _Running_ 12/24 with 5 queuing; Ferris wheel _Dispatching_; Lemonade at €3, 288 sold, €864 taken.                                                                                                                                                                             |
| `.game-render/ui-states/selection.png`  | Clicking a ride: the row highlights with its inline actions, `tools` prints "Selected ride-1544", the Selection panel opens by itself with the ferris wheel's real figures (48 seats, 480 riders per hour, excitement 3.1, fear 1.8, nausea 0.4, ticket included, €22 upkeep).                                          |
| `.game-render/ui-states/system.png`     | Guests panel: 1,498 in the park, mood 42, eight behaviours with shares, and 24 live thoughts.                                                                                                                                                                                                                           |
| `.game-render/ui-states/menu.png`       | The pause menu over a dimmed park, on the shared `BrandLockup`.                                                                                                                                                                                                                                                         |
| `.game-render/ui-night/selection.png`   | 23:59. Every ride _Closed_, 127 guests, mood 41. The glass reads as glass against a dark park.                                                                                                                                                                                                                          |
| `.game-render/ui-bright/1200-close.png` | 12:00 at the `close` camera, guests on bright paving. Legible over the brightest surface in the game.                                                                                                                                                                                                                   |
| `.game-render/ui-de1280b/selection.png` | 1280×720, German: Fahrgeschäfte / Schlange / Karussell _Läuft_ / Riesenrad _Einsteigen_ / Auswahl / KASSE, GÄSTE, STIMMUNG, IN DER SCHLANGE, PAUSIERT.                                                                                                                                                                  |
| `.game-render/ui-de1280b/system.png`    | Three panels sharing a 512 px column at 720 height, all three readable.                                                                                                                                                                                                                                                 |
| `.game-render/ui-phone3/default.png`    | 390×844: menu + clock + cash on one row, the rail wrapped to two rows under it, the park panel as a sheet **above** the build bar rather than over it. **Struck in round 2** (§6.3): the sheet in that frame is 16.0 px tall.                                                                                           |
| `.game-render/ui-final/none.png`        | The chrome with no panel open, on a live park.                                                                                                                                                                                                                                                                          |

### Budget

The HUD is DOM over the canvas: it adds **no draw calls and no triangles**, and the frame metrics
in every run are the scene's alone. What it costs instead is DOM nodes and React commits, measured
in `.game-render/ui-final` at 1920×1080 on the demo park:

| State                                 | DOM nodes under `[data-game-hud]` | Document total |
| ------------------------------------- | --------------------------------: | -------------: |
| chrome only, no panel                 |                               220 |            417 |
| chrome + the park panel               |                               324 |            521 |
| chrome + guests, weather and settings |                               538 |            735 |

**React commits at speed 3** — the figure the brief asks for. The telemetry snapshot publishes at
most every 250 ms (`PUBLISH_MS`), driven by the render loop, and every subscribing component calls
`useCommitTally()` into `window.__parkfan_hud`:

| Open panels               | commits / publish | at the full 4 Hz cadence |
| ------------------------- | ----------------: | -----------------------: |
| none                      |              4.78 |            ~19 commits/s |
| park, rides, shops        |              5.67 |            ~23 commits/s |
| guests, weather, settings |              5.36 |            ~21 commits/s |

The **per-publish ratio is the transferable number**; the per-second one is not, and saying so is
the point. This container's software renderer runs the demo park at 0.3–0.8 fps, and the publish
is driven from `onRender`, so the harness observed 0.8 publishes/s and 4.5 commits/s where a real
browser at 60 fps would publish four times a second. Against a HUD with roughly fifteen subscribing
components, a naive implementation would sit near 60 commits/s; 5.4 per publish is what the cached
selectors in `hooks.ts` buy.

### Checks

- `node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/ui/selftest.mjs` — **22 checks**, covering the registry's ordering and replacement rules, every formatter, and the collector against a synthetic frame (buffer-to-roster indexing, the open/down counts, the crowd histogram skipping free slots, the day rollover, a load clearing what was counted on this side, and the clock coming from the world rather than the frame).
- `pnpm test:game` — green, including `test:game-i18n`: **289 keys × en/de**, no em dash, no `ehrlich`.
- `npx tsc --noEmit -p tsconfig.json` — clean. `npx eslint lib/game/ui lib/game/i18n` — clean.

### Two bugs found and fixed here

**`useSyncExternalStore` was handed an unbound method.** `subscribe` and `subscribeChrome` were
prototype methods on `UiRuntime`, so React called them with `this` undefined and the passive effect
threw `Cannot read properties of undefined (reading 'telemetryListeners')`. The HUD froze one
render after mount with every figure at zero — which is what it looked like from outside, and what
made it expensive was the second half: React's dev build logs a failed effect to its component
performance track with the rendered props in the entry's `detail`, that detail reached core's
`Registry`, and `performance.measure` could not structured-clone it, so it threw _inside the commit
phase_ and React unwound with `Should not already be working.` Two errors, neither of which names
the cause. It was found by wrapping `performance.measure` in an init script and dumping the detail.
Both halves are fixed — mine here (arrow-function class fields, with the reasoning in the
docblock), core's by the integrator (`Registry.name` was a static method shadowing
`Function.prototype.name`; it is `Registry.localized` now, asserted by `pnpm test:game-registry`).

**The clock and the speed were read from the last frame.** At `speed=0` the harness sets the time
of day and no frame follows, so the bar showed 09:00 at speed 1 while the world had been moved to
13:00 and paused. Both now come from `world.clock`, which `host.ts` mirrors from every frame _and_
which `setTimeOfDay`/`setSpeed` write directly. Pinned by a selftest check.

---

## 3. What is weak, ranked

1. **The ride list has a queue length where a wait time belongs.** It is the number a player
   actually plans with, the sim already computes it, and there is no channel to ask for it
   (requests 1 and 3). Everything else missing from the ride and shop rows — measured throughput,
   utilisation, satisfaction, downtime, stock, per-shop queue — has the same single cause.

2. **Three writes are optimistic and do not survive a reload.** `rides:close`, `shops:price` and
   `shops:close` are applied in the worker and never echoed back, so the HUD mirrors them locally.
   Set a shop's price, reload, and the panel shows the manifest price while the sim charges the
   one you set. Request 2 is a one-line `entity:update` in each sim.

3. **Per-shop takings are counted on this side.** The park-wide figure comes from the frame and is
   authoritative; the per-shop split is this module adding up the `shop:sale` events it has seen
   since the page opened. Correct on a park that has run since tick 0, wrong after a `load()` —
   which is why the counters reset on a load, and why the column says what it is in both languages.

4. **The panel dock is a dock, not a window manager.** Drag out, drop back, collapse, close, and
   nothing else: no resize, no z-order, no remembered layout between sessions. A floating panel's
   position is React state and is gone on reload.

5. **Saving is a stopgap in the wrong module.** One `localStorage` slot plus file export/import.
   The slot list, the names and the thumbnails belong to `persistence` (request 5).

6. **`notice.sim:timeout` fires on a slow boot rather than on a dead simulation**, and the HUD
   _retracts_ it rather than fixing it. On this harness a boot takes 20–30 s under SwiftShader,
   the host's deadline is 8 s, and the result was the frame in `.game-render/ui-bright` — "The
   simulation did not start" eight hundred pixels from a panel reporting 1,441 guests and 4/4 rides
   running. The notice is now withdrawn the moment a frame arrives, and the entry stays in the
   messages panel. Core still leaves `phase` at `reduced` for the rest of the session, which
   nothing renders but which is wrong; request 8 asks for the proper fix.

7. **The commit figure counts the components that call the tally**, which is every chrome component
   plus every panel body that subscribes to the whole snapshot. A panel body using a narrow
   `useTelemetry` selector — the two inspectors — is not counted. The number is therefore a close
   floor rather than an exact total, and the docblock on `useTelemetrySnapshot` says so.

8. **`window.__parkfan_hud` is a debug surface and stays.** It is how the commit figures above were
   taken. It is three numbers and a `reset()`, next to core's own harness object.

9. **Touch is a compromise, not a design.** ~~The phone layout fits at 390 px and was measured
   there~~ — **wrong, and round 2's critic found it**: the panel sheet measured **16.0 px** at
   390 × 844, the clipped top of its own 40 px header, because it was a flow item under a palette
   whose height is another module's decision. "Measured there" meant the rail and the clock were;
   nobody measured the panel. Fixed in §6.3. The rest of the entry stands: the rail wraps rather
   than scrolling so nothing hides behind a gesture, and dragging a panel, the ±10 ct steppers and
   the time-of-day scrubber all want a pointer.

10. **`NL/FR/ES/IT` fall back to English** by DECISIONS #7, including all 172 new keys.

---

## 4. Decisions taken here

- **The park panel opens on boot.** A HUD whose panels are all shut gives a first-time player no
  reason to think there is anything in them. ~~It is 344 px of a 1920 px frame~~ — a width quoted
  where an area was the question: the column was 344 × 932 px, **15 % of a 1920 × 1080 frame** and
  21.4 % of a 1280 × 720 one. It is 288 × 461 after round 2 (5.6 % and 14.4 %), and on a phone it
  no longer opens at all (§6.4). Closing it still sticks for the session, and every other panel
  still starts shut.
- **The engine badge and the frame metrics moved out of the top bar** into Settings. A shipped
  game's HUD does not carry an fps counter; the harness reads them from `report.json` anyway.
- **Two scrims, top and bottom.** `backdrop-blur` blurs what is _behind_ a surface and does nothing
  for the sky _between_ two of them, and this bar is two clusters with a kilometre of noon sky in
  between. The gradients give everything in those rows a floor of contrast at 12:00 and at 23:00.
- **Docked panels share the column rather than each being capped.** A cap plus a scrolling column
  was the first attempt and failed on its own case: at 1280×720 the ride list took 380 px of a
  512 px column and the inspector under it was a header and a sliver.
- **Below `sm` the top row becomes two rows and the guest count leaves the bar.** Measured at
  390 px, the desktop arrangement needs 396 px of chrome in 378 px of usable width and the guest
  count was the figure hanging off the right edge. Money is the headline on a phone; the crowd is
  one tap away in a panel that draws it four ways.
- **Keys were chosen to miss the ones `camera` and `tools` already hold.** Space, the digits 1–4,
  F1, and Escape shared on purpose.
- **The menu pauses on open and restores the speed it interrupted**, not a default.
- **`i18n` grew from 117 to 289 keys** and is EN + DE complete. German was written, not translated:
  no em dash, no `ehrlich`, and `Auf dem Heimweg` rather than `Gehen`, which collided with
  `Unterwegs` in the same list.

---

## 5. Requests

In `docs/game/requests/ui.md`, ranked by what they cost the player. The first is the one that
matters: **there is no way to ask the worker a question**, and eight of the ten weaknesses above
are that one hole seen from different panels.

---

## 6. Round 2 — finding the size back

Graded 7.4 against a bar of 8.5 on the "Moulded" skin (`8ae6990`). Five findings, in the critic's
order of severity. Everything below was measured with **`scripts/game-shot-hud.mjs`**, which is new
in this round and exists because the round that decided this module was decided by a number nobody
here could reproduce: it hit-tests a 240 × 240 grid (57,600 points, the critic's own count) with
`document.elementFromPoint`, unions the rectangles of the elements that actually paint, and splits
both by owner — `[data-build-bar]` is `tools`, everything else under `[data-game-hud]` is this
module. It writes the DOM boxes beside the PNG, which is what separates a layout bug from a raster
one, and it was the only reason finding 1 could be answered at all.

**Which server.** The dev server on `http://localhost:3001`. The production build on `:3100` is
from 16:02 and predates this round; it was used for the **before** frames, which is what it is good
for — it serves the exact commit the critic graded. The two agree where both were measured
(1024 × 768: 71.2 % against 71.0 %), so the before/after table mixes them without a footnote per
row. The `N` badge in the bottom-left corner of every dev frame is Next's own dev indicator, not
game chrome; it is outside `[data-game-hud]` and counts as park in every number here.

**A note on the commit history.** Part of this round landed early, in `6264595`, through an
integrator error — `git add -A lib/game` while committing another module swept in six of these
files mid-edit. Nothing was lost and nothing about the work changed; a reader diffing the final
commit alone will simply see less than was done.

### 6.1 Size: 69.3 % → 63.6 % at 1280 × 720, and the split matters more than the total

The critic's headline. Measured before and after, demo park, the default state (the park panel
opens on boot on a desktop), `elementFromPoint` over 57,600 points:

| viewport    | before | `ui` | `tools` |  after | `ui` | `tools` |
| ----------- | -----: | ---: | ------: | -----: | ---: | ------: |
| 1280 × 720  | 68.7 % | 29.8 |    38.9 | 63.6 % | 22.4 |    41.2 |
| 1024 × 768  | 71.2 % | 37.1 |    34.1 | 63.5 % | 26.6 |    36.8 |
| 1440 × 900  | 59.2 % | 22.6 |    36.6 | 51.1 % | 16.0 |    35.1 |
| 1920 × 1080 | 48.2 % | 15.0 |    33.2 | 32.0 % | 10.0 |    22.0 |
| 390 × 844   | 81.3 % | 24.0 |    57.3 | 68.4 % | 26.8 |    41.6 |

The critic measured 69.3 / 61.1 / 48.6 at the three desktop sizes; this instrument reads
68.7 / 59.2 / 48.2 on the same build, so the two are the same method to within two points.

**This module's own share is down 25 to 40 % everywhere, and the total is not, because the biggest
single object on the screen is the build cluster and it is not mine.** At 1280 × 720 it is 41.2 %
of the frame on its own — more than everything this module draws, twice over. `ui` cannot resize
somebody else's palette; what it could do, and did, is stop handing it more room than it asked for
(§6.5) and write the measurement into `docs/game/requests/ui.md` §13 with the two numbers that
would move it: the `38vh` palette grid (274 px of the cluster's 399 at 720) and its 5-column tile
size.

The honest second number, because "how much does the HUD cover" depends on whether a panel is
open: with **no panel open** at 1280 × 720 this module's chrome — clock, figures, rail, one notice
— is **8.0 %** of the frame (49.5 % total, of which 41.6 is the build cluster).

Where the 7.4 points came from, at 1280 × 720:

- the dock column 344 → **288 px** wide (the widest row in any of the ten panels fits in 266 px of
  content box), and bounded `top-[124px] … bottom-[52px]` instead of reaching the floor;
- the park panel's content 626 → **421 px** (§6.4), so the column no longer fills its own height:
  the panel is 461 px against 572;
- the clock tray, the figure tray and the rail tightened by their paddings and one type step —
  the trays lost 10 px of height each, no control lost its size, and the button scale in
  `components/ui/button.tsx` still decides every height including the 44 px phone tier;
- the two scrims 144 → 112 px and 240 → 176 px, about a fifth lighter, because the moulded trays
  carry contrast the flat chrome needed them for. They are counted apart from both numbers above
  (12–15 % of the frame, gradient, park visible through them) and folding them in either direction
  would make this table say whatever one wanted.

Nothing in the material changed: the bevels, the gloss, the two accents and the raised/sunk rule
are the same recipes in `surface.ts`. What changed is how many square millimetres wear them.

### 6.2 The 768 px paint break: the layout was right, the raster was not

**Reproduced first**, on the production build the critic graded, at 1024 × 768:
`.game-render/ui-r2-before/prod-before-1024x768-park.png` — at x = 350 the pixels from y = 574 to
y = 624 are park (74, 107, 56) inside a tray whose box runs 339 → 696, with item tiles painted over
and below it. Also on the dev server (`before-1024x768-park.png`), and **not** at 1280 × 720
(`before-1280x720-park.png`), which is what made the width the interesting variable rather than the
height.

**The DOM was correct in the same run.** The section is `overflow: hidden`, box 339 → 696; the grid
inside it is `overflow-y: auto`, `max-height: 291.84px`, box 368 → 660; every tile below 660 is
clipped in layout. So nothing in either module's boxes was mislaid out — a strip of the composited
HUD layer over the WebGL canvas was never repainted. `tools` measured the same band in the critic's
frame and found it **blurred but not darkened** (variance 117 inside against 134 outside): the
tray's `backdrop-filter` painted there and its `background-color` did not.

**The trigger was mine.** The bottom cluster padded itself by the dock's width _only while a panel
was docked_, and the build tray is `w-[min(64rem,100%)]` of that box — so opening or closing any
panel relaid out the whole palette, at every viewport below 64rem + the dock. That is exactly the
set of widths the break was seen at (1024, 1152, 1366) and not the ones it was not (1440, 1920,
where the tray is 1024 px either way and only moves). The cluster's box now has **one width per
viewport** and the dock's state changes a margin instead.

**Where it stands: 0 of 6** frames at 768 px height since the change, against **4 of 4** before —
and "before" included five consecutive screenshots 25 s apart in one session, so it is not a
transient that a repaint clears. Looked at:
`.game-render/ui-r2/final-1024x768-park.png`, `r2-1024x768-park.png`,
`.game-render/ui-r2-frames/1024x768/1300-overview.png` and `2300-overview.png`.

**What is not proven, and it is the half that points back here.** A relayout is a trigger, not a
cause. The surface stack that makes the fault possible is this module's — a translucent body plus
a sheen plus `backdrop-blur-[24px]` over a WebGL canvas — and it cannot be A/B'd from here any
more, because the trigger is gone and every mid-session style mutation repaints the layer and
"fixes" it (all seven tried did, including ones that cannot possibly be the cause). Written up
with the recipe in `docs/game/requests/ui.md` §12 so the next person to see it has the method
rather than the guess.

### 6.3 The phone panel: 16.0 px → 490

Confirmed on the graded build before touching anything:
`.game-render/ui-r2-before/prod-before-390x844-park.png` shows the clipped top of the park panel's
own header, two half-cut buttons in it, `rect.h = 16.0`. The cause was structural rather than
numeric: the sheet was a flow item in the same column as the build cluster, whose height is another
module's decision (512 px with five item rows open), so it was handed what was left.

Two changes. The sheet **leaves the flow** — `absolute inset-x-2 bottom-2 z-40`, `max-h-[58svh]`,
over the build cluster rather than above it, measured at 490 px with 65 px of scroll
(`.game-render/ui-r2/after2-390x844-park.png`). And the park panel **no longer opens on boot below
`sm`**: the sheet is 58 % of a phone, and a player's first screen should be the park
(`.game-render/ui-r2-frames/390x844/1300-overview.png` — chrome, park, palette; 68.4 % against the
82.5 % the same phone measures with the sheet up). The trade is stated rather than hidden: while a
panel is open on a phone the build cluster is behind it, and closing it is one tap on a 44 px key.

The notice stack moved with it. It was `top-[6.75rem]`, an offset measured off the old chrome, and
when the clock tray lost 10 px this round the notice landed on the figures; on a phone it is a
flow element under the rail now, which cannot go stale.

### 6.4 The park panel: the content decision, taken

Round 1's report said trimming further "means deleting rows, not pixels, and that is a content
decision I did not take". Taken:

- **The four figure tiles are drawn below `sm` only.** Above it the top bar already carries cash,
  guests and mood as three grooves of its own, so the grid was the same three figures a second
  time, 98 px down a column that was too short for them. Below `sm` the bar drops all three
  (`phone: false`), and that is exactly where the tiles now are.
- **The network section is drawn only when it has something to say** — a second path network
  strands guests, a train count exists only in a park that has one. `Path nodes: 1,534` is a
  diagnostic nobody builds differently for.
- Takings today moved into the shops section, which is where the money comes from; the crowd
  legend is four entries rather than five; `DataRow` lost 2 px of padding, which every panel and
  both inspectors get.

Measured at 1280 × 720: content **626 → 421 px**, panel 572 → 461, **0 px hidden** — and the same
0 at 1024 × 768, 1440 × 900 and 1920 × 1080. The critic's "54 px hidden with one panel" (this
instrument read 94) is gone rather than smaller.

**With three panels open it is not gone, and cannot be.** At 1280 × 720 the column is 544 px for
three headers and three bodies: park 212 px (249 below the fold), rides 212 (105), messages 104
(0, it hands the rest back). That is the geometry of a 720 px screen, and the answer to it is the
second half of this fix: **the body says it scrolls**. It always scrolled; nothing said so, because
Chromium's scrollbar here is an overlay — measured, `offsetWidth - clientWidth` = 0 on all three —
and neither `scrollbar-width: thin` nor `::-webkit-scrollbar` reaches it (the site's `globals.css`
sets `scrollbar-color` on `.dark`, which inherits into every element in the game and disables the
pseudo-elements). So `ScrollEdge` draws a 24 px shadow across the bottom of a panel while there is
something under it, and nothing when there is not: in
`.game-render/ui-r2/r2b-three-1280x720-park+rides+log.png` the park and rides panels carry it and
the messages panel does not. Both halves were measured rather than eyeballed: with the shops panel
at 264 px of slack the mark is there, scrolled to the end (slack 0) it is gone, scrolled back to
the top it returns — while the park panel above it keeps its own throughout.

### 6.5 Core's corner lockup, and the width `tools` was being handed

The lockup is `core/game-brand.tsx` at `right-3 bottom-3` on `z-20`, above the whole HUD, which a
child of a `z-10` root cannot climb over. The column stops at `bottom-[52px]` now, so nothing is
drawn under it at any viewport; the round-1 workaround (46 px of padding inside the bottom panel's
body) was wrong the moment the body scrolled, since padding in a scroller moves with the content.
Written up again in `docs/game/requests/ui.md` §11 — it is 52 px of column spent on a mark the
toolbelt already carries eight pixels away.

The same change found something worth reporting the other way. The build cluster's root is
`w-full`, with `pointer-events-auto` on it — so at 1920 × 1080 its box was **1540 px wide** while
the tray inside it was 1024, and the 516 × 446 px difference was a transparent element over the
park that swallowed every click in it. `ui` was handing it that width. The wrapper is
`w-[min(64rem,calc(100%-300px))]` now: the click band is gone and the build share at 1920 reads
22.0 % against 33.2 %, which is most of that row's improvement. The cost is stated in the request:
the cluster is handed 300 px less than the window has at every viewport, which is what buys a
palette that never relays out under the pointer.

### 6.6 What is still weak after this round

1. **The build cluster is 41 % of a 720p frame** and this module can only ask. Request §13.
2. **Three panels on a 720 px screen give each about 170 px of body.** The scroll edge makes that
   visible and reachable; it does not make it roomy. Dragging one out of the column is the
   affordance, and it is not discoverable from looking.
3. **The paint break is closed by its trigger, not by its cause** (§6.2). If it returns with the
   width constant, the next suspect is this module's material.
4. **The phone hides the build cluster while a panel is open.** Better than a 16 px panel, still a
   compromise; a phone with a 512 px palette and an 844 px screen has room for one of the two.
5. **`ScrollEdge` is a `ResizeObserver` and a scroll listener per open panel.** Cheap (≤ 4 panels,
   one boolean each, re-render only on the flip) and it is still the first piece of per-panel
   runtime state in the host.
6. Everything in §3 that round 1 listed and this round did not touch: no worker query channel,
   three optimistic writes, per-shop takings counted on this side, saves in `localStorage`.

### 6.7 Frames

Every one was opened and looked at. Before, on the graded production build (`:3100`):
`.game-render/ui-r2-before/prod-before-1024x768-park.png` (the paint break),
`prod-before-390x844-park.png` (the 16 px sheet); on the dev server,
`.game-render/ui-r2-before/before-1024x768-park.png` and `before-1280x720-park.png`.

After, the default state at five viewports, 13:00 and 23:00, from `scripts/game-shot.mjs`:
`.game-render/ui-r2-frames/{1280x720,1024x768,1440x900,1920x1080,390x844}/{1300,2300}-overview.png`.
Measurement runs with their JSON beside them: `.game-render/ui-r2/r2-*.png`,
`after2-390x844-park.png`, `r2b-three-1280x720-park+rides+log.png`, `r2-nopanel-*.png`.

`ScrollEdge` (§6.4) is the only change made after the `ui-r2-frames` set was taken, and the phone
boot rule (§6.3) the only one after its desktop half; both are named where they are claimed.

### 6.8 Checks

`npx tsc --noEmit -p tsconfig.json` silent over `lib/game`, `npx eslint lib/game/ui` clean,
`npx prettier --check lib/game/ui lib/game/core/game.css scripts/game-shot-hud.mjs` clean. 294
i18n keys × en/de — **no new strings this round**: it deleted rows and moved existing ones.

`pnpm test:game` **is red at the time of writing, and not here**: the failing check is
`no upright face anywhere is walled in on its front and open on its back — 1982 triangles,
197.8 m²` in `lib/game/buildings/selftest.mjs`, against `lib/game/buildings/build.ts` — both
modified in the shared working tree by the agent building that module, neither of them mine, and
that selftest imports nothing from `lib/game/ui`. Every suite that can see this module is green,
run one by one: `test:game-ui` 22 checks, `test:game-lint` 264 files clean, `test:game-i18n`,
`test:game-registry`, `test:game-save-roundtrip`. `test:game-ui` is part of `pnpm test:game` now
(request 7, granted).
Zero console errors and zero hydration warnings in every frame set listed above — all five
`game-shot.mjs` runs report `errors 0 · hydration 0`. Three measurement runs out of about twenty
did not: two failed to boot at all and one booted on a retry, every one of them on core's known
`applyEnvironment` crash (`Cannot set properties of null (setting 'exposure')`, then
`Cannot access 'harness' before initialization`), which is request 9 in this module's own file and
has nothing to do with the HUD. Each was re-run and the re-run reproduced the numbers exactly —
63.6 % / 22.4 / 41.2 at 1280 × 720 on the final code, the same three figures as the run before it.
