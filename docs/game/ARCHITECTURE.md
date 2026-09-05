# park.fan Coaster — Architecture

The game is a Next.js feature: one route (`app/game`), one feature root (`lib/game`), one worker.
This document is the contract every module is built against. Module authors read §2–§6 and their
own row in §7; the integrator owns §1–§6 and `lib/game/core`.

## 1. Threads and the frame

```
┌──────────────── main thread ─────────────────┐   ┌────────── sim.worker.ts ───────────┐
│ React HUD (lib/game/ui)                       │   │ World (authoritative)              │
│   ▲ store (zustand-free: useSyncExternalStore)│   │ fixed 20 Hz scheduler              │
│ GameHost ─ Engine (WebGPU | WebGL2)           │◄──│ frame: tick, clock, transferables  │
│   ├ Scene, camera, lights, post-process       │──►│ command: build/price/hire/…        │
│   ├ MainModule × N (meshes, materials, FX)    │   │ SimModule × N (guests, trains, …)  │
│   └ interpolation of the last two frames      │   │ save/load: World JSON              │
└───────────────────────────────────────────────┘   └────────────────────────────────────┘
```

- The **worker** owns the world and advances it in fixed 20 Hz ticks (`TICK_MS = 50`). Nothing
  on the main thread mutates simulation state; it sends `command` messages.
- The **main thread** renders, handles input and draws the HUD. It keeps the last two `frame`
  messages and interpolates transforms by `alpha = (now - frame.t1) / TICK_MS`.
- The React tree never awaits the worker. `GameHost` mounts, posts `init`, and paints the loading
  shell until `ready`; a worker that never answers within 8 s shows the "reduced mode" notice and the
  scene still renders (no guests, no trains) — a broken sim degrades to a diorama.
- Speed 0 pauses the scheduler; speeds 1/2/3/5 multiply park minutes per tick; the soak harness
  uses 100.

**Time.** Park time is minutes since midnight in `world.clock.minute` plus `world.clock.day`. At
speed 1 a real second is one park minute, so a tick advances `speed / 20` minutes. Rides, guests
and finance are all integrated in park minutes, never in real time, which is what makes 100× a
valid test and not a different game.

**Determinism.** All randomness comes from `Rng` (`lib/game/core/rng.ts`, xoshiro128**), one
stream per module seeded from `world.meta.seed` and the module id. `Math.random` is banned in
`lib/game/**` (grep guard in `scripts/test-game-lint.mjs`). Command order is the tick order; the
save contains the command log tail (`world.log`) so a replay reproduces the world.

## 2. Units and coordinates

- Metres, +Y up, right-handed (`scene.useRightHandedSystem = true`). 1 unit = 1 m.
- The park is a square of `world.terrain.size` metres (default 512) centred on the origin; the
  heightmap has `resolution + 1` samples per side (default 256 → 257²), so one cell is 2 m.
- Rotations in radians; yaw about +Y, positive counter-clockwise seen from above.
- Paths are 4 m wide by default; snapping optional at 0.25 m / 15°.
- Park time in minutes; money in whole cents as integers (no float money).

## 3. The world model (`lib/game/core/world.ts`)

One serialisable object. Every module's persistent state lives in its own slot of
`world.modules[moduleId]`; core holds only what every module reads:

```ts
interface World {
  meta: { version: 1; seed: number; name: string; createdAt: number; packs: string[] };
  clock: { day: number; minute: number; speed: 0 | 1 | 2 | 3 | 5 | 100 };
  terrain: TerrainData; // size, resolution, heights (Float32Array), paint (Uint8Array), waterLevel
  entities: Record<EntityId, Entity>; // placed things: rides, shops, scenery, buildings, pools, paths
  finance: { cash: number; loan: number; history: DayLedger[] };
  modules: Record<string, unknown>; // module-owned state, JSON-serialisable
  log: Command[]; // command tail since the last checkpoint
}
interface Entity {
  id: EntityId;
  kind: EntityKind;
  pack: string;
  item: string;
  position: [number, number, number];
  yaw: number;
  scale?: number;
  data?: Record<string, unknown>; // kind-specific, owned by the module that registered the kind
}
```

`EntityKind` is an open string union registered through the content registry (`ride`, `shop`,
`scenery`, `building`, `pool`, `path`, `flume`, `staff-post`…). Core never switches on a kind; it
dispatches to the module that claimed it.

