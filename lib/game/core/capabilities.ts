/**
 * Capability detection and quality presets. Degrade, never crash: a device with no WebGPU gets
 * WebGL2; a phone gets `low` and a one-line notice; a WebGL1-only device is refused with a
 * readable message rather than a white screen.
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

  let webgpu = false;
  if (engine !== 'webgl2' && nav && 'gpu' in nav) {
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
