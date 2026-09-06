# camera — requests

Written while building `lib/game/camera/`. Nothing here blocks the module; each item is worked
around in a way the report names, and each workaround is worse than the fix.

## 1. Wire the selftest into `pnpm test:game` — **done**

*Integrator, after the builder stopped:* wired as `test:game-camera` and added to the `test:game`
chain between `test:game-shops` and `test:game-soak`. The whole chain is 92 green checks, exit 0.

### Original request

`lib/game/camera/selftest.mjs` — 114 checks, green at the time of writing, run four times:

```
node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/camera/selftest.mjs
```

It is worth wiring because three of its checks are about things a screenshot cannot show and that
a refactor would break silently: the pivot of an orbit staying on its pixel to 1e-6 of NDC, the eye
leash holding over 288 extreme poses, and 900 frames of hostile input never putting the eye under
the ground. It found two real bugs while being written, both recorded in §"what went wrong" of the
report.

Suggested, matching the four existing module entries:

```json
"test:game-camera": "node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/camera/selftest.mjs",
"test:game": "… && pnpm test:game-shops && pnpm test:game-camera && pnpm test:game-soak"
```

## 2. `MainContext` hands over the lights but not the camera or the canvas

`MainContext.lights` exists — with a docblock — because the `environment` module was finding the
sun with `scene.getLightByName('sun')`, "a contract written in string literals that nothing
enforces". This module has exactly that problem twice over and cannot fix it from inside its own
folder:

```ts
const camera = scene.activeCamera as ArcRotateCamera | null;   // main.ts
const canvas = engine.getRenderingCanvas();                    // main.ts
```

`scene.activeCamera` is better than a name lookup and still not a contract: if any module ever sets
`scene.activeCamera` — a photo mode, a minimap, a render target — this module drives whichever
camera happened to be active when `main()` ran, silently. And `getRenderingCanvas()` returns the
element every DOM listener in `input.ts` is attached to, so a null there is a camera with no input
and no error.

**Ask:** add `camera` and `canvas` to `MainContext` beside `lights`, typed as `unknown` for the
same reason the others are (this file is imported on the worker and must stay Babylon-free).

*Meanwhile:* the module checks `camera.getClassName() === 'ArcRotateCamera'` and, when that fails,
returns a handle whose `preset()` answers `false` — which hands the harness back to
`applyFallbackCameraPreset` rather than half-working. `input.ts` is simply not attached when there
is no canvas.

## 3. The renderer's camera limits override the module's

`ArcRotateCamera._checkLimits()` runs inside `Camera.update()` on every frame **whether or not its
inputs are attached**, and clamps `alpha`, `beta` and `radius` to the limits
`core/renderer.ts` set (`lowerBetaLimit = 0.08`, `upperBetaLimit = PI/2 − 0.04`,
`lowerRadiusLimit = 6`, `upperRadiusLimit = 900`). So whichever of the two sets of limits is
tighter wins, and the leash arithmetic in `pose.ts` would be describing a camera that does not
exist.

The module therefore opens the renderer's limits in `main()` and restores them in `dispose()`.
That works and it is a module reaching into another module's object.

**Ask:** either leave those four properties at their permissive defaults in `renderer.ts` (the
fallback presets in `host.ts` stay inside them anyway), or hand the camera over per §2 and let its
owner set them.

## 4. `game-shot.mjs` dies on `nextFrame()` under SwiftShader — **done**

*Integrator:* both `nextFrame()` awaits are gone. The script registers one
`onAfterRenderObservable` counter in the page after boot and `waitFrames(2)` polls it in short
evaluates, the same shape as the step wait, with a 30 s ceiling so a stalled render loop still
takes its screenshot. Verified on `--cam=overview,ground --step=900`: 2 shots, 0 errors.

### Original request


The script already documents this failure for the step wait and fixed it there by polling in short
`evaluate` calls. The same long-lived promise remains at lines 127–128:

```js
await page.evaluate(() => globalThis.__parkfan_game.nextFrame());
```

Measured over this module's runs: **4 of 14 first attempts** died with
`page.evaluate: Resulting promise was garbage collected`, all at that line, all on `--step=900`
shots of the demo park. Retrying the process succeeds (2 of 2 retries here).

**Ask:** replace the two `nextFrame()` awaits with a short poll on a frame counter, the way the
step wait already does it — or expose `__parkfan_game.frameCount` for the harness to poll.

*Meanwhile:* every shot in the report was taken by a wrapper that runs one `(tod, cam)` per
process and retries up to three times. The failures are reported rather than hidden.

## 5. `trains` should register a follow source

`api.follow(id)` resolves an id through a stack of `FollowSource` functions, newest first. The
module ships two: world entities (static), and `track:<trackId>`, which walks the `track` module's
own arclength spline at a fixed speed. The second is a **stand-in** and says so in its docblock —
there is no moving car in the world because `lib/game/trains/index.ts` owns nothing yet, and a
follow mode nobody can photograph is a follow mode nobody has checked.

When `trains` lands, one call replaces it with the real thing and neither module has to know about
the other:

```ts
ctx.module<CameraMainApi>('camera')?.registerFollowSource((id) => {
  // id is yours to define — 'train:<rideId>:<index>' or whatever you publish
  const car = lookup(id);
  return car ? { position: car.position, heading: car.heading } : null;
});
```

Sources are consulted last-registered-first, so registering later shadows the stand-in for the ids
you claim and leaves the rest alone.

## 6. The demo park has no coaster and no pool, so two presets frame empty ground

Measured on the running world: `world.entities` holds `path` × 20, `scenery` × 1578, `shop` × 7 —
and nothing else. `track.ids()` is `[]`. So `coaster` resolves through `kinds:coaster` (null) to
`plot:coaster`, and `pool` through `kinds:pool` (null) to `park:water`, which is the lake.

This is not a request for a change; it is a note for whoever grades those two frames, and for the
`track`, `rides`, `pools` and `flumes` builders: the presets will follow your entities the moment
they exist, with no edit here, because the anchor chains name kinds rather than coordinates.

## 7. `?cam=` cannot express a pose

`parseBootQuery` takes `cam=<preset>` only. A critic who wants a framing that is not one of the
seven has to go through `window.__parkfan_game.handle.module('camera')`, which works but is not
scriptable from `game-shot.mjs`. A `?cam=pose:x,z,bearing,pitch,distance` form would make one-off
critique framings a URL. Low priority; the probe in `.game-render/cam-frame.mjs` covers it for now.
