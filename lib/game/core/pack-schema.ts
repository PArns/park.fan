/**
 * Content pack manifest schema (docs/game/CONTENT_PACKS.md). Validated with zod so a bad pack is
 * rejected with the path of the offending field instead of crashing a module at render time.
 */

import { z } from 'zod';

const localized = z.record(z.string(), z.string()).refine((o) => typeof o.en === 'string', {
  message: 'needs an "en" entry',
});
const vec2 = z.tuple([z.number(), z.number()]);
const vec3 = z.tuple([z.number(), z.number(), z.number()]);
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);

/** A visual source: a file under /game/assets and/or a procedural generator name. */
const visual = z.object({
  mesh: z.string().optional(),
  procedural: z.string().optional(),
  /** Uniform scale applied to a loaded mesh so kits with different units line up. */
  meshScale: z.number().positive().optional(),
  material: z.string().optional(),
});

const nightLight = z.object({
  color: color,
  intensity: z.number().nonnegative(),
  height: z.number().optional(),
  range: z.number().optional(),
  /** Animation of the rig at night: `steady` | `chase` | `strobe` | `cycle`. */
  mode: z.enum(['steady', 'chase', 'strobe', 'cycle']).optional(),
  colors: z.array(color).optional(),
});

/**
 * A guest need, declared by a pack.
 *
 * This is content and not an enum on purpose. The brief grades extensibility on it — "if a new
 * coaster type, shop, scenery theme or guest need cannot be added by dropping in a manifest, the
 * module fails its gate" — and `shopSchema.need` used to be a closed `z.enum([...])`, which made
 * a new need a core edit and quietly failed that gate for the whole game. It is a string
 * reference now, checked against the registered needs at pack-registration time so a typo is
 * still an error with a path, just not a schema-level one.
 */
export const needSchema = z.object({
  id: z.string(),
  name: localized,
  /** Points per park HOUR the need rises by, on a 0-255 scale. */
  decayPerHour: z.number().positive(),
  /** Weight in the guest's mood mix. Normalised across the registered needs at load. */
  moodWeight: z.number().nonnegative().default(1),
  /** Above this the guest starts looking for something that answers it. */
  urgentAt: z.number().int().min(0).max(255).default(180),
  /** Above this the guest's happiness falls every tick until it is answered. */
  criticalAt: z.number().int().min(0).max(255).default(230),
  /** Lucide icon name for the HUD. */
  icon: z.string().optional(),
  /** What a guest thinks when it is urgent. Localized; the UI picks one. */
  thoughts: z.array(localized).default([]),
  /** Rises faster in heat (`warm`) or in cold (`cold`); `none` ignores the weather. */
  weather: z.enum(['none', 'warm', 'cold', 'wet']).default('none'),
});

export const themeSchema = z.object({
  id: z.string(),
  name: localized,
  palette: z.record(z.string(), color),
  materials: z.array(z.string()).default([]),
  /** Ambient/music ids from the pack's audio list. */
  ambience: z.string().optional(),
});

export const materialSchema = z.object({
  id: z.string(),
  pbr: z
    .object({
      albedo: z.string().optional(),
      normal: z.string().optional(),
      orm: z.string().optional(),
      emissive: z.string().optional(),
    })
    .optional(),
  procedural: z.string().optional(),
  tiling: z.number().positive().default(1),
  baseColor: color.optional(),
  roughness: z.number().min(0).max(1).optional(),
  metallic: z.number().min(0).max(1).optional(),
});

export const scenerySchema = visual.extend({
  id: z.string(),
  name: localized,
  category: z.string(),
  footprint: vec2,
  height: z.number().optional(),
  cost: z.number().int().nonnegative(),
  theme: z.string().optional(),
  night: z.object({ light: nightLight.optional() }).optional(),
  /** Guests can sit/use it (`bench`, `bin`, `lamp`, `sign`, …). */
  furniture: z.string().optional(),
});

export const foliageSchema = visual.extend({
  id: z.string(),
  name: localized,
  kind: z.enum(['broadleaf', 'conifer', 'palm', 'shrub', 'flower', 'grass']),
  lod: z.array(z.number()).default([40, 120, 300]),
  scatterable: z.boolean().default(true),
  cost: z.number().int().nonnegative().default(0),
  height: z.number().positive().default(8),
});

