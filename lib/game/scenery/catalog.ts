/**
 * Every prop the game knows about, resolved from the registered packs into one flat list.
 *
 * This file is the extensibility gate. A pack entry names a `procedural` generator, and this is
 * where that string becomes a function — through five steps, not one, because "a new prop must be
 * addable by adding a manifest entry with no code change" only holds if the resolution degrades
 * sensibly instead of returning nothing:
 *
 *   1. the exact generator name (`lamp-victorian`)
 *   2. its family, the part before the first dash (`lamp-art-deco` → `lamp`)
 *   3. the `furniture` field, which already says what a guest may do with it (`bench`, `bin`)
 *   4. `category` for scenery / `kind` for foliage (`garden`, `fence`, `conifer`)
 *   5. a plinth-and-post marker sized to the entry's own footprint, logged once
 *
 * Steps 2–4 are what make a new manifest entry work, and step 5 is what makes a typo visible
 * rather than invisible: `fallback: true` travels with the spec, `main.ts` warns once per key, and
 * the marker is a real object of the right size rather than nothing at all — a prop that silently
 * does not draw is a bug report about the placement tool.
 *
 * Every generator reads the entry's own `footprint`, `height` and `night.light` rather than
 * constants of its own, so two manifest entries pointing at one generator are two different props.
 *
 * DOM-free and Babylon-free: `sim.ts` resolves the same catalogue to answer what stands where.
 */

import type { Registry } from '../core/registry';
import type { FoliageDef, NightLightDef, SceneryDef } from '../core/pack-schema';

/** How a generator is expected to build: `prop` sits on the ground, `foliage` sways and LODs. */
export type PropClass = 'prop' | 'foliage';

export interface PropSpec {
  /** `pack:item`, or `ambient:<id>` for the module's own landscape dressing. */
  key: string;
  pack: string;
  item: string;
  /** English label. World-space only; nothing in the HUD reads this. */
  name: string;
  source: 'scenery' | 'foliage' | 'ambient';
  cls: PropClass;
  /** The generator that will actually build it. */
  generator: string;
  /** What the manifest asked for, kept so a fallback can be reported honestly. */
  requested: string;
  /** True when `generator` is not what the manifest named. */
  fallback: boolean;
  footprint: [number, number];
  height: number;
  cost: number;
  /** `bench` | `bin` | `lamp` | … from the manifest, or null. */
  furniture: string | null;
  category: string;
  night: NightLightDef | null;
  /** Distances at which LOD 1, 2 and the cull take over. */
  lod: [number, number, number];
  scatterable: boolean;
  /** Radius other props are kept out of when scattering, metres. */
  clearance: number;
  /** Per-instance scale is drawn from this range. Wider for anything that grew. */
  scaleRange: [number, number];
}

/** Generators this module implements. A manifest may name any of them. */
export const GENERATORS = [
  'tree-broadleaf',
  'tree-conifer',
  'tree-palm',
  'shrub',
  'hedge',
  'flowers',
  'grass-tuft',
  'rock',
  'bench',
  'bin',
  'lamp-victorian',
  'lamp-modern',
  'planter-round',
  'fence-iron',
  'flag',
  'entrance-arch',
  'sign-post',
  'fountain-tier',
  'parasol',
  'lounger',
  'light-strip',
  'neon-palm',
  'marker',
] as const;

export type GeneratorName = (typeof GENERATORS)[number];

const GENERATOR_SET = new Set<string>(GENERATORS);

/** Step 2: the family a dashed name belongs to. `lamp-art-deco` and `lamp-1920` are both lamps. */
const FAMILY: Record<string, GeneratorName> = {
  tree: 'tree-broadleaf',
  lamp: 'lamp-victorian',
  bench: 'bench',
  bin: 'bin',
  planter: 'planter-round',
  fence: 'fence-iron',
  hedge: 'hedge',
  flag: 'flag',
  sign: 'sign-post',
  fountain: 'fountain-tier',
  rock: 'rock',
  boulder: 'rock',
  shrub: 'shrub',
  bush: 'shrub',
  grass: 'grass-tuft',
  flower: 'flowers',
  parasol: 'parasol',
  lounger: 'lounger',
  light: 'light-strip',
  neon: 'neon-palm',
};

