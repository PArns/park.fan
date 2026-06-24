/**
 * park-scene.ts
 * -------------
 * A self-contained, low-poly **amusement park** built in pure three.js — a
 * Disney-World-style castle, a turning Ferris wheel, a spinning carousel, a
 * roller coaster with a train running its track, striped circus tents, drifting
 * clouds and floating balloons. It powers the homepage hero background
 * (see `components/layout/hero-three-park.tsx`).
 *
 * Design goals
 *  - **Decorative, not interactive.** No user controls; a slow drone-style
 *    camera auto-flies a closed loop through the park behind the hero card.
 *  - **Theme-aware.** `setTheme()` swaps the sky, lighting and the emissive
 *    "lights-on" look between a sunny day (light UI) and a magical night
 *    (dark UI) without rebuilding the scene.
 *  - **Cheap.** Low-poly geometry, a single shadow-casting light, capped DPR.
 *    Honors `prefers-reduced-motion` by rendering a single static frame.
 *  - **Leak-free.** `dispose()` tears down every geometry, material, texture
 *    and the renderer, and removes its resize/visibility listeners.
 *
 * The module is imported only by a `ssr:false` dynamic component, so the heavy
 * three.js bundle is code-split into its own chunk and never touches the SSR
 * payload or the hero's LCP.
 */

import * as THREE from 'three';

export type SceneTheme = 'light' | 'dark';

export interface ParkSceneHandle {
  /** Re-fit renderer + camera to a new pixel size of the host element. */
  resize: (width: number, height: number) => void;
  /** Swap day/night look (sky, lights, emissive intensity). */
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
  ground: '#7ec85a',
  path: '#f2e2bd',
  hemiSky: 0xbfe3ff,
  hemiGround: 0x6fae4f,
  sun: 0xfff4d6,
  sunIntensity: 1.45,
  ambient: 0x9fc3e8,
  ambientIntensity: 0.55,
  emissive: 0.0,
};

const NIGHT = {
  skyTop: '#0b1437',
  skyBottom: '#3a2a63',
  fog: '#241a45',
  ground: '#2f5a39',
  path: '#6f6486',
  hemiSky: 0x32407a,
  hemiGround: 0x241a3a,
  sun: 0xaab4ff,
  sunIntensity: 0.6,
  ambient: 0x6070b0,
  ambientIntensity: 0.45,
  emissive: 1.0,
};

// Cheerful, candy-bright object colors (shared across themes; the night look
// comes from emissive glow rather than recoloring).
const C = {
  castleWall: 0xfff3f7,
  castleWall2: 0xe9f4ff,
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
  carouselRoof1: 0xff5d6c,
  carouselRoof2: 0xfff3f7,
  pole: 0xffd166,
  trunk: 0x8a5a2b,
  leaf: 0x4fbf5f,
  leafDark: 0x3a9e4c,
} as const;

const GONDOLA_COLORS = [0xff5d6c, 0xffd166, 0x5db8ff, 0x8be04e, 0xb57bff, 0xff9f43];
const BALLOON_COLORS = [0xff5d6c, 0xffd166, 0x5db8ff, 0x8be04e, 0xb57bff, 0xff7eb6, 0x33d6c0];

// ---------------------------------------------------------------------------
// Texture helpers
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

