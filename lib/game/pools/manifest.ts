/**
 * Content, not code: every basin, tile, edge treatment and deck item comes out of a manifest.
 *
 * Two sources, one parser:
 *
 *  1. **A pack's `pools` key** — the category this module claims through
 *     `registry.registerPackCategory('pools', 'pools')`. Four arrays: `shapes`, `tiles`, `edges`
 *     and `deck`. A new lagoon, a new mosaic, a deck-level edge or a parasol is a JSON entry.
 *  2. **The built-in catalogue below**, which is the same JSON. It is not a fallback path and not a
 *     `switch`: `BUILTIN` is a manifest fragment run through `registerPools()`, the very function a
 *     pack goes through, so anything the built-ins can express a pack can express, and a pack that
 *     redefines `lagoon` overwrites it by id.
 *
 * **`registry.packs()` AND `onPack`, both.** `onPack` fires on registration and the bundled packs
 * are registered before any module's `main()` or `sim()` runs, so a listener alone would see
 * neither of them. Six modules on this branch have now fallen into that; this one is not the
 * seventh, and `selftest.mjs` asserts a pack registered BEFORE attach and one registered AFTER
 * both land.
 *
 * Nothing here switches on a pool id. It switches on an `outline` algorithm, a depth `profile`, a
 * tile `pattern`, a `coping` kind, a `deck` surface and a furniture `shape` — the same line
 * `rides` draws at its eleven shapes.
 *
 * Babylon-free and DOM-free: the worker reads this to price a pool's water and size its capacity.
 */

import { z } from 'zod';
import type { Registry } from '../core/registry';
import type {
  PoolDeckItemSpec,
  PoolEdgeSpec,
  PoolShapeSpec,
  PoolTileSpec,
} from './types';
import { hexToLinear, isStarShaped, outlinePoints } from './geom';

/** The top-level manifest key this module owns. */
export const POOL_CATEGORY = 'pools';
/** The pack id the built-in catalogue is registered under. */
export const BUILTIN_PACK = 'pools';

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const localized = z.record(z.string(), z.string());

const depthSchema = z.object({
  profile: z.enum(['flat', 'slope', 'dish', 'beach', 'channel']).default('slope'),
  min: z.number().min(0).default(1.2),
  max: z.number().min(0.05).default(2),
  axis: z.enum(['x', 'z']).default('z'),
  beach: z.number().min(0).max(0.9).default(0.3),
});

const shapeSchema = z.object({
  id: z.string(),
  name: localized.optional(),
  outline: z.enum(['rect', 'ellipse', 'stadium', 'lobed', 'polygon']).default('rect'),
  size: z.tuple([z.number().positive(), z.number().positive()]).default([16, 10]),
  corner: z.number().min(0).default(1.2),
  lobes: z.number().min(1).max(9).default(3),
  lobeDepth: z.number().min(0).max(0.45).default(0.16),
  lobePhase: z.number().default(0),
  points: z.array(z.number()).default([]),
  segments: z.number().int().min(12).max(256).default(72),
  depth: depthSchema.default({ profile: 'slope', min: 1.2, max: 2, axis: 'z', beach: 0.3 }),
  entry: z.enum(['none', 'corner-steps', 'roman-steps', 'beach', 'ladder']).default('corner-steps'),
  entryYaw: z.number().default(Math.PI),
  role: z.enum(['swim', 'lap', 'kids', 'spa', 'splashdown']).default('swim'),
  tile: z.string().default('white-ceramic'),
  edge: z.string().default('rolled-concrete'),
  deckDensity: z.number().min(0).max(20).default(3),
  water: z.number().min(0).default(6),
  cost: z.number().int().min(0).default(180000),
});

const tileSchema = z.object({
  id: z.string(),
  name: localized.optional(),
  pattern: z.enum(['mosaic', 'ceramic', 'slate', 'pebble', 'lanes']).default('ceramic'),
  tileMetres: z.number().positive().default(1),
  colors: z.array(color).min(1),
  grout: color.default('#d8d5cc'),
  waterline: color.default('#1e5f86'),
  lane: color.default('#1a1c20'),
  laneWidth: z.number().min(0).default(0.25),
  roughness: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]).default([0.14, 0.62]),
  relief: z.number().min(0).max(2).default(0.6),
  glaze: z.number().min(0).max(1).default(0.8),
  /** sRGB hex; converted to the linear tint the water body absorbs towards. */
  water: color.default('#0a5f7a'),
  /** The colour of this pool's underwater lamps. */
  night: color.default('#6fd4ef'),
  nightIntensity: z.number().min(0).max(40).default(6),
});

