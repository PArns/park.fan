/**
 * The content registry.
 *
 * **Adding content must never require a core edit.** A ride, a shop, a scenery kit, a theme, a
 * guest need and a scenario rule are declarations — JSON plus glTF — registered here. If a thing
 * cannot be added by dropping in a manifest, the module that owns it has failed its gate.
 *
 * Validation is strict on purpose: an unknown key is an **error**, not a shrug. A typo'd
 * `capacitiy` that silently becomes `capacity: undefined` is exactly the bug a manifest format
 * exists to prevent, and the failure surfaces twice — a named error in the notice tray and a row
 * in the harness JSON — because a pack that half-loads is worse than one that does not.
 */

import { z } from 'zod';
import type { Logger } from './log';

export const DEFINITION_KINDS = [
  'flat-ride',
  'coaster',
  'flume',
  'transport',
  'shop',
  'scenery',
  'building-part',
  'path-style',
  'theme',
  'need',
  'scenario',
  'blueprint',
  'icon-set',
] as const;
export type DefinitionKind = (typeof DEFINITION_KINDS)[number];

const localized = z.union([z.string(), z.record(z.string(), z.string())]);

const vec3 = z.object({ x: z.number(), y: z.number(), z: z.number() });

const baseDefinition = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:[-.][a-z0-9]+)+$/, 'ids are `pack.name`, lower-kebab'),
  kind: z.enum(DEFINITION_KINDS),
  name: localized,
  description: localized.optional(),
  tags: z.array(z.string()).default([]),
  theme: z.string().default('core'),
  cost: z
    .object({ build: z.number().int().nonnegative(), runPerHour: z.number().int().nonnegative().default(0) })
    .default({ build: 0, runPerHour: 0 }),
  unlock: z.string().nullable().default(null),
  icon: z.string().optional(),
});

const footprint = z.object({
  w: z.number().positive(),
  d: z.number().positive(),
  clearanceY: z.number().positive().default(6),
});

const animTrack = z.object({
  loop: z.boolean().default(false),
  /** `[timeSeconds, value]` pairs, ascending in time. */
  keys: z.array(z.tuple([z.number(), z.number()])).min(2),
  ease: z.enum(['linear', 'inSine', 'outSine', 'inOutSine', 'inOutCubic']).default('linear'),
});

export const flatRideSchema = baseDefinition
  .extend({
    kind: z.literal('flat-ride'),
    model: z.string(),
    footprint,
    capacity: z.number().int().positive(),
    cycleSeconds: z.number().positive(),
    loadSeconds: z.number().positive().default(30),
    riders: z.object({
      minHeightCm: z.number().int().nonnegative().default(0),
      maxHeightCm: z.number().int().positive().default(210),
      seats: z.number().int().positive(),
    }),
    rig: z.object({
      joints: z.array(
        z.object({
          node: z.string(),
          track: z.string(),
          axis: z.enum(['x', 'y', 'z']),
          kind: z.enum(['rotate', 'translate']).default('rotate'),
        })
      ),
      tracks: z.record(z.string(), animTrack),
      riderNodes: z.string().default('Seat_*'),
    }),
    ratings: z.object({
      excitement: z.number().min(0).max(10),
      fear: z.number().min(0).max(10),
      nausea: z.number().min(0).max(10),
    }),
    power: z.object({ kw: z.number().nonnegative() }).default({ kw: 0 }),
  })
  .strict();

export const coasterSchema = baseDefinition
  .extend({
    kind: z.literal('coaster'),
    track: z.object({
      gauge: z.number().positive(),
      railRadius: z.number().positive(),
      tieSpacing: z.number().positive(),
      spineProfile: z.enum(['box', 'tube', 'triangle', 'wooden']),
      material: z.string(),
    }),
    car: z.object({
      model: z.string().optional(),
      seatsPerCar: z.number().int().positive(),
      carsPerTrain: z.array(z.number().int().positive()).min(1),
      mass: z.number().positive(),
      lengthM: z.number().positive().default(3.2),
    }),
    physics: z.object({
      frictionRolling: z.number().nonnegative(),
      dragK: z.number().nonnegative(),
      liftSpeed: z.number().positive(),
      launchSpeed: z.number().positive().nullable().default(null),
    }),
    pieces: z.array(z.string()).min(1),
    supports: z.object({
      style: z.string(),
      maxSpan: z.number().positive(),
      footingRadius: z.number().positive(),
    }),
    limits: z.object({
      maxGVertical: z.number().positive(),
      maxGLateral: z.number().positive(),
      minRadius: z.number().positive(),
    }),
  })
  .strict();

