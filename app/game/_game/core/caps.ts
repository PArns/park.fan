/**
 * What this machine can do, and which preset that buys.
 *
 * Everything here reads a browser global, so nothing in this file runs at module scope — the rule
 * from INTEGRATION.md §5, and the one a green build cannot enforce because the module is only
 * imported on the client until the day somebody imports it from a server file.
 *
 * The probe is deliberately cheap and deliberately conservative. A wrong guess downward costs a
 * little fidelity; a wrong guess upward costs a phone a slideshow, and the brief's own rule is that
 * mobile gets a reduced preset and an honest warning, never a white screen.
 */

import { QUALITY_PRESETS, type GpuCapabilities, type QualityPreset, type QualityTier } from './module';

export interface CapabilityProbe {
  caps: GpuCapabilities;
  /** Non-empty when the browser cannot run the game at all. The route shows this, not a canvas. */
  blockers: string[];
}

function readWebglCaps(): Pick<
  GpuCapabilities,
  'webgl2' | 'maxTextureSize' | 'maxSamples' | 'floatLinearFiltering' | 'instancedArrays' | 'drawBuffers' | 'rendererName'
> {
  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
  if (!gl) {
    return {
      webgl2: false,
      maxTextureSize: 0,
      maxSamples: 0,
      floatLinearFiltering: false,
      instancedArrays: false,
      drawBuffers: false,
      rendererName: 'none',
    };
  }
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const rendererName = debugInfo
    ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
    : String(gl.getParameter(gl.RENDERER));
  const caps = {
    webgl2: true,
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) as number,
    maxSamples: (gl.getParameter(gl.MAX_SAMPLES) as number) ?? 1,
    floatLinearFiltering: gl.getExtension('OES_texture_float_linear') !== null,
    instancedArrays: true,
    drawBuffers: true,
    rendererName,
  };
  // Release the probe context immediately — browsers cap simultaneous contexts at 8–16 and the
  // engine wants one of them.
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return caps;
}

export async function probeCapabilities(): Promise<CapabilityProbe> {
  const webgl = readWebglCaps();

  let webgpu = false;
  try {
    // `IsSupportedAsync` is imported lazily so a browser that never uses it does not pay for the
    // WebGPU shader machinery in the boot chunk.
    const { WebGPUEngine } = await import('@babylonjs/core/Engines/webgpuEngine.js');
    webgpu = await WebGPUEngine.IsSupportedAsync;
  } catch {
    webgpu = false;
  }

  const nav = navigator as Navigator & { deviceMemory?: number };
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  const narrow = typeof innerWidth === 'number' && innerWidth < 900;

  const caps: GpuCapabilities = {
    webgpu,
    webgl2: webgl.webgl2,
    maxTextureSize: webgl.maxTextureSize,
    maxSamples: webgl.maxSamples,
    floatLinearFiltering: webgl.floatLinearFiltering,
    instancedArrays: webgl.instancedArrays,
    drawBuffers: webgl.drawBuffers,
    deviceMemoryGb: nav.deviceMemory ?? 0,
    hardwareConcurrency: navigator.hardwareConcurrency || 4,
    mobile: coarse && narrow,
    rendererName: webgl.rendererName,
  };

  const blockers: string[] = [];
  if (!caps.webgpu && !caps.webgl2) blockers.push('no-webgl2');
  if (typeof Worker === 'undefined') blockers.push('no-worker');
  if (typeof indexedDB === 'undefined') blockers.push('no-indexeddb');

  return { caps, blockers };
}

/**
 * Pick a starting tier from what the probe found.
 *
 * A software renderer is the case worth naming: SwiftShader and llvmpipe both report a healthy
 * WebGL2 with a large max texture size, and they will happily run `ultra` at two frames a second.
 * Both put their name in the renderer string, which is the only signal there is.
 */
export function pickTier(caps: GpuCapabilities): QualityTier {
  if (!caps.webgl2 && !caps.webgpu) return 'potato';

  const renderer = caps.rendererName.toLowerCase();
  const software = /swiftshader|llvmpipe|software|microsoft basic/.test(renderer);
  if (software) return 'potato';
  if (caps.mobile) return 'low';

  const cores = caps.hardwareConcurrency;
  const memory = caps.deviceMemoryGb;
  const integrated = /(intel|uhd|iris|hd graphics|apple m[12] \(|adreno|mali|powervr)/.test(renderer);

  if (caps.webgpu && cores >= 12 && (memory === 0 || memory >= 8) && !integrated) return 'ultra';
  if (cores >= 8 && (memory === 0 || memory >= 8) && !integrated) return 'high';
  if (cores >= 4 && (memory === 0 || memory >= 4)) return 'medium';
  return 'low';
}

/** The tier one step down, for the boot benchmark and the auto-degrade watchdog. */
export function lowerTier(tier: QualityTier): QualityTier {
  const order: QualityTier[] = ['ultra', 'high', 'medium', 'low', 'potato'];
  return order[Math.min(order.length - 1, order.indexOf(tier) + 1)]!;
}

export function presetFor(tier: QualityTier, caps: GpuCapabilities): QualityPreset {
  const preset = { ...QUALITY_PRESETS[tier] };
  // Never ask for more MSAA or a bigger shadow map than the context will give — a silent clamp
  // inside the driver is a frame cost with no visible cause.
  preset.msaaSamples = Math.min(preset.msaaSamples, Math.max(1, caps.maxSamples));
  if (caps.maxTextureSize > 0) {
    preset.shadowMapSize = Math.min(preset.shadowMapSize, caps.maxTextureSize);
  }
  if (!caps.floatLinearFiltering && preset.waterTier > 1) preset.waterTier = 1;
  return preset;
}

/**
 * The honest warning.
 *
 * Returned rather than rendered here, so the UI module decides where it goes. Empty string means
 * there is nothing to say, which is most of the time.
 */
export function qualityNotice(tier: QualityTier, caps: GpuCapabilities): string {
  if (tier === 'potato' && /swiftshader|llvmpipe|software/.test(caps.rendererName.toLowerCase())) {
    return 'Dein Browser rendert ohne Grafikkarte (Software-Renderer). Der Park läuft, aber langsam und in niedrigster Qualität.';
  }
  if (tier === 'potato') return 'Sehr niedrige Qualität — diese Hardware schafft nicht mehr.';
  if (caps.mobile) return 'Mobilgerät erkannt: reduzierte Qualität, weniger Gäste, keine Schatten-Kaskaden.';
  if (tier === 'low') return 'Niedrige Qualität gewählt. In den Einstellungen kannst du höher gehen.';
  return '';
}
