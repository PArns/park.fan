/**
 * Content, not code: everything about a flat ride comes out of a manifest.
 *
 * Three sources, one parser, in this priority:
 *
 *  1. **A pack's own `rideRigs`** — the category this module claims through
 *     `registry.registerPackCategory('rideRigs', 'rides')`. Parts name a `shape` from `shapes.ts`
 *     and any parameters they like, so a ride nothing here anticipated is a manifest entry.
 *  2. **A pack's core `rigs`** — the category `pack-schema.ts` already had, whose parts name a
 *     `procedural` generator. Both bundled packs use it and neither is this module's to edit, so
 *     the generator names they use resolve through the built-in **presets** below, which are the
 *     same records a `rideRigs` entry produces and go through the same parser.
 *  3. **A fallback**, derived from the ride's own capacity and footprint, for a flat ride whose rig
 *     is missing or unknown. It warns once, sets `rigFallback`, and draws something rather than
 *     nothing.
 *
 * **`registry.packs()` AND `onPack`, both.** `onPack` fires on registration and the bundled packs
 * are registered before any module's `main()` or `sim()` runs, so a listener alone sees neither of
 * them; six modules on this branch have now fallen into that.
 *
 * Nothing here switches on a pack id or a ride id. It switches on a **shape** and on a **generator
 * name**, which is the extension point `CONTENT_PACKS.md` defines ("a generator name registered by
 * the owning module") and the same line `shops` draws at its five massings: a pack can combine the
 * eleven shapes at any size, count, radius, colour and animation, and it cannot invent a twelfth
 * primitive from JSON.
 *
 * Babylon-free and DOM-free: the worker imports this to size a queue and count seats.
 */

import { z } from 'zod';
import type { Registry } from '../core/registry';
import type { FlatRideDef, PackManifest, RideDef } from '../core/pack-schema';
import type {
  Channel,
  CurveSpec,
  CycleSplit,
  FlatRideProfile,
  NightRig,
  ResolvedRig,
  RigPartSpec,
  RideRigSpec,
  ShapeName,
} from './types';
import { isShapeName } from './shapes';
import { rigLayout } from './rig';

/** The category this module claims on the manifest. */
export const RIG_CATEGORY = 'rideRigs';

// ── schema ──────────────────────────────────────────────────────────────────────────────────
const curveSchema = z.object({
  curve: z.enum(['linear', 'ease-in-out', 'sine', 'ease-in', 'ease-out']).default('ease-in-out'),
  revolutions: z.number().optional(),
  amplitude: z.number().optional(),
  axis: z.enum(['x', 'y', 'z']).optional(),
  window: z.tuple([z.number(), z.number()]).optional(),
  phaseSpread: z.number().optional(),
});

const partSchema = z.object({
  id: z.string(),
  parent: z.string().optional(),
  shape: z.string(),
  params: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])).optional(),
  offset: z.tuple([z.number(), z.number(), z.number()]).optional(),
  count: z.number().int().positive().optional(),
  radius: z.number().optional(),
  spread: z.number().optional(),
  seats: z.number().int().nonnegative().optional(),
  level: z.boolean().optional(),
  pendulum: z.number().optional(),
  chain: z.number().optional(),
  facing: z.enum(['out', 'in', 'tangent', 'fixed']).optional(),
  animate: z.record(z.string(), curveSchema).optional(),
  color: z.string().optional(),
  accent: z.string().optional(),
});

const rigSchema = z.object({
  id: z.string(),
  extends: z.string().optional(),
  parts: z.array(partSchema).min(1),
});

const CHANNELS: readonly Channel[] = ['yaw', 'pitch', 'roll', 'tilt', 'x', 'y', 'z'];

// ── presets: what a `procedural` generator name means ───────────────────────────────────────
/**
 * The context a preset sizes itself from.
 *
 * A preset is not a fixed model: it reads the ride's own footprint and the radius its CHILDREN sit
 * at, so `carousel-base` under a 14 m ride and under a 22 m one are different drums out of one
 * record, and a ferris rim is exactly as wide as the gondolas hanging off it.
 */
