/**
 * Engine and scene creation: WebGPU first, WebGL2 fallback, quality presets, the sun, cascaded
 * shadows, the default pipeline (ACES, FXAA, bloom) and SSAO. Everything a module draws hangs off
 * `RenderContext.scene`; the sun and the sky colours are driven by `applyEnvironment` every frame
 * so a missing `environment` module still yields a lit park.
 *
 * Deep imports only — `@babylonjs/core`'s barrel is 956 KB gzipped against 271 KB for what the
 * game touches (measured with esbuild, 2026-09-05). `scripts/test-game-lint.mjs` enforces it.
 */

import { Scene } from '@babylonjs/core/scene';
import { Engine } from '@babylonjs/core/Engines/engine';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { CascadedShadowGenerator } from '@babylonjs/core/Lights/Shadows/cascadedShadowGenerator';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import { ImageProcessingConfiguration } from '@babylonjs/core/Materials/imageProcessingConfiguration';
import { SceneInstrumentation } from '@babylonjs/core/Instrumentation/sceneInstrumentation';
import '@babylonjs/core/Rendering/depthRendererSceneComponent';
import '@babylonjs/core/Rendering/prePassRendererSceneComponent';
import '@babylonjs/core/Rendering/geometryBufferRendererSceneComponent';
import '@babylonjs/core/Culling/Octrees/octreeSceneComponent';
import '@babylonjs/core/Animations/animatable';
import type { Capabilities, EnvironmentState, QualitySettings } from './types';

export interface RenderContext {
  kind: 'webgpu' | 'webgl2';
  engine: AbstractEngine;
  scene: Scene;
  camera: ArcRotateCamera;
  sun: DirectionalLight;
  hemi: HemisphericLight;
  shadow: CascadedShadowGenerator | null;
  pipeline: DefaultRenderingPipeline | null;
  instrumentation: SceneInstrumentation;
  quality: QualitySettings;
  applyEnvironment(env: EnvironmentState): void;
  metrics(): {
    fps: number;
    frameMs: number;
    drawCalls: number;
    triangles: number;
    activeMeshes: number;
  };
  resize(): void;
  dispose(): void;
}

