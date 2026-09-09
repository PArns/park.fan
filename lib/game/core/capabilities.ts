/**
 * Capability detection and quality presets. Degrade, never crash: a device with no WebGPU gets
 * WebGL2; a phone gets `low` and a one-line notice; a WebGL1-only device is refused with a
 * readable message rather than a white screen.
 *
 * Read the note on `webgpu` below before changing which engine is chosen. It is not a preference.
 */

import type { Capabilities, QualityPreset, QualitySettings } from './types';

export const QUALITY: Record<QualityPreset, QualitySettings> = {
  low: {
    preset: 'low',
    hardwareScaling: 1.5,
    shadowMapSize: 1024,
    shadowCascades: 2,
    softShadows: false,
    bloom: false,
    ssao: false,
    fxaa: true,
    reflections: 'none',
    particleScale: 0.3,
    foliageDensity: 0.35,
    guestLodDistances: [20, 50, 120],
    maxGuestsDrawn: 600,
  },
  medium: {
    preset: 'medium',
    hardwareScaling: 1.25,
    shadowMapSize: 2048,
    shadowCascades: 3,
    softShadows: false,
    bloom: true,
    ssao: false,
    fxaa: true,
    reflections: 'none',
    particleScale: 0.6,
    foliageDensity: 0.65,
    guestLodDistances: [30, 80, 200],
    maxGuestsDrawn: 1500,
  },
  high: {
    preset: 'high',
    hardwareScaling: 1,
    shadowMapSize: 2048,
    shadowCascades: 4,
    softShadows: true,
    bloom: true,
    ssao: true,
    fxaa: true,
    reflections: 'planar',
    particleScale: 1,
    foliageDensity: 1,
    guestLodDistances: [40, 120, 300],
    maxGuestsDrawn: 3000,
  },
  ultra: {
    preset: 'ultra',
    hardwareScaling: 1,
    shadowMapSize: 4096,
    shadowCascades: 4,
    softShadows: true,
    bloom: true,
    ssao: true,
    fxaa: true,
    reflections: 'ssr',
    particleScale: 1.4,
    foliageDensity: 1.3,
    guestLodDistances: [60, 160, 400],
    maxGuestsDrawn: 4000,
  },
};

export async function detectCapabilities(
  forced: QualityPreset | null,
  engine: 'webgpu' | 'webgl2' | null = null
): Promise<Capabilities> {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  const cores = nav?.hardwareConcurrency ?? 4;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  const narrow =
    typeof window !== 'undefined' && Math.min(window.innerWidth, window.innerHeight) < 600;
  const mobile = coarse && narrow;
  const reducedMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * WebGPU is **opt-in**, and it is opt-in because it is broken here rather than because it is new.
   *
   * ARCHITECTURE.md says "WebGPU first, WebGL2 fallback", and that is still the intent — but the
   * path had never been run. Every screenshot in this project was taken through `?engine=webgl2`,
   * which is what the harness forces, so nobody had looked at what a browser with `navigator.gpu`
   * actually gets. It gets a **black canvas with a working HUD on top of it**: the scene mounts,
   * the simulation runs, the panels fill with real numbers, and the 3D is not drawn at all.
   *
   * The cause is this project's own deep-import rule meeting Babylon's shader store. A material
   * imported deep — `Materials/PBR/pbrMaterial` — pulls in `Shaders/pbr.vertex`, which is GLSL, and
   * nothing pulls `ShadersWGSL/pbr.vertex`. So on a WebGPU engine the store has no WGSL entry for
   * anything the game draws and the effect that would compile it reads `shaderLanguage` off
   * `undefined`: seven identical page errors before the first frame, `terrain` failing to start
   * outright, and then a canvas that stays at `clearColor`.
   *
   * Fixing it means importing the WGSL twin of every shader the game uses — 469 modules live under
   * `ShadersWGSL/` and PBR alone drags a long list of includes. That is real work and it is not
   * done blind: this container's WebGPU is SwiftShader, which also refuses the terrain's 7 MB
   * vertex buffer outright, so a fix cannot be verified here even if it is correct. Until somebody
   * can run it on real hardware, defaulting to WebGPU means handing every Chrome and Edge visitor a
   * black screen, and WebGL2 means handing them the park.
   *
   * `?engine=webgpu` still selects it, so the path stays reachable for exactly that verification.
   */
  let webgpu = false;
  if (engine === 'webgpu' && nav && 'gpu' in nav) {
    try {
      const { WebGPUEngine } = await import('@babylonjs/core/Engines/webgpuEngine');
      webgpu = await WebGPUEngine.IsSupportedAsync;
    } catch {
      webgpu = false;
    }
  }
  let webgl2 = false;
  if (typeof document !== 'undefined') {
    const probe = document.createElement('canvas');
    const context = probe.getContext('webgl2');
    webgl2 = !!context;
    /**
     * Give the probe's context back at once.
     *
     * A browser allows 8–16 live WebGL contexts per document and evicts the oldest when it runs
     * out. This one is created to answer a boolean and then held for the life of the document by
     * the canvas the closure still references, so the engine's own context starts life one slot
     * from the limit — and the symptom of running out is a blank canvas on some later mount, with
     * nothing pointing back here. `scripts/check-game-teardown.mjs` counts contexts per document
     * and is what found it: two created, one engine.
     */
    context?.getExtension('WEBGL_lose_context')?.loseContext();
  }

  let preset: QualityPreset;
  let notice: string | undefined;
  if (forced) {
    preset = forced;
  } else if (mobile) {
    preset = 'low';
    notice = 'mobile';
  } else if (!webgpu && !webgl2) {
    preset = 'low';
    notice = 'webgl1';
  } else if (cores <= 4) {
    preset = 'medium';
    notice = 'cores';
  } else if (webgpu) {
    preset = 'high';
  } else {
    preset = 'high';
  }
  return { webgpu, webgl2, mobile, reducedMotion, cores, dpr, preset, notice };
}