/** Diagonal candy stripes — circus tents & the carousel roof. */
function makeStripeTexture(colorA: string, colorB: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = colorA;
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = colorB;
  for (let i = -64; i < 64; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 8, 0);
    ctx.lineTo(i + 8 + 64, 64);
    ctx.lineTo(i + 64, 64);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
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
// Scene factory
// ---------------------------------------------------------------------------

export function createParkScene(canvas: HTMLCanvasElement, opts: CreateOptions): ParkSceneHandle {
  const track = new Tracker();
  let theme = opts.theme;
  let palette = theme === 'dark' ? NIGHT : DAY;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  const initialW = canvas.clientWidth || 1280;
  const initialH = canvas.clientHeight || 600;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(initialW, initialH, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  let skyTex = track.tex(makeSkyTexture(palette.skyTop, palette.skyBottom));
  scene.background = skyTex;
  scene.fog = new THREE.Fog(palette.fog, 55, 130);

  const camera = new THREE.PerspectiveCamera(50, initialW / initialH, 0.1, 400);
  camera.position.set(0, 9, 40);
  camera.lookAt(0, 6, -6);

  // --- Flying camera ------------------------------------------------------
  // A drone-style fly-through: the camera glides along a closed loop that roams
  // through the park (swooping low over the plaza, rising for an overview behind
  // the castle, gliding past the Ferris wheel and carousel) while always aiming
  // at a slowly wandering target that visits the main attractions — so something
  // interesting is always framed and the motion never feels aimless.
  const flightPath = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, 9, 40),
      new THREE.Vector3(25, 7, 23),
      new THREE.Vector3(37, 13, -5),
      new THREE.Vector3(18, 18, -31),
      new THREE.Vector3(-18, 19, -31),
      new THREE.Vector3(-37, 12, -3),
      new THREE.Vector3(-25, 7, 25),
    ],
    true,
    'catmullrom',
    0.5
  );
  const lookPath = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, 6, 6),
      new THREE.Vector3(15, 9, -12),
      new THREE.Vector3(2, 11, -22),
      new THREE.Vector3(-15, 5, 1),
      new THREE.Vector3(-4, 5, 12),
    ],
    true,
    'catmullrom',
    0.5
  );
  const LAP_SECONDS = 46; // duration of one full loop through the park
  const camPos = new THREE.Vector3();
  const camTarget = new THREE.Vector3();

  // -- Lights -------------------------------------------------------------
  const hemi = new THREE.HemisphereLight(palette.hemiSky, palette.hemiGround, 1.0);
  scene.add(hemi);

  const ambient = new THREE.AmbientLight(palette.ambient, palette.ambientIntensity);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(palette.sun, palette.sunIntensity);
  sun.position.set(-26, 40, 24);
  sun.castShadow = true;
  const shadowSize = initialW < 768 ? 1024 : 2048;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 140;
  sun.shadow.camera.left = -55;
  sun.shadow.camera.right = 55;
  sun.shadow.camera.top = 55;
  sun.shadow.camera.bottom = -45;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  // Tracks every emissive material so night mode can "switch the lights on".
  const emissiveMats: THREE.MeshStandardMaterial[] = [];
  const litMaterial = (params: THREE.MeshStandardMaterialParameters, glow = 0.9) => {
    const m = track.mat(new THREE.MeshStandardMaterial(params));
    m.emissive = new THREE.Color(params.color as THREE.ColorRepresentation);
    m.userData.glow = glow;
    m.emissiveIntensity = palette.emissive * glow;
    emissiveMats.push(m);
    return m;
  };
  const plainMaterial = (params: THREE.MeshStandardMaterialParameters) =>
    track.mat(new THREE.MeshStandardMaterial(params));

  // -- Build the world ----------------------------------------------------
  const animated: Animated[] = [];
  const root = new THREE.Group();
  scene.add(root);

  root.add(buildGround(track, palette));
  root.add(buildCastle(track, plainMaterial, litMaterial));

  const ferris = buildFerrisWheel(track, plainMaterial, litMaterial);
  ferris.group.position.set(19, 0, -14);
  root.add(ferris.group);
  animated.push(ferris);

  const carousel = buildCarousel(track, plainMaterial, litMaterial);
  carousel.group.position.set(-16, 0, 4);
  root.add(carousel.group);
  animated.push(carousel);

  const coaster = buildCoaster(track, plainMaterial, litMaterial);
  root.add(coaster.group);
  animated.push(coaster);

  // Striped tents scattered around the plaza.
  const tentSpots: Array<[number, number, number, string, string]> = [
    [-7, 0, 12, '#ff5d6c', '#fff3f7'],
    [8, 0, 11, '#5db8ff', '#fff3f7'],
    [-22, 0, -6, '#8be04e', '#fff3f7'],
    [13, 0, 6, '#ffd166', '#ff7eb6'],
  ];
  for (const [x, , z, a, b] of tentSpots) {
    const tent = buildTent(track, a, b);
    tent.position.set(x, 0, z);
    root.add(tent);
  }

  // Trees around the edges to frame the park.
  const treeSpots: Array<[number, number]> = [
    [-28, 8],
    [-30, -16],
    [28, 10],
    [31, -2],
    [-12, 16],
    [4, 16],
    [22, 14],
    [-24, 10],
    [33, -20],
    [-34, -2],
  ];
  for (const [x, z] of treeSpots) {
    const tree = buildTree(track, plainMaterial);
    const s = 0.8 + ((x * 7 + z * 13) % 5) / 10; // deterministic-ish variety
    tree.scale.setScalar(s);
    tree.position.set(x, 0, z);
    root.add(tree);
  }

  const balloons = buildBalloons(track, litMaterial);
  root.add(balloons.group);
  animated.push(balloons);

  const clouds = buildClouds(track, plainMaterial);
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

    for (const m of emissiveMats) m.emissiveIntensity = palette.emissive * (m.userData.glow ?? 0.9);
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
    // Drone-style fly-through: glide along the closed flight path while aiming at
    // the wandering look target. getPointAt uses arc-length so the speed stays
    // even through curves; a faint vertical bob adds an airborne feel.
    const t = (elapsed / LAP_SECONDS) % 1;
    flightPath.getPointAt(t, camPos);
    lookPath.getPointAt(t, camTarget);
    camera.position.copy(camPos);
    camera.position.y += Math.sin(elapsed * 0.55) * 0.35;
    camera.lookAt(camTarget);
    renderer.render(scene, camera);
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

  // Pause when the tab is hidden — no point burning the GPU off-screen.
  const onVisibility = () => {
    if (document.hidden) stop();
    else if (!opts.reducedMotion) start();
  };
  document.addEventListener('visibilitychange', onVisibility);

  if (opts.reducedMotion) {
    // One static, composed frame — no animation loop.
    renderFrame(0, 0);
  } else {
    start();
  }

  return {
    resize(width, height) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
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
      track.disposeAll();
      renderer.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

type MatFactory = (params: THREE.MeshStandardMaterialParameters) => THREE.MeshStandardMaterial;
type LitFactory = (
  params: THREE.MeshStandardMaterialParameters,
  glow?: number
) => THREE.MeshStandardMaterial;

function buildGround(track: Tracker, palette: typeof DAY): THREE.Group {
  const group = new THREE.Group();

  const grassMat = track.mat(
    new THREE.MeshStandardMaterial({ color: palette.ground, roughness: 1 })
  );
  // Keep a handle so theme switches recolor the grass.
  grassMat.userData.isGround = true;
  const ground = new THREE.Mesh(track.geo(new THREE.CircleGeometry(120, 64)), grassMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // A pale plaza disc + crossing paths give the park a centre.
  const pathMat = track.mat(new THREE.MeshStandardMaterial({ color: palette.path, roughness: 1 }));
  const plaza = new THREE.Mesh(track.geo(new THREE.CircleGeometry(11, 48)), pathMat);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.02;
  plaza.receiveShadow = true;
  group.add(plaza);

  for (let i = 0; i < 4; i++) {
    const path = new THREE.Mesh(track.geo(new THREE.PlaneGeometry(5, 60)), pathMat);
    path.rotation.x = -Math.PI / 2;
    path.rotation.z = (i * Math.PI) / 4;
    path.position.y = 0.01;
    path.receiveShadow = true;
    group.add(path);
  }

  return group;
}

/** A whimsical Disney-style castle: a big central keep ringed by spires. */
function buildCastle(track: Tracker, mat: MatFactory, lit: LitFactory): THREE.Group {
  const group = new THREE.Group();
  group.position.set(0, 0, -24);

  const wallMat = mat({ color: C.castleWall, roughness: 0.85 });
  const wallMat2 = mat({ color: C.castleWall2, roughness: 0.85 });
  const goldMat = lit({ color: C.gold, metalness: 0.6, roughness: 0.3 }, 0.7);

  // A single reusable spire: cylinder tower + cone roof + gold finial + flag.
  const makeTower = (
    radius: number,
    height: number,
    roofColor: number,
    flagColor: number,
    body: THREE.MeshStandardMaterial
  ) => {
    const tower = new THREE.Group();
    const shaft = new THREE.Mesh(
      track.geo(new THREE.CylinderGeometry(radius, radius * 1.08, height, 16)),
      body
    );
    shaft.position.y = height / 2;
    shaft.castShadow = true;
    tower.add(shaft);

    const roofH = radius * 3.4;
    const roof = new THREE.Mesh(
      track.geo(new THREE.ConeGeometry(radius * 1.25, roofH, 16)),
      lit({ color: roofColor, roughness: 0.5 }, 0.5)
    );
    roof.position.y = height + roofH / 2;
    roof.castShadow = true;
    tower.add(roof);

    const finial = new THREE.Mesh(
      track.geo(new THREE.SphereGeometry(radius * 0.34, 12, 12)),
      goldMat
    );
    finial.position.y = height + roofH;
    tower.add(finial);

    // Pennant flag on a thin pole.
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

  // Central keep.
  const keep = makeTower(3.2, 12, C.roofBlue, C.flagRed, wallMat);
  group.add(keep);

  // Four corner spires of differing heights/colors.
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

  // Connecting curtain wall + a gatehouse block.
  const wall = new THREE.Mesh(track.geo(new THREE.BoxGeometry(14, 4.5, 3)), wallMat);
  wall.position.set(0, 2.25, 7.5);
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);

  const gate = new THREE.Mesh(
    track.geo(new THREE.CylinderGeometry(1.6, 1.6, 4.2, 16, 1, false, 0, Math.PI)),
    mat({ color: C.roofBlue, roughness: 0.6 })
  );
  gate.rotation.z = -Math.PI / 2;
  gate.rotation.y = Math.PI / 2;
  gate.position.set(0, 0, 9.05);
  group.add(gate);

  return group;
}

/** A Ferris wheel that slowly rotates; gondolas hang and stay upright. */
function buildFerrisWheel(track: Tracker, mat: MatFactory, lit: LitFactory): Animated {
  const group = new THREE.Group();
  const R = 9;
  const spokes = 12;

  const frameMat = lit({ color: 0xff7eb6, metalness: 0.3, roughness: 0.4 }, 0.7);
  const hubMat = lit({ color: C.gold, metalness: 0.6, roughness: 0.3 }, 0.7);

  // A-frame supports.
  const legMat = mat({ color: C.coasterSupport, roughness: 0.6 });
  const legGeo = track.geo(new THREE.CylinderGeometry(0.35, 0.45, R + 4, 10));
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

  // Two rims + spokes.
  const rimGeo = track.geo(new THREE.TorusGeometry(R, 0.22, 10, 48));
  for (const z of [0.9, -0.9]) {
    const rim = new THREE.Mesh(rimGeo, frameMat);
    rim.position.z = z;
    rim.castShadow = true;
    wheel.add(rim);
  }
  const hub = new THREE.Mesh(track.geo(new THREE.CylinderGeometry(0.6, 0.6, 2.2, 14)), hubMat);
  hub.rotation.x = Math.PI / 2;
  wheel.add(hub);

  const spokeGeo = track.geo(new THREE.CylinderGeometry(0.07, 0.07, R * 2, 6));
  for (let i = 0; i < spokes; i++) {
    const spoke = new THREE.Mesh(spokeGeo, frameMat);
    spoke.rotation.z = (i / spokes) * Math.PI;
    wheel.add(spoke);
  }

  // Gondolas pinned around the rim. We keep references so they swing upright.
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
    const cabin = new THREE.Mesh(cabinGeo, lit({ color, roughness: 0.5 }, 0.8));
    cabin.castShadow = true;
    gondola.add(cabin);
    const roof = new THREE.Mesh(roofGeo, lit({ color: C.gold, roughness: 0.4 }, 0.6));
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
      // Counter-rotate each gondola pivot so cabins always hang level.
      for (const g of gondolas) g.rotation.z = -rot;
    },
  };
}