/** Step 3: what a guest can do with it says a great deal about what it looks like. */
const BY_FURNITURE: Record<string, GeneratorName> = {
  bench: 'bench',
  bin: 'bin',
  lamp: 'lamp-victorian',
  sign: 'sign-post',
};

/** Step 4a: scenery categories. */
const BY_CATEGORY: Record<string, GeneratorName> = {
  'path-furniture': 'bench',
  garden: 'planter-round',
  fence: 'fence-iron',
  signage: 'sign-post',
  lighting: 'lamp-modern',
};

/** Step 4b: foliage kinds — the schema's closed set, so this one is exhaustive. */
const BY_FOLIAGE_KIND: Record<FoliageDef['kind'], GeneratorName> = {
  broadleaf: 'tree-broadleaf',
  conifer: 'tree-conifer',
  palm: 'tree-palm',
  shrub: 'shrub',
  flower: 'flowers',
  grass: 'grass-tuft',
};

/** Generators whose output sways in the wind and needs three LOD levels. */
const FOLIAGE_GENERATORS = new Set<string>([
  'tree-broadleaf',
  'tree-conifer',
  'tree-palm',
  'shrub',
  'hedge',
  'flowers',
  'grass-tuft',
]);

export interface Resolution {
  generator: GeneratorName;
  fallback: boolean;
}

/** The five steps, in order. Exported because the self-test asserts each one of them. */
export function resolveGenerator(input: {
  procedural?: string;
  furniture?: string;
  category?: string;
  foliageKind?: FoliageDef['kind'];
}): Resolution {
  const requested = input.procedural?.trim();
  if (requested && GENERATOR_SET.has(requested)) {
    return { generator: requested as GeneratorName, fallback: false };
  }
  if (requested) {
    const family = FAMILY[requested.split('-')[0]];
    if (family) return { generator: family, fallback: true };
  }
  if (input.furniture && BY_FURNITURE[input.furniture]) {
    return { generator: BY_FURNITURE[input.furniture], fallback: true };
  }
  if (input.foliageKind && BY_FOLIAGE_KIND[input.foliageKind]) {
    return { generator: BY_FOLIAGE_KIND[input.foliageKind], fallback: true };
  }
  if (input.category && BY_CATEGORY[input.category]) {
    return { generator: BY_CATEGORY[input.category], fallback: true };
  }
  return { generator: 'marker', fallback: true };
}

function classOf(generator: string): PropClass {
  return FOLIAGE_GENERATORS.has(generator) ? 'foliage' : 'prop';
}

/** Scale spread per class: a bench is a manufactured object, a tree is not. */
function scaleRangeFor(generator: string, source: PropSpec['source']): [number, number] {
  if (generator.startsWith('tree-')) return [0.72, 1.34];
  if (generator === 'shrub' || generator === 'flowers' || generator === 'grass-tuft') {
    return [0.7, 1.35];
  }
  if (generator === 'rock') return [0.6, 1.7];
  if (source === 'ambient') return [0.8, 1.2];
  return [0.97, 1.03];
}

function clearanceFor(spec: {
  footprint: [number, number];
  height: number;
  cls: PropClass;
}): number {
  const half = Math.max(spec.footprint[0], spec.footprint[1]) * 0.5;
  // A tree's clearance is its canopy, which is a fraction of its height and has nothing to do
  // with the trunk's footprint — 0.4 × 14 m for an oak against the 0.2 m the manifest declares.
  return spec.cls === 'foliage' ? Math.max(half, spec.height * 0.22) : Math.max(half, 0.35);
}

function localized(names: Record<string, string>): string {
  return names.en ?? Object.values(names)[0] ?? 'prop';
}

