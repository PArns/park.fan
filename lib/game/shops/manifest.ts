/**
 * The shop style and menu catalogue — data, not code.
 *
 * A shop in a pack is a `shopSchema` entry (core's), and it names a `procedural` generator. This
 * module reads that name as a **style id** and looks it up here: a style is the whole recipe for
 * the building — massing, roof, counters, awning, glazing, colours, signage — and `build.ts`
 * switches on nothing but the fields of the record it is handed. So a pack that ships
 * `"procedural": "gingerbread"` plus a `shopStyles` entry called `gingerbread` gets a new building
 * with no TypeScript, and a pack that ships a new shop naming an existing style gets the existing
 * building at its own footprint, colours and price.
 *
 * **Two pack categories are claimed here and both halves of the read are needed.** `registry.onPack`
 * fires on REGISTRATION and `host.ts` registers the bundled packs *before* any module is built, so
 * a listener on its own misses exactly the two packs the game ships with — the trap `scenery`,
 * `paths` and `terrain` each fell into. `attachShopContent` walks `registry.packs()` first and then
 * subscribes, which is the shape `guests/manifest.ts` and `terrain/manifest.ts` use.
 *
 * **The built-in catalogue below goes through the same parser as a pack's.** There is no
 * privileged path for the defaults, which is what stops the parser from quietly only working on
 * data it wrote itself — and it is why `pnpm test:game-shops` can register a synthetic pack and
 * compare the result field for field against a built-in one.
 *
 * The built-ins exist because `core-classic` and `neon-lagoon` name six generators (`kiosk-a`,
 * `kiosk-round`, `toilet-block`, `shop-b`, `atm`, `changing-block`) and declare nothing about how
 * they look — those packs are not this module's to edit. A style a pack DOES declare wins over the
 * built-in of the same id, and a shop naming no known style falls back to a form derived from its
 * `kind` and footprint rather than to nothing.
 *
 * DOM-free and Babylon-free: the sim reads menus, hours and counter counts, so this file is
 * reachable from the worker.
 */

import type { Localized, ShopMenuDef, ShopStyleDef } from './types';

// ── Glyphs ──────────────────────────────────────────────────────────────────────────────────
/**
 * Pictograms as polylines in a 0..1 box, drawn as extruded strips on the fascia.
 *
 * Data rather than geometry code, so a pack can ship its own through `sign.strokes` without this
 * module learning its name. They are deliberately coarse — a fascia pictogram is read at 15 m and
 * at 40 px, and a detailed outline turns to mud there.
 */
export const SHOP_GLYPHS: Record<string, number[][]> = {
  // Fork and knife.
  'fork-knife': [
    [0.3, 0.86, 0.3, 0.14],
    [0.18, 0.86, 0.18, 0.6, 0.42, 0.6, 0.42, 0.86],
    [0.68, 0.14, 0.68, 0.86],
    [0.68, 0.86, 0.8, 0.72, 0.8, 0.5, 0.68, 0.44],
  ],
  // A cup with a straw.
  cup: [
    [0.28, 0.72, 0.36, 0.14, 0.64, 0.14, 0.72, 0.72, 0.28, 0.72],
    [0.24, 0.78, 0.76, 0.78],
    [0.56, 0.78, 0.66, 0.96],
  ],
  // A cone.
  cone: [
    [0.34, 0.56, 0.5, 0.1, 0.66, 0.56],
    [0.3, 0.62, 0.7, 0.62],
    [0.34, 0.62, 0.38, 0.82, 0.5, 0.9, 0.62, 0.82, 0.66, 0.62],
  ],
  // The international loo pair, reduced to two bodies.
  wc: [
    [0.3, 0.9, 0.3, 0.76],
    [0.22, 0.72, 0.38, 0.72, 0.36, 0.4, 0.24, 0.4, 0.22, 0.72],
    [0.26, 0.4, 0.26, 0.12],
    [0.34, 0.4, 0.34, 0.12],
    [0.7, 0.9, 0.7, 0.76],
    [0.58, 0.68, 0.7, 0.72, 0.82, 0.68, 0.76, 0.36, 0.64, 0.36, 0.58, 0.68],
    [0.66, 0.36, 0.64, 0.12],
    [0.74, 0.36, 0.76, 0.12],
  ],
  // A cross.
  cross: [
    [
      0.4, 0.86, 0.6, 0.86, 0.6, 0.6, 0.86, 0.6, 0.86, 0.4, 0.6, 0.4, 0.6, 0.14, 0.4, 0.14, 0.4,
      0.4, 0.14, 0.4, 0.14, 0.6, 0.4, 0.6, 0.4, 0.86,
    ],
  ],
  // A banknote with a coin on it.
  cash: [
    [0.12, 0.66, 0.72, 0.66, 0.72, 0.3, 0.12, 0.3, 0.12, 0.66],
    [0.3, 0.48, 0.54, 0.48],
    [0.78, 0.7, 0.9, 0.58, 0.9, 0.36, 0.78, 0.24],
  ],
  // A carrier bag.
  bag: [
    [0.24, 0.68, 0.2, 0.12, 0.8, 0.12, 0.76, 0.68, 0.24, 0.68],
    [0.38, 0.68, 0.38, 0.84, 0.62, 0.84, 0.62, 0.68],
  ],
  // A lower-case i in a ring.
  info: [
    [0.5, 0.84, 0.5, 0.74],
    [0.42, 0.62, 0.52, 0.62, 0.52, 0.2],
    [0.38, 0.2, 0.66, 0.2],
  ],
  // Droplets, for anything to do with water.
  droplets: [
    [0.34, 0.16, 0.22, 0.36, 0.34, 0.5, 0.46, 0.36, 0.34, 0.16],
    [0.66, 0.34, 0.54, 0.56, 0.66, 0.7, 0.78, 0.56, 0.66, 0.34],
  ],
  // A hanger, for a changing room.
  hanger: [
    [0.5, 0.86, 0.42, 0.78, 0.5, 0.7, 0.5, 0.64],
    [0.5, 0.64, 0.12, 0.34, 0.88, 0.34, 0.5, 0.64],
  ],
};