export const shopSchema = visual.extend({
  id: z.string(),
  kind: z.enum([
    'food',
    'drink',
    'toilet',
    'changing-room',
    'first-aid',
    'atm',
    'souvenir',
    'info',
  ]),
  name: localized,
  /**
   * The need this shop answers, by id, from any registered pack's `needs`.
   *
   * A string rather than an enum: see {@link needSchema}. `'none'` is still accepted and means
   * the shop sells something nobody needs — a souvenir stand is a real thing.
   */
  need: z.string().default('none'),
  /** How much of the need one visit removes, on the 0-255 scale. */
  needRelief: z.number().int().min(0).max(255).default(160),
  price: z.number().int().nonnegative().default(0),
  cost: z.number().int().nonnegative(),
  upkeep: z.number().int().nonnegative().default(0),
  footprint: vec2,
  throughput: z.number().positive().default(4),
  power: z.number().nonnegative().default(2),
  water: z.number().nonnegative().default(0),
  theme: z.string().optional(),
  night: z.object({ light: nightLight.optional(), signage: color.optional() }).optional(),
});

const rideBase = visual.extend({
  id: z.string(),
  name: localized,
  cost: z.number().int().nonnegative(),
  upkeep: z.number().int().nonnegative().default(0),
  power: z.number().nonnegative().default(10),
  theme: z.string().optional(),
  /** Base ratings 0..10 the simulation starts from before physics/observed data. */
  excitement: z.number().min(0).max(10).optional(),
  fear: z.number().min(0).max(10).optional(),
  nausea: z.number().min(0).max(10).optional(),
  minHeightCm: z.number().optional(),
  night: z.object({ light: nightLight.optional() }).optional(),
});

export const flatRideSchema = rideBase.extend({
  kind: z.literal('flat'),
  rig: z.string(),
  capacity: z.number().int().positive(),
  cycleMinutes: z.number().positive(),
  footprint: vec2,
  queueSide: z.number().int().min(0).max(3).default(0),
});

export const coasterSchema = rideBase.extend({
  kind: z.literal('coaster'),
  trackStyle: z.string(),
  trainStyle: z.string(),
  carsPerTrain: z.number().int().positive(),
  seatsPerCar: z.number().int().positive(),
  trainsMax: z.number().int().positive().default(2),
  maxSpeed: z.number().positive(),
  liftSpeed: z.number().positive().default(3),
  launch: z.object({ speed: z.number().positive(), lengthM: z.number().positive() }).optional(),
  trackCostPerM: z.number().int().nonnegative(),
  /** Hard limits for validation, in G. */
  limits: z
    .object({ vertical: z.number(), lateral: z.number(), negative: z.number() })
    .default({ vertical: 5.2, lateral: 2.8, negative: -1.8 }),
});

export const flumeSchema = rideBase.extend({
  kind: z.literal('flume'),
  flumeStyle: z.enum(['body', 'tube', 'raft', 'mat']),
  trackStyle: z.string(),
  riderKind: z.enum(['body', 'tube', 'raft', 'mat']),
  trackCostPerM: z.number().int().nonnegative(),
  water: z.number().nonnegative().default(10),
});

export const rideSchema = z.discriminatedUnion('kind', [
  flatRideSchema,
  coasterSchema,
  flumeSchema,
]);

const curve = z.object({
  curve: z.enum(['linear', 'ease-in-out', 'sine', 'ease-in', 'ease-out']).default('ease-in-out'),
  revolutions: z.number().optional(),
  amplitude: z.number().optional(),
  axis: z.enum(['x', 'y', 'z']).optional(),
  /** Phase fraction of the cycle the motion occupies, [start, end] in 0..1. */
  window: vec2.optional(),
});

export const rigSchema = z.object({
  id: z.string(),
  parts: z.array(
    visual.extend({
      id: z.string().optional(),
      parent: z.string().optional(),
      offset: vec3.optional(),
      count: z.number().int().positive().optional(),
      radius: z.number().optional(),
      animate: z.record(z.string(), curve).optional(),
      seats: z.number().int().nonnegative().optional(),
    })
  ),
});

