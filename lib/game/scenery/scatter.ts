/**
 * Ambient landscape dressing: the undergrowth, boulders, meadow flowers and background trees that
 * turn an empty green field into somewhere a park was built.
 *
 * Three decisions, all of them about cost rather than about looks.
 *
 * **It is not made of entities.** A thousand rocks in `world.entities` is a thousand objects in
 * every save, every clone into the worker and every `for (const id in world.entities)` loop in
 * every module — for decoration nobody bought, nobody can sell, and nobody will ever move. The
 * field is a pure function of the seed and the terrain, so it is re-derived on load instead of
 * stored, and the save does not grow at all.
 *
 * **It is addressed, not sequenced.** Each candidate is hashed from its own cell index, so the
 * answer for a cell does not depend on which cells were asked about first. That is what lets the
 * renderer evaluate a region around the camera and the simulation evaluate one square metre under
 * a guest's feet, and get the same rock.
 *
 * **Density follows the paint layer.** The art bible asks for exactly this — scatter that reads
 * the ground rather than covering it evenly — and it is also the cheapest way to make a park look
 * planted: nothing grows on the concrete, the meadow is thick with flowers, the dirt gets scrub.
 *
 * DOM-free, Babylon-free, reachable from `sim.ts`.
 */

import type { PropSpec } from './catalog';
import { clamp01, fbm, hashString, rand2, smoothstep } from './noise';

/** Terrain paint indices, mirrored from `terrain/heightfield.ts` so this file imports nothing. */
export const PAINT_GRASS = 0;
export const PAINT_SAND = 1;
export const PAINT_ROCK = 2;
export const PAINT_DIRT = 3;
export const PAINT_MEADOW = 4;
export const PAINT_CONCRETE = 5;
export const PAINT_WOOD = 6;

export interface ScatterInstance {
  key: string;
  x: number;
  z: number;
  y: number;
  yaw: number;
  scale: number;
}

export interface ScatterSpecies {
  spec: PropSpec;
  /** Candidates per cell before the layer and noise tests, 0..1. */
  density: number;
  /** Multiplier per paint layer; 0 keeps it off that ground entirely. */
  byLayer: number[];
  /** Rejected above this slope (0 = flat, 1 = vertical). */
  maxSlope: number;
  /** Metres between candidates of this species. Also the lattice pitch. */
  pitch: number;
  /** Clumping: 0 spreads evenly, 1 puts everything in patches. */
  clump: number;
  /** Refuse a candidate with one of these paint layers within `radius` metres. */
  keepOff?: { layers: number[]; radius: number };
}

export interface ScatterField {
  /** Park-space bounds `[minX, minZ, maxX, maxZ]`. */
  bounds: [number, number, number, number];
  seed: number;
  species: ScatterSpecies[];
  /** 0..1 from the quality preset; scales every density. */
  densityScale: number;
  height(x: number, z: number): number;
  paint(x: number, z: number): number;
  slope(x: number, z: number): number;
  /** True where nothing may grow — a path, a building's footprint, a placed prop's clearance. */
  excluded?: (x: number, z: number, radius: number) => boolean;
  /** Water table; anything at or below it is skipped. */
  waterLevel?: number;
}

/** The default mix for a temperate park: what the showcase and the demo park dress with. */
export function defaultSpecies(catalog: Map<string, PropSpec>): ScatterSpecies[] {
  const out: ScatterSpecies[] = [];
  const add = (key: string, s: Omit<ScatterSpecies, 'spec'>) => {
    const spec = catalog.get(key);
    if (spec) out.push({ ...s, spec });
  };
  // grass: everywhere but the built ground, thickest on meadow
  add('ambient:meadow-grass', {
    density: 0.6,
    byLayer: layers({ grass: 1, meadow: 1.35, dirt: 0.45, sand: 0.12, rock: 0.05 }),
    maxSlope: 0.62,
    // 2.2 m rather than 1.5: at 1.5 a 240 × 245 m dressing is 26 000 lattice cells before any
    // test runs, and the tufts that survive eat the whole instance cap before a single boulder
    // is asked about. Pitch is the cheapest lever there is on this field.
    pitch: 2.2,
    clump: 0.55,
  });
  add('ambient:meadow-flowers', {
    density: 0.3,
    byLayer: layers({ grass: 0.5, meadow: 1.4, dirt: 0.1 }),
    maxSlope: 0.4,
    pitch: 2.4,
    clump: 0.8,
  });
  add('ambient:undergrowth', {
    density: 0.24,
    byLayer: layers({ grass: 0.8, meadow: 0.7, dirt: 1, rock: 0.25 }),
    maxSlope: 0.55,
    pitch: 4.5,
    clump: 0.7,
  });
  add('ambient:rock-cluster', {
    density: 0.16,
    byLayer: layers({ grass: 0.25, meadow: 0.15, dirt: 0.8, rock: 1.5, sand: 0.4 }),
    maxSlope: 0.9,
    pitch: 7,
    clump: 0.6,
  });
  add('ambient:rock-boulder', {
    density: 0.09,
    byLayer: layers({ grass: 0.2, dirt: 0.6, rock: 1.4, meadow: 0.1 }),
    maxSlope: 0.9,
    pitch: 15,
    clump: 0.5,
  });
  return out;
}

/**
 * A woodland mix over the pack's own trees, for the edges of the park.
 *
 * Two numbers here were wrong the first time and both were visible from one screenshot: at 0.34
 * over a 9 m lattice this planted a closed forest across the whole park, path included, and the
 * plaza came back as a clearing in a wood. Trees are the only species that also keep their
 * distance from paving — `keepOff` — because a grass tuft at the kerb is right and an oak two
 * metres from a 4 m path is not.
 */
