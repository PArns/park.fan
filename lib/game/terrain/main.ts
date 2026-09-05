/**
 * The terrain renderer. Owns the ground chunks, the splat material, the edge apron, the water
 * table and the sky probe that stands in for the missing IBL.
 *
 * Two things are worth knowing before changing anything here.
 *
 * The main thread has its **own copy** of `world.terrain`: `cloneWorld` runs before the worker is
 * started, so a `terrain:brush` command applied in the worker never reaches these heights, and the
 * `terrain:changed` event it forwards carries a rect and no data. So sculpting goes through
 * `api.brush()`, which applies the same pure `applyBrush` to the main-thread copy and dispatches
 * the command in the same call. A tool that dispatches `terrain:brush` itself will move the
 * simulation and leave the picture behind.
 *
 * And the renderer never rebuilds the whole park for an edit: `terrain:changed` carries the sample
 * rect and only the chunks it covers are rewritten. A null rect (a load, a water-level change)
 * rebuilds everything, which is the only path that costs the full ~90 ms.
 */

import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine';
import type { IShadowLight } from '@babylonjs/core/Lights/shadowLight';
import type { EnvironmentState, MainContext, MainHandle, TerrainData } from '../core/types';
import {
  applyBrush,
  raycast,
  sampleHeight,
  sampleNormal,
  samplePaint,
  sampleSlope,
  type BrushStroke,
} from './heightfield';
import { createTerrainTextures, type TerrainTextureSet } from './textures';
import { createGroundMaterial, type GroundMaterial } from './splat-material';
import { createTerrainMeshes, type TerrainMeshes } from './chunks';
import { createWaterSurface, type WaterSurface } from './water';
import { createEnvProbe, type EnvProbe } from './env-probe';
import { surroundRelief } from './landscape';

export interface TerrainStats {
  chunks: number;
  waterTriangles: number;
  textureResolution: number;
  textureMs: number;
  buildMs: number;
  splat: boolean;
}

export interface TerrainMainApi {
  height(x: number, z: number): number;
  normal(x: number, z: number): [number, number, number];
  paint(x: number, z: number): number;
  slope(x: number, z: number): number;
  waterLevel(): number;
  /** Where a ray meets the ground. Exact at the sample grid, independent of the drawn LOD. */
  raycast(
    origin: [number, number, number],
    direction: [number, number, number],
    maxDistance?: number
  ): [number, number, number] | null;
  /**
   * The full-park proxy mesh: invisible to the camera, pickable, and the sun's shadow caster.
   * Use it for `scene.pick` predicates; use `height`/`raycast` when you want the exact surface.
   */
  ground(): unknown;
  /** Every mesh the camera can draw, for shadow receivers and overlays. */
  meshes(): unknown[];
  /** Sculpt or paint. Applies to the render copy and dispatches the command in one call. */
  brush(stroke: BrushStroke): void;
  setWaterLevel(level: number): void;
  stats(): TerrainStats;
}

const TEXTURE_RESOLUTION = { low: 256, medium: 512, high: 512, ultra: 512 } as const;

