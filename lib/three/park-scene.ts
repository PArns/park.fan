import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * park-scene.ts — a stylised RollerCoaster Tycoon 1 / 2 theme park rendered with
 * three.js for the homepage hero background.
 *
 * Goals (see PR briefing): an authentic RCT2 look — bright, sunny, saturated,
 * flat-shaded "toy" geometry; dense detail (stalls, peeps, benches, lamps,
 * flowers, bunting); round bushy trees; grey tile paths with kerbs; teal ponds;
 * colourful rides. A camera flies slowly through the park entrance arch and then
 * makes a stately loop over the busy park, never facing empty ground.
 *
 * The look is **theme-independent**: always the bright daytime palette, even in
 * the site's dark mode (`setTheme` is intentionally a no-op).
 *
 * Rendering approach (lessons learned): direct `renderer.render`, no Bloom and no
 * IBL/PMREM (both washed the scene out). `MeshStandardMaterial` with
 * `flatShading: true`, a strong HemisphereLight + DirectionalLight + a little
 * ambient, ACESFilmic tone mapping, and a constant `emissive` glow for accents.
 */

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type SceneTheme = 'light' | 'dark';

export interface ParkSceneHandle {
  resize: (width: number, height: number) => void;
  /** No-op: the park is intentionally always the bright daytime look. */
  setTheme: (theme: SceneTheme) => void;
  dispose: () => void;
}

interface CreateOptions {
  theme: SceneTheme;
  /** When true: build the scene, render ONE frame, never start the loop. */
  reducedMotion: boolean;
  /** Fires once the scene is built and any external images have loaded. */
  onReady?: () => void;
}

interface Animated {
  update: (elapsed: number, delta: number) => void;
}

// ---------------------------------------------------------------------------
// Palette — authentic RCT2 master-palette hex values
// ---------------------------------------------------------------------------

const PAL = {
  // sky / atmosphere
  skyTop: '#3b8fe3',
  skyBottom: '#cdeeff',
  fog: 0xbfe6ff,
  // terrain
  grass: 0x5bbf3f,
  grassDark: 0x47af27,
  grassLight: 0x8bdf73,
  soil: 0x8f6327,
  sand: 0xe7dba3,
  // paths
  path: 0xb7c3c3,
  pathEdge: 0x6f8383,
  pathDark: 0x839797,
  // water (RCT teal)
  water: 0x2b938f,
  waterLight: 0x63bbbb,
  // wood / stone
  wood: 0x8f6327,
  woodLight: 0xcbaf6f,
  stone: 0x9fafaf,
  // accents
  red: 0xe30700,
  yellow: 0xffe72f,
  orange: 0xff6f17,
  blue: 0x2b67df,
  green: 0x47af27,
  magenta: 0xdb3b8f,
  purple: 0x8753bb,
  white: 0xf7f7f7,
} as const;

/** Saturated ride / canopy colours (cycled). */
const RIDE_COLORS = [
  0xe30700, 0xffe72f, 0x2b67df, 0x47af27, 0x8753bb, 0xdb3b8f, 0xff6f17, 0x47a7a3,
];
/** Flower-bed colours. */
const FLOWER_COLORS = [0xe30700, 0xffe72f, 0xdb3b8f, 0x8753bb, 0xff6f17, 0xf7f7f7];
/** Peep shirt colours. */
const SHIRT_COLORS = [
  0xe30700, 0x2b67df, 0x47af27, 0xffe72f, 0x8753bb, 0xdb3b8f, 0xff6f17, 0x47a7a3, 0xf7f7f7,
];
/** Peep trouser colours. */
const PANTS_COLORS = [0x273b97, 0x4f2b13, 0x333767, 0x573b0b, 0x172323, 0x6b5333];
/** Peep skin tones. */
const SKIN_COLORS = [0xffcb87, 0xe3ab83, 0xcf8363, 0x8f6327, 0xffdba3];

// ---------------------------------------------------------------------------
// Disposal tracker — every geometry / material / texture is registered so
// dispose() can free all GPU resources (no leaks).
// ---------------------------------------------------------------------------

class Tracker {
  geos = new Set<THREE.BufferGeometry>();
  mats = new Set<THREE.Material>();
  texs = new Set<THREE.Texture>();
  geo<T extends THREE.BufferGeometry>(g: T): T {
    this.geos.add(g);
    return g;
  }
  mat<T extends THREE.Material>(m: T): T {
    this.mats.add(m);
    return m;
  }
  tex<T extends THREE.Texture>(t: T): T {
    this.texs.add(t);
    return t;
  }
  dispose() {
    for (const g of this.geos) g.dispose();
    for (const m of this.mats) m.dispose();
    for (const t of this.texs) t.dispose();
    this.geos.clear();
    this.mats.clear();
    this.texs.clear();
  }
}

// ---------------------------------------------------------------------------
// Procedural textures (CanvasTexture) — simple, flat, RCT-style patterns.
// ---------------------------------------------------------------------------

function canvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')!];
}

function makeSkyTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, PAL.skyTop);
  g.addColorStop(0.55, '#7fc2f3');
  g.addColorStop(1, PAL.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeNightSkyTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#070b1e');
  g.addColorStop(0.55, '#142150');
  g.addColorStop(1, '#33508c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  // faint baked stars in the upper sky
  for (let i = 0; i < 130; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.5 + 0.2})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 150, 1, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeStripeTexture(a: string, b: string): THREE.CanvasTexture {
  const [c, ctx] = canvas(64);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? a : b;
    ctx.fillRect(i * 8, 0, 8, 64);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function makeWaterTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(128);
  ctx.fillStyle = '#2b938f';
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 60; i++) {
    ctx.strokeStyle = Math.random() > 0.5 ? '#63bbbb' : '#177f77';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const y = Math.random() * 128;
    ctx.moveTo(Math.random() * 128, y);
    ctx.lineTo(Math.random() * 128, y + (Math.random() * 6 - 3));
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ---------------------------------------------------------------------------
// Build context passed to every builder.
// ---------------------------------------------------------------------------

interface BuildCtx {
  track: Tracker;
  /** Flat-shaded standard material (the toy/toon look). */
  mat: (params: THREE.MeshStandardMaterialParameters) => THREE.MeshStandardMaterial;
  /** Like mat() but with a constant emissive glow for lively accents. */
  lit: (params: THREE.MeshStandardMaterialParameters, glow?: number) => THREE.MeshStandardMaterial;
  stripeTex: (a: string, b: string) => THREE.CanvasTexture;
  /** Register a light that is OFF by day and switches ON at night. */
  nightLight: (light: THREE.Light, nightIntensity: number) => void;
  /** Lighter geometry/counts on small screens. */
  mobile: boolean;
  /** Shared PBR map sets (color + normal + roughness) keyed by material. */
  pbr: {
    grass: THREE.MeshStandardMaterialParameters;
    paving: THREE.MeshStandardMaterialParameters;
    wood: THREE.MeshStandardMaterialParameters;
    stone: THREE.MeshStandardMaterialParameters;
  };
}

// short helpers --------------------------------------------------------------

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ---------------------------------------------------------------------------
// Builders: terrain & paths
// ---------------------------------------------------------------------------

const HALF = 46; // park half-extent (world units)

function buildGround(ctx: BuildCtx): THREE.Mesh {
  const geo = ctx.track.geo(new THREE.PlaneGeometry(HALF * 2 + 40, HALF * 2 + 40));
  // bright RCT-green grass with normal/roughness relief for texture
  const mesh = new THREE.Mesh(
    geo,
    ctx.mat({ ...ctx.pbr.grass, color: 0x6fcf57, flatShading: false, roughness: 1 })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * A paved path strip (textured paving). Tiling is baked into the plane's UVs so
 * the shared PBR maps can be reused across every strip without cloning.
 */
function pathStrip(ctx: BuildCtx, width: number, len: number): THREE.Group {
  const g = new THREE.Group();
  const geo = ctx.track.geo(new THREE.PlaneGeometry(width, len));
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (width / 3), uv.getY(i) * (len / 3));
  uv.needsUpdate = true;
  const top = new THREE.Mesh(
    geo,
    ctx.mat({ ...ctx.pbr.paving, color: 0xc4cfcf, flatShading: false, roughness: 1 })
  );
  top.rotation.x = -Math.PI / 2;
  top.position.y = 0.09;
  top.receiveShadow = true;
  g.add(top);
  return g;
}

function buildPaths(ctx: BuildCtx): THREE.Group {
  const g = new THREE.Group();
  // main street: entrance (front, +z) straight back to the plaza
  const main = pathStrip(ctx, 7, 64);
  main.position.set(0, 0, 4);
  g.add(main);
  // central plaza (wide square)
  const plaza = pathStrip(ctx, 26, 26);
  plaza.position.set(0, 0, -4);
  g.add(plaza);
  // cross avenues off the plaza
  const cross = pathStrip(ctx, 52, 6);
  cross.position.set(0, 0, -4);
  g.add(cross);
  // a path toward the back-left and back-right ride areas
  const left = pathStrip(ctx, 6, 30);
  left.position.set(-22, 0, -20);
  g.add(left);
  const right = pathStrip(ctx, 6, 30);
  right.position.set(22, 0, -20);
  g.add(right);
  const back = pathStrip(ctx, 50, 6);
  back.position.set(0, 0, -34);
  g.add(back);
  return g;
}

function buildPond(ctx: BuildCtx, waterTex: THREE.Texture): { group: THREE.Group } & Animated {
  const g = new THREE.Group();
  waterTex.repeat.set(3, 3);
  const water = new THREE.Mesh(
    ctx.track.geo(new THREE.CircleGeometry(11, 36)),
    ctx.mat({
      map: waterTex,
      color: PAL.waterLight,
      roughness: 0.35,
      metalness: 0.0,
      transparent: true,
      opacity: 0.92,
    })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.06;
  g.add(water);
  // stone rim
  const rim = new THREE.Mesh(
    ctx.track.geo(new THREE.TorusGeometry(11.2, 0.5, 8, 40)),
    ctx.mat({ color: PAL.stone, roughness: 1 })
  );
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 0.18;
  g.add(rim);
  return {
    group: g,
    update(elapsed) {
      waterTex.offset.x = Math.sin(elapsed * 0.05) * 0.04;
      waterTex.offset.y = elapsed * 0.012;
    },
  };
}

// ---------------------------------------------------------------------------
// Builders: scenery
// ---------------------------------------------------------------------------

/** A round, bushy RCT tree: brown trunk + 1–3 overlapping low-poly green blobs. */
function buildTree(ctx: BuildCtx): THREE.Group {
  const g = new THREE.Group();
  const h = rnd(1.6, 2.6);
  const trunk = new THREE.Mesh(
    ctx.track.geo(new THREE.CylinderGeometry(0.18, 0.26, h, 6)),
    ctx.mat({ color: PAL.wood, roughness: 1 })
  );
  trunk.position.y = h / 2;
  trunk.castShadow = true;
  g.add(trunk);
  const tone = pick([0x2f8f1f, 0x47af27, 0x379f17, 0x1f7b00]);
  const blobs = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < blobs; i++) {
    const r = rnd(1.0, 1.5) * (i === 0 ? 1 : 0.8);
    const blob = new THREE.Mesh(
      ctx.track.geo(new THREE.IcosahedronGeometry(r, 1)),
      ctx.mat({ color: tone, flatShading: true, roughness: 1 })
    );
    blob.position.set(rnd(-0.5, 0.5), h + rnd(-0.2, 0.6) + i * 0.5, rnd(-0.5, 0.5));
    blob.castShadow = true;
    g.add(blob);
  }
  return g;
}

/** A bed of small coloured flowers (instanced) inside a soil border. */
function buildFlowerBed(ctx: BuildCtx, w: number, d: number): THREE.Group {
  const g = new THREE.Group();
  const soil = new THREE.Mesh(
    ctx.track.geo(new THREE.BoxGeometry(w, 0.22, d)),
    ctx.mat({ color: PAL.soil, roughness: 1 })
  );
  soil.position.y = 0.11;
  g.add(soil);
  const count = Math.floor(w * d * 1.4);
  const stem = ctx.track.geo(new THREE.SphereGeometry(0.16, 6, 5));
  for (const color of FLOWER_COLORS) {
    const mat = ctx.lit({ color, roughness: 1 }, 0.4);
    const inst = new THREE.InstancedMesh(stem, mat, count);
    const m = new THREE.Matrix4();
    let n = 0;
    for (let i = 0; i < count; i++) {
      if (Math.random() > 1 / FLOWER_COLORS.length) continue;
      m.makeTranslation(rnd(-w / 2 + 0.3, w / 2 - 0.3), 0.32, rnd(-d / 2 + 0.3, d / 2 - 0.3));
      inst.setMatrixAt(n++, m);
    }
    inst.count = n;
    inst.instanceMatrix.needsUpdate = true;
    g.add(inst);
  }
  return g;
}

/** A short white picket / railing fence segment along +x. */
function buildFence(ctx: BuildCtx, len: number): THREE.Group {
  const g = new THREE.Group();
  const railMat = ctx.mat({ color: PAL.white, roughness: 1 });
  const rail = new THREE.Mesh(ctx.track.geo(new THREE.BoxGeometry(len, 0.12, 0.08)), railMat);
  rail.position.y = 0.7;
  g.add(rail);
  const posts = Math.max(2, Math.round(len / 1.2));
  const post = ctx.track.geo(new THREE.BoxGeometry(0.1, 0.95, 0.1));
  const inst = new THREE.InstancedMesh(post, railMat, posts);
  const m = new THREE.Matrix4();
  for (let i = 0; i < posts; i++) {
    m.makeTranslation(-len / 2 + (i * len) / (posts - 1), 0.47, 0);
    inst.setMatrixAt(i, m);
  }
  inst.instanceMatrix.needsUpdate = true;
  g.add(inst);
  return g;
}

/** A lamp post (unlit by day, but a warm glowing globe for life). */
function buildLamp(ctx: BuildCtx): THREE.Group {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(
    ctx.track.geo(new THREE.CylinderGeometry(0.07, 0.09, 3, 6)),
    ctx.mat({ color: 0x3f5353, roughness: 1 })
  );
  pole.position.y = 1.5;
  pole.castShadow = true;
  g.add(pole);
  const globe = new THREE.Mesh(
    ctx.track.geo(new THREE.SphereGeometry(0.22, 8, 8)),
    ctx.lit({ color: 0xfff3df, roughness: 0.5 }, 0.7)
  );
  globe.position.y = 3.05;
  g.add(globe);
  // warm pool of light, switched on at night (skipped on mobile for perf — the
  // emissive globe still glows via bloom)
  if (!ctx.mobile) {
    const bulb = new THREE.PointLight(0xffdca8, 0, 15, 1.7);
    bulb.position.y = 3.0;
    ctx.nightLight(bulb, 8);
    g.add(bulb);
  }
  return g;
}

/** A park bench. */
function buildBench(ctx: BuildCtx): THREE.Group {
  const g = new THREE.Group();
  const woodMat = ctx.mat({ ...ctx.pbr.wood, color: 0xe0c690, flatShading: false, roughness: 1 });
  const seat = new THREE.Mesh(ctx.track.geo(new THREE.BoxGeometry(1.4, 0.1, 0.5)), woodMat);
  seat.position.y = 0.5;
  g.add(seat);
  const back = new THREE.Mesh(ctx.track.geo(new THREE.BoxGeometry(1.4, 0.5, 0.1)), woodMat);
  back.position.set(0, 0.75, -0.2);
  g.add(back);
  for (const sx of [-0.6, 0.6]) {
    const leg = new THREE.Mesh(
      ctx.track.geo(new THREE.BoxGeometry(0.1, 0.5, 0.4)),
      ctx.mat({ color: 0x3f5353, roughness: 1 })
    );
    leg.position.set(sx, 0.25, 0);
    g.add(leg);
  }
  return g;
}

/** A litter bin. */
function buildBin(ctx: BuildCtx): THREE.Mesh {
  const bin = new THREE.Mesh(
    ctx.track.geo(new THREE.CylinderGeometry(0.25, 0.2, 0.6, 8)),
    ctx.mat({ color: PAL.red, roughness: 1 })
  );
  bin.position.y = 0.3;
  return bin;
}

/** A tiered stone fountain with gently pulsing water jets — a plaza centrepiece. */
function buildFountain(ctx: BuildCtx): Ride {
  const g = new THREE.Group();
  const stoneMat = ctx.mat({ ...ctx.pbr.stone, color: 0xccd4d4, flatShading: false, roughness: 1 });
  const basin = new THREE.Mesh(
    ctx.track.geo(new THREE.CylinderGeometry(3.4, 3.7, 0.9, 24)),
    stoneMat
  );
  basin.position.y = 0.45;
  basin.receiveShadow = true;
  g.add(basin);
  const waterMat = ctx.lit(
    { color: PAL.waterLight, roughness: 0.3, transparent: true, opacity: 0.9 },
    0.15
  );
  const water = new THREE.Mesh(ctx.track.geo(new THREE.CircleGeometry(3.15, 28)), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.8;
  g.add(water);
  const stem = new THREE.Mesh(
    ctx.track.geo(new THREE.CylinderGeometry(0.45, 0.65, 1.6, 12)),
    stoneMat
  );
  stem.position.y = 1.5;
  g.add(stem);
  const bowl = new THREE.Mesh(
    ctx.track.geo(new THREE.CylinderGeometry(1.5, 0.35, 0.45, 16)),
    stoneMat
  );
  bowl.position.y = 2.25;
  g.add(bowl);
  const stem2 = new THREE.Mesh(
    ctx.track.geo(new THREE.CylinderGeometry(0.28, 0.38, 1.0, 10)),
    stoneMat
  );
  stem2.position.y = 2.9;
  g.add(stem2);
  // water jets (thin light-blue cones that pulse)
  const jets: THREE.Mesh[] = [];
  const jetMat = ctx.lit(
    { color: 0xafe7fb, roughness: 0.2, transparent: true, opacity: 0.85 },
    0.4
  );
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const jet = new THREE.Mesh(ctx.track.geo(new THREE.ConeGeometry(0.12, 1.3, 6)), jetMat);
    jet.position.set(Math.cos(a) * 0.9, 3.6, Math.sin(a) * 0.9);
    g.add(jet);
    jets.push(jet);
  }
  const top = new THREE.Mesh(ctx.track.geo(new THREE.ConeGeometry(0.18, 1.6, 6)), jetMat);
  top.position.y = 4.0;
  g.add(top);
  jets.push(top);
  return {
    group: g,
    update(elapsed) {
      for (let i = 0; i < jets.length; i++) {
        const s = 0.8 + Math.sin(elapsed * 3 + i) * 0.25;
        jets[i].scale.y = s;
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Builders: the iconic RCT2 food stall (Bude)
// ---------------------------------------------------------------------------

type StallKind = 'icecream' | 'burger' | 'hotdog' | 'drink' | 'donut' | 'fries';

/** A giant food item that perches on a stall roof — the RCT2 signature. */
function buildGiantFood(ctx: BuildCtx, kind: StallKind): THREE.Group {
  const g = new THREE.Group();
  switch (kind) {
    case 'icecream': {
      const cone = new THREE.Mesh(
        ctx.track.geo(new THREE.ConeGeometry(0.42, 1.0, 10)),
        ctx.lit({ color: 0xe7dba3, roughness: 1 }, 0.3)
      );
      cone.rotation.x = Math.PI;
      cone.position.y = 0.5;
      g.add(cone);
      for (let i = 0; i < 3; i++) {
        const scoop = new THREE.Mesh(
          ctx.track.geo(new THREE.SphereGeometry(0.4, 10, 9)),
          ctx.lit({ color: pick([0xf7cfab, 0xffbfbf, 0xfff3df]), roughness: 1 }, 0.3)
        );
        scoop.position.y = 1.05 + i * 0.42;
        g.add(scoop);
      }
      break;
    }
    case 'burger': {
      const bunMat = ctx.lit({ color: 0xcb8b43, roughness: 1 }, 0.25);
      const bottom = new THREE.Mesh(
        ctx.track.geo(new THREE.CylinderGeometry(0.7, 0.65, 0.3, 14)),
        bunMat
      );
      bottom.position.y = 0.15;
      g.add(bottom);
      const patty = new THREE.Mesh(
        ctx.track.geo(new THREE.CylinderGeometry(0.72, 0.72, 0.22, 14)),
        ctx.lit({ color: 0x573b0b, roughness: 1 }, 0.2)
      );
      patty.position.y = 0.4;
      g.add(patty);
      const cheese = new THREE.Mesh(
        ctx.track.geo(new THREE.BoxGeometry(1.4, 0.08, 1.4)),
        ctx.lit({ color: PAL.yellow, roughness: 1 }, 0.4)
      );
      cheese.position.y = 0.52;
      cheese.rotation.y = Math.PI / 4;
      g.add(cheese);
      const top = new THREE.Mesh(
        ctx.track.geo(new THREE.SphereGeometry(0.7, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2)),
        bunMat
      );
      top.position.y = 0.56;
      g.add(top);
      break;
    }
    case 'hotdog': {
      const bun = new THREE.Mesh(
        ctx.track.geo(new THREE.CapsuleGeometry(0.32, 1.1, 4, 10)),
        ctx.lit({ color: 0xcb8b43, roughness: 1 }, 0.25)
      );
      bun.rotation.z = Math.PI / 2;
      bun.position.y = 0.4;
      g.add(bun);
      const sausage = new THREE.Mesh(
        ctx.track.geo(new THREE.CapsuleGeometry(0.22, 1.2, 4, 10)),
        ctx.lit({ color: 0x9f3300, roughness: 1 }, 0.25)
      );
      sausage.rotation.z = Math.PI / 2;
      sausage.position.y = 0.62;
      g.add(sausage);
      break;
    }
    case 'drink': {
      const cup = new THREE.Mesh(
        ctx.track.geo(new THREE.CylinderGeometry(0.45, 0.34, 1.1, 14)),
        ctx.lit({ color: PAL.red, roughness: 1 }, 0.35)
      );
      cup.position.y = 0.55;
      g.add(cup);
      const lid = new THREE.Mesh(
        ctx.track.geo(new THREE.CylinderGeometry(0.48, 0.48, 0.12, 14)),
        ctx.lit({ color: PAL.white, roughness: 1 }, 0.3)
      );
      lid.position.y = 1.16;
      g.add(lid);
      const straw = new THREE.Mesh(
        ctx.track.geo(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 6)),
        ctx.lit({ color: PAL.yellow, roughness: 1 }, 0.4)
      );
      straw.position.set(0.12, 1.5, 0);
      straw.rotation.z = 0.2;
      g.add(straw);
      break;
    }
    case 'donut': {
      const donut = new THREE.Mesh(
        ctx.track.geo(new THREE.TorusGeometry(0.55, 0.28, 12, 18)),
        ctx.lit({ color: 0xff7eb6, roughness: 1 }, 0.3)
      );
      donut.position.y = 0.7;
      donut.rotation.x = Math.PI / 2.4;
      g.add(donut);
      break;
    }
    case 'fries': {
      const box = new THREE.Mesh(
        ctx.track.geo(new THREE.CylinderGeometry(0.32, 0.42, 0.7, 4)),
        ctx.lit({ color: PAL.red, roughness: 1 }, 0.35)
      );
      box.rotation.y = Math.PI / 4;
      box.position.y = 0.45;
      g.add(box);
      for (let i = 0; i < 6; i++) {
        const fry = new THREE.Mesh(
          ctx.track.geo(new THREE.BoxGeometry(0.08, 0.6, 0.08)),
          ctx.lit({ color: PAL.yellow, roughness: 1 }, 0.4)
        );
        fry.position.set(rnd(-0.18, 0.18), 0.95, rnd(-0.18, 0.18));
        fry.rotation.z = rnd(-0.2, 0.2);
        g.add(fry);
      }
      break;
    }
  }
  return g;
}

/**
 * A 1-tile RCT2 food stall: a small counter box, a bright striped awning, a sign,
 * and a giant food item on the roof.
 */
function buildStall(ctx: BuildCtx, kind: StallKind, awningA: string, awningB: string): THREE.Group {
  const g = new THREE.Group();
  const W = 2.6;
  // counter / body
  const body = new THREE.Mesh(
    ctx.track.geo(new THREE.BoxGeometry(W, 2.0, W)),
    ctx.mat({ ...ctx.pbr.wood, color: 0xe0c690, flatShading: false, roughness: 1 })
  );
  body.position.y = 1.0;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);
  // dark counter top + serving hatch
  const counter = new THREE.Mesh(
    ctx.track.geo(new THREE.BoxGeometry(W + 0.2, 0.18, W + 0.2)),
    ctx.mat({ color: PAL.wood, roughness: 1 })
  );
  counter.position.y = 1.5;
  g.add(counter);
  const hatch = new THREE.Mesh(
    ctx.track.geo(new THREE.BoxGeometry(W - 0.5, 0.9, 0.06)),
    ctx.mat({ color: 0x172323, roughness: 1 })
  );
  hatch.position.set(0, 1.05, W / 2 + 0.02);
  g.add(hatch);
  // striped awning — a slightly pitched canopy over the hatch
  const stripeTex = ctx.stripeTex(awningA, awningB);
  stripeTex.repeat.set(4, 1);
  const awning = new THREE.Mesh(
    ctx.track.geo(new THREE.BoxGeometry(W + 0.6, 0.1, 1.4)),
    ctx.mat({ map: stripeTex, color: 0xffffff, roughness: 1 })
  );
  ctx.track.tex(stripeTex);
  awning.position.set(0, 2.0, W / 2 + 0.2);
  awning.rotation.x = -0.32;
  awning.castShadow = true;
  g.add(awning);
  // scalloped awning fringe
  const fringe = new THREE.Mesh(
    ctx.track.geo(new THREE.BoxGeometry(W + 0.6, 0.3, 0.06)),
    ctx.mat({ map: stripeTex, color: 0xffffff, roughness: 1 })
  );
  fringe.position.set(0, 1.82, W / 2 + 0.86);
  g.add(fringe);
  // roof slab the giant food sits on
  const roof = new THREE.Mesh(
    ctx.track.geo(new THREE.BoxGeometry(W, 0.2, W)),
    ctx.mat({ color: pick(RIDE_COLORS), roughness: 1 })
  );
  roof.position.y = 2.1;
  g.add(roof);
  // giant food signature item
  const food = buildGiantFood(ctx, kind);
  food.position.y = 2.2;
  g.add(food);
  return g;
}

// ---------------------------------------------------------------------------
// Builders: peeps (RCT guests) — chunky little figures that walk the paths
// ---------------------------------------------------------------------------

interface Peep extends Animated {
  group: THREE.Group;
}

/** One chunky peep: big round head + colourful torso + short legs. */
function makePeep(ctx: BuildCtx): THREE.Group {
  const g = new THREE.Group();
  const skin = pick(SKIN_COLORS);
  const shirt = pick(SHIRT_COLORS);
  const pants = pick(PANTS_COLORS);
  // torso (short, slightly tapered)
  const torso = new THREE.Mesh(
    ctx.track.geo(new THREE.CylinderGeometry(0.2, 0.24, 0.42, 8)),
    ctx.mat({ color: shirt, roughness: 1 })
  );
  torso.position.y = 0.5;
  torso.castShadow = true;
  g.add(torso);
  // big round head
  const head = new THREE.Mesh(
    ctx.track.geo(new THREE.SphereGeometry(0.26, 10, 9)),
    ctx.mat({ color: skin, roughness: 1 })
  );
  head.position.y = 0.95;
  head.castShadow = true;
  g.add(head);
  // simple hair cap
  const hair = new THREE.Mesh(
    ctx.track.geo(new THREE.SphereGeometry(0.27, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2)),
    ctx.mat({ color: pick([0x271300, 0x573b0b, 0x4f2700, 0x172323, 0x8f6327]), roughness: 1 })
  );
  hair.position.y = 1.0;
  g.add(hair);
  // legs
  for (const sx of [-0.1, 0.1]) {
    const leg = new THREE.Mesh(
      ctx.track.geo(new THREE.CylinderGeometry(0.08, 0.08, 0.34, 6)),
      ctx.mat({ color: pants, roughness: 1 })
    );
    leg.position.set(sx, 0.17, 0);
    leg.name = sx < 0 ? 'legL' : 'legR';
    g.add(leg);
  }
  g.scale.setScalar(1.05);
  return g;
}

/**
 * A crowd of peeps walking back and forth along assigned path segments, with a
 * little walk-bob and leg swing. `routes` are [from, to] world points.
 */
function buildPeeps(ctx: BuildCtx, routes: [THREE.Vector3, THREE.Vector3][]): Peep {
  const group = new THREE.Group();
  const walkers: {
    obj: THREE.Group;
    a: THREE.Vector3;
    b: THREE.Vector3;
    speed: number;
    phase: number;
    legL?: THREE.Object3D;
    legR?: THREE.Object3D;
  }[] = [];
  for (const [a, b] of routes) {
    const n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const obj = makePeep(ctx);
      group.add(obj);
      walkers.push({
        obj,
        a: a.clone(),
        b: b.clone(),
        speed: rnd(0.05, 0.12),
        phase: Math.random(),
        legL: obj.getObjectByName('legL') ?? undefined,
        legR: obj.getObjectByName('legR') ?? undefined,
      });
    }
  }
  const tmp = new THREE.Vector3();
  return {
    group,
    update(elapsed) {
      for (const w of walkers) {
        // ping-pong 0..1..0 along the segment
        const tri = Math.abs(((elapsed * w.speed + w.phase) % 2) - 1);
        tmp.copy(w.a).lerp(w.b, tri);
        w.obj.position.copy(tmp);
        // face direction of travel
        const dir = (elapsed * w.speed + w.phase) % 2 < 1 ? 1 : -1;
        w.obj.rotation.y = Math.atan2((w.b.x - w.a.x) * dir, (w.b.z - w.a.z) * dir);
        // walk bob + leg swing
        const swing = Math.sin(elapsed * 8 * w.speed * 10 + w.phase * 6);
        w.obj.position.y = Math.abs(Math.sin(elapsed * 6 + w.phase * 6)) * 0.06;
        if (w.legL) w.legL.rotation.x = swing * 0.5;
        if (w.legR) w.legR.rotation.x = -swing * 0.5;
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Builders: the park entrance arch (RCT2 style, with twin towers + banner)
// ---------------------------------------------------------------------------

/** A ticket booth (Kassenhäuschen): cream kiosk, service window, peaked roof. */
function buildTicketBooth(ctx: BuildCtx): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    ctx.track.geo(new THREE.BoxGeometry(2.2, 2.4, 1.9)),
    ctx.mat({ color: 0xefe6cf, roughness: 1 })
  );
  body.position.y = 1.2;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);
  // service window (faces +z) + bright frame
  const win = new THREE.Mesh(
    ctx.track.geo(new THREE.BoxGeometry(1.5, 1.0, 0.06)),
    ctx.lit({ color: 0x9fd3f3, roughness: 0.5 }, 0.25)
  );
  win.position.set(0, 1.45, 0.98);
  g.add(win);
  const frame = new THREE.Mesh(
    ctx.track.geo(new THREE.BoxGeometry(1.75, 1.25, 0.1)),
    ctx.lit({ color: PAL.red, roughness: 1 }, 0.18)
  );
  frame.position.set(0, 1.45, 0.93);
  g.add(frame);
  // little sign board above the window ("KASSE"/tickets — a coloured plaque)
  const sign = new THREE.Mesh(
    ctx.track.geo(new THREE.BoxGeometry(1.7, 0.5, 0.08)),
    ctx.lit({ color: PAL.blue, roughness: 1 }, 0.22)
  );
  sign.position.set(0, 2.25, 0.98);
  g.add(sign);
  // peaked (hipped) roof, overhanging
  const roof = new THREE.Mesh(
    ctx.track.geo(new THREE.ConeGeometry(2.0, 1.4, 4)),
    ctx.lit({ color: PAL.red, roughness: 1 }, 0.16)
  );
  roof.position.y = 3.1;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);
  const finial = new THREE.Mesh(
    ctx.track.geo(new THREE.SphereGeometry(0.16, 8, 8)),
    ctx.lit({ color: PAL.yellow, roughness: 0.6 }, 0.5)
  );
  finial.position.y = 3.9;
  g.add(finial);
  return g;
}

/** A turnstile: a low post with a three-arm rotor across the entry threshold. */
function buildTurnstile(ctx: BuildCtx): THREE.Group {
  const g = new THREE.Group();
  const metal = ctx.mat({ color: 0xb7c3c3, roughness: 0.6, metalness: 0.1 });
  const post = new THREE.Mesh(
    ctx.track.geo(new THREE.CylinderGeometry(0.14, 0.16, 1.1, 10)),
    metal
  );
  post.position.y = 0.55;
  g.add(post);
  const armGeo = ctx.track.geo(new THREE.BoxGeometry(0.72, 0.06, 0.06));
  for (let i = 0; i < 3; i++) {
    const arm = new THREE.Mesh(armGeo, metal);
    arm.position.y = 0.95;
    arm.rotation.y = (i / 3) * Math.PI * 2;
    arm.position.x = Math.cos(arm.rotation.y) * 0.36;
    arm.position.z = Math.sin(arm.rotation.y) * 0.36;
    g.add(arm);
  }
  return g;
}

function buildEntrance(ctx: BuildCtx, logoWord: THREE.Texture): THREE.Group {
  const g = new THREE.Group();
  const span = 14;
  const towerH = 7.5;
  const towerMat = ctx.mat({ color: PAL.red, roughness: 1 });
  const trimMat = ctx.lit({ color: PAL.yellow, roughness: 1 }, 0.3);
  for (const sx of [-1, 1]) {
    const tx = (sx * span) / 2;
    const tower = new THREE.Mesh(ctx.track.geo(new THREE.BoxGeometry(2.8, towerH, 2.8)), towerMat);
    tower.position.set(tx, towerH / 2, 0);
    tower.castShadow = true;
    g.add(tower);
    // conical cap
    const cap = new THREE.Mesh(
      ctx.track.geo(new THREE.ConeGeometry(2.3, 2.6, 8)),
      ctx.lit({ color: PAL.blue, roughness: 1 }, 0.25)
    );
    cap.position.set(tx, towerH + 1.3, 0);
    g.add(cap);
    // flag
    const pole = new THREE.Mesh(
      ctx.track.geo(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 5)),
      ctx.mat({ color: 0xd3dbdb, roughness: 1 })
    );
    pole.position.set(tx, towerH + 3.2, 0);
    g.add(pole);
    const flag = new THREE.Mesh(ctx.track.geo(new THREE.BoxGeometry(0.9, 0.5, 0.04)), trimMat);
    flag.position.set(tx + 0.5, towerH + 3.6, 0);
    g.add(flag);
    // a Kassenhäuschen flanking the central passage on each side
    const booth = buildTicketBooth(ctx);
    booth.position.set(sx * 4.3, 0, 0.2);
    g.add(booth);
    // low railing linking the booth to the tower
    const rail = new THREE.Mesh(
      ctx.track.geo(new THREE.BoxGeometry(1.6, 1.0, 0.18)),
      ctx.lit({ color: PAL.blue, roughness: 1 }, 0.14)
    );
    rail.position.set(sx * 5.85, 0.6, 0);
    g.add(rail);
  }
  // turnstiles across the open central passage (camera flies over them)
  for (const tx of [-1.7, 0, 1.7]) {
    const ts = buildTurnstile(ctx);
    ts.position.set(tx, 0, 1.0);
    g.add(ts);
  }
  // banner across the top (the camera flies UNDER this, through the arch) — a
  // brand-navy sign carrying the park.fan wordmark on both faces.
  const banner = new THREE.Mesh(
    ctx.track.geo(new THREE.BoxGeometry(span + 1.2, 2.7, 0.6)),
    ctx.lit({ color: 0x213a5e, roughness: 1 }, 0.12)
  );
  banner.position.set(0, towerH - 0.1, 0);
  banner.castShadow = true;
  g.add(banner);
  const frame = new THREE.Mesh(ctx.track.geo(new THREE.BoxGeometry(span + 1.5, 3.0, 0.4)), trimMat);
  frame.position.set(0, towerH - 0.1, -0.14);
  g.add(frame);
  // park.fan wordmark, sized to sit clearly BETWEEN the towers (never clipped),
  // on the front (+z, faces the arriving camera) and the back.
  const wordW = 8.2;
  const wordGeo = ctx.track.geo(new THREE.PlaneGeometry(wordW, wordW / 4.1));
  const wordMat = ctx.track.mat(
    new THREE.MeshBasicMaterial({
      map: logoWord,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    })
  );
  const wordFront = new THREE.Mesh(wordGeo, wordMat);
  wordFront.position.set(0, towerH - 0.1, 0.32);
  g.add(wordFront);
  const wordBack = new THREE.Mesh(wordGeo, wordMat);
  wordBack.position.set(0, towerH - 0.1, -0.32);
  wordBack.rotation.y = Math.PI;
  g.add(wordBack);
  return g;
}

// ---------------------------------------------------------------------------
// Builders: bunting (colourful pennant strings)
// ---------------------------------------------------------------------------

function buildBunting(ctx: BuildCtx, a: THREE.Vector3, b: THREE.Vector3, sag = 1.2): THREE.Group {
  const g = new THREE.Group();
  const segs = 14;
  for (let i = 0; i < segs; i++) {
    const t = i / (segs - 1);
    const p = a.clone().lerp(b, t);
    p.y -= Math.sin(t * Math.PI) * sag;
    const color = RIDE_COLORS[i % RIDE_COLORS.length];
    const flag = new THREE.Mesh(
      ctx.track.geo(new THREE.ConeGeometry(0.18, 0.42, 4)),
      ctx.lit({ color, roughness: 1 }, 0.35)
    );
    flag.position.copy(p);
    flag.rotation.x = Math.PI;
    g.add(flag);
    // a little bulb between the pennants — glows brightly at night
    const bulb = new THREE.Mesh(
      ctx.track.geo(new THREE.SphereGeometry(0.08, 6, 6)),
      ctx.lit({ color, roughness: 0.4 }, 0.6)
    );
    bulb.position.copy(p);
    bulb.position.y -= 0.28;
    g.add(bulb);
  }
  return g;
}

/** Soft, slowly drifting toon clouds to fill the sky. */
function buildClouds(ctx: BuildCtx): Ride {
  const g = new THREE.Group();
  const mat = ctx.mat({ color: 0xffffff, flatShading: true, roughness: 1 });
  const puffs: { obj: THREE.Group; speed: number; base: number }[] = [];
  const count = ctx.mobile ? 6 : 11;
  for (let i = 0; i < count; i++) {
    const cloud = new THREE.Group();
    const blobs = 3 + Math.floor(Math.random() * 3);
    for (let j = 0; j < blobs; j++) {
      const blob = new THREE.Mesh(
        ctx.track.geo(new THREE.IcosahedronGeometry(rnd(2, 3.4), 1)),
        mat
      );
      blob.position.set(rnd(-3.5, 3.5), rnd(-0.4, 0.4), rnd(-2, 2));
      blob.scale.y = 0.5;
      cloud.add(blob);
    }
    cloud.position.set(rnd(-65, 65), rnd(30, 46), rnd(-65, 12));
    g.add(cloud);
    puffs.push({ obj: cloud, speed: rnd(0.25, 0.7), base: cloud.position.x });
  }
  return {
    group: g,
    update(elapsed) {
      for (const p of puffs) p.obj.position.x = ((p.base + elapsed * p.speed + 90) % 180) - 90;
    },
  };
}

/** A starfield for the night sky (hidden by day). */
function buildStars(ctx: BuildCtx): THREE.Points {
  const N = 700;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(Math.random() * 0.7 + 0.1);
    const r = 200;
    pos[i * 3] = Math.sin(ph) * Math.cos(th) * r;
    pos[i * 3 + 1] = Math.cos(ph) * r * 0.7 + 30;
    pos[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * r;
  }
  const geo = ctx.track.geo(new THREE.BufferGeometry());
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = ctx.track.mat(
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.4,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.9,
      fog: false,
    })
  );
  return new THREE.Points(geo, mat);
}

// ---------------------------------------------------------------------------
// Builders: rides
// ---------------------------------------------------------------------------

interface Ride extends Animated {
  group: THREE.Group;
}

/** A spinning carousel: striped conical roof, centre pole, horses on poles. */
function buildCarousel(ctx: BuildCtx): Ride {
  const g = new THREE.Group();
  const R = 4;
  // base + platform
  const base = new THREE.Mesh(
    ctx.track.geo(new THREE.CylinderGeometry(R + 0.5, R + 0.8, 0.5, 24)),
    ctx.mat({ color: PAL.stone, roughness: 1 })
  );
  base.position.y = 0.25;
  base.receiveShadow = true;
  g.add(base);
  const deck = new THREE.Mesh(
    ctx.track.geo(new THREE.CylinderGeometry(R, R, 0.3, 24)),
    ctx.lit({ color: PAL.red, roughness: 1 }, 0.2)
  );
  deck.position.y = 0.65;
  g.add(deck);
  // centre pole
  const pole = new THREE.Mesh(
    ctx.track.geo(new THREE.CylinderGeometry(0.4, 0.4, 5, 12)),
    ctx.lit({ color: PAL.yellow, roughness: 1 }, 0.2)
  );
  pole.position.y = 3.0;
  g.add(pole);
  // striped conical roof
  const roofTex = makeStripeTexture('#e30700', '#f7f7f7');
  roofTex.repeat.set(12, 1);
  ctx.track.tex(roofTex);
  const roof = new THREE.Mesh(
    ctx.track.geo(new THREE.ConeGeometry(R + 0.7, 2.2, 24)),
    ctx.mat({ map: roofTex, color: 0xffffff, roughness: 1 })
  );
  roof.position.y = 6.0;
  roof.castShadow = true;
  g.add(roof);
  const finial = new THREE.Mesh(
    ctx.track.geo(new THREE.SphereGeometry(0.3, 8, 8)),
    ctx.lit({ color: PAL.yellow, roughness: 0.6 }, 0.6)
  );
  finial.position.y = 7.2;
  g.add(finial);
  // spinning ring of horses
  const spin = new THREE.Group();
  spin.position.y = 0.8;
  g.add(spin);
  const horses: { obj: THREE.Group; phase: number }[] = [];
  const M = 8;
  for (let i = 0; i < M; i++) {
    const a = (i / M) * Math.PI * 2;
    const h = new THREE.Group();
    h.position.set(Math.cos(a) * (R - 0.8), 0, Math.sin(a) * (R - 0.8));
    // brass pole
    const hp = new THREE.Mesh(
      ctx.track.geo(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6)),
      ctx.lit({ color: PAL.yellow, roughness: 0.6 }, 0.4)
    );
    hp.position.y = 1.3;
    h.add(hp);
    // stylised horse: body + head
    const horseColor = pick([0xf7f7f7, 0x8f6327, 0x4f2b13, 0x172323]);
    const body = new THREE.Mesh(
      ctx.track.geo(new THREE.CapsuleGeometry(0.28, 0.7, 4, 8)),
      ctx.mat({ color: horseColor, roughness: 1 })
    );
    body.rotation.z = Math.PI / 2;
    body.position.y = 1.1;
    h.add(body);
    const head = new THREE.Mesh(
      ctx.track.geo(new THREE.BoxGeometry(0.22, 0.5, 0.22)),
      ctx.mat({ color: horseColor, roughness: 1 })
    );
    head.position.set(0.5, 1.45, 0);
    head.rotation.z = -0.5;
    h.add(head);
    spin.add(h);
    horses.push({ obj: h, phase: i });
  }
  return {
    group: g,
    update(elapsed) {
      spin.rotation.y = elapsed * 0.45;
      for (const { obj, phase } of horses)
        obj.position.y = 0.8 + Math.sin(elapsed * 2.4 + phase) * 0.18;
    },
  };
}

