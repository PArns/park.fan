/**
 * Foliage generators: broadleaf, conifer, palm, shrub, hedge, flowers, grass.
 *
 * The art bible's line is "trees must not be cones on sticks", and the three things that decide
 * whether that holds are the trunk, the branch structure and the canopy, in that order:
 *
 * **The trunk is a swept tube, not a cylinder.** It bends, it tapers non-linearly, and it flares
 * into a root plate at the bottom. A straight cylinder reads as a post at any distance, and the
 * flare is what makes a tree look like it grew out of the ground rather than being pushed into it.
 *
 * **The branches carry the canopy.** Leaf clusters hang off branch tips, so the canopy has an
 * internal structure — you can see through it at the right angle, and the silhouette is lumpy
 * because the branches are. A canopy placed on an ellipsoid with no branches under it is a
 * lollipop, which is the other half of "a cone on a stick".
 *
 * **The leaf cards are cut by an alpha mask, and their normals lie.** The mask is generated in
 * `textures.ts` as ~34 leaflets rather than as thresholded noise; the normals are bent towards the
 * canopy's outward direction so a flat quad shades like a curved mass of leaves.
 *
 * Every generator reads `spec.height` and builds to it, so a manifest entry with `height: 11`
 * gives a linden and one with `height: 16` gives a spruce out of the same code.
 */

import type { NightLightDef } from '../core/pack-schema';
import type { PropSpec } from './catalog';
import {
  addBlob,
  addCard,
  addTube,
  mixRgb,
  newSurface,
  srgb,
  tintRgb,
  type Rgb,
  type Surface,
  type TubeRing,
} from './geometry';

export type PartMaterial =
  | 'bark'
  | 'leaf'
  | 'needle'
  | 'foliageSolid'
  | 'paint'
  | 'metal'
  | 'wood'
  | 'stone'
  | 'fabric'
  | 'pond'
  | 'emissive';

export interface PropPart {
  surface: Surface;
  material: PartMaterial;
  /** Only for `emissive`: which colour instance of the material this part wants. */
  emissiveColor?: string;
}

export interface PropBuild {
  parts: PropPart[];
  /** Radius of the ground contact decal in metres; 0 draws none. */
  contactRadius: number;
  /** Where a night light hangs, in local metres. */
  lightOffset: [number, number, number];
}

export interface BuildContext {
  spec: PropSpec;
  /** 0 near, 1 mid, 2 far. */
  lod: 0 | 1 | 2;
  /** Variant seed; two variants of a species differ only by this. */
  seed: number;
  night: NightLightDef | null;
}

export type Generator = (ctx: BuildContext) => PropBuild;

