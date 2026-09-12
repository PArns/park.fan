# tools — requests to the integrator

Everything this module needed that lives outside `lib/game/tools/`. Each item names the exact patch
and what shipped instead.

---

## 1. Wire the selftest into `pnpm test:game` (`package.json`) — **done**

_Integrator:_ wired as `test:game-tools`, in the chain between `test:game-camera` and
`test:game-soak`. Whole chain green, exit 0.

### Original request

Same request `camera`, `paths`, `track`, `scenery` and `shops` each made, and the same reason: a
builder may not edit `package.json`, so the 88 checks in `lib/game/tools/selftest.mjs` run only when
somebody types the command by hand.

```diff
-    "test:game": "pnpm test:game-save-roundtrip && pnpm test:game-registry && pnpm test:game-lint && pnpm test:game-i18n && pnpm test:game-track && pnpm test:game-paths && pnpm test:game-shops && pnpm test:game-camera && pnpm test:game-soak",
+    "test:game": "pnpm test:game-save-roundtrip && pnpm test:game-registry && pnpm test:game-lint && pnpm test:game-i18n && pnpm test:game-track && pnpm test:game-paths && pnpm test:game-shops && pnpm test:game-camera && pnpm test:game-tools && pnpm test:game-soak",
+    "test:game-tools": "node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/tools/selftest.mjs",
```

**Shipped instead:** the command in the file's docblock, run by hand before every claim in the
report. Result: `✓ tools selftest: 88 checks clean`.

---

## 2. `scripts/game-shot.mjs` drops query parameters it does not know

The harness builds its URL from a fixed list (`showcase`, `seed`, `quality`, `park`, `weather`), so a
showcase cannot be parameterised. This module's showcase can stage its ghost in three states —
legal, in the water, on top of something — and `?showcase=tools&ghost=ok|water|overlap` is how you
ask for one, which the harness cannot pass on.

```diff
 if (args.weather) query.set('weather', args.weather);
+// Anything else the caller typed, so a showcase can take its own parameters.
+for (const [k, v] of Object.entries(args)) {
+  if (!query.has(k) && !['url', 'cam', 'tod', 'out', 'wait', 'w', 'h', 'engine', 'step', 'timeout', 'showcase', 'particles', 'particle-frames'].includes(k)) {
+    query.set(k, v);
+  }
+}
```

**Shipped instead:** `.game-render/_probe/tools-ghost.mjs`, a fifteen-line Playwright probe that
opens the URL with the parameter and takes the same screenshot. The three frames in the report came
from it.

---

## 3. An owning module could publish the footprint it actually draws

`palette.ts` derives a footprint from the manifest, and for **foliage** it has to invent one: the
schema gives a tree a height and no footprint. What it invents is deliberately _not_ what
`scenery/catalog.ts` invents — that file derives a crown (`height × 0.42…0.72`) for scattering, and
this one derives a trunk plate (`max(0.6, height × 0.18)`) for building, with the measurement behind
the difference in the report. But both are guesses about geometry the drawing module knows exactly,
and neither can see the other change.

The clean fix is a one-line optional member on the api of any module that owns a kind:

```ts
// in each owning module's *MainApi
/** The ground rectangle this module actually draws for `pack:item`, metres. */
footprintOf?(key: string): [number, number] | null;
```

`tools` would ask the owner first and fall back to the manifest, and a module that wanted a
_different_ rectangle for collision than for drawing could say so in one place. It is not urgent —
the derivation is two constants and a comment — but nothing tells either side when the other moves.

**Shipped instead:** the derivation, with the measurement and the reason written next to it.

---

## 4. `nextEntityId` advances a counter the worker never sees

Not this module's to fix, and it bit nothing here, but it is worth recording because a build tool is
the thing that will eventually trip it. `core/world.ts` keeps the id sequence in
`world.modules.__ids` — of whichever copy of the world you call it on. A tool on the main thread
mints `scenery-1606` and dispatches `entity:add`; the worker applies the entity but its own
`__ids` stays where it was. If anything in the worker ever mints an id (a scenario, a live seed,
`management` building something), the two sides will collide, and the `do…while` guard in
`nextEntityId` only protects against a collision it can _see_ — which, on the worker, it can, so the
worker would silently renumber and the main thread would keep the old id for the same object.

