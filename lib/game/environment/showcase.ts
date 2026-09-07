/**
 * `/game?showcase=environment` — a scene whose only subject is the light.
 *
 * Light needs something to fall on, so this stages the least opinionated thing that can show it:
 * a paved promenade, a sweep of spheres across roughness and metallic, pillars long enough to
 * throw a readable shadow at any sun elevation, and a run of hedges so the seasonal foliage tint
 * has somewhere to land. Nothing here is a ride or a building — those belong to other builders,
 * and a borrowed prop would make it their screenshot.
 *
 * Two of the props exist to catch specific mistakes. The mirror sphere shows where the IBL cube
 * thinks the sun is: if its reflection sits opposite the drawn disc, the cube's face convention
 * is mirrored, which is the one bug in `ibl.ts` that a green build cannot find. And the sphere
 * grid runs to roughness 0.05, where a flat ambient shows up immediately as a dead grey ball.
 *
 * The promenade runs from z = −40 to z = +150 because core's fallback camera presets look at
 * (0, 0, 0) for `overview` and `close` and at (0, 1.7, 120) for `ground`; a showcase that stages
 * only the origin gives the third preset an empty field.
 */

import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';
import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import type { MainContext } from '../core/types';
import { pbrSet, type PbrRecipe, type PbrSet } from './textures';
import type { EnvironmentMainApi } from './main';