/** A carousel: striped canopy, golden poles, bobbing horses, all spinning. */
function buildCarousel(track: Tracker, mat: MatFactory, lit: LitFactory): Animated {
  const group = new THREE.Group();
  const R = 4.6;

  // Base platform.
  const base = new THREE.Mesh(
    track.geo(new THREE.CylinderGeometry(R + 0.6, R + 0.9, 0.7, 32)),
    mat({ color: 0xf4d9ff, roughness: 0.8 })
  );
  base.position.y = 0.35;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const spinner = new THREE.Group();
  spinner.position.y = 0.7;
  group.add(spinner);

  // Center column.
  const column = new THREE.Mesh(
    track.geo(new THREE.CylinderGeometry(0.5, 0.5, 5.4, 16)),
    lit({ color: C.gold, metalness: 0.5, roughness: 0.35 }, 0.6)
  );
  column.position.y = 2.7;
  spinner.add(column);

  // Striped conical roof.
  const stripe = track.tex(makeStripeTexture('#ff5d6c', '#fff3f7'));
  stripe.repeat.set(6, 1);
  const roof = new THREE.Mesh(
    track.geo(new THREE.ConeGeometry(R + 1.1, 2.4, 24)),
    lit({ map: stripe, color: 0xffffff, roughness: 0.6 }, 0.4)
  );
  roof.position.y = 6.0;
  roof.castShadow = true;
  spinner.add(roof);
  const finial = new THREE.Mesh(
    track.geo(new THREE.SphereGeometry(0.4, 12, 12)),
    lit({ color: C.gold, metalness: 0.6, roughness: 0.3 }, 0.7)
  );
  finial.position.y = 7.4;
  spinner.add(finial);

  // Horses on golden poles.
  const poleGeo = track.geo(new THREE.CylinderGeometry(0.07, 0.07, 3.4, 8));
  const poleMat = lit({ color: C.gold, metalness: 0.6, roughness: 0.3 }, 0.6);
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
    const horseMat = lit({ color, roughness: 0.55 }, 0.6);
    // Stylized horse: body + neck + head.
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
      for (const h of horses) {
        h.mount.position.y = 2.1 + Math.sin(elapsed * 2.2 + h.phase) * 0.28;
      }
    },
  };
}

