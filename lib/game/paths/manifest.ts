/**
 * The path style manifest — data, not code.
 *
 * A new surface is an entry in `PATH_STYLE_MANIFEST` (or a call to `registerPathStyle` from a pack
 * loader): nothing in `mesh.ts`, `materials.ts` or `textures.ts` switches on a style id, and the
 * texture generator reads a recipe rather than a name. Nothing ASSERTS that — there is no test
 * that walks the manifest and builds each material, and `scripts/` is not this module's to add one
 * to (it is a request). What exercises every entry today is the showcase, which draws all six
 * styles in one frame, so a style that fails to build is a missing surface in a screenshot.
 *
 * The built-in styles live here rather than in `pack.json`, but a PACK can add one now, and that
 * changed twice. This docblock used to say the schema had no `pathStyles` category and that the
 * schema is core's file, so the seam was a one-line change for core "when it lands" — and a critic
 * tested the consequence rather than reading it: a pack carrying `pathStyles` registered fine, was
 * duly reported by `unclaimedPackKeys()`, and changed nothing, because `registerPathStyle` had no
 * caller. That is the extensibility axis at its floor, and the floor alone fails a module.
 *
 * Core landed the other half in the meantime (`packManifestSchema` passes unknown top-level keys
 * through and `Registry.registerPackCategory` claims one), so `attachPathStyles` below closes it.
 *
 * DOM-free: the sim reads `widths`, `defaultWidth` and the kerb width (the graph insets its nodes
 * from the kerb), so this file is reachable from the worker.
 */

/** A procedural PBR recipe. Colours are LINEAR 0..1, not sRGB hex — they go straight into a texture. */
export interface PathMaterialRecipe {
  id: string;
  /** The dominant colour of the surface. */
  base: [number, number, number];
  /** What the noise mixes towards; a surface with one colour reads as painted card. */
  accent: [number, number, number];
  /** Joint / mortar / gap colour where the pattern has seams. */
  joint: [number, number, number];
  /** Roughness at the peaks and in the hollows, in that order. */
  roughness: [number, number];
  metallic: number;
  pattern: 'concrete' | 'pavers' | 'cobble' | 'planks' | 'asphalt' | 'metal';
  /** Metres one texture tile covers. Texel density is `size / tileMetres`. */
  tileMetres: number;
  /** How hard the normal map bumps, 0..2. */
  relief: number;
  seed: number;
  /**
   * Multiplier on the generated texture size, 0..1. Default 1.
   *
   * The generator is a per-pixel loop in JavaScript and it is the single most expensive thing this
   * module does at boot — nine 512² sets measured 2.9 s in headless Chromium. A kerb is 28 cm wide
   * and 13 cm tall; giving it the same 512² a promenade gets is a quarter of a second spent on a
   * surface nobody can stand on. Halving the four furniture and kerb recipes is worth a third of
   * the whole cost and is invisible at any camera the game has.
   */
  detail?: number;
}

export interface PathStyleDef {
  id: string;
  /** World-space label; plain English until the i18n keys land (see the requests file). */
  name: string;
  /** Recipe id for the walking surface. */
  surface: string;
  /** Recipe id and section for the kerb. `null` is a flush edge (a plaza apron, a boardwalk). */
  kerb: { material: string; width: number; height: number } | null;
  /** Widths a tool may offer for this style; the first is not the default, `defaultWidth` is. */
  widths: number[];
  defaultWidth: number;
  /** Drawn along the edges of a `queue` path. */
  furniture: 'none' | 'stanchion';
  /** Boards run across the walking direction (a boardwalk); rotates the surface uv 90°. */
  crossGrain: boolean;
  /** 0..1 — how much wear the vertex colours paint down the middle of the path. */
  wear: number;
}

