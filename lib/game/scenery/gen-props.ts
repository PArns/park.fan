/**
 * Everything that was manufactured rather than grown: path furniture, fences, signage, lighting,
 * garden pieces and the rocks.
 *
 * The rule the art bible sets for these is "benches, bins and planters are small but are what a
 * path reads as furnished", and the thing that decides whether that lands is **detail at the
 * scale a guest stands at**. A bench is 1.8 m long and a visitor's camera gets within two metres
 * of it, so it gets cast end-frames with a curve in them, slats with gaps between them, and a
 * different material for the metal and the wood. A bin gets a rim, a lid and a bracket. None of
 * that costs anything at runtime: it is one thin-instanced mesh either way, and the triangles are
 * the cheapest thing in the frame.
 *
 * Every generator is driven by the manifest entry's own `footprint`, `height` and `night.light`,
 * so a new pack entry pointing at one of these is a different prop rather than a copy — the
 * extensibility gate in `catalog.ts` only works if the generators honour it.
 */

import {
  addBlob,
  addBox,
  addCard,
  addDisc,
  addLathe,
  addTube,
  mixRgb,
  srgb,
  tintRgb,
  type Rgb,
  type TubeRing,
} from './geometry';
import { makeRand, part, type BuildContext, type Generator, type PropBuild } from './gen-foliage';

// ── Palettes ───────────────────────────────────────────────────────────────────────────────

const IRON_DARK = srgb(0x2b3138);
const IRON_GREEN = srgb(0x2f4034);
const TEAK = srgb(0x8a5f33);
const BRASS = srgb(0xb08d4a);
const STONE_PALE = srgb(0xb9b2a4);
const STONE_WARM = srgb(0xa89579);
const SOIL = srgb(0x40301f);
const CANVAS_CREAM = srgb(0xe8e0cf);
const PARKFAN_BLUE = srgb(0x2b8fd6);
const WHITE = srgb(0xf2f2f0);

const DEFAULT_BUILD = (contactRadius: number, lightOffset: [number, number, number]) => ({
  contactRadius,
  lightOffset,
});

// ── Bench ──────────────────────────────────────────────────────────────────────────────────

/**
 * A park bench: two cast end frames and seven timber slats.
 *
 * The seat sits at 0.45 m and the back rises to the manifest's height, which is the geometry a
 * 1.75 m guest is animated against. The end frame is drawn as a swept tube rather than as boxes
 * because the profile a visitor sees from the side is the whole silhouette of a bench.
 */
export const bench: Generator = (ctx) => {
  const rand = makeRand(ctx.seed);
  const [length, depth] = ctx.spec.footprint;
  const h = ctx.spec.height;
  const metal = part('metal');
  const wood = part('wood');
  const iron = tintRgb(IRON_DARK, 0.95 + rand() * 0.15);
  const timber = tintRgb(TEAK, 0.9 + rand() * 0.25);
  const seatY = Math.min(0.45, h * 0.5);
  const halfL = length / 2;
  const halfD = depth / 2;

  for (const side of [-1, 1]) {
    const x = side * (halfL - 0.09);
    // Foot → knee → seat rail → back post, as one swept profile.
    const rings: TubeRing[] = [
      { x, y: 0.01, z: -halfD * 0.92, radius: 0.045, sway: 0, colour: iron },
      { x, y: 0.13, z: -halfD * 0.86, radius: 0.036, sway: 0, colour: iron },
      { x, y: seatY - 0.05, z: -halfD * 0.5, radius: 0.032, sway: 0, colour: iron },
      { x, y: seatY, z: 0, radius: 0.03, sway: 0, colour: iron },
      { x, y: seatY - 0.05, z: halfD * 0.55, radius: 0.032, sway: 0, colour: iron },
      { x, y: 0.13, z: halfD * 0.86, radius: 0.036, sway: 0, colour: iron },
      { x, y: 0.01, z: halfD * 0.92, radius: 0.045, sway: 0, colour: iron },
    ];
    addTube(metal.surface, rings, 6, { uvScale: 0.3, capStart: true, capEnd: true });
    // The back: a leaning post with a slight curve at the top.
    const back: TubeRing[] = [];
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      back.push({
        x,
        y: seatY + (h - seatY) * t,
        z: halfD * 0.55 + t * t * halfD * 0.55,
        radius: 0.032 - t * 0.008,
        sway: 0,
        colour: iron,
      });
    }
    addTube(metal.surface, back, 6, { uvScale: 0.3, capEnd: true });
    // Armrest.
    const arm: TubeRing[] = [
      { x, y: seatY + 0.22, z: -halfD * 0.55, radius: 0.026, sway: 0, colour: iron },
      { x, y: seatY + 0.26, z: 0, radius: 0.026, sway: 0, colour: iron },
      { x, y: seatY + 0.3, z: halfD * 0.75, radius: 0.026, sway: 0, colour: iron },
    ];
    addTube(metal.surface, arm, 5, { uvScale: 0.3, capStart: true, capEnd: true });
  }

  const slatWidth = depth * 0.24;
  for (let i = 0; i < 3; i++) {
    const z = -halfD * 0.62 + i * (depth * 0.46);
    addBox(wood.surface, 0, seatY + 0.02, z, length - 0.06, 0.035, slatWidth, {
      colour: tintRgb(timber, 0.94 + i * 0.04),
      uvScale: 0.5,
    });
  }
  for (let i = 0; i < 3; i++) {
    const t = 0.28 + i * 0.3;
    const y = seatY + (h - seatY) * t;
    const z = halfD * 0.55 + t * t * halfD * 0.55;
    addBox(wood.surface, 0, y, z, length - 0.06, depth * 0.2, 0.035, {
      colour: tintRgb(timber, 0.9 + i * 0.06),
      uvScale: 0.5,
    });
  }
  return { parts: [metal, wood], ...DEFAULT_BUILD(Math.max(length, depth) * 0.62, [0, h, 0]) };
};