/**
 * A roller coaster: a closed, hilly, looping track built from a CatmullRom
 * curve, twin rails + cross-ties + support posts, and a multi-car train that
 * rides the curve (oriented by the curve's tangent).
 */
function buildCoaster(track: Tracker, mat: MatFactory, lit: LitFactory): Animated {
  const group = new THREE.Group();

  // Control points: a swooping circuit with a tall lift hill and a dip.
  const pts = [
    new THREE.Vector3(-26, 1, 18),
    new THREE.Vector3(-30, 1.5, 2),
    new THREE.Vector3(-24, 9, -12),
    new THREE.Vector3(-10, 13, -18),
    new THREE.Vector3(6, 7, -16),
    new THREE.Vector3(16, 3, -4),
    new THREE.Vector3(26, 5, 8),
    new THREE.Vector3(20, 2, 20),
    new THREE.Vector3(2, 1.2, 24),
    new THREE.Vector3(-14, 2, 23),
  ].map((p) => p.clone());
  const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);

  const SEG = 320;
  const frames = curve.computeFrenetFrames(SEG, true);
  const railOffset = 0.55;
  const railHalfUp = 0.0;

  // Build two side rails by offsetting sampled points along each frame's
  // binormal, then sweeping a tube through them.
  const leftPts: THREE.Vector3[] = [];
  const rightPts: THREE.Vector3[] = [];
  const centers: THREE.Vector3[] = [];
  for (let i = 0; i <= SEG; i++) {
    const t = i / SEG;
    const p = curve.getPointAt(t);
    centers.push(p);
    const b = frames.binormals[i];
    const n = frames.normals[i];
    const side = b.clone().multiplyScalar(railOffset);
    const up = n.clone().multiplyScalar(railHalfUp);
    leftPts.push(p.clone().add(side).add(up));
    rightPts.push(p.clone().sub(side).add(up));
  }

  const railMat = lit({ color: C.coaster, metalness: 0.3, roughness: 0.4 }, 0.85);
  const makeRail = (points: THREE.Vector3[]) => {
    const c = new THREE.CatmullRomCurve3(points, true);
    const geo = track.geo(new THREE.TubeGeometry(c, SEG, 0.16, 8, true));
    const mesh = new THREE.Mesh(geo, railMat);
    mesh.castShadow = true;
    return mesh;
  };
  group.add(makeRail(leftPts));
  group.add(makeRail(rightPts));

  // Cross-ties between the rails at intervals.
  const tieMat = lit({ color: 0xffe08a, roughness: 0.5 }, 0.6);
  const tieGeo = track.geo(new THREE.BoxGeometry(railOffset * 2 + 0.2, 0.1, 0.18));
  for (let i = 0; i < SEG; i += 5) {
    const tie = new THREE.Mesh(tieGeo, tieMat);
    tie.position.copy(centers[i]);
    const tangent = curve.getTangentAt(i / SEG);
    const m = new THREE.Matrix4();
    m.lookAt(new THREE.Vector3(0, 0, 0), tangent, frames.normals[i]);
    tie.quaternion.setFromRotationMatrix(m);
    group.add(tie);
  }

  // Vertical support posts down to the ground at intervals.
  const postMat = mat({ color: C.coasterSupport, roughness: 0.6 });
  for (let i = 0; i < SEG; i += 16) {
    const p = centers[i];
    if (p.y < 1.2) continue;
    const h = p.y;
    const post = new THREE.Mesh(track.geo(new THREE.CylinderGeometry(0.18, 0.22, h, 8)), postMat);
    post.position.set(p.x, h / 2, p.z);
    post.castShadow = true;
    group.add(post);
  }

  // The train: a chain of cars that follow the curve a fixed distance apart.
  const train = new THREE.Group();
  group.add(train);
  const carCount = 5;
  const carGap = 0.018; // fraction of the curve between car centers
  const cars: THREE.Group[] = [];
  const carBodyGeo = track.geo(new THREE.BoxGeometry(0.9, 0.6, 1.3));
  const noseGeo = track.geo(new THREE.SphereGeometry(0.45, 12, 10));
  const headGeo = track.geo(new THREE.SphereGeometry(0.22, 10, 10));
  const headMat = mat({ color: 0xffe0bd, roughness: 0.7 });
  for (let i = 0; i < carCount; i++) {
    const car = new THREE.Group();
    const color = GONDOLA_COLORS[i % GONDOLA_COLORS.length];
    const carMat = lit({ color, metalness: 0.2, roughness: 0.5 }, 0.85);
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
    // Two little riders.
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
    const pos = curve.getPointAt(tt);
    curve.getTangentAt(tt, tmpTangent);
    car.position.copy(pos);
    car.position.y += 0.32; // sit on top of the rails
    tmpMatrix.lookAt(new THREE.Vector3(0, 0, 0), tmpTangent, up);
    car.quaternion.setFromRotationMatrix(tmpMatrix);
  };

  return {
    group,
    update: (elapsed) => {
      const head = (elapsed * 0.045) % 1; // lap time ~22s
      for (let i = 0; i < cars.length; i++) {
        placeCar(cars[i], head - i * carGap);
      }
    },
  };
}

