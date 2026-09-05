/**
 * Wet surfaces and seasonal foliage, applied to whatever the other modules put in the scene.
 *
 * Both are per-material properties — a darker, smoother albedo when it has been raining, a warmer
 * one on the same leaves in October — and this module owns neither the leaves nor the tarmac. So
 * it walks `scene.materials`, remembers each material's own values the first time it sees one,
 * and writes a modulation of those. Nothing is destroyed: `restore()` puts every captured value
 * back, and a material can opt out with `metadata.envExempt` or through `exclude()`.
 *
 * The honest alternative is a `MaterialPluginBase` that injects the wetness into every PBR shader,
 * which would also give per-pixel puddles in the cavities. It is the better answer and it is a
 * request in `docs/game/requests/environment.md`, because shader injection has to be written
 * twice (GLSL and WGSL) and a mistake there takes every material in the game down with it, where
 * a wrong multiply here is a colour that looks off.
 *
 * Rescans are triggered by `scene.materials.length` changing, not by a timer: a builder placing a
 * ride mid-shower gets its material caught on the next frame, and a park that is not building
 * costs one integer compare.
 */

import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Material } from '@babylonjs/core/Materials/material';
import type { Scene } from '@babylonjs/core/scene';
import type { Season, Vec3 } from '../core/types';
import { seasonFoliageTint } from './sky-model';

/** Names that mean "this is a plant". Modules can be explicit instead with `metadata.foliage`. */
const FOLIAGE_NAME = /grass|foliage|leaf|leaves|tree|hedge|shrub|bush|lawn|canopy|planting/i;

interface Captured {
  foliage: boolean;
  albedo: Vec3;
  roughness: number;
  /** StandardMaterial's specular, raised when a surface is wet. */
  specular: Vec3 | null;
}

export interface SurfaceHandle {
  apply(wetness: number, season: Season, force: boolean): void;
  exclude(material: unknown): void;
  restore(): void;
}

export function createSurfaces(scene: Scene): SurfaceHandle {
  const captured = new WeakMap<Material, Captured>();
  const touched: Material[] = [];
  const excluded = new WeakSet<Material>();
  let lastCount = -1;
  let lastWetness = -1;
  let lastSeason: Season | '' = '';

  function capture(material: Material): Captured | null {
    const existing = captured.get(material);
    if (existing) return existing;
    if (excluded.has(material)) return null;
    const meta = material.metadata as { envOwned?: boolean; envExempt?: boolean; foliage?: boolean } | null;
    if (meta?.envOwned || meta?.envExempt) return null;
    const foliage = meta?.foliage === true || FOLIAGE_NAME.test(material.name);
    let entry: Captured | null = null;
    if (material instanceof PBRMaterial) {
      entry = {
        foliage,
        albedo: [material.albedoColor.r, material.albedoColor.g, material.albedoColor.b],
        roughness: material.roughness ?? 0.7,
        specular: null,
      };
    } else if (material instanceof StandardMaterial) {
      entry = {
        foliage,
        albedo: [material.diffuseColor.r, material.diffuseColor.g, material.diffuseColor.b],
        roughness: 1 - Math.min(1, material.specularPower / 256),
        specular: [material.specularColor.r, material.specularColor.g, material.specularColor.b],
      };
    }
    if (!entry) return null;
    captured.set(material, entry);
    touched.push(material);
    return entry;
  }

  function write(material: Material, entry: Captured, wetness: number, tint: Vec3): void {
    // Water fills the microstructure: the surface goes darker and much smoother, which is the
    // whole reason a wet path reflects the sky and a dry one does not.
    const darken = 1 - 0.44 * wetness;
    const r = entry.albedo[0] * (entry.foliage ? tint[0] : 1) * darken;
    const g = entry.albedo[1] * (entry.foliage ? tint[1] : 1) * darken;
    const b = entry.albedo[2] * (entry.foliage ? tint[2] : 1) * darken;
    if (material instanceof PBRMaterial) {
      material.albedoColor.set(r, g, b);
      material.roughness = Math.max(0.05, entry.roughness * (1 - 0.62 * wetness));
    } else if (material instanceof StandardMaterial) {
      material.diffuseColor.set(r, g, b);
      if (entry.specular) {
        const lift = 1 + 2.2 * wetness;
        material.specularColor.set(
          Math.min(1, entry.specular[0] * lift + 0.06 * wetness),
          Math.min(1, entry.specular[1] * lift + 0.06 * wetness),
          Math.min(1, entry.specular[2] * lift + 0.07 * wetness)
        );
      }
      material.specularPower = 16 + 190 * wetness;
    }
  }

  return {
    apply(wetness, season, force) {
      const countChanged = scene.materials.length !== lastCount;
      const stateChanged =
        force || season !== lastSeason || Math.abs(wetness - lastWetness) > 0.015;
      if (!countChanged && !stateChanged) return;
      lastCount = scene.materials.length;
      lastWetness = wetness;
      lastSeason = season;
      const tint = seasonFoliageTint(season);
      for (const material of scene.materials) {
        const entry = capture(material);
        if (entry) write(material, entry, wetness, tint);
      }
    },
    exclude(material) {
      if (material && typeof material === 'object') {
        excluded.add(material as Material);
      }
    },
    restore() {
      const white: Vec3 = [1, 1, 1];
      for (const material of touched) {
        const entry = captured.get(material);
        if (entry) write(material, entry, 0, white);
      }
      touched.length = 0;
    },
  };
}

/** Exported so the showcase can label its own props without importing `Color3` twice. */
export function tintOf(season: Season): Color3 {
  const t = seasonFoliageTint(season);
  return new Color3(t[0], t[1], t[2]);
}
