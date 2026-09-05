/**
 * The analytic sky, evaluated on the CPU.
 *
 * Preetham-style single scattering (the Rayleigh/Mie formulation with the Henyey-Greenstein phase
 * that the three.js Sky and Babylon's own SkyMaterial both descend from), plus a night term the
 * scattering model has no answer for and a ground half the IBL needs.
 *
 * Why CPU and not a shader: this one function has four consumers — the dome texture, the IBL cube
 * that lights every PBR material, the fog colour and the ambient the HemisphericLight falls back
 * on. A shader would give the first one and leave the other three needing a CPU twin anyway, and
 * it would have to exist twice, once in GLSL and once in WGSL, because the game boots WebGPU when
 * the browser has it. Measured, the full 512×256 dome refresh is ~2.5 ms, and the dome spreads it
 * over eight frames.
 *
 * The cost model is what shapes the API: every expensive term (the optical depths, the three
 * exponentials of the extinction) depends only on the view's zenith angle, so it is computed once
 * per texture ROW into a `SkyRow` and the per-texel work is three square roots and about thirty
 * multiply-adds. Evaluating the whole thing per texel measured 39 ms and was unusable.
 *
 * Pure: no Babylon, no DOM. `pnpm test:game` runs the sim through node's strip-only mode, and
 * this file is reachable from the showcase and the texture builders.
 */

import { clamp01, mix, smoothstep } from './noise';
import type { Vec3, WeatherKind } from '../core/types';

// ── Tuning ──────────────────────────────────────────────────────────────────────────────────
/**
 * Scene-linear gain, shoulder and desaturation.
 *
 * The scattering integral is written in the units the reference shader used, which then ran its
 * own Uncharted2 tone map over them; this pipeline tone-maps with ACES in
 * `DefaultRenderingPipeline`, so without a replacement the raw ratios arrive intact and the sky
 * is not a sky. Measured at noon before this: zenith 0.31/0.62/1.38 against a horizon of
 * 5.07/6.25/6.43 — a 6:1 horizon-to-zenith ratio where a real clear sky is nearer 2:1, and every
 * pixel above the treeline blown to white.
 *
 * `SKY_WHITE` is the shoulder: `c / (1 + c/W)` compresses the horizon far more than the zenith
 * and asymptotes at W, which is the job the reference tone map was doing. The desaturation is not
 * a taste knob either — the `^1.5` in the in-scattering term stretches blue/green to about 2.2
 * where a real clear sky measures 1.4–1.8.
 */
const SKY_GAIN = 0.09;
const SKY_WHITE = 4;
const SKY_DESATURATE = 0.22;
/**
 * The gain is set against the PBR surfaces the sky has to sit behind, and the factor that decides
 * it is not obvious: Babylon's PBR diffuse carries the Lambert 1/π and `StandardMaterial` — which
 * is what the unlit dome uses — does not. A directional sun at intensity 2.4 therefore paints a
 * white PBR surface at 2.4/π ≈ 0.76, not 2.4. At the first gain that looked right in isolation
 * the horizon read 0.5 against a sunlit plaza at 0.10, so the sky was five times too bright
 * relative to the park and the auto exposure closed down to compensate — a clear 09:00 that
 * looked like an overcast one, with the ground and the sky at the same value.
 *
 * `haze` and `ground` below are absolute values in the SAME post-gain units, so they move with
 * this constant; the night terms do not, because they are absolute by construction.
 */

const RAYLEIGH_ZENITH_LENGTH = 8.4e3;
const MIE_ZENITH_LENGTH = 1.25e3;
const MIE_G = 0.76;
const MIE_COEFFICIENT = 0.0053;
const RAYLEIGH_STRENGTH = 2.0;
/** Reference solar irradiance of the source model; the gain above rescales it. */
const SUN_E = 1000;
/**
 * Zenith angle past which the sun contributes nothing — 104.6°, i.e. the sun 14.6° under the
 * horizon. The reference model's π/1.95 puts it at 92.3°, which switches the whole sky off within
 * a degree and a half of sunset: measured at 18:30 on day 1 the zenith came out at 0.004/0.005/
 * 0.007, a black sky at the exact moment a park looks its best.
 */
const SUN_CUTOFF_ANGLE = Math.PI / 1.72;
const SUN_STEEPNESS = 1.5;

