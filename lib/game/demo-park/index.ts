/**
 * Demo park: "park.fan Resort". PLACEHOLDER owned by the demo-park builder — this version only
 * shapes the terrain (gentle hills, a lake in the south-east) so the empty park is not a plane.
 */

import type { GameModule, World } from '../core/types';
import { createWorld } from '../core/world';
import { Rng } from '../core/rng';
import type { Registry } from '../core/registry';

export function buildWorld(seed: number, registry: Registry): World {
  const world = createWorld({
    seed,
    name: 'park.fan Resort',
    packs: registry.packs().map((p) => p.id),
    cash: 250_000_000,
  });
  const t = world.terrain;
  const rng = new Rng(seed).fork('terrain');
  const n = t.resolution;
  const w = n + 1;
  // Low-frequency hills from a few gaussian bumps, one lake basin.
  const bumps = Array.from({ length: 9 }, () => ({
    x: rng.range(-t.size * 0.45, t.size * 0.45),
    z: rng.range(-t.size * 0.45, t.size * 0.45),
    r: rng.range(50, 140),
    h: rng.range(2, 9),
  }));
  const lake = { x: t.size * 0.22, z: t.size * 0.2, r: 70, depth: 5 };
  for (let j = 0; j < w; j++) {
    for (let i = 0; i < w; i++) {
      const x = -t.size / 2 + (i / n) * t.size;
      const z = -t.size / 2 + (j / n) * t.size;
      let h = 0;
      for (const b of bumps) {
        const d2 = ((x - b.x) ** 2 + (z - b.z) ** 2) / (b.r * b.r);
        h += b.h * Math.exp(-d2 * 1.6);
      }
      const dl = Math.hypot(x - lake.x, z - lake.z) / lake.r;
      if (dl < 1.2) h -= lake.depth * Math.exp(-dl * dl * 2.2) * 1.6;
      // keep the entrance plaza flat
      const de = Math.hypot(x, z - 170) / 60;
      if (de < 1) h *= de * de;
      t.heights[j * w + i] = h;
    }
  }
  t.waterLevel = -1.2;
  return world;
}

export const demoParkModule: GameModule & { buildWorld: typeof buildWorld } = {
  id: 'demo-park',
  deps: ['core', 'terrain'],
  buildWorld,
};
