/**
 * Everything a camera sees above the horizon: the scattering dome, two cloud sheets, the sun's
 * disc and halo, the moon with its phase, and the stars.
 *
 * The dome is a sphere with hand-built UVs and an HDR equirectangular texture filled from
 * `sky-model.ts`. It is not a shader for one reason that outweighs the rest: the same values have
 * to reach the IBL cube, the fog and the ambient, and a GPU sky would need a CPU twin for those
 * three anyway — and then two of them, since the engine boots WebGPU when the browser offers it
 * and a GLSL `ShaderMaterial` does not compile there without pulling glslang off a CDN at runtime.
 *
 * The refill is chunked. A full 512×256 refresh is ~2.9 ms of scattering plus ~1.6 ms of
 * float→half conversion; done in one frame at every sun step that shows, it is a stutter you can
 * see. `pump()` does 32 rows per call, so a refresh costs ~0.6 ms a frame for eight frames and
 * the sun can move on a 0.35° threshold instead of a 2° one.
 *
 * Clouds are a hemisphere with PLANAR uvs — `u = d.x/(d.y + k)` — rather than the sphere's own
 * lat/long. A cloud sheet on lat/long uvs pinches into a whirlpool at the zenith, exactly where
 * a player looks when they tilt the camera up; the planar projection is the shape a real cloud
 * deck has, and putting it on dome geometry rather than on a disc means there is no rim to keep
 * out of frame.
 */

import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Constants } from '@babylonjs/core/Engines/constants';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3, Quaternion } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import type { Camera } from '@babylonjs/core/Cameras/camera';
import type { QualitySettings, Vec3 } from '../core/types';
import type { Rng } from '../core/rng';
import { evalSky, linearToGamma, makeSkyRow, sampleSky, type SkyState } from './sky-model';
import { floatToHalf } from './half-float';
import { clamp01, mix, smoothstep } from './noise';
import { cloudSheet, moonFace, radialGlow, softDot, sunDisc } from './textures';

const DOME_RADIUS = 900;
const CLOUD_RADIUS = 870;
const STAR_RADIUS = 890;
const BODY_RADIUS = 840;
/** Rows filled per `pump()`. Eight chunks at 512×256; see the file header for the measurement. */
const ROWS_PER_PUMP = 32;
/** Latitude the solar model in `core/sun.ts` uses; the star field turns about the same pole. */
const LATITUDE = (50 * Math.PI) / 180;
const STAR_COUNT = 900;

export interface SkyDomeHandle {
  /** Hand the dome a new sky; it schedules a texture refill if the change is worth one. */
  setState(state: SkyState, force: boolean): void;
  /** Per render frame: scroll the clouds, place the bodies, spend the refill budget. */
  render(dtSeconds: number, camera: Camera | null, state: SkyState): void;
  /** True while a refill is still in flight. */
  refilling(): boolean;
  /** Rebuild the moon's face when the day rolls; the terminator moves a day at a time. */
  setMoonPhase(day: number, phase: number, waxing: boolean): void;
  dispose(): void;
}

interface CloudLayer {
  mesh: Mesh;
  material: StandardMaterial;
  texture: RawTexture;
  scrollU: number;
  scrollV: number;
  speed: number;
  tint: Color3;
}