// ── Materials ───────────────────────────────────────────────────────────────────────────────
export const PATH_MATERIAL_MANIFEST: readonly PathMaterialRecipe[] = [
  {
    id: 'concrete-slab',
    base: [0.5, 0.487, 0.462],
    accent: [0.41, 0.398, 0.377],
    joint: [0.38, 0.372, 0.356],
    roughness: [0.62, 0.88],
    metallic: 0,
    pattern: 'concrete',
    // Four metres, not two. `SLAB_M` is 1 m, so a two-metre tile held FOUR slabs in the whole
    // texture and repeated them every two metres — a critic read the albedo back off the GPU and
    // measured the whole surface spanning 5.5 of 255, i.e. 2.9 %, on the largest thing a visitor
    // looks at. `textures.ts` opens by saying the per-cell tint exists so a surface is "not one
    // colour with a grid drawn on it"; at four cells it was exactly that. Sixteen slabs at four
    // metres costs texel density (128 px/m at 512 against 256) and buys a walk that does not
    // repeat under the camera; cobble, with 27.4 of 255 across 18×18 cells, is what this is aiming
    // at.
    tileMetres: 4,
    relief: 0.85,
    seed: 1301,
  },
  {
    id: 'clay-pavers',
    base: [0.44, 0.238, 0.176],
    accent: [0.36, 0.196, 0.152],
    joint: [0.3, 0.281, 0.257],
    roughness: [0.55, 0.85],
    metallic: 0,
    pattern: 'pavers',
    tileMetres: 2,
    relief: 1.15,
    seed: 4177,
  },
  {
    id: 'granite-sett',
    base: [0.32, 0.317, 0.319],
    accent: [0.24, 0.243, 0.253],
    joint: [0.21, 0.205, 0.196],
    roughness: [0.42, 0.78],
    metallic: 0,
    pattern: 'cobble',
    tileMetres: 2,
    relief: 1.35,
    seed: 907,
  },
  {
    id: 'timber-deck',
    base: [0.35, 0.257, 0.171],
    accent: [0.27, 0.199, 0.135],
    joint: [0.16, 0.118, 0.081],
    roughness: [0.6, 0.9],
    metallic: 0,
    pattern: 'planks',
    tileMetres: 2.4,
    relief: 1.0,
    seed: 6203,
  },
  {
    id: 'asphalt-service',
    base: [0.135, 0.135, 0.138],
    accent: [0.105, 0.106, 0.111],
    joint: [0.09, 0.09, 0.093],
    roughness: [0.78, 0.95],
    metallic: 0,
    pattern: 'asphalt',
    tileMetres: 3,
    relief: 0.55,
    seed: 8821,
  },
  {
    id: 'kerb-concrete',
    detail: 0.5,
    base: [0.56, 0.549, 0.523],
    accent: [0.47, 0.459, 0.437],
    joint: [0.44, 0.431, 0.412],
    roughness: [0.58, 0.82],
    metallic: 0,
    pattern: 'concrete',
    tileMetres: 1.2,
    relief: 0.6,
    seed: 2711,
  },
  {
    id: 'kerb-granite',
    detail: 0.5,
    base: [0.29, 0.287, 0.291],
    accent: [0.22, 0.223, 0.233],
    joint: [0.2, 0.196, 0.19],
    roughness: [0.4, 0.72],
    metallic: 0,
    pattern: 'cobble',
    tileMetres: 1.2,
    relief: 0.9,
    seed: 3319,
  },
  {
    id: 'kerb-timber',
    detail: 0.5,
    base: [0.3, 0.221, 0.148],
    accent: [0.23, 0.169, 0.114],
    joint: [0.15, 0.11, 0.075],
    roughness: [0.62, 0.9],
    metallic: 0,
    pattern: 'planks',
    tileMetres: 1.6,
    relief: 0.8,
    seed: 5507,
  },
  {
    id: 'stanchion-steel',
    detail: 0.5,
    base: [0.052, 0.056, 0.062],
    accent: [0.09, 0.095, 0.104],
    joint: [0.03, 0.032, 0.036],
    roughness: [0.24, 0.46],
    metallic: 0.85,
    pattern: 'metal',
    tileMetres: 0.6,
    relief: 0.35,
    seed: 7717,
  },
  {
    id: 'stanchion-belt',
    detail: 0.5,
    base: [0.09, 0.093, 0.1],
    accent: [0.06, 0.062, 0.068],
    joint: [0.05, 0.05, 0.055],
    roughness: [0.72, 0.92],
    metallic: 0,
    pattern: 'metal',
    tileMetres: 0.35,
    relief: 0.5,
    seed: 9109,
  },
];