/** A simple striped circus tent (cone roof on a short cylinder). */
function buildTent(track: Tracker, colorA: string, colorB: string): THREE.Group {
  const group = new THREE.Group();
  const stripe = track.tex(makeStripeTexture(colorA, colorB));
  stripe.repeat.set(8, 1);
  const roofMat = track.mat(new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.7 }));
  const wallMat = track.mat(new THREE.MeshStandardMaterial({ color: 0xfff3f7, roughness: 0.85 }));

  const wall = new THREE.Mesh(track.geo(new THREE.CylinderGeometry(2.4, 2.4, 2, 20)), wallMat);
  wall.position.y = 1;
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);

  const roof = new THREE.Mesh(track.geo(new THREE.ConeGeometry(3.1, 2.6, 20)), roofMat);
  roof.position.y = 3.3;
  roof.castShadow = true;
  group.add(roof);

  const flagMat = track.mat(
    new THREE.MeshStandardMaterial({ color: 0xffd166, side: THREE.DoubleSide })
  );
  const flag = new THREE.Mesh(track.geo(new THREE.PlaneGeometry(0.9, 0.5)), flagMat);
  flag.position.set(0.45, 5.0, 0);
  group.add(flag);
  const pole = new THREE.Mesh(
    track.geo(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6)),
    track.mat(new THREE.MeshStandardMaterial({ color: 0x8a5a2b }))
  );
  pole.position.y = 4.7;
  group.add(pole);

  return group;
}