/** A ferris wheel: two rims, spokes, hanging gondolas (kept upright), A-frames. */
function buildFerrisWheel(ctx: BuildCtx): Ride {
  const g = new THREE.Group();
  const R = 8;
  const HUB = 9.5;
  // A-frame supports (front & back along z)
  const legMat = ctx.mat({ color: 0xd3dbdb, roughness: 1 });
  for (const sz of [-1.4, 1.4]) {
    for (const sx of [-1, 1]) {
      const leg = new THREE.Mesh(
        ctx.track.geo(new THREE.CylinderGeometry(0.25, 0.3, HUB + 1.2, 8)),
        legMat
      );
      leg.position.set(sx * 4.5, (HUB + 1.2) / 2, sz);
      leg.rotation.z = sx * 0.42;
      leg.castShadow = true;
      g.add(leg);
    }
  }
  const axle = new THREE.Mesh(
    ctx.track.geo(new THREE.CylinderGeometry(0.35, 0.35, 3.2, 10)),
    legMat
  );
  axle.rotation.x = Math.PI / 2;
  axle.position.y = HUB;
  g.add(axle);
  // spinning wheel (in the x-y plane, facing +z)
  const wheel = new THREE.Group();
  wheel.position.y = HUB;
  g.add(wheel);
  const ringMat = ctx.lit({ color: PAL.blue, roughness: 1 }, 0.18);
  const ringGeo = ctx.track.geo(new THREE.TorusGeometry(R, 0.18, 8, 44));
  for (const sz of [-1.2, 1.2]) {
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.z = sz;
    wheel.add(ring);
  }
  const M = 12;
  const spokeMat = ctx.mat({ color: 0xeff3f3, roughness: 1 });
  const spokeGeo = ctx.track.geo(new THREE.CylinderGeometry(0.05, 0.05, R, 5));
  const gondolas: THREE.Group[] = [];
  for (let i = 0; i < M; i++) {
    const a = (i / M) * Math.PI * 2;
    const x = Math.cos(a) * R;
    const y = Math.sin(a) * R;
    const spoke = new THREE.Mesh(spokeGeo, spokeMat);
    spoke.position.set(x / 2, y / 2, 0);
    spoke.rotation.z = a - Math.PI / 2;
    wheel.add(spoke);
    const piv = new THREE.Group();
    piv.position.set(x, y, 0);
    wheel.add(piv);
    const car = new THREE.Mesh(
      ctx.track.geo(new THREE.BoxGeometry(1.4, 1.2, 1.7)),
      ctx.lit({ color: RIDE_COLORS[i % RIDE_COLORS.length], roughness: 1 }, 0.2)
    );
    car.position.y = -0.9;
    car.castShadow = true;
    piv.add(car);
    gondolas.push(piv);
  }
  return {
    group: g,
    update(elapsed) {
      wheel.rotation.z = -elapsed * 0.16;
      for (const p of gondolas) p.rotation.z = elapsed * 0.16; // keep cabins level
    },
  };
}