export const shopSchema = baseDefinition
  .extend({
    kind: z.literal('shop'),
    category: z.enum(['food', 'drink', 'souvenir', 'toilet', 'firstAid', 'atm', 'changing', 'locker']),
    model: z.string(),
    footprint,
    satisfies: z.array(z.object({ need: z.string(), amount: z.number() })).default([]),
    sells: z
      .array(
        z.object({
          sku: z.string(),
          cost: z.number().int().nonnegative(),
          defaultPrice: z.number().int().nonnegative(),
        })
      )
      .default([]),
    staffSlots: z.number().int().nonnegative().default(0),
    queueCapacity: z.number().int().positive().default(10),
    power: z.object({ kw: z.number().nonnegative() }).default({ kw: 0 }),
  })
  .strict();

export const scenerySchema = baseDefinition
  .extend({
    kind: z.literal('scenery'),
    model: z.string().optional(),
    /** Procedural stand-in when no model is available. */
    procedural: z.enum(['tree', 'bush', 'rock', 'fence', 'lamp', 'bench', 'bin', 'planter', 'sign', 'flag']).optional(),
    footprint: footprint.partial({ clearanceY: true }).optional(),
    heightM: z.number().positive().default(2),
    scatter: z.object({ minScale: z.number().positive(), maxScale: z.number().positive() }).optional(),
    tintable: z.boolean().default(false),
    lightAtNight: z.object({ colorHex: z.string(), intensity: z.number(), rangeM: z.number() }).optional(),
  })
  .strict();

export const buildingPartSchema = baseDefinition
  .extend({
    kind: z.literal('building-part'),
    part: z.enum(['wall', 'roof', 'window', 'door', 'floor', 'pillar', 'trim', 'awning']),
    model: z.string().optional(),
    sizeM: vec3,
    snap: z.enum(['wall', 'roof', 'floor', 'free']).default('free'),
  })
  .strict();

export const pathStyleSchema = baseDefinition
  .extend({
    kind: z.literal('path-style'),
    surface: z.object({ material: z.string(), tileM: z.number().positive().default(2) }),
    kerb: z.boolean().default(true),
    railing: z.string().nullable().default(null),
  })
  .strict();

export const needSchema = baseDefinition
  .extend({
    kind: z.literal('need'),
    /** Points per game hour the need rises by. 0–255 is the scale. */
    decayPerHour: z.number().positive(),
    /** Weight in the mood mix. The sum across needs is normalised at load. */
    moodWeight: z.number().nonnegative().default(1),
    /** Above this the guest starts looking for a fix. */
    urgentAt: z.number().int().min(0).max(255).default(180),
    /** Above this the guest's happiness falls every tick. */
    criticalAt: z.number().int().min(0).max(255).default(230),
    thoughts: z.array(localized).default([]),
  })
  .strict();

export const themeSchema = baseDefinition
  .extend({
    kind: z.literal('theme'),
    palette: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).min(3),
    sky: z.object({ turbidity: z.number(), rayleigh: z.number(), luminance: z.number() }).optional(),
    water: z.object({ absorptionHex: z.string(), scatterHex: z.string(), causticScale: z.number() }).optional(),
    fogDensity: z.number().nonnegative().default(0.0015),
    foliage: z.array(z.string()).default([]),
    props: z.array(z.string()).default([]),
    pathStyle: z.string().optional(),
    music: z.string().optional(),
    ambience: z.string().optional(),
    /** HUD accent, so a theme can tint the UI without touching a token file. */
    uiAccentHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  })
  .strict();

const objective = z.object({
  id: z.string(),
  type: z.enum([
    'guestsAtOnce',
    'guestsTotal',
    'parkRating',
    'cashAtLeast',
    'ridesBuilt',
    'coasterExcitement',
    'neverBankrupt',
    'all',
    'any',
  ]),
  target: z.number().optional(),
  byDay: z.number().int().positive().optional(),
  of: z.array(z.string()).optional(),
});

export const scenarioSchema = baseDefinition
  .extend({
    kind: z.literal('scenario'),
    map: z.string().optional(),
    start: z.object({
      cash: z.number().int(),
      loan: z.number().int().nonnegative().default(0),
      loanLimit: z.number().int().nonnegative().default(20_000_000),
      day: z.number().int().nonnegative().default(0),
      season: z.number().int().min(0).max(3).default(1),
      unlocked: z.array(z.string()).default(['*']),
      terrainSize: z.number().int().positive().default(256),
    }),
    objectives: z.array(objective).default([]),
    fail: z.array(z.object({ type: z.string(), value: z.number().optional(), forDays: z.number().optional() })).default([]),
    rules: z
      .object({
        researchSpeed: z.number().positive().default(1),
        guestSpawnMultiplier: z.number().positive().default(1),
        landPurchasable: z.boolean().default(true),
        entryFeeAllowed: z.boolean().default(true),
      })
      .default({ researchSpeed: 1, guestSpawnMultiplier: 1, landPurchasable: true, entryFeeAllowed: true }),
  })
  .strict();

