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

  /**
   * Emit a triangle, wound so that it FACES THE WAY ITS OWN NORMALS DO.
   *
   * This is not convenience, it is the fix for the bug that cost this module its first render. In
   * this scene — right-handed, right-handed projection — Babylon winds an up-facing quad so that
   * `cross(v1 − v0, v2 − v0)` points **down**: `FRONT_FACE_SIGN = -1`, a note `paths/mesh.ts` and
   * `terrain/chunks.ts` both carry, both after paying for it. Getting it backwards throws nothing
   * and warns about nothing; the geometry is in the scene with the right vertex count and is
   * back-face culled, so it is simply not there.
   *
   * It cost exactly that here: every ring — the floor, the coping, the deck — came out with the
   * opposite winding to the wall, and the first screenshot of the showcase was a pool sunk in a
   * grass trench with no paving of any kind around it, because 4,300 deck triangles were facing the
   * ground. The rides module's critique names the same shape of bug ("every prism's top cap had its
   * normal pointing down") and it survived three rounds there.
   *
   * So the caller never decides. Every builder in this module already writes a real outward normal
   * per vertex — it has to, for the shading — and that normal is the statement of which side is the
   * front. The winding is derived from it, and a triangle too degenerate to have a direction keeps
   * the order it was given.
   */
  tri(s: PoolSurface, a: number, b: number, c: number): void {
    const p = s.positions;
    const ux = p[b * 3] - p[a * 3];
    const uy = p[b * 3 + 1] - p[a * 3 + 1];
    const uz = p[b * 3 + 2] - p[a * 3 + 2];
    const vx = p[c * 3] - p[a * 3];
    const vy = p[c * 3 + 1] - p[a * 3 + 1];
    const vz = p[c * 3 + 2] - p[a * 3 + 2];
    const cx = uy * vz - uz * vy;
    const cy = uz * vx - ux * vz;
    const cz = ux * vy - uy * vx;
    const n = s.normals;
    const nx = n[a * 3] + n[b * 3] + n[c * 3];
    const ny = n[a * 3 + 1] + n[b * 3 + 1] + n[c * 3 + 1];
    const nz = n[a * 3 + 2] + n[b * 3 + 2] + n[c * 3 + 2];
    // FRONT_FACE_SIGN is −1: a front face's cross product points AWAY from the visible side.
    if (cx * nx + cy * ny + cz * nz > 0) s.indices.push(a, c, b);
    else s.indices.push(a, b, c);
  }

  quad(s: PoolSurface, a: number, b: number, c: number, d: number): void {
    this.tri(s, a, b, c);
    this.tri(s, a, c, d);
  }

  done(): { surfaces: PoolSurface[]; triangles: number } {
    const surfaces = [...this.byName.values()].filter((s) => s.indices.length > 0);
    let triangles = 0;
    for (const s of surfaces) triangles += s.indices.length / 3;
    return { surfaces, triangles };
  }
}
