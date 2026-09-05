# park.fan Coaster — architecture

Read `INTEGRATION.md` first. This document is the contract every module is built against: what
`core` guarantees, what a module owns, what it may not touch, and how it fails.

---

## 1. The four threads of the thing

```
┌─ main thread ───────────────────────────────────────────────┐
│  React tree (HUD, panels, build bar)  ── DOM + Tailwind      │
│  Babylon scene (render, input, picking, gizmos)              │
│  interpolation of the newest two sim snapshots               │
└──────────────┬───────────────────────────────▲──────────────┘
               │ Command[] (structured clone)  │ SnapshotFrame (transferable)
               ▼                               │
┌─ sim worker ─────────────────────────────────┴──────────────┐
│  fixed 20 Hz scheduler · seeded RNG · authoritative world    │
│  guests, trains, economy, staff, queues, needs, weather      │
└─────────────────────────────────────────────────────────────┘
               │ IndexedDB (structured clone)
               ▼
        saves · blueprints · settings
```

**The React tree never blocks on sim work.** It reads a snapshot store that the main thread fills
from worker messages; a `useSyncExternalStore` subscription drives HUD re-renders at a throttled
4 Hz, while the 3D view interpolates at display rate.

**The worker is authoritative.** The main thread's copy of the world is a *view*: it is allowed to
predict (ghost meshes, preview geometry) but never to mutate simulation state. Every mutation is a
`Command`, stamped with the tick it was issued on and applied by the worker at a tick boundary.

---

## 2. Determinism

Non-negotiable, because the soak test and save round-trip both rest on it.

- **Fixed 20 Hz.** `TICK_MS = 50`. The worker runs an accumulator; it never scales by real elapsed
  time inside a tick. Fast-forward changes how many ticks run per frame, never the tick length.
- **Seeded RNG only.** `Math.random` is banned inside `_game/**` and grepped for by
  `pnpm test:game-determinism`. RNG is `xoshiro128**` seeded from the world seed, split into named
  **streams** (`guests`, `weather`, `breakdowns`, `naming`, …) so adding a consumer to one stream
  cannot shift another's sequence.
- **No wall clock in the sim.** `Date.now()` is banned in the worker. In-game time is `tick`.
- **Insertion-ordered iteration.** Entity iteration follows a dense `EntityId[]` array, never
  `Object.keys` or `Set` iteration over rehashed maps.
- **Round-trip.** `serialize(load(serialize(w))) === serialize(w)` byte-for-byte. Enforced by
  `pnpm test:game-save-roundtrip`, which also asserts *field-order stability* — the serializer
  writes keys in a declared order, it does not rely on object literal order surviving a refactor.
- **Float discipline.** Positions are `f32` in the snapshot, `f64` in the sim. Nothing in the sim
  reads back from the snapshot.

---

## 3. The world model

One serializable object. No class instances, no `Map` in the persisted shape, no functions.

```ts
interface WorldState {
  readonly version: number;          // SAVE_VERSION, migrated forward on load
  readonly seed: number;             // drives every RNG stream
  tick: number;                      // authoritative clock
  meta: { name: string; createdAtTick: number; scenarioId: string | null };
  terrain: TerrainState;             // heightfield, paint layers, water table
  entities: EntityTable;             // dense ids + per-component records
  economy: EconomyState;
  research: ResearchState;
  weather: WeatherState;
  stats: StatsState;                 // rolling aggregates the HUD reads
}
```

**ECS-lite, not an ECS.** There is no archetype engine, no system scheduler magic and no query
compiler — those buy throughput this game does not need and cost readability it does. What there
is:

- `EntityId` is a branded `number`, allocated from a free list so a deleted id is reused only after
  a generation bump (`id = index | generation << 20`), which is what makes "leaked entity" a
  detectable condition instead of a vibe.
- Components are plain records in per-component tables: `world.entities.transform[id]`,
  `world.entities.guest[id]`. Missing key = component absent.
- A "system" is a plain function `(world, ctx) => void` registered in a fixed, declared order.
  The order is data (`SIM_SYSTEM_ORDER`), so it is diffable and deterministic.

**Guests are the exception and get a struct-of-arrays store.** 2000+ of them, updated every tick,
copied to the snapshot every tick: `Float32Array` for position/heading/velocity, `Uint8Array` for
state/needs, `Uint32Array` for target ids. This is the one place where the readable shape loses to
the measured one, and the reason is in the budget: 2000 guests × an object per tick is a garbage
collector running during a coaster launch.

---

## 4. Module contract

Every subsystem is a folder under `app/game/_game/` and exports exactly one module descriptor.

```ts
export interface GameModule<TApi> {
  readonly id: ModuleId;
  readonly dependsOn?: readonly ModuleId[];
  /** Built once, after its dependencies. Must not throw for a recoverable reason. */
  setup(ctx: ModuleContext): TApi | Promise<TApi>;
  /** Per-frame, main thread, already interpolated. Optional. */
  render?(frame: RenderFrame): void;
  /** Everything this module allocated. Must be idempotent. */
  dispose?(): void;
}
```

`ModuleContext` is the *only* way a module reaches the outside:

```ts
interface ModuleContext {
  readonly scene: Scene;             // Babylon
  readonly engine: AbstractEngine;
  readonly quality: QualityPreset;   // ultra | high | medium | low | potato
  readonly caps: GpuCapabilities;    // webgpu, float-linear, compute, msaa samples, maxTexSize
  readonly bus: EventBus;            // typed, module-tagged
  readonly world: WorldView;         // READ-ONLY view of the latest snapshot
  readonly send: (cmd: Command) => void;   // the only mutation path
  readonly registry: ContentRegistry;
  readonly assets: AssetService;     // cached glTF/KTX2/HDR loads, with procedural fallback
  readonly rng: RngStream;           // module-scoped, presentation only — never sim state
  readonly log: Logger;              // tagged, ring-buffered for the harness
  readonly module: <T>(id: ModuleId) => T;  // typed access to a dependency's API
}
```

Four rules, each of which has a grep behind it:

1. **A module writes only its own folder.** Cross-module reads go through `ctx.module(id)`,
   which returns the dependency's declared API — or its **stub** if that dependency failed.
2. **A module never imports another module's internals.** `import … from '../guests/internal/x'`
   fails `pnpm test:game-module-boundaries`.
3. **A module never mutates `world`.** It is typed `DeepReadonly`. Mutation is `ctx.send(cmd)`.
4. **A module never touches `window`/`document`/`navigator` at module scope.**

### Failure isolation

`mountModule()` wraps `setup()`:

```
setup() throws  →  log.error, bus.emit('module:failed', {id, error})
                →  register a STUB api (every declared method a typed no-op)
                →  the rest of the game boots
```

A stub is not silent: the HUD shows a persistent, dismissible "Modul *scenery* konnte nicht
geladen werden" notice, and `world:ready` still fires so the harness can screenshot the
degraded state instead of timing out. **The canvas itself is inside a React error boundary**
(`app/game/error.tsx` plus a local boundary around the stage), so even a Babylon-level throw
lands on a readable page with a "reload" action and the log ring buffer attached.

The rule this encodes: **a broken module degrades to a stub, never takes the page down.**

---

## 5. Module map

### Wave 1 — foundation

| Module | Owns | Emits | Depends on |
| --- | --- | --- | --- |
| `core` | engine bootstrap, world model, event bus, RNG, scheduler, worker protocol, save/load, registry, module host | `world:ready`, `tick`, `snapshot`, `module:failed` | — |
| `terrain` | heightfield mesh + LOD, sculpt/paint ops, cliffs, water table surface | `terrain:changed` | core |
| `environment` | IBL/HDRI, procedural sky, sun+moon cycle, weather visuals, seasons, fog, night rig | `env:timeOfDay`, `env:weather` | core |
| `ui` | HUD shell, panel framework, build bar, radial menu, tooltips, notifications, all DOM | `ui:tool`, `ui:panel` | core |
| `audio` | Babylon 9 audio engine, buses (ride/ambience/music/ui), spatial emitters, autoplay gate | `audio:unlocked` | core |
| `effects` | GPU particles: spray, splash, fireworks, sparks, steam; night light rigs | — | core, environment |

### Wave 2 — construction

| Module | Owns | Depends on |
| --- | --- | --- |
| `paths` | spline paths, plazas, queue paths, the **path graph** guests navigate | core, terrain |
| `pools` | pool tool, depth zones, tiles/edges, refraction + foam + caustics water shader | core, terrain, environment |
| `track` | **the spline core** — piece-by-piece + freeform, banking, smoothing, station/lift/brake/launch, auto supports, validation | core, terrain |
| `buildings` | modular walls/roofs/windows kit-bash, blueprints | core, terrain |
| `scenery` | props, themed sets, path furniture, foliage scatter (thin instances) | core, terrain, paths |
| `shops` | food, drink, toilets, changing rooms, first aid, ATM, souvenirs | core, paths |

### Wave 3 — simulation

| Module | Owns | Depends on |
| --- | --- | --- |
| `rides` | flat-ride rigs from manifests: curves, cycles, capacity, ratings | core, track |
| `flumes` | body/tube/raft/mat slides on the track spline core, splash pools, run-out | core, track, pools |
| `trains` | energy-integrated physics on arclength splines, block sections, G-forces → excitement/fear/nausea, crash detection | core, track |
| `guests` | needs, thoughts, wallet, preferences, hierarchical navigation, queueing, riding, swimming, littering, leaving; instanced crowd + animation LOD | core, paths, shops, rides |
| `staff` | janitor, mechanic, entertainer, vendor, lifeguard; coverage cones, work zones | core, paths, guests |
| `management` | finance, pricing, loans, marketing, research, breakdowns, power, water filtration, wages | core, guests, rides |
| `overlays` | heatmaps: happiness, litter, traffic, power, water quality, coverage | core, terrain, guests |

### Wave 4 — interaction

