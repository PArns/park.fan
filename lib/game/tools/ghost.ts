/**
 * The ghost and the selection marker: the only Babylon in this module.
 *
 * **Five meshes and three materials, created once and scaled.** A ghost that rebuilt its box per
 * item would allocate a mesh on every pointer move over a palette of thirty-three things; these are
 * unit boxes with `scaling` written per frame, so the cost of hovering is three matrix writes and
 * the module's census (`stats()`) is a constant the report can name.
 *
 * **It is a footprint, not a model.** The ghost draws the rectangle the placement rules actually
 * judge — the same `Rect` `placement.ts` tests against water, slope and the neighbours — plus a
 * volume of the item's height and a chevron on its facing side. Drawing a preview of the real
 * building would be prettier and would lie about the two things a person is deciding: where its
 * edges are, and which way it faces. It also cannot be done honestly today: every module in this
 * game draws its content as thin instances of a batch built at boot, so there is no "one bench" to
 * clone. Recorded in the report as the weakest part of the frame.
 *
 * Both materials are `envExempt` (ARCHITECTURE.md §4): the environment module tints and wets
 * anything that does not say otherwise, and a validity colour that goes brown in the rain is not a
 * validity colour.
 */

import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';
import type { GhostState } from './types';

/** Metres the pad sticks out past the footprint, so the outline reads at overview distance. */
const PAD_MARGIN = 0.3;
const PAD_THICKNESS = 0.08;
/** Metres above the ground the pad floats, to keep it out of z-fighting with the terrain. */
const PAD_LIFT = 0.04;

export interface SelectionMarker {
  position: [number, number, number];
  yaw: number;
  footprint: [number, number];
  height: number;
}

export interface GhostRig {
  showGhost(state: GhostState): void;
  hideGhost(): void;
  showSelection(marker: SelectionMarker | null): void;
  meshes(): Mesh[];
  stats(): { meshes: number; materials: number };
  dispose(): void;
}

export function createGhostRig(scene: Scene): GhostRig {
  const ok = unlit(scene, 'tools-ghost-ok', new Color3(0.29, 0.92, 0.55), 0.34);
  const bad = unlit(scene, 'tools-ghost-bad', new Color3(0.95, 0.28, 0.22), 0.34);
  const select = unlit(scene, 'tools-select', new Color3(0.25, 0.64, 0.9), 0.42);

  const volume = box(scene, 'tools-ghost-volume', ok);
  const pad = box(scene, 'tools-ghost-pad', ok);
  const facing = box(scene, 'tools-ghost-facing', ok);
  const selectPad = box(scene, 'tools-select-pad', select);
  const selectFrame = box(scene, 'tools-select-frame', select);
  // A wireframe box round the selection: it has to read against a lit shop from 40 m without
  // hiding what it is selecting.
  const selectFrameMaterial = unlit(scene, 'tools-select-frame-mat', new Color3(0.4, 0.8, 1), 1);
  selectFrameMaterial.wireframe = true;
  selectFrame.material = selectFrameMaterial;

  const all = [volume, pad, facing, selectPad, selectFrame];
  for (const mesh of all) mesh.setEnabled(false);

  return {
    showGhost(state) {
      const material = state.valid ? ok : bad;
      const [x, y, z] = state.position;
      const [sizeX, sizeZ] = state.footprint;
      const height = Math.max(0.4, state.height);

      volume.material = material;
      volume.scaling.set(sizeX, height, sizeZ);
      volume.position.set(x, y + height / 2, z);
      volume.rotation.y = state.yaw;

      pad.material = material;
      pad.scaling.set(sizeX + PAD_MARGIN, PAD_THICKNESS, sizeZ + PAD_MARGIN);
      pad.position.set(x, y + PAD_LIFT, z);
      pad.rotation.y = state.yaw;

      // The chevron sits just past the leading edge, on the item's own +Z, which is the facing
      // convention the rest of the game composes its matrices with (`facing = [sin yaw, cos yaw]`).
      const reach = sizeZ / 2 + 0.55;
      facing.material = material;
      facing.scaling.set(Math.min(1.4, Math.max(0.4, sizeX * 0.35)), PAD_THICKNESS, 1.0);
      facing.position.set(
        x + Math.sin(state.yaw) * reach,
        y + PAD_LIFT,
        z + Math.cos(state.yaw) * reach
      );
      facing.rotation.y = state.yaw;

      for (const mesh of [volume, pad, facing]) mesh.setEnabled(true);
    },
    hideGhost() {
      for (const mesh of [volume, pad, facing]) mesh.setEnabled(false);
    },
    showSelection(marker) {
      if (!marker) {
        selectPad.setEnabled(false);
        selectFrame.setEnabled(false);
        return;
      }
      const [x, y, z] = marker.position;
      const [sizeX, sizeZ] = marker.footprint;
      const height = Math.max(0.4, marker.height);
      selectPad.scaling.set(sizeX + PAD_MARGIN, PAD_THICKNESS, sizeZ + PAD_MARGIN);
      selectPad.position.set(x, y + PAD_LIFT, z);
      selectPad.rotation.y = marker.yaw;
      selectFrame.scaling.set(sizeX + 0.1, height, sizeZ + 0.1);
      selectFrame.position.set(x, y + height / 2, z);
      selectFrame.rotation.y = marker.yaw;
      selectPad.setEnabled(true);
      selectFrame.setEnabled(true);
    },
    meshes: () => [...all],
    stats: () => ({ meshes: all.length, materials: 4 }),
    dispose() {
      for (const mesh of all) mesh.dispose();
      for (const material of [ok, bad, select, selectFrameMaterial]) material.dispose();
    },
  };
}

function box(scene: Scene, name: string, material: StandardMaterial): Mesh {
  const mesh = CreateBox(name, { size: 1 }, scene);
  mesh.material = material;
  mesh.isPickable = false;
  // A ghost is not part of the park: it must not cast a shadow, and nothing may query it as
  // geometry. `environment.addShadowCaster` is opt-in, so not calling it is the whole of that.
  mesh.receiveShadows = false;
  mesh.doNotSyncBoundingInfo = true;
  return mesh;
}

function unlit(scene: Scene, name: string, colour: Color3, alpha: number): StandardMaterial {
  const material = new StandardMaterial(name, scene);
  material.disableLighting = true;
  material.emissiveColor = colour;
  material.diffuseColor = new Color3(0, 0, 0);
  material.specularColor = new Color3(0, 0, 0);
  material.alpha = alpha;
  material.backFaceCulling = false;
  material.metadata = { envExempt: true };
  return material;
}