export function createTerrainMain(ctx: MainContext): MainHandle {
  const scene = ctx.scene as Scene;
  const engine = ctx.engine as AbstractEngine;
  const terrain = ctx.world.terrain as TerrainData;
  const t0 = performance.now();

  // The splat blend is injected into the GLSL PBR shader. WebGPU's PBR is WGSL and binds samplers
  // through a different convention, so it takes the single-layer path instead of an untested
  // second copy of the shader (see splat-material.ts).
  const isWebGPU = (engine as { isWebGPU?: boolean }).isWebGPU === true;

  let textures: TerrainTextureSet;
  try {
    textures = createTerrainTextures(scene, ctx.rng.int(1, 1 << 28), TEXTURE_RESOLUTION[ctx.quality.preset]);
  } catch (error) {
    console.warn('[game/terrain] procedural textures unavailable', error);
    throw error;
  }

  const ground: GroundMaterial = createGroundMaterial(scene, terrain, textures, {
    splatEnabled: !isWebGPU,
  });
  if (ground.plugin) {
    ground.plugin.normalStrength = ctx.quality.preset === 'low' ? 0.7 : 1;
    ground.plugin.macroStrength = 1;
  }

  const seed = ctx.world.meta.seed;
  const meshes: TerrainMeshes = createTerrainMeshes(scene, terrain, {
    material: ground.material,
    // The proxy costs one draw call per cascade; on `low` there are two cascades and a hardware
    // scaling of 1.5 already, and the hills are not what that machine is short of.
    shadowProxy: ctx.quality.preset !== 'low',
    surroundNoise: (x, z) => surroundRelief(x, z, seed),
  });

  const water: WaterSurface = createWaterSurface(scene, terrain, textures.water, textures.waterDetail);
  let waterTriangles = water.rebuild();

  // Cast the sun's shadow from the proxy rather than from the 64 drawn chunks: one mesh per
  // cascade instead of 64, and the proxy is stride 2, so a hillside shadows the valley behind it
  // without the shadow map paying for every ridge the camera can see.
  const sun = scene.getLightByName('sun') as IShadowLight | null;
  const shadowGenerator = sun?.getShadowGenerator?.();
  if (meshes.shadowProxy && shadowGenerator && 'addShadowCaster' in shadowGenerator) {
    (shadowGenerator as { addShadowCaster(m: Mesh, includeChildren?: boolean): unknown })
      .addShadowCaster(meshes.shadowProxy, false);
  }

  let probe: EnvProbe | null = null;
  const applyProbe = (env: EnvironmentState) => {
    if (scene.environmentTexture) {
      // The environment module took over; hand the sky back to it.
      if (probe) {
        ground.material.reflectionTexture = null;
        water.material.reflectionTexture = null;
        probe.dispose();
        probe = null;
      }
      return;
    }
    if (!probe) {
      probe = createEnvProbe(scene, env);
      ground.material.reflectionTexture = probe.texture;
      water.material.reflectionTexture = probe.texture;
      ground.material.environmentIntensity = 0.85;
      water.material.environmentIntensity = 1.1;
      return;
    }
    probe.update(env);
  };

  const buildMs = performance.now() - t0;

  const dirtyRects: Array<[number, number, number, number] | null> = [];
  let rebuildQueued = false;
  const flush = () => {
    rebuildQueued = false;
    const rects = dirtyRects.splice(0, dirtyRects.length);
    if (rects.length === 0) return;
    if (rects.some((r) => r === null)) {
      meshes.rebuildAll();
    } else {
      for (const rect of rects) if (rect) meshes.rebuildRect(rect);
    }
    ground.uploadPaint(terrain);
    waterTriangles = water.rebuild();
  };
  const queue = (rect: [number, number, number, number] | null) => {
    dirtyRects.push(rect);
    rebuildQueued = true;
  };

  const offChanged = ctx.events.on(
    'terrain:changed',
    (payload: { rect: [number, number, number, number] | null }) => {
      queue(payload?.rect ?? null);
    }
  );

  let seconds = 0;
  const api: TerrainMainApi = {
    height: (x, z) => sampleHeight(terrain, x, z),
    normal: (x, z) => sampleNormal(terrain, x, z),
    paint: (x, z) => samplePaint(terrain, x, z),
    slope: (x, z) => sampleSlope(terrain, x, z),
    waterLevel: () => terrain.waterLevel,
    raycast: (origin, direction, maxDistance) => raycast(terrain, origin, direction, maxDistance),
    ground: () => meshes.shadowProxy ?? meshes.surround,
    meshes: () => meshes.visible(),
    brush(stroke) {
      const rect = applyBrush(terrain, stroke);
      ctx.dispatch('terrain:brush', stroke);
      queue(rect);
    },
    setWaterLevel(level) {
      terrain.waterLevel = level;
      ctx.dispatch('terrain:water', { level });
      queue(null);
    },
    stats: () => ({
      chunks: meshes.chunks.length,
      waterTriangles,
      textureResolution: textures.resolution,
      textureMs: Math.round(textures.generateMs),
      buildMs: Math.round(buildMs),
      splat: !!ground.plugin,
    }),
  };

  return {
    api,
    onEnvironment(env) {
      ground.setWetness(env.wetness);
      water.applyEnvironment(env);
      applyProbe(env);
      // Rain and storm cool the ground down as well as darkening it; without the tint the wet
      // albedo alone reads as a lighting bug rather than as weather.
      const damp = env.wetness;
      ground.material.ambientColor = new Color3(0.06 + 0.02 * damp, 0.07, 0.09 + 0.04 * damp);
    },
    onRender(dt) {
      seconds += dt;
      water.animate(seconds);
      if (rebuildQueued) flush();
    },
    dispose() {
      offChanged();
      water.dispose();
      meshes.dispose();
      ground.dispose();
      probe?.dispose();
      textures.dispose();
    },
  };
}

/** Centre of the park in world space; exported so the showcase can aim the camera without maths. */
export function parkCentre(): Vector3 {
  return new Vector3(0, 0, 0);
}