// ── Bin ────────────────────────────────────────────────────────────────────────────────────

export const bin: Generator = (ctx) => {
  const rand = makeRand(ctx.seed);
  const r = Math.max(0.16, ctx.spec.footprint[0] * 0.46);
  const h = ctx.spec.height;
  const paint = part('paint');
  const metal = part('metal');
  const shell = tintRgb(IRON_GREEN, 0.9 + rand() * 0.3);
  // The body: a slightly waisted drum, closed at the bottom, with a rolled rim.
  addLathe(
    paint.surface,
    0,
    0,
    0,
    [
      [r * 0.78, 0.02],
      [r * 0.86, 0.08],
      [r * 0.9, h * 0.35],
      [r, h * 0.72],
      [r, h * 0.86],
      [r * 0.94, h * 0.9],
    ],
    ctx.lod === 0 ? 14 : 8,
    { colour: shell, uvScale: 0.5, closeBottom: true }
  );
  // The lid: a shallow dome above a gap, held on a bracket, so a guest can post litter into it.
  addLathe(
    metal.surface,
    0,
    0,
    0,
    [
      [r * 1.06, h * 0.94],
      [r * 0.98, h * 0.99],
      [r * 0.62, h],
      [0, h * 1.02],
    ],
    ctx.lod === 0 ? 14 : 8,
    { colour: tintRgb(IRON_DARK, 1.1), uvScale: 0.4 }
  );
  addBox(metal.surface, 0, h * 0.92, r * 0.9, r * 0.5, h * 0.12, 0.03, {
    colour: IRON_DARK,
    uvScale: 0.3,
  });
  if (ctx.lod === 0) {
    // Three hoops down the drum: the detail that says "municipal" at two metres.
    for (const y of [h * 0.24, h * 0.52, h * 0.78]) {
      addLathe(
        metal.surface,
        0,
        0,
        0,
        [
          [r * 0.93, y - 0.012],
          [r * 0.99, y],
          [r * 0.93, y + 0.012],
        ],
        12,
        { colour: tintRgb(IRON_DARK, 1.2), uvScale: 0.2 }
      );
    }
  }
  return { parts: [paint, metal], ...DEFAULT_BUILD(r * 1.5, [0, h, 0]) };
};

// ── Lamps ──────────────────────────────────────────────────────────────────────────────────

/** A four-panel lantern head; shared by both lamps so the glass reads the same in the park. */
function lanternHead(
  build: { metal: ReturnType<typeof part>; glass: ReturnType<typeof part> },
  y: number,
  size: number,
  colour: Rgb
): void {
  const half = size / 2;
  // Glass first: a tapered box, so the head has a top that catches the light.
  addLathe(
    build.glass.surface,
    0,
    y,
    0,
    [
      [half * 0.92, 0],
      [half, size * 0.25],
      [half * 0.78, size],
    ],
    4,
    { colour, uvScale: 0.3 }
  );
  // The cage: four corner posts plus a crown and a base ring.
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    addTube(
      build.metal.surface,
      [
        {
          x: Math.cos(a) * half * 0.95,
          y,
          z: Math.sin(a) * half * 0.95,
          radius: 0.016,
          sway: 0,
          colour: IRON_DARK,
        },
        {
          x: Math.cos(a) * half * 0.78,
          y: y + size,
          z: Math.sin(a) * half * 0.78,
          radius: 0.014,
          sway: 0,
          colour: IRON_DARK,
        },
      ],
      4,
      { uvScale: 0.2 }
    );
  }
  addLathe(
    build.metal.surface,
    0,
    y,
    0,
    [
      [half * 1.18, -0.03],
      [half * 1.12, 0.02],
      [half * 0.95, 0.05],
    ],
    8,
    { colour: IRON_DARK, uvScale: 0.2 }
  );
  addLathe(
    build.metal.surface,
    0,
    y + size,
    0,
    [
      [half * 0.9, 0],
      [half * 1.1, 0.05],
      [half * 0.5, size * 0.34],
      [0.02, size * 0.42],
    ],
    8,
    { colour: IRON_DARK, uvScale: 0.25 }
  );
}