export const blueprintSchema = baseDefinition
  .extend({
    kind: z.literal('blueprint'),
    /** A recorded command list. Replaying it builds the thing — which is why undo and blueprints
     *  are the same mechanism and neither needed a snapshot diff. */
    commands: z.array(z.unknown()),
    boundsM: z.object({ w: z.number(), d: z.number(), h: z.number() }),
    preview: z.string().optional(),
  })
  .strict();

export const iconSetSchema = baseDefinition
  .extend({
    kind: z.literal('icon-set'),
    /** Icon name → a lucide icon name, or a path under /game/assets. */
    icons: z.record(z.string(), z.string()),
  })
  .strict();

const flumeSchema = coasterSchema.extend({ kind: z.literal('flume') }).strict();
const transportSchema = coasterSchema.extend({ kind: z.literal('transport') }).strict();

export const DEFINITION_SCHEMAS = {
  'flat-ride': flatRideSchema,
  coaster: coasterSchema,
  flume: flumeSchema,
  transport: transportSchema,
  shop: shopSchema,
  scenery: scenerySchema,
  'building-part': buildingPartSchema,
  'path-style': pathStyleSchema,
  theme: themeSchema,
  need: needSchema,
  scenario: scenarioSchema,
  blueprint: blueprintSchema,
  'icon-set': iconSetSchema,
} as const;

export type DefinitionOf<K extends DefinitionKind> = z.infer<(typeof DEFINITION_SCHEMAS)[K]>;
export type AnyDefinition = { [K in DefinitionKind]: DefinitionOf<K> }[DefinitionKind];

export const packSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    version: z.string(),
    name: localized,
    requires: z
      .object({ engine: z.string().default('>=1.0.0'), packs: z.array(z.string()).default([]) })
      .default({ engine: '>=1.0.0', packs: [] }),
    license: z.string().default('CC0-1.0'),
    definitions: z.array(z.unknown()),
    strings: z.record(z.string(), z.record(z.string(), z.string())).default({}),
  })
  .strict();

export type ContentPack = z.infer<typeof packSchema>;

export interface RegistryProblem {
  packId: string;
  definitionId: string | null;
  message: string;
}

export interface ContentRegistry {
  load(pack: unknown): boolean;
  define<K extends DefinitionKind>(kind: K, definition: unknown): boolean;
  get<K extends DefinitionKind>(kind: K, id: string): DefinitionOf<K> | undefined;
  all<K extends DefinitionKind>(kind: K): readonly DefinitionOf<K>[];
  /** Everything of `kind` the player may build right now. `unlocked` supports a trailing `*`. */
  available<K extends DefinitionKind>(kind: K, unlocked: readonly string[]): readonly DefinitionOf<K>[];
  /** Need ids in a stable order — the guest store's need columns are indexed by this. */
  needOrder(): readonly string[];
  strings(locale: string): Readonly<Record<string, string>>;
  loadedPacks(): readonly string[];
  problems(): readonly RegistryProblem[];
}

/** `park.fan-basic` matches `park.fan-*` and `*`. No regex, no globbing beyond a trailing star. */
export function matchesUnlock(id: string, patterns: readonly string[]): boolean {
  for (const pattern of patterns) {
    if (pattern === '*' || pattern === id) return true;
    if (pattern.endsWith('*') && id.startsWith(pattern.slice(0, -1))) return true;
  }
  return false;
}