export interface RigFit {
  /** Half the shorter footprint side, metres. */
  half: number;
  /** Half the longer side. */
  halfLong: number;
  capacity: number;
  /** The largest `radius` any child part of this one declares, if any. */
  childRadius: number | null;
  palette: RigPalette;
}

export interface RigPalette {
  primary: string;
  secondary: string;
  trim: string;
  accent: string;
  bulb: string;
}

const DEFAULT_PALETTE: RigPalette = {
  primary: '#b04a3c',
  secondary: '#e8dcc4',
  trim: '#2f3a44',
  accent: '#d9a441',
  bulb: '#ffe6b0',
};

type Preset = (fit: RigFit) => Array<Partial<RigPartSpec> & { shape: ShapeName }>;

/**
 * The built-in generator library.
 *
 * These names are the ones `core-classic` and `neon-lagoon` write in their `rigs` entries. Every
 * entry expands to one or more parts; the FIRST inherits the manifest part's id, parent, count,
 * radius, seats and animation, and the rest are drawn as its children — which is how "a carousel's
 * base is a plinth and a centre pole" is one manifest part and two shapes.
 */
const PRESETS: Record<string, Preset> = {
  // ── carousel ──
  'carousel-base': (f) => [
    {
      shape: 'drum',
      offset: [0, 0, 0],
      params: {
        radius: f.half * 0.94,
        height: 0.62,
        sides: 24,
        skirt: 0.55,
        panels: true,
        rim: true,
        color: f.palette.primary,
        accent: f.palette.secondary,
        trim: f.palette.accent,
      },
    },
    {
      shape: 'mast',
      offset: [0, 0.62, 0],
      params: {
        height: f.half * 0.62 + 1.4,
        radius: 0.3,
        radiusTop: 0.24,
        bands: 3,
        sides: 12,
        color: f.palette.secondary,
        trim: f.palette.accent,
      },
    },
  ],
  'carousel-platform': (f) => [
    {
      shape: 'drum',
      offset: [0, 0.62, 0],
      params: {
        radius: f.half * 0.9,
        height: 0.16,
        sides: 24,
        panels: true,
        rim: true,
        color: f.palette.secondary,
        accent: f.palette.primary,
        trim: f.palette.accent,
      },
    },
  ],
  'carousel-horse': (f) => [
    {
      shape: 'horse',
      offset: [0, 0.16, 0],
      facing: 'tangent',
      params: {
        scale: 0.9,
        poleHeight: f.half * 0.62 + 0.6,
        color: '#f2ede1',
        accent: '#3a2b22',
        trim: f.palette.primary,
        pole: f.palette.accent,
      },
    },
  ],
  'carousel-canopy': (f) => [
    {
      shape: 'canopy',
      offset: [0, f.half * 0.62 + 2.0, 0],
      params: {
        radius: f.half * 0.98,
        rise: 1.45,
        sides: 16,
        hub: 0.55,
        valance: 0.6,
        panels: true,
        bulbs: true,
        color: f.palette.primary,
        accent: f.palette.secondary,
        trim: f.palette.accent,
        bulb: f.palette.bulb,
      },
    },
  ],
  // ── ferris wheel ──
  'ferris-frame': (f) => {
    // A wheel's tower splays in the plane of the wheel seen face-on and across it at the base: four
    // feet, not two, which is what a transportable Riesenrad stands on and what stops the frame
    // reading as a cardboard cutout from the `ground` camera.
    const height = (f.childRadius ?? f.halfLong * 0.82) + 1.6;
    return [
      {
        shape: 'frame',
        params: {
          span: height * 1.12,
          spanZ: height * 0.42,
          height,
          depth: 0.5,
          axis: 'x',
          legs: 4,
          braces: 4,
          color: f.palette.primary,
          pad: '#9aa0a6',
        },
      },
    ];
  },
  'ferris-wheel-rim': (f) => [
    {
      shape: 'rim',
      params: {
        radius: f.childRadius ?? f.halfLong * 0.82,
        tube: 0.24,
        segments: 32,
        spokes: 16,
        width: 2.1,
        hub: 0.95,
        plane: 'xy',
        color: f.palette.secondary,
        trim: f.palette.accent,
      },
    },
  ],
  'ferris-gondola': (f) => [
    {
      shape: 'gondola',
      level: true,
      pendulum: 0.85,
      facing: 'fixed',
      params: {
        seats: 3,
        width: 2.1,
        depth: 1.7,
        height: 1.9,
        drop: 1.55,
        roof: true,
        hanger: true,
        restraint: 'lap',
        ringPlane: 'xy',
        yaw: Math.PI / 2,
        color: f.palette.primary,
        trim: f.palette.secondary,
        accent: '#22262c',
        accent2: f.palette.accent,
      },
    },
  ],
  // ── chair swing / wave swinger ──
  'swing-tower': (f) => [
    {
      shape: 'drum',
      offset: [0, 0, 0],
      params: {
        radius: 1.45,
        height: 1.1,
        sides: 12,
        panels: true,
        rim: true,
        color: f.palette.primary,
        accent: f.palette.secondary,
        trim: f.palette.accent,
      },
    },
    {
      shape: 'mast',
      offset: [0, 1.1, 0],
      params: {
        height: 9.4,
        radius: 0.46,
        radiusTop: 0.3,
        bands: 4,
        sides: 12,
        color: f.palette.secondary,
        trim: f.palette.accent,
      },
    },
  ],
  'swing-crown': (f) => [
    {
      shape: 'canopy',
      params: {
        radius: (f.childRadius ?? f.half * 0.7) * 0.95,
        rise: 1.15,
        sides: 16,
        hub: 0.6,
        valance: 0.42,
        panels: true,
        bulbs: true,
        color: f.palette.primary,
        accent: f.palette.secondary,
        trim: f.palette.accent,
        bulb: f.palette.bulb,
      },
    },
    {
      shape: 'lights',
      offset: [0, -0.1, 0],
      params: {
        radius: (f.childRadius ?? f.half * 0.7) * 0.99,
        count: 32,
        bulb: 0.085,
        color: f.palette.bulb,
      },
    },
  ],
  'swing-chair': (f) => [
    {
      shape: 'chair',
      chain: 3.4,
      facing: 'tangent',
      params: {
        chainLength: 3.4,
        chains: 2,
        width: 0.54,
        back: 0.52,
        color: f.palette.accent,
        trim: '#cdd3d8',
      },
    },
  ],
  'wave-base': (f) => [
    {
      shape: 'drum',
      offset: [0, 0, 0],
      params: {
        radius: 1.7,
        height: 1.3,
        sides: 12,
        panels: true,
        rim: true,
        color: f.palette.primary,
        accent: f.palette.secondary,
        trim: f.palette.trim,
      },
    },
    {
      shape: 'mast',
      offset: [0, 1.3, 0],
      params: {
        height: 8.2,
        radius: 0.5,
        radiusTop: 0.32,
        bands: 4,
        sides: 12,
        color: f.palette.secondary,
        trim: f.palette.trim,
      },
    },
  ],
  'wave-crown': (f) => [
    {
      shape: 'canopy',
      params: {
        radius: (f.childRadius ?? f.half * 0.7) * 1.02,
        rise: 1.0,
        sides: 18,
        hub: 0.62,
        valance: 0.45,
        panels: true,
        bulbs: true,
        color: f.palette.primary,
        accent: f.palette.secondary,
        trim: f.palette.trim,
        bulb: f.palette.secondary,
      },
    },
    {
      shape: 'lights',
      offset: [0, -0.12, 0],
      params: {
        radius: (f.childRadius ?? f.half * 0.7) * 1.06,
        count: 36,
        bulb: 0.09,
        color: f.palette.trim,
      },
    },
  ],
  // ── top spin ──
  'topspin-columns': (f) => {
    const height = 8;
    const tower = {
      shape: 'frame' as ShapeName,
      params: { span: 4.4, height, depth: 0.5, axis: 'z', braces: 3, color: f.palette.primary },
    };
    return [
      { ...tower, offset: [-f.halfLong * 0.55, 0, 0] },
      { ...tower, offset: [f.halfLong * 0.55, 0, 0] },
      {
        shape: 'box',
        offset: [0, height, 0],
        params: { sx: f.halfLong * 1.1, sy: 0.42, sz: 0.42, centred: true, color: f.palette.trim },
      },
    ];
  },
  'topspin-arms': (f) => {
    const a = {
      shape: 'arm' as ShapeName,
      params: {
        length: 5.5,
        width: 0.62,
        depth: 0.62,
        truss: true,
        color: f.palette.accent,
        trim: '#8d949b',
      },
    };
    return [
      { ...a, offset: [-f.halfLong * 0.55, 0, 0] },
      { ...a, offset: [f.halfLong * 0.55, 0, 0] },
    ];
  },
  'topspin-gondola': (f) => {
    const seats = Math.max(4, Math.round(f.capacity / 2));
    const row = {
      shape: 'gondola' as ShapeName,
      params: {
        seats,
        width: f.halfLong * 1.35,
        depth: 1.45,
        height: 1.7,
        drop: 0,
        open: false,
        openFront: true,
        restraint: 'shoulder',
        hanger: false,
        color: f.palette.primary,
        trim: f.palette.secondary,
        accent: '#22262c',
        restraintColor: f.palette.accent,
      },
    };
    return [
      { ...row, offset: [0, 0, 0.85] },
      { ...row, offset: [0, 0, -0.85], params: { ...row.params, yaw: Math.PI } },
    ];
  },
  // ── generic aliases, for a pack that wants a shape by a friendly name ──
  platform: (f) => PRESETS['carousel-platform'](f),
  canopy: (f) => PRESETS['carousel-canopy'](f),
  chair: (f) => PRESETS['swing-chair'](f),
  gondola: (f) => PRESETS['ferris-gondola'](f),
  horse: (f) => PRESETS['carousel-horse'](f),
  tower: (f) => PRESETS['swing-tower'](f),
  wheel: (f) => PRESETS['ferris-wheel-rim'](f),
  cup: (f) => [
    {
      shape: 'drum',
      facing: 'fixed',
      params: {
        radius: 1.15,
        radiusTop: 1.32,
        height: 1.1,
        sides: 14,
        hollow: true,
        panels: true,
        rim: true,
        color: f.palette.primary,
        accent: f.palette.secondary,
        trim: f.palette.accent,
      },
    },
  ],
};