/** A small deterministic stream for one build. Never `Math.random` (see the game lint rule). */
export function makeRand(seed: number): () => number {
  let s = (seed || 1) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function part(material: PartMaterial, emissiveColor?: string): PropPart {
  return { surface: newSurface(), material, emissiveColor };
}

/**
 * Metres across one leaf-cluster card.
 *
 * This is the single most load-bearing number in the module's foliage. `addCard` maps the whole
 * cluster texture onto the quad, so the card's size in metres is the size of the leaves drawn on
 * it — a card scaled to a branch's length draws leaves the length of the branch, which is what the
 * first version did and what turned a spruce into a stand of 4.5 m banana leaves. A real cluster
 * of foliage is about a metre across, so branches get a chain of these rather than one big quad.
 */
const CLUSTER_M = 1.05;

// ── Palettes ───────────────────────────────────────────────────────────────────────────────

const BARK_BROWN = srgb(0x8f7a60);
const BARK_GREY = srgb(0x9a978c);
const BARK_PALM = srgb(0xa08a6a);
const LEAF_SUMMER = srgb(0x6f9c3f);
const LEAF_DEEP = srgb(0x4c7a2e);
const LEAF_LIGHT = srgb(0x93b95a);
const NEEDLE_GREEN = srgb(0x3d6b45);
const SHRUB_GREEN = srgb(0x577f38);
const GRASS_GREEN = srgb(0x74933f);
const FLOWER_COLOURS = [
  srgb(0xe8dfd2),
  srgb(0xe0b64a),
  srgb(0xc4536a),
  srgb(0x8c7cc0),
  srgb(0xdc7f3d),
];

// ── Trunks and branches ────────────────────────────────────────────────────────────────────

interface Branch {
  tip: [number, number, number];
  dir: [number, number, number];
  radius: number;
  sway: number;
}

/**
 * A trunk swept from base to crown, with a root flare and a lean.
 *
 * Returns the point the crown starts at, so the canopy is placed on the trunk it actually has
 * rather than on the trunk the parameters describe.
 */
function buildTrunk(
  surface: Surface,
  height: number,
  baseRadius: number,
  rand: () => number,
  colour: Rgb,
  opts: { segments: number; sides: number; lean: number; crownAt: number }
): { top: [number, number, number]; rings: TubeRing[] } {
  const rings: TubeRing[] = [];
  const leanX = (rand() * 2 - 1) * opts.lean;
  const leanZ = (rand() * 2 - 1) * opts.lean;
  const wobbleX = (rand() * 2 - 1) * 0.4;
  const wobbleZ = (rand() * 2 - 1) * 0.4;
  const top = height * opts.crownAt;
  for (let i = 0; i <= opts.segments; i++) {
    const t = i / opts.segments;
    const y = top * t;
    // The flare: the bottom twelfth widens, the rest tapers on a gentle power curve. It was 0.85
    // over the bottom seventh, which put a 1.9 m butt on a 14 m oak — a stump, not a trunk.
    const flare = 1 + Math.pow(Math.max(0, 1 - t * 11), 2) * 0.45;
    const taper = Math.pow(1 - t * 0.82, 0.75);
    rings.push({
      x: leanX * t * t * height + Math.sin(t * 3.1 + wobbleX * 4) * wobbleX * height * 0.02,
      y,
      z: leanZ * t * t * height + Math.cos(t * 2.7 + wobbleZ * 4) * wobbleZ * height * 0.02,
      radius: baseRadius * flare * taper,
      // Nothing moves at the root; the crown of the trunk moves a little.
      sway: Math.pow(t, 2.4) * 0.3,
      colour: tintRgb(colour, 0.86 + t * 0.24),
    });
  }
  addTube(surface, rings, opts.sides, { uvScale: 1.1, capEnd: false });
  const last = rings[rings.length - 1];
  return { top: [last.x, last.y, last.z], rings };
}

/** Primary and secondary branches off the trunk's upper half. */
function buildBranches(
  surface: Surface,
  trunk: TubeRing[],
  count: number,
  rand: () => number,
  colour: Rgb,
  opts: { spread: number; length: number; sides: number; secondary: boolean }
): Branch[] {
  const tips: Branch[] = [];
  const start = Math.floor(trunk.length * 0.45);
  for (let i = 0; i < count; i++) {
    const at = start + Math.floor(((trunk.length - 1 - start) * i) / Math.max(1, count - 1));
    const base = trunk[Math.min(at, trunk.length - 1)];
    const angle = (i / count) * Math.PI * 2 + rand() * 0.9;
    const rise = 0.55 + rand() * 0.55;
    const len = opts.length * (0.7 + rand() * 0.6);
    const dir: [number, number, number] = [
      Math.cos(angle) * opts.spread,
      rise,
      Math.sin(angle) * opts.spread,
    ];
    const dl = Math.hypot(dir[0], dir[1], dir[2]) || 1;
    dir[0] /= dl;
    dir[1] /= dl;
    dir[2] /= dl;
    const rings: TubeRing[] = [];
    const steps = 4;
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      // Branches arch: they leave the trunk rising and flatten out towards the tip.
      const droop = t * t * 0.34 * len;
      rings.push({
        x: base.x + dir[0] * len * t,
        y: base.y + dir[1] * len * t - droop,
        z: base.z + dir[2] * len * t,
        radius: base.radius * 0.42 * (1 - t * 0.8),
        sway: 0.3 + t * 0.35,
        colour: tintRgb(colour, 0.95 + t * 0.15),
      });
    }
    addTube(surface, rings, opts.sides, { uvScale: 0.7 });
    const end = rings[rings.length - 1];
    tips.push({ tip: [end.x, end.y, end.z], dir, radius: end.radius, sway: 0.65 });
    if (opts.secondary) {
      const forks = 2;
      for (let f = 0; f < forks; f++) {
        const side = (f - 0.5) * 2;
        const sub: TubeRing[] = [];
        const subLen = len * (0.4 + rand() * 0.25);
        const subDir: [number, number, number] = [
          dir[0] + side * Math.cos(angle + 1.6) * 0.7,
          dir[1] * 0.6 + 0.3,
          dir[2] + side * Math.sin(angle + 1.6) * 0.7,
        ];
        const sl = Math.hypot(subDir[0], subDir[1], subDir[2]) || 1;
        for (let k = 0; k <= 3; k++) {
          const t = k / 3;
          sub.push({
            x: end.x + (subDir[0] / sl) * subLen * t,
            y: end.y + (subDir[1] / sl) * subLen * t - t * t * 0.2 * subLen,
            z: end.z + (subDir[2] / sl) * subLen * t,
            radius: end.radius * (1 - t * 0.7),
            sway: 0.62 + t * 0.28,
            colour: tintRgb(colour, 1.02),
          });
        }
        addTube(surface, sub, Math.max(3, opts.sides - 2), { uvScale: 0.6 });
        const subEnd = sub[sub.length - 1];
        tips.push({
          tip: [subEnd.x, subEnd.y, subEnd.z],
          dir: [subDir[0] / sl, subDir[1] / sl, subDir[2] / sl],
          radius: subEnd.radius,
          sway: 0.9,
        });
      }
    }
  }
  return tips;
}