export async function stageEnvironmentShowcase(ctx: MainContext): Promise<void> {
  const scene = ctx.scene as Scene;
  const env = ctx.module<EnvironmentMainApi>('environment');
  const casters: Mesh[] = [];

  const sets = new Map<string, PbrSet>();
  /**
   * One PBR material per surface. The uv scale is a property of the TEXTURE, not the material, so
   * a second surface that wants a different tile density gets its own clones of the three maps —
   * sharing them would mean the plaza's cobbles are also the tile size on a 200 m promenade.
   */
  const make = (recipe: PbrRecipe, name: string, tileMetres: [number, number]): PBRMaterial => {
    let set = sets.get(recipe.name);
    if (!set) {
      set = pbrSet(scene, recipe);
      sets.set(recipe.name, set);
    }
    const material = new PBRMaterial(`env-showcase-${name}`, scene);
    material.albedoTexture = set.albedo.clone();
    material.bumpTexture = set.normal.clone();
    material.metallicTexture = set.orm.clone();
    material.useRoughnessFromMetallicTextureGreen = true;
    material.useMetallnessFromMetallicTextureBlue = true;
    material.useRoughnessFromMetallicTextureAlpha = false;
    material.metallic = 1;
    material.roughness = 1;
    setUvScale(material, tileMetres[0], tileMetres[1]);
    return material;
  };

  const PAVING: PbrRecipe = {
    name: 'paving',
    base: [0.4, 0.385, 0.36],
    accent: [0.27, 0.255, 0.24],
    roughness: [0.55, 0.86],
    metallic: 0,
    pattern: 'stone',
    seed: 5,
  };
  const RENDER: PbrRecipe = {
    name: 'render',
    base: [0.62, 0.59, 0.53],
    accent: [0.5, 0.47, 0.42],
    roughness: [0.62, 0.9],
    metallic: 0,
    pattern: 'plaster',
    seed: 21,
  };
  const STEEL: PbrRecipe = {
    name: 'steel',
    base: [0.62, 0.63, 0.66],
    accent: [0.44, 0.45, 0.48],
    roughness: [0.18, 0.44],
    metallic: 1,
    pattern: 'metal',
    seed: 33,
  };
  const HEDGE: PbrRecipe = {
    name: 'hedge',
    base: [0.16, 0.34, 0.13],
    accent: [0.1, 0.22, 0.08],
    roughness: [0.7, 0.95],
    metallic: 0,
    pattern: 'plaster',
    seed: 61,
  };

  const promenadePaving = make(PAVING, 'paving-promenade', [5.5, 50]);
  const plazaPaving = make(PAVING, 'paving-plaza', [11, 11]);
  const render = make(RENDER, 'render', [3, 3]);
  const steel = make(STEEL, 'steel', [2, 2]);
  // Named for the foliage regex in `surfaces.ts`, so the seasonal tint reaches it.
  const foliage = make(HEDGE, 'foliage-hedge', [4, 4]);

  const chrome = new PBRMaterial('env-showcase-chrome', scene);
  chrome.albedoColor = new Color3(0.93, 0.94, 0.96);
  chrome.metallic = 1;
  chrome.roughness = 0.045;

  const add = (mesh: Mesh, material: PBRMaterial, cast: boolean): Mesh => {
    mesh.material = material;
    mesh.receiveShadows = true;
    mesh.isPickable = false;
    if (cast) casters.push(mesh);
    return mesh;
  };

  // ── Promenade ─────────────────────────────────────────────────────────────────────────────
  const promenade = CreateBox(
    'env-showcase-promenade',
    { width: 22, height: 0.3, depth: 200 },
    scene
  );
  promenade.position.set(0, 0.15, 55);
  add(promenade, promenadePaving, false);

  const plaza = CreateCylinder(
    'env-showcase-plaza',
    { diameter: 44, height: 0.34, tessellation: 48 },
    scene
  );
  plaza.position.set(0, 0.17, 0);
  add(plaza, plazaPaving, false);

  // ── Material sweep ────────────────────────────────────────────────────────────────────────
  // Four roughness steps × three treatments. Anything flatter than a real environment shows here
  // first: the smooth metal row goes dead grey the moment the ambient stops having a direction.
  const roughnesses = [0.06, 0.22, 0.5, 0.85];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < roughnesses.length; col++) {
      const x = (col - 1.5) * 5.2;
      const z = (row - 1) * 6.4;
      const plinth = CreateBox(
        `env-showcase-plinth-${row}-${col}`,
        { width: 2.4, height: 0.9, depth: 2.4 },
        scene
      );
      plinth.position.set(x, 0.79, z);
      add(plinth, render, true);

      const ball = CreateSphere(
        `env-showcase-ball-${row}-${col}`,
        { diameter: 3.1, segments: 32 },
        scene
      );
      ball.position.set(x, 2.8, z);
      const material = new PBRMaterial(`env-showcase-ball-${row}-${col}`, scene);
      material.roughness = roughnesses[col];
      if (row === 0) {
        material.albedoColor = new Color3(0.72, 0.24, 0.19);
        material.metallic = 0;
      } else if (row === 1) {
        material.albedoColor = new Color3(0.56, 0.57, 0.6);
        material.metallic = 1;
      } else {
        material.albedoColor = new Color3(0.2, 0.42, 0.58);
        material.metallic = 0;
      }
      add(ball, material, true);
    }
  }

  const mirror = CreateSphere('env-showcase-mirror', { diameter: 5.4, segments: 48 }, scene);
  mirror.position.set(0, 3.4, -13.5);
  add(mirror, chrome, true);

  // ── Pillars, for shadows with a length you can read ───────────────────────────────────────
  for (const [x, z] of [
    [-13, -16],
    [13, -16],
    [-13, 20],
    [13, 20],
  ]) {
    const pillar = CreateBox(
      `env-showcase-pillar-${x}-${z}`,
      { width: 1.8, height: 8.5, depth: 1.8 },
      scene
    );
    pillar.position.set(x, 4.25 + 0.3, z);
    add(pillar, render, true);
    const cap = CreateBox(
      `env-showcase-cap-${x}-${z}`,
      { width: 2.4, height: 0.4, depth: 2.4 },
      scene
    );
    cap.position.set(x, 8.75, z);
    add(cap, steel, true);
  }

  // ── Hedges: where the seasonal tint lands ─────────────────────────────────────────────────
  for (let i = 0; i < 8; i++) {
    const z = 26 + i * 15;
    for (const side of [-1, 1]) {
      const hedge = CreateBox(
        `env-showcase-hedge-${i}-${side}`,
        { width: 2.2, height: 1.5, depth: 9 },
        scene
      );
      hedge.position.set(side * 13.2, 1.05, z);
      add(hedge, foliage, true);
    }
  }

  // ── Gateway at the `ground` preset's target ───────────────────────────────────────────────
  for (const side of [-1, 1]) {
    const leg = CreateBox(
      `env-showcase-gate-${side}`,
      { width: 1.4, height: 6.2, depth: 1.4 },
      scene
    );
    leg.position.set(side * 5.2, 3.4, 120);
    add(leg, render, true);
  }
  const lintel = CreateBox('env-showcase-lintel', { width: 12.6, height: 1.1, depth: 2 }, scene);
  lintel.position.set(0, 7.05, 120);
  add(lintel, steel, true);

  const bench = CreateBox('env-showcase-bench', { width: 4.6, height: 0.45, depth: 1.2 }, scene);
  bench.position.set(-2.2, 0.75, 113);
  add(bench, render, true);

  for (let i = 0; i < 3; i++) {
    const ball = CreateSphere(`env-showcase-eye-${i}`, { diameter: 1.5, segments: 28 }, scene);
    ball.position.set(-3 + i * 3, 1.75, 126);
    const material = new PBRMaterial(`env-showcase-eye-${i}`, scene);
    material.albedoColor =
      i === 0
        ? new Color3(0.82, 0.79, 0.7)
        : i === 1
          ? new Color3(0.55, 0.56, 0.58)
          : new Color3(0.18, 0.36, 0.5);
    material.metallic = i === 1 ? 1 : 0;
    material.roughness = i === 1 ? 0.12 : 0.35;
    add(ball, material, true);
  }

  for (const mesh of casters) env?.addShadowCaster(mesh, false);

  const camera = scene.activeCamera as ArcRotateCamera | null;
  if (camera && 'target' in camera) {
    camera.target = new Vector3(0, 2.5, 18);
    camera.radius = 62;
    camera.alpha = -Math.PI / 2.6;
    camera.beta = Math.PI / 2.9;
  }
}

/**
 * `CreateBox` gives every face uvs of 0..1, so the repeat count IS the face size divided by the
 * tile size — a single scalar stretches a long surface by its aspect ratio.
 */
function setUvScale(material: PBRMaterial, u: number, v: number): void {
  for (const texture of [material.albedoTexture, material.bumpTexture, material.metallicTexture]) {
    if (!texture) continue;
    const t = texture as unknown as { uScale: number; vScale: number };
    t.uScale = u;
    t.vScale = v;
  }
}
