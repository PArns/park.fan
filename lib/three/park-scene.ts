/**
 * park-scene.ts
 * -------------
 * A self-contained, semi-realistic **amusement park** built in pure three.js —
 * a Disney-World-style castle, a turning Ferris wheel, a spinning carousel, a
 * swing ride, teacups, a roller coaster with a train on its track, a lake,
 * striped tents, food stalls, lanterns, fences, flower beds, trees, drifting
 * clouds, floating balloons and strolling visitors. It powers the homepage hero
 * background (see `components/layout/hero-three-park.tsx`).
 *
 * Realism comes from a hybrid texturing approach:
 *  - **Photographic CC0 PBR textures** (ambientCG, public domain) for the big
 *    surfaces — grass, paving, castle stone, wood. Generated/downscaled by
 *    `scripts/fetch-hero-textures.mjs` into `public/textures/hero/` and loaded
 *    here as albedo + normal + roughness maps.
 *  - **Procedural canvas textures** for accents — the sky gradient, candy
 *    stripes and the animated water normal map.
 *  - **Image-based lighting** via a PMREM-prefiltered RoomEnvironment, so metal
 *    and glossy surfaces get believable reflections.
 *  - **Bloom post-processing** (EffectComposer) so lights and the night-time
 *    "lights-on" emissive look actually glow.
 *
 * Design goals
 *  - **Decorative, not interactive.** A slow drone-style camera auto-flies a
 *    closed loop through the park behind the hero card.
 *  - **Theme-aware.** `setTheme()` swaps sky, lighting, lamp glow, water color
 *    and bloom strength between a sunny day and a magical night.
 *  - **Cheap-ish.** Capped DPR, one shadow-casting light, instanced props,
 *    async texture loads (the scene renders immediately, textures pop in).
 *    Honors `prefers-reduced-motion` by rendering a single static frame.
 *  - **Leak-free.** `dispose()` frees geometries, materials, textures, the
 *    env map, the composer and the renderer, and removes its listeners.
 *
 * Imported only by a `ssr:false` dynamic component, so the heavy three.js
 * bundle is code-split into its own chunk and never touches SSR or the LCP.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export type SceneTheme = 'light' | 'dark';

export interface ParkSceneHandle {
  /** Re-fit renderer + camera + composer to a new pixel size of the host. */
  resize: (width: number, height: number) => void;
  /** Swap day/night look (sky, lights, lamp glow, water, bloom). */
  setTheme: (theme: SceneTheme) => void;
  /** Stop the loop and free all GPU resources + listeners. */
  dispose: () => void;
}

interface CreateOptions {
  theme: SceneTheme;
  /** When true: build the scene, render ONE frame, never start the loop. */
  reducedMotion: boolean;
}

/** An object in the scene that animates itself each frame. */
interface Animated {
  group: THREE.Object3D;
  update: (elapsed: number, delta: number) => void;
}

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

const DAY = {
  skyTop: '#5fb4f0',
  skyBottom: '#cde6ff',
  fog: '#cfe9ff',
  hemiSky: 0xbfe3ff,
  hemiGround: 0x8fae7f,
  sun: 0xfff4d6,
  sunIntensity: 2.4,
  ambient: 0x9fc3e8,
  ambientIntensity: 0.4,
  envIntensity: 1.0,
  emissive: 0.0,
  water: 0x2f9fd0,
  lampIntensity: 0,
  bloomStrength: 0.16,
  bloomThreshold: 0.82,
};

const NIGHT = {
  skyTop: '#070d29',
  skyBottom: '#3a2a63',
  fog: '#1c1640',
  hemiSky: 0x32407a,
  hemiGround: 0x241a3a,
  sun: 0xaab4ff,
  sunIntensity: 0.5,
  ambient: 0x5060a0,
  ambientIntensity: 0.35,
  envIntensity: 0.35,
  emissive: 1.0,
  water: 0x16324a,
  lampIntensity: 14,
  bloomStrength: 0.9,
  bloomThreshold: 0.0,
};

type Palette = typeof DAY;

// Cheerful, candy-bright object colors (shared across themes; the night look
// comes from emissive glow rather than recoloring).
const C = {
  stoneLight: 0xfff0e6,
  stoneBlue: 0xdfe9ff,
  roofPink: 0xff7eb6,
  roofBlue: 0x4cc4ff,
  roofPurple: 0xb57bff,
  roofTeal: 0x33d6c0,
  gold: 0xffd166,
  flagRed: 0xff5d6c,
  flagYellow: 0xffd166,
  flagBlue: 0x5db8ff,
  coaster: 0xff4d8d,
  coasterSupport: 0xffc93c,
  leaf: 0x4fbf5f,
  leafDark: 0x3a9e4c,
} as const;

const GONDOLA_COLORS = [0xff5d6c, 0xffd166, 0x5db8ff, 0x8be04e, 0xb57bff, 0xff9f43];
const BALLOON_COLORS = [0xff5d6c, 0xffd166, 0x5db8ff, 0x8be04e, 0xb57bff, 0xff7eb6, 0x33d6c0];
const FLOWER_COLORS = [0xff5d6c, 0xffd166, 0xff7eb6, 0xb57bff, 0xff9f43, 0xffffff];
const VISITOR_COLORS = [0xff5d6c, 0x5db8ff, 0x8be04e, 0xffd166, 0xb57bff, 0xff7eb6, 0xff9f43];

// ---------------------------------------------------------------------------
// Procedural texture helpers (accents; the big surfaces use loaded PBR maps)
// ---------------------------------------------------------------------------

