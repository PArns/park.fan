# `ui` — builder report

The interface of park.fan Coaster: the chrome around a running park, and the registry every other
module hangs its own panel off. Two folders, `lib/game/ui/` and `lib/game/i18n/` (DECISIONS #24).

Every number below comes from a file the harness wrote and every frame named was opened and looked
at. Where a frame contradicts a claim, the frame is what is written down.

---

## 1. What exists

### Files

| File                         | Lines | What it is                                                                                   |
| ---------------------------- | ----: | -------------------------------------------------------------------------------------------- |
| `api.ts`                     |   234 | The public contract: `PanelDef`, `InspectorDef`, `StatDef`, `UiMainApi`, `UiRegistry`. No React at runtime, safe on the worker. |
| `telemetry.ts`               |   554 | `TelemetryCollector` — the park as the interface sees it, republished 4×/s. Pure.             |
| `runtime.ts`                 |   437 | `UiRuntime`: registries, open-panel state, event wiring, the two subscription channels.       |
| `main.ts`                    |   119 | The module's main handle; registers the built-in panels and the top-bar figures.              |
| `module.ts`                  |    31 | `uiModule`, worker-safe, React behind a dynamic import.                                       |
| `hud.tsx`                    |   709 | The HUD shell: clock, speeds, figures, rail, notices, keys, the menu layer.                   |
| `panel-host.tsx`             |   288 | The panel frame and the dock: drag out, drop back, collapse, close; the phone sheet.          |
| `panels/park.tsx`            |   351 | Park overview, crowd, weather.                                                                |
| `panels/operations.tsx`      |   298 | Rides list, shops list.                                                                       |
| `panels/inspector.tsx`       |   254 | The selection panel plus the ride, shop and generic inspectors.                               |
| `panels/system.tsx`          |   376 | Settings, saves, the message history, the controls sheet.                                     |
| `panels/index.ts`            |   127 | Registers all nine, through the same calls a foreign module makes.                            |
| `menu.tsx`                   |   166 | The pause menu.                                                                               |
| `parts.tsx`                  |   285 | `Figure`, `Meter`, `DataRow`, `StatusDot`, `Chip`, `StackBar`, the two HUD buttons.            |
| `hooks.ts`                   |   159 | The cached selector hooks, the media query, the commit tally.                                  |
| `surface.ts`                 |   107 | The glass recipes and the four tones, as class strings.                                        |
| `format.ts`                  |   119 | Money, clock, counts, percentages. Pure.                                                       |
| `selftest.mjs`               |   402 | 22 checks over the registry, the formatters and the collector.                                 |
| `i18n/en.ts`, `i18n/de.ts`   |   653 | 289 keys each, up from 117.                                                                    |

### Public API (`@/lib/game/ui/api`)

```ts
const ui = ctx.module<UiMainApi>('ui');
const off = ui?.registerPanel({ id, title, icon, group, order, rail, width, Body, badge });
ui?.registerInspector({ kind, icon, title, Body });   // per entity kind
ui?.registerStat({ id, label, icon, order, size, phone, value });  // a figure in the top bar
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

| Panel         | Drawn from                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------- |
| **Park**      | guests, mood, cash, takings today; the crowd breakdown; rides open/total, queueing, riding, rides taken today, riders per hour; shops open/total, at a counter; path nodes and path networks |
| **Rides**     | one row per machine: state, queue with a pressure meter, riders/capacity; sort by queue, name or state; select, focus, shut, repair or service |
| **Shops**     | name, kind, live price with a ±10 ct stepper, open/shut, sold today, takings today            |
| **Guests**    | count, mood meter, the full behaviour breakdown with shares, and the live thought feed         |
| **Weather**   | season, weather, temperature, wind, cloud, wet ground, what is falling, and a time-of-day scrubber |
| **Selection** | whatever `tools` has selected, through the inspector registered for its kind                  |
| **Messages**  | the notification history, aged in park time                                                   |
| **Saves**     | quick save/load in `localStorage`, export to a file, copy the JSON, import a file             |
| **Settings**  | engine, preset, cores, pixel ratio, input; the four presets as a reload; live frame metrics    |

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

| File                                          | What is in it                                                                                  |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `.game-render/ui-day/1300-overview.png`       | 1920×1080, 13:00, demo park after 2,400 ticks. Chrome plus the park panel: 1,471 guests, mood 40, €2,502,771, €2,771 takings, crowd bar (leaving 750 / walking 621 / standing 42 / lost 27 / riding 13), rides 4/4, 471 rides taken, 311 riders per hour, shops 6/6, 12 at a counter, 1,534 path nodes, 1 path network. |
| `.game-render/ui-states/operations.png`       | Rides and Shops docked together. Carousel *Running* 12/24 with 5 queuing; Ferris wheel *Dispatching*; Lemonade at €3, 288 sold, €864 taken. |
| `.game-render/ui-states/selection.png`        | Clicking a ride: the row highlights with its inline actions, `tools` prints "Selected ride-1544", the Selection panel opens by itself with the ferris wheel's real figures (48 seats, 480 riders per hour, excitement 3.1, fear 1.8, nausea 0.4, ticket included, €22 upkeep). |
| `.game-render/ui-states/system.png`           | Guests panel: 1,498 in the park, mood 42, eight behaviours with shares, and 24 live thoughts.   |
| `.game-render/ui-states/menu.png`             | The pause menu over a dimmed park, on the shared `BrandLockup`.                                 |
| `.game-render/ui-night/selection.png`         | 23:59. Every ride *Closed*, 127 guests, mood 41. The glass reads as glass against a dark park.   |
| `.game-render/ui-bright/1200-close.png`       | 12:00 at the `close` camera, guests on bright paving. Legible over the brightest surface in the game. |
| `.game-render/ui-de1280b/selection.png`       | 1280×720, German: Fahrgeschäfte / Schlange / Karussell *Läuft* / Riesenrad *Einsteigen* / Auswahl / KASSE, GÄSTE, STIMMUNG, IN DER SCHLANGE, PAUSIERT. |
| `.game-render/ui-de1280b/system.png`          | Three panels sharing a 512 px column at 720 height, all three readable.                          |
| `.game-render/ui-phone3/default.png`          | 390×844: menu + clock + cash on one row, the rail wrapped to two rows under it, the park panel as a sheet **above** the build bar rather than over it. |
| `.game-render/ui-final/none.png`              | The chrome with no panel open, on a live park.                                                   |

### Budget

The HUD is DOM over the canvas: it adds **no draw calls and no triangles**, and the frame metrics
in every run are the scene's alone. What it costs instead is DOM nodes and React commits, measured
in `.game-render/ui-final` at 1920×1080 on the demo park:

| State                                     | DOM nodes under `[data-game-hud]` | Document total |
| ----------------------------------------- | --------------------------------: | -------------: |
| chrome only, no panel                     |                               220 |            417 |
| chrome + the park panel                   |                               324 |            521 |
| chrome + guests, weather and settings      |                               538 |            735 |

**React commits at speed 3** — the figure the brief asks for. The telemetry snapshot publishes at
most every 250 ms (`PUBLISH_MS`), driven by the render loop, and every subscribing component calls
`useCommitTally()` into `window.__parkfan_hud`:

| Open panels                | commits / publish | at the full 4 Hz cadence |
| -------------------------- | ----------------: | -----------------------: |
| none                       |              4.78 |         ~19 commits/s    |
| park, rides, shops         |              5.67 |         ~23 commits/s    |
| guests, weather, settings   |              5.36 |         ~21 commits/s    |

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
`Registry`, and `performance.measure` could not structured-clone it, so it threw *inside the commit
phase* and React unwound with `Should not already be working.` Two errors, neither of which names
the cause. It was found by wrapping `performance.measure` in an init script and dumping the detail.
Both halves are fixed — mine here (arrow-function class fields, with the reasoning in the
docblock), core's by the integrator (`Registry.name` was a static method shadowing
`Function.prototype.name`; it is `Registry.localized` now, asserted by `pnpm test:game-registry`).

**The clock and the speed were read from the last frame.** At `speed=0` the harness sets the time
of day and no frame follows, so the bar showed 09:00 at speed 1 while the world had been moved to
13:00 and paused. Both now come from `world.clock`, which `host.ts` mirrors from every frame *and*
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
   *retracts* it rather than fixing it. On this harness a boot takes 20–30 s under SwiftShader,
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

9. **Touch is a compromise, not a design.** The phone layout fits at 390 px and was measured there,
   the rail wraps rather than scrolling so nothing hides behind a gesture, and the panel sheet sits
   above the build bar instead of over it. But dragging a panel, the ±10 ct steppers and the
   time-of-day scrubber all want a pointer, and DECISIONS #15 already says the build tools are
   desktop-first.

10. **`NL/FR/ES/IT` fall back to English** by DECISIONS #7, including all 172 new keys.

---

## 4. Decisions taken here

- **The park panel opens on boot.** A HUD whose panels are all shut gives a first-time player no
  reason to think there is anything in them. It is 344 px of a 1920 px frame and closing it sticks
  for the session. Every other panel starts shut.
- **The engine badge and the frame metrics moved out of the top bar** into Settings. A shipped
  game's HUD does not carry an fps counter; the harness reads them from `report.json` anyway.
- **Two scrims, top and bottom.** `backdrop-blur` blurs what is *behind* a surface and does nothing
  for the sky *between* two of them, and this bar is two clusters with a kilometre of noon sky in
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