const edgeSchema = z.object({
  id: z.string(),
  name: localized.optional(),
  coping: z.enum(['rolled', 'square', 'deck-level', 'none']).default('rolled'),
  copingWidth: z.number().min(0).default(0.4),
  copingRise: z.number().min(0).default(0.05),
  copingColor: color.default('#cfc7b8'),
  deck: z.enum(['concrete', 'timber', 'stone', 'sand', 'none']).default('concrete'),
  deckWidth: z.number().min(0).default(3),
  deckColor: color.default('#b9b2a4'),
  rail: z.boolean().default(true),
  railColor: color.default('#c9d0d6'),
});

const deckItemSchema = z.object({
  id: z.string(),
  name: localized.optional(),
  shape: z.enum(['lounger', 'parasol', 'ring-post', 'ladder', 'towel-box', 'planter']),
  weight: z.number().min(0).default(1),
  clearance: z.number().min(0.4).default(2),
  colors: z.array(color).min(1),
  accent: color.default('#2f3a44'),
});

export const poolsCategorySchema = z.object({
  shapes: z.array(shapeSchema).default([]),
  tiles: z.array(tileSchema).default([]),
  edges: z.array(edgeSchema).default([]),
  deck: z.array(deckItemSchema).default([]),
});

// ── the catalogue ───────────────────────────────────────────────────────────────────────────
const shapes = new Map<string, PoolShapeSpec>();
const tiles = new Map<string, PoolTileSpec>();
const edges = new Map<string, PoolEdgeSpec>();
const deckItems = new Map<string, PoolDeckItemSpec>();
const warned = new Set<string>();

