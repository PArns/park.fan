/**
 * Five finishes and one texture set for every flat ride in the park.
 *
 * A fairground is painted, not textured: the colour of a carousel's every panel, horse, sweep and
 * bulb is a **vertex colour** written by `shapes.ts`, and the material supplies the surface — a
 * fine grain in the albedo and a matching normal so a 14 m canopy is not a flat fill. That is what
 * keeps the whole module at five PBR programs however many rides a park has, and it is why a pack
 * can recolour a ride from its theme palette without a material of its own.
 *
 * Sharing is about shader variants and texture memory rather than draw calls: a thin-instance batch
 * is one call whatever material it uses, but a material per ride type would compile a PBR program
 * per type and stutter the first time each is seen.
 *
 * ARCHITECTURE §4 metadata: the four surface finishes are left **modulated** — a wet carousel
 * should darken like everything else in the rain — and the lamp material is `envExempt`, because it
 * animates its own emissive against `EnvironmentState.night` and must not also be dimmed.
 *
 * Peak emissive is **1.0**, not higher: the pipeline's bloom threshold is 0.9, and `shops` recorded
 * what 1.35 looks like — featureless white bars with a halo where a lit sign should be.
 */

import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Constants } from '@babylonjs/core/Engines/constants';
import type { Material } from '@babylonjs/core/Materials/material';
import type { Scene } from '@babylonjs/core/scene';
import { Rng } from '../core/rng';
import type { Finish } from './types';

export interface RideMaterials {
  /** The material for one finish. `lamp` needs a colour and goes through `lamp()`. */
  surface(finish: Exclude<Finish, 'lamp'>): PBRMaterial;
  /** Cached per sRGB-ish linear colour, rounded — a fairground uses a handful of bulb colours. */
  lamp(r: number, g: number, b: number): PBRMaterial;
  /** 0..1 from `EnvironmentState.night`. */
  setNight(night: number): void;
  all(): Material[];
  dispose(): void;
}

/** 192² is enough for a grain nobody looks at directly and is 110 KB of RGBA per map. */
const SIZE = 192;

function noiseMaps(scene: Scene, seed: number): { albedo: RawTexture; normal: RawTexture } {
  const rng = new Rng(seed);
  const n = SIZE * SIZE;
  const height = new Float32Array(n);
  // Two octaves of value noise plus a per-texel speckle: paint has orange peel and steel has a
  // brushed direction, and one shared map that carries both at low amplitude reads as neither
  // being missing.
  const coarse = 24;
  const grid = new Float32Array((coarse + 1) * (coarse + 1));
  for (let i = 0; i < grid.length; i++) grid[i] = rng.next();
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const gx = (x / SIZE) * coarse;
      const gy = (y / SIZE) * coarse;
      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      const fx = gx - x0;
      const fy = gy - y0;
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      const at = (a: number, b: number) =>
        grid[(b % (coarse + 1)) * (coarse + 1) + (a % (coarse + 1))];
      const v =
        at(x0, y0) * (1 - sx) * (1 - sy) +
        at(x0 + 1, y0) * sx * (1 - sy) +
        at(x0, y0 + 1) * (1 - sx) * sy +
        at(x0 + 1, y0 + 1) * sx * sy;
      height[y * SIZE + x] = v * 0.72 + rng.next() * 0.28;
    }
  }

  const albedo = new Uint8Array(n * 4);
  const normal = new Uint8Array(n * 4);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = y * SIZE + x;
      // Albedo detail sits close to white: the vertex colour is the paint, this is the tooth on it.
      const t = 0.88 + height[i] * 0.14;
      const v = Math.max(0, Math.min(255, Math.round(t * 255)));
      albedo[i * 4] = v;
      albedo[i * 4 + 1] = v;
      albedo[i * 4 + 2] = v;
      albedo[i * 4 + 3] = 255;
      const l = height[y * SIZE + ((x + SIZE - 1) % SIZE)];
      const r = height[y * SIZE + ((x + 1) % SIZE)];
      const u = height[((y + SIZE - 1) % SIZE) * SIZE + x];
      const d = height[((y + 1) % SIZE) * SIZE + x];
      // Sobel wrapped, so the map tiles: an edge seam on a carousel canopy is a ring of dark.
      const nx = (l - r) * 1.35;
      const ny = (u - d) * 1.35;
      const len = Math.hypot(nx, ny, 1);
      normal[i * 4] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      normal[i * 4 + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      normal[i * 4 + 2] = Math.round((1 / len) * 0.5 * 255 + 127);
      normal[i * 4 + 3] = 255;
    }
  }
  const mk = (data: Uint8Array, name: string, srgb: boolean) => {
    const tex = new RawTexture(
      data,
      SIZE,
      SIZE,
      Constants.TEXTUREFORMAT_RGBA,
      scene,
      true,
      false,
      Texture.TRILINEAR_SAMPLINGMODE
    );
    tex.name = name;
    tex.wrapU = Texture.WRAP_ADDRESSMODE;
    tex.wrapV = Texture.WRAP_ADDRESSMODE;
    if (!srgb) tex.gammaSpace = false;
    return tex;
  };
  return { albedo: mk(albedo, 'rides-grain', true), normal: mk(normal, 'rides-grain-n', false) };
}