/** One leaf cluster card, facing away from `centre`. */
function leafCard(
  surface: Surface,
  at: [number, number, number],
  outward: Rgb,
  size: number,
  roll: number,
  colour: Rgb,
  sway: number
): void {
  const up: Rgb = [0, 1, 0];
  let right: Rgb = [
    outward[1] * up[2] - outward[2] * up[1],
    outward[2] * up[0] - outward[0] * up[2],
    outward[0] * up[1] - outward[1] * up[0],
  ];
  let rl = Math.hypot(right[0], right[1], right[2]);
  if (rl < 1e-3) {
    right = [1, 0, 0];
    rl = 1;
  }
  right = [right[0] / rl, right[1] / rl, right[2] / rl];
  const cardUp: Rgb = [
    right[1] * outward[2] - right[2] * outward[1],
    right[2] * outward[0] - right[0] * outward[2],
    right[0] * outward[1] - right[1] * outward[0],
  ];
  const cr = Math.cos(roll);
  const sr = Math.sin(roll);
  const r2: Rgb = [
    right[0] * cr + cardUp[0] * sr,
    right[1] * cr + cardUp[1] * sr,
    right[2] * cr + cardUp[2] * sr,
  ];
  const u2: Rgb = [
    -right[0] * sr + cardUp[0] * cr,
    -right[1] * sr + cardUp[1] * cr,
    -right[2] * sr + cardUp[2] * cr,
  ];
  addCard(surface, at, r2, u2, size, size * 0.62, {
    colour,
    sway,
    cup: size * 0.22,
    outward,
  });
}

/**
 * Silhouette profiles for the far imposters, bottom edge to top.
 *
 * Five rows each, so a card is four quads instead of one — eight triangles against two. Measured
 * on the demo park at the `overview` camera, where 1,289 of 1,290 trees are imposters, that is the
 * cheap half of the two options a critic costed: pushing the LOD break out far enough to draw real
 * trees there adds 263,000 triangles and doubles the frame.
 *
 * The broadleaf closes at the bottom as well as the top, because a crown that ends in a straight
 * horizontal edge reads as a hedge on a pole from any angle below it.
 */
const BROADLEAF_CROWN: readonly number[] = [0.22, 0.78, 1, 0.88, 0.34];
const CONIFER_SPIRE: readonly number[] = [1, 0.74, 0.48, 0.24, 0.04];

// ── Broadleaf ──────────────────────────────────────────────────────────────────────────────