/** Vertical two-stop gradient used as the scene background (a stylized sky). */
function makeSkyTexture(top: string, bottom: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Vertical candy stripes with soft shaded edges — tents & the carousel roof. */
function makeStripeTexture(colorA: string, colorB: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;
  const stripes = 8;
  const w = canvas.width / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? colorA : colorB;
    ctx.fillRect(i * w, 0, w + 1, canvas.height);
    // subtle vertical shading inside each stripe for a fabric-like roundness
    const g = ctx.createLinearGradient(i * w, 0, (i + 1) * w, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.16)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.12)');
    g.addColorStop(1, 'rgba(0,0,0,0.16)');
    ctx.fillStyle = g;
    ctx.fillRect(i * w, 0, w + 1, canvas.height);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** A tileable ripple normal map for the lake, built from summed sine waves. */
function makeWaterNormal(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const TAU = Math.PI * 2;
  const height = (x: number, y: number) => {
    const u = (x / size) * TAU;
    const v = (y / size) * TAU;
    return Math.sin(u * 3 + v) * 0.5 + Math.sin(v * 4 - u * 2) * 0.3 + Math.sin((u + v) * 2) * 0.2;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Central-difference gradient → tangent-space normal.
      const hx = height((x + 1) % size, y) - height((x - 1 + size) % size, y);
      const hy = height(x, (y + 1) % size) - height(x, (y - 1 + size) % size);
      const nx = -hx * 0.5;
      const ny = -hy * 0.5;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz);
      const idx = (y * size + x) * 4;
      img.data[idx] = ((nx / len) * 0.5 + 0.5) * 255;
      img.data[idx + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      img.data[idx + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ---------------------------------------------------------------------------
// Resource tracking — every geometry/material/texture is registered so
// dispose() can free them in one pass (three.js does not GC GPU memory).
// ---------------------------------------------------------------------------

class Tracker {
  readonly geometries = new Set<THREE.BufferGeometry>();
  readonly materials = new Set<THREE.Material>();
  readonly textures = new Set<THREE.Texture>();

  geo<T extends THREE.BufferGeometry>(g: T): T {
    this.geometries.add(g);
    return g;
  }
  mat<T extends THREE.Material>(m: T): T {
    this.materials.add(m);
    return m;
  }
  tex<T extends THREE.Texture>(t: T): T {
    this.textures.add(t);
    return t;
  }
  disposeAll() {
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.textures.forEach((t) => t.dispose());
    this.geometries.clear();
    this.materials.clear();
    this.textures.clear();
  }
}

// ---------------------------------------------------------------------------
// Build context — shared factories, materials and registries passed to builders
// ---------------------------------------------------------------------------

type MatFactory = (params: THREE.MeshStandardMaterialParameters) => THREE.MeshStandardMaterial;
type LitFactory = (
  params: THREE.MeshStandardMaterialParameters,
  glow?: number
) => THREE.MeshStandardMaterial;

interface PbrMaps {
  map: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
}

interface BuildCtx {
  track: Tracker;
  /** Non-emissive standard material with sensible env defaults. */
  plain: MatFactory;
  /** Emissive material registered for the night "lights-on" pass. */
  lit: LitFactory;
  /** Shared loaded PBR map sets, keyed by surface. */
  pbr: Record<'grass' | 'paving' | 'stone' | 'wood', PbrMaps>;
  /** Point lights that switch on at night (lanterns). */
  lampLights: THREE.PointLight[];
  /** Lake water material handle (recolored on theme change). */
  registerWater: (m: THREE.MeshStandardMaterial) => void;
}

// ---------------------------------------------------------------------------
// Scene factory
// ---------------------------------------------------------------------------

export function createParkScene(canvas: HTMLCanvasElement, opts: CreateOptions): ParkSceneHandle {
  const track = new Tracker();
  let theme = opts.theme;
  let palette: Palette = theme === 'dark' ? NIGHT : DAY;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  const initialW = canvas.clientWidth || 1280;
  const initialH = canvas.clientHeight || 600;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  renderer.setPixelRatio(dpr);
  renderer.setSize(initialW, initialH, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // -- Image-based lighting: prefilter a RoomEnvironment for soft reflections.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const envRT = pmrem.fromScene(roomEnv, 0.04);
  roomEnv.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = mesh.material;
    if (mat) (Array.isArray(mat) ? mat : [mat]).forEach((m) => m.dispose());
  });
  pmrem.dispose();

  const scene = new THREE.Scene();
  scene.environment = envRT.texture;
  let skyTex = track.tex(makeSkyTexture(palette.skyTop, palette.skyBottom));
  scene.background = skyTex;
  scene.fog = new THREE.Fog(palette.fog, 58, 140);

  const camera = new THREE.PerspectiveCamera(50, initialW / initialH, 0.1, 400);
  camera.position.set(0, 9, 40);
  camera.lookAt(0, 6, -6);

  // -- Flying camera: a drone-style closed loop roaming through the bigger park,
  // always aiming at a wandering target so an attraction stays framed.
  const flightPath = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, 9, 44),
      new THREE.Vector3(27, 7, 25),
      new THREE.Vector3(40, 13, -5),
      new THREE.Vector3(20, 18, -33),
      new THREE.Vector3(-20, 19, -33),
      new THREE.Vector3(-40, 12, -3),
      new THREE.Vector3(-27, 7, 27),
    ],
    true,
    'catmullrom',
    0.5
  );
  const lookPath = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, 6, 6),
      new THREE.Vector3(16, 9, -12),
      new THREE.Vector3(2, 11, -22),
      new THREE.Vector3(-16, 5, 1),
      new THREE.Vector3(-4, 5, 12),
    ],
    true,
    'catmullrom',
    0.5
  );
  const LAP_SECONDS = 50;
  const camPos = new THREE.Vector3();
  const camTarget = new THREE.Vector3();

  // -- Post-processing: bloom so lights and emissive surfaces glow.
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(dpr);
  composer.setSize(initialW, initialH);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(initialW, initialH),
    palette.bloomStrength,
    0.5,
    palette.bloomThreshold
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // -- Lights -------------------------------------------------------------
  const hemi = new THREE.HemisphereLight(palette.hemiSky, palette.hemiGround, 1.0);
  scene.add(hemi);

  const ambient = new THREE.AmbientLight(palette.ambient, palette.ambientIntensity);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(palette.sun, palette.sunIntensity);
  sun.position.set(-30, 44, 26);
  sun.castShadow = true;
  const shadowSize = initialW < 768 ? 1024 : 2048;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 150;
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -50;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  // -- Material factories -------------------------------------------------
  const emissiveMats: THREE.MeshStandardMaterial[] = [];
  const plainMaterial: MatFactory = (params) =>
    track.mat(new THREE.MeshStandardMaterial({ envMapIntensity: palette.envIntensity, ...params }));
  const litMaterial: LitFactory = (params, glow = 0.9) => {
    const m = track.mat(
      new THREE.MeshStandardMaterial({ envMapIntensity: palette.envIntensity, ...params })
    );
    m.emissive = new THREE.Color(params.color as THREE.ColorRepresentation);
    m.userData.glow = glow;
    m.emissiveIntensity = palette.emissive * glow;
    emissiveMats.push(m);
    return m;
  };

  // -- Load the shared photographic PBR textures (async; scene renders now,
  // textures pop in as they arrive). Color is sRGB; normal/roughness linear.
  const texLoader = new THREE.TextureLoader();
  const loadTex = (url: string, srgb: boolean, repeat: number) => {
    const t = texLoader.load(url);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    t.anisotropy = maxAniso;
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    return track.tex(t);
  };
  const loadPbr = (name: string, repeat: number): PbrMaps => ({
    map: loadTex(`/textures/hero/${name}/color.webp`, true, repeat),
    normalMap: loadTex(`/textures/hero/${name}/normal.webp`, false, repeat),
    roughnessMap: loadTex(`/textures/hero/${name}/roughness.webp`, false, repeat),
  });
  const pbr: BuildCtx['pbr'] = {
    grass: loadPbr('grass', 26),
    paving: loadPbr('paving', 8),
    stone: loadPbr('stone', 3),
    wood: loadPbr('wood', 2),
  };

  // -- Build context + world ----------------------------------------------
  const lampLights: THREE.PointLight[] = [];
  const waterMats: THREE.MeshStandardMaterial[] = [];
  const ctx: BuildCtx = {
    track,
    plain: plainMaterial,
    lit: litMaterial,
    pbr,
    lampLights,
    registerWater: (m) => waterMats.push(m),
  };

  const animated: Animated[] = [];
  const root = new THREE.Group();
  scene.add(root);

  root.add(buildGround(ctx));
  root.add(buildCastle(ctx));

  const ferris = buildFerrisWheel(ctx);
  ferris.group.position.set(21, 0, -15);
  root.add(ferris.group);
  animated.push(ferris);

  const carousel = buildCarousel(ctx);
  carousel.group.position.set(-17, 0, 3);
  root.add(carousel.group);
  animated.push(carousel);

  const swing = buildSwingRide(ctx);
  swing.group.position.set(17, 0, 7);
  root.add(swing.group);
  animated.push(swing);

  const teacups = buildTeacups(ctx);
  teacups.group.position.set(-7, 0, 15);
  root.add(teacups.group);
  animated.push(teacups);

  const coaster = buildCoaster(ctx);
  root.add(coaster.group);
  animated.push(coaster);

  const lake = buildLake(ctx);
  lake.group.position.set(9, 0, 17);
  root.add(lake.group);
  animated.push(lake);

  root.add(buildEntranceGate(ctx));

  // Striped tents around the plaza.
  const tentSpots: Array<[number, number, string, string]> = [
    [-10, 11, '#ff5d6c', '#fff3f7'],
    [-24, -7, '#8be04e', '#fff3f7'],
    [24, 5, '#ffd166', '#ff7eb6'],
  ];
  for (const [x, z, a, b] of tentSpots) {
    const tent = buildTent(ctx, a, b);
    tent.position.set(x, 0, z);
    root.add(tent);
  }

  // Food / shop stalls.
  const stallSpots: Array<[number, number, number, number]> = [
    [-4, 9, 0.3, 0xff5d6c],
    [5, 9, -0.3, 0x5db8ff],
    [12, 12, 0.6, 0x8be04e],
    [-13, 7, -0.5, 0xffd166],
  ];
  for (const [x, z, rot, color] of stallSpots) {
    const stall = buildStall(ctx, color);
    stall.position.set(x, 0, z);
    stall.rotation.y = rot;
    root.add(stall);
  }

  // Lanterns along the central paths (every other one gets a real night light).
  const lanternSpots: Array<[number, number]> = [
    [3.5, 8],
    [-3.5, 8],
    [7, 4],
    [-7, 4],
    [4, -4],
    [-4, -4],
    [10, 0],
    [-10, 0],
  ];
  lanternSpots.forEach(([x, z], i) => root.add(buildLantern(ctx, x, z, i % 2 === 0)));

  // Trees around the edges to frame the park.
  const treeSpots: Array<[number, number]> = [
    [-30, 9],
    [-33, -16],
    [30, 11],
    [34, -2],
    [-13, 18],
    [5, 18],
    [24, 16],
    [-26, 11],
    [36, -22],
    [-37, -2],
    [-20, 20],
    [16, 21],
    [33, 20],
    [-33, 18],
  ];
  for (const [x, z] of treeSpots) {
    const tree = buildTree(ctx);
    const s = 0.85 + ((x * 7 + z * 13) % 5) / 9;
    tree.scale.setScalar(s);
    tree.position.set(x, 0, z);
    tree.rotation.y = (x + z) % 6;
    root.add(tree);
  }

  root.add(buildFences(ctx));
  root.add(buildFlowerBeds(ctx));

  const visitors = buildVisitors(ctx);
  root.add(visitors.group);
  animated.push(visitors);

  const balloons = buildBalloons(ctx);
  root.add(balloons.group);
  animated.push(balloons);

  const clouds = buildClouds(ctx);
  root.add(clouds.group);
  animated.push(clouds);

  const stars = buildStars(track);
  scene.add(stars);

  // -- Theme application --------------------------------------------------
  function applyTheme(next: SceneTheme) {
    theme = next;
    palette = theme === 'dark' ? NIGHT : DAY;

    const newSky = track.tex(makeSkyTexture(palette.skyTop, palette.skyBottom));
    scene.background = newSky;
    skyTex.dispose();
    track.textures.delete(skyTex);
    skyTex = newSky;

    (scene.fog as THREE.Fog).color.set(palette.fog);
    hemi.color.set(palette.hemiSky);
    hemi.groundColor.set(palette.hemiGround);
    ambient.color.set(palette.ambient);
    ambient.intensity = palette.ambientIntensity;
    sun.color.set(palette.sun);
    sun.intensity = palette.sunIntensity;

    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[];
      if (!mat) return;
      (Array.isArray(mat) ? mat : [mat]).forEach((m) => {
        if ('envMapIntensity' in m) m.envMapIntensity = palette.envIntensity;
      });
    });

    for (const m of emissiveMats) m.emissiveIntensity = palette.emissive * (m.userData.glow ?? 0.9);
    for (const l of lampLights) l.intensity = palette.lampIntensity;
    for (const w of waterMats) w.color.set(palette.water);

    bloom.strength = palette.bloomStrength;
    bloom.threshold = palette.bloomThreshold;

    stars.visible = theme === 'dark';
    (stars.material as THREE.PointsMaterial).opacity = theme === 'dark' ? 0.9 : 0;
  }
  applyTheme(theme);

  // -- Render loop --------------------------------------------------------
  const clock = new THREE.Clock();
  let frameId = 0;
  let running = false;

  const renderFrame = (elapsed: number, delta: number) => {
    for (const a of animated) a.update(elapsed, delta);
    const t = (elapsed / LAP_SECONDS) % 1;
    flightPath.getPointAt(t, camPos);
    lookPath.getPointAt(t, camTarget);
    camera.position.copy(camPos);
    camera.position.y += Math.sin(elapsed * 0.55) * 0.35;
    camera.lookAt(camTarget);
    composer.render();
  };

  const loop = () => {
    if (!running) return;
    frameId = requestAnimationFrame(loop);
    const delta = Math.min(clock.getDelta(), 0.05);
    renderFrame(clock.elapsedTime, delta);
  };
  const start = () => {
    if (running) return;
    running = true;
    clock.start();
    loop();
  };
  const stop = () => {
    running = false;
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
  };

  const onVisibility = () => {
    if (document.hidden) stop();
    else if (!opts.reducedMotion) start();
  };
  document.addEventListener('visibilitychange', onVisibility);

  if (opts.reducedMotion) {
    renderFrame(0, 0);
  } else {
    start();
  }

  return {
    resize(width, height) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      if (opts.reducedMotion) renderFrame(clock.elapsedTime, 0);
    },
    setTheme(next) {
      if (next === theme) return;
      applyTheme(next);
      if (opts.reducedMotion) renderFrame(clock.elapsedTime, 0);
    },
    dispose() {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      scene.traverse((o) => {
        const im = o as THREE.InstancedMesh;
        if (im.isInstancedMesh) im.dispose();
      });
      track.disposeAll();
      envRT.dispose();
      composer.dispose();
      renderer.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

function buildGround({ track, plain, pbr }: BuildCtx): THREE.Group {
  const group = new THREE.Group();

  const grassMat = plain({ ...pbr.grass, roughness: 1, metalness: 0 });
  const ground = new THREE.Mesh(track.geo(new THREE.CircleGeometry(130, 72)), grassMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Paved plaza disc + radiating paths.
  const pavingMat = plain({ ...pbr.paving, roughness: 0.95, metalness: 0 });
  const plaza = new THREE.Mesh(track.geo(new THREE.CircleGeometry(12, 56)), pavingMat);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.02;
  plaza.receiveShadow = true;
  group.add(plaza);

  const pathGeo = track.geo(new THREE.PlaneGeometry(5.5, 64));
  for (let i = 0; i < 4; i++) {
    const path = new THREE.Mesh(pathGeo, pavingMat);
    path.rotation.x = -Math.PI / 2;
    path.rotation.z = (i * Math.PI) / 4;
    path.position.y = 0.012;
    path.receiveShadow = true;
    group.add(path);
  }

  return group;
}

/** A whimsical Disney-style castle: a stone keep ringed by colorful spires. */
function buildCastle({ track, plain, lit, pbr }: BuildCtx): THREE.Group {
  const group = new THREE.Group();
  group.position.set(0, 0, -26);

  const wallMat = plain({ ...pbr.stone, color: C.stoneLight, roughness: 0.9 });
  const wallMat2 = plain({ ...pbr.stone, color: C.stoneBlue, roughness: 0.9 });
  const goldMat = lit({ color: C.gold, metalness: 0.7, roughness: 0.25 }, 0.7);

  const makeTower = (
    radius: number,
    height: number,
    roofColor: number,
    flagColor: number,
    body: THREE.MeshStandardMaterial
  ) => {
    const tower = new THREE.Group();
    const shaft = new THREE.Mesh(
      track.geo(new THREE.CylinderGeometry(radius, radius * 1.08, height, 20)),
      body
    );
    shaft.position.y = height / 2;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    tower.add(shaft);

    const roofH = radius * 3.4;
    const roof = new THREE.Mesh(
      track.geo(new THREE.ConeGeometry(radius * 1.25, roofH, 20)),
      lit({ color: roofColor, roughness: 0.5, metalness: 0.1 }, 0.45)
    );
    roof.position.y = height + roofH / 2;
    roof.castShadow = true;
    tower.add(roof);

    const finial = new THREE.Mesh(
      track.geo(new THREE.SphereGeometry(radius * 0.32, 12, 12)),
      goldMat
    );
    finial.position.y = height + roofH;
    tower.add(finial);

    const poleH = radius * 2.2;
    const pole = new THREE.Mesh(
      track.geo(new THREE.CylinderGeometry(radius * 0.05, radius * 0.05, poleH, 6)),
      goldMat
    );
    pole.position.y = height + roofH + poleH / 2;
    tower.add(pole);
    const flag = new THREE.Mesh(
      track.geo(new THREE.PlaneGeometry(radius * 1.3, radius * 0.7)),
      lit({ color: flagColor, roughness: 0.6, side: THREE.DoubleSide }, 0.5)
    );
    flag.position.set(radius * 0.7, height + roofH + poleH * 0.78, 0);
    tower.add(flag);

    return tower;
  };

  group.add(makeTower(3.2, 12, C.roofBlue, C.flagRed, wallMat));

  const corners: Array<[number, number, number, number, number, THREE.MeshStandardMaterial]> = [
    [-5.5, -1, 9, C.roofPink, C.flagYellow, wallMat2],
    [5.5, -1, 9, C.roofPurple, C.flagBlue, wallMat2],
    [-7.5, 2, 7.5, C.roofTeal, C.flagRed, wallMat],
    [7.5, 2, 7.5, C.roofPink, C.flagBlue, wallMat],
  ];
  for (const [x, z, h, roof, flag, body] of corners) {
    const r = h > 8 ? 1.7 : 1.4;
    const tower = makeTower(r, h, roof, flag, body);
    tower.position.set(x, 0, z);
    group.add(tower);
  }

  const wall = new THREE.Mesh(track.geo(new THREE.BoxGeometry(14, 4.5, 3)), wallMat);
  wall.position.set(0, 2.25, 7.5);
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);

  const gate = new THREE.Mesh(
    track.geo(new THREE.CylinderGeometry(1.6, 1.6, 4.2, 16, 1, false, 0, Math.PI)),
    lit({ color: C.roofBlue, roughness: 0.5 }, 0.4)
  );
  gate.rotation.z = -Math.PI / 2;
  gate.rotation.y = Math.PI / 2;
  gate.position.set(0, 0, 9.05);
  group.add(gate);

  return group;
}

/** A Ferris wheel that slowly rotates; gondolas hang and stay upright. */
function buildFerrisWheel({ track, plain, lit }: BuildCtx): Animated {
  const group = new THREE.Group();
  const R = 9;
  const spokes = 12;

  const frameMat = lit({ color: 0xff7eb6, metalness: 0.5, roughness: 0.35 }, 0.7);
  const hubMat = lit({ color: C.gold, metalness: 0.7, roughness: 0.25 }, 0.7);
  const legMat = plain({ color: C.coasterSupport, metalness: 0.3, roughness: 0.5 });
  const legGeo = track.geo(new THREE.CylinderGeometry(0.35, 0.45, R + 4, 12));
  for (const sx of [-3.2, 3.2]) {
    const legA = new THREE.Mesh(legGeo, legMat);
    legA.position.set(sx, (R + 4) / 2, 2.4);
    legA.rotation.x = 0.32;
    legA.castShadow = true;
    group.add(legA);
    const legB = new THREE.Mesh(legGeo, legMat);
    legB.position.set(sx, (R + 4) / 2, -2.4);
    legB.rotation.x = -0.32;
    legB.castShadow = true;
    group.add(legB);
  }

  const wheel = new THREE.Group();
  wheel.position.y = R + 1.5;
  group.add(wheel);

  const rimGeo = track.geo(new THREE.TorusGeometry(R, 0.22, 12, 56));
  for (const z of [0.9, -0.9]) {
    const rim = new THREE.Mesh(rimGeo, frameMat);
    rim.position.z = z;
    rim.castShadow = true;
    wheel.add(rim);
  }
  const hub = new THREE.Mesh(track.geo(new THREE.CylinderGeometry(0.6, 0.6, 2.2, 16)), hubMat);
  hub.rotation.x = Math.PI / 2;
  wheel.add(hub);

  const spokeGeo = track.geo(new THREE.CylinderGeometry(0.07, 0.07, R * 2, 6));
  for (let i = 0; i < spokes; i++) {
    const spoke = new THREE.Mesh(spokeGeo, frameMat);
    spoke.rotation.z = (i / spokes) * Math.PI;
    wheel.add(spoke);
  }

  const cabinGeo = track.geo(new THREE.BoxGeometry(1.7, 1.5, 1.7));
  const roofGeo = track.geo(new THREE.ConeGeometry(1.3, 0.9, 4));
  const gondolas: THREE.Group[] = [];
  for (let i = 0; i < spokes; i++) {
    const ang = (i / spokes) * Math.PI * 2;
    const pivot = new THREE.Group();
    pivot.position.set(Math.cos(ang) * R, Math.sin(ang) * R, 0);
    wheel.add(pivot);

    const gondola = new THREE.Group();
    const color = GONDOLA_COLORS[i % GONDOLA_COLORS.length];
    const cabin = new THREE.Mesh(cabinGeo, lit({ color, roughness: 0.45, metalness: 0.1 }, 0.85));
    cabin.castShadow = true;
    gondola.add(cabin);
    const roof = new THREE.Mesh(
      roofGeo,
      lit({ color: C.gold, roughness: 0.35, metalness: 0.3 }, 0.6)
    );
    roof.position.y = 1.2;
    roof.rotation.y = Math.PI / 4;
    gondola.add(roof);
    gondola.position.y = -1.4;
    pivot.add(gondola);
    gondolas.push(pivot);
  }

  return {
    group,
    update: (elapsed) => {
      const rot = elapsed * 0.28;
      wheel.rotation.z = rot;
      for (const g of gondolas) g.rotation.z = -rot;
    },
  };
}

/** A carousel: striped canopy, golden poles, bobbing horses, all spinning. */
function buildCarousel({ track, plain, lit }: BuildCtx): Animated {
  const group = new THREE.Group();
  const R = 4.6;

  const base = new THREE.Mesh(
    track.geo(new THREE.CylinderGeometry(R + 0.6, R + 0.9, 0.7, 36)),
    plain({ color: 0xf4d9ff, roughness: 0.7, metalness: 0.1 })
  );
  base.position.y = 0.35;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const spinner = new THREE.Group();
  spinner.position.y = 0.7;
  group.add(spinner);

  const column = new THREE.Mesh(
    track.geo(new THREE.CylinderGeometry(0.5, 0.5, 5.4, 16)),
    lit({ color: C.gold, metalness: 0.6, roughness: 0.3 }, 0.55)
  );
  column.position.y = 2.7;
  spinner.add(column);

  const stripe = track.tex(makeStripeTexture('#ff5d6c', '#fff3f7'));
  stripe.repeat.set(8, 1);
  const roof = new THREE.Mesh(
    track.geo(new THREE.ConeGeometry(R + 1.1, 2.4, 28)),
    lit({ map: stripe, color: 0xffffff, roughness: 0.6 }, 0.4)
  );
  roof.position.y = 6.0;
  roof.castShadow = true;
  spinner.add(roof);
  const finial = new THREE.Mesh(
    track.geo(new THREE.SphereGeometry(0.4, 12, 12)),
    lit({ color: C.gold, metalness: 0.7, roughness: 0.25 }, 0.7)
  );
  finial.position.y = 7.4;
  spinner.add(finial);

  const poleGeo = track.geo(new THREE.CylinderGeometry(0.07, 0.07, 3.4, 8));
  const poleMat = lit({ color: C.gold, metalness: 0.7, roughness: 0.25 }, 0.55);
  const horses: Array<{ mount: THREE.Group; phase: number }> = [];
  const horseCount = 8;
  for (let i = 0; i < horseCount; i++) {
    const ang = (i / horseCount) * Math.PI * 2;
    const x = Math.cos(ang) * (R - 0.6);
    const z = Math.sin(ang) * (R - 0.6);

    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(x, 2.5, z);
    spinner.add(pole);

    const mount = new THREE.Group();
    mount.position.set(x, 2.1, z);
    const color = GONDOLA_COLORS[i % GONDOLA_COLORS.length];
    const horseMat = lit({ color, roughness: 0.5, metalness: 0.05 }, 0.55);
    const body = new THREE.Mesh(track.geo(new THREE.CapsuleGeometry(0.35, 0.9, 4, 8)), horseMat);
    body.rotation.z = Math.PI / 2;
    body.castShadow = true;
    mount.add(body);
    const neck = new THREE.Mesh(
      track.geo(new THREE.CylinderGeometry(0.16, 0.22, 0.8, 8)),
      horseMat
    );
    neck.position.set(0.55, 0.45, 0);
    neck.rotation.z = -0.5;
    mount.add(neck);
    const head = new THREE.Mesh(track.geo(new THREE.BoxGeometry(0.5, 0.28, 0.26)), horseMat);
    head.position.set(0.9, 0.7, 0);
    mount.add(head);
    mount.rotation.y = -ang + Math.PI / 2;
    spinner.add(mount);
    horses.push({ mount, phase: i });
  }

  return {
    group,
    update: (elapsed) => {
      spinner.rotation.y = elapsed * 0.5;
      for (const h of horses) h.mount.position.y = 2.1 + Math.sin(elapsed * 2.2 + h.phase) * 0.28;
    },
  };
}

/** A swing/chair ride: a central tower with a spinning top that flares chairs out. */
function buildSwingRide({ track, plain, lit }: BuildCtx): Animated {
  const group = new THREE.Group();

  const towerMat = lit({ color: 0x5db8ff, metalness: 0.5, roughness: 0.35 }, 0.55);
  const tower = new THREE.Mesh(track.geo(new THREE.CylinderGeometry(0.7, 1.0, 11, 16)), towerMat);
  tower.position.y = 5.5;
  tower.castShadow = true;
  group.add(tower);

  const cap = new THREE.Mesh(
    track.geo(new THREE.ConeGeometry(2.6, 1.8, 20)),
    lit({ color: C.flagRed, roughness: 0.5 }, 0.5)
  );
  cap.position.y = 11.6;
  cap.castShadow = true;
  group.add(cap);

  const spinner = new THREE.Group();
  spinner.position.y = 10.6;
  group.add(spinner);

  const disc = new THREE.Mesh(
    track.geo(new THREE.CylinderGeometry(2.4, 2.4, 0.3, 20)),
    lit({ color: C.gold, metalness: 0.6, roughness: 0.3 }, 0.5)
  );
  spinner.add(disc);

  const chainMat = plain({ color: 0x999999, metalness: 0.8, roughness: 0.4 });
  const chainGeo = track.geo(new THREE.CylinderGeometry(0.02, 0.02, 3.4, 4));
  const seatGeo = track.geo(new THREE.BoxGeometry(0.5, 0.4, 0.5));
  const arms: THREE.Group[] = [];
  const seatCount = 10;
  for (let i = 0; i < seatCount; i++) {
    const ang = (i / seatCount) * Math.PI * 2;
    const arm = new THREE.Group();
    arm.rotation.y = ang;
    const chain = new THREE.Mesh(chainGeo, chainMat);
    chain.position.set(2.3, -1.7, 0);
    arm.add(chain);
    const seat = new THREE.Mesh(
      seatGeo,
      lit({ color: GONDOLA_COLORS[i % GONDOLA_COLORS.length], roughness: 0.5 }, 0.6)
    );
    seat.position.set(2.3, -3.4, 0);
    seat.castShadow = true;
    arm.add(seat);
    spinner.add(arm);
    arms.push(arm);
  }

  return {
    group,
    update: (elapsed) => {
      spinner.rotation.y = elapsed * 0.9;
      // Chairs flare outward as it spins up, then settle (eased oscillation).
      const flare = 0.5 + Math.sin(elapsed * 0.3) * 0.18;
      for (const a of arms) a.children.forEach((c) => (c.rotation.z = -flare));
    },
  };
}

/** Spinning teacups: a turntable carrying counter-spinning cups. */
function buildTeacups({ track, plain, lit }: BuildCtx): Animated {
  const group = new THREE.Group();

  const platform = new THREE.Mesh(
    track.geo(new THREE.CylinderGeometry(3.6, 3.8, 0.5, 32)),
    plain({ color: 0xe9f4ff, roughness: 0.7, metalness: 0.1 })
  );
  platform.position.y = 0.25;
  platform.castShadow = true;
  platform.receiveShadow = true;
  group.add(platform);

  const turntable = new THREE.Group();
  turntable.position.y = 0.5;
  group.add(turntable);

  const cupGeo = track.geo(new THREE.CylinderGeometry(0.95, 0.7, 1.0, 18, 1, true));
  const cupBaseGeo = track.geo(new THREE.CylinderGeometry(0.7, 0.7, 0.12, 18));
  const cups: THREE.Group[] = [];
  const cupCount = 4;
  for (let i = 0; i < cupCount; i++) {
    const ang = (i / cupCount) * Math.PI * 2;
    const cup = new THREE.Group();
    cup.position.set(Math.cos(ang) * 2.0, 0.5, Math.sin(ang) * 2.0);
    const cupMat = lit(
      {
        color: GONDOLA_COLORS[i % GONDOLA_COLORS.length],
        roughness: 0.4,
        metalness: 0.1,
        side: THREE.DoubleSide,
      },
      0.55
    );
    const shell = new THREE.Mesh(cupGeo, cupMat);
    shell.castShadow = true;
    cup.add(shell);
    const base = new THREE.Mesh(cupBaseGeo, cupMat);
    base.position.y = -0.44;
    cup.add(base);
    turntable.add(cup);
    cups.push(cup);
  }

  return {
    group,
    update: (elapsed) => {
      turntable.rotation.y = elapsed * 0.6;
      for (let i = 0; i < cups.length; i++) cups[i].rotation.y = -elapsed * (1.4 + i * 0.2);
    },
  };
}

/**
 * A roller coaster: a closed, hilly, looping track built from a CatmullRom
 * curve, twin rails + cross-ties + support posts, and a multi-car train that
 * rides the curve (oriented by the curve's tangent).
 */
function buildCoaster({ track, plain, lit }: BuildCtx): Animated {
  const group = new THREE.Group();

  const pts = [
    new THREE.Vector3(-28, 1, 20),
    new THREE.Vector3(-33, 1.5, 2),
    new THREE.Vector3(-26, 9, -13),
    new THREE.Vector3(-11, 13, -20),
    new THREE.Vector3(7, 7, -18),
    new THREE.Vector3(18, 3, -5),
    new THREE.Vector3(29, 5, 9),
    new THREE.Vector3(22, 2, 22),
    new THREE.Vector3(2, 1.2, 26),
    new THREE.Vector3(-15, 2, 25),
  ];
  const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);

  const SEG = 340;
  const frames = curve.computeFrenetFrames(SEG, true);
  const railOffset = 0.55;

  const leftPts: THREE.Vector3[] = [];
  const rightPts: THREE.Vector3[] = [];
  const centers: THREE.Vector3[] = [];
  for (let i = 0; i <= SEG; i++) {
    const p = curve.getPointAt(i / SEG);
    centers.push(p);
    const side = frames.binormals[i].clone().multiplyScalar(railOffset);
    leftPts.push(p.clone().add(side));
    rightPts.push(p.clone().sub(side));
  }

  const railMat = lit({ color: C.coaster, metalness: 0.5, roughness: 0.35 }, 0.85);
  const makeRail = (points: THREE.Vector3[]) => {
    const c = new THREE.CatmullRomCurve3(points, true);
    const mesh = new THREE.Mesh(track.geo(new THREE.TubeGeometry(c, SEG, 0.16, 8, true)), railMat);
    mesh.castShadow = true;
    return mesh;
  };
  group.add(makeRail(leftPts));
  group.add(makeRail(rightPts));

  const tieMat = lit({ color: 0xffe08a, roughness: 0.5 }, 0.5);
  const tieGeo = track.geo(new THREE.BoxGeometry(railOffset * 2 + 0.2, 0.1, 0.18));
  for (let i = 0; i < SEG; i += 5) {
    const tie = new THREE.Mesh(tieGeo, tieMat);
    tie.position.copy(centers[i]);
    const m = new THREE.Matrix4();
    m.lookAt(new THREE.Vector3(0, 0, 0), curve.getTangentAt(i / SEG), frames.normals[i]);
    tie.quaternion.setFromRotationMatrix(m);
    group.add(tie);
  }

  const postMat = plain({ color: C.coasterSupport, metalness: 0.2, roughness: 0.6 });
  const crossGeo = track.geo(new THREE.BoxGeometry(0.16, 0.16, 2.4));
  for (let i = 0; i < SEG; i += 14) {
    const p = centers[i];
    if (p.y < 1.2) continue;
    const h = p.y;
    const post = new THREE.Mesh(track.geo(new THREE.CylinderGeometry(0.18, 0.22, h, 8)), postMat);
    post.position.set(p.x, h / 2, p.z);
    post.castShadow = true;
    group.add(post);
    if (h > 5) {
      const brace = new THREE.Mesh(crossGeo, postMat);
      brace.position.set(p.x, h * 0.55, p.z);
      brace.lookAt(0, h * 0.55, 0);
      group.add(brace);
    }
  }

  const train = new THREE.Group();
  group.add(train);
  const carCount = 5;
  const carGap = 0.018;
  const cars: THREE.Group[] = [];
  const carBodyGeo = track.geo(new THREE.BoxGeometry(0.9, 0.6, 1.3));
  const noseGeo = track.geo(new THREE.SphereGeometry(0.45, 12, 10));
  const headGeo = track.geo(new THREE.SphereGeometry(0.22, 10, 10));
  const headMat = plain({ color: 0xffe0bd, roughness: 0.7 });
  for (let i = 0; i < carCount; i++) {
    const car = new THREE.Group();
    const carMat = lit(
      { color: GONDOLA_COLORS[i % GONDOLA_COLORS.length], metalness: 0.3, roughness: 0.4 },
      0.85
    );
    const body = new THREE.Mesh(carBodyGeo, carMat);
    body.position.y = 0.35;
    body.castShadow = true;
    car.add(body);
    if (i === 0) {
      const nose = new THREE.Mesh(noseGeo, carMat);
      nose.position.set(0, 0.4, 0.7);
      nose.scale.set(1, 0.9, 1.2);
      car.add(nose);
    }
    for (const hx of [-0.22, 0.22]) {
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(hx, 0.78, -0.1);
      car.add(head);
    }
    train.add(car);
    cars.push(car);
  }

  const up = new THREE.Vector3(0, 1, 0);
  const tmpTangent = new THREE.Vector3();
  const tmpMatrix = new THREE.Matrix4();
  const placeCar = (car: THREE.Group, t: number) => {
    const tt = ((t % 1) + 1) % 1;
    car.position.copy(curve.getPointAt(tt));
    curve.getTangentAt(tt, tmpTangent);
    car.position.y += 0.32;
    tmpMatrix.lookAt(new THREE.Vector3(0, 0, 0), tmpTangent, up);
    car.quaternion.setFromRotationMatrix(tmpMatrix);
  };

  return {
    group,
    update: (elapsed) => {
      const head = (elapsed * 0.05) % 1;
      for (let i = 0; i < cars.length; i++) placeCar(cars[i], head - i * carGap);
    },
  };
}