const SETTINGS: Record<
  Exclude<Finish, 'lamp'>,
  { metallic: number; roughness: number; bump: number }
> = {
  // Painted timber and moulded fibreglass: the fairground's most common surface.
  matte: { metallic: 0, roughness: 0.68, bump: 0.6 },
  // Coach enamel over filler — a carousel's panels and a gondola's shell.
  gloss: { metallic: 0.05, roughness: 0.26, bump: 0.35 },
  /**
   * Galvanised steel, brass poles, chains.
   *
   * 0.5 rather than a physically-correct 0.9, and the reason is in the frame: a fully metallic PBR
   * surface has NO diffuse term — everything it shows is a reflection of the environment — so on
   * the `medium` preset, where the IBL is a dim analytic sky, sixteen brass carousel poles, the
   * canopy's sweeps and its brass ring all rendered BLACK, and a machine that is a third metal
   * came back as a cage of dark bars. Half metallic keeps the specular and gives the paint
   * something to be seen by.
   */
  metal: { metallic: 0.5, roughness: 0.3, bump: 0.5 },
  // Canvas canopy and valance.
  fabric: { metallic: 0, roughness: 0.88, bump: 0.9 },
};

export function createRideMaterials(scene: Scene, seed: number): RideMaterials {
  const maps = noiseMaps(scene, seed);
  const surfaces = new Map<string, PBRMaterial>();
  const lamps = new Map<string, PBRMaterial>();
  let night = 0;

  for (const [finish, s] of Object.entries(SETTINGS)) {
    const m = new PBRMaterial(`rides-${finish}`, scene);
    m.albedoTexture = maps.albedo;
    m.bumpTexture = maps.normal;
    m.bumpTexture.level = s.bump;
    m.albedoColor = new Color3(1, 1, 1);
    m.metallic = s.metallic;
    m.roughness = s.roughness;
    m.backFaceCulling = true;
    // Six: a ride stands under the sun, the sky term and up to four of its own night rig's lamps,
    // and a material that runs out of slots drops the sun rather than the lamp.
    m.maxSimultaneousLights = 6;
    surfaces.set(finish, m);
  }

  return {
    surface: (finish) => surfaces.get(finish) ?? surfaces.get('matte')!,
    lamp(r, g, b) {
      const key = `${r.toFixed(2)}:${g.toFixed(2)}:${b.toFixed(2)}`;
      let m = lamps.get(key);
      if (!m) {
        m = new PBRMaterial(`rides-lamp-${lamps.size}`, scene);
        m.albedoColor = new Color3(r * 0.5 + 0.35, g * 0.5 + 0.35, b * 0.5 + 0.35);
        m.metallic = 0;
        m.roughness = 0.32;
        m.emissiveColor = new Color3(r, g, b);
        m.emissiveIntensity = night;
        m.maxSimultaneousLights = 4;
        // It owns its own look; the wetness and season passes must not touch it.
        m.metadata = { ...(m.metadata ?? {}), envExempt: true };
        lamps.set(key, m);
      }
      return m;
    },
    setNight(value) {
      night = Math.max(0, Math.min(1, value));
      for (const m of lamps.values()) m.emissiveIntensity = night;
    },
    all: () => [...surfaces.values(), ...lamps.values()],
    dispose() {
      for (const m of surfaces.values()) m.dispose();
      for (const m of lamps.values()) m.dispose();
      surfaces.clear();
      lamps.clear();
      maps.albedo.dispose();
      maps.normal.dispose();
    },
  };
}