function warnOnce(key: string, message: string): void {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[game/pools] ${message}`);
}

/**
 * The built-in catalogue, written as the JSON a pack would carry.
 *
 * Six basins, five tile styles, four edge treatments and five deck items. The point of writing it
 * in the manifest's own shape rather than as TypeScript records is that it cannot drift from what
 * a pack is allowed to say: it goes through `poolsCategorySchema` at attach time like anything
 * else, and the selftest registers a synthetic pack against the same parser.
 *
 * The references are European public baths and hotel lagoons, and the numbers are theirs: a
 * competition lane is 2.5 m wide and 2.0 m deep, a hotel lagoon shelves from a zero-entry beach at
 * about 1:12, a whirlpool sits at 0.9 m so a seated adult is chest-deep, and a slide run-out lane
 * is 0.9-1.0 m — deep enough to take a rider and shallow enough to stand up in.
 */
const BUILTIN: unknown = {
  tiles: [
    {
      id: 'aqua-mosaic',
      name: { en: 'Aqua mosaic', de: 'Aqua-Mosaik' },
      pattern: 'mosaic',
      tileMetres: 0.6,
      colors: ['#3fa9c9', '#2f8fb5', '#57bcd4', '#2a7ba3', '#69cad9'],
      grout: '#e6e9e6',
      waterline: '#12496b',
      roughness: [0.1, 0.55],
      relief: 0.75,
      glaze: 0.95,
      water: '#0d6f92',
      night: '#71dcf2',
      nightIntensity: 7,
    },
    {
      id: 'white-ceramic',
      name: { en: 'White ceramic', de: 'Weiße Keramik' },
      pattern: 'ceramic',
      tileMetres: 0.9,
      colors: ['#eceae2', '#e3e0d6', '#f2f0e9'],
      grout: '#c6c2b6',
      waterline: '#2b6f9c',
      roughness: [0.12, 0.5],
      relief: 0.45,
      glaze: 0.9,
      water: '#0a6f95',
      night: '#8fe4f5',
      nightIntensity: 6,
    },
    {
      id: 'lane-competition',
      name: { en: 'Competition lanes', de: 'Wettkampfbahnen' },
      pattern: 'lanes',
      tileMetres: 2.5,
      colors: ['#eeece4', '#e5e2d8'],
      grout: '#c3bfb2',
      waterline: '#1b5f8c',
      lane: '#20242a',
      laneWidth: 0.25,
      roughness: [0.13, 0.5],
      relief: 0.4,
      glaze: 0.88,
      water: '#0a6b93',
      night: '#a8e8ff',
      nightIntensity: 5,
    },
    {
      id: 'slate-dark',
      name: { en: 'Dark slate', de: 'Dunkler Schiefer' },
      pattern: 'slate',
      tileMetres: 1.2,
      colors: ['#3b4750', '#33404a', '#455158', '#2c383f'],
      grout: '#262f35',
      waterline: '#1d2a31',
      roughness: [0.24, 0.7],
      relief: 0.9,
      glaze: 0.45,
      water: '#0d4d55',
      night: '#ffb877',
      nightIntensity: 8,
    },
    {
      id: 'sand-pebble',
      name: { en: 'Pebble render', de: 'Kieselputz' },
      pattern: 'pebble',
      tileMetres: 0.8,
      colors: ['#cbb9a0', '#bda88d', '#d6c7b0', '#b09b80'],
      grout: '#a8998a',
      waterline: '#8a7a63',
      roughness: [0.42, 0.78],
      relief: 1.1,
      glaze: 0.25,
      water: '#177f8c',
      night: '#7fe0d0',
      nightIntensity: 6,
    },
  ],
  edges: [
    {
      id: 'rolled-concrete',
      name: { en: 'Rolled concrete edge', de: 'Rundkante Beton' },
      coping: 'rolled',
      copingWidth: 0.42,
      copingRise: 0.05,
      copingColor: '#d3cbbc',
      deck: 'concrete',
      deckWidth: 3.2,
      deckColor: '#bfb8ab',
      rail: true,
      railColor: '#ccd3d9',
    },
    {
      id: 'deck-level-grate',
      name: { en: 'Deck-level channel', de: 'Überlaufrinne' },
      coping: 'deck-level',
      copingWidth: 0.34,
      copingRise: 0,
      copingColor: '#9aa2a6',
      deck: 'stone',
      deckWidth: 3.6,
      deckColor: '#a9a49b',
      rail: true,
      railColor: '#b9c1c8',
    },
    {
      id: 'timber-surround',
      name: { en: 'Timber surround', de: 'Holzumrandung' },
      coping: 'square',
      copingWidth: 0.3,
      copingRise: 0.04,
      copingColor: '#8a6a44',
      deck: 'timber',
      deckWidth: 3,
      deckColor: '#9b7749',
      rail: true,
      railColor: '#c7ced4',
    },
    {
      id: 'beach-sand',
      name: { en: 'Sand beach', de: 'Sandstrand' },
      coping: 'none',
      copingWidth: 0.18,
      copingRise: 0,
      copingColor: '#cdbb9c',
      deck: 'sand',
      deckWidth: 5,
      deckColor: '#d3c1a1',
      rail: false,
      railColor: '#c9d0d6',
    },
  ],
  deck: [
    {
      id: 'lounger',
      name: { en: 'Sun lounger', de: 'Sonnenliege' },
      shape: 'lounger',
      weight: 4,
      clearance: 2.3,
      colors: ['#e8e4d8', '#dfd6c2', '#cfd8dc'],
      accent: '#2f3a44',
    },
    {
      id: 'parasol',
      name: { en: 'Parasol', de: 'Sonnenschirm' },
      shape: 'parasol',
      weight: 2,
      clearance: 3.4,
      colors: ['#d9552f', '#e2b23c', '#3f8fae', '#e8e4d8'],
      accent: '#8a8f94',
    },
    {
      id: 'ring-post',
      name: { en: 'Lifebuoy post', de: 'Rettungsring' },
      shape: 'ring-post',
      weight: 0.5,
      clearance: 2,
      colors: ['#d63c2a'],
      accent: '#f0eee7',
    },
    {
      id: 'towel-box',
      name: { en: 'Towel box', de: 'Handtuchtruhe' },
      shape: 'towel-box',
      weight: 0.7,
      clearance: 2.2,
      colors: ['#9b7749', '#8a6a44'],
      accent: '#6a5233',
    },
    {
      id: 'planter',
      name: { en: 'Deck planter', de: 'Pflanzkübel' },
      shape: 'planter',
      weight: 1.2,
      clearance: 2.1,
      colors: ['#c9c2b4', '#b3ac9e'],
      accent: '#4e6b3a',
    },
  ],
  shapes: [
    {
      id: 'lagoon',
      name: { en: 'Lagoon', de: 'Lagune' },
      outline: 'lobed',
      size: [28, 18],
      lobes: 3,
      lobeDepth: 0.15,
      lobePhase: 0.6,
      segments: 96,
      depth: { profile: 'beach', min: 0.9, max: 1.7, axis: 'z', beach: 0.28 },
      entry: 'beach',
      entryYaw: -1.5707963267948966,
      role: 'swim',
      tile: 'aqua-mosaic',
      edge: 'rolled-concrete',
      deckDensity: 3.4,
      water: 14,
      cost: 42000000,
    },
    {
      id: 'lap-pool',
      name: { en: 'Lap pool', de: 'Sportbecken' },
      outline: 'rect',
      size: [12.5, 25],
      corner: 0.5,
      segments: 72,
      depth: { profile: 'slope', min: 1.35, max: 2, axis: 'z', beach: 0 },
      entry: 'ladder',
      entryYaw: 0,
      role: 'lap',
      tile: 'lane-competition',
      edge: 'deck-level-grate',
      deckDensity: 1.6,
      water: 11,
      cost: 38000000,
    },
    {
      id: 'kids-pool',
      name: { en: 'Paddling pool', de: 'Planschbecken' },
      outline: 'lobed',
      size: [13, 9.5],
      lobes: 2,
      lobeDepth: 0.12,
      lobePhase: 1.1,
      segments: 64,
      depth: { profile: 'dish', min: 0.18, max: 0.45, axis: 'z', beach: 0 },
      entry: 'beach',
      entryYaw: 3.141592653589793,
      role: 'kids',
      tile: 'aqua-mosaic',
      edge: 'rolled-concrete',
      deckDensity: 2.2,
      water: 4,
      cost: 14000000,
    },
    {
      id: 'whirlpool',
      name: { en: 'Whirlpool', de: 'Whirlpool' },
      outline: 'ellipse',
      size: [5, 5],
      segments: 40,
      depth: { profile: 'flat', min: 0.9, max: 0.9, axis: 'z', beach: 0 },
      entry: 'roman-steps',
      entryYaw: 1.5707963267948966,
      role: 'spa',
      tile: 'slate-dark',
      edge: 'timber-surround',
      deckDensity: 1.2,
      water: 3,
      cost: 9000000,
    },
    {
      id: 'plunge',
      name: { en: 'Plunge pool', de: 'Tauchbecken' },
      outline: 'stadium',
      size: [9, 9],
      segments: 56,
      depth: { profile: 'flat', min: 1.4, max: 1.4, axis: 'z', beach: 0 },
      entry: 'corner-steps',
      entryYaw: 3.141592653589793,
      role: 'swim',
      tile: 'white-ceramic',
      edge: 'timber-surround',
      deckDensity: 1.8,
      water: 5,
      cost: 12000000,
    },
    {
      id: 'runout-lane',
      name: { en: 'Slide run-out', de: 'Auslaufbecken' },
      outline: 'rect',
      size: [8, 18],
      corner: 0.6,
      segments: 64,
      depth: { profile: 'channel', min: 0.55, max: 1, axis: 'z', beach: 0 },
      entry: 'corner-steps',
      entryYaw: 0,
      role: 'splashdown',
      tile: 'white-ceramic',
      edge: 'deck-level-grate',
      deckDensity: 0.6,
      water: 9,
      cost: 11000000,
    },
  ],
};

/** Register one manifest fragment. Later entries with the same id win, by design. */
export function registerPools(packId: string, input: unknown): number {
  const parsed = poolsCategorySchema.safeParse(input);
  if (!parsed.success) {
    warnOnce(
      `pack:${packId}`,
      `pack "${packId}" has a "pools" key this build cannot read: ${parsed.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')}`
    );
    return 0;
  }
  let count = 0;
  for (const def of parsed.data.tiles) {
    tiles.set(def.id, {
      key: `${packId}:${def.id}`,
      id: def.id,
      name: def.name ?? { en: def.id },
      pattern: def.pattern,
      tileMetres: def.tileMetres,
      colors: def.colors,
      grout: def.grout,
      waterline: def.waterline,
      lane: def.lane,
      laneWidth: def.laneWidth,
      roughness: def.roughness,
      relief: def.relief,
      glaze: def.glaze,
      waterTint: hexToLinear(def.water),
      nightTint: hexToLinear(def.night),
      nightIntensity: def.nightIntensity,
    });
    count++;
  }
  for (const def of parsed.data.edges) {
    edges.set(def.id, { key: `${packId}:${def.id}`, ...def, name: def.name ?? { en: def.id } });
    count++;
  }
  for (const def of parsed.data.deck) {
    deckItems.set(def.id, { key: `${packId}:${def.id}`, ...def, name: def.name ?? { en: def.id } });
    count++;
  }
  for (const def of parsed.data.shapes) {
    const spec: PoolShapeSpec = {
      key: `${packId}:${def.id}`,
      id: def.id,
      name: def.name ?? { en: def.id },
      outline: def.outline,
      size: def.size,
      corner: def.corner,
      lobes: def.lobes,
      lobeDepth: def.lobeDepth,
      lobePhase: def.lobePhase,
      points: def.points,
      segments: def.segments,
      depth: def.depth,
      entry: def.entry,
      entryYaw: def.entryYaw,
      role: def.role,
      tile: def.tile,
      edge: def.edge,
      deckDensity: def.deckDensity,
      water: def.water,
      cost: def.cost,
    };
    // The polar grid needs a star-shaped plan (see geom.ts). A generated outline always is; an
    // explicit `polygon` from a pack is the one that can arrive folded, and the honest answer is
    // to say so by name rather than to draw it inside out.
    if (def.outline === 'polygon' && !isStarShaped(outlinePoints(spec, spec.size))) {
      warnOnce(
        `star:${spec.key}`,
        `pool shape "${spec.key}" is not star-shaped about its centre; the basin will be drawn ` +
          `from its convex sweep. Split it into two pools, or move the centre inside it.`
      );
    }
    shapes.set(def.id, spec);
    count++;
  }
  return count;
}

