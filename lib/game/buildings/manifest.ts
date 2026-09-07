/**
 * Content, not code: every building this module draws comes out of a manifest.
 *
 * Three categories, in this priority:
 *
 *  1. **A pack's `buildingBlueprints`** — the category this module claims through
 *     `registry.registerPackCategory('buildingBlueprints', 'buildings')`. A blueprint is the whole
 *     description of a building: masses, storeys, bay patterns, roofs, trim, arcades, ground works.
 *     A pack that ships one gets a building nothing in TypeScript anticipated.
 *  2. **A pack's `buildingStyles`** — what it is made of and what colour it is painted, separately,
 *     so a theme pack can restyle a blueprint without redrawing it.
 *  3. **A pack's core `buildings`** — the category `pack-schema.ts` already had, which both bundled
 *     packs use and neither of which is this module's to edit. Its entries are kit PIECES (`wall`,
 *     `roof`, `window`, `door`, `floor`, `trim`, `column`) plus the `blueprint` category, and their
 *     `procedural` name resolves either to a generator in `build.ts`'s `PIECES` table or to a
 *     blueprint by id.
 *
 * **A kit piece that names only a `material` still gets a real style.** `core-classic` writes
 * `"material": "brick-red"` and `"theme": …`, so `styleFor` builds a style out of the registered
 * material's `procedural` name and base colour and the theme's palette. That is why the seven kit
 * pieces those packs already ship render as brick, plaster, slate and dark timber with no pack edit
 * and no entry in this file naming any of them.
 *
 * **`registry.packs()` AND `onPack`, both.** `onPack` fires on registration and the bundled packs
 * are registered before any module's `main()` runs, so a listener alone sees neither of them. Six
 * modules on this branch have now fallen into that; this one reads the list first and then follows.
 *
 * Nothing here switches on a pack id or an item id. Babylon-free and DOM-free: the worker can import
 * it to size a footprint.
 */

import { z } from 'zod';
import type { Registry } from '../core/registry';
import type { BuildingDef, MaterialDef, PackManifest } from '../core/pack-schema';
import type {
  BlueprintDef,
  BuildingEntityData,
  BuildingStyleDef,
  ResolvedBuilding,
  SurfaceName,
} from './types';

export const STYLE_CATEGORY = 'buildingStyles';
export const BLUEPRINT_CATEGORY = 'buildingBlueprints';

// ── schema ──────────────────────────────────────────────────────────────────────────────────

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const localized = z.record(z.string(), z.string());
const vec2 = z.tuple([z.number(), z.number()]);
const vec3 = z.tuple([z.number(), z.number(), z.number()]);

const paletteSchema = z.object({
  wall: hex,
  wallUpper: hex.optional(),
  plinth: hex,
  roof: hex,
  trim: hex,
  joinery: hex,
  metal: hex,
  glass: hex,
  lit: hex,
  sign: hex,
});

const trimSchema = z.object({
  cornice: z.number().nonnegative().default(0.34),
  stringCourse: z.number().nonnegative().default(0.2),
  quoins: z.boolean().default(false),
  reveal: z.number().min(0).max(0.6).default(0.16),
  sill: z.number().min(0).max(0.4).default(0.09),
  corniceOut: z.number().min(0).max(1.2).default(0.26),
});

const styleSchema = z.object({
  id: z.string(),
  name: localized.optional(),
  wall: z.string(),
  wallUpper: z.string().optional(),
  plinth: z.string(),
  roof: z.string(),
  palette: paletteSchema,
  // Every field of `trimSchema` has a default, but zod's `.default()` still wants a whole object
  // rather than a partial one, so the trim block is optional and filled in below instead.
  trim: trimSchema.optional(),
  glazing: z
    .object({ mullions: z.number().int().positive(), transoms: z.number().int().positive() })
    .default({ mullions: 2, transoms: 2 }),
});

const roofSchema = z.object({
  form: z.enum(['gable', 'hip', 'pyramid', 'flat', 'mansard', 'shed', 'cone', 'barrel']),
  pitch: z.number().optional(),
  eaves: z.number().optional(),
  ridge: z.enum(['x', 'z']).optional(),
  parapet: z.number().optional(),
  dormers: z.number().optional(),
  chimneys: z.number().optional(),
  lantern: z
    .object({
      height: z.number().positive(),
      radius: z.number().positive(),
      sides: z.number().int().min(4),
      roof: z.enum(['cone', 'pyramid']).optional(),
      glazed: z.boolean().optional(),
    })
    .optional(),
  material: z.string().optional(),
  color: hex.optional(),
});