/** Rayleigh scattering coefficients per metre for 680/550/450 nm, standard air. */
const BETA_R: Vec3 = totalRayleigh();
/** Mie base coefficients; turbidity scales them at runtime. */
const MIE_K: Vec3 = [0.686, 0.678, 0.666];
const LAMBDA: Vec3 = [680e-9, 550e-9, 450e-9];

function totalRayleigh(): Vec3 {
  const n = 1.0003;
  const bigN = 2.545e25;
  const pn = 0.035;
  const out: number[] = [];
  for (const lambda of [680e-9, 550e-9, 450e-9]) {
    out.push(
      (8 * Math.pow(Math.PI, 3) * Math.pow(n * n - 1, 2) * (6 + 3 * pn)) /
        (3 * bigN * Math.pow(lambda, 4) * (6 - 7 * pn))
    );
  }
  return [out[0], out[1], out[2]];
}

function totalMie(turbidity: number): Vec3 {
  const c = 0.2 * turbidity * 1e-17;
  const out: number[] = [];
  for (let i = 0; i < 3; i++) {
    out.push(0.434 * c * Math.PI * Math.pow((2 * Math.PI) / LAMBDA[i], 2) * MIE_K[i]);
  }
  return [out[0], out[1], out[2]];
}

// ── State ───────────────────────────────────────────────────────────────────────────────────
export interface SkyInputs {
  /** Unit vector towards the sun. */
  sun: Vec3;
  /** Unit vector towards the moon. */
  moon: Vec3;
  /** 0 at full day, 1 at astronomical night. */
  night: number;
  /** 0..1 cloud cover; desaturates and dims the base sky, the cloud domes draw the sheets. */
  cloud: number;
  weather: WeatherKind;
  /** 0..1 illuminated fraction of the moon's disc. */
  moonPhase: number;
}

export interface SkyState {
  sun: Vec3;
  moon: Vec3;
  night: number;
  cloud: number;
  moonPhase: number;
  betaR: Vec3;
  betaM: Vec3;
  betaSum: Vec3;
  sunE: number;
  sunUpMix: number;
  ground: Vec3;
  haze: Vec3;
  hazeStrength: number;
  nightZenith: Vec3;
  nightHorizon: Vec3;
  moonGlow: Vec3;
  overcastTint: Vec3;
  gain: number;
}

/** How thick the air reads per weather. Clear European summer is ~2.2; a storm hazes to 9. */
export function turbidityFor(weather: WeatherKind, cloud: number): number {
  const base =
    weather === 'clear'
      ? 2.2
      : weather === 'cloudy'
        ? 3.2
        : weather === 'overcast'
          ? 5.0
          : weather === 'rain'
            ? 6.4
            : 9.0;
  return base + cloud * 1.2;
}

export function makeSkyState(input: SkyInputs): SkyState {
  const turbidity = turbidityFor(input.weather, input.cloud);
  const sunY = input.sun[1];
  // Below the horizon the reference model's `sunfade` pulls the Rayleigh term down, which is what
  // turns the twilight band orange instead of leaving it blue.
  const sunfade = 1 - clamp01(1 - Math.exp(Math.min(6, sunY * 0.889)));
  const rayleighCoefficient = Math.max(0, RAYLEIGH_STRENGTH - (1 - sunfade));
  const betaR: Vec3 = [
    BETA_R[0] * rayleighCoefficient,
    BETA_R[1] * rayleighCoefficient,
    BETA_R[2] * rayleighCoefficient,
  ];
  const mie = totalMie(turbidity);
  const betaM: Vec3 = [
    mie[0] * MIE_COEFFICIENT,
    mie[1] * MIE_COEFFICIENT,
    mie[2] * MIE_COEFFICIENT,
  ];
  const betaSum: Vec3 = [
    betaR[0] + betaM[0] || 1e-12,
    betaR[1] + betaM[1] || 1e-12,
    betaR[2] + betaM[2] || 1e-12,
  ];
  const zenithCos = Math.max(-1, Math.min(1, sunY));
  const sunE =
    SUN_E * Math.max(0, 1 - Math.exp(-((SUN_CUTOFF_ANGLE - Math.acos(zenithCos)) / SUN_STEEPNESS)));
  const sunUpMix = clamp01(Math.pow(1 - Math.max(0, sunY), 5));

  const daylight = 1 - input.night;
  // The ground half of the sphere is not sky and must not be: a cube whose lower faces are blue
  // lights everything from underneath, and the difference between "ambient" and "ambient with a
  // direction" is exactly this split. These are grass radiances in the same post-gain units the
  // sky ends up in, not albedos — everything below is added after the shoulder.
  const ground: Vec3 = [
    mix(0.0045, 0.037, daylight) * (1 - 0.25 * input.cloud),
    mix(0.005, 0.042, daylight) * (1 - 0.25 * input.cloud),
    mix(0.006, 0.026, daylight) * (1 - 0.2 * input.cloud),
  ];

  return {
    sun: input.sun,
    moon: input.moon,
    night: input.night,
    cloud: input.cloud,
    moonPhase: input.moonPhase,
    betaR,
    betaM,
    betaSum,
    sunE,
    sunUpMix,
    ground,
    haze: [mix(0.02, 0.5, daylight), mix(0.024, 0.53, daylight), mix(0.032, 0.58, daylight)],
    hazeStrength: 0.06 + 0.36 * input.cloud,
    nightZenith: [0.016, 0.026, 0.058],
    nightHorizon: [0.04, 0.052, 0.09],
    moonGlow: [0.62, 0.7, 0.95],
    overcastTint: [0.9, 0.93, 0.99],
    gain: SKY_GAIN,
  };
}