export function createSkyDome(scene: Scene, quality: QualitySettings, rng: Rng): SkyDomeHandle {
  const big = quality.preset === 'high' || quality.preset === 'ultra';
  const width = big ? 512 : 256;
  const height = big ? 256 : 128;

  // ── Dome ──────────────────────────────────────────────────────────────────────────────────
  const pixels = new Uint16Array(width * height * 4);
  // Alpha is written once: the dome is opaque, and rewriting a quarter of a megabyte of 1.0s on
  // every refresh is a quarter of the upload for nothing.
  const oneHalf = floatToHalf(1);
  for (let i = 3; i < pixels.length; i += 4) pixels[i] = oneHalf;

  const domeTexture = new RawTexture(
    pixels,
    width,
    height,
    Constants.TEXTUREFORMAT_RGBA,
    scene,
    false,
    false,
    Texture.BILINEAR_SAMPLINGMODE,
    Constants.TEXTURETYPE_HALF_FLOAT
  );
  domeTexture.name = 'env-sky';
  domeTexture.wrapU = Texture.WRAP_ADDRESSMODE;
  domeTexture.wrapV = Texture.CLAMP_ADDRESSMODE;

  const domeMaterial = new StandardMaterial('env-sky', scene);
  /**
   * The sky texture goes on **`emissiveTexture`**, not `diffuseTexture`, and the difference is
   * the whole visible sky.
   *
   * With `disableLighting = true` the lighting loop is skipped and `diffuseBase` stays `vec3(0)`.
   * A *diffuse texture* is multiplied into that base, so it is multiplied by nothing: the dome
   * drew pure black at every hour, in every weather, at every sampling mode. It looked exactly
   * like a culled mesh, and a comment on this very line asserted the opposite mechanism — that
   * the emissive term carried the texture — which is what made it survive a round of screenshots
   * being read as "the sky module is broken".
   *
   * Measured rather than reasoned, at 12:00 on the overview camera, sampling the frame's sky band:
   *
   *   diffuseTexture, bilinear ......... (0, 0, 0)
   *   diffuseTexture, NEAREST .......... (0, 0, 0)   so not a filtering problem
   *   diffuseTexture, gammaSpace off ... (0, 0, 0)   nor a double-linearise
   *   diffuseTexture, +70 frames ....... (0, 0, 0)   nor the chunked upload not finishing
   *   no texture, flat red emissive .... (199, 0, 18) so the mesh and material path are fine
   *   emissiveTexture .................. (218, 218, 218)
   *
   * The GPU texture was correct throughout — `readPixels` gave mean 0.117, max 0.298, which are
   * the sky model's own numbers.
   *
   * **The dome is visible now and it is still wrong: a flat achromatic grey, not a sky.** The
   * texture is bound and is not contributing — the frame is `emissiveColor` alone, and the next
   * person should start from these measurements rather than repeat them:
   *
   *   - the output is exactly neutral (R = G = B) while the texture is blue at the zenith, and it
   *     scales linearly with `emissiveColor` (1.0 -> 218, 0.25 -> 41), which is what a sampler
   *     returning 1.0 looks like;
   *   - `#define EMISSIVE`, `#define UV1`, `#define MAINUV1` and `EMISSIVEDIRECTUV 1` are all in
   *     the compiled effect, and `isReadyForSubMesh` is true;
   *   - the mesh's `uv` data is present, full length, and spans 0..1 on both axes;
   *   - overwriting the texture with a known flat blue through `update()` changes the frame by
   *     nothing at all;
   *   - `useEmissiveAsIllumination`, `linkEmissiveWithDiffuse` and turning `disableLighting` off
   *     each change which branch runs and none of them make the texture appear.
   *
   * So it is the RawTexture's sampler rather than the material wiring, and the response was to stop
   * fighting it: the sky is written into **vertex colours** (see `paintDome`), which
   * `default.fragment` multiplies into `baseColor` and which need no sampler at all.
   *
   * **That path is live and it is still not a sky.** The frame was read off a screenshot as "a
   * real gradient, dark at the zenith and brighter toward the horizon", and then measured: the
   * brightest sky row is sRGB **(8, 9, 8)** and every row below it is (0, 0, 0). Eight levels out
   * of 255 is not a gradient, it is black with a rounding error, and the picture said otherwise
   * only because a human eye stretches the bottom of a dark image. Anything claimed about this
   * dome from here on gets a number beside it.
   *
   * The arithmetic that is left: the sky model hands `paintDome` a zenith of 0.117 linear, which
   * through exposure ~1.14 and ACES should land near sRGB 95. It lands at 8. Roughly two stops of
   * that is `SKY_GAIN`, which was calibrated against a frame in which the dome drew nothing at
   * all; the rest is unaccounted for and is the next thing to measure, against a lit surface —
   * sunlit grass in the same frame reads 0.063 linear, and a clear noon sky belongs 2-4x above it,
   * not at zero.
   *
   * That took one more measurement to land. The first attempt painted the colours and changed
   * nothing, because `buildDome` created the colour buffer non-updatable and `updateVerticesData`
   * on a non-updatable buffer is a **silent no-op** — a frame identical to the bug it was meant to
   * fix. The buffer is updatable now and the comment beside it says why.
   *
   * The texture and its chunked fill stay: they cost a few milliseconds a change, they are the
   * obvious source for anything that wants to sample the dome, and they are not what is on screen.
   */
  domeMaterial.emissiveTexture = domeTexture;
  domeMaterial.emissiveColor = new Color3(1, 1, 1);
  domeMaterial.diffuseColor = Color3.Black();
  domeMaterial.specularColor = Color3.Black();
  domeMaterial.disableLighting = true;
  domeMaterial.backFaceCulling = false;
  domeMaterial.metadata = { envOwned: true };

  /**
   * The dome's vertex directions, kept so the sky can be written into VERTEX COLOURS.
   *
   * See the material docblock above for why the texture does not reach the frame. What does reach
   * it is `baseColor`, and with `VERTEXCOLOR` defined — it already is, the builder gave the dome a
   * colour buffer — `default.fragment` multiplies `baseColor.rgb` by `vColor.rgb`. With lighting
   * disabled that makes the whole shading `clamp(emissiveColor) * vertexColour`, i.e. exactly the
   * per-vertex sky, with no sampler in the path at all.
   *
   * 2,993 vertices against 32,768 texels, for what is a smooth gradient: this is the cheaper half
   * of the two as well as the one that works.
   */
  const domeDirs: Vec3[] = [];
  const dome = buildDome(scene, 'env-sky-dome', DOME_RADIUS, 72, 40, Math.PI, (dir) => ({
    u: 0,
    v: 0,
    alpha: 1,
    dir,
  }));
  {
    const pos = dome.getVerticesData(VertexBuffer.PositionKind);
    if (pos) {
      for (let i = 0; i < pos.length; i += 3) {
        const len = Math.hypot(pos[i]!, pos[i + 1]!, pos[i + 2]!) || 1;
        domeDirs.push([pos[i]! / len, pos[i + 1]! / len, pos[i + 2]! / len]);
      }
    }
  }
  const domeColors = new Float32Array(domeDirs.length * 4);
  for (let i = 3; i < domeColors.length; i += 4) domeColors[i] = 1;

  /**
   * Re-evaluate the sky at every dome vertex and push it as vertex colours.
   *
   * The colours are written **gamma-encoded**, not linear, and that is measured rather than
   * assumed. Painting known flat values and reading the frame back gives the chain's transfer
   * curve:
   *
   *   painted 0.117 -> sRGB   9      painted 0.5 -> sRGB 102
   *   painted 0.25  -> sRGB  32      painted 1.0 -> sRGB 217
   *
   * A linear vertex colour through exposure ~1.14 and ACES would put 0.5 near sRGB 187; it lands
   * at 102, which is what an extra ~2.2 power looks like. So the pipeline treats this buffer as
   * gamma space and linearises it, and handing it linear radiance squares the darkness — the sky
   * model's 0.117 zenith arrived as sRGB 8, indistinguishable from black, which is exactly what
   * the frame showed and what a screenshot read as "a dark gradient".
   */
  function paintDome(state: SkyState): void {
    const c: Vec3 = [0, 0, 0];
    const d: Vec3 = [0, 0, 0];
    for (let v = 0; v < domeDirs.length; v++) {
      const dir = domeDirs[v]!;
      if (dir[1] < 0) {
        // Below the horizon the dome is HAZE, not ground — the azimuth's own horizon colour,
        // carried straight down. Aerial perspective is why: land seen at a grazing angle is
        // looked at through so much air that it converges on the horizon sky, which is also the
        // colour distance fog takes the terrain to, so the terrain's far edge dissolves into the
        // dome instead of meeting it at a step. The IBL still gets a real ground hemisphere; it
        // asks for it with `groundBlend` left at 1.
        const h = Math.hypot(dir[0], dir[2]) || 1;
        d[0] = dir[0] / h;
        d[1] = 0;
        d[2] = dir[2] / h;
        sampleSky(state, d, c, 0);
      } else {
        sampleSky(state, dir, c, 0);
      }
      domeColors[v * 4] = linearToGamma(c[0]);
      domeColors[v * 4 + 1] = linearToGamma(c[1]);
      domeColors[v * 4 + 2] = linearToGamma(c[2]);
    }
    dome.updateVerticesData(VertexBuffer.ColorKind, domeColors, false, false);
  }
  dome.material = domeMaterial;
  makeCelestial(dome);

  // ── Clouds ────────────────────────────────────────────────────────────────────────────────
  const clouds: CloudLayer[] = [];
  for (const spec of [
    { kind: 'cumulus' as const, k: 0.1, scale: 0.42, speed: 0.0042, seed: 11 },
    { kind: 'cirrus' as const, k: 0.16, scale: 0.24, speed: 0.0019, seed: 47 },
  ]) {
    const mesh = buildDome(
      scene,
      `env-cloud-${spec.kind}`,
      CLOUD_RADIUS,
      96,
      34,
      Math.PI / 2,
      (dir) => {
        const denom = dir[1] + spec.k;
        return {
          u: (dir[0] / denom) * spec.scale,
          v: (dir[2] / denom) * spec.scale,
          alpha: smoothstep(0.012, 0.115, dir[1]),
          dir,
        };
      }
    );
    const texture = cloudSheet(scene, spec.kind, spec.seed);
    const material = new StandardMaterial(`env-cloud-${spec.kind}`, scene);
    material.diffuseTexture = texture;
    material.useAlphaFromDiffuseTexture = true;
    // Emissive carries the tint — see the note on the dome's material.
    material.emissiveColor = new Color3(1, 1, 1);
    material.diffuseColor = Color3.Black();
    material.specularColor = Color3.Black();
    material.disableLighting = true;
    material.backFaceCulling = false;
    material.alphaMode = Constants.ALPHA_COMBINE;
    material.metadata = { envOwned: true };
    mesh.material = material;
    mesh.hasVertexAlpha = true;
    makeCelestial(mesh);
    mesh.alphaIndex = spec.kind === 'cirrus' ? 3 : 4;
    clouds.push({
      mesh,
      material,
      texture,
      scrollU: 0,
      scrollV: 0,
      speed: spec.speed,
      tint: new Color3(1, 1, 1),
    });
  }

  // ── Sun, halo, moon ───────────────────────────────────────────────────────────────────────
  const sunTexture = sunDisc(scene);
  const sunMaterial = unlit(scene, 'env-sun', sunTexture);
  const sunMesh = CreatePlane('env-sun', { size: 34 }, scene);
  sunMesh.material = sunMaterial;
  makeBillboard(sunMesh, 1);

  const haloTexture = radialGlow(scene, 'env-sun-halo', 3.4);
  const haloMaterial = unlit(scene, 'env-sun-halo', haloTexture);
  haloMaterial.alphaMode = Constants.ALPHA_ADD;
  const haloMesh = CreatePlane('env-sun-halo', { size: 300 }, scene);
  haloMesh.material = haloMaterial;
  makeBillboard(haloMesh, 0);

  let moonTexture = moonFace(scene, 0.5, true, 3);
  const moonMaterial = unlit(scene, 'env-moon', moonTexture);
  const moonMesh = CreatePlane('env-moon', { size: 26 }, scene);
  moonMesh.material = moonMaterial;
  makeBillboard(moonMesh, 2);
  let moonDay = -1;

  // ── Stars ─────────────────────────────────────────────────────────────────────────────────
  const starTexture = softDot(scene, 'env-star', 32, 2.6);
  const starMaterial = new StandardMaterial('env-star', scene);
  starMaterial.diffuseTexture = starTexture;
  starMaterial.useAlphaFromDiffuseTexture = true;
  starMaterial.emissiveColor = new Color3(1, 1, 1);
  starMaterial.diffuseColor = Color3.Black();
  starMaterial.specularColor = Color3.Black();
  starMaterial.disableLighting = true;
  starMaterial.backFaceCulling = false;
  starMaterial.alphaMode = Constants.ALPHA_ADD;
  starMaterial.metadata = { envOwned: true };
  const stars = buildStarField(scene, rng, STAR_RADIUS);
  stars.material = starMaterial;
  stars.hasVertexAlpha = true;
  makeCelestial(stars);
  stars.alphaIndex = 2;
  const poleAxis = new Vector3(0, Math.sin(LATITUDE), -Math.cos(LATITUDE));
  stars.rotationQuaternion = Quaternion.Identity();

  // ── Refill state ──────────────────────────────────────────────────────────────────────────
  let fillState: SkyState | null = null;
  let fillRow = height;
  let lastKey = '';
  const rgb: Vec3 = [0, 0, 0];

  function stateKey(s: SkyState): string {
    // A refresh threshold in the sun's own terms: 0.35° of movement, 2.5 % of cloud, 2 % of night.
    return [
      Math.round(s.sun[0] * 164),
      Math.round(s.sun[1] * 164),
      Math.round(s.sun[2] * 164),
      Math.round(s.cloud * 40),
      Math.round(s.night * 50),
      Math.round(s.betaM[0] * 1e8),
    ].join(',');
  }

  function setState(state: SkyState, force: boolean): void {
    const key = stateKey(state);
    if (!force && key === lastKey) return;
    lastKey = key;
    // The vertex colours are the sky the camera actually sees; the texture fill below stays for
    // the day it works and for anything that wants to sample the dome.
    paintDome(state);
    fillState = state;
    fillRow = 0;
    if (force) {
      // A time-of-day jump (the harness, or the player's clock) must not be watched crossfading
      // row by row: pay the whole 4.5 ms once.
      while (fillRow < height) pump();
    }
  }

  function pump(): void {
    if (!fillState || fillRow >= height) return;
    const end = Math.min(height, fillRow + ROWS_PER_PUMP);
    for (let y = fillRow; y < end; y++) {
      const v = (y + 0.5) / height;
      const theta = (1 - v) * Math.PI;
      const dy = Math.cos(theta);
      const sinTheta = Math.sin(theta);
      const row = makeSkyRow(fillState, dy);
      let i = y * width * 4;
      for (let x = 0; x < width; x++) {
        const phi = ((x + 0.5) / width) * Math.PI * 2;
        evalSky(fillState, row, sinTheta * Math.cos(phi), dy, sinTheta * Math.sin(phi), rgb);
        pixels[i] = floatToHalf(rgb[0]);
        pixels[i + 1] = floatToHalf(rgb[1]);
        pixels[i + 2] = floatToHalf(rgb[2]);
        i += 4;
      }
    }
    fillRow = end;
    if (fillRow >= height) {
      domeTexture.update(pixels);
      fillState = null;
    }
  }

  // ── Per frame ─────────────────────────────────────────────────────────────────────────────
  const tmp = new Vector3();
  function render(dt: number, camera: Camera | null, state: SkyState): void {
    pump();

    const wind = 1 + state.cloud * 0.6;
    for (const layer of clouds) {
      layer.scrollU += layer.speed * wind * dt;
      layer.scrollV += layer.speed * wind * dt * 0.35;
      layer.texture.uOffset = layer.scrollU;
      layer.texture.vOffset = layer.scrollV;
    }

    // Cloud tint: sunlit tops when the sun is up, sky-lit when it is not. Capped at 1 because
    // `StandardMaterial` clamps its diffuse factor — clouds are the one thing here that does not
    // need to exceed the tone mapper's white.
    const sunUp = clamp01(state.sun[1] * 3);
    const sunTint = sunColorFor(state);
    for (let i = 0; i < clouds.length; i++) {
      const layer = clouds[i];
      const high = i === 1;
      const lit = mix(0.42, 0.96, sunUp) * (1 - 0.28 * state.cloud) * (high ? 1.05 : 1);
      const warm = mix(1, 0.55, sunUp);
      layer.tint.set(
        clamp01(lit * mix(1, sunTint[0], warm * 0.8) + 0.045 * state.night),
        clamp01(lit * mix(1, sunTint[1], warm * 0.8) + 0.05 * state.night),
        clamp01(lit * mix(1, sunTint[2], warm * 0.6) + 0.075 * state.night)
      );
      layer.material.emissiveColor.copyFrom(layer.tint);
      const coverage = high
        ? smoothstep(0.05, 0.55, state.cloud) * 0.75
        : smoothstep(0.03, 0.85, state.cloud);
      layer.material.alpha = clamp01(coverage);
      layer.mesh.setEnabled(layer.material.alpha > 0.01);
    }

    const cam = camera ?? scene.activeCamera;
    const eye = cam ? cam.globalPosition : Vector3.ZeroReadOnly;

    // Sun disc and halo. `sunColorFor` is the same blackbody ramp `core/sun.ts` drives the
    // directional light with, so the disc and the light it casts cannot disagree.
    const sunVisible = state.sun[1] > -0.06 && state.cloud < 0.97;
    sunMesh.setEnabled(sunVisible);
    haloMesh.setEnabled(sunVisible);
    if (sunVisible) {
      tmp.set(state.sun[0], state.sun[1], state.sun[2]).scaleInPlace(BODY_RADIUS).addInPlace(eye);
      sunMesh.position.copyFrom(tmp);
      haloMesh.position.copyFrom(tmp);
      const horizonDim = smoothstep(-0.06, 0.06, state.sun[1]);
      const clear = 1 - clamp01(state.cloud * 1.05);
      const discPower = 26 * horizonDim * mix(0.25, 1, clear);
      (sunMesh.material as PBRMaterial).albedoColor.set(
        sunTint[0] * discPower,
        sunTint[1] * discPower,
        sunTint[2] * discPower
      );
      const haloPower = 0.5 * horizonDim * mix(0.2, 1, clear) * (0.5 + 0.5 * (1 - state.sun[1]));
      (haloMesh.material as PBRMaterial).albedoColor.set(
        sunTint[0] * haloPower,
        sunTint[1] * haloPower * 0.92,
        sunTint[2] * haloPower * 0.8
      );
    }

    const moonVisible = state.moon[1] > -0.04 && state.night > 0.02 && state.cloud < 0.9;
    moonMesh.setEnabled(moonVisible);
    if (moonVisible) {
      tmp
        .set(state.moon[0], state.moon[1], state.moon[2])
        .scaleInPlace(BODY_RADIUS)
        .addInPlace(eye);
      moonMesh.position.copyFrom(tmp);
      const brightness =
        1.15 * state.night * (0.2 + 0.8 * state.moonPhase) * (1 - clamp01(state.cloud * 1.1));
      (moonMesh.material as PBRMaterial).albedoColor.set(
        brightness,
        brightness * 0.99,
        brightness * 0.95
      );
    }

    // Steeper than `night` itself: core calls it night from about 1.5° below the horizon, where
    // the western sky is still bright enough that a star field over it reads as dirt on the lens.
    starMaterial.alpha = clamp01(state.night * 1.7 - 0.62) * (1 - clamp01(state.cloud * 1.15));
    stars.setEnabled(starMaterial.alpha > 0.01);
    if (stars.isEnabled()) {
      // The field turns about the celestial pole with the sun's own azimuth, so it tracks park
      // time rather than wall time — at speed 100 the sky wheels, at speed 0 it holds still.
      const angle = Math.atan2(state.sun[0], -state.sun[2]);
      Quaternion.RotationAxisToRef(poleAxis, angle, stars.rotationQuaternion as Quaternion);
    }
  }

  function setMoonPhase(day: number, phase: number, waxing: boolean): void {
    if (day === moonDay) return;
    moonDay = day;
    const next = moonFace(scene, phase, waxing, 3);
    moonMaterial.albedoTexture = next;
    moonTexture.dispose();
    moonTexture = next;
  }

  return {
    setState(state, force) {
      setState(state, force);
    },
    render,
    refilling: () => fillRow < height,
    setMoonPhase,
    dispose() {
      dome.dispose();
      domeMaterial.dispose();
      domeTexture.dispose();
      for (const layer of clouds) {
        layer.mesh.dispose();
        layer.material.dispose();
        layer.texture.dispose();
      }
      sunMesh.dispose();
      sunMaterial.dispose();
      sunTexture.dispose();
      haloMesh.dispose();
      haloMaterial.dispose();
      haloTexture.dispose();
      moonMesh.dispose();
      moonMaterial.dispose();
      moonTexture.dispose();
      stars.dispose();
      starMaterial.dispose();
      starTexture.dispose();
    },
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────────────────────
/** Blackbody ramp by elevation, matching `computeEnvironment`'s so disc and light agree. */
function sunColorFor(state: SkyState): Vec3 {
  const el = clamp01(state.sun[1]);
  const warm: Vec3 = [1.0, 0.52, 0.22];
  const noon: Vec3 = [1.0, 0.97, 0.93];
  const t = Math.pow(clamp01(el * 3.2), 0.62);
  return [mix(warm[0], noon[0], t), mix(warm[1], noon[1], t), mix(warm[2], noon[2], t)];
}

function unlit(scene: Scene, name: string, texture: Texture): PBRMaterial {
  const material = new PBRMaterial(name, scene);
  material.unlit = true;
  material.albedoTexture = texture;
  material.useAlphaFromAlbedoTexture = true;
  material.albedoColor = new Color3(1, 1, 1);
  material.backFaceCulling = false;
  material.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
  material.metadata = { envOwned: true };
  return material;
}

function makeCelestial(mesh: Mesh): void {
  mesh.infiniteDistance = true;
  mesh.applyFog = false;
  mesh.isPickable = false;
  mesh.receiveShadows = false;
  mesh.doNotSyncBoundingInfo = true;
  mesh.alwaysSelectAsActiveMesh = true;
}

function makeBillboard(mesh: Mesh, alphaIndex: number): void {
  mesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
  mesh.applyFog = false;
  mesh.isPickable = false;
  mesh.receiveShadows = false;
  mesh.alwaysSelectAsActiveMesh = true;
  mesh.alphaIndex = alphaIndex;
}

interface DomeVertex {
  u: number;
  v: number;
  alpha: number;
  dir: Vec3;
}

/**
 * A sphere (or a cap of one) with UVs and vertex alpha supplied by the caller.
 *
 * `CreateSphere` would do for the geometry, but its UVs are lat/long and the cloud layers need a
 * planar projection — and the dome needs its v to run bottom-to-top to match the texture fill.
 * One builder for both keeps those two conventions in one place.
 */
function buildDome(
  scene: Scene,
  name: string,
  radius: number,
  slices: number,
  stacks: number,
  maxTheta: number,
  vertexFn: (dir: Vec3) => DomeVertex
): Mesh {
  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const cap = maxTheta < Math.PI - 1e-3;
  for (let j = 0; j <= stacks; j++) {
    // A cloud cap needs its rings bunched near the horizon, where the planar projection changes
    // fastest and a linear interpolation across a big triangle bends the sheet.
    const t = j / stacks;
    const theta = cap ? maxTheta * Math.pow(t, 0.62) : maxTheta * t;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    for (let i = 0; i <= slices; i++) {
      const phi = (i / slices) * Math.PI * 2;
      const dir: Vec3 = [sinTheta * Math.cos(phi), cosTheta, sinTheta * Math.sin(phi)];
      positions.push(dir[0] * radius, dir[1] * radius, dir[2] * radius);
      if (cap) {
        const vtx = vertexFn(dir);
        uvs.push(vtx.u, vtx.v);
        colors.push(1, 1, 1, vtx.alpha);
      } else {
        uvs.push(i / slices, 1 - j / stacks);
        colors.push(1, 1, 1, 1);
      }
    }
  }
  for (let j = 0; j < stacks; j++) {
    for (let i = 0; i < slices; i++) {
      const a = j * (slices + 1) + i;
      const b = a + slices + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const data = new VertexData();
  data.positions = positions;
  data.uvs = uvs;
  data.indices = indices;
  data.colors = colors;
  const mesh = new Mesh(name, scene);
  data.applyToMesh(mesh, false);
  // Updatable: the dome rewrites this buffer every time the sky changes (see `paintDome`), and
  // `updateVerticesData` on a non-updatable buffer is a silent no-op — it cost a round of
  // screenshots that looked identical to the bug they were meant to fix.
  mesh.setVerticesData(VertexBuffer.ColorKind, colors, true, 4);
  return mesh;
}

/**
 * The star field as one mesh of camera-facing quads.
 *
 * Baking stars into the dome texture was the obvious alternative and is what made it not work:
 * at 512×256 a star is one texel wide, bilinear filtering smears it over 35 screen pixels and
 * the night sky comes out with grey smudges instead of points.
 */
function buildStarField(scene: Scene, rng: Rng, radius: number): Mesh {
  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const up = new Vector3(0, 1, 0);
  const side = new Vector3(1, 0, 0);
  const dir = new Vector3();
  const tangent = new Vector3();
  const bitangent = new Vector3();
  for (let s = 0; s < STAR_COUNT; s++) {
    // Uniform on the sphere; the lower half is culled by the terrain and costs nothing to keep,
    // and keeping it means the field still fills the sky as it rotates.
    const z = rng.range(-1, 1);
    const r = Math.sqrt(Math.max(0, 1 - z * z));
    const phi = rng.range(0, Math.PI * 2);
    dir.set(r * Math.cos(phi), z, r * Math.sin(phi));
    Vector3.CrossToRef(dir, Math.abs(z) > 0.95 ? side : up, tangent);
    tangent.normalize();
    Vector3.CrossToRef(dir, tangent, bitangent);

    // Magnitudes: a few bright ones carry the constellations, the rest are the wash behind them.
    const mag = Math.pow(rng.next(), 3.1);
    const size = mix(1.7, 7.4, mag);
    const brightness = mix(0.22, 1, mag);
    // Blue-white to amber, weighted to the cool end like a real field.
    const warmth = Math.pow(rng.next(), 2.2);
    const cr = mix(0.78, 1, warmth);
    const cg = mix(0.86, 0.93, warmth);
    const cb = mix(1, 0.78, warmth);

    const base = positions.length / 3;
    for (const [su, sv] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      positions.push(
        dir.x * radius + tangent.x * su * size + bitangent.x * sv * size,
        dir.y * radius + tangent.y * su * size + bitangent.y * sv * size,
        dir.z * radius + tangent.z * su * size + bitangent.z * sv * size
      );
      uvs.push((su + 1) * 0.5, (sv + 1) * 0.5);
      colors.push(cr, cg, cb, brightness);
    }
    indices.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
  }
  const data = new VertexData();
  data.positions = positions;
  data.uvs = uvs;
  data.indices = indices;
  data.colors = colors;
  const mesh = new Mesh('env-stars', scene);
  data.applyToMesh(mesh, false);
  // Updatable: the dome rewrites this buffer every time the sky changes (see `paintDome`), and
  // `updateVerticesData` on a non-updatable buffer is a silent no-op — it cost a round of
  // screenshots that looked identical to the bug they were meant to fix.
  mesh.setVerticesData(VertexBuffer.ColorKind, colors, true, 4);
  return mesh;
}