export const lampVictorian: Generator = (ctx) => {
  const h = ctx.spec.height;
  const metal = part('metal');
  const glass = part('emissive', ctx.night?.color ?? '#ffd9a0');
  const postR = 0.055;
  // Fluted base.
  addLathe(
    metal.surface,
    0,
    0,
    0,
    [
      [postR * 3.2, 0],
      [postR * 3.1, 0.06],
      [postR * 2.3, 0.12],
      [postR * 2.5, 0.2],
      [postR * 1.6, 0.34],
      [postR * 1.35, 0.5],
    ],
    ctx.lod === 0 ? 12 : 8,
    { colour: IRON_DARK, uvScale: 0.4, closeBottom: false }
  );
  const shaftTop = h * 0.78;
  addTube(
    metal.surface,
    [
      { x: 0, y: 0.48, z: 0, radius: postR * 1.3, sway: 0, colour: IRON_DARK },
      { x: 0, y: shaftTop * 0.55, z: 0, radius: postR * 1.05, sway: 0, colour: IRON_DARK },
      { x: 0, y: shaftTop, z: 0, radius: postR * 0.9, sway: 0, colour: tintRgb(IRON_DARK, 1.15) },
    ],
    ctx.lod === 0 ? 10 : 6,
    { uvScale: 0.5 }
  );
  // A collar under the head, with two scrolled brackets, which is what makes it Victorian rather
  // than a pipe with a box on it.
  addLathe(
    metal.surface,
    0,
    shaftTop,
    0,
    [
      [postR * 1.5, 0],
      [postR * 2.2, 0.05],
      [postR * 1.2, 0.12],
    ],
    8,
    { colour: BRASS, uvScale: 0.2 }
  );
  if (ctx.lod === 0) {
    for (const side of [-1, 1]) {
      const scroll: TubeRing[] = [];
      for (let i = 0; i <= 5; i++) {
        const t = i / 5;
        const a = t * Math.PI * 0.9;
        scroll.push({
          x: side * (0.06 + Math.sin(a) * 0.13),
          y: shaftTop - 0.18 + (1 - Math.cos(a)) * 0.2,
          z: 0,
          radius: 0.014,
          sway: 0,
          colour: BRASS,
        });
      }
      addTube(metal.surface, scroll, 4, { uvScale: 0.2 });
    }
  }
  const headY = shaftTop + 0.12;
  lanternHead({ metal, glass }, headY, h * 0.16, srgb(0xffe6bd));
  return {
    parts: [metal, glass],
    contactRadius: postR * 6,
    lightOffset: [0, ctx.night?.height ?? headY + h * 0.08, 0],
  };
};

export const lampModern: Generator = (ctx) => {
  const h = ctx.spec.height;
  const metal = part('metal');
  const glass = part('emissive', ctx.night?.color ?? '#dff6ff');
  const w = Math.max(0.1, ctx.spec.footprint[0] * 0.42);
  addBox(metal.surface, 0, 0.025, 0, w * 2.1, 0.05, w * 2.1, {
    colour: tintRgb(IRON_DARK, 1.1),
    uvScale: 0.4,
  });
  addBox(metal.surface, 0, h / 2, 0, w, h, w, {
    colour: srgb(0x9aa1a6),
    uvScale: 0.6,
  });
  // A recessed vertical strip on two faces: the whole design of a column light.
  for (const side of [-1, 1]) {
    addBox(glass.surface, (side * w) / 2 + side * 0.004, h * 0.55, 0, 0.008, h * 0.74, w * 0.34, {
      colour: srgb(0xdff6ff),
      uvScale: 0.4,
    });
  }
  addBox(metal.surface, 0, h + 0.02, 0, w * 1.25, 0.04, w * 1.25, {
    colour: tintRgb(IRON_DARK, 1.2),
    uvScale: 0.4,
  });
  return {
    parts: [metal, glass],
    contactRadius: w * 2.4,
    lightOffset: [0, ctx.night?.height ?? h * 0.94, 0],
  };
};

