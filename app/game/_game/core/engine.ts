/**
 * Engine bootstrap and the render pipeline.
 *
 * **WebGPU first, WebGL2 second, and neither is allowed to hard-fail.** A missing capability
 * lowers the preset; a missing *context* shows the route's honest fallback page. The one thing
 * that must never happen is a white screen with a stack trace in a console nobody has open.
 *
 * WebGPU gets a belt-and-braces try/catch beyond `IsSupportedAsync`: initialisation can still fail
 * on a driver the browser advertises and the adapter then refuses, and Babylon's WebGPU path may
 * want a shader transpiler it fetches at runtime. Either way the answer is the same — log it, take
 * WebGL2, carry on. Nothing here throws for a recoverable reason.
 */

import { Engine } from '@babylonjs/core/Engines/engine.js';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine.js';
import { Scene } from '@babylonjs/core/scene.js';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { ImageProcessingConfiguration } from '@babylonjs/core/Materials/imageProcessingConfiguration.js';

import type { Logger } from './log';
import type { GpuCapabilities, QualityPreset } from './module';

export interface CreatedEngine {
  engine: AbstractEngine;
  /** What we actually got, which is not always what the probe promised. */
  backend: 'webgpu' | 'webgl2';
  /** Non-null when the WebGPU attempt failed and we fell back. Shown in the debug overlay. */
  webgpuError: string | null;
}

export async function createEngine(
  canvas: HTMLCanvasElement,
  caps: GpuCapabilities,
  log: Logger
): Promise<CreatedEngine> {
  const shared = {
    antialias: false, // the pipeline owns AA, so the context does not pay for it twice
    stencil: true,
    powerPreference: 'high-performance' as const,
    // A park that keeps rendering after the tab is hidden is a laptop fan for nothing; the
    // scheduler already drops the catch-up ticks, so pausing the render loop costs nothing else.
    doNotHandleContextLost: false,
    preserveDrawingBuffer: false,
  };

  if (caps.webgpu) {
    try {
      const { WebGPUEngine } = await import('@babylonjs/core/Engines/webgpuEngine.js');
      const engine = new WebGPUEngine(canvas, {
        ...shared,
        antialias: false,
        enableAllFeatures: false,
        setMaximumLimits: false,
      });
      await engine.initAsync();
      log.info('WebGPU engine ready', { renderer: caps.rendererName });
      return { engine, backend: 'webgpu', webgpuError: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.warn('WebGPU init failed — falling back to WebGL2', message);
      const engine = new Engine(canvas, false, shared, false);
      return { engine, backend: 'webgl2', webgpuError: message };
    }
  }

  const engine = new Engine(canvas, false, shared, false);
  log.info('WebGL2 engine ready', { renderer: caps.rendererName });
  return { engine, backend: 'webgl2', webgpuError: null };
}

/**
 * The scene, with the defaults that keep it out of "programmer art" territory.
 *
 * The clear colour is a deep blue rather than black: at dusk and at night the sky mesh does not
 * cover the whole frustum on a steep camera, and black there reads as a hole in the world.
 */
export function createScene(engine: AbstractEngine, preset: QualityPreset): Scene {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.043, 0.078, 0.145, 1);
  scene.ambientColor = new Color3(0.08, 0.09, 0.12);

  // ACES + a real exposure, so a bright sky does not clip to white and a night scene does not
  // crush to black. This is the single biggest difference between "a render" and "a place".
  scene.imageProcessingConfiguration.toneMappingEnabled = true;
  scene.imageProcessingConfiguration.toneMappingType =
    ImageProcessingConfiguration.TONEMAPPING_ACES;
  scene.imageProcessingConfiguration.exposure = 1.0;
  scene.imageProcessingConfiguration.contrast = 1.05;

  // Picking is octree/GPU based (ARCHITECTURE §7) — the per-mesh pointer-move raycast Babylon does
  // by default is exactly the thing the budget forbids.
  scene.constantlyUpdateMeshUnderPointer = false;
  scene.skipPointerMovePicking = true;

  // Nothing in this game needs the collision system: guests walk a path graph, the camera is
  // constrained analytically. Leaving it on costs a broadphase pass per frame for no customer.
  scene.collisionsEnabled = false;

  scene.blockMaterialDirtyMechanism = false;
  scene.useRightHandedSystem = true; // metres, +Y up, right-handed — matches glTF, no axis fix-up

  if (preset.tier === 'potato' || preset.tier === 'low') {
    // Under `low` the frustum is the cheapest win available and the draw-distance cut is already
    // aggressive, so the octree is rebuilt rarely and kept coarse.
    scene.autoClearDepthAndStencil = false;
  }

  return scene;
}