export function presetNames(): string[] {
  return Object.keys(PRESETS);
}

// ── registration ────────────────────────────────────────────────────────────────────────────
/** Pack-declared rigs, keyed `pack:id` and by bare id for a `rigs`-style reference. */
const packRigs = new Map<string, RideRigSpec>();
const warned = new Set<string>();

function warnOnce(key: string, message: string): void {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[game/rides] ${message}`);
}

export function resetRideContent(): void {
  packRigs.clear();
  warned.clear();
}

function registerRigsFromPack(pack: PackManifest): void {
  const raw = (pack as unknown as Record<string, unknown>)[RIG_CATEGORY];
  if (!Array.isArray(raw)) return;
  for (const entry of raw) {
    const parsed = rigSchema.safeParse(entry);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      warnOnce(
        `rig:${pack.id}:${issue.path.join('.')}`,
        `pack "${pack.id}" rideRigs.${issue.path.join('.')}: ${issue.message} — entry skipped`
      );
      continue;
    }
    const spec = normalise(parsed.data);
    packRigs.set(`${pack.id}:${spec.id}`, spec);
    if (!packRigs.has(spec.id)) packRigs.set(spec.id, spec);
  }
}

function normalise(raw: z.infer<typeof rigSchema>): RideRigSpec {
  return {
    id: raw.id,
    extends: raw.extends,
    parts: raw.parts.map((p) => {
      const animate: Partial<Record<Channel, CurveSpec>> = {};
      for (const [key, value] of Object.entries(p.animate ?? {})) {
        if ((CHANNELS as readonly string[]).includes(key))
          animate[key as Channel] = value as CurveSpec;
        else warnOnce(`chan:${key}`, `unknown animation channel "${key}" — ignored`);
      }
      return {
        ...p,
        shape: (isShapeName(p.shape) ? p.shape : 'drum') as ShapeName,
        animate: Object.keys(animate).length ? animate : undefined,
      } as RigPartSpec;
    }),
  };
}

/**
 * Claim the category and read every pack, present and future.
 *
 * Returns the detach. Called by BOTH halves of the module — the sim needs seat counts and cycle
 * splits, the renderer needs the geometry — and it is idempotent per registry because
 * `registerPackCategory` throws only when a DIFFERENT owner claims the same key.
 */
export function attachRideContent(registry: Registry): () => void {
  try {
    registry.registerPackCategory(RIG_CATEGORY, 'rides');
  } catch (error) {
    warnOnce('category', `could not claim "${RIG_CATEGORY}": ${String(error)}`);
  }
  for (const pack of registry.packs()) registerRigsFromPack(pack);
  return registry.onPack((pack) => registerRigsFromPack(pack));
}

// ── resolution ──────────────────────────────────────────────────────────────────────────────
/** The default split of a cycle. Load is the long half of a fairground ride's day. */
export const DEFAULT_SPLIT: CycleSplit = { load: 0.3, dispatch: 0.06, run: 0.5, unload: 0.14 };

function paletteFor(registry: Registry, def: RideDef, packId: string): RigPalette {
  const themeId = typeof def.theme === 'string' ? def.theme : null;
  if (!themeId) return DEFAULT_PALETTE;
  const theme = registry.theme(`${packId}:${themeId}`) ?? registry.theme(themeId);
  const p = theme?.palette as Record<string, string> | undefined;
  if (!p) return DEFAULT_PALETTE;
  return {
    primary: p.primary ?? DEFAULT_PALETTE.primary,
    secondary: p.secondary ?? DEFAULT_PALETTE.secondary,
    trim: p.trim ?? DEFAULT_PALETTE.trim,
    accent: p.accent ?? DEFAULT_PALETTE.accent,
    bulb: p.accent ?? DEFAULT_PALETTE.bulb,
  };
}

interface CoreRigPart {
  id?: string;
  parent?: string;
  procedural?: string;
  mesh?: string;
  offset?: [number, number, number];
  count?: number;
  radius?: number;
  seats?: number;
  animate?: Record<string, CurveSpec>;
}

/**
 * Expand one core `rigs` part through the preset library.
 *
 * The first shape keeps the manifest part's identity — its id, its parent, its count, its radius,
 * its seats and its animation — and any further shapes become children of it, which is what lets
 * "a base is a plinth and a centre pole" stay one manifest entry.
 */
function expandPreset(part: CoreRigPart, index: number, fit: RigFit): RigPartSpec[] {
  const id = part.id ?? `part-${index}`;
  const name = part.procedural ?? '';
  const preset = PRESETS[name];
  if (!preset) {
    if (name)
      warnOnce(
        `preset:${name}`,
        `no generator "${name}" — falling back to a shape derived from the part`
      );
    return [derivePart(part, id, fit)];
  }
  const shapes = preset(fit);
  const animate: Partial<Record<Channel, CurveSpec>> = {};
  for (const [key, value] of Object.entries(part.animate ?? {})) {
    if ((CHANNELS as readonly string[]).includes(key)) animate[key as Channel] = value;
  }
  const [head, ...rest] = shapes;
  const out: RigPartSpec[] = [
    {
      id,
      parent: part.parent,
      shape: head.shape,
      params: head.params,
      offset: part.offset ?? head.offset,
      count: part.count,
      radius: part.radius ?? head.radius,
      spread: head.spread,
      seats: part.seats ?? head.seats,
      level: head.level,
      pendulum: head.pendulum,
      chain: head.chain,
      facing: head.facing,
      animate: Object.keys(animate).length ? animate : head.animate,
      color: head.color,
      accent: head.accent,
    },
  ];
  rest.forEach((extra, i) => {
    out.push({
      id: `${id}__${i + 2}`,
      parent: part.parent,
      shape: extra.shape,
      params: extra.params,
      offset: addOffset(part.offset, extra.offset),
      radius: extra.radius,
      facing: extra.facing,
      level: extra.level,
      pendulum: extra.pendulum,
      chain: extra.chain,
    });
  });
  return out;
}

function addOffset(
  a: [number, number, number] | undefined,
  b: [number, number, number] | undefined
): [number, number, number] | undefined {
  if (!a) return b;
  if (!b) return a;
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

/** A part whose generator nobody knows: guess from its own shape hints rather than draw nothing. */
function derivePart(part: CoreRigPart, id: string, fit: RigFit): RigPartSpec {
  const seated = (part.seats ?? 0) > 0;
  const shape: ShapeName = seated ? 'gondola' : (part.radius ?? 0) > 0 ? 'rim' : 'drum';
  return {
    id,
    parent: part.parent,
    shape,
    offset: part.offset,
    count: part.count,
    radius: part.radius,
    seats: part.seats,
    params:
      shape === 'gondola'
        ? {
            seats: Math.max(1, part.seats ?? 2),
            color: fit.palette.primary,
            trim: fit.palette.secondary,
          }
        : shape === 'rim'
          ? { radius: part.radius ?? fit.half * 0.8, plane: 'xy', color: fit.palette.secondary }
          : {
              radius: fit.half * 0.8,
              height: 0.8,
              sides: 20,
              color: fit.palette.primary,
              accent: fit.palette.secondary,
            },
  };
}

/** A rig for a ride nothing declared one for: a platform, a canopy and a ring of cars. */
function fallbackRig(def: FlatRideDef, fit: RigFit): RideRigSpec {
  const cars = Math.max(4, Math.min(16, Math.round(def.capacity / 3)));
  const radius = fit.half * 0.62;
  return {
    id: `fallback:${def.id}`,
    parts: [
      ...expandPreset({ id: 'base', procedural: 'carousel-base' }, 0, fit),
      ...expandPreset(
        {
          id: 'platform',
          parent: 'base',
          procedural: 'carousel-platform',
          animate: { yaw: { curve: 'ease-in-out', revolutions: 8 } },
        },
        1,
        { ...fit, childRadius: radius }
      ),
      ...expandPreset(
        {
          id: 'cars',
          parent: 'platform',
          procedural: 'ferris-gondola',
          count: cars,
          radius,
          seats: Math.ceil(def.capacity / cars),
        },
        2,
        fit
      ),
      ...expandPreset({ id: 'canopy', parent: 'base', procedural: 'carousel-canopy' }, 3, fit),
    ],
  };
}

/** Every part's largest child radius, for the presets that size themselves off their children. */
function childRadiusOf(parts: CoreRigPart[], id: string | undefined): number | null {
  let best: number | null = null;
  for (const p of parts) {
    if (p.parent !== id) continue;
    if (typeof p.radius === 'number' && (best == null || p.radius > best)) best = p.radius;
  }
  return best;
}

/**
 * Resolve one flat ride into everything both halves of the module need.
 *
 * A pack's own `rideRigs` entry wins over the core `rigs` entry of the same id, which is what lets
 * a theme pack restyle a base ride without a code change and is the same precedence `shops` gives
 * its styles.
 */
export function resolveFlatRide(
  registry: Registry,
  packId: string,
  itemId: string
): FlatRideProfile | null {
  const item = registry.find('rides', packId, itemId);
  const def = item?.def;
  if (!def || def.kind !== 'flat') return null;
  const flat = def as FlatRideDef;
  const palette = paletteFor(registry, flat, packId);
  const footprint: [number, number] = [flat.footprint[0], flat.footprint[1]];
  const half = Math.min(footprint[0], footprint[1]) / 2;
  const halfLong = Math.max(footprint[0], footprint[1]) / 2;

  const declared = packRigs.get(`${packId}:${flat.rig}`) ?? packRigs.get(flat.rig);
  let rig: ResolvedRig;
  if (declared) {
    const base = declared.extends
      ? (packRigs.get(`${packId}:${declared.extends}`) ?? packRigs.get(declared.extends))
      : undefined;
    const parts = base ? mergeParts(base.parts, declared.parts) : declared.parts;
    rig = { id: declared.id, parts, key: `${packId}:${declared.id}`, source: 'pack' };
  } else {
    const core = registry.find('rigs', packId, flat.rig) ?? registry.item('rigs', flat.rig);
    const coreParts = (core?.def.parts ?? []) as CoreRigPart[];
    if (coreParts.length) {
      const parts: RigPartSpec[] = [];
      coreParts.forEach((p, i) => {
        const fit: RigFit = {
          half,
          halfLong,
          capacity: flat.capacity,
          childRadius: childRadiusOf(coreParts, p.id),
          palette,
        };
        parts.push(...expandPreset(p, i, fit));
      });
      rig = {
        id: flat.rig,
        parts,
        key: core ? core.key : `builtin:${flat.rig}`,
        source: 'builtin',
      };
    } else {
      warnOnce(
        `rig:${packId}:${flat.rig}`,
        `ride "${packId}:${flat.id}" names rig "${flat.rig}", which no pack declares — drawing a generic machine`
      );
      const fit: RigFit = { half, halfLong, capacity: flat.capacity, childRadius: null, palette };
      const spec = fallbackRig(flat, fit);
      rig = { id: spec.id, parts: spec.parts, key: `fallback:${flat.rig}`, source: 'fallback' };
    }
  }

  // Seats off the LAYOUT, never off the part list: `count` is per parent unit, so a teacup's four
  // cups on three platters are twelve, and summing `count × seats` over the parts said four.
  const rigSeats = rigLayout({ ...rig }).seats;

  /**
   * Hard standing, unless the rig lays its own.
   *
   * Every prop grounds (ART_BIBLE): a machine standing on a lawn with nothing under it reads as
   * dropped rather than installed, which is the same finding `shops` records about its aprons.
   *
   * It is sized off what actually TOUCHES THE GROUND, not off the footprint, and the difference is
   * a frame: a chair swing's plot is 22 m because its seats fly out over it, while the machine on
   * the ground is a 1.45 m drum — the first version paved the footprint and the `close` camera came
   * back with a 24 m slab of tarmac under a 3 m base. Parts sitting within 1.4 m of grade decide
   * it, plus 1.8 m of standing room, capped at the plot.
   *
   * A pack that wants none declares a part called `apron` itself.
   */
  if (!rig.parts.some((p) => p.id === 'apron')) {
    // The height a part sits at is the SUM down its parent chain, not its own offset: a chair
    // swing's seats declare no offset of their own and hang off a crown nine metres up, so reading
    // the local number paved a 20 m circle for a machine that touches the ground over three.
    const heightOf = (id: string | undefined, guard = 0): number => {
      if (!id || guard > 8) return 0;
      const part = rig.parts.find((q) => q.id === id);
      if (!part) return 0;
      return (part.offset?.[1] ?? 0) + heightOf(part.parent, guard + 1);
    };
    let ground = 0;
    for (const part of rig.parts) {
      if (heightOf(part.id) > 1.4) continue;
      const q = part.params ?? {};
      const n = (k: string) => (typeof q[k] === 'number' ? (q[k] as number) : 0);
      ground = Math.max(
        ground,
        part.radius ?? 0,
        n('radius'),
        n('radiusTop'),
        n('span') / 2,
        n('spanZ') / 2,
        n('sx') / 2
      );
    }
    const apronRadius = Math.min(
      Math.max(2.6, ground + 1.8),
      Math.max(half, halfLong * 0.72) + 0.9
    );
    rig = {
      ...rig,
      parts: [
        {
          id: 'apron',
          shape: 'drum',
          offset: [0, -0.06, 0],
          params: {
            radius: apronRadius,
            height: 0.14,
            sides: 28,
            finish: 'matte',
            color: '#9ba1a6',
            accent: '#8d9398',
            panels: true,
          },
        },
        ...rig.parts,
      ],
    };
  }

  return {
    key: `${packId}:${flat.id}`,
    name: flat.name,
    capacity: flat.capacity,
    cycleMinutes: flat.cycleMinutes,
    split: DEFAULT_SPLIT,
    footprint,
    excitement: flat.excitement ?? 3,
    fear: flat.fear ?? 1,
    nausea: flat.nausea ?? 1,
    minHeightCm: flat.minHeightCm ?? null,
    price: 0,
    upkeep: flat.upkeep,
    power: flat.power,
    mtbfMinutes: mtbfFor(flat),
    queueSide: flat.queueSide ?? 0,
    rig,
    rigSeats,
    night: nightOf(flat),
  };
}

/**
 * Mean park minutes between breakdowns, derived from the machine rather than authored.
 *
 * A top spin has hydraulics, a shoulder restraint per seat and a gondola that inverts; a carousel
 * has one motor and a slip ring. That is why fairground operators budget maintenance by intensity,
 * and it is the only honest way to get a number here without a `reliability` field the bundled
 * packs do not have. A pack can still say so directly: `params` is not the place, so this is a
 * request rather than a hack (see `docs/game/requests/rides.md` §2).
 */
function mtbfFor(def: FlatRideDef): number {
  const intensity = (def.excitement ?? 3) * 0.5 + (def.fear ?? 1) * 0.3 + (def.nausea ?? 1) * 0.2;
  // 3000 park minutes (about two and a half park days) for a carousel down to ~700 for a top spin.
  return Math.round(3200 / (1 + intensity * 0.55));
}

function nightOf(def: FlatRideDef): NightRig | null {
  const light = def.night?.light;
  if (!light) return null;
  return {
    color: light.color,
    intensity: light.intensity,
    height: light.height ?? 6,
    range: light.range ?? 18,
    mode: light.mode ?? 'steady',
    colors: light.colors ?? [light.color],
  };
}

function mergeParts(base: RigPartSpec[], over: RigPartSpec[]): RigPartSpec[] {
  const out = base.map((p) => ({ ...p }));
  for (const p of over) {
    const at = out.findIndex((q) => q.id === p.id);
    if (at >= 0) out[at] = { ...out[at], ...p };
    else out.push(p);
  }
  return out;
}

/** Every flat ride any registered pack declares, in registration order. */
export function flatRides(registry: Registry): FlatRideProfile[] {
  const out: FlatRideProfile[] = [];
  for (const item of registry.items('rides')) {
    if ((item.def as RideDef).kind !== 'flat') continue;
    const profile = resolveFlatRide(registry, item.pack, (item.def as RideDef).id);
    if (profile) out.push(profile);
  }
  return out;
}