// ── Garden ─────────────────────────────────────────────────────────────────────────────────

export const planterRound: Generator = (ctx) => {
  const rand = makeRand(ctx.seed);
  const r = Math.max(0.4, ctx.spec.footprint[0] * 0.5);
  const h = ctx.spec.height;
  const stone = part('stone');
  const soil = part('stone');
  const leaves = part('leaf');
  const wall = mixRgb(STONE_PALE, STONE_WARM, rand() * 0.7);
  addLathe(
    stone.surface,
    0,
    0,
    0,
    [
      [r * 0.86, 0],
      [r * 0.9, h * 0.12],
      [r * 0.97, h * 0.8],
      [r, h * 0.9],
      [r * 0.98, h],
      [r * 0.88, h],
      [r * 0.86, h * 0.86],
      [r * 0.8, h * 0.2],
    ],
    ctx.lod === 0 ? 20 : 10,
    { colour: wall, uvScale: 0.8 }
  );
  addDisc(soil.surface, 0, h * 0.84, 0, r * 0.87, ctx.lod === 0 ? 16 : 8, SOIL);
  if (ctx.lod !== 2) {
    const cards = ctx.lod === 0 ? 22 : 10;
    for (let i = 0; i < cards; i++) {
      const a = rand() * Math.PI * 2;
      const rr = Math.sqrt(rand()) * r * 0.78;
      const dir: Rgb = [Math.cos(a) * 0.5, 0.8, Math.sin(a) * 0.5];
      const dl = Math.hypot(dir[0], dir[1], dir[2]);
      addCard(
        leaves.surface,
        [Math.cos(a) * rr, h * 0.86 + rand() * h * 0.5, Math.sin(a) * rr],
        [Math.cos(a + 1.57), 0, Math.sin(a + 1.57)],
        [0, 1, 0],
        r * 0.2,
        r * 0.22,
        {
          colour: tintRgb(
            mixRgb(srgb(0x5c8a34), srgb(0xc4536a), rand() * 0.35),
            0.9 + rand() * 0.3
          ),
          sway: 0.8,
          outward: [dir[0] / dl, dir[1] / dl, dir[2] / dl],
        }
      );
    }
  }
  return { parts: [stone, soil, leaves], ...DEFAULT_BUILD(r * 1.15, [0, h, 0]) };
};

export const fountainTier: Generator = (ctx) => {
  const r = Math.max(1, ctx.spec.footprint[0] * 0.5);
  const h = ctx.spec.height;
  const stone = part('stone');
  const water = part('pond');
  const glow = part('emissive', ctx.night?.color ?? '#a8d8ff');
  const sides = ctx.lod === 0 ? 24 : 12;
  // Outer basin.
  addLathe(
    stone.surface,
    0,
    0,
    0,
    [
      [r, 0],
      [r, h * 0.16],
      [r * 0.96, h * 0.19],
      [r * 0.9, h * 0.17],
      [r * 0.9, h * 0.03],
      [r * 0.2, h * 0.02],
    ],
    sides,
    { colour: STONE_PALE, uvScale: 1 }
  );
  addDisc(water.surface, 0, h * 0.115, 0, r * 0.89, sides, srgb(0x2f6d86));
  // Pedestal and two upper bowls.
  addLathe(
    stone.surface,
    0,
    0,
    0,
    [
      [r * 0.24, h * 0.02],
      [r * 0.16, h * 0.2],
      [r * 0.13, h * 0.4],
      [r * 0.3, h * 0.44],
      [r * 0.34, h * 0.48],
      [r * 0.12, h * 0.5],
      [r * 0.09, h * 0.68],
      [r * 0.2, h * 0.72],
      [r * 0.22, h * 0.75],
      [r * 0.07, h * 0.78],
      [r * 0.05, h * 0.92],
    ],
    sides,
    { colour: STONE_WARM, uvScale: 0.9 }
  );
  addDisc(water.surface, 0, h * 0.462, 0, r * 0.31, sides, srgb(0x2f6d86));
  addDisc(water.surface, 0, h * 0.742, 0, r * 0.2, sides, srgb(0x2f6d86));
  // The jet, as a slim emissive spire: a real particle plume belongs to the effects module, and a
  // static cone of "water" would be worse than this at every time of day.
  addLathe(
    glow.surface,
    0,
    0,
    0,
    [
      [r * 0.05, h * 0.9],
      [r * 0.02, h * 0.98],
      [r * 0.004, h],
    ],
    6,
    { colour: srgb(0xcfe9f7), uvScale: 0.3 }
  );
  return {
    parts: [stone, water, glow],
    ...DEFAULT_BUILD(r * 1.1, [0, ctx.night?.height ?? h * 0.3, 0]),
  };
};

