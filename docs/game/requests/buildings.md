# Requests — `buildings`

What this module needs from core, the packs, `demo-park` and `tools`, with the exact change where I
can write it. Everything here has a workaround in place and nothing is blocking. §8 is the one that
cost a round: it turned `pnpm test:game` red for everybody, and the workaround was a whole file.

## 1. `demo-park`: the two reserved plots — **done, both are in the world factory**

The integrator placed both between round 1 and round 2, and `demo-park`'s entity census now reads
`building: 2`. Nothing further is needed here. The rest of this section is kept because it is the
measurement behind the two calls, and a later change to either blueprint has to be re-checked
against these numbers.

`PADS` in `lib/game/demo-park/plan.ts` holds `pavilion` (`-8, -162`, half-extents 28 × 16, levelled
at 7 m) and `entrance-hall` (`-33, 178`, 11 × 19, at whatever the street corridor made it) for this
module, and I may not edit that folder. These were the two calls:

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

66,000 checks, ~2 s, no browser needed.

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

They were in `.game-render/park/report.json` back when the demo park still held **zero** `building`
entities — this module drew nothing there and allocated no instance buffer, so they cannot be
thin-instance writes from here — and they are equally in `.game-render/probe-rides/report.json`
against a showcase this module does not appear in. Worth someone tracking down: two warnings that
are always present are two warnings nobody will ever read.

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

## 8. Core: a module with no `sim` cannot own an entity kind

`SimRuntime.createModules` skips a module before it claims its kinds:

```ts
for (const id of ids) {
  const def = byId.get(id);
  if (!def?.sim) continue;                                    // ← here
  …
  for (const kind of def.kinds ?? []) this.registry.registerKind(kind, def.id);
```

`host.ts` does the same registration unconditionally, so the two registries disagree: on the main
thread `building` is owned by `buildings`, and on the worker it is owned by nobody. Nothing renders
differently, which is why it survived a whole round — the symptom is
`pnpm test:game`'s soak check, `✗ no orphan entities — {"building":2}`, and it only appeared the day
the demo park got its first two `building` entities. The check's own comment predicted it.

The fix is to hoist the loop above the guard:

```ts
for (const id of ids) {
  const def = byId.get(id);
  if (!def) continue;
  for (const kind of def.kinds ?? []) this.registry.registerKind(kind, def.id);
  if (!def.sim) continue;
  …
```

`kinds` is a declaration of ownership and `sim` is a capability; today the first is conditional on
the second. This module now has a `sim` and no longer depends on the change, so nothing is blocked —
but the next builder who writes a render-only module that owns a kind will spend the same round.

---

## 9. `paths`: a `plaza` does not clip a `path` that crosses it

**Round 3, found by opening a frame.** `showcase.ts` laid one `plaza` (`style: 'pavers'`) from
[-13.5, -9] to [13.5, 29] under the kit row, which the 10 m `promenade` path runs straight through.
The two surfaces are coplanar and the frame came back with them torn into each other — interleaved
patches of grey slab and clay paver down the middle of `1200-kit.png`, the signature of two co-planar
meshes fighting for the depth buffer. Crop: `.game-render/_r3-crops/kit-yard-zfight.png`.

Path against path clips correctly: the showcase's 6 m cross walk at z = 20 has run through that same
promenade since round 2 with no seam. So the mechanism exists and this case misses it.

`layout.ts` has `plazaClip(plaza, spline)`, which returns a clip region for the spline when at least
one of the spline's **stations** falls inside the plaza ring, with the comment _"A plaza is never cut
by the path that lands on it: the plaza is the surface, the path stops at its kerb line."_ That is
the right rule and it is not what the frame shows, so one of three things is true and only `paths`
can say which: the promenade has no station inside that ring (a sampling question), the clip is
computed and not applied to a path that passes **through** rather than **lands on**, or a plaza whose
ring contains a path end-to-end is a case the function does not reach.

**Nothing is blocked.** The showcase uses two `path` aisles instead, which stays out of the depth
fight rather than trying to win it, and it reads better anyway. This is filed because the next module
that lays a plaza over a path will spend the same afternoon, and because a builder cannot tell from
the API that `form: 'plaza'` and `form: 'path'` compose differently.

## 10. Harness: the HUD panel covers the right quarter of every gauntlet frame

Minor, and it is a framing tax rather than a bug. `game-shot.mjs` photographs the running page, so
the Park panel and the build bar sit over roughly the right 25 % and the top 18 % of all nine frames.
For a module whose showcase is a street with two sides, that is one side permanently behind an
overlay — the round-2 critique's finding 6 was partly this, and this round's `overview` was re-aimed
around the panel rather than around the content, which is the wrong way round.

A `--hud=0` flag (or a query parameter the harness already sets, beside `harness=1`) that boots with
the panels collapsed would give every module back a quarter of its frame. It should stay opt-in: the
HUD in the frame is also how `ui` gets photographed at all, and two of this module's own findings
were caught because the animated clock was there to prove the A/B was comparing two live frames.