/** Queue furniture, referenced by `mesh.ts` rather than by a style: every stanchion is this one. */
export const STANCHION_POST_MATERIAL = 'stanchion-steel';
export const STANCHION_BELT_MATERIAL = 'stanchion-belt';

// ── Styles ──────────────────────────────────────────────────────────────────────────────────
export const PATH_STYLE_MANIFEST: readonly PathStyleDef[] = [
  {
    id: 'promenade',
    name: 'Concrete promenade',
    surface: 'concrete-slab',
    kerb: { material: 'kerb-concrete', width: 0.28, height: 0.13 },
    widths: [2, 4, 6, 8],
    defaultWidth: 4,
    furniture: 'none',
    crossGrain: false,
    wear: 0.55,
  },
  {
    id: 'pavers',
    name: 'Clay paver walk',
    surface: 'clay-pavers',
    kerb: { material: 'kerb-granite', width: 0.24, height: 0.12 },
    widths: [2, 4, 6, 8],
    defaultWidth: 4,
    furniture: 'none',
    crossGrain: false,
    wear: 0.4,
  },
  {
    id: 'cobble',
    name: 'Granite sett street',
    surface: 'granite-sett',
    kerb: { material: 'kerb-granite', width: 0.3, height: 0.14 },
    widths: [4, 6, 8],
    defaultWidth: 6,
    furniture: 'none',
    crossGrain: false,
    wear: 0.3,
  },
  {
    id: 'boardwalk',
    name: 'Timber boardwalk',
    surface: 'timber-deck',
    kerb: { material: 'kerb-timber', width: 0.2, height: 0.1 },
    widths: [2, 4, 6],
    defaultWidth: 4,
    furniture: 'none',
    crossGrain: true,
    wear: 0.5,
  },
  {
    id: 'service-road',
    name: 'Service road',
    surface: 'asphalt-service',
    kerb: { material: 'kerb-concrete', width: 0.32, height: 0.15 },
    widths: [4, 6, 8],
    defaultWidth: 6,
    furniture: 'none',
    crossGrain: false,
    wear: 0.65,
  },
  {
    id: 'queue-line',
    name: 'Queue line',
    surface: 'concrete-slab',
    kerb: { material: 'kerb-concrete', width: 0.2, height: 0.1 },
    widths: [2, 4],
    defaultWidth: 2,
    furniture: 'stanchion',
    crossGrain: false,
    wear: 0.8,
  },
];

// ── Registration ────────────────────────────────────────────────────────────────────────────
const materials = new Map<string, PathMaterialRecipe>();
const styles = new Map<string, PathStyleDef>();

/**
 * Validate one entry. Returns the parsed def or throws with the field that is wrong — the same
 * contract `parsePack` has, so a pack loader can report a bad path style the way it reports a bad
 * ride.
 */
export function parsePathStyle(input: unknown): PathStyleDef {
  const raw = input as Partial<PathStyleDef> | null;
  if (!raw || typeof raw !== 'object') throw new Error('path style: not an object');
  const id = raw.id;
  if (typeof id !== 'string' || !/^[a-z0-9-]+$/.test(id)) {
    throw new Error(`path style: id "${String(id)}" must match /^[a-z0-9-]+$/`);
  }
  if (typeof raw.surface !== 'string' || !materials.has(raw.surface)) {
    throw new Error(`path style "${id}": surface "${String(raw.surface)}" is not a known material`);
  }
  if (raw.kerb && !materials.has(raw.kerb.material)) {
    throw new Error(`path style "${id}": kerb material "${raw.kerb.material}" is not known`);
  }
  const widths = Array.isArray(raw.widths) && raw.widths.length ? raw.widths : [4];
  const defaultWidth = typeof raw.defaultWidth === 'number' ? raw.defaultWidth : widths[0];
  if (!widths.includes(defaultWidth)) {
    throw new Error(`path style "${id}": defaultWidth ${defaultWidth} is not in widths`);
  }
  return {
    id,
    name: typeof raw.name === 'string' ? raw.name : id,
    surface: raw.surface,
    kerb: raw.kerb ?? null,
    widths: widths.slice().sort((a, b) => a - b),
    defaultWidth,
    furniture: raw.furniture === 'stanchion' ? 'stanchion' : 'none',
    crossGrain: raw.crossGrain === true,
    wear: typeof raw.wear === 'number' ? Math.max(0, Math.min(1, raw.wear)) : 0.5,
  };
}