/** A low-poly tree (trunk + two leaf cones). */
function buildTree(track: Tracker, mat: MatFactory): THREE.Group {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    track.geo(new THREE.CylinderGeometry(0.3, 0.4, 2, 8)),
    mat({ color: C.trunk, roughness: 0.9 })
  );
  trunk.position.y = 1;
  trunk.castShadow = true;
  group.add(trunk);

  const leafGeoLow = track.geo(new THREE.ConeGeometry(1.7, 2.6, 10));
  const leafGeoTop = track.geo(new THREE.ConeGeometry(1.3, 2.2, 10));
  const lower = new THREE.Mesh(leafGeoLow, mat({ color: C.leafDark, roughness: 1 }));
  lower.position.y = 2.6;
  lower.castShadow = true;
  group.add(lower);
  const upper = new THREE.Mesh(leafGeoTop, mat({ color: C.leaf, roughness: 1 }));
  upper.position.y = 3.8;
  upper.castShadow = true;
  group.add(upper);

  return group;
}

/** A bunch of balloons that slowly rise, sway and recycle to the ground. */
function buildBalloons(track: Tracker, lit: LitFactory): Animated {
  const group = new THREE.Group();
  const balloonGeo = track.geo(new THREE.SphereGeometry(0.6, 14, 14));
  const count = 14;
  const items: Array<{
    mesh: THREE.Group;
    speed: number;
    sway: number;
    baseX: number;
    baseZ: number;
  }> = [];

  for (let i = 0; i < count; i++) {
    const b = new THREE.Group();
    const color = BALLOON_COLORS[i % BALLOON_COLORS.length];
    const balloon = new THREE.Mesh(balloonGeo, lit({ color, roughness: 0.35 }, 0.9));
    balloon.scale.y = 1.2;
    b.add(balloon);
    // Little knot.
    const knot = new THREE.Mesh(
      track.geo(new THREE.ConeGeometry(0.12, 0.2, 6)),
      lit({ color, roughness: 0.4 }, 0.9)
    );
    knot.position.y = -0.72;
    knot.rotation.x = Math.PI;
    b.add(knot);

    const baseX = (i / count) * 60 - 30 + ((i * 17) % 7);
    const baseZ = -8 + ((i * 13) % 26);
    b.position.set(baseX, ((i * 11) % 18) + 3, baseZ);
    b.scale.setScalar(0.8 + ((i * 7) % 5) / 6);
    group.add(b);
    items.push({
      mesh: b,
      speed: 0.7 + ((i * 3) % 5) / 5,
      sway: (i % 5) * 0.4,
      baseX,
      baseZ,
    });
  }

  return {
    group,
    update: (elapsed) => {
      for (const it of items) {
        it.mesh.position.y += it.speed * 0.02;
        if (it.mesh.position.y > 26) it.mesh.position.y = 2;
        it.mesh.position.x = it.baseX + Math.sin(elapsed * 0.5 + it.sway) * 1.2;
        it.mesh.rotation.z = Math.sin(elapsed * 0.8 + it.sway) * 0.08;
      }
    },
  };
}