/** A reflective lake with a gently scrolling ripple normal map. */
function buildLake({ track, plain, pbr, registerWater }: BuildCtx): Animated {
  const group = new THREE.Group();

  // Sandy shore ring around the water.
  const shore = new THREE.Mesh(
    track.geo(new THREE.CircleGeometry(7.4, 48)),
    plain({ ...pbr.paving, color: 0xe8dcc0, roughness: 1 })
  );
  shore.rotation.x = -Math.PI / 2;
  shore.position.y = 0.015;
  shore.receiveShadow = true;
  group.add(shore);

  const waterNormal = track.tex(makeWaterNormal());
  waterNormal.repeat.set(3, 3);
  const waterMat = plain({
    color: DAY.water,
    roughness: 0.08,
    metalness: 0.0,
    normalMap: waterNormal,
    transparent: true,
    opacity: 0.86,
  });
  waterMat.normalScale = new THREE.Vector2(0.5, 0.5);
  registerWater(waterMat);
  const water = new THREE.Mesh(track.geo(new THREE.CircleGeometry(6.6, 48)), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.06;
  group.add(water);

  return {
    group,
    update: (elapsed) => {
      waterNormal.offset.set(elapsed * 0.015, elapsed * 0.022);
    },
  };
}

/** A grand striped entrance arch at the front of the park. */
function buildEntranceGate({ track, plain, lit }: BuildCtx): THREE.Group {
  const group = new THREE.Group();
  group.position.set(0, 0, 30);

  const pillarMat = plain({ color: 0xfff0e6, roughness: 0.85 });
  const pillarGeo = track.geo(new THREE.BoxGeometry(1.6, 6, 1.6));
  const capGeo = track.geo(new THREE.ConeGeometry(1.3, 1.6, 4));
  for (const sx of [-5, 5]) {
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(sx, 3, 0);
    pillar.castShadow = true;
    group.add(pillar);
    const cap = new THREE.Mesh(capGeo, lit({ color: C.roofPink, roughness: 0.5 }, 0.5));
    cap.position.set(sx, 6.8, 0);
    cap.rotation.y = Math.PI / 4;
    group.add(cap);
  }

  const stripe = track.tex(makeStripeTexture('#ff5d6c', '#fff3f7'));
  stripe.repeat.set(10, 1);
  const arch = new THREE.Mesh(
    track.geo(new THREE.TorusGeometry(5, 0.7, 12, 32, Math.PI)),
    lit({ map: stripe, color: 0xffffff, roughness: 0.6 }, 0.4)
  );
  arch.position.set(0, 6, 0);
  arch.castShadow = true;
  group.add(arch);

  const sign = new THREE.Mesh(
    track.geo(new THREE.BoxGeometry(6.4, 1.4, 0.3)),
    lit({ color: C.gold, metalness: 0.5, roughness: 0.35 }, 0.7)
  );
  sign.position.set(0, 7.4, 0);
  group.add(sign);

  return group;
}

/** A striped circus tent (cone roof on a short cylinder). */
function buildTent({ track }: BuildCtx, colorA: string, colorB: string): THREE.Group {
  const group = new THREE.Group();
  const stripe = track.tex(makeStripeTexture(colorA, colorB));
  stripe.repeat.set(10, 1);
  const roofMat = track.mat(new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.7 }));
  const wallMat = track.mat(new THREE.MeshStandardMaterial({ color: 0xfff3f7, roughness: 0.85 }));

  const wall = new THREE.Mesh(track.geo(new THREE.CylinderGeometry(2.4, 2.4, 2, 24)), wallMat);
  wall.position.y = 1;
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);

  const roof = new THREE.Mesh(track.geo(new THREE.ConeGeometry(3.1, 2.6, 24)), roofMat);
  roof.position.y = 3.3;
  roof.castShadow = true;
  group.add(roof);

  const pole = new THREE.Mesh(
    track.geo(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6)),
    track.mat(new THREE.MeshStandardMaterial({ color: 0x8a5a2b }))
  );
  pole.position.y = 4.7;
  group.add(pole);
  const flag = new THREE.Mesh(
    track.geo(new THREE.PlaneGeometry(0.9, 0.5)),
    track.mat(new THREE.MeshStandardMaterial({ color: 0xffd166, side: THREE.DoubleSide }))
  );
  flag.position.set(0.45, 5.0, 0);
  group.add(flag);

  return group;
}