/** Which glyph a `kind` gets when neither the style nor the pack names one. */
const GLYPH_BY_KIND: Record<string, string> = {
  food: 'fork-knife',
  drink: 'cup',
  toilet: 'wc',
  'changing-room': 'hanger',
  'first-aid': 'cross',
  atm: 'cash',
  souvenir: 'bag',
  info: 'info',
};

// ── Styles ──────────────────────────────────────────────────────────────────────────────────

/**
 * The six styles the bundled packs name, plus one generic per form.
 *
 * The numbers are researched rather than chosen: a European park kiosk has its counter at
 * 1.05–1.15 m, a serving window head at about 2.1 m, an awning that projects 1.5–2.5 m with its
 * front edge at 2.2 m, eaves overhanging 0.5–0.8 m, and a fascia band 0.4–0.6 m deep. A toilet
 * block door is 0.9 × 2.05 m. Getting these wrong is what makes a building read as a box with a
 * sign on it, which is the failure the frame axis is about.
 */
export const SHOP_STYLE_MANIFEST: readonly ShopStyleDef[] = [
  {
    id: 'kiosk-a',
    form: 'kiosk',
    // 3.15 m to the eaves, not 2.65. A serving kiosk has to fit three things on its frontage — the
    // hatch head at 2.15, an awning hung above it, and a fascia above that — and 2.65 fits two:
    // rendered at that height the awning and the sign band overlapped, and the awning's front edge
    // came down to 1.7 m, which is under head height for the person it is meant to shelter.
    wallHeight: 3.15,
    roof: 'hip',
    roofPitch: 32,
    eaves: 0.62,
    counters: 2,
    counterHeight: 1.1,
    awning: 1.9,
    menuBoard: 0.5,
    doors: 0,
    glazing: 0,
    rail: 7,
    apron: 4.2,
    plinth: 0.16,
    cladding: 'timber',
    flue: 0.9,
    dressing: true,
    palette: {
      wall: '#c8b394',
      trim: '#7d4a33',
      roof: '#7a4230',
      awningA: '#b8452f',
      awningB: '#efe3cf',
      metal: '#8b9095',
      sign: '#3b2b22',
      signLit: '#f4e7cf',
    },
    sign: { fascia: 0.46, bracket: true, post: 0 },
  },
  {
    id: 'kiosk-round',
    form: 'round',
    wallHeight: 2.5,
    roof: 'cone',
    roofPitch: 38,
    eaves: 0.72,
    counters: 2,
    counterHeight: 1.08,
    awning: 0,
    menuBoard: 0.34,
    doors: 0,
    glazing: 0,
    rail: 5,
    apron: 3.8,
    plinth: 0.18,
    // Plaster, not sheet panel. `panel` maps to the painted-metal tile, which is deliberately
    // near-featureless, and on a three-metre drum at the `close` camera that read as painted MDF.
    cladding: 'render',
    flue: 0,
    dressing: true,
    palette: {
      wall: '#e6ded0',
      trim: '#2f6f63',
      roof: '#2f6f63',
      awningA: '#2f6f63',
      awningB: '#efe9dd',
      metal: '#9aa0a4',
      sign: '#1f4a43',
      signLit: '#eef6ef',
    },
    sign: { fascia: 0.4, bracket: false, post: 0 },
  },
  {
    id: 'toilet-block',
    form: 'block',
    wallHeight: 2.9,
    roof: 'gable',
    roofPitch: 24,
    eaves: 0.5,
    counters: 0,
    counterHeight: 0,
    awning: 0,
    menuBoard: 0,
    doors: 2,
    glazing: 0,
    rail: 0,
    apron: 2.6,
    plinth: 0.2,
    cladding: 'brick',
    flue: 0,
    dressing: false,
    palette: {
      wall: '#a8846b',
      trim: '#4a5a52',
      roof: '#57616a',
      awningA: '#4a5a52',
      awningB: '#4a5a52',
      metal: '#8d9298',
      sign: '#2c3a36',
      signLit: '#cfe0e4',
    },
    sign: { fascia: 0.34, bracket: false, post: 2.3 },
  },
  {
    id: 'changing-block',
    form: 'block',
    wallHeight: 2.75,
    roof: 'shed',
    roofPitch: 12,
    eaves: 0.55,
    counters: 0,
    counterHeight: 0,
    awning: 0,
    menuBoard: 0,
    doors: 4,
    glazing: 0,
    rail: 0,
    apron: 2.8,
    plinth: 0.16,
    cladding: 'panel',
    flue: 0,
    dressing: false,
    palette: {
      wall: '#dfe6e4',
      trim: '#31555c',
      roof: '#3d5a60',
      awningA: '#31555c',
      awningB: '#31555c',
      metal: '#9fa6aa',
      sign: '#1d3a3f',
      signLit: '#d8eef0',
    },
    sign: { fascia: 0.32, bracket: false, post: 0 },
  },
  {
    id: 'shop-b',
    form: 'unit',
    wallHeight: 3.4,
    roof: 'gable',
    roofPitch: 30,
    eaves: 0.7,
    counters: 1,
    counterHeight: 1.02,
    awning: 1.2,
    menuBoard: 0,
    doors: 1,
    glazing: 0.62,
    rail: 0,
    apron: 3.4,
    plinth: 0.22,
    cladding: 'render',
    flue: 0,
    dressing: true,
    palette: {
      wall: '#e8ddc8',
      trim: '#3a4f6e',
      roof: '#6b4b3c',
      awningA: '#2f4a6b',
      awningB: '#e8ddc8',
      metal: '#8d9298',
      sign: '#233754',
      signLit: '#f2ead6',
    },
    sign: { fascia: 0.55, bracket: true, post: 0 },
  },
  {
    id: 'atm',
    form: 'machine',
    wallHeight: 1.75,
    roof: 'flat',
    roofPitch: 0,
    eaves: 0.34,
    counters: 1,
    counterHeight: 1.15,
    awning: 0,
    menuBoard: 0,
    doors: 0,
    glazing: 0,
    rail: 0,
    apron: 1.8,
    plinth: 0.12,
    cladding: 'panel',
    flue: 0,
    dressing: false,
    palette: {
      wall: '#4b5560',
      trim: '#2c343c',
      roof: '#2c343c',
      awningA: '#2c343c',
      awningB: '#2c343c',
      metal: '#a7adb2',
      sign: '#16324d',
      signLit: '#cfe4f5',
    },
    sign: { fascia: 0.24, bracket: false, post: 2.4 },
  },
];