Two ways out: mint ids in the worker and let the command carry a client id, or have core mirror the
`__ids` bump the way it mirrors the entity. Both are core's call. `scenery/main.ts` has the same
pattern today.

**Shipped instead:** nothing. `tools` uses `nextEntityId(ctx.world, kind)` exactly as
`scenery/main.ts` does, so it is no worse than what is already there.

---

## 5. The `ui` module is still a placeholder, and the build bar now lives in `tools`

The integrator granted this module `lib/game/ui/hud.tsx` and `lib/game/ui/module.ts`. What was
changed:

- **`lib/game/ui/hud.tsx`** — three lines: the import of `BuildBar`, the `<BuildBar …/>` in the
  bottom row above the notice stack, and a docblock that says the file is still the ui builder's
  placeholder in everything else.
- **`lib/game/ui/module.ts`** — **not touched**. It is still `main: async () => ({ dispose() {} })`.
  `tools` needs nothing from it; it is in `deps` only so `orderModules()` keeps the HUD in a
  showcase run.

When the `ui` builder arrives, `BuildBar` is a plain component with three props (`t`, `locale`,
`getHandle`) and no opinion about where it sits.

---

## A pools tab in the build bar, and why the recorded plan for it would have shipped an empty one

**Owner:** `tools` (the palette) + `core` (a contribution point) + `pools` (the items) ·
**Value:** a park builder in which a pool can be built. `pools` ships eleven basin shapes, four
tile styles and the edge treatments, and none of them can be placed.

`STATUS.json` recorded the fix as "widen `ItemCategory`, let `PALETTE_CATEGORIES` derive from what
the registry actually holds rather than from a literal, then register the shapes." All three steps
are wrong or insufficient, measured on the tree:

**1. `ItemCategory` is not in this path at all.** `buildPalette` reads the raw manifest object:

```ts
// tools/palette.ts:148-151
for (const category of PALETTE_CATEGORIES) {
  const entries = (pack as unknown as Record<string, AnyDef[]>)[category] ?? [];
```

Never `Registry.index`, never `ItemCategory`. Widening that union changes nothing here.

**2. The closed thing that blocks is `PaletteCategory`** (`tools/types.ts:43`, five literals) —
and behind it a shape mismatch the union cannot fix. The palette's model is _one manifest key is
one flat array of placeable defs_. The `pools` key is an **object of four arrays** (`shapes`,
`tiles`, `edges`, `deck`), of which only `shapes` is placeable: a tile style and an edge treatment
are properties of a basin already in the world, and `deck` is its furniture. Handed to that loop,
`pack['pools']` is not iterable and `?? []` does not catch an object.

**3. And then it would find nothing anyway.** `buildPalette` walks `registry.packs()`. Neither
shipped pack carries a `pools` key — checked both — and `pools/manifest.ts:564` registers its
built-in catalogue with `registerPools(BUILTIN_PACK, BUILTIN)`, into the **module's own store**,
which is the whole point of `registerPackCategory`: core has no schema for a basin and must not
grow one. So every basin the game has is invisible to the loop that builds the bar. The recorded
plan, carried out exactly, produces an empty tab.

**The shape this wants.** Not a sixth string in a union, and not pools' content moved into core's
pack schema, which would undo `registerPackCategory`. A module that owns a pack category and has
something placeable should be able to **contribute palette items** — it already knows how to parse
its own content and is the only thing that can. Roughly: a provider registered against a kind, read
by `buildPalette` alongside the pack walk, returning ready `PaletteItem`s. `pools` then hands over
its `shapes` and keeps `tiles`/`edges`/`deck` for the inspector, where they belong.

`flumes` needs the same door, and `track` already has the problem in a different shape (a coaster
is a route, not a footprint). Three modules is past the point where the palette should be asking
each of them by name.

**Belongs in this module's round 2**, which it needs anyway on the frame axis. Not done by the
integrator because it is a new cross-module contract, and a half-specified one is worse than a
written-down one.

---

## 7. A module that draws a kind should be able to hand over a PREVIEW of one