/** A small food/shop stall: wooden counter + striped awning. */
function buildStall({ track, plain, lit, pbr }: BuildCtx, accent: number): THREE.Group {
  const group = new THREE.Group();

  const counter = new THREE.Mesh(
    track.geo(new THREE.BoxGeometry(3, 1.4, 1.6)),
    plain({ ...pbr.wood, roughness: 0.8 })
  );
  counter.position.y = 0.7;
  counter.castShadow = true;
  counter.receiveShadow = true;
  group.add(counter);

  // Posts + awning.
  const postMat = plain({ ...pbr.wood, roughness: 0.8 });
  const postGeo = track.geo(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 8));
  for (const sx of [-1.4, 1.4]) {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(sx, 1.3, 0.7);
    group.add(post);
  }
  const awning = new THREE.Mesh(
    track.geo(new THREE.BoxGeometry(3.3, 0.18, 1.8)),
    lit({ color: accent, roughness: 0.6 }, 0.45)
  );
  awning.position.set(0, 2.6, 0.2);
  awning.rotation.x = -0.18;
  awning.castShadow = true;
  group.add(awning);

  return group;
}

/** A lantern post; the bulb glows at night, and optionally casts a point light. */
function buildLantern(
  { track, plain, lit, lampLights }: BuildCtx,
  x: number,
  z: number,
  withLight: boolean
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const post = new THREE.Mesh(
    track.geo(new THREE.CylinderGeometry(0.08, 0.12, 3.2, 10)),
    plain({ color: 0x2a2f3a, metalness: 0.6, roughness: 0.5 })
  );
  post.position.y = 1.6;
  post.castShadow = true;
  group.add(post);

  const bulb = new THREE.Mesh(
    track.geo(new THREE.SphereGeometry(0.26, 14, 14)),
    lit({ color: 0xffe6a8, roughness: 0.3 }, 1.6)
  );
  bulb.position.y = 3.4;
  group.add(bulb);

  const cap = new THREE.Mesh(
    track.geo(new THREE.ConeGeometry(0.34, 0.3, 10)),
    plain({ color: 0x2a2f3a, metalness: 0.6, roughness: 0.5 })
  );
  cap.position.y = 3.72;
  group.add(cap);

  if (withLight) {
    const light = new THREE.PointLight(0xffd79a, 0, 16, 2);
    light.position.set(0, 3.4, 0);
    lampLights.push(light);
    group.add(light);
  }

  return group;
}

