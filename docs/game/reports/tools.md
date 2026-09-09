# tools — builder report

The build interface: the tool stack, the ghost, snapping, the undo/redo history, and the build bar
in the HUD. Folder: `lib/game/tools/` (9 TypeScript files + 1 `.tsx`, 2,261 lines, plus a 416-line
selftest). Outside it, and nothing else: `lib/game/ui/hud.tsx` (+8/−3 — one import, one
`<BuildBar />`, a rewritten docblock), 40 appended keys each in `lib/game/i18n/en.ts` and `de.ts`,
this report and `docs/game/requests/tools.md`. `lib/game/ui/module.ts` was granted and **not
touched**. `git diff --numstat` over everything outside `lib/game/tools/`: three files, **+88/−3**.

Before this, `/game` was a diorama: the demo park existed and nothing in the interface could add an
object to it or take one away.

## What exists

| File            | Lines | What it owns                                                                                             |
| --------------- | ----: | -------------------------------------------------------------------------------------------------------- |
| `main.ts`       |   710 | The tool stack, pointer/keyboard wiring, the ghost update, the four actions, the public API, `stats()`.  |
| `build-bar.tsx` |   448 | The HUD: palette groups, the item panel, the tool buttons, snap, rotate, undo/redo, the status line.     |
| `palette.ts`    |   193 | **The extensibility gate.** Registry → placeable items: kind, footprint, height, cost, availability.     |
| `showcase.ts`   |   167 | `/game?showcase=tools`: a build site staged entirely through the tool's own `commit()`.                  |
| `placement.ts`  |   158 | The four validity rules, the verdict, and geometric picking.                                             |
| `ghost.ts`      |   152 | Five meshes, four materials: the ghost volume, its pad, its facing chevron, the selection pad and frame. |
| `types.ts`      |   140 | The vocabulary. `ToolsState` is serialisable so the HUD never holds a scene reference.                   |
| `snap.ts`       |   129 | 0.25 m / 15° snapping, rotated-rectangle corners, point-in-rect, the separating-axis overlap test.       |
| `history.ts`    |    88 | The command stack. Two lists of commands per entry, not closures.                                        |
| `index.ts`      |    76 | The `GameModule`, `deps`, and the pure re-exports. No `sim` half.                                        |
| `selftest.mjs`  |   416 | 88 checks over the pure half. Not yet in `pnpm test:game` — requests §1.                                 |

Three runtime Babylon imports, all in `ghost.ts`, all deep (`Meshes/Builders/boxBuilder`,
`Materials/standardMaterial`, `Maths/math.color`); six more are `import type`. No `window`,
`document` or `navigator` anywhere in the folder — the canvas comes from
`engine.getRenderingCanvas()` and the key listener from `canvas.ownerDocument.defaultView`.

### Public API

```ts
// ctx.module<ToolsMainApi>('tools') — import the type from '@/lib/game/tools/main'
palette(): PaletteGroup[]                 // derived from the registry, live
useTool(tool, itemKey?): boolean          // 'select' | 'place' | 'move' | 'delete'
activeTool() / activeItem()
cancel()                                  // Escape
state(): ToolsState                       // serialisable; what the build bar renders
subscribe(fn): () => void                 // fires only when something the bar draws changed
snap() / setSnap({ enabled, grid, angle })
rotateBy(deg): boolean                    // the ghost, or the selection when no ghost is live
select(id | null) / selected()
deleteSelection(): boolean
hoverWorld(x, z) / hoverScreen(clientX, clientY) / clearHover()
commit(): string | null                   // place, or drop the moved thing; null when refused
undo() / redo(): boolean
stats(): ToolsStats
```

