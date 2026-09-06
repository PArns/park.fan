/**
 * The camera module's main handle: it drives the scene's existing `ArcRotateCamera` and creates
 * nothing.
 *
 * **Why it drives that camera instead of making its own.** `core/renderer.ts` builds the
 * `DefaultRenderingPipeline` — ACES tone mapping, FXAA, bloom, the vignette — and the SSAO2
 * pipeline **bound to that camera object** (`new DefaultRenderingPipeline('default', true, scene,
 * [camera])`). A camera module that made a fresh camera and set `scene.activeCamera` would render
 * a park with no tone mapping and no anti-aliasing, and the frame would look like a lighting
 * regression rather than like a camera bug. Five other modules would break with it: `terrain`,
 * `environment`, `paths`, `scenery` and `shops` all stage their showcases by writing
 * `scene.activeCamera as ArcRotateCamera` directly (`camera.alpha = …; camera.target.set(…)`),
 * and against a `FreeCamera` those writes are four properties nobody reads.
 *
 * That second point is also why this module **adopts** a pose written from outside instead of
 * fighting it: every frame it compares the camera against what it last wrote, and if somebody
 * else moved it — a showcase, a debugger, another module — that becomes the new goal. Last write
 * wins, whoever wrote it.
 *
 * **What it costs.** Zero meshes, zero materials, zero textures, zero lights, zero draw calls.
 * `stats()` reports the census rather than asserting it, and there is no `new Mesh`,
 * `new PBRMaterial` or `new Texture` anywhere in `lib/game/camera/`.
 */

import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import type { Scene } from '@babylonjs/core/scene';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine';
import type { Entity, MainContext, MainHandle, Vec3 } from '../core/types';
import { AnchorTable, type AnchorContext } from './anchors';
import {
  attachCameraPresets,
  cameraPreset,
  cameraPresets,
  poseFromPreset,
  registerCameraPreset,
} from './manifest';
import { createCameraController, eyeAboveGround, type CameraController } from './controller';
import { attachCameraInput, DEFAULT_INPUT, type CameraInput, type InputConfig } from './input';
import {
  DEFAULT_BOUNDS,
  alphaToBearing,
  bearingToAlpha,
  betaToPitch,
  clamp,
  distanceForRadius,
  horizonRow,
  pitchToBeta,
} from './pose';
import { createViewStore, nullViewStore, type ViewStore } from './view-state';
import type {
  AnchorSample,
  CameraBounds,
  CameraMode,
  CameraPose,
  CameraPresetDef,
  CameraStats,
  FocusOptions,
  FollowOptions,
  FollowSample,
  FollowSource,
} from './types';

export type FocusTarget = string | { x: number; z: number; y?: number; radius?: number };

export interface CameraMainApi {
  /**
   * Apply a preset. Returns false for a name nobody registered, which is how
   * `harness.setCamera()` knows to fall back to `core/host.ts`.
   *
   * It **snaps** rather than easing, and that is not laziness: the host caps `onRender`'s `dt` at
   * 0.1 s and this container renders at ~1.3 fps, so the harness's 1200 ms settle window is two
   * or three frames — 0.2–0.3 s of eased motion. A preset that eased would be photographed
   * halfway there, differently on every machine. `focus()` is the eased one.
   */
  preset(name: string, opts?: { instant?: boolean }): boolean;
  presets(): readonly CameraPresetDef[];
  /** Add or replace a preset at runtime, same schema as a pack's `cameraPresets` entry. */
  registerPreset(entry: unknown): CameraPresetDef;
  /** Resolve an anchor chain (`kinds:shop | park:centre`) against the world as it is now. */
  anchor(chain: string): AnchorSample | null;
  registerAnchor(prefix: string, resolve: (arg: string) => AnchorSample | null): () => void;
  /** Ease to something and pick a distance from how big it is. */
  focus(target: FocusTarget, opts?: FocusOptions): boolean;
  /** Track a moving thing. `null` releases. */
  follow(id: string | null, opts?: FollowOptions): boolean;
  following(): string | null;
  mode(): CameraMode;
  /** Teach the camera about a class of moving ids; the newest source is asked first. */
  registerFollowSource(source: FollowSource): () => void;
  pose(): CameraPose;
  setPose(pose: Partial<CameraPose>, opts?: { instant?: boolean }): void;
  /** Where a screen pixel meets the ground. The build tools will want this. */
  screenToGround(clientX: number, clientY: number): Vec3 | null;
  bounds(): CameraBounds;
  setBounds(patch: Partial<CameraBounds>): void;
  controls(): InputConfig;
  setControls(patch: Partial<InputConfig>): void;
  /** Drop the remembered view for this world. */
  forget(): void;
  stats(): CameraStats;
}