/** A ring of low picket fences (a single instanced mesh) around the plaza edge. */
function buildFences({ track, plain }: BuildCtx): THREE.InstancedMesh {
  const count = 64;
  const geo = track.geo(new THREE.BoxGeometry(0.9, 0.7, 0.08));
  const mat = plain({ color: 0xffffff, roughness: 0.8 });
  const inst = new THREE.InstancedMesh(geo, mat, count);
  inst.castShadow = true;
  const R = 13.2;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3(1, 1, 1);
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2;
    // Leave gaps where the four paths cross the ring.
    const near = Math.min(
      ...[
        0,
        Math.PI / 2,
        Math.PI,
        (3 * Math.PI) / 2,
        Math.PI / 4,
        (3 * Math.PI) / 4,
        (5 * Math.PI) / 4,
        (7 * Math.PI) / 4,
      ].map((a) => Math.abs(((ang - a + Math.PI) % (Math.PI * 2)) - Math.PI))
    );
    pos.set(Math.cos(ang) * R, near < 0.12 ? -2 : 0.35, Math.sin(ang) * R); // sink hidden ones
    q.setFromAxisAngle(up, -ang);
    m.compose(pos, q, scl);
    inst.setMatrixAt(i, m);
  }
  inst.instanceMatrix.needsUpdate = true;
  return inst;
}