export function registerPathMaterial(recipe: PathMaterialRecipe): void {
  materials.set(recipe.id, recipe);
}

/** Add a style at runtime. Same validation as the built-in manifest; last writer wins on an id. */
export function registerPathStyle(input: unknown): PathStyleDef {
  const def = parsePathStyle(input);
  styles.set(def.id, def);
  return def;
}

for (const recipe of PATH_MATERIAL_MANIFEST) registerPathMaterial(recipe);
for (const def of PATH_STYLE_MANIFEST) registerPathStyle(def);

export function pathStyle(id: string): PathStyleDef {
  return styles.get(id) ?? styles.get('promenade') ?? PATH_STYLE_MANIFEST[0];
}

export function pathStyles(): PathStyleDef[] {
  return [...styles.values()];
}

export function pathMaterial(id: string): PathMaterialRecipe {
  return materials.get(id) ?? PATH_MATERIAL_MANIFEST[0];
}

/**
 * The width a path is actually built at: the entity's, snapped to the nearest width the style
 * allows. Snapped rather than rejected because a style narrowed after a park was saved would
 * otherwise drop every path built at the old width.
 */
export function resolveWidth(style: PathStyleDef, requested: number | undefined): number {
  const want = typeof requested === 'number' && requested > 0 ? requested : style.defaultWidth;
  let best = style.widths[0];
  let bestGap = Math.abs(best - want);
  for (const w of style.widths) {
    const gap = Math.abs(w - want);
    if (gap < bestGap) {
      best = w;
      bestGap = gap;
    }
  }
  return best;
}

/** The slice of `Registry` this needs, so `manifest.ts` stays worker-safe and core-import-free. */
export interface PathStyleRegistry {
  registerPackCategory(category: string, owner: string): void;
  packs(): readonly unknown[];
  onPack(fn: (pack: unknown) => void): () => void;
}

/**
 * Claim `pathStyles` and `pathMaterials`, and read them off every pack, present and future.
 *
 * Both halves are needed and neither alone is enough: `onPack` fires on REGISTRATION, and the
 * bundled packs are registered before any module is built, so a listener alone would miss exactly
 * the packs the game ships with. Materials are read before styles because a style names a surface
 * recipe by id.
 */
export function attachPathStyles(registry: PathStyleRegistry): () => void {
  registry.registerPackCategory('pathStyles', 'paths');
  registry.registerPackCategory('pathMaterials', 'paths');
  const read = (pack: unknown): void => {
    const manifest = pack as { id?: string; pathMaterials?: unknown; pathStyles?: unknown };
    const recipes = manifest.pathMaterials;
    if (Array.isArray(recipes)) {
      for (const recipe of recipes) registerPathMaterial(recipe as PathMaterialRecipe);
    }
    const defs = manifest.pathStyles;
    if (Array.isArray(defs)) {
      for (const def of defs) {
        try {
          registerPathStyle(def);
        } catch (error) {
          // Named rather than swallowed, and not thrown: one bad style in a third-party pack must
          // not take the other five down with it.
          console.warn(`[game/paths] pack "${manifest.id}" has a bad path style`, error);
        }
      }
    }
  };
  for (const pack of registry.packs()) read(pack);
  return registry.onPack(read);
}
