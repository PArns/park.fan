# Requests — `buildings`

What this module needs from core, the packs, `demo-park` and `tools`, with the exact change where I
can write it. Everything here has a workaround in place and nothing is blocking.

## 1. `demo-park`: the two reserved plots

`PADS` in `lib/game/demo-park/plan.ts` holds `pavilion` (`-8, -162`, half-extents 28 × 16, levelled
at 7 m) and `entrance-hall` (`-33, 178`, 11 × 19, at whatever the street corridor made it) for this
module, and I may not edit that folder. These are the two calls, to be made in the world factory
after the pads are flattened and the paths are laid:

```ts
const pavilion: Entity = {
  id: nextEntityId(world, 'building'),
  kind: 'building',
  pack: 'parkfan-architecture',
  item: 'grand-pavilion',
  // y = 0 makes the renderer sample the terrain, which is what a plan wants; pass the pad height
  // instead if the landform has already been solved at this point.
  position: [-8, 0, -162],
  // The front is +z, and +z from the pavilion pad is the forecourt at z = -130.
  yaw: 0,
};

const ticketHall: Entity = {
  id: nextEntityId(world, 'building'),
  kind: 'building',
  pack: 'parkfan-architecture',
  item: 'ticket-hall',
  position: [-33, 0, 178],
  // π/2 turns the +z front to +x, i.e. towards the roundel in the middle of the forecourt, which is
  // the note on that pad.
  yaw: Math.PI / 2,
  // Optional: the park's own theme rather than the blueprint's default station stone.
  data: { style: 'old-town-brick' },
};
```

**Both fit, and I did not take my own word for it.** The two calls above were run against the real
demo park through `__parkfan_game.dispatch` and the resulting meshes' **world** bounding boxes were
read back out of the scene:

| item             | pad rectangle               | built extent (world, apron and kerb in) | clearance to the pad edge   |
| ---------------- | --------------------------- | --------------------------------------- | --------------------------- |
| `grand-pavilion` | x [−36, 20], z [−178, −146] | x [−35.21, 19.21], z [−174.31, −149.32] | 0.79 / 0.79 / 3.69 / 3.32 m |
| `ticket-hall`    | x [−44, −22], z [159, 197]  | x [−42.56, −23.44], z [162.24, 193.76]  | 1.44 / 1.44 / 3.24 / 3.24 m |

**Overhang: 0.00 m on all eight edges.** Spans are 54.42 × 24.99 m in a 56 × 32 pad and
19.12 × 31.52 m in a 22 × 38 pad; the pavilion's ridge reaches y = 28.54 with the pad at 7 m, so it
stands 21.5 m over its own ground. Two buildings cost **7 draw calls and 22,830 triangles**, and the
run logged **zero console errors**.

Photographed as well as measured, because a number does not say whether a building belongs where it
is put:

- `.game-render/buildings-pads/pavilion.png` — the hall on the pavilion pad with its forecourt plaza
  below it and the park's own trees round it, arcaded, wings hipped, lantern lit from inside.
- `.game-render/buildings-pads/entrance-hall.png` — the ticket hall on the west flank of the
  entrance forecourt, its seven-bay arcade square on to the planted roundel, in the park's own brick
  rather than the blueprint's station stone (that is what the `data.style` line above buys).
- `.game-render/buildings-pads/entrance-preset.png` — the same from the built-in `entrance` camera,
  which is the frame the whole-game critic will actually take.

The pad-fit check is also in `selftest.mjs` ("demo-park plots") so it stays true without a browser:
change a blueprint and it says whether the building still fits the plot the park is holding.

Two smaller items for whoever picks the demo park up next, neither of them needed for the above:

- **A terrace is what a main street is made of.** `terrace-house` is 9.7 m wide and is meant to be
  repeated on a 10 m pitch; three of them in a row cost **one** batch and three matrices. The
  showcase does exactly that at `x = -16, z = 56 / 46 / 36`.
- **`entrance()`** on the main api returns the point a guest walks to, in world space, per entity id.
  It is the door threshold plus 2.4 m, not the entity position, so a path drawn to the entity centre
  ends inside the building.

## 2. `package.json`: the selftest

I may not edit it. The line I would add:

```json
"test:game-buildings": "node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/buildings/selftest.mjs",
```

and `&& pnpm test:game-buildings` appended to the `test:game` chain. It runs standalone today:

```
node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/buildings/selftest.mjs
```

65,918 checks, ~1 s, no browser needed.

## 3. Core: `Registry.name` shadowed the class's own `name` — fixed while this module was being built

Recorded because the finding is worth keeping even though the fix has landed. Every harness run
against **any** showcase was reporting two page errors:

```
pageerror: Failed to execute 'measure' on 'Performance': name(names, locale) {
      return names[locale] ?? names.en ?? Object.values(names)[0] ?? '';
  } could not be cloned.
pageerror: Should not already be working.
```

`Registry` had a **static method called `name`**, which shadows `Function.prototype.name`, so
`Registry.name` was a function where every consumer expects the string `"Registry"`:

```
$ node -e "…" → typeof Registry.name = function
```

React's dev-mode profiler structured-clones what it puts in `performance.measure(..., { detail })`,
hits that function, throws, and the throw lands inside React's commit — which is where the second
error comes from. Reproduced on `--showcase=rides` (a module I have not touched) at
`.game-render/probe-rides/report.json` before it was fixed, and gone from every run after
`Registry.localized` landed. Nothing in this module depended on either name.

## 4. Core: `pnpm game:teardown` fails on a boot error that is not a leak

```
✗ no console errors across the walk — ["[game] boot failed TypeError: Cannot set properties of null
  (setting 'exposure') at Object.applyEnvironment (…lib_game_core….js:1969:51)"] ×2
```

The context checks all pass — "at most one live engine context", "the capability probe gives its
context back", "dispose() releases the engine context" — so this is `applyEnvironment` writing
`exposure` on a null pipeline during a reboot, in core/environment, not a leak and not this module
(nothing here touches the pipeline or the image processing). Recorded so the next builder does not
spend a round on it.

## 5. Harness: two WebGL warnings that belong to nobody in particular

Every run of every scene reports exactly:

```
WebGL: INVALID_VALUE: bufferSubData: buffer overflow   ×2
```

They appear identically in `.game-render/park/report.json` (the demo park, which contains **zero**
`building` entities, so this module draws nothing there), in `.game-render/probe-rides/report.json`
and in this module's own runs, so they are not thin-instance writes from here. Worth someone
tracking down: two warnings that are always present are two warnings nobody will ever read.

## 6. `pack-schema.ts`: `buildings[].size` has no unit contract, and the palette reads it

Not a change request, a note. `tools/palette.ts` derives a footprint from `def.size` as
`[size[0], size[2]]` and a ghost height from `size[1]`, so those three numbers are a **promise about
the geometry** that nothing checks. This module keeps that promise in its own selftest (every
blueprint's built bounds are compared against its declared `size` within 8 %, apron excluded), but a
pack written by anybody else can lie and the only symptom is a ghost that does not match what lands.
If a validator ever grows here, that is the check worth having.

## 7. `i18n`: nothing needed yet

Every name a player sees comes out of a manifest (`buildings[].name`, `buildingStyles[].name`,
`buildingBlueprints[].name`) with `en` and `de` in this module's own pack, and the build bar already
renders them — twenty items, all localized, in `.game-render/probe-palette/buildings-tab.png`. The
only English string this module puts in front of a person that is not from a manifest is the console
warning prefix. When a building inspector panel lands it will want keys for "storeys", "windows" and
"style"; there is nothing to add before then.