/** Scattered flower clumps as one instanced mesh with per-instance color. */
function buildFlowerBeds({ track, lit }: BuildCtx): THREE.InstancedMesh {
  const count = 150;
  const geo = track.geo(new THREE.SphereGeometry(0.22, 6, 5));
  const mat = lit({ color: 0xffffff, roughness: 0.7 }, 0.35);
  const inst = new THREE.InstancedMesh(geo, mat, count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    // Ring beds between the plaza and the outer scenery.
    const ang = Math.random() * Math.PI * 2;
    const r = 14 + Math.random() * 16;
    const s = 0.6 + Math.random() * 0.9;
    pos.set(Math.cos(ang) * r, 0.18 * s, Math.sin(ang) * r);
    scl.set(s, s * (0.7 + Math.random() * 0.5), s);
    m.compose(pos, q, scl);
    inst.setMatrixAt(i, m);
    color.set(FLOWER_COLORS[i % FLOWER_COLORS.length]);
    inst.setColorAt(i, color);
  }
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  return inst;
}

/** A low-poly tree (trunk + two leaf cones). */
function buildTree({ track, plain }: BuildCtx): THREE.Group {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    track.geo(new THREE.CylinderGeometry(0.3, 0.4, 2, 8)),
    plain({ color: 0x8a5a2b, roughness: 0.95 })
  );
  trunk.position.y = 1;
  trunk.castShadow = true;
  group.add(trunk);

  const lower = new THREE.Mesh(
    track.geo(new THREE.ConeGeometry(1.7, 2.6, 12)),
    plain({ color: C.leafDark, roughness: 1 })
  );
  lower.position.y = 2.6;
  lower.castShadow = true;
  group.add(lower);
  const upper = new THREE.Mesh(
    track.geo(new THREE.ConeGeometry(1.3, 2.2, 12)),
    plain({ color: C.leaf, roughness: 1 })
  );
  upper.position.y = 3.8;
  upper.castShadow = true;
  group.add(upper);

  return group;
}