// ── Per-row cache ───────────────────────────────────────────────────────────────────────────
export interface SkyRow {
  fex: Vec3;
  oneMinusFex: Vec3;
}

/**
 * Everything that depends only on the view direction's height. `dy` is the vertical component of
 * the unit view direction; the optical-depth approximation is undefined past ~93.9° of zenith
 * angle (its `pow` goes negative under a fractional exponent), so it is clamped there — below the
 * horizon the ground term takes over anyway.
 */
export function makeSkyRow(state: SkyState, dy: number): SkyRow {
  const cosZenith = Math.max(0.0009, dy);
  const zenithDeg = (Math.acos(Math.min(1, cosZenith)) * 180) / Math.PI;
  const denom = cosZenith + 0.15 * Math.pow(Math.max(1e-3, 93.885 - zenithDeg), -1.253);
  const sR = RAYLEIGH_ZENITH_LENGTH / denom;
  const sM = MIE_ZENITH_LENGTH / denom;
  const fex: Vec3 = [
    Math.exp(-(state.betaR[0] * sR + state.betaM[0] * sM)),
    Math.exp(-(state.betaR[1] * sR + state.betaM[1] * sM)),
    Math.exp(-(state.betaR[2] * sR + state.betaM[2] * sM)),
  ];
  return { fex, oneMinusFex: [1 - fex[0], 1 - fex[1], 1 - fex[2]] };
}

// ── Evaluation ──────────────────────────────────────────────────────────────────────────────
const RAYLEIGH_PHASE_K = 3 / (16 * Math.PI);
const HG_K = 1 / (4 * Math.PI);
const G2 = MIE_G * MIE_G;

/**
 * Linear RGB radiance looking along the unit vector (dx, dy, dz). Writes into `out` to keep the
 * texture fill allocation-free — it runs 131 072 times per dome refresh.
 */