export const trackStyleSchema = z.object({
  id: z.string(),
  rail: z.object({
    profile: z.enum(['round', 'box', 'i-beam', 'tube']),
    radius: z.number().positive(),
    gauge: z.number().positive(),
  }),
  spine: z.object({ profile: z.enum(['round', 'box']), size: z.number().positive() }).optional(),
  ties: z
    .object({ every: z.number().positive(), width: z.number().positive().optional() })
    .optional(),
  supports: z.enum(['steel', 'timber', 'none']).default('steel'),
  material: z.string().optional(),
  color: color.optional(),
});

export const trainStyleSchema = z.object({
  id: z.string(),
  car: visual.extend({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive().default(1.2),
    seats: z.number().int().positive().default(4),
  }),
  color: color.optional(),
});

export const buildingSchema = visual.extend({
  id: z.string(),
  name: localized,
  category: z.enum(['wall', 'roof', 'window', 'door', 'floor', 'trim', 'column', 'blueprint']),
  size: vec3,
  cost: z.number().int().nonnegative(),
  theme: z.string().optional(),
});

export const audioSchema = z.object({
  id: z.string(),
  src: z.string(),
  bus: z.enum(['ambience', 'rides', 'music', 'ui', 'guests']),
  loop: z.boolean().default(false),
  gain: z.number().min(0).max(2).default(1),
  /** Procedural synth fallback when the file is absent. */
  procedural: z.string().optional(),
});

export const scenarioSchema = z.object({
  id: z.string(),
  name: localized,
  description: localized.optional(),
  rules: z.object({
    cash: z.number().int(),
    loanMax: z.number().int().default(0),
    days: z.number().int().positive().optional(),
    objectives: z
      .array(
        z.object({
          type: z.enum(['guests', 'rating', 'cash', 'coasters', 'profit']),
          value: z.number(),
          byDay: z.number().int().optional(),
        })
      )
      .default([]),
    startPark: z.enum(['empty', 'demo', 'seeded']).default('empty'),
  }),
});

export const packManifestSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  version: z.number().int().positive(),
  name: localized,
  requires: z.array(z.string()).default([]),
  needs: z.array(needSchema).default([]),
  themes: z.array(themeSchema).default([]),
  materials: z.array(materialSchema).default([]),
  scenery: z.array(scenerySchema).default([]),
  foliage: z.array(foliageSchema).default([]),
  shops: z.array(shopSchema).default([]),
  rides: z.array(rideSchema).default([]),
  rigs: z.array(rigSchema).default([]),
  trackStyles: z.array(trackStyleSchema).default([]),
  trainStyles: z.array(trainStyleSchema).default([]),
  buildings: z.array(buildingSchema).default([]),
  audio: z.array(audioSchema).default([]),
  icons: z.record(z.string(), z.string()).default({}),
  scenarios: z.array(scenarioSchema).default([]),
});

export type PackManifest = z.infer<typeof packManifestSchema>;
export type PackManifestInput = z.input<typeof packManifestSchema>;
export type Theme = z.infer<typeof themeSchema>;
export type MaterialDef = z.infer<typeof materialSchema>;
export type NeedDef = z.infer<typeof needSchema>;
export type SceneryDef = z.infer<typeof scenerySchema>;
export type FoliageDef = z.infer<typeof foliageSchema>;
export type ShopDef = z.infer<typeof shopSchema>;
export type RideDef = z.infer<typeof rideSchema>;
export type FlatRideDef = z.infer<typeof flatRideSchema>;
export type CoasterDef = z.infer<typeof coasterSchema>;
export type FlumeDef = z.infer<typeof flumeSchema>;
export type RigDef = z.infer<typeof rigSchema>;
export type TrackStyleDef = z.infer<typeof trackStyleSchema>;
export type TrainStyleDef = z.infer<typeof trainStyleSchema>;
export type BuildingDef = z.infer<typeof buildingSchema>;
export type AudioDef = z.infer<typeof audioSchema>;
export type ScenarioDef = z.infer<typeof scenarioSchema>;
export type NightLightDef = z.infer<typeof nightLight>;

export function parsePack(input: unknown): PackManifest {
  const result = packManifestSchema.safeParse(input);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error(`Invalid pack: ${issue.path.join('.')}: ${issue.message}`);
  }
  return result.data;
}