/** Puffy clouds (clusters of flattened spheres) drifting across the sky. */
function buildClouds(track: Tracker, mat: MatFactory): Animated {
  const group = new THREE.Group();
  const cloudMat = mat({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.92 });
  const puffGeo = track.geo(new THREE.SphereGeometry(2, 12, 10));
  const count = 7;
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
    cloud.position.set(((i * 17) % 70) - 35, 24 + ((i * 11) % 10), -30 - ((i * 13) % 26));
    cloud.scale.setScalar(1 + ((i * 5) % 4) / 4);
    group.add(cloud);
    clouds.push({ mesh: cloud, speed: 0.4 + ((i * 3) % 5) / 6 });
  }

  return {
    group,
    update: (_elapsed, delta) => {
      for (const c of clouds) {
        c.mesh.position.x += c.speed * delta * 1.4;
        if (c.mesh.position.x > 48) c.mesh.position.x = -48;
      }
    },
  };
}

/** A field of stars, only visible in the night (dark) theme. */
function buildStars(track: Tracker): THREE.Points {
  const count = 220;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Scatter over an upper dome behind the park.
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.42;
    const r = 150;
    positions[i * 3] = Math.cos(theta) * Math.sin(phi) * r;
    positions[i * 3 + 1] = Math.cos(phi) * r * 0.7 + 12;
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