export const treeBroadleaf: Generator = (ctx) => {
  const rand = makeRand(ctx.seed);
  const h = ctx.spec.height;
  const bark = part('bark');
  const canopy = part('leaf');
  const barkColour = mixRgb(BARK_BROWN, BARK_GREY, rand() * 0.6);
  const leafTone = mixRgb(LEAF_DEEP, LEAF_LIGHT, 0.25 + rand() * 0.5);

  if (ctx.lod === 2) {
    // Far imposter: a short trunk and three crossed cards with an EGG PROFILE.
    //
    // It was three flat rectangles and a fourth laid across the top, and a critic counting
    // instances found that 1,289 of the demo park's 1,290 trees are drawn this way at the overview
    // camera — so this handful of vertices is what the whole mid-ground of the game looks like. A
    // rectangle of leaves floating above a bare stick is a palm, which is exactly what the frame
    // read as. The profile below is wide at the shoulder and closed at both ends, and the crown
    // now starts at 0.42 h instead of hanging at 0.68 h, so the trunk goes INTO the canopy rather
    // than holding it up at arm's length.
    const rings: TubeRing[] = [
      { x: 0, y: 0, z: 0, radius: h * 0.022, sway: 0, colour: barkColour },
      { x: 0, y: h * 0.46, z: 0, radius: h * 0.014, sway: 0.15, colour: barkColour },
    ];
    addTube(bark.surface, rings, 4, { uvScale: 1 });
    const cy = h * 0.66;
    const r = h * 0.34;
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      const dir: Rgb = [Math.cos(a), 0, Math.sin(a)];
      addCard(canopy.surface, [0, cy, 0], [-dir[2], 0, dir[0]], [0, 1, 0], r, h * 0.28, {
        colour: leafTone,
        sway: 0.6,
        outward: dir,
        profile: BROADLEAF_CROWN,
      });
    }
    return { parts: [bark, canopy], contactRadius: h * 0.3, lightOffset: [0, h * 0.6, 0] };
  }

  const near = ctx.lod === 0;
  const trunk = buildTrunk(bark.surface, h, h * 0.021, rand, barkColour, {
    segments: near ? 9 : 5,
    sides: near ? 9 : 5,
    lean: 0.06,
    crownAt: 0.52,
  });
  const branches = buildBranches(bark.surface, trunk.rings, near ? 6 : 4, rand, barkColour, {
    spread: 0.9,
    length: h * 0.3,
    sides: near ? 5 : 4,
    secondary: near,
  });

  // The canopy: one cluster per branch tip, plus a shell of clusters filling the crown. The two
  // together are what give it an inside — tips alone leave a hollow, a shell alone is a lollipop.
  const crownCentre: [number, number, number] = [
    trunk.top[0],
    trunk.top[1] + h * 0.24,
    trunk.top[2],
  ];
  const crownRadius = h * 0.32;
  // A leaf card wears the whole cluster texture, so its size IS the size of the leaves on it —
  // `addCard` maps uv 0..1 across the quad. Around a metre is a real cluster; the first version
  // scaled it off the tree's height and drew 1.6 m leaves on a 14 m oak.
  const cardSize = CLUSTER_M * (near ? 1 : 1.5);
  for (const branch of branches) {
    const size = cardSize * (0.85 + rand() * 0.5);
    for (let k = 0; k < (near ? 3 : 2); k++) {
      const jitter = 0.35 * size;
      leafCard(
        canopy.surface,
        [
          branch.tip[0] + (rand() * 2 - 1) * jitter,
          branch.tip[1] + (rand() * 2 - 1) * jitter * 0.6 + size * 0.2,
          branch.tip[2] + (rand() * 2 - 1) * jitter,
        ],
        normalise([
          branch.dir[0] + (rand() * 2 - 1) * 0.5,
          branch.dir[1] * 0.5 + 0.25 + rand() * 0.4,
          branch.dir[2] + (rand() * 2 - 1) * 0.5,
        ]),
        size,
        rand() * Math.PI,
        tintRgb(leafTone, 0.86 + rand() * 0.32),
        branch.sway
      );
    }
  }
  const shellCount = near ? 54 : 18;
  for (let i = 0; i < shellCount; i++) {
    // Fibonacci-ish distribution over the upper hemisphere; a random one clumps visibly at this
    // count and leaves a bald patch on the sunny side about a third of the time.
    const t = (i + 0.5) / shellCount;
    const phi = Math.acos(1 - 1.55 * t);
    const theta = i * 2.39996 + rand() * 0.4;
    const dir: Rgb = [
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi) * 0.85 + 0.15,
      Math.sin(phi) * Math.sin(theta),
    ];
    const r = crownRadius * (0.72 + rand() * 0.34);
    leafCard(
      canopy.surface,
      [
        crownCentre[0] + dir[0] * r,
        crownCentre[1] + dir[1] * r * 0.78,
        crownCentre[2] + dir[2] * r,
      ],
      normalise([dir[0], dir[1] * 0.8 + 0.2, dir[2]]),
      cardSize * (1 + rand() * 0.45),
      rand() * Math.PI,
      tintRgb(leafTone, 0.8 + rand() * 0.4),
      0.72 + rand() * 0.28
    );
  }
  return {
    parts: [bark, canopy],
    contactRadius: crownRadius * 0.8,
    lightOffset: [0, h * 0.6, 0],
  };
};