// ── Fence, hedge-adjacent, signage ─────────────────────────────────────────────────────────

export const fenceIron: Generator = (ctx) => {
  const [width] = ctx.spec.footprint;
  const h = ctx.spec.height;
  const metal = part('metal');
  const colour = IRON_DARK;
  const bars = Math.max(3, Math.round(width / 0.22));
  for (const side of [-1, 1]) {
    // Posts at both ends, so a run of panels has a post between every pair.
    addBox(metal.surface, (side * width) / 2, h * 0.53, 0, 0.07, h * 1.06, 0.07, {
      colour: tintRgb(colour, 1.05),
      uvScale: 0.3,
    });
    addLathe(
      metal.surface,
      (side * width) / 2,
      h * 1.06,
      0,
      [
        [0.05, 0],
        [0.035, 0.04],
        [0.045, 0.06],
        [0.005, 0.11],
      ],
      6,
      { colour: BRASS, uvScale: 0.2 }
    );
  }
  for (const y of [h * 0.16, h * 0.82]) {
    addBox(metal.surface, 0, y, 0, width, 0.045, 0.03, { colour, uvScale: 0.4 });
  }
  for (let i = 1; i < bars; i++) {
    const x = -width / 2 + (width * i) / bars;
    addBox(metal.surface, x, h * 0.5, 0, 0.022, h, 0.022, { colour, uvScale: 0.25 });
    if (ctx.lod === 0) {
      // Spear tips: the difference between railings and a grid.
      addLathe(
        metal.surface,
        x,
        h,
        0,
        [
          [0.024, 0],
          [0.032, 0.03],
          [0.016, 0.07],
          [0.002, 0.12],
        ],
        5,
        { colour: tintRgb(colour, 1.3), uvScale: 0.2 }
      );
    }
  }
  return { parts: [metal], ...DEFAULT_BUILD(0, [0, h, 0]) };
};

export const flag: Generator = (ctx) => {
  const h = ctx.spec.height;
  const metal = part('metal');
  const cloth = part('fabric');
  addLathe(
    metal.surface,
    0,
    0,
    0,
    [
      [0.14, 0],
      [0.13, 0.08],
      [0.05, 0.14],
    ],
    8,
    { colour: srgb(0x9aa1a6), uvScale: 0.3, closeBottom: true }
  );
  addTube(
    metal.surface,
    [
      { x: 0, y: 0.1, z: 0, radius: 0.042, sway: 0, colour: srgb(0xb9c0c4) },
      { x: 0, y: h * 0.6, z: 0, radius: 0.034, sway: 0, colour: srgb(0xc6cdd1) },
      { x: 0, y: h, z: 0, radius: 0.028, sway: 0, colour: srgb(0xd2d8db) },
    ],
    ctx.lod === 0 ? 8 : 5,
    { uvScale: 0.6 }
  );
  addLathe(
    metal.surface,
    0,
    h,
    0,
    [
      [0.055, 0],
      [0.02, 0.09],
    ],
    6,
    {
      colour: BRASS,
      uvScale: 0.2,
    }
  );
  // The flag itself: a strip of panels whose sway weight rises towards the fly, so the wind
  // plugin ripples it from the halyard outwards instead of sliding the whole sheet sideways.
  const flyLength = h * 0.42;
  const flagHeight = h * 0.26;
  const panels = ctx.lod === 0 ? 6 : 3;
  for (let i = 0; i < panels; i++) {
    const t0 = i / panels;
    const t1 = (i + 1) / panels;
    const mid = (t0 + t1) / 2;
    const colour = mid < 0.34 ? PARKFAN_BLUE : mid < 0.42 ? WHITE : PARKFAN_BLUE;
    addCard(
      cloth.surface,
      [0.04 + flyLength * mid, h * 0.82, 0],
      [1, 0, 0],
      [0, 1, 0],
      (flyLength / panels) * 0.52,
      flagHeight / 2,
      {
        colour,
        sway: 0.25 + mid * 0.85,
        outward: [0, 0, 1],
      }
    );
  }
  return { parts: [metal, cloth], ...DEFAULT_BUILD(0.35, [0, h, 0]) };
};

export const signPost: Generator = (ctx) => {
  const h = ctx.spec.height;
  const w = Math.max(0.8, ctx.spec.footprint[0]);
  const wood = part('wood');
  const paint = part('paint');
  for (const side of [-1, 1]) {
    addBox(wood.surface, (side * w) / 2.6, h * 0.5, 0, 0.09, h, 0.09, {
      colour: TEAK,
      uvScale: 0.4,
    });
  }
  addBox(paint.surface, 0, h * 0.78, 0, w, h * 0.34, 0.05, {
    colour: PARKFAN_BLUE,
    uvScale: 0.6,
  });
  addBox(paint.surface, 0, h * 0.78, 0.032, w * 0.86, h * 0.2, 0.012, {
    colour: WHITE,
    uvScale: 0.4,
  });
  return { parts: [wood, paint], ...DEFAULT_BUILD(w * 0.5, [0, h, 0]) };
};