function fromScenery(pack: string, def: SceneryDef): PropSpec {
  const { generator, fallback } = resolveGenerator({
    procedural: def.procedural,
    furniture: def.furniture,
    category: def.category,
  });
  const cls = classOf(generator);
  const footprint: [number, number] = [def.footprint[0], def.footprint[1]];
  const height = def.height ?? 2;
  return {
    key: `${pack}:${def.id}`,
    pack,
    item: def.id,
    name: localized(def.name),
    source: 'scenery',
    cls,
    generator,
    requested: def.procedural ?? '',
    fallback,
    footprint,
    height,
    cost: def.cost,
    furniture: def.furniture ?? null,
    category: def.category,
    night: def.night?.light ?? null,
    lod: [60, 160, 420],
    scatterable: false,
    clearance: clearanceFor({ footprint, height, cls }),
    scaleRange: scaleRangeFor(generator, 'scenery'),
  };
}

function fromFoliage(pack: string, def: FoliageDef): PropSpec {
  const { generator, fallback } = resolveGenerator({
    procedural: def.procedural,
    foliageKind: def.kind,
  });
  const cls = classOf(generator);
  // Foliage declares a height and no footprint; the crown is what the placement has to respect.
  const spread = def.kind === 'conifer' ? 0.42 : def.kind === 'palm' ? 0.55 : 0.72;
  const footprint: [number, number] = [def.height * spread, def.height * spread];
  const lod = def.lod ?? [40, 120, 300];
  return {
    key: `${pack}:${def.id}`,
    pack,
    item: def.id,
    name: localized(def.name),
    source: 'foliage',
    cls,
    generator,
    requested: def.procedural ?? '',
    fallback,
    footprint,
    height: def.height,
    cost: def.cost,
    furniture: null,
    category: def.kind,
    night: null,
    lod: [lod[0] ?? 40, lod[1] ?? 120, lod[2] ?? 300],
    scatterable: def.scatterable,
    clearance: clearanceFor({ footprint, height: def.height, cls }),
    scaleRange: scaleRangeFor(generator, 'foliage'),
  };
}

/**
 * The module's own landscape dressing.
 *
 * These are not content: nobody buys a boulder, and a pack that had to declare every stone in the
 * undergrowth would be a pack nobody could write. They carry the pack id `ambient`, are never
 * entities, and are re-derived from the seed on load — which is also why the save does not grow by
 * six thousand rocks.
 */
export const AMBIENT_SPECS: readonly PropSpec[] = [
  ambient('rock-boulder', 'rock', 2.4, 1.8, [50, 140, 320]),
  ambient('rock-cluster', 'rock', 1.1, 0.7, [40, 110, 260]),
  ambient('undergrowth', 'shrub', 1.4, 1.1, [28, 80, 180]),
  ambient('meadow-flowers', 'flowers', 0.9, 0.4, [22, 60, 130]),
  ambient('meadow-grass', 'grass-tuft', 0.8, 0.55, [18, 48, 110]),
];

function ambient(
  id: string,
  generator: GeneratorName,
  width: number,
  height: number,
  lod: [number, number, number]
): PropSpec {
  const cls = classOf(generator);
  const footprint: [number, number] = [width, width];
  return {
    key: `ambient:${id}`,
    pack: 'ambient',
    item: id,
    name: id,
    source: 'ambient',
    cls,
    generator,
    requested: generator,
    fallback: false,
    footprint,
    height,
    cost: 0,
    furniture: null,
    category: 'ambient',
    night: null,
    lod,
    scatterable: true,
    clearance: clearanceFor({ footprint, height, cls }),
    scaleRange: scaleRangeFor(generator, 'ambient'),
  };
}

/** Every scenery and foliage entry of every registered pack, plus the ambient set. */
export function buildCatalog(registry: Registry): Map<string, PropSpec> {
  const out = new Map<string, PropSpec>();
  for (const item of registry.items('scenery')) {
    const spec = fromScenery(item.pack, item.def as SceneryDef);
    out.set(spec.key, spec);
  }
  for (const item of registry.items('foliage')) {
    const spec = fromFoliage(item.pack, item.def as FoliageDef);
    out.set(spec.key, spec);
  }
  for (const spec of AMBIENT_SPECS) out.set(spec.key, spec);
  return out;
}