export async function createRenderContext(
  canvas: HTMLCanvasElement,
  caps: Capabilities,
  quality: QualitySettings
): Promise<RenderContext> {
  let engine: AbstractEngine;
  let kind: RenderContext['kind'];
  if (caps.webgpu) {
    const { WebGPUEngine } = await import('@babylonjs/core/Engines/webgpuEngine');
    const gpu = new WebGPUEngine(canvas, {
      antialias: true,
      adaptToDeviceRatio: false,
      powerPreference: 'high-performance',
      enableAllFeatures: false,
      setMaximumLimits: true,
    });
    await gpu.initAsync();
    engine = gpu;
    kind = 'webgpu';
  } else {
    engine = new Engine(
      canvas,
      true,
      {
        preserveDrawingBuffer: true,
        stencil: true,
        powerPreference: 'high-performance',
        doNotHandleContextLost: false,
        adaptToDeviceRatio: false,
      },
      false
    );
    kind = 'webgl2';
  }
  engine.setHardwareScalingLevel(quality.hardwareScaling / Math.min(caps.dpr, 2));

  const scene = new Scene(engine);
  scene.useRightHandedSystem = true;
  scene.clearColor = new Color4(0.02, 0.03, 0.06, 1);
  scene.ambientColor = new Color3(0.08, 0.09, 0.12);
  scene.skipPointerMovePicking = true;
  scene.autoClearDepthAndStencil = true;
  scene.blockMaterialDirtyMechanism = false;
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.0012;
  scene.fogColor = new Color3(0.6, 0.7, 0.85);

  const camera = new ArcRotateCamera(
    'camera',
    -Math.PI / 3,
    Math.PI / 3.2,
    180,
    new Vector3(0, 0, 0),
    scene
  );
  camera.minZ = 0.5;
  camera.maxZ = 2500;
  camera.lowerRadiusLimit = 6;
  camera.upperRadiusLimit = 900;
  camera.lowerBetaLimit = 0.08;
  camera.upperBetaLimit = Math.PI / 2 - 0.04;
  camera.wheelDeltaPercentage = 0.02;
  camera.panningSensibility = 40;
  camera.angularSensibilityX = 900;
  camera.angularSensibilityY = 900;
  camera.inertia = 0.82;
  camera.panningInertia = 0.82;
  camera.fov = 0.9;
  camera.attachControl(canvas, true);

  const sun = new DirectionalLight('sun', new Vector3(-0.4, -0.8, -0.3), scene);
  sun.intensity = 3;
  sun.shadowMinZ = 1;
  sun.shadowMaxZ = 900;
  const hemi = new HemisphericLight('sky', new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.5;
  hemi.groundColor = new Color3(0.2, 0.18, 0.15);

  let shadow: CascadedShadowGenerator | null = null;
  try {
    shadow = new CascadedShadowGenerator(quality.shadowMapSize, sun);
    shadow.numCascades = quality.shadowCascades;
    shadow.lambda = 0.85;
    shadow.shadowMaxZ = 600;
    shadow.autoCalcDepthBounds = false;
    shadow.stabilizeCascades = true;
    shadow.depthClamp = true;
    shadow.cascadeBlendPercentage = 0.1;
    shadow.bias = 0.004;
    shadow.normalBias = 0.02;
    if (quality.softShadows) {
      shadow.filter = ShadowGenerator.FILTER_PCF;
      shadow.filteringQuality = ShadowGenerator.QUALITY_HIGH;
    } else {
      shadow.filter = ShadowGenerator.FILTER_PCF;
      shadow.filteringQuality = ShadowGenerator.QUALITY_LOW;
    }
  } catch (error) {
    console.warn('[game] shadows unavailable', error);
  }

  let pipeline: DefaultRenderingPipeline | null = null;
  try {
    pipeline = new DefaultRenderingPipeline('default', true, scene, [camera]);
    pipeline.fxaaEnabled = quality.fxaa;
    pipeline.bloomEnabled = quality.bloom;
    pipeline.bloomThreshold = 0.9;
    pipeline.bloomWeight = 0.3;
    pipeline.bloomKernel = 48;
    pipeline.bloomScale = 0.5;
    pipeline.imageProcessingEnabled = true;
    pipeline.imageProcessing.toneMappingEnabled = true;
    pipeline.imageProcessing.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
    pipeline.imageProcessing.exposure = 1.0;
    pipeline.imageProcessing.contrast = 1.05;
    pipeline.imageProcessing.vignetteEnabled = true;
    pipeline.imageProcessing.vignetteWeight = 0.6;
    pipeline.imageProcessing.vignetteStretch = 0.3;
    pipeline.samples = kind === 'webgpu' ? 4 : 1;
  } catch (error) {
    console.warn('[game] post-processing unavailable', error);
  }

  if (quality.ssao) {
    try {
      const { SSAO2RenderingPipeline } =
        await import('@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline');
      const ssao = new SSAO2RenderingPipeline('ssao', scene, { ssaoRatio: 0.5, blurRatio: 0.5 }, [
        camera,
      ]);
      ssao.radius = 2.5;
      ssao.totalStrength = 1.1;
      ssao.samples = 12;
      ssao.maxZ = 250;
    } catch (error) {
      console.warn('[game] SSAO unavailable', error);
    }
  }

  const instrumentation = new SceneInstrumentation(scene);
  instrumentation.captureFrameTime = true;

  const resize = () => engine.resize();
  window.addEventListener('resize', resize);

  const ctx: RenderContext = {
    kind,
    engine,
    scene,
    camera,
    sun,
    hemi,
    shadow,
    pipeline,
    instrumentation,
    quality,
    applyEnvironment(env) {
      sun.direction.set(env.sunDirection[0], env.sunDirection[1], env.sunDirection[2]);
      sun.diffuse.set(env.sunColor[0], env.sunColor[1], env.sunColor[2]);
      sun.specular.copyFrom(sun.diffuse);
      sun.intensity = env.sunIntensity;
      sun.shadowEnabled = env.sunElevation > 0.03;
      hemi.diffuse.set(env.skyColor[0] * 1.3, env.skyColor[1] * 1.3, env.skyColor[2] * 1.3);
      hemi.intensity = env.ambientIntensity;
      scene.clearColor.set(env.skyColor[0], env.skyColor[1], env.skyColor[2], 1);
      scene.fogColor.set(
        env.skyColor[0] * 0.9 + 0.05,
        env.skyColor[1] * 0.9 + 0.05,
        env.skyColor[2] * 0.9 + 0.08
      );
      scene.fogDensity =
        0.0009 + 0.0025 * env.cloud * (env.weather === 'rain' || env.weather === 'storm' ? 1.4 : 1);
      if (pipeline) {
        pipeline.imageProcessing.exposure = 1.0 + 0.35 * env.night;
        pipeline.bloomWeight = 0.3 + 0.35 * env.night;
      }
    },
    metrics() {
      return {
        fps: engine.getFps(),
        frameMs: instrumentation.frameTimeCounter.lastSecAverage,
        drawCalls: instrumentation.drawCallsCounter.current,
        triangles: Math.round(scene.getActiveIndices() / 3),
        activeMeshes: scene.getActiveMeshes().length,
      };
    },
    resize,
    dispose() {
      window.removeEventListener('resize', resize);
      try {
        engine.stopRenderLoop();
        scene.dispose();
      } finally {
        engine.dispose();
      }
    },
  };
  return ctx;
}
