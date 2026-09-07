# Requests from the `pools` builder

Nothing here blocks the module. Each item names what `lib/game/pools/` does instead today, so the
integrator can see what to delete when the change lands.

---

## 1. Run the module's self-test in `pnpm test:game` (package.json)

`lib/game/pools/selftest.mjs` covers the eight things a green build and a screenshot cannot: the
winding convention, the excavation's clearance under the tile, both halves of the content path, the
determinism of the geometry and the deck layout, the save round trip, what the water surface knows
is dry, finiteness, and the queries `flumes` will call.

```jsonc
// package.json
"test:game-pools": "node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/pools/selftest.mjs",
"test:game": "… && pnpm test:game-rides && pnpm test:game-pools && pnpm test:game-soak",
```

Run by hand today: **80 checks, ~1.4 s, all green.**

---

## 2. `Registry.name` shadows `Function.prototype.name`, and it throws intermittently

Not this module's. Three of the six harness runs taken while building it — `pools-r1`, `pools-r2`
and the `--showcase=terrain` control — came back with two page errors and therefore a failed hard
gate; three others on the same tree (`pools-r3`, `pools-final`, `pools-demo-park`) came back with
none. The two are always these:

```
pageerror: Failed to execute 'measure' on 'Performance': name(names, locale) {
    return names[locale] ?? names.en ?? Object.values(names)[0] ?? '';
} could not be cloned.
pageerror: Should not already be working.
```

The cause is verifiable in one line, without a browser:

```
$ node --experimental-strip-types --import ./scripts/register-path-alias.mjs \
    -e "import('@/lib/game/core/registry.ts').then(m => console.log(typeof m.Registry.name))"
function
```

`Registry` declares `static name(names, locale)`, which **overwrites the class's own `.name`**. Every
class in JavaScript has one, and the dev-mode React instrumentation reads `.name` when it labels a
`performance.measure` entry — so instead of the string `"Registry"` it gets a function, and
`measure()` refuses to structured-clone it. The second error (`Should not already be working`) is
React unwinding from inside that throw. Whether the instrumentation gets that far in a given load is
what makes it intermittent.

Two things follow. It is a **hard gate for every module in the gauntlet** — "any console error, not
'a harmless one', zero" — and one that can pass or fail on the same commit depending on the run,
which is worse than a reliable failure. And no builder can clear it from inside their own folder: it
is a one-word fix in a file only the integrator may touch.

```diff
-  /** Localised name with `en` fallback. */
-  static name(names: Record<string, string>, locale: string): string {
+  /** Localised name with `en` fallback. */
+  static localized(names: Record<string, string>, locale: string): string {
```

`Registry.name(` has call sites outside core (`scenery/catalog.ts`, `shops/manifest.ts`,
`rides/manifest.ts`, `ui/panels/*`), all of which want the method and none of which want the class
name. A free exported function would do as well. **Should the two errors reappear in this module's
`report.json`, they are not this module's** — they are identical, byte for byte, in a run of
`--showcase=terrain` taken as a control (`.game-render/control-terrain/report.json`), which loads no
pools at all.

---

## 3. A polygon excavation on the terrain API

A pool is a hole, and a heightfield is a surface: a basin drawn under one is invisible, because the
ground spans its plan at grade. So `lib/game/pools/excavate.ts` lowers the heightfield itself — on
the render copy directly and on the worker's through this module's own `pools:excavate` command,
with a function that is pure and only ever lowers, so the two copies converge whatever order they
arrive in.

That works and is tested, but it writes into `world.terrain.heights`, which is the terrain module's
state. The public API cannot express it today: `terrain.brush()` takes a **circle**, so covering one
28 × 18 m lagoon takes about forty strokes, forty commands and forty chunk rebuilds, and leaves a rim
made of the union of forty circles.

What would replace the whole file:

```ts
// TerrainMainApi / TerrainSimApi
/** Lower the ground inside `points` (world metres, closed) to `depth(x, z)`, never raising it. */
excavate(points: number[], depth: (x: number, z: number) => number): void;
```

Two properties this module depends on and would need kept: it must **only lower** (so it is
idempotent and two modules cutting overlapping pits cannot fight), and it must apply to the sim's
copy through a command so a save carries the hole.

---

## 4. `demo-park`: filling the `water-park` pad

The pad is reserved (`PADS`, id `water-park`, owner `pools`, at (112, 50), half-extents 22 × 16,
height 1.2) and the `camera` module's `pool` preset targets (110, 0, 60), which today frames empty
ground. The demo park builds its world in a **factory** — plain state, node-runnable, no Babylon —
so the call is not "ask the pools module to place something", it is "write an entity", and this
module exports exactly one function for it.