/** A chair swing: central tower, spinning top, chairs flung out on chains. */
function buildSwingRide(ctx: BuildCtx): Ride {
  const g = new THREE.Group();
  const H = 8;
  const tower = new THREE.Mesh(
    ctx.track.geo(new THREE.CylinderGeometry(0.5, 0.7, H, 12)),
    ctx.lit({ color: PAL.purple, roughness: 1 }, 0.15)
  );
  tower.position.y = H / 2;
  tower.castShadow = true;
  g.add(tower);
  const roof = new THREE.Mesh(
    ctx.track.geo(new THREE.ConeGeometry(2.4, 1.8, 12)),
    ctx.lit({ color: PAL.yellow, roughness: 1 }, 0.25)
  );
  roof.position.y = H + 0.6;
  g.add(roof);
  const spin = new THREE.Group();
  spin.position.y = H - 0.4;
  g.add(spin);
  const disc = new THREE.Mesh(
    ctx.track.geo(new THREE.CylinderGeometry(1.8, 1.8, 0.3, 16)),
    ctx.lit({ color: PAL.red, roughness: 1 }, 0.2)
  );
  spin.add(disc);
  const M = 10;
  for (let i = 0; i < M; i++) {
    const a = (i / M) * Math.PI * 2;
    const arm = new THREE.Group();
    arm.rotation.y = a;
    spin.add(arm);
    const chain = new THREE.Mesh(
      ctx.track.geo(new THREE.CylinderGeometry(0.03, 0.03, 3.0, 4)),
      ctx.mat({ color: 0x3f5353, roughness: 1 })
    );
    chain.position.set(2.6, -1.4, 0);
    chain.rotation.z = 0.5;
    arm.add(chain);
    const seat = new THREE.Mesh(
      ctx.track.geo(new THREE.BoxGeometry(0.5, 0.4, 0.5)),
      ctx.lit({ color: RIDE_COLORS[i % RIDE_COLORS.length], roughness: 1 }, 0.2)
    );
    seat.position.set(3.7, -2.7, 0);
    arm.add(seat);
  }
  return {
    group: g,
    update(elapsed) {
      spin.rotation.y = elapsed * 0.7;
    },
  };
}