/** A handful of stylized visitors strolling around the plaza on circular paths. */
function buildVisitors({ track, plain, lit }: BuildCtx): Animated {
  const group = new THREE.Group();
  const bodyGeo = track.geo(new THREE.CapsuleGeometry(0.22, 0.5, 4, 8));
  const headGeo = track.geo(new THREE.SphereGeometry(0.2, 10, 10));
  const headMat = plain({ color: 0xffd9b8, roughness: 0.7 });

  const people: Array<{ g: THREE.Group; radius: number; speed: number; phase: number }> = [];
  const count = 16;
  for (let i = 0; i < count; i++) {
    const person = new THREE.Group();
    const body = new THREE.Mesh(
      bodyGeo,
      lit({ color: VISITOR_COLORS[i % VISITOR_COLORS.length], roughness: 0.6 }, 0.3)
    );
    body.position.y = 0.55;
    body.castShadow = true;
    person.add(body);
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.0;
    person.add(head);
    group.add(person);
    people.push({
      g: person,
      radius: 7 + (i % 5) * 1.4,
      speed: (0.12 + (i % 4) * 0.04) * (i % 2 === 0 ? 1 : -1),
      phase: (i / count) * Math.PI * 2,
    });
  }

  return {
    group,
    update: (elapsed) => {
      for (const p of people) {
        const a = p.phase + elapsed * p.speed;
        p.g.position.set(
          Math.cos(a) * p.radius,
          Math.abs(Math.sin(elapsed * 4 + p.phase)) * 0.08,
          Math.sin(a) * p.radius
        );
        p.g.rotation.y = -a + (p.speed > 0 ? Math.PI / 2 : -Math.PI / 2);
      }
    },
  };
}