export function woodlandSpecies(
  catalog: Map<string, PropSpec>,
  keys: string[],
  density = 0.14
): ScatterSpecies[] {
  const out: ScatterSpecies[] = [];
  for (const key of keys) {
    const spec = catalog.get(key);
    if (!spec || !spec.scatterable) continue;
    out.push({
      spec,
      density,
      byLayer: layers({ grass: 1, meadow: 0.4, dirt: 0.7, rock: 0.15 }),
      maxSlope: 0.62,
      pitch: Math.max(9, spec.height * 0.95),
      clump: 0.66,
      keepOff: { layers: [PAINT_CONCRETE, PAINT_WOOD], radius: 6 },
    });
  }
  return out;
}

function layers(by: Partial<Record<string, number>>): number[] {
  const out = new Array(7).fill(0);
  out[PAINT_GRASS] = by.grass ?? 0;
  out[PAINT_SAND] = by.sand ?? 0;
  out[PAINT_ROCK] = by.rock ?? 0;
  out[PAINT_DIRT] = by.dirt ?? 0;
  out[PAINT_MEADOW] = by.meadow ?? 0;
  out[PAINT_CONCRETE] = by.concrete ?? 0;
  out[PAINT_WOOD] = by.wood ?? 0;
  return out;
}

/**
 * Evaluate the field over a rectangle.
 *
 * One pass per species, each on its own lattice at its own pitch, because a shared lattice makes
 * the species correlate: every boulder would sit in the same cell as a flower and the two would
 * move together when either pitch changed.
 */
export function evaluateScatter(
  field: ScatterField,
  out: ScatterInstance[] = []
): ScatterInstance[] {
  const [minX, minZ, maxX, maxZ] = field.bounds;
  const water = field.waterLevel ?? Number.NEGATIVE_INFINITY;
  // Coarsest first. `evaluateScatter` is bounded by the caller's instance cap, and a cap spent on
  // grass is a landscape with no trees in it — the species that carry the silhouette get asked
  // first, and the ground cover fills whatever is left.
  const ordered = [...field.species].sort((a, b) => b.pitch - a.pitch);
  for (const species of ordered) {
    const salt = (field.seed ^ hashString(species.spec.key)) >>> 0;
    const pitch = Math.max(0.4, species.pitch);
    const i0 = Math.floor(minX / pitch);
    const i1 = Math.ceil(maxX / pitch);
    const j0 = Math.floor(minZ / pitch);
    const j1 = Math.ceil(maxZ / pitch);
    const [scaleLo, scaleHi] = species.spec.scaleRange;
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        const r0 = rand2(i, j, salt);
        // Clumping: a slow noise field gates the lattice, so the species arrives in drifts.
        const patch = species.clump
          ? clamp01(
              (fbm((i * pitch) / 26, (j * pitch) / 26, salt ^ 0x5bf03635, 3) - 0.5) * 2.4 + 0.7
            )
          : 1;
        const gate =
          species.density * field.densityScale * (1 - species.clump + species.clump * patch);
        if (r0 >= gate) continue;
        const x = (i + rand2(i, j, salt ^ 0x9e3779b9)) * pitch;
        const z = (j + rand2(i, j, salt ^ 0x85ebca6b)) * pitch;
        if (x < minX || x > maxX || z < minZ || z > maxZ) continue;
        const layer = field.paint(x, z) | 0;
        const weight = species.byLayer[layer] ?? 0;
        if (weight <= 0) continue;
        if (rand2(i, j, salt ^ 0xc2b2ae35) > Math.min(1, weight)) continue;
        if (species.keepOff) {
          // Four probes on the axes: enough to keep a canopy off a 4 m path, and four paint
          // samples on a species that only has a few hundred candidates in a park.
          const r = species.keepOff.radius;
          let tooClose = false;
          for (const [ox, oz] of [
            [r, 0],
            [-r, 0],
            [0, r],
            [0, -r],
          ]) {
            if (species.keepOff.layers.includes(field.paint(x + ox, z + oz) | 0)) {
              tooClose = true;
              break;
            }
          }
          if (tooClose) continue;
        }
        const slope = field.slope(x, z);
        if (slope > species.maxSlope) continue;
        const y = field.height(x, z);
        if (y <= water) continue;
        const clearance = species.spec.clearance;
        if (field.excluded?.(x, z, clearance)) continue;
        // Thinner where the ground steepens: a hillside covered as thickly as a lawn reads as a
        // texture rather than as planting.
        const slopeFade = 1 - smoothstep(species.maxSlope * 0.55, species.maxSlope, slope) * 0.75;
        if (rand2(i, j, salt ^ 0x27d4eb2f) > slopeFade) continue;
        const t = rand2(i, j, salt ^ 0x165667b1);
        out.push({
          key: species.spec.key,
          x,
          z,
          y,
          yaw: rand2(i, j, salt ^ 0x1b873593) * Math.PI * 2,
          scale: scaleLo + (scaleHi - scaleLo) * t,
        });
      }
    }
  }
  return out;
}

/**
 * Does the field put anything within `radius` of a point?
 *
 * The simulation's query. It evaluates only the cells that could reach the point, so it is a
 * handful of hashes rather than a scan — which is what makes it usable from a guest's tick.
 */
export function scatterNear(field: ScatterField, x: number, z: number, radius: number): boolean {
  const probe: ScatterField = {
    ...field,
    bounds: [x - radius, z - radius, x + radius, z + radius],
  };
  const found = evaluateScatter(probe, []);
  for (const inst of found) {
    const dx = inst.x - x;
    const dz = inst.z - z;
    if (dx * dx + dz * dz <= radius * radius) return true;
  }
  return false;
}