/** A drop tower: tall mast and a gondola that climbs slowly then drops. */
function buildDropTower(ctx: BuildCtx): Ride {
  const g = new THREE.Group();
  const H = 19;
  const mast = new THREE.Mesh(
    ctx.track.geo(new THREE.BoxGeometry(1.3, H, 1.3)),
    ctx.lit({ color: PAL.magenta, roughness: 1 }, 0.12)
  );
  mast.position.y = H / 2;
  mast.castShadow = true;
  g.add(mast);
  // corner rails to read as a tower
  for (const [sx, sz] of [
    [-0.7, -0.7],
    [0.7, -0.7],
    [-0.7, 0.7],
    [0.7, 0.7],
  ] as const) {
    const rail = new THREE.Mesh(
      ctx.track.geo(new THREE.CylinderGeometry(0.12, 0.12, H, 6)),
      ctx.mat({ color: 0xeff3f3, roughness: 1 })
    );
    rail.position.set(sx, H / 2, sz);
    g.add(rail);
  }
  const cap = new THREE.Mesh(
    ctx.track.geo(new THREE.ConeGeometry(1.4, 2, 4)),
    ctx.lit({ color: PAL.yellow, roughness: 1 }, 0.3)
  );
  cap.position.y = H + 1;
  cap.rotation.y = Math.PI / 4;
  g.add(cap);
  // gondola ring of seats
  const car = new THREE.Group();
  const carRing = new THREE.Mesh(
    ctx.track.geo(new THREE.CylinderGeometry(2.0, 2.0, 0.5, 14)),
    ctx.lit({ color: PAL.blue, roughness: 1 }, 0.2)
  );
  car.add(carRing);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const seat = new THREE.Mesh(
      ctx.track.geo(new THREE.BoxGeometry(0.5, 0.6, 0.5)),
      ctx.lit({ color: RIDE_COLORS[i % RIDE_COLORS.length], roughness: 1 }, 0.2)
    );
    seat.position.set(Math.cos(a) * 1.9, -0.2, Math.sin(a) * 1.9);
    car.add(seat);
  }
  g.add(car);
  return {
    group: g,
    update(elapsed) {
      const t = (elapsed * 0.07) % 1;
      let y: number;
      if (t < 0.72)
        y = THREE.MathUtils.lerp(2, H - 2, t / 0.72); // slow climb
      else if (t < 0.84)
        y = THREE.MathUtils.lerp(H - 2, 2, (t - 0.72) / 0.12); // fast drop
      else y = 2; // pause at bottom
      car.position.y = y;
    },
  };
}

