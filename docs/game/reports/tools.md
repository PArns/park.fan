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
