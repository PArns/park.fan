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
and behind it a shape mismatch the union cannot fix. The palette's model is *one manifest key is
one flat array of placeable defs*. The `pools` key is an **object of four arrays** (`shapes`,
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