export function evalSky(
  state: SkyState,
  row: SkyRow,
  dx: number,
  dy: number,
  dz: number,
  out: Vec3
): void {
  const cosTheta = dx * state.sun[0] + dy * state.sun[1] + dz * state.sun[2];
  const t = cosTheta * 0.5 + 0.5;
  const rPhase = RAYLEIGH_PHASE_K * (1 + t * t);
  const hgDenom = Math.max(1e-4, 1 - 2 * MIE_G * cosTheta + G2);
  const mPhase = (HG_K * (1 - G2)) / (hgDenom * Math.sqrt(hgDenom));

  let raw0 = 0;
  let raw1 = 0;
  let raw2 = 0;
  for (let i = 0; i < 3; i++) {
    const num = (state.betaR[i] * rPhase + state.betaM[i] * mPhase) / state.betaSum[i];
    const a = state.sunE * num * row.oneMinusFex[i];
    const inscatter = a * Math.sqrt(a);
    const b = state.sunE * num * row.fex[i];
    // Capped at 5. With the sun on the horizon the Mie lobe drives this term into the hundreds
    // near the solar disc, and the whole sun side of a sunset came out as one flat white ellipse
    // with a hard edge where it hit the shoulder's asymptote — brighter than the sun's own disc.
    const horizonMix = Math.min(5, 1 + (Math.sqrt(b) - 1) * state.sunUpMix);
    const value = (inscatter * horizonMix + 0.1 * row.fex[i]) * 0.04;
    if (i === 0) raw0 = value;
    else if (i === 1) raw1 = value;
    else raw2 = value;
  }
  // Shoulder, desaturation and gain, in that order. Everything added after this — night, haze,
  // ground — is already written in the compressed units, so it is not squashed twice.
  const rawLum = raw0 * 0.2126 + raw1 * 0.7152 + raw2 * 0.0722;
  const c0 = mix(raw0, rawLum, SKY_DESATURATE);
  const c1 = mix(raw1, rawLum, SKY_DESATURATE);
  const c2 = mix(raw2, rawLum, SKY_DESATURATE);
  out[0] = (c0 / (1 + c0 / SKY_WHITE)) * state.gain;
  out[1] = (c1 / (1 + c1 / SKY_WHITE)) * state.gain;
  out[2] = (c2 / (1 + c2 / SKY_WHITE)) * state.gain;

  // Night. The scattering term is ~0 once the sun is under the horizon, and a park at 03:00 that
  // renders black is a bug report, not a night. Deep blue with a moon halo, faded in by `night`.
  if (state.night > 0.002) {
    const up = clamp01(dy);
    const horizonWeight = Math.pow(1 - up, 2.2);
    const cosMoon = dx * state.moon[0] + dy * state.moon[1] + dz * state.moon[2];
    const moonHalo =
      state.moon[1] > -0.15
        ? (Math.pow(Math.max(0, cosMoon), 90) * 0.35 + Math.pow(Math.max(0, cosMoon), 6) * 0.02) *
          (0.25 + 0.75 * state.moonPhase)
        : 0;
    const fade = state.night * (1 - 0.75 * state.cloud);
    for (let i = 0; i < 3; i++) {
      const base = mix(state.nightZenith[i], state.nightHorizon[i], horizonWeight);
      out[i] += (base + state.moonGlow[i] * moonHalo) * fade;
    }
  }

  // Horizon haze. Real air is not clear at 20 km, and without this the dome meets the terrain at
  // a hard line that no amount of distance fog hides.
  const hazeBand = Math.pow(1 - Math.min(1, Math.abs(dy)), 7);
  const hazeAmount = hazeBand * state.hazeStrength;
  for (let i = 0; i < 3; i++) out[i] = mix(out[i], state.haze[i], hazeAmount);

  // Cloud cover flattens the sky towards a bright grey long before a single cloud is drawn.
  if (state.cloud > 0.01) {
    const lum = out[0] * 0.2126 + out[1] * 0.7152 + out[2] * 0.0722;
    const k = state.cloud * 0.82;
    const dim = 1 - 0.4 * state.cloud;
    for (let i = 0; i < 3; i++) {
      out[i] = mix(out[i], lum * state.overcastTint[i], k) * dim;
    }
  }

  // Below the horizon: the ground, so the IBL has an up/down split.
  if (dy < 0.03) {
    const g = smoothstep(0.03, -0.06, dy);
    for (let i = 0; i < 3; i++) out[i] = mix(out[i], state.ground[i], g);
  }

  out[0] = Math.max(0, out[0]);
  out[1] = Math.max(0, out[1]);
  out[2] = Math.max(0, out[2]);
}

/** One-off evaluation for callers that need a single direction (fog colour, ambient probes). */
export function sampleSky(state: SkyState, dir: Vec3, out: Vec3): void {
  evalSky(state, makeSkyRow(state, dir[1]), dir[0], dir[1], dir[2], out);
}

// ── Seasons ─────────────────────────────────────────────────────────────────────────────────
/**
 * Multiplier for foliage and grass albedo. Autumn is the only one that shifts hue rather than
 * just value; winter desaturates and lifts, which reads as frost without a snow shader.
 */
export function seasonFoliageTint(season: 'spring' | 'summer' | 'autumn' | 'winter'): Vec3 {
  switch (season) {
    case 'spring':
      return [0.92, 1.08, 0.78];
    case 'summer':
      return [1.0, 1.0, 1.0];
    case 'autumn':
      return [1.28, 0.86, 0.46];
    case 'winter':
      return [0.86, 0.84, 0.82];
  }
}