export interface PipelineHandles {
  dispose(): void;
  /** Exposure follows the sun; the environment module drives this. */
  setExposure(value: number): void;
  setBloom(enabled: boolean, intensity: number): void;
  /** Photo mode. `focusM` in metres from the camera. */
  setDepthOfField(enabled: boolean, focusM: number, apertureF: number): void;
}

/**
 * One `DefaultRenderingPipeline`, configured from the preset.
 *
 * Imported dynamically for the same reason everything else here is: the pipeline pulls in a
 * dozen post-process shaders and a `potato` run never draws one of them.
 */
export async function createPipeline(
  scene: Scene,
  camera: import('@babylonjs/core/Cameras/camera.js').Camera,
  preset: QualityPreset,
  log: Logger
): Promise<PipelineHandles> {
  try {
    const { DefaultRenderingPipeline } = await import(
      '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline.js'
    );

    const pipeline = new DefaultRenderingPipeline('parkfan', true, scene, [camera]);

    pipeline.samples = preset.msaaSamples;
    pipeline.fxaaEnabled = preset.fxaa;

    pipeline.bloomEnabled = preset.bloom;
    if (preset.bloom) {
      // Tuned for emissive signage at night rather than for a general glow: a high threshold so
      // only the lit things bloom, a small weight so it does not become the lighting.
      pipeline.bloomThreshold = 0.85;
      pipeline.bloomWeight = 0.35;
      pipeline.bloomKernel = 48;
      pipeline.bloomScale = 0.5;
    }

    pipeline.sharpenEnabled = preset.tier === 'ultra';
    if (pipeline.sharpenEnabled) {
      pipeline.sharpen.edgeAmount = 0.18;
      pipeline.sharpen.colorAmount = 1;
    }

    pipeline.grainEnabled = false;
    pipeline.chromaticAberrationEnabled = false;
    pipeline.depthOfFieldEnabled = false;

    return {
      dispose: () => pipeline.dispose(),
      setExposure: (value) => {
        scene.imageProcessingConfiguration.exposure = value;
      },
      setBloom: (enabled, intensity) => {
        pipeline.bloomEnabled = enabled && preset.bloom;
        pipeline.bloomWeight = intensity;
      },
      setDepthOfField: (enabled, focusM, apertureF) => {
        pipeline.depthOfFieldEnabled = enabled;
        if (enabled) {
          pipeline.depthOfField.focusDistance = focusM * 1000; // Babylon wants millimetres
          pipeline.depthOfField.fStop = apertureF;
          pipeline.depthOfField.focalLength = 50;
        }
      },
    };
  } catch (error) {
    // A pipeline that will not build is a prettier park lost, not a game lost.
    log.error('rendering pipeline failed — running unposted', error);
    return {
      dispose: () => {},
      setExposure: (value) => {
        scene.imageProcessingConfiguration.exposure = value;
      },
      setBloom: () => {},
      setDepthOfField: () => {},
    };
  }
}

/** Where the camera starts, before the camera module takes over: framing the park's entrance. */
export const DEFAULT_CAMERA_TARGET = new Vector3(128, 0, 96);
export const DEFAULT_CAMERA_RADIUS = 140;
export const DEFAULT_CAMERA_BETA = Math.PI / 3.4;