```ts
// lib/game/demo-park/build.ts — near the prop placement
import { attachPoolContent, makePoolEntity } from '../pools';

// once, before the first makePoolEntity call (idempotent, and the sim half does it too):
attachPoolContent(registry);

// then, using demo-park's own id allocator and its own ground sampler:
const lido = makePoolEntity({
  id: nextId('pool'),
  shape: 'lagoon',
  x: 106,
  z: 46,
  y: groundAt(106, 46), // 1.2 on this pad
  yaw: 0.25,
  size: [30, 19],
});
const kids = makePoolEntity({
  id: nextId('pool'),
  shape: 'kids-pool',
  x: 126,
  z: 60,
  y: groundAt(126, 60),
  yaw: -0.3,
});
const spa = makePoolEntity({
  id: nextId('pool'),
  shape: 'whirlpool',
  x: 96,
  z: 62,
  y: groundAt(96, 62),
  yaw: 0.6,
  heated: true,
});
for (const e of [lido, kids, spa]) world.entities[e.id] = e;
```

Checked against the pad the way `rides` round 1 asked for and did not do: the lagoon at (106, 46)
with a 30 × 19 plan plus a 3.2 m deck reaches x ∈ [84.4, 127.6] and z ∈ [30.9, 61.1] — inside the
pad's x ∈ [90, 134] on the east side and 5.6 m over its west edge, which is why it is offset east of
the pad centre rather than centred on it. The kids' pool (13 × 9.5 + 3.2 m deck) reaches
x ∈ [110.9, 141.1]: 7 m past the pad's east edge, so **either widen the pad or move it to
(122, 60)**, which clears at x ≤ 137.1 against a 20 m blend. The whirlpool (5 × 5 + 3 m timber deck)
is 11 m square and clears everywhere on the pad.

Three things worth knowing before placing them:

- **The pool digs its own pit** at boot, before the worker starts, so the factory does not have to
  sculpt anything. It must not be given a pad with a cross slope under a basin, though: a deck ring
  is a plane and the pad's flat 1.2 m is exactly right.
- **Pass a real `y`.** `makePoolEntity` writes it straight into the entity, and this module reads the
  entity's Y in preference to the terrain's (the terrain under a placed pool _is_ the pit).
- **Nothing needs to reach a path.** Guests cannot swim yet (see §7), so a pool has no queue and no
  service radius; a promenade past it is a look and not a requirement.

---

## 5. The night light budget belongs in `QualitySettings`

Three modules now size their own pool of real `PointLight`s from a private record keyed by preset:
`scenery` (0/2/4/6), `rides` (0/3/4/6) and this one (0/2/3/4). At `ultra` that is **sixteen** lights
in one scene, and `PBRMaterial.maxSimultaneousLights` is 6 — so what any given surface actually
receives depends on scene order and `renderPriority`, not on which lamp is nearest it. It is the same
shape as the request `scenery` §2 already made about the terrain material, one level up.

```ts
// QualitySettings
/** Real point lights the whole scene may hold, split between the modules that ask for one. */
nightLightBudget: number; // low 0, medium 4, high 8, ultra 12
```

…plus a tiny allocator in core so a module asks for a share rather than helping itself. This module
keeps `renderPriority = -1` on all of its lamps, as `scenery` asked, so what a material drops when it
runs out of slots is a pool lamp and never the sun.

---

## 6. i18n keys, when a pool name reaches the HUD

Every basin, tile style, edge treatment and deck item carries a localized `name` in its manifest
entry (`{ en, de }` on the built-ins). Nothing renders one yet. When the build bar does, it should
call the registry's localized-name helper (see §2 for its name) rather than needing new keys —
this is a request for **ui**, not for **i18n**.

---

## 7. What `guests` will need, when it can swim

`PoolsSimApi` already exposes `poolAt(x, z)`, `depthAt(x, z)`, `capacity(id)`, `enter(id)` and
`leave(id)`, and the sim tracks `swimmers` per basin against a rating of one bather per 3.4 m² of
water. Nothing calls any of it: the guests module has no swimming behaviour and no `cooling` need
routed to a pool. Two things it would want that are **not** built, so that they are designed rather
than guessed:

- **Where to get in.** Every basin knows its entry (`shape.entry`, `shape.entryYaw`) and the geometry
  puts steps or a ladder there, but there is no `entryPoint(id): {x, z}` on the api yet. It is four
  lines when somebody needs it.
- **A changing room.** `neon-lagoon` ships `changing-rooms` as a shop; a guest going swimming is a
  two-stop errand and that is the `shops`/`guests` contract, not this one's.

---

## 8. Small notes, no action needed

- **`overview` is a fixed 400 m from `park:centre`**, so a showcase that fits in seventy metres
  arrives in it as a smudge. This module spread its lido over about 200 m for that reason. Recorded
  because the next builder staging a compact showcase will meet the same frame.
- **`ground` anchors on `park:entrance | park:centre`** and steps 105 m along bearing 0, which is
  **−Z**. A showcase with no paths module has to put something at z ≈ −105 or that preset looks at
  an empty field. This one puts the lap pool there.
- **`SimHandle` has no `deserialize`** though ARCHITECTURE §4's table lists one; `rebuild()` after the
  world is in place is the real contract, and that is what this module uses. Same note `scenery` §3
  made — documentation only.