function normalise(v: [number, number, number]): Rgb {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

// ── Conifer ────────────────────────────────────────────────────────────────────────────────

export const treeConifer: Generator = (ctx) => {
  const rand = makeRand(ctx.seed);
  const h = ctx.spec.height;
  const bark = part('bark');
  const canopy = part('needle');
  const barkColour = tintRgb(mixRgb(BARK_BROWN, srgb(0x7a6448), 0.5), 0.9 + rand() * 0.2);
  const needleTone = tintRgb(NEEDLE_GREEN, 0.82 + rand() * 0.36);

  if (ctx.lod === 2) {
    const rings: TubeRing[] = [
      { x: 0, y: 0, z: 0, radius: h * 0.028, sway: 0, colour: barkColour },
      { x: 0, y: h * 0.35, z: 0, radius: h * 0.014, sway: 0.1, colour: barkColour },
    ];
    addTube(bark.surface, rings, 4, {});
    for (let i = 0; i < 2; i++) {
      const a = (i / 2) * Math.PI;
      const dir: Rgb = [Math.cos(a), 0, Math.sin(a)];
      // A single tall card per axis: the spire is the silhouette that has to survive — and until
      // the profile below existed it did not, because the card was a rectangle. 435 spruces in one
      // frame and not one conical outline among them.
      addCard(
        canopy.surface,
        [0, h * 0.52, 0],
        [-dir[2], 0, dir[0]],
        [0, 1, 0],
        h * 0.22,
        h * 0.46,
        { colour: needleTone, sway: 0.4, outward: dir, profile: CONIFER_SPIRE }
      );
    }
    return { parts: [bark, canopy], contactRadius: h * 0.2, lightOffset: [0, h * 0.5, 0] };
  }

  const near = ctx.lod === 0;
  const trunk = buildTrunk(bark.surface, h, h * 0.017, rand, barkColour, {
    segments: near ? 8 : 4,
    sides: near ? 7 : 5,
    lean: 0.02,
    crownAt: 0.98,
  });
  void trunk;
  // Whorls: each tier is a ring of downward-angled sprays, narrowing with height. The lowest tier
  // starts a fifth of the way up — a spruce whose skirt touches the ground is a Christmas tree.
  const tiers = near ? 10 : 6;
  const bottom = h * 0.16;
  const spreadMax = h * 0.28;
  for (let tier = 0; tier < tiers; tier++) {
    const t = tier / (tiers - 1);
    const y = bottom + (h * 0.96 - bottom) * t;
    const radius = spreadMax * Math.pow(1 - t, 1.25) + h * 0.012;
    const sprays = near ? Math.max(4, Math.round(9 * (1 - t * 0.5))) : 5;
    for (let i = 0; i < sprays; i++) {
      const a = (i / sprays) * Math.PI * 2 + tier * 0.7 + rand() * 0.25;
      const dir: Rgb = normalise([Math.cos(a), -0.42 - rand() * 0.2, Math.sin(a)]);
      // A branch is a CHAIN of cluster-sized cards out along its length, not one card scaled to
      // the branch — the card's uv is 0..1, so scaling it scales the needles drawn on it.
      const steps = Math.max(1, Math.round(radius / CLUSTER_M));
      for (let k = 0; k < steps; k++) {
        const reach = radius * ((k + 0.55) / steps);
        leafCard(
          canopy.surface,
          [dir[0] * reach, y + dir[1] * reach * 0.35 + CLUSTER_M * 0.15, dir[2] * reach],
          dir,
          CLUSTER_M * (0.75 + rand() * 0.35),
          rand() * 0.5 - 0.25,
          tintRgb(needleTone, 0.84 + t * 0.3 + rand() * 0.14),
          0.18 + t * 0.6
        );
      }
    }
  }
  return {
    parts: [bark, canopy],
    contactRadius: spreadMax * 0.85,
    lightOffset: [0, h * 0.5, 0],
  };
};

// ── Palm ───────────────────────────────────────────────────────────────────────────────────

export const treePalm: Generator = (ctx) => {
  const rand = makeRand(ctx.seed);
  const h = ctx.spec.height;
  const bark = part('bark');
  const canopy = part('leaf');
  const trunkColour = tintRgb(BARK_PALM, 0.9 + rand() * 0.2);
  const frondTone = mixRgb(LEAF_DEEP, LEAF_SUMMER, 0.4 + rand() * 0.4);

  const near = ctx.lod === 0;
  const bend = (rand() * 2 - 1) * 0.18;
  const segments = ctx.lod === 2 ? 3 : near ? 10 : 6;
  const rings: TubeRing[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    rings.push({
      // A palm leans on a curve, not a line: it is the shape a coastal palm actually takes.
      x: bend * h * t * t,
      y: h * 0.86 * t,
      z: bend * 0.4 * h * t * t,
      radius: h * 0.032 * (1 - t * 0.32) * (1 + Math.pow(Math.max(0, 1 - t * 8), 2) * 0.5),
      sway: Math.pow(t, 2) * 0.4,
      colour: tintRgb(trunkColour, 0.88 + t * 0.2),
    });
  }
  // The ring scars: a palm trunk is stacked leaf bases, and a smooth cylinder is the tell.
  addTube(bark.surface, rings, ctx.lod === 2 ? 5 : near ? 9 : 6, { uvScale: 0.34 });
  const crown = rings[rings.length - 1];
  const fronds = ctx.lod === 2 ? 5 : near ? 11 : 7;
  for (let i = 0; i < fronds; i++) {
    const a = (i / fronds) * Math.PI * 2 + rand() * 0.3;
    const droop = 0.35 + rand() * 0.45;
    const length = h * (0.3 + rand() * 0.12);
    const steps = near ? 4 : 2;
    for (let k = 0; k < steps; k++) {
      const t0 = k / steps;
      const t = t0 + 0.5 / steps;
      const reach = length * t;
      const fall = droop * reach * t * 1.3;
      const size = CLUSTER_M * (1.1 - t * 0.35);
      leafCard(
        canopy.surface,
        [
          crown.x + Math.cos(a) * reach,
          crown.y + reach * 0.32 - fall,
          crown.z + Math.sin(a) * reach,
        ],
        normalise([Math.cos(a) * 0.5, 0.7 - t * 0.5, Math.sin(a) * 0.5]),
        size,
        a,
        tintRgb(frondTone, 0.85 + rand() * 0.3),
        0.4 + t * 0.6
      );
    }
  }
  if (near) {
    // Coconuts.
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      addBlob(
        bark.surface,
        crown.x + Math.cos(a) * h * 0.035,
        crown.y - h * 0.02,
        crown.z + Math.sin(a) * h * 0.035,
        h * 0.022,
        4,
        { colour: srgb(0x6d5836), seed: ctx.seed + i, lumps: 0.12, sway: 0.35 }
      );
    }
  }
  return {
    parts: [bark, canopy],
    contactRadius: h * 0.2,
    lightOffset: [0, h * 0.8, 0],
  };
};