Emits `tool:changed`, `tool:placed`, `tool:removed`, `tool:moved`, `tool:selected`, `tool:undo`,
`tool:redo`. **Owned world state: none.** The command stack lives on the main thread and is not in
the save (ARCHITECTURE.md §4, DECISIONS.md #12).

### Keys

`Esc` leave the tool / clear the selection · `R` / `Shift+R` turn 15° · `G` snapping ·
`Delete` demolish the selection · `Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y` undo and redo.

## The decisions worth arguing with

### 1. A click is a pointer that did not move

The camera module owns the left button for panning (`camera/input.ts`, `panButtons: [0, 1]`) and has
to keep it — a build tool that took the drag would be a tool you cannot move the camera while using.
So this module listens on the same canvas and treats press-and-release inside **6 px** as a click;
anything further is a pan and never reaches a tool. No timer is involved, because a click that
depends on a clock behaves differently in the screenshot harness than in a browser (the same reason
`camera/controller.ts` measures its momentum off its own motion).

The cost: a very slow, very shaky click is a pan. The alternative — claiming a mouse button — costs
more.

### 2. Picking is geometric, not `scene.pick`

Every module in this game draws its content as **thin instances of a per-type batch**: one mesh for
all burger stands, one per prop batch. A ray hit therefore answers "the burger-stand batch", which
is every burger stand at once, and whose bounding info sits at the origin besides. So a click
resolves to a ground point through `camera.screenToGround()` and then to an entity through the
footprint table this module already keeps for the overlap rule — smallest rectangle containing the
point wins, so a bench on a plaza selects the bench.

Two consequences, one good and one bad. It picks things whose mesh does not exist yet, which is what
makes an undone placement selectable the moment it comes back. And it cannot pick anything with no
footprint: **paths are not selectable or deletable by this module**, because a polyline is not a
rectangle. That is the `paths` module's own tool to write.

### 3. Rotation is an operation, not a tool

`place`, `move` and `delete` are modes; rotation is not. A "rotate tool" would mean two different
things depending on whether something was armed or selected. `rotateBy()` turns the ghost while one
is live and the selection otherwise, and it is on `R`, on two bar buttons, and in the API.

### 4. A crown is not a footprint

Foliage declares a height and no footprint, so a footprint has to be derived. The obvious derivation
is the one `scenery/catalog.ts` uses for scattering — the crown, `height × 0.42…0.72`, i.e. 10 m for
a 14 m oak — and it was the first version. A park bench under a lime tree is a park bench, so the
footprint is the trunk and its root plate instead: `max(0.6, height × 0.18)`, 2.5 m for that oak.
Two trees still cannot be planted in the same hole.

Measured with `.game-render/_probe/tools-footprint.mjs`, which builds the demo world in node the way
`game-soak.mjs` does and runs this module's own `evaluatePlacement` over a grid — a 4 × 4 m shop on
5,751 points over the built core:

| rule        | buildable      | refused for `overlap` |
| ----------- | -------------- | --------------------- |
| crown       | 2,010 (35.0 %) | 3,119                 |
| trunk plate | 3,355 (58.3 %) | 1,481                 |

Along the main street (533 points, x −20…20, z 96…120) it is **17.6 % → 43.7 %**.

**The first instrument was the wrong one, and it said nothing.** The change was made after watching a
burger-stand ghost sweep the street in the browser and come back refused at 14 of 17 pixels — and
after the change the same sweep still says 14 of 17, identically. A single screen line cannot see a
change in area: that line runs down a row of box hedges, and the blockers along that street are
`hedge-box` 84, `linden` 72, `oak` 52, `lamp-victorian` 31, `planter-round` 26 — the hedges and lamps
have declared footprints and were never touched by this. The grid is what measures it.

### 5. Building costs money; building beyond your means is somebody else's rule

A placement dispatches `finance:adjust { cents: -cost }` beside its `entity:add`, and undo dispatches
the exact refund — measured below, to the cent. There is **no affordability gate**: whether a park
may spend money it does not have is a finance rule and belongs to `management`, which is a scaffold.
Demolition moves no money in either direction, because a refund is the same rule and because an undo
that is not cash-neutral is a way of printing money (delete, undo, delete, undo).

### 6. The ghost is a footprint, not a preview of the building

It draws the rectangle the rules actually judge, a volume of the item's height, and a chevron on the
facing side. It is the weakest part of the frame and it is deliberate: a preview of the real building
would lie about the two things a person is deciding (where its edges are, which way it faces), and it
cannot be done honestly today anyway, because there is no "one bench" to clone out of a thin-instance
batch. Ranked first in what to fix.

## What is measured, and how

Everything below was run against the dev server at `localhost:3000`, headless Chromium at
`/opt/pw-browsers/chromium` under SwiftShader. **fps is meaningless in every number here; draw calls
and triangles are real.**

### Commands

| command                                                                                                  | result                                              |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/tools/selftest.mjs` | `✓ tools selftest: 88 checks clean`                 |
| `pnpm test:game`                                                                                         | green, exit 0 (9 suites)                            |
| `npx tsc --noEmit`                                                                                       | clean                                               |
| `npx eslint lib/game scripts`                                                                            | clean (1 pre-existing warning in `guests/crowd.ts`) |
| `node scripts/test-game-lint.mjs`                                                                        | `✓ game lint: 179 files clean`                      |
| `node --…  scripts/test-game-i18n.mjs`                                                                   | `✓ game i18n: 108 keys × en/de`                     |
| `grep -rn '@babylonjs' lib/game/tools/`                                                                  | 9 lines, 3 runtime, all deep paths                  |

### The click path, driven with a real mouse

`.game-render/_probe/tools-probe.mjs` — the demo park at `?harness=1&speed=0&engine=webgl2`, camera
preset `close`, 12:00. Every step is a DOM click on the build bar or a `page.mouse` event on the
canvas; nothing calls the API directly. **0 console errors, 0 warnings** over the run.

| frame           | what the frame shows                                                                                        | entities | cash       | undo |
| --------------- | ----------------------------------------------------------------------------------------------------------- | -------: | ---------- | ---: |
| `01-park`       | the park, the bar idle, `Rides`/`Coasters`/`Buildings`/`Slides` greyed out                                  |    1,605 | €2,500,000 |    0 |
| `02-palette`    | the Scenery group open: 21 items from **both** packs, each with its price                                   |    1,605 | €2,500,000 |    0 |
| `04-ghost`      | a green bench ghost on the path, status "Click to place Park bench…"                                        |    1,605 | €2,500,000 |    0 |
| `05-placed`     | the bench is there                                                                                          |    1,606 | €2,499,965 |    1 |
| `06-undone`     | `Ctrl+Z`: gone, and the €35 is back                                                                         |    1,605 | €2,500,000 |    0 |
| `07-redone`     | `Ctrl+Y`: back, and charged again                                                                           |    1,606 | €2,499,965 |    1 |
| `08-selected`   | a click at the same pixel selected it: blue pad and wireframe box                                           |    1,606 | €2,499,965 |    1 |
| `09-rotated`    | three presses of `R`: the bench and its box stand 45° round                                                 |    1,606 | €2,499,965 |    4 |
| `10-moving`     | the `move` tool: the ghost 45° round, snapped to `[2.00, 106.50]` (a 0.25 m multiple)                       |    1,606 | €2,499,965 |    4 |
| `11-moved`      | the bench is at the new spot, still selected, still turned                                                  |    1,606 | €2,499,965 |    5 |
| `12-hover-shop` | a **red** 4 × 4 ghost on the plaza, status "Something is already standing there.", `blockedBy: scenery-124` |    1,606 | €2,499,965 |    5 |
| `14-demolished` | the demolish tool took it away again                                                                        |    1,605 | €2,499,965 |    6 |

The cash figures come from the HUD badge in the screenshots, which is fed by the worker's
`finance.cash` stat — i.e. the money moved in the **simulation**, not in a main-thread mirror. The
probe's own JSON reads `world.finance.cash` on the main thread, which never changes, and that is not
a bug in either place: `finance:adjust` is applied in the worker (`sim-runtime.ts`) and travels back
as a frame stat. It cost a wrong line in the first draft of this report.

One frame does not agree with its own JSON and I could not explain it: `13-sweep-end` shows a green
ghost and a green status line, while the state read a second later says `overlap`. Every other frame
in the run matches its data. It is not in the table above.

### The worker's own copy of the world

`.game-render/_probe/tools-move.mjs`. `handle.save()` is serialised **in the worker, from the
worker's world**, so it is the only way to prove a command actually arrived rather than being
mirrored on the main thread and lost.

| claim                              | measured                                                                   |
| ---------------------------------- | -------------------------------------------------------------------------- |
| the command reaches the worker     | `save()` has **1,606** entities after one placement (1,605 before)         |
| in the right order                 | `world.log` tail = `clock:set`, `entity:add`, `finance:adjust`             |
| the money is the manifest's        | store cash 250,000,000 → 249,996,500 = **3,500 cents**, the bench's `cost` |
| a move is one `entity:update`      | `[-7.707, 0.5, 86.762]` → `[-4.982, 0.5, 80.083]`                          |
| undo restores the position exactly | back to `[-7.707, 0.5, 86.762]`, identical to the last decimal             |
| a demolition reaches the worker    | the id is gone from the next `save()`; 1,606 → **1,605**                   |
| console                            | 0 errors                                                                   |

### The three ghost states, and the night

`/game?showcase=tools&ghost=ok|water|overlap` through `.game-render/_probe/tools-ghost.mjs`,
`.game-render/tools-ghosts/`. **0 console errors in all four runs.**

| frame          | state reported | draw calls | what is in the frame                                                     |
| -------------- | -------------- | ---------: | ------------------------------------------------------------------------ |
| `ok-1200`      | `valid`        |        132 | a green box beside the walk, its pad and its facing chevron on the grass |
| `water-1200`   | `under-water`  |        132 | the same ghost red, standing in the pond                                 |
| `overlap-1200` | `overlap`      |        132 | red, over the lamp post it collides with, at the bottom of the frame     |
| `ok-2200`      | `valid`        |         65 | 22:00: the ghost reads exactly as it does at noon against a dark park    |

The night frame is the reason both ghost materials are `disableLighting` + `envExempt`
(ARCHITECTURE.md §4): a validity colour that the environment module tints for the season, or that
goes dark at night, is not a validity colour.

An earlier run of the same probe put the `ok` ghost outside the frame, and its draw calls came back
at **129 against the other two at 132** — which is the +3 measured from the other direction, by
frustum culling rather than by hiding.

### What the module costs the frame

| measure                     | value                                                         |
| --------------------------- | ------------------------------------------------------------- |
| meshes owned                | **5** (three ghost, two selection), created once, then scaled |
| materials owned             | **4**                                                         |
| draw calls, no tool armed   | 291                                                           |
| draw calls, ghost on screen | **294** (+3, the three ghost meshes)                          |
| triangles added             | 3 boxes = 36                                                  |
| sim tick                    | unchanged: this module has **no `sim` half**                  |

Against the game's 1,200-draw-call budget that is **0.25 %**, and only while a tool is armed.

### The palette, and the extensibility gate

Read from the running game (`api.palette()`), demo park, both bundled packs:

| group      | items | placeable | why not                                                         |
| ---------- | ----: | --------: | --------------------------------------------------------------- |
| `scenery`  |    21 |        21 | —                                                               |
| `shop`     |    12 |        12 | —                                                               |
| `ride`     |     5 |         0 | nothing has claimed the `ride` kind yet (`rides` is a scaffold) |
| `coaster`  |     4 |         0 | no footprint in the manifest: built along a route               |
| `building` |    10 |         0 | nothing has claimed the `building` kind                         |
| `flume`    |     3 |         0 | route again                                                     |

**55 items, 6 groups, 33 placeable, 22 listed-and-refused.** Not one pack id or item id appears in
the module's source: `grep -rn "core-classic\|neon-lagoon" lib/game/tools/*.ts lib/game/tools/*.tsx`
returns **0 lines** (the selftest names seven, which is what a test is for). The
selftest proves both halves of the gate that four earlier modules in this project failed:

- a pack registered **before** the module attached (which is what `host.boot()` does at step 2) is in
  the palette: all 55 items of the two bundled packs, counted against the manifests;
- a pack registered **after** it grows the palette by exactly its own entries, through `onPack`;
- `registry.registerKind('building', 'buildings')` flips ten items from refused to placeable **with
  no code change**, which is the whole claim in one assertion.

### The showcase

`/game?showcase=tools` (`.game-render/tools-showcase/`, `.game-render/tools-ghosts/`). Nothing in it
places an entity by hand: every object went down through `api.useTool()` + `api.hoverWorld()` +
`api.commit()`, the same three calls a click makes, and the history is then exercised — place,
delete, undo, move, rotate — before the camera looks at anything.

`stats()` in the staged scene: **placed 12, removed 1, moved 1, rotated 1, undo depth 14, redo 0**,
against 13 entities in the world (twelve objects and the walk) and €2,530 spent from the showcase
world's €50,000. The depth is the arithmetic of that sequence — 12 places, a delete, an undo that
gives one back, then a move and a rotate that clear the redo branch and add two.

**Thirteen placements were attempted and twelve landed.** `core-classic:sign-entrance` was refused at
(9, 6) by this module's own overlap rule, and the showcase says so in the console rather than leaving
a hole in the picture: `[game/tools] showcase: core-classic:sign-entrance was refused at 9, 6`. The
arch is 10 m wide and the slot is 8 m from its neighbour. It is left in as a warning rather than
tuned away, because a staged scene that quietly drops what it cannot fit is a showcase that lies.

`?ghost=ok|water|overlap` parks the ghost in each of its three states for the camera (the harness
cannot pass the parameter — requests §2 — so `.game-render/_probe/tools-ghost.mjs` does).

### Console

`node scripts/game-shot.mjs --cam=close --tod=12:00` on the demo park: **0 errors, 0 warnings, 0
hydration warnings**, 291 draw calls, 1,011,759 triangles. The same on `--showcase=tools`: 0 errors,
0 hydration warnings, 132 draw calls, 128,038 triangles, and **three warnings**, of which one is this
module's on purpose (the refused `sign-entrance`, above). The other two are
`WebGL: INVALID_VALUE: bufferSubData: buffer overflow`, twice, and they are not this module's:
`--showcase=shops`, which sculpts its terrain and emits `terrain:changed` the same way and has no
build tool in it, logs the identical pair (`.game-render/tools-crosscheck-shops/report.json`). The
`camera` report filed the same pair against `terrain`.

### The frames, by name

Every PNG below was opened and looked at, not just written.

- `.game-render/tools-clickpath/` — 15 frames, the whole click path in the demo park. Looked at:
  `01-park`, `02-palette`, `04-ghost`, `05-placed`, `06-undone`, `08-selected`, `09-rotated`,
  `11-moved`, `12-hover-shop`, `13-sweep-end`, `14-demolished`.
- `.game-render/tools-move/` — `01-ghost-valid`, `04-moved`, plus `probe.json`.
- `.game-render/tools-ghosts/` — `ok-1200`, `water-1200`, `overlap-1200`, `ok-2200`.
- `.game-render/tools-showcase/` — `1200-close` and `1200-overview` from `scripts/game-shot.mjs`.
  The `overview` frame is 340 m out and the showcase is 40 m across, so it is a speck in it: that
  preset is not the one to judge this module by, and it is here because the harness took it.
- `.game-render/tools-park/1200-close` — the demo park with the bar and nothing armed, which is what
  a visitor sees on arrival: the bar sits over the bottom of the frame, four of its six groups
  greyed out, and nothing else of this module is on screen.

## What is not verified, and why

- **Nobody has driven this with a hand.** Every click above is a Playwright event. Hover feel, how a
  drag-then-place reads, whether 6 px is the right slop for a trackpad: all unmeasured.
- **Touch is untested and probably wrong.** A pointer-down/up inside 6 px is a tap, so a tap should
  place; but there is no hover on a phone, so the ghost only appears where the finger already is, and
  D-015 says the build tools are desktop-first. Nothing here was run on a touch device.
- **The move tool's ghost cannot be dragged.** Move is click-to-arm, click-to-drop. A press-drag-drop
  gesture would fight the camera pan under the same button, and picking a modifier for it without a
  person to try it on is guesswork.
- **Nothing places a path, a coaster or a flume.** Those are routes, and the palette says so rather
  than pretending. A coaster placed as a point entity draws nothing (`track/main.ts` needs
  `data.pieces`), which is exactly why `route` items are refused.
- **`ride` and `building` items have never been placed**, because no module claims those kinds yet.
  The selftest proves the palette flips them the moment one does; the frame that shows a carousel
  standing where it was put does not exist and cannot until `rides` does.
- **The ghost does not follow terrain slope.** It stands level at the highest sample under its
  footprint, which is what the placement rules judge and what the shops module's own apron does. On a
  1-in-8 bank a 12 m ghost floats at one end.
- **No performance number is from real hardware.** SwiftShader renders this park at 0.8–1.3 fps. The
  draw-call and triangle deltas are real; anything about smoothness is not measured.
- **The undo stack is bounded at 100 and nobody has hit the bound in a browser.** The limit is
  covered by the selftest with a stack of 3.
- **Nothing counts this module's scene objects across a reboot.** `pnpm game:teardown` is green with
  this module active — three dispose/reboot cycles, "at most one live engine context", "no console
  errors across the walk" — and `dispose()` removes all five listeners and disposes the five meshes
  and four materials. But the check counts GL contexts, not meshes, so a mesh this module forgot
  would not show up in it.

---

# Round 2 — Moulded, and the palette gets pictures

Two things the owner asked for: a menu with some confidence in it („Planet Coaster / Windows XP
like"), and pictures on the ride tiles, „damit man weiß, was man einfügt". Folder unchanged:
`lib/game/tools/`, now 13 files. Outside it: four appended keys each in `lib/game/i18n/en.ts` and
`de.ts`, one appended section in `docs/game/requests/tools.md`, and this. **No file in
`lib/game/ui/`, `lib/game/core/`, `lib/game/buildings/` or `lib/game/flumes/` was touched.**

## 1. The bar is two objects now

`build-bar.tsx` was one wrapping row of six category buttons plus nine controls — about 1140 px of
content that clipped at 1024. It is a **build tray** (header, a five-column grid of item tiles, and
the category tabs along its own bottom edge) and a **toolbelt** 8 px under it, both
`min(64rem, 100%)`.

Every material comes from `lib/game/ui/surface.ts` — `raise()`, `SINK`, `SINK_STAGE`, `TRAY`,
`TAB_TROUGH`, `TAB_ACTIVE`, `BELT_RULE`, `MICRO_LABEL`. This folder defines **no skin of its own**.
It had one for about an hour, written against the tokens the spec names because `surface.ts` was
someone else's that round; when the recipes landed there the local copy was deleted rather than
kept, because two copies of one material is exactly what that file exists to prevent.

The tab is a real tab and not a toggle: the strip is a 36 px trough (44 below `sm`) cut into the
tray's bottom edge, and the active tab is `36px + var(--game-tab-lip)` tall with a matching negative
top margin, so it grows UPWARD into the palette's bottom padding while the row's own height does not
move. The strip scrolls horizontally inside the trough rather than wrapping — „Achterbahnen" is
twelve characters against „Coasters" at eight — and the scroller is as tall as the tallest tab,
because `overflow-x` clips vertically too and the first version ate the lip it exists to draw.

Two accents, and no call site blurs them. Blue is ON — the open tab, snap, the active tool, the
chosen tile. Cyan is ARMED, what the next click on the park does: on the active tool key, or, while
placing, on the chosen tile, which carries both. There is exactly one cyan ring on screen in every
screenshot below.

## 2. The pictures

`KIND_ICONS[group.kind] ?? Box` drew ONE Lucide pictogram per entity kind, so a carousel and a ferris
wheel were the same tile with different words on it. The packs carry an `icons` map and it does not
help: its values are Lucide names too.

So a tile's picture is a **render of the thing that will be placed**, from the game's own geometry.
`thumbs.ts` opens a second `Scene` on the existing engine — three fixed lights, a small neutral
environment cube written byte by byte in that file (without one every PBR metal renders black), an
orthographic camera at a fixed three-quarter angle — draws one item into a 256² render target, reads
it back and caches the PNG under `pack:item@packVersion`. `thumb-sources.ts` gets the geometry from
the modules' own builders, keyed by ENTITY KIND and never by item, so a pack that adds a fortieth
ride gets a picture with no code change.

**Its own scene is the whole reason the picture is stable.** Rendered in the park's scene a thumbnail
would be orange at 18:30 and black at 23:00. Verified: `1300-ride-bar.png` and `2300-ride-bar.png`
are the same five pictures.

Cost, measured on the demo park at 1440×900 (`report.json` in `.game-render/tools-moulded/`):

|                               |                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------- |
| Items drawn                   | **38 of 65** — 5 rides, 12 shops, 21 scenery/foliage                         |
| Items refused                 | **0** of those 38                                                            |
| No source at all              | 20 buildings, 4 coasters, 3 slides — Lucide kind icon on the stage           |
| Work per item, mean           | **4.2 s** on this container's SwiftShader; range across three runs 3.4–4.2 s |
| Waiting for shaders, total    | 174 ms over 38 items                                                         |
| Console errors                | **0**                                                                        |
| Studio scene after 38 renders | 0 meshes, 32 materials, 36 textures retained                                 |

Nothing is rendered at boot; a tile asks when it is first drawn. Once a queue exists the studio takes
one item per frame from `onAfterRenderObservable` and keeps going while there is time left in that
frame; the observer is removed the moment the queue empties, so a settled palette costs zero.

## 3. What is in the folder now

| File               | Lines | What changed                                                                                                  |
| ------------------ | ----: | ------------------------------------------------------------------------------------------------------------- |
| `build-bar.tsx`    |   767 | Rewritten. Build tray + tab strip + toolbelt, item tiles with pictures, phone rows.                           |
| `main.ts`          |   753 | +4 API methods (`thumbnail`, `requestThumbnail`, `focusThumbnails`, `thumbnailStats`), the studio's lifetime. |
| `thumbs.ts`        |   578 | **New.** The studio: scene, lights, environment cube, camera framing, queue, cache, PNG readback.             |
| `thumb-sources.ts` |   315 | **New.** Geometry per entity kind, lazily imported from `scenery`, `shops`, `rides`.                          |
| `shot-bar.mjs`     |   167 | **New.** The screenshot harness for an OPEN palette, which `scripts/game-shot.mjs` cannot take.               |
| `thumb-mesh.ts`    |    46 | **New.** One surface to one mesh, because only `scenery` exports its copy.                                    |

Everything else is untouched.

## 4. Verified

Every PNG below was opened and looked at. Production build, `next start` on a port of its own
(`:3100`), demo park, `--harness=1 --speed=0`.

**`.game-render/tools-moulded/`** — 1440 × 900, `report.json` beside them:

- `1300-ride.png`, `1300-ride-bar.png` — five ride tiles, and they are five different pictures: a
  carousel (striped drum), a ferris wheel (upright wheel on a red A-frame), a chair swing (canopy on
  a mast), a top spin (red gantry with the arm out) and a wave swinger (teal canopy). The active tab
  stands 8 px proud of its trough and merges into the palette above it; the select key carries the
  one cyan armed ring on screen; the cost readout reads „–" because nothing is armed.
- `1300-shop-bar.png` — twelve shops, whole buildings on their aprons. The four that share the
  `kiosk-round` generator (ice cream, lemonade, information, smoothie bar) are the same building; see
  the weaknesses.
- `1300-scenery-bar.png`, `2300-scenery.png` — 21 props and plants, and at 23:00 the bar reads
  against a dark park with the picture wells the brightest thing on it, which is the point of the
  lit stage.
- `2300-ride-bar.png` — **byte-for-byte the same five pictures as 13:00.** The studio has no clock.
- `1300-building-bar.png` — the documented fallback: twenty building pieces on the Lucide `Home`
  icon, standing on the stage with their contact shadow, which does not read as broken.
- `report.json`: **0 console errors**, `documentWidth` 1440 = viewport, **draw calls 415 before the
  palette was opened and 415 after, triangles 506,014 both** — the studio adds nothing to the park's
  frame.

**`.game-render/tools-moulded/_bug-img-clipped.png`** — kept on purpose: the same ferris-wheel tile
from the build before the fix in §5 below, cut off at the axle.

**`.game-render/tools-phone/`** — 390 × 844: tiles are rows (88 px well left, three lines right),
the tab strip scrolls with the active tab scrolled into view, the toolbelt wraps and has shed both
rotate keys, and `documentWidth` = 390 = viewport, so the document does not scroll sideways. Draw calls 363
before the palette and 363 after, 0 console errors, 26 of 26 tiles drawn.

**`.game-render/thumbs/_sheet.png`** — the 14 raw 256² renders on a synthetic stage, which is how
the framing and the lighting were judged before they went into a tile.

Studio census after all 38 renders, read out of the running page:

|                      |                                                         |
| -------------------- | ------------------------------------------------------- |
| Scenes on the engine | 1 before the first thumbnail, 2 after                   |
| Studio scene         | **0 meshes**, 39 materials, 36 textures, 3 lights       |
| Park scene           | 405 meshes, 77 materials, 131 textures — unchanged      |
| Cached pictures      | 38 data URLs, **1,825 KB** of strings                   |
| Work, total          | 128–160 s over 38 items across three runs (SwiftShader) |
| Waiting for shaders  | 176–254 ms over 38 items                                |

`node scripts/game-shot.mjs --url=http://localhost:3100 --cam=overview --tod=13:00 --step=2400`
(`.game-render/tools-moulded-harness/`) — the standard gate at 1280 × 720 with 2,400 ticks of sim on
the clock: **0 errors, 0 hydration warnings**, boot 13.8 s, 418 draw calls, 1,627 KB of chunks, and
a park with 1,471 guests in it behind a palette showing ten scenery pictures.

`node scripts/check-game-teardown.mjs --url=http://localhost:3100 --cycles=3` — **all five
assertions green**, and it earned its keep: see §5.1.

`npx tsc --noEmit` silent over `lib/game` and `app/game`, `npx eslint lib/game/tools` clean,
`npx prettier --write lib/game/tools` clean, `pnpm test:game` exit 0 (264 files linted, 294 i18n
keys × en/de, `tools selftest: 88 checks clean`).

## 5. What is weak, ranked

**1. The teardown bug this round introduced, and how nearly it shipped.** `sources.dispose()` freed
its material kits through the boot promise — `void ready?.then((kit) => kit.dispose())` — which is
one microtask after `host.dispose()` has already taken the scene and the engine. Three
`TypeError: Cannot read properties of null (reading 'program')` per teardown walk, and **nothing
else noticed**: the engine context was released, the handle was gone, every other assertion was
green, and `pnpm test:game` says nothing about a browser. Fixed by keeping the resolved kit in a
plain variable and disposing it synchronously — and then only two thirds fixed, because the boot
function's own body still ran after dispose and generated textures on a dead context. It takes an
`alive()` predicate now, checked after the dynamic imports and again after every `await` that
precedes a `new Mesh`. The lesson is the check, not the bug: **an async dispose path is invisible to
every test in this repo except that one.**

**2. A picture that was there and could not be seen.** The tile's `<img>` was laid out
`absolute inset-x-0 top-[3px] bottom-[5px]`, which sizes a `<div>` and does not size a replaced
element: with `height: auto` an image's used height is its intrinsic one, so it took its width from
the well, made itself 192 px square, and the well's `overflow-hidden` cut every ride off at the
axle. Three tabs of screenshots showed the top third of everything with a green build, a clean
lint, zero console errors and a studio reporting 38 successful renders. It is `size-full` with
padding now. Kept as `_bug-img-clipped.png`, because the failure mode — a correct picture,
correctly cached, invisible — is the one this pipeline will hit again.

**3. Four shops are the same picture, and the render cannot fix it.** `kiosk-round` is shared by ice
cream, lemonade, information and smoothie bar. Their `night.signage` colours differ and the studio
lights the signage to full, so smoothie's teal sign really is teal — but it is **160 of 65,536
pixels** (measured by diffing the two PNGs), which is nothing at 58 px on a tile. The name and the
cost are what separate them, which is why the tile has three rows and not one. `first-aid` and
`info` carry no signage colour at all and are identical by construction.

**4. The palette is always open, and on a 720 px screen it takes 58 % of the height.** The old bar
was a row of buttons that opened an item panel on demand; the agreed one is a tray that is always
showing a category, and at 1280 × 720 the tray and the belt together are about 420 px of 720 —
`1300-overview.png` from the standard harness is a park squeezed into the top 300 px. The `38vh`
cap the spec sets is what keeps it from being worse, and there is no way to collapse the tray at
all. On a 900 px screen it is 47 % and reads fine. This is the redesign's biggest standing risk and
the obvious answer is a collapse control on the tray's header, which is not in the agreed spec and
so is not in this round.

**5. Seconds per thumbnail, and no number from real hardware.** Mean work per item is 1.2 s on a
quiet box and 4.2 s with three other agents' Chromiums on it; the slowest single item ranges 5.8 s
to 15.6 s and is always the first ride, which pays for the studio scene and the ride material set.
Waiting for shaders is 94–254 ms per RUN, so it is not compilation — it is the render and the
readback under a software rasteriser, and the four-fold spread between two runs of the same code is
how little any of it says. On a GPU this
should be tens of milliseconds and I have not measured it. What the design does guarantee is the
shape: nothing at boot, one item per frame with a 12 ms budget, and zero once a palette is settled.

**6. Twenty of 65 items have no picture, and they are the buildings.** `buildings` builds from a
`BlueprintDef` — a whole building — while the palette's building items are wall, roof, floor and
column PIECES, and the per-piece builders are internal. That folder also had a builder in it this
round. Coasters (4) and slides (3) have no `procedural` at all and correctly cannot be drawn until
the track tool can hand over a layout. Request §7 is the seam that fixes the first of those.

**7. A shop's picture is mostly its apron.** The frame fits the whole bounding box, and for a shop
that box is the concrete plot and the railings, so the kiosk is about a third of the frame. A ride
or a tree fills its frame properly. The fix is a per-kind framing bias or a builder that reports the
building's own bounds, and neither is in this round.

**8. Unaffordable items are not marked.** The agreed tile has the cost in `--game-danger` at opacity
.5 when the park cannot pay. `BuildBar` is handed `t`, `locale` and `getHandle` and nothing else;
cash is on `GameHandle.store`, so it is reachable, but wiring it means a second subscription that
re-renders every tile on every cash change, and the demo park starts with €2,500,000 so there is
nothing to photograph. Not done, and the i18n key that was drafted for it was removed rather than
left in the table unused.

**9. The status line is a third object in a two-object cluster.** The spec keeps the bottom cluster
to a tray and a belt; the refusal reasons („Da steht schon etwas") had nowhere to go, so they appear
as one line above the tray and only while there is something to say. At rest there are two objects.
It is a compromise and it is visible in `1300-ride.png` only by its absence.

**10. Nothing here is measured in a real browser on real hardware.** Same standing caveat as every
other module in this repo: SwiftShader renders this park at 0.15–0.8 fps, so every wall-clock figure
above is an upper bound and the draw-call and triangle counts are the only numbers worth quoting.

## 6. For the integrator

- **`:3000` and `:3001` share one `.next`.** `next dev --turbopack` rewrites the chunks a `next start`
  is serving by name, and a `next start` that was running before a `pnpm build` serves a manifest for
  files that no longer exist — every chunk 500s with `text/plain`, the page never boots, and it reads
  exactly like a broken game. I rebuilt three times during this round, which will have broken any
  harness run against `:3000` in that window, and I ran my own `next start -p 3100` rather than
  restarting anybody's server. **`:3000` needs a restart to serve the current build.**
- `lib/game/tools/shot-bar.mjs` is worth a `pnpm` script; it is the only way to photograph an open
  palette.
- Four i18n keys were appended to `lib/game/i18n/en.ts` and `de.ts`: `tools.palette.count`,
  `tools.item.route`, `tools.cost.label`, `tools.cost.idle`. `tools.cost.idle` is an EN DASH and not
  the em dash the spec wrote, because `scripts/test-game-i18n.mjs` fails on any `—` in a game string.