let builtinsDone = false;

/**
 * Claim the `pools` key, load the built-ins, read every pack already registered, and subscribe.
 *
 * Both halves of the module call it: a showcase may create the main handle without the sim, a
 * soak run creates the sim without the main, and re-registering an id is a map write.
 */
export function attachPoolContent(registry: Registry): () => void {
  try {
    registry.registerPackCategory(POOL_CATEGORY, 'pools');
  } catch (error) {
    warnOnce('category', `could not claim "${POOL_CATEGORY}": ${String(error)}`);
  }
  if (!builtinsDone) {
    builtinsDone = true;
    registerPools(BUILTIN_PACK, BUILTIN);
  }
  const read = (pack: { id: string } & Record<string, unknown>): void => {
    const block = pack[POOL_CATEGORY];
    if (block) registerPools(pack.id, block);
  };
  for (const pack of registry.packs()) read(pack as { id: string } & Record<string, unknown>);
  return registry.onPack((pack) => read(pack as unknown as { id: string } & Record<string, unknown>));
}

/** Every registered basin, in registration order. A build bar reads this, not a literal. */
export const poolShapes = (): PoolShapeSpec[] => [...shapes.values()];
export const poolTiles = (): PoolTileSpec[] => [...tiles.values()];
export const poolEdges = (): PoolEdgeSpec[] => [...edges.values()];
export const poolDeckItems = (): PoolDeckItemSpec[] => [...deckItems.values()];

/** Resolve by id or by `pack:id`; an unknown id falls back to the first registered entry. */
function lookup<T>(map: Map<string, T>, id: string | undefined, what: string): T | undefined {
  if (id) {
    const direct = map.get(id);
    if (direct) return direct;
    const colon = id.indexOf(':');
    if (colon >= 0) {
      const bare = map.get(id.slice(colon + 1));
      if (bare) return bare;
    }
    warnOnce(`${what}:${id}`, `no ${what} "${id}" is registered — using the first one instead`);
  }
  return map.values().next().value;
}

export const poolShape = (id?: string): PoolShapeSpec | undefined => lookup(shapes, id, 'pool shape');
export const poolTile = (id?: string): PoolTileSpec | undefined => lookup(tiles, id, 'tile style');
export const poolEdge = (id?: string): PoolEdgeSpec | undefined => lookup(edges, id, 'edge treatment');

/** Test seam: drop everything so a selftest can assert registration order from scratch. */
export function resetPoolContent(): void {
  shapes.clear();
  tiles.clear();
  edges.clear();
  deckItems.clear();
  warned.clear();
  builtinsDone = false;
}