// ── Shrub, hedge, flowers, grass ───────────────────────────────────────────────────────────

export const shrub: Generator = (ctx) => {
  const rand = makeRand(ctx.seed);
  const h = ctx.spec.height;
  const core = part('foliageSolid');
  const leaves = part('leaf');
  const tone = tintRgb(SHRUB_GREEN, 0.85 + rand() * 0.35);
  const lobes = ctx.lod === 0 ? 3 : 2;
  // A solid core with cards over it: the core stops daylight coming through the middle of a bush,
  // the cards give it an edge that is not a sphere.
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * Math.PI * 2 + rand();
    const off = h * 0.22 * (i === 0 ? 0 : 1);
    addBlob(
      core.surface,
      Math.cos(a) * off,
      h * (0.38 + rand() * 0.14),
      Math.sin(a) * off,
      h * (0.36 + rand() * 0.12),
      ctx.lod === 0 ? 5 : 3,
      {
        colour: tintRgb(tone, 0.7 + rand() * 0.2),
        seed: ctx.seed + i * 31,
        lumps: 0.3,
        squashY: 0.82,
        floorY: -h * 0.3,
        sway: 0.35,
      }
    );
  }
  if (ctx.lod !== 2) {
    const cards = ctx.lod === 0 ? 16 : 8;
    for (let i = 0; i < cards; i++) {
      const t = (i + 0.5) / cards;
      const phi = Math.acos(1 - 1.4 * t);
      const theta = i * 2.39996 + rand() * 0.5;
      const dir: Rgb = [
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi) * 0.8 + 0.2,
        Math.sin(phi) * Math.sin(theta),
      ];
      const r = h * 0.44;
      leafCard(
        leaves.surface,
        [dir[0] * r, h * 0.44 + dir[1] * r * 0.8, dir[2] * r],
        normalise([dir[0], dir[1] * 0.8 + 0.25, dir[2]]),
        Math.min(CLUSTER_M * 0.55, h * 0.34),
        rand() * Math.PI,
        tintRgb(tone, 0.9 + rand() * 0.3),
        0.55 + rand() * 0.35
      );
    }
  }
  return { parts: [core, leaves], contactRadius: h * 0.45, lightOffset: [0, h, 0] };
};