Serialisation (`serializeWorld`/`deserializeWorld`) encodes typed arrays as base64 and is
byte-stable: keys are written in a fixed order, numbers are finite (a NaN fails the save, loudly).

## 4. Modules

```ts
interface GameModule {
  id: string;
  deps?: string[]; // module ids that must be created first
  kinds?: EntityKind[]; // entity kinds this module owns
  main?: (ctx: MainContext) => MainHandle | Promise<MainHandle>;
  sim?: (ctx: SimContext) => SimHandle;
  showcase?: (ctx: MainContext) => Promise<void>; // /game?showcase=<id>
}
interface MainHandle {
  onFrame?(frame: SimFrame, alpha: number): void; // once per render frame
  onEntity?(change: EntityChange): void; // add/update/remove from the world
  onEnvironment?(env: EnvironmentState): void; // sun, weather, season
  dispose(): void;
}
interface SimHandle {
  tick(dtMinutes: number): void;
  command?(cmd: Command): boolean; // true = handled
  fill?(frame: SimFrameWriter): void; // write transferable buffers
  serialize?(): unknown;
  deserialize?(state: unknown): void;
}
```

- **Failure isolation.** `createModules()` wraps each `main()` / `sim()` in a try/catch; a throw
  logs `module:failed { id, error }`, the module becomes a stub and boot continues. The canvas is
  inside a React error boundary that renders the shell plus a one-line reason.
- **Registration.** `lib/game/modules.ts` is the only list of modules and is owned by the
  integrator. A builder ships `lib/game/<module>/index.ts` exporting `const module: GameModule`.
- **Events.** One typed `EventBus` per thread (`lib/game/core/events.ts`). Cross-thread events are
  forwarded by core as `event` messages; a module emits on its own bus and never posts messages.

### Owned state and public API per module

| Module      | Owns (world slot / entity kinds)              | Public API (imports allowed from other modules)                            | Emits                                                    |
| ----------- | --------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------- |
| core        | `meta`, `clock`, `finance`, `entities`, `log` | `world`, `rng`, `events`, `registry`, `protocol`, `scheduler`, `save`      | `world:ready`, `module:failed`, `clock:tick`, `entity:*` |
| terrain     | `terrain`                                     | `sampleHeight(x,z)`, `sampleNormal`, `sculpt/paint` commands, `waterLevel` | `terrain:changed { rect }`                               |
| environment | `modules.environment` (weather, season)       | `getSun(minute)`, `getWeather()`, `EnvironmentState`                       | `env:changed`                                            |
| ui          | nothing persistent                            | `GameHud`, `Panel`, `BuildBar`, `useGameStore`, `notify()`                 | `ui:tool { id }`                                         |
| audio       | `modules.audio` (mute, volumes)               | `play(id, at?)`, `bus(name)`                                               | —                                                        |
| effects     | nothing persistent                            | `spawn(kind, at, opts)`, `NightLightRig`                                   | —                                                        |
| paths       | kind `path`; `modules.paths` (graph)          | `PathGraph`, `nearestNode`, `route(a,b)`, `plaza`, `queue`                 | `paths:changed`                                          |
| pools       | kind `pool`                                   | `PoolTool`, water material                                                 | `pools:changed`                                          |
| track       | `TrackData` type; tools                       | `Track` (arclength spline), `frameAt(s)`, `validate()`, `buildSupports()`  | `track:changed { rideId }`                               |
| buildings   | kind `building`                               | kit-bash, blueprints                                                       | —                                                        |
| scenery     | kind `scenery`                                | `scatter`, prop placement                                                  | —                                                        |
| shops       | kind `shop`                                   | stock/prices, `serve(guest)`                                               | `shop:sale`                                              |
| rides       | kind `ride` (flat)                            | rig manifests, `RideState`, `board/dispatch`                               | `ride:cycle`, `ride:breakdown`                           |
| flumes      | kind `flume`                                  | slide types on the track core                                              | —                                                        |
| trains      | `modules.trains`                              | `simulateTrain`, G/ratings, block sections                                 | `train:crash`, `ride:rated`                              |
| guests      | `modules.guests` (SoA arrays)                 | `spawn`, `count`, `stats()`                                                | `guest:thought`, `guest:left`                            |
| staff       | kind `staff-post`, `modules.staff`            | hire/fire/zones                                                            | `staff:task`                                             |
| management  | `finance`, `modules.management`               | pricing, loans, marketing, research, power, water, wages                   | `finance:day`, `power:outage`                            |
| overlays    | nothing persistent                            | heatmap layers                                                             | —                                                        |
| tools       | nothing persistent (command stack on main)    | `useTool(id)`, `undo/redo`, gizmos, ghost meshes                           | `tool:*`                                                 |
| camera      | `modules.camera` (last view)                  | presets, modes (orbit/walk/ride/photo)                                     | `camera:mode`                                            |
| scenarios   | `modules.scenarios`                           | objectives, sandbox                                                        | `scenario:objective`                                     |
| persistence | —                                             | `listSaves`, `save`, `load`, `exportJson`, `importJson`, sharing (flag)    | `save:done`                                              |
| demo-park   | a `World` factory                             | `buildDemoPark(seed)`                                                      | —                                                        |