interface TerrainLike {
  height(x: number, z: number): number;
  waterLevel(): number;
  raycast(
    origin: [number, number, number],
    direction: [number, number, number],
    maxDistance?: number
  ): [number, number, number] | null;
}

interface PathsLike {
  entrance(): { x: number; z: number };
}

interface DemoParkLike {
  plots(): Array<{ id: string; x: number; z: number; sizeX: number; sizeZ: number }>;
}

interface TrackLike {
  ids(): string[];
  spline(id: string): { length(): number } | undefined;
  frameAt(
    id: string,
    s: number
  ): { p: [number, number, number]; tangent: [number, number, number] } | undefined;
}

/** How long the settled pose has to sit still before it is worth a storage write, in seconds. */
const SAVE_AFTER = 1.5;
/** Metres per second the `track:` ride-along walks the spline at, until `trains` owns this. */
const RIDE_ALONG_SPEED = 14;

export function createCameraMain(ctx: MainContext): MainHandle {
  // Claim `cameraPresets` and read it off every pack, at boot and afterwards. `onPack` fires on
  // registration and the bundled packs are registered before any module's `main()` runs, so the
  // walk over `registry.packs()` is the half that catches the packs the game ships with.
  const detachPresets = attachCameraPresets(ctx.registry);

  const scene = ctx.scene as Scene;
  const engine = ctx.engine as AbstractEngine;
  const camera = scene.activeCamera as ArcRotateCamera | null;

  if (!camera || camera.getClassName() !== 'ArcRotateCamera') {
    // Refuse rather than half-work: with no arc-rotate camera to drive, `preset()` returning false
    // hands the harness back to `applyFallbackCameraPreset`, which is a working camera.
    console.warn(
      '[game/camera] no ArcRotateCamera on the scene; the fallback presets stay in charge'
    );
    detachPresets();
    return { api: { preset: () => false } as Partial<CameraMainApi>, dispose() {} };
  }

  const terrain = ctx.module<TerrainLike>('terrain');
  const ground = (x: number, z: number) => terrain?.height(x, z) ?? 0;
  const anchors = new AnchorTable();
  const anchorCtx: AnchorContext = {
    ground,
    entities: () => Object.values(ctx.world.entities) as Entity[],
    half: ctx.world.terrain.size / 2,
    waterLevel: () => terrain?.waterLevel() ?? ctx.world.terrain.waterLevel,
    entrance: () => ctx.module<PathsLike>('paths')?.entrance() ?? null,
    plots: () => ctx.module<DemoParkLike>('demo-park')?.plots() ?? [],
  };

  const fov = () => camera.fov;
  const aspect = () => engine.getAspectRatio(camera);

  const controller: CameraController = createCameraController(
    {
      ground,
      raycast: (origin, direction, maxDistance) =>
        terrain?.raycast(origin, direction, maxDistance) ?? null,
      fov,
      aspect,
    },
    {
      target: [camera.target.x, camera.target.y, camera.target.z],
      alpha: camera.alpha,
      beta: camera.beta,
      radius: camera.radius,
    }
  );

  /**
   * Babylon clamps `alpha`/`beta`/`radius` in `_checkLimits()` on every `update()`, whether or not
   * its inputs are attached. So the renderer's limits have to be opened past this module's own or
   * they, not `clampPose`, would decide where the camera may go — and the leash arithmetic in
   * `pose.ts` would be describing a camera that does not exist.
   */
  const restore = {
    lowerBeta: camera.lowerBetaLimit,
    upperBeta: camera.upperBetaLimit,
    lowerRadius: camera.lowerRadiusLimit,
    upperRadius: camera.upperRadiusLimit,
    inertia: camera.inertia,
    panningInertia: camera.panningInertia,
  };
  camera.detachControl();
  camera.lowerBetaLimit = 0.01;
  camera.upperBetaLimit = Math.PI / 2;
  camera.lowerRadiusLimit = 1;
  camera.upperRadiusLimit = 4000;
  camera.inertia = 0;
  camera.panningInertia = 0;
  camera.inertialAlphaOffset = 0;
  camera.inertialBetaOffset = 0;
  camera.inertialRadiusOffset = 0;

  const canvas = engine.getRenderingCanvas();
  const input: CameraInput | null = canvas
    ? attachCameraInput(canvas as unknown as HTMLElement, controller)
    : null;

  // ── view state ────────────────────────────────────────────────────────────────────────────
  // Skipped whenever a screenshot depends on the pose: see `view-state.ts` for why this guard is
  // the load-bearing half of the feature.
  const deterministic =
    ctx.query.get('harness') === '1' || !!ctx.query.get('showcase') || !!ctx.query.get('cam');
  let store: ViewStore = nullViewStore();
  if (!deterministic) {
    let storage: Storage | null = null;
    try {
      storage = canvas?.ownerDocument?.defaultView?.localStorage ?? null;
    } catch {
      // Reading `localStorage` THROWS, rather than returning null, in a browser with site data
      // blocked. Same reason every access inside `view-state.ts` is wrapped.
      storage = null;
    }
    store = createViewStore(`${ctx.world.meta.name}:${ctx.world.meta.seed}`, storage);
  }

  // ── follow ────────────────────────────────────────────────────────────────────────────────
  const followSources: FollowSource[] = [];
  let followId: string | null = null;
  let followOpts: FollowOptions = {};
  let rideS = 0;

  /** World entities. Static, but it is what `follow('shop-1599')` should mean. */
  followSources.push((id) => {
    const e = ctx.world.entities[id];
    return e ? { position: [e.position[0], e.position[1], e.position[2]] } : null;
  });

  /**
   * `track:<id>` — a ride-along that exists today.
   *
   * The `trains` module is a scaffold (`lib/game/trains/index.ts` owns nothing yet), so there is
   * no moving car in the world for `follow()` to sit behind, and a follow mode that cannot be
   * screenshotted is a follow mode nobody has checked. This walks the `track` module's own
   * arclength spline at a fixed speed instead — a stand-in, and labelled as one. When `trains`
   * lands it registers a source of its own; sources are consulted newest-first, so its
   * `train:<ride>:<n>` ids shadow this without either module knowing about the other.
   */
  followSources.push((id) => {
    if (!id.startsWith('track:')) return null;
    const track = ctx.module<TrackLike>('track');
    if (!track) return null;
    const trackId = id.slice(6);
    const spline = track.spline(trackId);
    if (!spline) return null;
    const length = spline.length();
    const frame = track.frameAt(trackId, ((rideS % length) + length) % length);
    if (!frame) return null;
    return {
      position: [frame.p[0], frame.p[1], frame.p[2]],
      heading: Math.atan2(frame.tangent[2], frame.tangent[0]),
    };
  });

  const sampleFollow = (id: string): FollowSample | null => {
    for (let i = followSources.length - 1; i >= 0; i--) {
      const hit = followSources[i](id);
      if (hit) return hit;
    }
    return null;
  };

  // ── writing the pose ──────────────────────────────────────────────────────────────────────
  let written: CameraPose = {
    target: [camera.target.x, camera.target.y, camera.target.z],
    alpha: camera.alpha,
    beta: camera.beta,
    radius: camera.radius,
  };

  const writePose = (pose: CameraPose) => {
    camera.alpha = pose.alpha;
    camera.beta = pose.beta;
    camera.radius = pose.radius;
    camera.target.set(pose.target[0], pose.target[1], pose.target[2]);
    written = {
      target: [...pose.target] as Vec3,
      alpha: pose.alpha,
      beta: pose.beta,
      radius: pose.radius,
    };
  };

  /** Did somebody else move the camera since the last frame? */
  const externalWrite = (): CameraPose | null => {
    const moved =
      Math.abs(camera.alpha - written.alpha) > 1e-4 ||
      Math.abs(camera.beta - written.beta) > 1e-4 ||
      Math.abs(camera.radius - written.radius) > 1e-3 ||
      Math.abs(camera.target.x - written.target[0]) > 1e-3 ||
      Math.abs(camera.target.y - written.target[1]) > 1e-3 ||
      Math.abs(camera.target.z - written.target[2]) > 1e-3;
    return moved
      ? {
          target: [camera.target.x, camera.target.y, camera.target.z],
          alpha: camera.alpha,
          beta: camera.beta,
          radius: camera.radius,
        }
      : null;
  };

  const setMode = (next: CameraMode, id: string | null) => {
    if (mode === next && followId === id) return;
    mode = next;
    followId = id;
    ctx.events.emit('camera:mode', { mode: next, target: id });
  };

  let mode: CameraMode = 'free';
  let sinceSave = 0;
  let dirty = false;

  // Restore a remembered view, or take the pose the renderer started with.
  const remembered = store.read();
  if (remembered) controller.setGoal(remembered, true);
  writePose(controller.pose());

  const api: CameraMainApi = {
    preset(name, opts) {
      const def = cameraPreset(name);
      if (!def) return false;
      const anchor = def.anchor ? anchors.resolve(def.anchor, anchorCtx) : null;
      const pose = poseFromPreset(def, anchor, fov(), ground);
      if (!pose) return false;
      setMode('free', null);
      controller.setGoal(pose, opts?.instant !== false);
      writePose(controller.pose());
      dirty = true;
      return true;
    },
    presets: () => cameraPresets(),
    registerPreset: (entry) => registerCameraPreset(entry),
    anchor: (chain) => anchors.resolve(chain, anchorCtx),
    registerAnchor: (prefix, resolve) => anchors.register(prefix, resolve),
    focus(target, opts) {
      const hit: AnchorSample | null =
        typeof target === 'string'
          ? anchors.resolve(target, anchorCtx)
          : {
              x: target.x,
              z: target.z,
              y: target.y ?? ground(target.x, target.z),
              radius: target.radius ?? 20,
              from: 'point',
            };
      if (!hit) return false;
      const current = controller.goal();
      const radius = opts?.radius ?? hit.radius;
      const pitch = opts?.pitch ?? clamp(betaToPitch(current.beta), 8, 60);
      const pose: CameraPose = {
        target: [hit.x, hit.y + Math.min(6, radius * 0.25), hit.z],
        alpha: opts?.bearing === undefined ? current.alpha : bearingToAlpha(opts.bearing),
        beta: pitchToBeta(pitch),
        radius: clamp(
          distanceForRadius(radius, fov(), 0.75),
          DEFAULT_BOUNDS.minRadius,
          DEFAULT_BOUNDS.maxRadius
        ),
      };
      setMode('free', null);
      controller.setGoal(pose, opts?.instant === true);
      dirty = true;
      return true;
    },
    follow(id, opts) {
      if (!id) {
        setMode('free', null);
        return true;
      }
      if (!sampleFollow(id)) return false;
      followOpts = opts ?? {};
      rideS = 0;
      setMode('follow', id);
      return true;
    },
    following: () => followId,
    mode: () => mode,
    registerFollowSource(source) {
      followSources.push(source);
      return () => {
        const at = followSources.indexOf(source);
        if (at >= 0) followSources.splice(at, 1);
      };
    },
    pose: () => controller.pose(),
    setPose(pose, opts) {
      const now = controller.goal();
      controller.setGoal(
        {
          target: (pose.target ?? now.target) as Vec3,
          alpha: pose.alpha ?? now.alpha,
          beta: pose.beta ?? now.beta,
          radius: pose.radius ?? now.radius,
        },
        opts?.instant !== false
      );
      writePose(controller.pose());
      dirty = true;
    },
    screenToGround(clientX, clientY) {
      if (!input) return null;
      return controller.pickGround(input.toNdc(clientX, clientY));
    },
    bounds: () => controller.bounds(),
    setBounds: (patch) => controller.setBounds(patch),
    controls: () => input?.config() ?? DEFAULT_INPUT,
    setControls: (patch) => input?.setConfig(patch),
    forget: () => store.clear(),
    stats(): CameraStats {
      const pose = controller.pose();
      const pitch = betaToPitch(pose.beta);
      return {
        mode,
        pose,
        eyeAboveGround: Math.round(eyeAboveGround(pose, ground) * 100) / 100,
        pitchDeg: Math.round(pitch * 100) / 100,
        horizonRow: Math.round(horizonRow(pitch, fov()) * 10) / 10,
        bearingDeg: Math.round(alphaToBearing(pose.alpha) * 10) / 10,
        presets: cameraPresets().length,
        anchors: anchors.size(),
        meshes: scene.meshes.filter((m) => m.name.startsWith('camera-')).length,
        materials: scene.materials.filter((m) => m.name.startsWith('camera-')).length,
        clamped: controller.clamped(),
        following: followId,
      };
    },
  };

  // The opening framing, when there is nothing remembered to restore.
  //
  // Without it the module simply adopts whatever `core/renderer.ts` left the camera at, which is
  // 93.7 m up at 33.75 degrees down — `horizonRow` −138, i.e. the horizon is off the top of the
  // frame and a park that opens with no sky in it. That is the same failure this module publishes
  // the arithmetic for in `pose.ts`, measured on the running game rather than argued from source.
  // Everything that has an opinion about the camera still wins: a showcase writes it directly at
  // boot step 6, `?cam=` is applied after the handle is returned, and a remembered view is
  // restored above instead. `dirty` is put back because the player has not moved anything yet and
  // a default framing is not a view worth persisting.
  if (!remembered) {
    api.preset('overview');
    dirty = false;
  }

  return {
    api,
    onRender(dt) {
      const outside = externalWrite();
      if (outside) {
        // A showcase, a debugger or another module moved the camera. Take it as the new goal
        // rather than snapping it back on the next frame.
        controller.adopt(outside);
        setMode('free', null);
      }

      input?.pump();

      if (mode === 'follow' && followId) {
        rideS += (followOpts.speed ?? RIDE_ALONG_SPEED) * dt;
        const sample = sampleFollow(followId);
        if (sample) {
          const goal = controller.goal();
          const height = followOpts.height ?? 2.5;
          const alpha =
            followOpts.behind && sample.heading !== undefined
              ? sample.heading + Math.PI
              : goal.alpha;
          controller.setGoal(
            {
              target: [sample.position[0], sample.position[1] + height, sample.position[2]],
              alpha,
              beta: pitchToBeta(followOpts.pitch ?? 12),
              radius: followOpts.distance ?? 26,
            },
            false
          );
        } else {
          setMode('free', null);
        }
      }

      controller.update(dt);
      writePose(controller.pose());

      if (!deterministic) {
        if (controller.moving()) {
          dirty = true;
          sinceSave = 0;
        } else if (dirty) {
          sinceSave += dt;
          if (sinceSave > SAVE_AFTER) {
            store.write(controller.goal());
            dirty = false;
            sinceSave = 0;
          }
        }
      }
    },
    dispose() {
      if (dirty) store.write(controller.goal());
      input?.detach();
      detachPresets();
      camera.lowerBetaLimit = restore.lowerBeta;
      camera.upperBetaLimit = restore.upperBeta;
      camera.lowerRadiusLimit = restore.lowerRadius;
      camera.upperRadiusLimit = restore.upperRadius;
      camera.inertia = restore.inertia;
      camera.panningInertia = restore.panningInertia;
    },
  };
}