const massSchema = z.object({
  id: z.string().optional(),
  at: vec2.optional(),
  size: vec2,
  yaw: z.number().optional(),
  storeys: z.number().int().positive().optional(),
  storeyHeight: z.number().positive().optional(),
  base: z.number().optional(),
  plinth: z.number().nonnegative().optional(),
  bay: z.number().positive().optional(),
  facades: z
    .object({
      all: z.string().optional(),
      front: z.string().optional(),
      right: z.string().optional(),
      back: z.string().optional(),
      left: z.string().optional(),
    })
    .optional(),
  roof: roofSchema.optional(),
  trim: trimSchema.partial().optional(),
  arcade: z
    .object({
      side: z.enum(['front', 'right', 'back', 'left']),
      depth: z.number().positive(),
      columns: z.number().int().min(2),
      arch: z.boolean().optional(),
      height: z.number().positive().optional(),
    })
    .optional(),
  round: z.number().int().min(3).optional(),
  wallColor: hex.optional(),
  roofColor: hex.optional(),
  wallSurface: z.string().optional(),
  roofSurface: z.string().optional(),
  clock: z.number().nonnegative().optional(),
});

const blueprintSchema = z.object({
  id: z.string(),
  name: localized.optional(),
  style: z.string(),
  masses: z.array(massSchema).min(1),
  ground: z
    .object({
      apron: z.number().nonnegative().optional(),
      steps: z.boolean().optional(),
      kerb: z.boolean().optional(),
    })
    .optional(),
  night: z
    .object({
      litFraction: z.number().min(0).max(1).optional(),
      lanterns: z.boolean().optional(),
      spill: z.number().int().nonnegative().optional(),
    })
    .optional(),
  sign: z
    .object({
      band: z.number().nonnegative(),
      side: z.enum(['front', 'right', 'back', 'left']).optional(),
      width: z.number().positive().optional(),
      color: hex.optional(),
    })
    .optional(),
  size: vec3.optional(),
});

// ── registered content ──────────────────────────────────────────────────────────────────────

const styles = new Map<string, BuildingStyleDef>();
const blueprints = new Map<string, BlueprintDef>();
const warned = new Set<string>();