| Module | Owns | Depends on |
| --- | --- | --- |
| `tools` | one build interaction model: hover preview, ghost, validity colour, undo/redo command stack, copy/blueprint, multi-select, terrain brushes | core, ui, + every builder |
| `camera` | RTS orbit/pan/zoom, first-person walk, ride-cam, photo mode with DOF | core |
| `scenarios` | sandbox + three objective scenarios, win/lose evaluation | core, management |
| `persistence` | IndexedDB saves, JSON export/import, blueprint sharing (flagged) | core |

### Wave 5

`demo-park` — "park.fan Resort" as **content**, not code: a pack of blueprints + a scenario
manifest, so it proves the registry rather than bypassing it.

---

## 6. Command / event protocol

```ts
type Command =
  | { k: 'terrain.sculpt'; brush: BrushId; at: Vec2; radius: number; strength: number }
  | { k: 'path.place'; nodes: Vec3[]; width: number; styleId: string }
  | { k: 'track.commit'; rideId: EntityId; segments: TrackSegment[] }
  | { k: 'ride.build'; defId: string; at: Vec3; rotY: number }
  | { k: 'ride.setPrice'; id: EntityId; cents: number }
  | { k: 'staff.hire'; role: StaffRole; at: Vec3 }
  | { k: 'sim.setSpeed'; speed: 0 | 1 | 2 | 4 | 8 }
  | …
```

Commands are **data**: JSON-serializable, replayable, and the undo stack is a pair of
(`do`, `undo`) commands rather than a snapshot diff. That is what makes undo cheap and a replay
test possible.

Events are the other direction and are **presentation-facing only** — nothing in the sim reacts to
an event, because event ordering across a worker boundary is not something determinism can rest on.

---

## 7. Rendering

- **WebGPU first.** `WebGPUEngine.IsSupportedAsync` → `WebGPUEngine`; otherwise `Engine` (WebGL2).
  Every feature check goes through `caps`, and a missing capability **lowers quality, never throws**.
- **PBR everywhere.** `PBRMaterial` with an IBL environment from a `.env` (prefiltered HDR).
  Nothing ships with `roughness: 1, albedo: grey`.
- **One `DefaultRenderingPipeline`**: ACES tonemapping, exposure driven by time of day, bloom on
  emissives at night, FXAA (or MSAA 4× where the GPU allows), sharpen at ultra. SSAO2 above medium.
- **Shadows**: one cascaded shadow generator for the sun (4 cascades, 2048 above medium, 1024 below),
  PCF soft. Night rigs use baked light cookies + emissive materials, not 40 real lights.
- **Instancing is the default, not an optimization.** Every prop, every fence post, every guest is a
  thin instance. `freezeWorldMatrix()` on anything static; `scene.freezeActiveMeshes()` after a build
  settles, invalidated on any `*:changed` event.
- **Picking is GPU/octree.** `scene.createOrUpdateSelectionOctree()` for the world; hover uses a
  GPU picking pass into a small render target. Never a per-mesh `ray.intersectsMesh` loop.

### Quality presets

| Preset | Shadows | SSAO | Water | Guests drawn | Particles |
| --- | --- | --- | --- | --- | --- |
| ultra | 4×2048 CSM | on | refraction + caustics + foam | 4000 | full |
| high | 4×2048 | on | refraction + foam | 3000 | full |
| medium | 3×1024 | off | reflection probe only | 2000 | reduced |
| low | 2×1024 | off | flat animated normal map | 900 | minimal |
| potato | none | off | flat | 350 | off |

Preset is auto-picked from `caps` + a 2 s boot benchmark, overridable in settings, and **stated
honestly** — a phone gets `low` and a one-line notice, not a white screen.

---

## 8. Performance budget and where it is spent

| Budget | Target | Owner |
| --- | --- | --- |
| Frame | ≥ 50 fps @ 1080p, 2000 guests, 3 coasters, 2 pools | camera + guests + effects |
| Draw calls | ≤ 1200 | scenery, buildings (thin instances + material atlasing) |
| Sim tick | ≤ 6 ms | guests (SoA), trains, management |
| Cold route → interactive | ≤ 8 s | core (chunk split), assets (KTX2 + Draco) |
| Shared chunk growth | 0 B | core (dynamic import discipline) |

Measured, never asserted: `pnpm verify:game` writes the real numbers into `docs/game/STATUS.json`.

---

## 9. Boot sequence

1. `page.tsx` (server) renders metadata + a shell that already reserves the canvas box.
2. `game-client.tsx` mounts, `next/dynamic` fetches `boot/stage`.
3. `stage` probes `caps`, picks a preset, creates the engine, shows a real progress line.
4. The worker starts and loads/creates the world from the seed; `core` mounts modules in dependency
   waves, each inside `mountModule`.
5. Assets stream; anything missing falls back to procedural geometry **and logs it**.
6. First snapshot arrives, the camera frames the park, `bus.emit('world:ready')` →
   `window.__PARKFAN_GAME__.ready = true` for the harness.

Teardown is the reverse and is **complete**: `engine.dispose()`, worker `terminate()`, every
observer removed, every `requestAnimationFrame` cancelled, IndexedDB handles closed. A route
change must leave zero WebGL/WebGPU contexts alive — `pnpm verify:game --navigation` asserts it by
navigating away and back three times and reading `engine.getRenderingCanvas()` leaks.