/**
 * The style a shop gets when nothing names one: a form derived from its `kind`.
 *
 * A fallback that draws nothing would make a typo in `procedural` an invisible hole in the park,
 * and a fallback that throws would take the pack down. This draws a plausible building and logs
 * once, which is the same five-step contract `scenery` uses for a missing mesh.
 */
const FALLBACK_FORM: Record<string, string> = {
  food: 'kiosk-a',
  drink: 'kiosk-round',
  toilet: 'toilet-block',
  'changing-room': 'changing-block',
  'first-aid': 'kiosk-a',
  atm: 'atm',
  souvenir: 'shop-b',
  info: 'kiosk-round',
};

// ── Menus ───────────────────────────────────────────────────────────────────────────────────
/**
 * What the boards say and how the tills behave, per `kind`.
 *
 * Matched by `for` (see `ShopMenuDef`), so these are the coarsest possible entries and a pack can
 * override one shop without restating the rest. The item prices here are **relative to the shop's
 * own `price`**: the manifest price is what a guest pays for a visit, and a board that contradicts
 * it is a board nobody can trust, so `resolveMenu` rescales the list around the shop's price
 * rather than printing whatever is written here.
 */
export const SHOP_MENU_MANIFEST: readonly ShopMenuDef[] = [
  {
    id: 'food-default',
    for: 'kind:food',
    items: [
      { name: { en: 'Cheeseburger', de: 'Cheeseburger' }, price: 650 },
      { name: { en: 'Chips', de: 'Pommes' }, price: 380 },
      { name: { en: 'Hot dog', de: 'Hot Dog' }, price: 520 },
      { name: { en: 'Wrap', de: 'Wrap' }, price: 690 },
    ],
    stock: 420,
    restockUnits: 140,
    restockMinutes: 90,
    serviceMinutes: 0.9,
    unitCost: 220,
    queuePerCounter: 9,
    hours: [9 * 60 + 30, 22 * 60 + 30],
  },
  {
    id: 'drink-default',
    for: 'kind:drink',
    items: [
      { name: { en: 'Lemonade', de: 'Limonade' }, price: 300 },
      { name: { en: 'Coffee', de: 'Kaffee' }, price: 280 },
      { name: { en: 'Water', de: 'Wasser' }, price: 200 },
    ],
    stock: 520,
    restockUnits: 180,
    restockMinutes: 75,
    serviceMinutes: 0.55,
    unitCost: 70,
    queuePerCounter: 10,
    hours: [9 * 60, 22 * 60 + 45],
  },
  {
    id: 'toilet-default',
    for: 'kind:toilet',
    items: [],
    stock: 4000,
    restockUnits: 2000,
    restockMinutes: 240,
    serviceMinutes: 1.6,
    unitCost: 4,
    queuePerCounter: 14,
    hours: [8 * 60 + 45, 23 * 60],
  },
  {
    id: 'changing-default',
    for: 'kind:changing-room',
    items: [],
    stock: 4000,
    restockUnits: 2000,
    restockMinutes: 240,
    serviceMinutes: 4,
    unitCost: 2,
    queuePerCounter: 10,
    hours: [9 * 60, 21 * 60],
  },
  {
    id: 'first-aid-default',
    for: 'kind:first-aid',
    items: [],
    stock: 240,
    restockUnits: 120,
    restockMinutes: 180,
    serviceMinutes: 5,
    unitCost: 90,
    queuePerCounter: 5,
    hours: [9 * 60, 23 * 60],
  },
  {
    id: 'atm-default',
    for: 'kind:atm',
    items: [],
    stock: 100000,
    restockUnits: 100000,
    restockMinutes: 720,
    serviceMinutes: 0.8,
    unitCost: 0,
    queuePerCounter: 6,
    hours: [8 * 60, 23 * 60 + 30],
  },
  {
    id: 'souvenir-default',
    for: 'kind:souvenir',
    items: [
      { name: { en: 'Plush', de: 'Plüschtier' }, price: 1500 },
      { name: { en: 'T-shirt', de: 'T-Shirt' }, price: 2400 },
      { name: { en: 'Postcard', de: 'Postkarte' }, price: 180 },
      { name: { en: 'Cap', de: 'Cap' }, price: 1200 },
      { name: { en: 'Photo', de: 'Foto' }, price: 900 },
    ],
    stock: 300,
    restockUnits: 100,
    restockMinutes: 150,
    serviceMinutes: 1.7,
    unitCost: 520,
    queuePerCounter: 7,
    hours: [10 * 60, 22 * 60 + 30],
  },
  {
    id: 'info-default',
    for: 'kind:info',
    items: [],
    stock: 100000,
    restockUnits: 100000,
    restockMinutes: 720,
    serviceMinutes: 1.4,
    unitCost: 0,
    queuePerCounter: 6,
    hours: [9 * 60, 21 * 60],
  },
  {
    id: 'generic-default',
    for: '*',
    items: [],
    stock: 400,
    restockUnits: 160,
    restockMinutes: 120,
    serviceMinutes: 1,
    unitCost: 100,
    queuePerCounter: 8,
    hours: [9 * 60, 23 * 60],
  },
];

