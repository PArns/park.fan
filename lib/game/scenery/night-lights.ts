/**
 * Night lighting for props that declare one: emissive geometry on every copy, and a small pool of
 * real point lights handed to whichever lamps the camera is nearest.
 *
 * Forty lamps in a park is forty real lights, which is forty shadow-free light loops in every
 * fragment of every material near them and a shader recompile every time the count crosses a
 * threshold. So the geometry carries the look — an emissive lens that fades up over dusk — and a
 * pool of four to six lights carries the *effect*, moved to the nearest lamps as the camera flies.
 * A lamp beyond the pool still glows; it just does not light the path.
 *
 * **`renderPriority = -1` is load-bearing.** `PBRMaterial.maxSimultaneousLights` defaults to 4 and
 * a mesh takes the first N of the scene's lights in scene order, not the nearest — so without a
 * priority the pool could push the sun out of a material's light list and a lamp would put the
 * park into darkness at noon. A negative priority sorts these behind the sun and the sky term,
 * and what gets dropped when a material runs out of slots is a lamp, which is the right answer.
 *
 * The four modes are the pack manifest's: `steady`, `chase`, `strobe`, `cycle`.
 */

import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import type { NightLightDef } from '../core/pack-schema';

export interface LightSite {
  id: string;
  x: number;
  y: number;
  z: number;
  def: NightLightDef;
  /** Stable per-site phase so a run of lamps chases in place rather than in step. */
  phase: number;
}

export interface NightRig {
  add(site: LightSite): void;
  remove(id: string): void;
  clear(): void;
  /** `night` is 0..1 from `EnvironmentState`. */
  update(camera: Vector3, night: number, dtSeconds: number): void;
  count(): number;
  active(): number;
  dispose(): void;
}

const POOL_BY_PRESET: Record<string, number> = { low: 0, medium: 2, high: 4, ultra: 6 };
/**
 * The manifest's `intensity` is a designer's number on an arbitrary scale, not a photometric one,
 * and Babylon's `PointLight.intensity` in a PBR scene under ACES is roughly candela. A Victorian
 * lamp declares 9, which put about as much light on the path as the moon did: measured against the
 * `ground` preset at 18:30, a lamp four metres away was invisible on the concrete. 7× reads as a
 * pool of light without blowing the lens out.
 */
const LUMEN_SCALE = 7;

export function createNightRig(scene: Scene, preset: string): NightRig {
  const poolSize = POOL_BY_PRESET[preset] ?? 3;
  const pool: PointLight[] = [];
  for (let i = 0; i < poolSize; i++) {
    const light = new PointLight(`scenery-lamp-${i}`, new Vector3(0, 0, 0), scene);
    light.intensity = 0;
    light.range = 14;
    light.diffuse = new Color3(1, 0.85, 0.65);
    light.specular = new Color3(0.4, 0.34, 0.26);
    light.renderPriority = -1;
    light.setEnabled(false);
    // A lamp lights the ground and the props round it; it never casts shadows. Four cascades of
    // the sun is the shadow budget, and a point-light cube map per lamp is not in it.
    light.shadowEnabled = false;
    pool.push(light);
  }

  const sites = new Map<string, LightSite>();
  const order: string[] = [];
  let time = 0;
  let activeCount = 0;
  let sinceSort = 1;
  let nearest: LightSite[] = [];

  function intensityFor(site: LightSite, night: number): number {
    const mode = site.def.mode ?? 'steady';
    const base = site.def.intensity * LUMEN_SCALE * night;
    if (mode === 'strobe') {
      return (time * 2.6 + site.phase) % 1 < 0.12 ? base * 1.6 : base * 0.06;
    }
    if (mode === 'chase') {
      const wave = 0.5 + 0.5 * Math.sin((time * 2.2 + site.phase) * Math.PI * 2);
      return base * (0.25 + wave * 0.9);
    }
    return base;
  }

  function colourFor(site: LightSite, into: Color3): void {
    const colours = site.def.colors;
    const mode = site.def.mode ?? 'steady';
    if ((mode === 'cycle' || mode === 'chase') && colours && colours.length > 1) {
      const t = (time * 0.18 + site.phase) % 1;
      const scaled = t * colours.length;
      const i = Math.floor(scaled) % colours.length;
      const j = (i + 1) % colours.length;
      const f = scaled - Math.floor(scaled);
      const a = Color3.FromHexString(colours[i]);
      const b = Color3.FromHexString(colours[j]);
      into.set(a.r + (b.r - a.r) * f, a.g + (b.g - a.g) * f, a.b + (b.b - a.b) * f);
      return;
    }
    const c = Color3.FromHexString(site.def.color);
    into.copyFrom(c);
  }

  const scratch = new Color3(1, 1, 1);

  return {
    add(site) {
      if (!sites.has(site.id)) order.push(site.id);
      sites.set(site.id, site);
      sinceSort = 1;
    },
    remove(id) {
      if (!sites.delete(id)) return;
      const at = order.indexOf(id);
      if (at >= 0) order.splice(at, 1);
      sinceSort = 1;
    },
    clear() {
      sites.clear();
      order.length = 0;
      nearest = [];
      for (const light of pool) {
        light.intensity = 0;
        light.setEnabled(false);
      }
    },
    update(camera, night, dtSeconds) {
      time += dtSeconds;
      if (poolSize === 0) return;
      if (night < 0.03) {
        if (activeCount !== 0) {
          for (const light of pool) light.setEnabled(false);
          activeCount = 0;
        }
        return;
      }
      sinceSort += dtSeconds;
      if (sinceSort > 0.5) {
        sinceSort = 0;
        // Insertion order, not Map order over identity keys: two runs of the same park have to
        // pick the same lamps (architecture §1, rule 4).
        const all: LightSite[] = [];
        for (const id of order) {
          const site = sites.get(id);
          if (site) all.push(site);
        }
        all.sort((a, b) => {
          const da = (a.x - camera.x) ** 2 + (a.y - camera.y) ** 2 + (a.z - camera.z) ** 2;
          const db = (b.x - camera.x) ** 2 + (b.y - camera.y) ** 2 + (b.z - camera.z) ** 2;
          return da - db || (a.id < b.id ? -1 : 1);
        });
        nearest = all.slice(0, poolSize);
      }
      activeCount = nearest.length;
      for (let i = 0; i < pool.length; i++) {
        const light = pool[i];
        const site = nearest[i];
        if (!site) {
          if (light.isEnabled()) light.setEnabled(false);
          continue;
        }
        light.position.set(site.x, site.y + (site.def.height ?? 3), site.z);
        light.range = site.def.range ?? 14;
        colourFor(site, scratch);
        light.diffuse.copyFrom(scratch);
        light.specular.set(scratch.r * 0.4, scratch.g * 0.36, scratch.b * 0.3);
        light.intensity = intensityFor(site, night);
        if (!light.isEnabled()) light.setEnabled(true);
      }
    },
    count: () => sites.size,
    active: () => activeCount,
    dispose() {
      for (const light of pool) light.dispose();
      pool.length = 0;
      sites.clear();
      order.length = 0;
    },
  };
}