The build bar now renders every palette tile's picture from the game's own geometry
(`tools/thumbs.ts` + `tools/thumb-sources.ts`): a second `Scene` on the existing engine, three fixed
lights, an orthographic three-quarter camera, one render per item, cached by `pack:item@packVersion`.
That part is settled and needs nothing from anybody.

What it needs is a way to ASK for the geometry. The clean seam already half exists in two places and
neither reaches far enough:

- `registry.registerProcedural(name, factory)` is core's own door and its docblock says so —
  "the core-owned seam other modules and the tools use to ask whether a `procedural` name is
  drawable". **Only `scenery` registers into it**, and what it registers is a `scenery`-shaped
  `Generator`, so a caller has to know that module's types to use the answer.
- `scenery`'s main api has `preview(key): TransformNode | null`, written for the build ghost. It
  builds into the SCENE THE MODULE HOLDS, so a studio with its own scene and its own lighting cannot
  use it — a node in the park's scene does not render in another scene's render target.

So `thumb-sources.ts` imports the pure builders directly — `rides/manifest` + `rides/materials` +
`rides/geometry`, `shops/manifest` + `shops/build` + `shops/materials` + `shops/textures`,
`scenery/catalog` + `scenery/generators` + `scenery/geometry` + `scenery/materials`. Every one is
lazy, guarded and keyed by ENTITY KIND rather than by item, so a pack that adds a fortieth ride
still needs no code change here. But it is three modules' internals read from a fourth folder, and
the moment one of them renames an export a kind loses its pictures.

The shape that fixes it, and it is one method:

```ts
/** Build this item into the caller's scene. The caller owns the result and disposes it. */
preview?(scene: unknown, key: string): { meshes: unknown[]; dispose(): void } | null;
```

on the main api of every module that claims a kind — `rides`, `shops`, `buildings`, `scenery`,
later `pools`. `thumb-sources.ts` would then be a `ctx.module(registry.ownerOfKind(kind))` and a
duck-typed call, with no neighbour's file named anywhere and a new kind working the day its module
ships. It is the same argument request 6 makes about palette items: three modules is past the point
where this folder should be asking each of them by name.

**Not done in this round** because it is four other folders, two of which had a builder in them at
the time. What shipped instead is the direct import, with `buildings` deliberately left out (its
folder was mid-round) — so a wall, a roof and a column still show the kind icon rather than a
picture, and that is the first thing this seam would fix.

---

## 8. The build tray shows a band of bare park through its own body at 768 px-tall windows — **for `ui`**

Round 2's critic found it and it is not in this folder, so it is written here rather than fixed
there: at **1024 × 768, 1152 × 768 and 1366 × 768** the tray paints a horizontal band of
unblurred, full-contrast park through its own body at **y ≈ 575–615** — about 40 px — with two
rows of tiles drawn over it. It does not appear at 900 px of height.

