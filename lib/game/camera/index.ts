/**
 * Camera module: the park camera a person drives, the framing helpers other modules aim with, and
 * the preset catalogue the screenshot harness asks for by name.
 *
 * It owns no world state and no entity kind, and it has no `sim` half — a viewpoint is not part of
 * the simulation and does not belong in a save (`view-state.ts` argues that at length). Everything
 * reachable from this file is pure: `pose`, `controller`, `manifest` and `anchors` are
 * Babylon-free and DOM-free, so this index stays importable on the worker and `selftest.mjs` can
 * run the maths under node. Babylon is reached only through the dynamic import below.
 */

import type { GameModule } from '../core/types';

export const cameraModule: GameModule = {
  id: 'camera',
  deps: ['core', 'terrain'],
  main: async (ctx) => (await import('./main')).createCameraMain(ctx),
  showcase: async (ctx) => (await import('./showcase')).stageCameraShowcase(ctx),
};

export type {
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
export {
  DEFAULT_BOUNDS,
  alphaToBearing,
  bearingToAlpha,
  betaMaxFor,
  betaToPitch,
  clampPose,
  damp,
  dampAngle,
  distanceForRadius,
  eyeOf,
  forwardOf,
  horizonRow,
  pitchToBeta,
  planeHit,
  planForwardOf,
  poseFromEye,
  rightOf,
  rotateRigAbout,
  scaleRigAbout,
  screenRay,
  translateRig,
  wrapPi,
} from './pose';
export type { Ndc, Ray } from './pose';
export {
  CAMERA_PRESET_MANIFEST,
  attachCameraPresets,
  cameraPreset,
  cameraPresets,
  parseCameraPreset,
  poseFromPreset,
  registerCameraPreset,
  resetCameraPresets,
} from './manifest';
export { AnchorTable, builtinResolvers } from './anchors';
export type { AnchorContext } from './anchors';
export { createCameraController, eyeAboveGround } from './controller';
export type { CameraController, ControllerDeps, DragKind } from './controller';
// `CameraMainApi` is deliberately NOT re-exported here, for the reason `terrain/index.ts` and
// `track/index.ts` both give: this file is loaded on the worker, and a type re-export keeps a
// module reference to `main.ts` that a bundler is free to follow into Babylon. Import it from
// `@/lib/game/camera/main`.