/** Balloons that slowly rise, sway and recycle to the ground. */
function buildBalloons({ track, lit }: BuildCtx): Animated {
  const group = new THREE.Group();
  const balloonGeo = track.geo(new THREE.SphereGeometry(0.6, 16, 16));
  const knotGeo = track.geo(new THREE.ConeGeometry(0.12, 0.2, 6));
  const count = 16;
  const items: Array<{ mesh: THREE.Group; speed: number; sway: number; baseX: number }> = [];

  for (let i = 0; i < count; i++) {
    const b = new THREE.Group();
    const color = BALLOON_COLORS[i % BALLOON_COLORS.length];
    const mat = lit({ color, roughness: 0.3, metalness: 0.05 }, 0.9);
    const balloon = new THREE.Mesh(balloonGeo, mat);
    balloon.scale.y = 1.2;
    b.add(balloon);
    const knot = new THREE.Mesh(knotGeo, mat);
    knot.position.y = -0.72;
    knot.rotation.x = Math.PI;
    b.add(knot);

    const baseX = (i / count) * 64 - 32 + ((i * 17) % 7);
    const baseZ = -8 + ((i * 13) % 30);
    b.position.set(baseX, ((i * 11) % 18) + 3, baseZ);
    b.scale.setScalar(0.8 + ((i * 7) % 5) / 6);
    group.add(b);
    items.push({ mesh: b, speed: 0.7 + ((i * 3) % 5) / 5, sway: (i % 5) * 0.4, baseX });
  }

  return {
    group,
    update: (elapsed) => {
      for (const it of items) {
        it.mesh.position.y += it.speed * 0.02;
        if (it.mesh.position.y > 28) it.mesh.position.y = 2;
        it.mesh.position.x = it.baseX + Math.sin(elapsed * 0.5 + it.sway) * 1.2;
        it.mesh.rotation.z = Math.sin(elapsed * 0.8 + it.sway) * 0.08;
      }
    },
  };
}

/** Puffy clouds (clusters of flattened spheres) drifting across the sky. */
function buildClouds({ track, plain }: BuildCtx): Animated {
  const group = new THREE.Group();
  const cloudMat = plain({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.92 });
  cloudMat.envMapIntensity = 0.2;
  const puffGeo = track.geo(new THREE.SphereGeometry(2, 12, 10));
  const count = 8;
  const clouds: Array<{ mesh: THREE.Group; speed: number }> = [];

  for (let i = 0; i < count; i++) {
    const cloud = new THREE.Group();
    const puffs = 3 + (i % 3);
    for (let j = 0; j < puffs; j++) {
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      puff.position.set(
        (j - puffs / 2) * 2.4 + ((i * 7) % 2),
        ((j * 5) % 3) * 0.6,
        ((j * 3) % 4) - 1
      );
      puff.scale.set(1 + ((i + j) % 3) * 0.25, 0.7, 1);
      cloud.add(puff);
    }
    cloud.position.set(((i * 17) % 76) - 38, 26 + ((i * 11) % 10), -32 - ((i * 13) % 28));
    cloud.scale.setScalar(1 + ((i * 5) % 4) / 4);
    group.add(cloud);
    clouds.push({ mesh: cloud, speed: 0.4 + ((i * 3) % 5) / 6 });
  }

  return {
    group,
    update: (_elapsed, delta) => {
      for (const c of clouds) {
        c.mesh.position.x += c.speed * delta * 1.4;
        if (c.mesh.position.x > 52) c.mesh.position.x = -52;
      }
    },
  };
}

/** A field of stars, only visible in the night (dark) theme. */
function buildStars(track: Tracker): THREE.Points {
  const count = 260;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.42;
    const r = 160;
    positions[i * 3] = Math.cos(theta) * Math.sin(phi) * r;
    positions[i * 3 + 1] = Math.cos(phi) * r * 0.7 + 14;
    positions[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * r - 30;
  }
  const geo = track.geo(new THREE.BufferGeometry());
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = track.mat(
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.1,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0,
    })
  );
  const points = new THREE.Points(geo, mat);
  points.visible = false;
  return points;
}