## 5. Worker protocol (`lib/game/core/protocol.ts`)

Main → worker: `init { world, packs }`, `command { cmd }`, `speed { speed }`, `save { requestId }`,
`load { world }`, `dispose`.
Worker → main: `ready { tick }`, `frame { tick, clock, buffers }`, `event { name, payload }`,
`snapshot { requestId, world }`, `error { where, message }`.

A `frame` carries transferable buffers, each owned by one module and declared in
`SimFrameWriter`: `guests.position` (Float32 ×3), `guests.heading` (Float32), `guests.anim` (Uint8),
`trains.transform` (Float32 ×(pos3 + quat4) per car), `rides.state` (Uint8). The writer allocates
double buffers so the worker never waits on the main thread; a frame that arrives while the previous
one is unread is dropped (the main thread interpolates from the newest two).

## 6. Render pipeline (`lib/game/core/renderer.ts`)

WebGPU when `navigator.gpu` exists and `WebGPUEngine.IsSupportedAsync` resolves, else WebGL2; a
WebGL1-only device gets the `low` preset and the notice. One `Scene`, ACES tone mapping through
the `DefaultRenderingPipeline` (FXAA, bloom on `high`+, DOF only in photo mode), a cascaded shadow
generator on the sun (`high`/`ultra`), image-based lighting from an HDR environment texture (from
`environment`). Quality presets scale: shadow map size, cascades, hardware scaling, bloom, SSAO,
particle counts, guest LOD distances, foliage density.

Budgets (asserted by the harness): ≤ 1200 draw calls, ≥ 50 fps at 1080p on the reference machine,
≤ 6 ms sim tick. Everything repeated is a thin instance; world matrices are frozen when a thing
stops moving; picking uses the octree / GPU picker, never per-mesh raycasts on hover.

## 7. Folders

```
app/game/                 route: layout.tsx (html, dark, fonts, game.css), page.tsx (metadata + shell), loading
app/api/game/             feature-flagged blueprint sharing (off by default)
lib/game/
  core/                   engine boot, renderer, world, rng, events, registry, protocol, scheduler, save, sim.worker.ts, host.tsx
  modules.ts              the module list (integrator-owned)
  i18n/                   game strings
  content/packs/          core-classic/, neon-lagoon/ (pack.json + procedural definitions)
  <module>/               one folder per §4 row; index.ts exports `module`
  ui/                     HUD shell, panels, build bar (React + Tailwind on @/components/ui)
public/game/              assets/ (fetched, gitignored), packs/ (optional extra packs)
scripts/game-shot.mjs     Playwright: screenshots + metrics JSON
scripts/game-soak.mjs     headless soak (48 park-hours at 100×)
scripts/test-game-*.mjs   unit tests (node --experimental-strip-types)
docs/game/                this folder; STATUS.json is the persisted scoreboard
```

## 8. Boot sequence

1. `app/game/page.tsx` (server) renders metadata + the shell (`GameShell`: full-viewport dark
   background, park.fan lockup, progress).
2. `GameCanvas` (client, `ssr: false`) mounts → `dynamic import('@/lib/game/core/host')`.
3. `host.boot(canvas, opts)`: detect capabilities → pick preset → create engine → create scene →
   register bundled packs → create main modules (deps order) → start worker → `init`.
4. Worker: deserialise world (or `demo-park`/`sandbox`/showcase factory) → create sim modules →
   `ready`.
5. Main: on `ready` emit `world:ready` (also `window.__parkfan_game.ready = true` for the harness),
   hide the shell, start the render loop.

`?showcase=<module>` skips 4 and stages the module's own scene; `?seed=`, `?quality=`, `?tod=`,
`?cam=` are read by `parseBootQuery()`.