export const hedge: Generator = (ctx) => {
  const rand = makeRand(ctx.seed);
  const [w, d] = ctx.spec.footprint;
  const h = ctx.spec.height;
  const body = part('foliageSolid');
  const leaves = part('leaf');
  const tone = tintRgb(srgb(0x3f6b2c), 0.9 + rand() * 0.2);
  // A clipped hedge is a box with a soft top and slightly bowed sides — a hard box is the tell.
  //
  // At LOD 2 it is ONE blob across the whole footprint, and the reason is a measurement rather
  // than a feeling: a critic weighing the demo park's triangles found `hedge-box` taking 29,184 of
  // the 79,490 this module draws at the `overview` camera — **36.7 %, more than every tree in the
  // frame** — for seventy-six one-metre hedges seen from 340 m, where a hedge is about two pixels
  // tall. Four bowed blobs at subdivision 3 apiece is a beautiful hedge nobody can see. The near
  // and mid forms are untouched.
  const far = ctx.lod === 2;
  const cols = far ? 1 : Math.max(2, Math.round(w / 0.5));
  const rows = far ? 1 : 2;
  const step = w / cols;
  for (let i = 0; i < cols; i++) {
    for (let r = 0; r < rows; r++) {
      const x = -w / 2 + step * (i + 0.5);
      const z = (r - 0.5) * d * 0.34;
      const radius = far ? Math.max(w, d) * 0.5 : Math.max(step, d) * 0.44;
      addBlob(body.surface, x, h * 0.52, z, radius, ctx.lod === 0 ? 4 : far ? 1 : 3, {
        colour: tintRgb(tone, 0.72 + rand() * 0.16),
        seed: ctx.seed + i * 17 + r * 5,
        lumps: 0.14,
        squashY: (h * 0.55) / radius,
        floorY: -h * 0.5,
        sway: 0.16,
      });
    }
  }
  if (ctx.lod === 0) {
    const cards = Math.round(w * 5);
    for (let i = 0; i < cards; i++) {
      const x = -w / 2 + rand() * w;
      const side = rand() < 0.5 ? -1 : 1;
      const top = rand() < 0.35;
      const dir: Rgb = top ? [0, 1, 0] : normalise([rand() * 0.3 - 0.15, 0.35, side]);
      leafCard(
        leaves.surface,
        [x, top ? h * 0.98 : h * (0.25 + rand() * 0.6), top ? 0 : side * d * 0.42],
        dir,
        Math.min(0.26, h * 0.3),
        rand() * Math.PI,
        tintRgb(tone, 0.95 + rand() * 0.3),
        0.3
      );
    }
  }
  return { parts: [body, leaves], contactRadius: Math.max(w, d) * 0.55, lightOffset: [0, h, 0] };
};

