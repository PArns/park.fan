/**
 * The vertex sink every builder in this module writes into.
 *
 * One class, so the basin, the steps, the handrails and the deck furniture all group their output
 * by the material it will be drawn with — and so `main.ts` can concatenate the same named surface
 * across every pool in the park into ONE mesh per material. A water park with six basins then
 * costs seven draw calls rather than forty-two.
 *
 * Pure arrays: no Babylon, no DOM, node-runnable.
 */

import type { PoolSurface, PoolSurfaceName } from './types';

export const WHITE: [number, number, number] = [1, 1, 1];

export class SurfaceBuilder {
  private readonly byName = new Map<PoolSurfaceName, PoolSurface>();

  surface(name: PoolSurfaceName): PoolSurface {
    let s = this.byName.get(name);
    if (!s) {
      s = { name, positions: [], normals: [], uvs: [], colors: [], indices: [] };
      this.byName.set(name, s);
    }
    return s;
  }

  vertex(
    s: PoolSurface,
    p: [number, number, number],
    n: [number, number, number],
    uv: [number, number],
    c: [number, number, number]
  ): number {
    const index = s.positions.length / 3;
    s.positions.push(p[0], p[1], p[2]);
    s.normals.push(n[0], n[1], n[2]);
    s.uvs.push(uv[0], uv[1]);
    s.colors.push(c[0], c[1], c[2], 1);
    return index;
  }

  tri(s: PoolSurface, a: number, b: number, c: number): void {
    s.indices.push(a, b, c);
  }

  quad(s: PoolSurface, a: number, b: number, c: number, d: number): void {
    s.indices.push(a, b, c, a, c, d);
  }

  done(): { surfaces: PoolSurface[]; triangles: number } {
    const surfaces = [...this.byName.values()].filter((s) => s.indices.length > 0);
    let triangles = 0;
    for (const s of surfaces) triangles += s.indices.length / 3;
    return { surfaces, triangles };
  }
}