function warnOnce(key: string, message: string): void {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[game/buildings] ${message}`);
}

/** Test seam: the selftest registers packs repeatedly and needs a clean slate between cases. */
export function resetBuildingContent(): void {
  styles.clear();
  blueprints.clear();
  warned.clear();
}

function readPack(pack: PackManifest): void {
  const raw = pack as unknown as Record<string, unknown>;
  const styleList = Array.isArray(raw[STYLE_CATEGORY]) ? (raw[STYLE_CATEGORY] as unknown[]) : [];
  for (const entry of styleList) {
    const parsed = styleSchema.safeParse(entry);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      warnOnce(
        `style:${pack.id}:${issue.path.join('.')}`,
        `pack "${pack.id}" ${STYLE_CATEGORY}.${issue.path.join('.')}: ${issue.message}`
      );
      continue;
    }
    const def = {
      ...parsed.data,
      trim: { ...DEFAULT_STYLE.trim, ...(parsed.data.trim ?? {}) },
    } as BuildingStyleDef;
    styles.set(`${pack.id}:${def.id}`, def);
    if (!styles.has(def.id)) styles.set(def.id, def);
  }
  const bpList = Array.isArray(raw[BLUEPRINT_CATEGORY])
    ? (raw[BLUEPRINT_CATEGORY] as unknown[])
    : [];
  for (const entry of bpList) {
    const parsed = blueprintSchema.safeParse(entry);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      warnOnce(
        `blueprint:${pack.id}:${issue.path.join('.')}`,
        `pack "${pack.id}" ${BLUEPRINT_CATEGORY}.${issue.path.join('.')}: ${issue.message}`
      );
      continue;
    }
    const def = parsed.data as BlueprintDef;
    blueprints.set(`${pack.id}:${def.id}`, def);
    if (!blueprints.has(def.id)) blueprints.set(def.id, def);
  }
}

/** Claim the categories and read them off every pack, at boot and afterwards. */
export function attachBuildingContent(registry: Registry): () => void {
  for (const category of ['buildings', STYLE_CATEGORY, BLUEPRINT_CATEGORY]) {
    try {
      registry.registerPackCategory(category, 'buildings');
    } catch (error) {
      warnOnce(`category:${category}`, `could not claim "${category}": ${String(error)}`);
    }
  }
  for (const pack of registry.packs()) readPack(pack);
  return registry.onPack((pack) => readPack(pack));
}

export function buildingStyles(): BuildingStyleDef[] {
  const seen = new Set<string>();
  const out: BuildingStyleDef[] = [];
  for (const [key, def] of styles) {
    if (!key.includes(':')) continue;
    if (seen.has(def.id)) continue;
    seen.add(def.id);
    out.push(def);
  }
  return out;
}

export function buildingBlueprints(): BlueprintDef[] {
  const seen = new Set<string>();
  const out: BlueprintDef[] = [];
  for (const [key, def] of blueprints) {
    if (!key.includes(':')) continue;
    if (seen.has(def.id)) continue;
    seen.add(def.id);
    out.push(def);
  }
  return out;
}

// ── styles from what a pack already declares ────────────────────────────────────────────────

/**
 * A pack's `materials[].procedural` name → one of this module's atlas surfaces.
 *
 * The bundled packs describe their materials with generator names (`brick`, `plaster`, `slate`,
 * `planks`, `cobble`, `concrete`, `painted-steel`), which is the vocabulary `CONTENT_PACKS.md`
 * defines and which every module maps into its own. A name nothing here knows falls back to render,
 * which is a wall — not an error and not an untextured box.
 */
const MATERIAL_SURFACE: Record<string, SurfaceName> = {
  brick: 'brick',
  plaster: 'render',
  render: 'render',
  stucco: 'render',
  stone: 'ashlar',
  ashlar: 'ashlar',
  slate: 'slate',
  planks: 'timber',
  timber: 'timber',
  wood: 'timber',
  shingle: 'shingle',
  pantile: 'pantile',
  clay: 'pantile',
  zinc: 'zinc',
  cobble: 'paving',
  paving: 'paving',
  granite: 'paving',
  asphalt: 'concrete',
  concrete: 'concrete',
  'painted-steel': 'metal',
  galvanised: 'metal',
  metal: 'metal',
  'pool-tile': 'panel',
  fiberglass: 'panel',
  panel: 'panel',
};

export function surfaceFromMaterial(name: string | undefined): SurfaceName | undefined {
  if (!name) return undefined;
  return MATERIAL_SURFACE[name];
}

/**
 * The style of last resort, and the only content in this file.
 *
 * A pack that declares nothing gets a plastered wall on a stone plinth under a slate roof, which is
 * a building rather than a grey box. Everything a pack does declare wins over it.
 */
export const DEFAULT_STYLE: BuildingStyleDef = {
  id: 'default',
  wall: 'render',
  plinth: 'ashlar',
  roof: 'slate',
  palette: {
    wall: '#e6dcc6',
    plinth: '#9c968a',
    roof: '#4a5058',
    trim: '#f2ede2',
    joinery: '#3d4b52',
    metal: '#5a6066',
    glass: '#2b3a42',
    lit: '#ffd9a0',
    sign: '#d9a441',
  },
  trim: {
    cornice: 0.34,
    stringCourse: 0.2,
    quoins: false,
    reveal: 0.16,
    sill: 0.09,
    corniceOut: 0.26,
  },
  glazing: { mullions: 2, transoms: 2 },
};

/**
 * Look an item up in this pack first, then in any other registered pack.
 *
 * The registry keys everything `pack:id`, so a bare id resolves to nothing — and a theme pack that
 * legitimately reuses the base pack's `plaster-cream` would silently get the default style. This is
 * the same cross-pack read `Registry.registerPack` already does when it checks a shop's `need`
 * against every registered pack's needs.
 */
function across(
  registry: Registry,
  category: 'materials' | 'themes',
  packId: string,
  id: string
): unknown {
  const local = registry.find(category, packId, id);
  if (local) return local.def;
  const any = registry.items(category).find((i) => (i.def as { id: string }).id === id);
  return any?.def;
}

function styleFromPack(
  registry: Registry,
  packId: string,
  def: BuildingDef,
  blueprint: BlueprintDef | null
): BuildingStyleDef {
  const wanted = blueprint?.style;
  if (wanted) {
    const found = styles.get(`${packId}:${wanted}`) ?? styles.get(wanted);
    if (found) return found;
    warnOnce(
      `style-missing:${packId}:${wanted}`,
      `blueprint "${blueprint.id}" names style "${wanted}", which no pack declares — using the default`
    );
  }
  // Derive one from what the pack already says about this item: its material and its theme.
  const material = def.material
    ? (across(registry, 'materials', packId, def.material) as MaterialDef | undefined)
    : undefined;
  const themeId = def.theme;
  const theme = themeId
    ? (across(registry, 'themes', packId, themeId) as
        { palette?: Record<string, string> } | undefined)
    : undefined;
  const palette = (theme?.palette ?? {}) as Record<string, string>;
  const surface =
    surfaceFromMaterial(material?.procedural) ??
    surfaceFromMaterial(def.material) ??
    DEFAULT_STYLE.wall;
  const wallColour = material?.baseColor ?? palette.secondary ?? DEFAULT_STYLE.palette.wall;
  const roofSurface: SurfaceName = surface === 'timber' ? 'shingle' : DEFAULT_STYLE.roof;
  return {
    ...DEFAULT_STYLE,
    id: `${packId}:${def.id}:derived`,
    wall: surface,
    roof: roofSurface,
    palette: {
      ...DEFAULT_STYLE.palette,
      wall: wallColour,
      trim: palette.secondary ?? DEFAULT_STYLE.palette.trim,
      roof: palette.trim ?? DEFAULT_STYLE.palette.roof,
      joinery: palette.trim ?? DEFAULT_STYLE.palette.joinery,
      sign: palette.accent ?? DEFAULT_STYLE.palette.sign,
    },
  };
}

// ── resolution ──────────────────────────────────────────────────────────────────────────────

/**
 * A blueprint for an item that declares none: one block of the declared size under a hipped roof.
 *
 * It warns and it draws. The alternative — refusing an item whose blueprint is missing — is a park
 * with a hole in it and no message, which is what "unknown kinds are listed as unavailable, never
 * crash" means one level down.
 */
function fallbackBlueprint(def: BuildingDef, styleId: string): BlueprintDef {
  const [w, h, d] = def.size;
  const storeys = Math.max(1, Math.round((h - 1.6) / 4));
  return {
    id: `fallback:${def.id}`,
    style: styleId,
    masses: [
      {
        size: [Math.max(4, w), Math.max(4, d)],
        storeys,
        storeyHeight: Math.max(3.2, (h - 1.6) / storeys),
        facades: { all: 'w*', front: 'w* d w*' },
        roof: { form: 'hip', pitch: 34, eaves: 0.6 },
      },
    ],
    ground: { apron: 1.8 },
  };
}

/** Resolve one `buildings` item into everything the builder needs, and nothing else. */
export function resolveBuilding(
  registry: Registry,
  packId: string,
  itemId: string,
  data?: BuildingEntityData
): ResolvedBuilding | null {
  const item = registry.find('buildings', packId, itemId);
  if (!item) return null;
  const def = item.def as BuildingDef;
  const isBlueprint = def.category === 'blueprint';

  let blueprint: BlueprintDef | null = null;
  let source: ResolvedBuilding['source'] = 'builtin';
  if (isBlueprint || data?.blueprint) {
    const wanted = data?.blueprint ?? def.procedural ?? def.id;
    blueprint =
      blueprints.get(`${packId}:${wanted}`) ??
      blueprints.get(wanted) ??
      blueprints.get(`${packId}:${def.id}`) ??
      blueprints.get(def.id) ??
      null;
    if (blueprint) source = 'pack';
  }

  const styleOverride = data?.style
    ? (styles.get(`${packId}:${data.style}`) ?? styles.get(data.style))
    : undefined;
  const style = styleOverride ?? styleFromPack(registry, packId, def, blueprint);

  if ((isBlueprint || data?.blueprint) && !blueprint) {
    warnOnce(
      `bp:${packId}:${itemId}`,
      `"${packId}:${itemId}" is a blueprint but no pack declares one by that id — drawing a plain block`
    );
    blueprint = fallbackBlueprint(def, style.id);
    source = 'fallback';
  }

  const piece = blueprint ? null : (def.procedural ?? pieceForCategory(def.category));
  return {
    key: `${packId}:${def.id}`,
    name: def.name,
    pack: packId,
    item: def.id,
    category: def.category,
    size: [def.size[0], def.size[1], def.size[2]],
    style,
    blueprint,
    piece,
    source,
    cost: def.cost,
  };
}

/** A kit entry with no `procedural` name still has a category, and a category is a piece. */
function pieceForCategory(category: BuildingDef['category']): string {
  if (category === 'window') return 'wall-window';
  if (category === 'door') return 'wall-door';
  if (category === 'roof') return 'roof-gable';
  if (category === 'floor') return 'floor';
  if (category === 'column') return 'column';
  if (category === 'trim') return 'trim';
  return 'wall';
}

/** Every building item every registered pack declares, in registration order. */
export function buildingItems(registry: Registry): ResolvedBuilding[] {
  const out: ResolvedBuilding[] = [];
  for (const item of registry.items('buildings')) {
    const resolved = resolveBuilding(registry, item.pack, (item.def as BuildingDef).id);
    if (resolved) out.push(resolved);
  }
  return out;
}