export const flowers: Generator = (ctx) => {
  const rand = makeRand(ctx.seed);
  const h = Math.max(0.25, ctx.spec.height);
  const foliage = part('foliageSolid');
  const blooms = part('paint');
  const spread = Math.max(0.35, ctx.spec.footprint[0] * 0.45);
  // `meadow-flowers` is the single largest triangle item this module draws — 154,848 of 431,300 at
  // the `ground` camera, **35.9 %**, measured. Nine clumps of two subdivision-3 blobs each is the
  // right flower bed at two metres and an extravagant one at forty, where the whole plant is a
  // couple of pixels of colour. The bloom keeps its own blob at every level because the COLOUR is
  // what a flower bed is for; what drops away is the subdivision under it.
  const clumps = ctx.lod === 0 ? 9 : ctx.lod === 1 ? 4 : 3;
  const detail = ctx.lod === 0 ? 3 : ctx.lod === 1 ? 2 : 1;
  for (let i = 0; i < clumps; i++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * spread;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const height = h * (0.6 + rand() * 0.6);
    // Stem and leaves as a small solid clump, then the bloom on top.
    addBlob(foliage.surface, x, height * 0.32, z, height * 0.3, detail, {
      colour: tintRgb(GRASS_GREEN, 0.7 + rand() * 0.25),
      seed: ctx.seed + i * 13,
      lumps: 0.35,
      squashY: 0.85,
      floorY: -height * 0.28,
      sway: 0.5,
    });
    const colour = FLOWER_COLOURS[Math.floor(rand() * FLOWER_COLOURS.length)];
    addBlob(blooms.surface, x, height * 0.72, z, height * 0.19, detail, {
      colour: tintRgb(colour, 0.9 + rand() * 0.25),
      seed: ctx.seed + i * 29,
      lumps: 0.4,
      squashY: 0.62,
      sway: 0.85,
    });
  }
  return { parts: [foliage, blooms], contactRadius: spread * 1.2, lightOffset: [0, h, 0] };
};

export const grassTuft: Generator = (ctx) => {
  const rand = makeRand(ctx.seed);
  const h = Math.max(0.2, ctx.spec.height);
  const blades = part('foliageSolid');
  const count = ctx.lod === 0 ? 11 : ctx.lod === 1 ? 6 : 3;
  const tone = tintRgb(GRASS_GREEN, 0.8 + rand() * 0.4);
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const lean = 0.2 + rand() * 0.5;
    const height = h * (0.6 + rand() * 0.7);
    const width = h * 0.075;
    const dirX = Math.cos(a);
    const dirZ = Math.sin(a);
    // Each blade is a two-segment tapered strip: it bends over, which a single quad cannot.
    const rings: TubeRing[] = [];
    for (let k = 0; k <= 2; k++) {
      const t = k / 2;
      rings.push({
        x: dirX * lean * height * t * t,
        y: height * t * (1 - t * 0.15),
        z: dirZ * lean * height * t * t,
        radius: width * (1 - t * 0.85) + 0.004,
        sway: 0.25 + t * 0.75,
        colour: tintRgb(tone, 0.8 + t * 0.4),
      });
    }
    addTube(blades.surface, rings, 3, { uvScale: 0.2 });
  }
  return { parts: [blades], contactRadius: 0, lightOffset: [0, h, 0] };
};

export { LEAF_SUMMER, SHRUB_GREEN };