/**
 * The entrance arch: two piers, a span, a sign board and a run of pennants.
 *
 * This is the one prop a park is photographed under, so it gets the most geometry in the module —
 * moulded plinths and caps on the piers, a curved sign board rather than a flat plate, and a
 * lit band under it that the night rig picks up.
 */
export const entranceArch: Generator = (ctx) => {
  const [width] = ctx.spec.footprint;
  const h = ctx.spec.height;
  const stone = part('stone');
  const metal = part('metal');
  const paint = part('paint');
  const glow = part('emissive', ctx.night?.color ?? '#4fb3ff');
  const pierW = Math.max(0.7, width * 0.1);
  const span = width - pierW * 2;
  const beamY = h * 0.72;

  for (const side of [-1, 1]) {
    const x = (side * (width - pierW)) / 2;
    addBox(stone.surface, x, 0.14, 0, pierW * 1.45, 0.28, pierW * 1.45, {
      colour: STONE_WARM,
      uvScale: 1,
    });
    addBox(stone.surface, x, beamY * 0.5 + 0.2, 0, pierW, beamY - 0.1, pierW, {
      colour: STONE_PALE,
      uvScale: 1.2,
    });
    addBox(stone.surface, x, beamY + 0.08, 0, pierW * 1.3, 0.16, pierW * 1.3, {
      colour: STONE_WARM,
      uvScale: 1,
    });
  }
  // The span: a box beam with a shallow arch of tube under it.
  addBox(metal.surface, 0, beamY + 0.34, 0, span + pierW, 0.34, pierW * 0.7, {
    colour: tintRgb(IRON_DARK, 1.05),
    uvScale: 0.8,
  });
  const archRings: TubeRing[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    archRings.push({
      x: -span / 2 + span * t,
      y: beamY + 0.16 - Math.sin(t * Math.PI) * h * 0.09,
      z: 0,
      radius: 0.06,
      sway: 0,
      colour: BRASS,
    });
  }
  addTube(metal.surface, archRings, 6, { uvScale: 0.5 });
  // The board.
  addBox(paint.surface, 0, h * 0.9, 0, span * 0.86, h * 0.2, 0.12, {
    colour: PARKFAN_BLUE,
    uvScale: 1,
  });
  addBox(paint.surface, 0, h * 0.9, 0.07, span * 0.78, h * 0.1, 0.02, {
    colour: WHITE,
    uvScale: 0.6,
  });
  addBox(glow.surface, 0, beamY + 0.5, 0, span * 0.9, 0.07, pierW * 0.5, {
    colour: srgb(0x9fd8ff),
    uvScale: 0.5,
  });
  if (ctx.lod === 0) {
    const pennants = 9;
    for (let i = 0; i < pennants; i++) {
      const t = (i + 0.5) / pennants;
      const x = -span / 2 + span * t;
      const y = beamY + 0.16 - Math.sin(t * Math.PI) * h * 0.09;
      addCard(paint.surface, [x, y - 0.16, 0], [1, 0, 0], [0, 1, 0], span / pennants / 2.4, 0.14, {
        colour: i % 2 === 0 ? WHITE : PARKFAN_BLUE,
        sway: 0.7,
        outward: [0, 0, 1],
        doubleSided: true,
      });
    }
  }
  return {
    parts: [stone, metal, paint, glow],
    contactRadius: 0,
    lightOffset: [0, ctx.night?.height ?? h * 0.8, 0],
  };
};

// ── Neon-lagoon pieces ─────────────────────────────────────────────────────────────────────

export const lightStrip: Generator = (ctx) => {
  const [width] = ctx.spec.footprint;
  const metal = part('metal');
  const glow = part('emissive', ctx.night?.color ?? '#ff2fa0');
  addBox(metal.surface, 0, 0.03, 0, width, 0.06, 0.12, {
    colour: srgb(0x4a5158),
    uvScale: 0.3,
  });
  addBox(glow.surface, 0, 0.065, 0, width * 0.96, 0.02, 0.08, {
    colour: srgb(0xffb0d8),
    uvScale: 0.3,
  });
  return { parts: [metal, glow], contactRadius: 0, lightOffset: [0, ctx.night?.height ?? 0.1, 0] };
};