// ── The registries ──────────────────────────────────────────────────────────────────────────

const styles = new Map<string, ShopStyleDef>();
const menus: ShopMenuDef[] = [];

function num(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return value < min ? min : value > max ? max : value;
}

function str<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function hex(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

const FORMS = ['kiosk', 'round', 'block', 'unit', 'machine'] as const;
const ROOFS = ['hip', 'gable', 'cone', 'flat', 'shed'] as const;
const CLADDING = ['render', 'timber', 'panel', 'brick'] as const;

/**
 * Validate a style entry.
 *
 * Hand-written rather than zod, for the reason `paths/manifest.ts` gives about its own: this file
 * is read on the worker and in node's strip-only mode, and every field here has a sane default, so
 * the useful behaviour is "clamp and carry on" rather than "reject the pack". The one thing that
 * IS an error is a missing id, because a style nobody can name is a style nobody can use.
 */
export function parseShopStyle(input: unknown, base?: ShopStyleDef): ShopStyleDef {
  const raw = (input ?? {}) as Record<string, unknown>;
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  if (!id) throw new Error('a shop style needs an "id"');
  const d = base ?? SHOP_STYLE_MANIFEST[0];
  const p = (raw.palette ?? {}) as Record<string, unknown>;
  const s = (raw.sign ?? {}) as Record<string, unknown>;
  const strokes = Array.isArray(s.strokes)
    ? (s.strokes as unknown[])
        .filter((line): line is number[] => Array.isArray(line) && line.length >= 4)
        .map((line) => line.map((n) => num(n, 0, -4, 4)))
    : undefined;
  return {
    id,
    form: str(raw.form, FORMS, d.form),
    wallHeight: num(raw.wallHeight, d.wallHeight, 1.2, 12),
    roof: str(raw.roof, ROOFS, d.roof),
    roofPitch: num(raw.roofPitch, d.roofPitch, 0, 60),
    eaves: num(raw.eaves, d.eaves, 0, 2.5),
    counters: Math.round(num(raw.counters, d.counters, 0, 8)),
    counterHeight: num(raw.counterHeight, d.counterHeight, 0, 1.6),
    awning: num(raw.awning, d.awning, 0, 4),
    menuBoard: num(raw.menuBoard, d.menuBoard, 0, 1),
    doors: Math.round(num(raw.doors, d.doors, 0, 8)),
    glazing: num(raw.glazing, d.glazing, 0, 1),
    rail: num(raw.rail, d.rail, 0, 40),
    apron: num(raw.apron, d.apron, 0, 12),
    plinth: num(raw.plinth, d.plinth, 0, 1.2),
    cladding: str(raw.cladding, CLADDING, d.cladding),
    flue: num(raw.flue, d.flue, 0, 4),
    dressing: typeof raw.dressing === 'boolean' ? raw.dressing : d.dressing,
    palette: {
      wall: hex(p.wall, d.palette.wall),
      trim: hex(p.trim, d.palette.trim),
      roof: hex(p.roof, d.palette.roof),
      awningA: hex(p.awningA, d.palette.awningA),
      awningB: hex(p.awningB, d.palette.awningB),
      metal: hex(p.metal, d.palette.metal),
      sign: hex(p.sign, d.palette.sign),
      signLit: hex(p.signLit, d.palette.signLit),
    },
    sign: {
      fascia: num(s.fascia, d.sign.fascia, 0, 2),
      glyph: typeof s.glyph === 'string' ? s.glyph : d.sign.glyph,
      strokes: strokes ?? d.sign.strokes,
      bracket: typeof s.bracket === 'boolean' ? s.bracket : d.sign.bracket,
      post: num(s.post, d.sign.post, 0, 8),
    },
  };
}

export function parseShopMenu(input: unknown): ShopMenuDef {
  const raw = (input ?? {}) as Record<string, unknown>;
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  if (!id) throw new Error('a shop menu needs an "id"');
  const d = SHOP_MENU_MANIFEST[SHOP_MENU_MANIFEST.length - 1];
  const items = Array.isArray(raw.items)
    ? (raw.items as unknown[]).slice(0, 12).map((entry) => {
        const e = (entry ?? {}) as Record<string, unknown>;
        const name = (e.name ?? {}) as Localized;
        return {
          name: typeof name === 'object' && name ? name : { en: 'Item' },
          price: Math.round(num(e.price, 100, 0, 1_000_000)),
        };
      })
    : [];
  const hours = Array.isArray(raw.hours) && raw.hours.length === 2 ? (raw.hours as number[]) : null;
  return {
    id,
    for: typeof raw.for === 'string' && raw.for ? raw.for : '*',
    items,
    stock: Math.round(num(raw.stock, d.stock, 1, 1_000_000)),
    restockUnits: Math.round(num(raw.restockUnits, d.restockUnits, 1, 1_000_000)),
    restockMinutes: num(raw.restockMinutes, d.restockMinutes, 1, 10_000),
    serviceMinutes: num(raw.serviceMinutes, d.serviceMinutes, 0.05, 60),
    unitCost: Math.round(num(raw.unitCost, d.unitCost, 0, 1_000_000)),
    queuePerCounter: Math.round(num(raw.queuePerCounter, d.queuePerCounter, 1, 60)),
    hours: hours
      ? [num(hours[0], d.hours[0], 0, 1439), num(hours[1], d.hours[1], 1, 1440)]
      : [d.hours[0], d.hours[1]],
  };
}

export function registerShopStyle(entry: unknown): ShopStyleDef {
  const raw = (entry ?? {}) as { id?: unknown; extends?: unknown };
  const parent =
    typeof raw.extends === 'string'
      ? styles.get(raw.extends)
      : typeof raw.id === 'string'
        ? styles.get(raw.id)
        : undefined;
  const def = parseShopStyle(entry, parent);
  styles.set(def.id, def);
  return def;
}

export function registerShopMenu(entry: unknown): ShopMenuDef {
  const def = parseShopMenu(entry);
  const at = menus.findIndex((m) => m.id === def.id);
  if (at >= 0) menus[at] = def;
  else menus.push(def);
  return def;
}

export function shopStyle(id: string): ShopStyleDef | undefined {
  return styles.get(id);
}

export function shopStyles(): ShopStyleDef[] {
  return [...styles.values()];
}

export function shopMenus(): ShopMenuDef[] {
  return [...menus];
}

/** Reset to the built-ins. Used by the selftest; never by the game. */
export function resetShopContent(): void {
  styles.clear();
  menus.length = 0;
  for (const def of SHOP_STYLE_MANIFEST) styles.set(def.id, parseShopStyle(def));
  for (const def of SHOP_MENU_MANIFEST) menus.push(parseShopMenu(def));
}

resetShopContent();

// ── Resolution ──────────────────────────────────────────────────────────────────────────────

/** The subset of a `shopSchema` entry this module reads. Kept structural so nothing imports zod. */
export interface ShopItemLike {
  id: string;
  kind: string;
  name: Localized;
  need: string;
  needRelief: number;
  price: number;
  upkeep: number;
  footprint: [number, number];
  throughput: number;
  power: number;
  water: number;
  theme?: string;
  procedural?: string;
  mesh?: string;
  night?: { light?: unknown; signage?: string };
}

export interface ResolvedShop {
  key: string;
  pack: string;
  item: string;
  def: ShopItemLike;
  style: ShopStyleDef;
  menu: ShopMenuDef;
  /** Board lines, already rescaled around the shop's own price. */
  board: Array<{ name: Localized; price: number }>;
  /** True when the style came from `FALLBACK_FORM` rather than from a name the pack gave. */
  styleFallback: boolean;
}

/**
 * The style for a shop, and the reason it is that one.
 *
 * Order: an entity's own `style` override, then the pack's `procedural`, then a form derived from
 * `kind`, then the first built-in. Only the third counts as a fallback worth warning about — an
 * entity override and a named generator are both deliberate.
 */
export function styleForShop(
  def: Pick<ShopItemLike, 'kind' | 'procedural'>,
  override?: string
): { style: ShopStyleDef; fallback: boolean } {
  if (override) {
    const found = styles.get(override);
    if (found) return { style: found, fallback: false };
  }
  if (def.procedural) {
    const found = styles.get(def.procedural);
    if (found) return { style: found, fallback: false };
  }
  const byKind = styles.get(FALLBACK_FORM[def.kind] ?? 'kiosk-a');
  return { style: byKind ?? SHOP_STYLE_MANIFEST[0], fallback: true };
}

/**
 * The menu for a shop: the most specific `for` that matches.
 *
 * Specificity is `pack:item` (3) > `item` (2) > `kind:x` (1) > `*` (0), and ties go to the entry
 * registered later, so a pack loaded after `core-classic` can replace a menu without removing one.
 */
export function menuForShop(pack: string, item: string, kind: string): ShopMenuDef {
  let best: ShopMenuDef | null = null;
  let bestRank = -1;
  for (const menu of menus) {
    let rank = -1;
    if (menu.for === `${pack}:${item}`) rank = 3;
    else if (menu.for === item) rank = 2;
    else if (menu.for === `kind:${kind}`) rank = 1;
    else if (menu.for === '*') rank = 0;
    if (rank >= bestRank) {
      bestRank = rank;
      best = menu;
    }
  }
  return best ?? SHOP_MENU_MANIFEST[SHOP_MENU_MANIFEST.length - 1];
}

/**
 * The board a shop actually shows.
 *
 * The menu's prices are a shape, not a promise: the shop's own `price` is what a guest pays, so the
 * lines are rescaled to sit around it. A board reading 6.50 beside a till charging 1.90 is the kind
 * of detail that makes a frame stop being a photograph, and it costs one multiply to avoid.
 */
export function boardFor(
  menu: ShopMenuDef,
  price: number
): Array<{ name: Localized; price: number }> {
  if (!menu.items.length) return [];
  let mean = 0;
  for (const item of menu.items) mean += item.price;
  mean /= menu.items.length;
  const scale = mean > 0 && price > 0 ? price / mean : 1;
  return menu.items.map((item) => ({
    name: item.name,
    // Board prices land on a 10-cent step, which is what a printed board does.
    price: Math.max(10, Math.round((item.price * scale) / 10) * 10),
  }));
}

export function resolveShop(
  pack: string,
  item: string,
  def: ShopItemLike,
  override?: string
): ResolvedShop {
  const { style, fallback } = styleForShop(def, override);
  const menu = menuForShop(pack, item, def.kind);
  return {
    key: `${pack}:${item}`,
    pack,
    item,
    def,
    style,
    menu,
    board: boardFor(menu, def.price),
    styleFallback: fallback,
  };
}

/** The polylines for a shop's fascia pictogram, or an empty list. */
export function glyphFor(style: ShopStyleDef, kind: string): number[][] {
  if (style.sign.strokes?.length) return style.sign.strokes;
  const named = style.sign.glyph ? SHOP_GLYPHS[style.sign.glyph] : undefined;
  if (named) return named;
  return SHOP_GLYPHS[GLYPH_BY_KIND[kind] ?? 'info'] ?? [];
}

// ── Pack attachment ─────────────────────────────────────────────────────────────────────────

export interface ShopContentRegistry {
  registerPackCategory(category: string, owner: string): void;
  packs(): readonly unknown[];
  onPack(fn: (pack: unknown) => void): () => void;
}

/**
 * Claim `shopStyles` and `shopMenus`, and read them off every pack — the ones already registered
 * and the ones that arrive later.
 *
 * Both halves. `onPack` fires on registration and `host.ts` registers the bundled packs before any
 * module is built, so a listener alone would miss exactly the packs the game ships with. A bad
 * entry is named and skipped rather than thrown: one malformed style in a third-party pack must not
 * take the other five down with it.
 */
export function attachShopContent(registry: ShopContentRegistry): () => void {
  registry.registerPackCategory('shopStyles', 'shops');
  registry.registerPackCategory('shopMenus', 'shops');

  const read = (pack: unknown): void => {
    const manifest = pack as { id?: string; shopStyles?: unknown; shopMenus?: unknown };
    const each = (list: unknown, what: string, fn: (entry: unknown) => unknown): void => {
      if (!Array.isArray(list)) return;
      for (const entry of list) {
        try {
          fn(entry);
        } catch (error) {
          console.warn(`[game/shops] pack "${manifest.id}" has a bad ${what}`, error);
        }
      }
    };
    each(manifest.shopStyles, 'shop style', registerShopStyle);
    each(manifest.shopMenus, 'shop menu', registerShopMenu);
  };

  for (const pack of registry.packs()) read(pack);
  return registry.onPack(read);
}