export function createRegistry(log: Logger, engineVersion: string): ContentRegistry {
  const byKind = new Map<DefinitionKind, Map<string, AnyDefinition>>();
  /** Insertion order per kind, so `all()` is stable and a save's ids resolve the same way twice. */
  const order = new Map<DefinitionKind, string[]>();
  const stringTables = new Map<string, Record<string, string>>();
  const packs: string[] = [];
  const problems: RegistryProblem[] = [];
  let currentPack = 'inline';
  let needOrderCache: string[] | null = null;

  for (const kind of DEFINITION_KINDS) {
    byKind.set(kind, new Map());
    order.set(kind, []);
  }

  function define(kind: DefinitionKind, raw: unknown): boolean {
    const schema = DEFINITION_SCHEMAS[kind];
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const id = (raw as { id?: unknown })?.id;
      const message = parsed.error.issues
        .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
        .join('; ');
      problems.push({ packId: currentPack, definitionId: typeof id === 'string' ? id : null, message });
      log.error(`rejected ${kind} ${typeof id === 'string' ? id : '<no id>'}`, message);
      return false;
    }
    const definition = parsed.data as AnyDefinition;
    const table = byKind.get(kind)!;
    if (table.has(definition.id)) {
      problems.push({
        packId: currentPack,
        definitionId: definition.id,
        message: `id collision: ${definition.id} is already defined`,
      });
      log.error(`id collision on ${definition.id}`);
      return false;
    }
    table.set(definition.id, definition);
    order.get(kind)!.push(definition.id);
    if (kind === 'need') needOrderCache = null;
    return true;
  }

  /** `>=1.0.0` against `1.0.0`. Enough for "is this pack from the future"; not a semver library. */
  function satisfiesEngine(requirement: string): boolean {
    const match = /^([><]=?|=)?\s*(\d+)\.(\d+)\.(\d+)$/.exec(requirement.trim());
    if (!match) return true;
    const want = [Number(match[2]), Number(match[3]), Number(match[4])];
    const have = engineVersion.split('.').map(Number);
    const cmp = (a: number[], b: number[]) =>
      a[0]! - b[0]! || a[1]! - b[1]! || a[2]! - b[2]!;
    const delta = cmp(have, want);
    switch (match[1] ?? '>=') {
      case '>':
        return delta > 0;
      case '>=':
        return delta >= 0;
      case '<':
        return delta < 0;
      case '<=':
        return delta <= 0;
      default:
        return delta === 0;
    }
  }

  return {
    load(raw) {
      const parsed = packSchema.safeParse(raw);
      if (!parsed.success) {
        problems.push({
          packId: String((raw as { id?: unknown })?.id ?? '<unknown>'),
          definitionId: null,
          message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        });
        log.error('rejected pack manifest', parsed.error.issues);
        return false;
      }
      const pack = parsed.data;
      if (!satisfiesEngine(pack.requires.engine)) {
        // Skipped whole, never partially: half a pack is worse than none.
        problems.push({
          packId: pack.id,
          definitionId: null,
          message: `needs engine ${pack.requires.engine}, this build is ${engineVersion}`,
        });
        log.warn(`pack ${pack.id} skipped — needs engine ${pack.requires.engine}`);
        return false;
      }
      for (const required of pack.requires.packs) {
        if (!packs.includes(required)) {
          problems.push({ packId: pack.id, definitionId: null, message: `requires pack ${required}` });
          log.warn(`pack ${pack.id} skipped — requires ${required}`);
          return false;
        }
      }
      const previous = currentPack;
      currentPack = pack.id;
      let accepted = 0;
      for (const definition of pack.definitions) {
        const kind = (definition as { kind?: unknown })?.kind;
        if (typeof kind !== 'string' || !(DEFINITION_KINDS as readonly string[]).includes(kind)) {
          problems.push({ packId: pack.id, definitionId: null, message: `unknown kind ${String(kind)}` });
          continue;
        }
        if (define(kind as DefinitionKind, definition)) accepted++;
      }
      for (const [locale, table] of Object.entries(pack.strings)) {
        // Later packs win, which is how a theme pack overrides a core label.
        stringTables.set(locale, { ...(stringTables.get(locale) ?? {}), ...table });
      }
      currentPack = previous;
      packs.push(pack.id);
      log.info(`pack ${pack.id} loaded — ${accepted}/${pack.definitions.length} definitions`);
      return true;
    },
    define(kind, definition) {
      return define(kind, definition);
    },
    get(kind, id) {
      return byKind.get(kind)?.get(id) as never;
    },
    all(kind) {
      const table = byKind.get(kind)!;
      return order.get(kind)!.map((id) => table.get(id)!) as never;
    },
    available(kind, unlocked) {
      return (this.all(kind) as readonly AnyDefinition[]).filter((definition) =>
        matchesUnlock(definition.id, unlocked)
      ) as never;
    },
    needOrder() {
      if (!needOrderCache) needOrderCache = order.get('need')!.slice();
      return needOrderCache;
    },
    strings(locale) {
      return stringTables.get(locale) ?? stringTables.get('en') ?? {};
    },
    loadedPacks() {
      return packs;
    },
    problems() {
      return problems;
    },
  };
}