export const neonPalm: Generator = (ctx) => {
  const h = ctx.spec.height;
  const metal = part('metal');
  const glow = part('emissive', ctx.night?.color ?? '#16e0c8');
  addLathe(
    metal.surface,
    0,
    0,
    0,
    [
      [0.22, 0],
      [0.2, 0.1],
      [0.09, 0.16],
    ],
    8,
    {
      colour: srgb(0x35404a),
      uvScale: 0.3,
    }
  );
  // The trunk as a stack of neon rings on a dark spine: the shape reads in daylight, the rings
  // carry it at night.
  const spine: TubeRing[] = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    spine.push({
      x: t * t * h * 0.1,
      y: 0.14 + h * 0.62 * t,
      z: 0,
      radius: 0.05 - t * 0.014,
      sway: 0,
      colour: srgb(0x2a333c),
    });
  }
  addTube(metal.surface, spine, 6, { uvScale: 0.4 });
  for (let i = 1; i <= 6; i++) {
    const t = i / 7;
    addLathe(
      glow.surface,
      t * t * h * 0.1,
      0.14 + h * 0.62 * t,
      0,
      [
        [0.075, 0],
        [0.085, 0.02],
        [0.075, 0.04],
      ],
      8,
      { colour: srgb(0x6ffbe6), uvScale: 0.2 }
    );
  }
  const crown = spine[spine.length - 1];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const frond: TubeRing[] = [];
    for (let k = 0; k <= 5; k++) {
      const t = k / 5;
      frond.push({
        x: crown.x + Math.cos(a) * h * 0.3 * t,
        y: crown.y + h * 0.14 * Math.sin(t * 2.2) - t * t * h * 0.16,
        z: crown.z + Math.sin(a) * h * 0.3 * t,
        radius: 0.035 * (1 - t * 0.6),
        sway: 0,
        colour: srgb(0x6ffbe6),
      });
    }
    addTube(glow.surface, frond, 5, { uvScale: 0.3 });
  }
  return {
    parts: [metal, glow],
    contactRadius: 0.4,
    lightOffset: [0, ctx.night?.height ?? h * 0.85, 0],
  };
};

export const parasol: Generator = (ctx) => {
  const rand = makeRand(ctx.seed);
  const r = Math.max(0.6, ctx.spec.footprint[0] * 0.5);
  const h = ctx.spec.height;
  const metal = part('metal');
  const cloth = part('fabric');
  addLathe(
    metal.surface,
    0,
    0,
    0,
    [
      [r * 0.24, 0],
      [r * 0.22, 0.05],
      [0.05, 0.09],
    ],
    8,
    {
      colour: srgb(0x5a6167),
      uvScale: 0.3,
      closeBottom: true,
    }
  );
  addTube(
    metal.surface,
    [
      { x: 0, y: 0.08, z: 0, radius: 0.028, sway: 0, colour: srgb(0xb0b7bb) },
      { x: 0, y: h, z: 0, radius: 0.022, sway: 0, colour: srgb(0xc6cdd1) },
    ],
    6,
    { uvScale: 0.5 }
  );
  const gores = ctx.lod === 0 ? 8 : 6;
  const accent = rand() < 0.5 ? srgb(0xe2603f) : srgb(0x3f92c4);
  for (let i = 0; i < gores; i++) {
    const a0 = (i / gores) * Math.PI * 2;
    const a1 = ((i + 1) / gores) * Math.PI * 2;
    const mid = (a0 + a1) / 2;
    const colour = i % 2 === 0 ? CANVAS_CREAM : accent;
    // Each gore is a triangle from the crown to two rim points, drooping at the edge.
    addCard(
      cloth.surface,
      [(Math.cos(mid) * r) / 1.7, h * 0.86 - r * 0.09, (Math.sin(mid) * r) / 1.7],
      [Math.cos(mid + Math.PI / 2), 0, Math.sin(mid + Math.PI / 2)],
      [-Math.cos(mid) * 0.32, 0.94, -Math.sin(mid) * 0.32],
      (r * Math.PI) / gores,
      r * 0.56,
      {
        colour,
        sway: 0.35,
        outward: [Math.cos(mid) * 0.3, 0.9, Math.sin(mid) * 0.3],
        doubleSided: true,
      }
    );
  }
  return { parts: [metal, cloth], ...DEFAULT_BUILD(r * 0.6, [0, h, 0]) };
};