/**
 * A coaster: a closed CatmullRom circuit (lift hill, drop, vertical loop,
 * airtime hills) with twin tubular rails, cross-ties, white support columns and
 * a train of cars running the track.
 */
function buildCoaster(ctx: BuildCtx, color: number): Ride {
  const g = new THREE.Group();
  const pts = [
    [-13, 2.0, 6],
    [-13, 2.0, -6],
    [-9, 7, -9],
    [-3, 12.5, -9], // lift top
    [3, 11.5, -8],
    [7, 6, -6],
    [10, 3, -2], // bottom into loop
    [13.5, 7, 0],
    [10.5, 12.5, 1], // loop top
    [6.5, 9.5, 1],
    [8, 4.5, 3], // exit loop
    [11, 4.5, 7],
    [6, 5.5, 10], // airtime hill
    [-3, 4.5, 11],
    [-9, 3.0, 9],
  ].map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
  const N = 240;
  const frames = curve.computeFrenetFrames(N, true);
  const left: THREE.Vector3[] = [];
  const right: THREE.Vector3[] = [];
  const samples: THREE.Vector3[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = curve.getPointAt(t);
    samples.push(p);
    const b = frames.binormals[Math.min(i, N - 1)].clone().multiplyScalar(0.34);
    left.push(p.clone().add(b));
    right.push(p.clone().sub(b));
  }
  const railMat = ctx.lit({ color, roughness: 0.7 }, 0.18);
  for (const arr of [left, right]) {
    const c = new THREE.CatmullRomCurve3(arr, true, 'catmullrom', 0.5);
    const tube = new THREE.Mesh(
      ctx.track.geo(new THREE.TubeGeometry(c, N, 0.11, 6, true)),
      railMat
    );
    tube.castShadow = true;
    g.add(tube);
  }
  // cross-ties
  const tieMat = ctx.mat({ color: 0x839797, roughness: 1 });
  const tieGeo = ctx.track.geo(new THREE.BoxGeometry(0.78, 0.07, 0.16));
  for (let i = 0; i <= N; i += 3) {
    const mid = left[i].clone().add(right[i]).multiplyScalar(0.5);
    const tie = new THREE.Mesh(tieGeo, tieMat);
    tie.position.copy(mid);
    tie.lookAt(right[i]);
    g.add(tie);
  }
  // white support columns
  const supMat = ctx.mat({ color: 0xeff3f3, roughness: 1 });
  for (let i = 0; i <= N; i += 7) {
    const p = samples[i];
    if (p.y > 1.4) {
      const col = new THREE.Mesh(
        ctx.track.geo(new THREE.CylinderGeometry(0.1, 0.12, p.y, 6)),
        supMat
      );
      col.position.set(p.x, p.y / 2, p.z);
      col.castShadow = true;
      g.add(col);
    }
  }
  // station platform
  const station = new THREE.Mesh(
    ctx.track.geo(new THREE.BoxGeometry(3, 1.6, 11)),
    ctx.mat({ color: PAL.woodLight, roughness: 1 })
  );
  station.position.set(-13, 0.8, 0);
  station.receiveShadow = true;
  g.add(station);
  // train of cars
  const cars: THREE.Mesh[] = [];
  const carGeo = ctx.track.geo(new THREE.BoxGeometry(0.7, 0.55, 1.15));
  for (let k = 0; k < 5; k++) {
    const car = new THREE.Mesh(
      carGeo,
      ctx.lit({ color: k === 0 ? PAL.yellow : color, roughness: 0.8 }, 0.22)
    );
    car.castShadow = true;
    g.add(car);
    cars.push(car);
  }
  const tmp = new THREE.Vector3();
  return {
    group: g,
    update(elapsed) {
      const speed = 0.045;
      for (let k = 0; k < cars.length; k++) {
        const t = (elapsed * speed + k * 0.011) % 1;
        const p = curve.getPointAt(t);
        const ahead = curve.getPointAt((t + 0.006) % 1);
        cars[k].position.set(p.x, p.y + 0.28, p.z);
        cars[k].lookAt(tmp.set(ahead.x, ahead.y + 0.28, ahead.z));
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Cinematic grade: a gentle saturation + contrast lift and a soft vignette that
// frames the centred hero panel. Runs as the final full-screen pass.
// ---------------------------------------------------------------------------

const CinematicShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uSat: { value: 1.14 },
    uContrast: { value: 1.06 },
    uVignette: { value: 0.7 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform float uSat;
    uniform float uContrast;
    uniform float uVignette;
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      // saturation
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, uSat);
      // contrast around mid-grey
      c = (c - 0.5) * uContrast + 0.5;
      // soft vignette (edges gently darkened, centre untouched)
      float d = length(vUv - 0.5);
      float vig = smoothstep(0.82, 0.42, d);
      c *= mix(1.0 - 0.26 * uVignette, 1.0, vig);
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }
  `,
};

// ===========================================================================
// Scene assembly
// ===========================================================================

export function createParkScene(canvas: HTMLCanvasElement, opts: CreateOptions): ParkSceneHandle {
  const track = new Tracker();

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  const initialW = canvas.clientWidth || 1280;
  const initialH = canvas.clientHeight || 600;
  // Mobile: lighter everywhere (fewer props, smaller shadows, capped DPR,
  // lighter post) and portrait-aware framing.
  const mobile =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(max-width: 820px)').matches
      : initialW < 820;
  const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(initialW, initialH, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = mobile ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const skyTex = track.tex(makeSkyTexture());
  scene.background = skyTex;
  // aerial-perspective haze: distant rides fade into the sky for cinematic depth
  scene.fog = new THREE.Fog(0xcfeaff, 64, 240);

  const camera = new THREE.PerspectiveCamera(46, initialW / initialH, 0.1, 400);
  camera.position.set(0, 6, 60);

  // -- Lights: bright sunny day, no IBL. A warm raking key sun + cool sky fill
  // gives cinematic warm/cool contrast and long soft shadows. ------------------
  const hemi = new THREE.HemisphereLight(0xdcefff, 0x7a9a5a, 0.85);
  scene.add(hemi);
  const ambient = new THREE.AmbientLight(0xfff3e0, 0.2);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffe7bd, 2.35);
  sun.position.set(-44, 40, 30); // lower angle → longer, more dramatic shadows
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 180;
  sun.shadow.camera.left = -74;
  sun.shadow.camera.right = 74;
  sun.shadow.camera.top = 74;
  sun.shadow.camera.bottom = -64;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  // soft cool fill from the opposite side so shadows aren't muddy
  const fill = new THREE.DirectionalLight(0xbcd4ff, 0.35);
  fill.position.set(40, 24, -20);
  scene.add(fill);

  // -- Textures: CC0 PBR webp maps (loaded async; the scene renders immediately,
  // onReady fires once everything — incl. the logo images — has loaded). -------
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const manager = new THREE.LoadingManager();
  let readyFired = false;
  const fireReady = () => {
    if (readyFired) return;
    readyFired = true;
    opts.onReady?.();
  };
  const texLoader = new THREE.TextureLoader(manager);
  const loadTex = (url: string, srgb: boolean, repeat: number) => {
    const t = texLoader.load(url);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    t.anisotropy = maxAniso;
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    return track.tex(t);
  };
  const loadPbr = (name: string, repeat: number): THREE.MeshStandardMaterialParameters => ({
    map: loadTex(`/textures/hero/${name}/color.webp`, true, repeat),
    normalMap: loadTex(`/textures/hero/${name}/normal.webp`, false, repeat),
    roughnessMap: loadTex(`/textures/hero/${name}/roughness.webp`, false, repeat),
  });
  // Grass & paths: use only the normal + roughness maps for surface relief and
  // keep bright flat RCT colours (their colour maps are too dark/desaturated and
  // killed the toy look). Wood & stone keep their colour map (nice grain).
  const pbr = {
    grass: {
      normalMap: loadTex('/textures/hero/grass/normal.webp', false, 26),
      roughnessMap: loadTex('/textures/hero/grass/roughness.webp', false, 26),
    },
    paving: {
      normalMap: loadTex('/textures/hero/paving/normal.webp', false, 1),
      roughnessMap: loadTex('/textures/hero/paving/roughness.webp', false, 1),
    },
    wood: loadPbr('wood', 1),
    stone: loadPbr('stone', 1),
  };
  // park.fan brand art: the wordmark (for the entrance banner) and the marker
  // pin (the floating landmark). Both load through the manager so onReady waits.
  const logoWord = track.tex(texLoader.load('/parkfan-dark.png'));
  logoWord.colorSpace = THREE.SRGBColorSpace;
  const logoPin = track.tex(texLoader.load('/logo.png'));
  logoPin.colorSpace = THREE.SRGBColorSpace;

  // -- Material factories (flat-shaded toy look + emissive accents) ----------
  const emissiveMats: THREE.MeshStandardMaterial[] = [];
  const nightLights: THREE.Light[] = [];
  const ctx: BuildCtx = {
    track,
    mat: (params) =>
      track.mat(
        new THREE.MeshStandardMaterial({
          flatShading: true,
          metalness: 0,
          roughness: 0.95,
          ...params,
        })
      ),
    lit: (params, glow = 0.6) => {
      const m = track.mat(
        new THREE.MeshStandardMaterial({
          flatShading: true,
          metalness: 0,
          roughness: 0.9,
          ...params,
        })
      );
      m.emissive = new THREE.Color((params.color as THREE.ColorRepresentation) ?? 0xffffff);
      m.userData.glow = glow;
      m.emissiveIntensity = glow;
      emissiveMats.push(m);
      return m;
    },
    stripeTex: (a, b) => makeStripeTexture(a, b),
    nightLight: (light, nightIntensity) => {
      light.intensity = 0;
      light.userData.nightIntensity = nightIntensity;
      nightLights.push(light);
    },
    mobile,
    pbr,
  };

  // -- World -----------------------------------------------------------------
  const world = new THREE.Group();
  scene.add(world);
  const animated: Animated[] = [];

  const waterTex = track.tex(makeWaterTexture());

  world.add(buildGround(ctx));
  world.add(buildPaths(ctx));

  const pond = buildPond(ctx, waterTex);
  pond.group.position.set(0, 0, -34);
  world.add(pond.group);
  animated.push(pond);

  // entrance arch at the front; camera flies through it
  const entrance = buildEntrance(ctx, logoWord);
  entrance.position.set(0, 0, 34);
  world.add(entrance);

  // forecourt in front of the arch so the approach reads as a welcome plaza
  const forecourt = pathStrip(ctx, 22, 16);
  forecourt.position.set(0, 0, 43);
  world.add(forecourt);
  for (const sx of [-1, 1]) {
    const bed = buildFlowerBed(ctx, 3.5, 3.5);
    bed.position.set(sx * 8.5, 0, 42);
    world.add(bed);
  }

  // stalls lining the main street (the RCT2 Buden)
  const stallKinds: StallKind[] = ['icecream', 'burger', 'hotdog', 'drink', 'donut', 'fries'];
  const awnings: [string, string][] = [
    ['#e30700', '#f7f7f7'],
    ['#2b67df', '#f7f7f7'],
    ['#ffe72f', '#e30700'],
    ['#47af27', '#f7f7f7'],
    ['#db3b8f', '#f7f7f7'],
    ['#ff6f17', '#f7f7f7'],
  ];
  let si = 0;
  for (let z = 26; z >= 12; z -= 7) {
    for (const sx of [-1, 1]) {
      const stall = buildStall(
        ctx,
        stallKinds[si % stallKinds.length],
        ...awnings[si % awnings.length]
      );
      stall.position.set(sx * 6.5, 0, z);
      stall.rotation.y = sx < 0 ? Math.PI / 2 : -Math.PI / 2;
      world.add(stall);
      si++;
    }
  }

  // trees scattered on the grass (kept off the paths)
  for (let i = 0; i < (mobile ? 34 : 70); i++) {
    const x = rnd(-HALF + 4, HALF - 4);
    const z = rnd(-HALF + 4, HALF - 4);
    // keep clear of the main street + central plaza
    if (Math.abs(x) < 6 && z > -18 && z < 32) continue;
    if (Math.abs(x) < 15 && Math.abs(z) < 10) continue;
    const tree = buildTree(ctx);
    tree.position.set(x, 0, z);
    world.add(tree);
  }

  // flower beds around the plaza
  for (const [x, z] of [
    [-10, 6],
    [10, 6],
    [-10, -14],
    [10, -14],
  ] as const) {
    const bed = buildFlowerBed(ctx, 4, 4);
    bed.position.set(x, 0, z);
    world.add(bed);
  }

  // benches, bins & lamps along the street
  for (let z = 24; z >= -2; z -= 6) {
    for (const sx of [-1, 1]) {
      const bench = buildBench(ctx);
      bench.position.set(sx * 4.2, 0, z);
      bench.rotation.y = sx < 0 ? Math.PI / 2 : -Math.PI / 2;
      world.add(bench);
    }
    const lamp = buildLamp(ctx);
    lamp.position.set(4.0, 0, z - 3);
    world.add(lamp);
    const lamp2 = buildLamp(ctx);
    lamp2.position.set(-4.0, 0, z - 3);
    world.add(lamp2);
    if (z % 12 === 0) {
      const bin = buildBin(ctx);
      bin.position.set(3.6, 0, z);
      world.add(bin);
    }
  }

  // fences along the entrance approach
  for (const sx of [-1, 1]) {
    const f = buildFence(ctx, 24);
    f.position.set(sx * 4.5, 0, 44);
    f.rotation.y = Math.PI / 2;
    world.add(f);
  }

  // bunting over the main street
  for (let z = 30; z >= 6; z -= 8) {
    world.add(buildBunting(ctx, new THREE.Vector3(-4.5, 4.2, z), new THREE.Vector3(4.5, 4.2, z)));
  }

  // peeps walking the street + plaza
  const routes: [THREE.Vector3, THREE.Vector3][] = [
    [new THREE.Vector3(-2, 0, 30), new THREE.Vector3(-2, 0, -2)],
    [new THREE.Vector3(2, 0, -2), new THREE.Vector3(2, 0, 30)],
    [new THREE.Vector3(-12, 0, -4), new THREE.Vector3(12, 0, -4)],
    [new THREE.Vector3(-1, 0, 0), new THREE.Vector3(-1, 0, -30)],
    [new THREE.Vector3(1, 0, -30), new THREE.Vector3(1, 0, 0)],
    [new THREE.Vector3(-22, 0, -8), new THREE.Vector3(-22, 0, -30)],
    [new THREE.Vector3(22, 0, -30), new THREE.Vector3(22, 0, -8)],
  ];
  const peeps = buildPeeps(ctx, routes);
  world.add(peeps.group);
  animated.push(peeps);

  // -- Rides: placed around the park so every camera angle frames one --------
  const addRide = (ride: Ride, x: number, z: number, ry = 0) => {
    ride.group.position.set(x, 0, z);
    ride.group.rotation.y = ry;
    world.add(ride.group);
    animated.push(ride);
  };
  // Tall rides sit INSIDE the orbit ring so the camera frames them in context
  // (never point-blank as a wall). Low items can go under the flight path.
  addRide(buildFountain(ctx), 0, -4); // plaza centrepiece (low — camera flies over)
  addRide(buildCarousel(ctx), -12, -7); // beside the plaza
  addRide(buildFerrisWheel(ctx), -21, -20, 0.25); // back-left landmark
  addRide(buildCoaster(ctx, PAL.red), 21, -19, -0.4); // back-right
  addRide(buildDropTower(ctx), 0, -33); // tall back-centre spire (rises over the panel)
  addRide(buildSwingRide(ctx), -15, 8); // mid-left
  addRide(buildSwingRide(ctx), 14, 9); // mid-right

  // -- Floating park.fan marker-pin landmark ---------------------------------
  // Billboards to the camera and gently bobs above the entrance; always bright
  // (and bloom-glows at night). Kept low enough to stay within the frame.
  const pinMat = track.mat(
    new THREE.MeshBasicMaterial({
      map: logoPin,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    })
  );
  const pin = new THREE.Mesh(track.geo(new THREE.PlaneGeometry(4.6, 5.6)), pinMat);
  pin.position.set(0, 13.5, 31);
  scene.add(pin);
  animated.push({
    update(elapsed) {
      pin.position.y = 13.5 + Math.sin(elapsed * 0.7) * 0.4;
      pin.quaternion.copy(camera.quaternion);
    },
  });

  // drifting clouds fill the sky
  const clouds = buildClouds(ctx);
  scene.add(clouds.group);
  animated.push(clouds);

  // night-sky decorations (toggled on at night by applyTheme)
  const stars = buildStars(ctx);
  scene.add(stars);
  const moon = new THREE.Mesh(
    track.geo(new THREE.SphereGeometry(6, 22, 22)),
    track.mat(new THREE.MeshBasicMaterial({ color: 0xfdf3d0, fog: false, toneMapped: false }))
  );
  moon.position.set(62, 64, -96);
  scene.add(moon);

  // -- Flying camera ---------------------------------------------------------
  // A closed loop: glide in low and dead-straight THROUGH the entrance arch
  // (x=0), rise over the plaza, then a stately orbit that always faces inward at
  // the busy park interior (never empty ground).
  const flightPath = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, 4.6, 46), // approach
      new THREE.Vector3(0, 4.2, 40), // dip toward the arch
      new THREE.Vector3(0, 4.0, 30), // THROUGH the arch
      new THREE.Vector3(0, 6.5, 14), // onto the main street
      new THREE.Vector3(0, 9, -2), // over the plaza
      new THREE.Vector3(-13, 12, -13), // bank toward the back-left
      new THREE.Vector3(-34, 12, -2), // orbit left
      new THREE.Vector3(-28, 11, 24), // front-left
      new THREE.Vector3(0, 13, 44), // wide front
      new THREE.Vector3(28, 11, 24), // front-right
      new THREE.Vector3(34, 12, -2), // orbit right
      new THREE.Vector3(16, 11, -16), // back-right
    ],
    true,
    'catmullrom',
    0.5
  );
  const LAP_SECONDS = 100; // slow, stately, cinematic
  const LOOK_AHEAD = 0.014;
  const FOCUS = new THREE.Vector3(0, 4, 0); // park heart (plaza)
  const ENTRY_LOOK = new THREE.Vector3(0, 7.5, 33); // entrance banner + floating pin
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const tmpAhead = new THREE.Vector3();
  const tmpBehind = new THREE.Vector3();
  const camTangent = new THREE.Vector3();
  const camSide = new THREE.Vector3();
  const camAccel = new THREE.Vector3();
  const camUp = new THREE.Vector3();
  const WORLD_UP = new THREE.Vector3(0, 1, 0);

  // -- Cinematic post-processing pipeline ------------------------------------
  // RenderPass → selective Bloom (only bright emissive accents glow — tuned
  // conservatively so the scene never washes out) → grade + vignette → output.
  const composer = new EffectComposer(renderer);
  composer.setSize(initialW, initialH);
  composer.setPixelRatio(dpr);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(initialW, initialH), 0.42, 0.5, 0.86);
  composer.addPass(bloom);
  const grade = new ShaderPass(CinematicShader);
  composer.addPass(grade);
  composer.addPass(new OutputPass());

  // -- Day / night ------------------------------------------------------------
  // Theme-driven: light = bright sunny day; dark = night with the lamps,
  // fairy-lights and spotlights switched on (bloom does the glowing).
  const nightSky = track.tex(makeNightSkyTexture());

  // colourful uplight spotlights that wash the entrance & key rides at night
  const addSpot = (
    color: number,
    pos: [number, number, number],
    target: [number, number, number],
    intensity: number
  ) => {
    const spot = new THREE.SpotLight(color, 0, 80, Math.PI / 6, 0.55, 1.1);
    spot.position.set(...pos);
    spot.target.position.set(...target);
    scene.add(spot);
    scene.add(spot.target);
    ctx.nightLight(spot, intensity);
  };
  addSpot(0xff5db0, [-6, 0.4, 40], [0, 7, 34], 90); // pink wash on the entrance
  addSpot(0x5db8ff, [6, 0.4, 40], [0, 7, 34], 90); // blue wash on the entrance
  addSpot(0xffe072, [0, 0.4, -25], [0, 16, -33], 120); // warm up the drop tower
  if (!mobile) addSpot(0x8be04e, [-21, 0.4, -11], [-21, 9, -20], 80); // green ferris wheel

  const applyTheme = (theme: SceneTheme) => {
    const night = theme === 'dark';
    scene.background = night ? nightSky : skyTex;
    const fog = scene.fog as THREE.Fog;
    fog.color.set(night ? 0x0c1730 : 0xcfeaff);
    fog.near = night ? 44 : 64;
    fog.far = night ? 210 : 240;
    hemi.color.set(night ? 0x32508f : 0xdcefff);
    hemi.groundColor.set(night ? 0x0e1626 : 0x7a9a5a);
    hemi.intensity = night ? 0.16 : 0.85;
    ambient.color.set(night ? 0x223a66 : 0xfff3e0);
    ambient.intensity = night ? 0.05 : 0.2;
    sun.color.set(night ? 0x9ab4ff : 0xffe7bd);
    sun.intensity = night ? 0.22 : 2.35;
    fill.intensity = night ? 0.1 : 0.35;
    stars.visible = night;
    moon.visible = night;
    for (const l of nightLights) l.intensity = night ? (l.userData.nightIntensity as number) : 0;
    for (const m of emissiveMats)
      m.emissiveIntensity = (m.userData.glow as number) * (night ? 1.7 : 1.0);
    bloom.strength = night ? 0.5 : 0.4;
    bloom.threshold = night ? 0.42 : 0.86;
    bloom.radius = night ? 0.6 : 0.5;
    grade.uniforms.uVignette.value = night ? 0.92 : 0.55;
    grade.uniforms.uSat.value = night ? 1.08 : 1.16;
    renderer.toneMappingExposure = night ? 1.0 : 1.06;
  };

  // -- Render loop -----------------------------------------------------------
  const clock = new THREE.Clock();
  let frameId = 0;
  let running = false;

  const renderFrame = (elapsed: number, delta: number) => {
    for (const a of animated) a.update(elapsed, delta);
    const t = (elapsed / LAP_SECONDS) % 1;
    flightPath.getPointAt(t, camPos);
    flightPath.getPointAt((t + LOOK_AHEAD) % 1, tmpAhead);
    flightPath.getPointAt((t - 0.012 + 1) % 1, tmpBehind);
    // Cinematic banking: roll the camera into turns based on path curvature.
    camTangent.copy(tmpAhead).sub(tmpBehind).normalize();
    camSide.crossVectors(camTangent, WORLD_UP).normalize();
    camAccel.copy(tmpAhead).add(tmpBehind).addScaledVector(camPos, -2);
    const roll = THREE.MathUtils.clamp(camAccel.dot(camSide) * 6.5, -0.3, 0.3);
    camUp.copy(WORLD_UP).applyAxisAngle(camTangent, roll);
    camera.up.copy(camUp);
    // Pitch the view DOWN at the park (RCT-style iso angle): force the look
    // target low so the ground & attractions fill the frame instead of empty
    // sky. Near the entrance keep it higher to look straight THROUGH the arch.
    // Default: pitch DOWN at the park (RCT iso angle); the look target is forced
    // low so the ground & attractions fill the frame instead of empty sky.
    const settle = THREE.MathUtils.smoothstep(t, 0.05, 0.17);
    tmpAhead.y = THREE.MathUtils.lerp(3.8, 2.3, settle);
    // During the orbit, bias toward the park heart so busy attractions stay framed.
    const orbit = THREE.MathUtils.smoothstep(t, 0.3, 0.45);
    camLook.copy(tmpAhead).lerp(FOCUS, orbit * 0.55);
    // Opening hero moment: hold the gaze on the entrance arch, banner & floating
    // park.fan pin as we glide in, then hand off to the through-arch view.
    const entryW = 1 - THREE.MathUtils.smoothstep(t, 0.0, 0.045);
    camLook.lerp(ENTRY_LOOK, entryW);
    camera.position.copy(camPos);
    camera.lookAt(camLook);
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

  // Reveal once textures + logos have loaded; re-render the static frame for
  // reduced motion so it shows the fully textured scene. (The mounting
  // component also has a safety timeout in case no load event fires.)
  manager.onLoad = () => {
    fireReady();
    if (opts.reducedMotion) renderFrame(clock.elapsedTime, 0);
  };

  applyTheme(opts.theme);
  if (opts.reducedMotion) {
    renderFrame(0, 0);
  } else {
    start();
  }

  return {
    resize(width, height) {
      const aspect = width / height;
      camera.aspect = aspect;
      // Portrait (mobile) framing: widen the vertical FOV so the park still
      // fills a tall, narrow viewport instead of cropping to bare ground/sky.
      camera.fov =
        aspect < 1
          ? THREE.MathUtils.lerp(46, 70, THREE.MathUtils.clamp((1 - aspect) / 0.55, 0, 1))
          : 46;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      bloom.setSize(width, height);
      if (opts.reducedMotion) renderFrame(clock.elapsedTime, 0);
    },
    setTheme(theme) {
      applyTheme(theme);
      if (opts.reducedMotion) renderFrame(clock.elapsedTime, 0);
    },
    dispose() {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      scene.traverse((o) => {
        if (o instanceof THREE.InstancedMesh) o.dispose();
      });
      track.dispose();
      composer.dispose();
      renderer.dispose();
    },
  };
}