**What the band actually is, measured in the critic's own frame**
(`.game-render/critic-moulded/clip-d-1152x768.png`, sampled across the tray's full width):

| rows                                 | mean RGB inside the tray | luma variance |
| ------------------------------------ | ------------------------ | ------------: |
| y 545–560 — a tile row, tray painted | (115.0, 152.2, 120.4)    |       1,227.9 |
| **y 578–612 — the band**             | **(72.1, 107.2, 50.4)**  |     **116.6** |
| the park OUTSIDE the tray, same rows | (55.7, 83.1, 42.2)       |         134.4 |

So inside the band the park is **blurred** (variance 117 against 134 for the same rows outside, and
the sheen and the tile edges that give the row above its 1,228 are absent) and it is **not
darkened**: `TRAY`'s `backdrop-blur-[24px]` is painting there and its
`bg-(--game-hud)` — `oklch(0.25 0.036 246 / 0.8)` — is not. That is a fill that failed to paint over
part of an element whose backdrop filter did, which is a compositing question rather than a layout
one, and it is why the row of tiles and the tab strip below the band are drawn straight onto the
park with no body behind them.

**It does not reproduce here**, in five configurations, which is worth as much as the measurement:

| build                            | viewport   | tab     | band |
| -------------------------------- | ---------- | ------- | ---- |
| shipped `8ae6990` (prod `:3100`) | 1152 × 768 | shops   | none |
| shipped `8ae6990` (prod `:3100`) | 1152 × 768 | scenery | none |
| this round (dev `:3001`)         | 1024 × 768 | scenery | none |
| this round (dev `:3001`)         | 1024 × 768 | rides   | none |
| this round (dev `:3001`)         | 1152 × 768 | shops   | none |

The second row is your own tab at your own width on your own build. The tray's measured height at
768 px is **357.3 px in both builds** — the grid's `max-h-[min(38vh,320px)]` caps it — so this
round's taller tiles did not move it and cannot be what hid the band.

The critic's frame has two things none of mine had: the **park panel docked** on the right (so the
bar's box is 780 px rather than 1088) and a **toast** over the park on the left. If it is
compositing, the number of stacked `backdrop-filter` surfaces is exactly the kind of thing that
decides it.

What this module owns and has checked:

- The tray is one `<section>` carrying `TRAY` (`bg-(--game-hud)` at `oklch(… / 0.8)` plus
  `backdrop-blur-[24px]`) with `overflow-hidden` and the tab strip as its last child. There is no
  element in `build-bar.tsx` with a transparent background at that offset, and nothing in it is
  positioned, transformed or `will-change`d.
- The only height that is a function of the viewport is the tile grid's
  `max-h-[min(38vh,320px)]`, which at 768 px is **291.84 px — a fractional used height on a
  scroll container**, and the band is roughly at its lower edge. That is the one thing on this
  side worth suspecting, and it is why the number is in this request rather than only in the
  screenshot.

`TRAY`, `--game-hud`, `--game-sheen` and the HUD's own stacking live in `lib/game/ui/surface.ts`
and `lib/game/core/game.css`, both of which are `ui`'s. Two questions this module cannot answer
from here: whether a `backdrop-filter` element in that cluster is being split by an ancestor that
becomes a backdrop root at some heights and not others, and whether the bottom cluster's own
container clips the tray. If the answer turns out to be the fractional max-height, say so and this
module will round it — that is a one-line change on this side and it should not be guessed at from
here.

---

## 9. A misting station is drawn as a round kiosk with a green canopy — **content, not code**

`neon-lagoon`'s `misting-station` declares `"procedural": "kiosk-round"`, which is the same
generator `ice-cream`, `lemonade`, `information` and `smoothie` use. The tile now renders what the
game will actually build, so the picture is **accurate and still wrong**: what gets built is a
kiosk, and a misting station is an arch you walk through.

Round 2's critic put it exactly right — "a picture that shows the wrong thing is worse than an
icon, because a reader believes it" — and the sentence is now about the pack rather than about the
studio: the thumbnail cannot be more honest than the geometry it photographs. Two ways to close it,
both outside this folder:

1. `shops/` grows a `misting` form beside `round`, `block`, `unit`, `machine` and `kiosk`, and the
   pack names it. One `case` in `shops/build.ts` and one string in `pack.json`.
2. Failing that, the pack points it at `machine` (the ATM's form), which is at least not a food
   counter with an awning.

Five shops sharing one building is a separate and much smaller thing: they are five kiosks in a
real park too, and with the frame now on the building rather than on its plot their sign colours
(`#ff9ecb`, `#fff176`, white, `#16e0c8`) and their glyphs are what tells them apart. The measured
distinctness is in the report.

---

## 10. Coasters and flumes: a preview needs a stub of track, not a point

Seven of 65 palette items still have no picture — four coasters and three flumes — and they are the
only ones left. They are `route` items: there is no geometry until somebody draws a layout, so
there is nothing for the studio to photograph, and the tile falls back to the icon the PACK asks
for (`build-bar.tsx`'s `PACK_ICONS`, new this round) rather than to one glyph for the whole tab.

The honest picture for a route item is **a few metres of its own track**: `track/` already exports
`resolveStyle`, `buildTrack`, `buildTrackGeometry` and `TRACK_LAYOUTS`, so a straight-plus-curve
stub in the item's own style, gauge and colour would separate a wooden classic from a steel hyper
from an inverted family coaster, and would be true — that is what the rails will look like. What it
needs from `track` is one exported function that turns a `rides` item key into a short `TrackData`,
because inventing a layout inside `lib/game/tools/` would be putting content in a tool.

Same shape for `flumes`. Both are the request in §7 with a different noun.