export const lounger: Generator = (ctx) => {
  const [length, depth] = ctx.spec.footprint;
  const metal = part('metal');
  const cloth = part('fabric');
  const frame = srgb(0xd2d6d8);
  for (const side of [-1, 1]) {
    const z = (side * depth) / 2.4;
    addTube(
      metal.surface,
      [
        { x: -length / 2, y: 0.02, z, radius: 0.024, sway: 0, colour: frame },
        { x: -length / 2 + 0.05, y: 0.3, z, radius: 0.024, sway: 0, colour: frame },
        { x: -length * 0.16, y: 0.44, z, radius: 0.024, sway: 0, colour: frame },
        { x: length * 0.1, y: 0.32, z, radius: 0.024, sway: 0, colour: frame },
        { x: length / 2, y: 0.3, z, radius: 0.024, sway: 0, colour: frame },
        { x: length / 2, y: 0.02, z, radius: 0.024, sway: 0, colour: frame },
      ],
      5,
      { uvScale: 0.3, capStart: true, capEnd: true }
    );
  }
  // The sling, in two planes: the back rest and the seat.
  addCard(
    cloth.surface,
    [-length * 0.26, 0.4, 0],
    [0.78, 0.62, 0],
    [0, 0, 1],
    length * 0.24,
    depth * 0.4,
    { colour: srgb(0xe7e2d6), sway: 0.1, outward: [-0.4, 0.9, 0], doubleSided: true }
  );
  addCard(
    cloth.surface,
    [length * 0.16, 0.33, 0],
    [1, -0.06, 0],
    [0, 0, 1],
    length * 0.34,
    depth * 0.4,
    { colour: srgb(0xe7e2d6), sway: 0.08, outward: [0, 1, 0], doubleSided: true }
  );
  return { parts: [metal, cloth], ...DEFAULT_BUILD(Math.max(length, depth) * 0.55, [0, 0.5, 0]) };
};

// ── Rock ───────────────────────────────────────────────────────────────────────────────────

/**
 * A boulder, or a cluster of them.
 *
 * The silhouette is the whole job: `addBlob`'s displacement is driven hard here and the shape is
 * squashed and yawed per instance, because a boulder whose outline is a circle is the clearest
 * "this was generated" tell in the whole module.
 */
export const rock: Generator = (ctx) => {
  const rand = makeRand(ctx.seed);
  const stone = part('stone');
  const size = Math.max(0.25, ctx.spec.footprint[0] * 0.5);
  const h = ctx.spec.height;
  const count = size > 1 ? (ctx.lod === 0 ? 3 : 2) : 2;
  const colour = mixRgb(srgb(0x6f6b62), srgb(0x8d8578), rand());
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const off = i === 0 ? 0 : size * (0.5 + rand() * 0.5);
    const r = size * (i === 0 ? 1 : 0.35 + rand() * 0.3);
    const squash = (h / Math.max(size, 0.01)) * (0.6 + rand() * 0.5);
    addBlob(
      stone.surface,
      Math.cos(a) * off,
      h * 0.32,
      Math.sin(a) * off,
      r,
      ctx.lod === 0 ? 5 : 3,
      {
        colour: tintRgb(colour, 0.82 + rand() * 0.36),
        seed: ctx.seed + i * 977,
        lumps: 0.34,
        squashY: Math.max(0.35, Math.min(1.1, squash)),
        floorY: -h * 0.3,
        uvScale: 1.4,
        // A second, sharper displacement: granite breaks along planes, so the lumps get facets.
        displace: (x, y, z) =>
          Math.sin(x * 7.3 + ctx.seed * 0.01) * Math.cos(z * 6.1) * 0.07 + Math.cos(y * 9.1) * 0.03,
      }
    );
  }
  return { parts: [stone], ...DEFAULT_BUILD(size * 1.1, [0, h, 0]) };
};

/**
 * The last-resort generator, for a manifest entry whose `procedural` name matched nothing.
 *
 * It is a real object of the entry's own size rather than nothing: a prop that silently fails to
 * draw becomes a bug report about the placement tool, and this one is recognisable enough that
 * the reader knows to go and look at the manifest.
 */
export const marker: Generator = (ctx) => {
  const [w, d] = ctx.spec.footprint;
  const h = Math.max(0.6, ctx.spec.height);
  const stone = part('stone');
  const paint = part('paint');
  addBox(stone.surface, 0, 0.08, 0, Math.max(0.4, w), 0.16, Math.max(0.4, d), {
    colour: STONE_PALE,
    uvScale: 1,
  });
  addBox(
    paint.surface,
    0,
    h * 0.5 + 0.16,
    0,
    Math.min(w, d) * 0.3 + 0.08,
    h,
    Math.min(w, d) * 0.3 + 0.08,
    {
      colour: srgb(0xc8a63c),
      uvScale: 0.6,
    }
  );
  return { parts: [stone, paint], ...DEFAULT_BUILD(Math.max(w, d) * 0.6, [0, h, 0]) };
};

export type { BuildContext, Generator, PropBuild };
