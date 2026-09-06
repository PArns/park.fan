/**
 * The element table: every named piece of coaster vocabulary, as DATA.
 *
 * A track element is an id, a parameter sheet and a list of ops (`ops.ts`) whose arguments are
 * expressions over those parameters (`expr.ts`). There is no `switch (element.id)` anywhere in
 * this module and there cannot be one: `buildTrack` looks the id up in this registry and runs the
 * ops it finds. Adding a "dive drop" is an entry in a table — from here, from a caller through
 * `registerTrackElement`, or from a content pack through `registerTrackElementsFromPack`.
 *
 * **Why the catalogue lives here and not in `pack.json`.** `core/pack-schema.ts` has a
 * `trackStyles` category (rails, ties, spine, supports, colour) and no category for element
 * geometry, and core is not this module's to edit. So the STYLES come from the packs — that half
 * is already data-driven through the registry — and the elements come from this table, with
 * `registerTrackElementsFromPack` reading a `trackElements` array off any manifest that carries
 * one so a pack can ship elements the day core adds the field. The request, with the schema it
 * would take, is in `docs/game/requests/track.md`.
 *
 * The numbers in the defaults are not invented. Chain lifts on classic coasters run at 20–30°
 * (Coaster101, "Coasters-101: Lift Hills"); a vertical loop holds a roughly constant centripetal
 * load of about 3–3.5 g, which is what makes it a teardrop rather than a circle (Stengel, 1976 —
 * see the `loop` op); airtime hills are shaped by the g they are meant to give, not by a radius.
 */

import type { Expr } from './expr';
import type { DriveKind } from './types';

export type ElementCategory =
  'station' | 'lift' | 'drop' | 'straight' | 'turn' | 'hill' | 'inversion' | 'brake' | 'special';

export interface ElementParamDef {
  default: number;
  min?: number;
  max?: number;
  /** For a build panel: `m`, `deg`, `g`, `m/s`, `turns`, `±1`. */
  unit?: string;
}

export interface ElementOpDef {
  op: string;
  args: Record<string, Expr>;
}

export interface TrackElementDef {
  id: string;
  /** English label. The game's i18n lives in `lib/game/i18n`; see the requests doc. */
  name: string;
  category: ElementCategory;
  params: Record<string, ElementParamDef>;
  ops: ElementOpDef[];
  /** What this element does to a train that is on it. */
  drive?: { kind: DriveKind; speed?: Expr };
  /** One line for a tooltip and for the module report. */
  note?: string;
}

const REGISTRY = new Map<string, TrackElementDef>();

export function registerTrackElement(def: TrackElementDef): TrackElementDef {
  if (!def.id || !Array.isArray(def.ops)) {
    throw new Error('track element: needs an id and an ops list');
  }
  REGISTRY.set(def.id, def);
  return def;
}

export function trackElement(id: string): TrackElementDef | undefined {
  return REGISTRY.get(id);
}

export function trackElements(category?: ElementCategory): TrackElementDef[] {
  const all = [...REGISTRY.values()];
  return category ? all.filter((e) => e.category === category) : all;
}

/**
 * Register any `trackElements` a content pack carries.
 *
 * Nothing in `packManifestSchema` produces this field today, so on the two bundled packs it is a
 * no-op — which is the point: the seam is here and wired, so the day core adds the category the
 * only change is in core. A pack that ships one now (through `loadPackFromUrl`, whose JSON zod
 * simply passes unknown keys through) works already.
 */
export function registerTrackElementsFromPack(manifest: unknown): number {
  const list = (manifest as { trackElements?: unknown }).trackElements;
  if (!Array.isArray(list)) return 0;
  let count = 0;
  for (const entry of list) {
    const def = entry as TrackElementDef;
    if (!def || typeof def.id !== 'string' || !Array.isArray(def.ops)) {
      throw new Error(`track element: bad entry in pack "${(manifest as { id?: string }).id}"`);
    }
    registerTrackElement({
      ...def,
      params: def.params ?? {},
      category: def.category ?? 'special',
      name: def.name ?? def.id,
    });
    count += 1;
  }
  return count;
}

/** Resolve an element's parameters against its defaults, clamped to the declared range. */
export function resolveParams(
  def: TrackElementDef,
  given: Record<string, number> | undefined
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of Object.keys(def.params)) {
    const spec = def.params[key];
    const raw = given?.[key];
    const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : spec.default;
    out[key] = Math.min(spec.max ?? Infinity, Math.max(spec.min ?? -Infinity, value));
  }
  return out;
}

// ── the catalogue ─────────────────────────────────────────────────────────────────────────
const CATALOGUE: TrackElementDef[] = [
  {
    id: 'station',
    name: 'Station',
    category: 'station',
    note: 'Level and unbanked. 22 m holds a seven-car train with a platform either end.',
    params: { length: { default: 22, min: 8, max: 60, unit: 'm' } },
    ops: [
      { op: 'bank', args: { angle: 0, length: 3 } },
      { op: 'straight', args: { length: '$length - 3' } },
    ],
    drive: { kind: 'station', speed: 0 },
  },
  {
    id: 'transport',
    name: 'Transport section',
    category: 'station',
    note: 'Friction wheels at walking pace: the approach to a lift, or the crawl out of a station.',
    params: {
      length: { default: 12, min: 2, max: 80, unit: 'm' },
      speed: { default: 2, min: 0.5, max: 6, unit: 'm/s' },
    },
    ops: [{ op: 'straight', args: { length: '$length' } }],
    drive: { kind: 'transport', speed: '$speed' },
  },
  {
    id: 'lift-hill',
    name: 'Chain lift',
    category: 'lift',
    note: 'Classic chain lifts sit at 20–30°; the straight is measured so the crest lands on $height.',
    params: {
      height: { default: 30, min: 4, max: 90, unit: 'm' },
      angle: { default: 28, min: 10, max: 60, unit: 'deg' },
      radius: { default: 20, min: 8, max: 60, unit: 'm' },
      speed: { default: 3, min: 0.5, max: 8, unit: 'm/s' },
    },
    ops: [
      {
        op: 'ramp',
        args: { height: '$height', angle: '$angle', entryRadius: '$radius', exitRadius: '$radius' },
      },
    ],
    drive: { kind: 'lift', speed: '$speed' },
  },
  {
    id: 'launch',
    name: 'Launch',
    category: 'lift',
    note: 'A level straight the train is accelerated along to $speed.',
    params: {
      length: { default: 70, min: 15, max: 300, unit: 'm' },
      speed: { default: 28, min: 6, max: 70, unit: 'm/s' },
    },
    ops: [{ op: 'straight', args: { length: '$length' } }],
    drive: { kind: 'launch', speed: '$speed' },
  },
  {
    id: 'drop',
    name: 'Drop',
    category: 'drop',
    note: 'Crest radius, straight fall, pull-out radius; the pull-out is what sets the bottom g.',
    params: {
      height: { default: 30, min: 3, max: 90, unit: 'm' },
      angle: { default: 52, min: 10, max: 89, unit: 'deg' },
      crestRadius: { default: 22, min: 6, max: 80, unit: 'm' },
      pullout: { default: 30, min: 8, max: 150, unit: 'm' },
    },
    ops: [
      {
        op: 'ramp',
        args: {
          height: '-$height',
          angle: '$angle',
          entryRadius: '$crestRadius',
          exitRadius: '$pullout',
        },
      },
    ],
  },
  {
    id: 'straight',
    name: 'Straight',
    category: 'straight',
    params: { length: { default: 20, min: 1, max: 300, unit: 'm' } },
    ops: [{ op: 'straight', args: { length: '$length' } }],
  },
  {
    id: 'level',
    name: 'Level out',
    category: 'straight',
    note: 'Rolls the bank back to zero — what a station approach needs and a brake run assumes.',
    params: { length: { default: 16, min: 2, max: 80, unit: 'm' } },
    ops: [{ op: 'bank', args: { angle: 0, length: '$length' } }],
  },
  {
    id: 'slope',
    name: 'Graded straight',
    category: 'straight',
    note: 'Down (or up) a grade and back to level; the way a layout loses a few metres.',
    params: {
      angle: { default: -12, min: -70, max: 70, unit: 'deg' },
      length: { default: 30, min: 2, max: 200, unit: 'm' },
      radius: { default: 45, min: 10, max: 200, unit: 'm' },
    },
    ops: [
      { op: 'pitch', args: { angle: '$angle', radius: '$radius' } },
      { op: 'straight', args: { length: '$length' } },
      { op: 'pitch', args: { angle: '-$angle', radius: '$radius' } },
    ],
  },
  {
    id: 'curve',
    name: 'Banked curve',
    category: 'turn',
    note: 'Banked to cancel the lateral force at the speed the train really carries here.',
    params: {
      angle: { default: 90, min: -270, max: 270, unit: 'deg' },
      radius: { default: 22, min: 5, max: 200, unit: 'm' },
      bankFactor: { default: 1, min: 0, max: 1.2 },
    },
    ops: [{ op: 'turn', args: { angle: '$angle', radius: '$radius', bankFactor: '$bankFactor' } }],
  },
  {
    id: 'turnaround',
    name: 'Turnaround',
    category: 'turn',
    params: {
      radius: { default: 26, min: 6, max: 120, unit: 'm' },
      hand: { default: 1, min: -1, max: 1, unit: '±1' },
      bankFactor: { default: 1, min: 0, max: 1.2 },
    },
    ops: [
      { op: 'turn', args: { angle: '180*$hand', radius: '$radius', bankFactor: '$bankFactor' } },
    ],
  },
  {
    id: 'overbank',
    name: 'Overbanked turn',
    category: 'turn',
    note: 'Past 90°, so the rider is looking down the outside of the curve. Bank is explicit.',
    params: {
      angle: { default: 120, min: -270, max: 270, unit: 'deg' },
      radius: { default: 26, min: 8, max: 120, unit: 'm' },
      bank: { default: 100, min: 60, max: 135, unit: 'deg' },
    },
    ops: [{ op: 'turn', args: { angle: '$angle', radius: '$radius', bank: '$bank' } }],
  },
  {
    id: 's-bend',
    name: 'S-bend',
    category: 'turn',
    note: 'Two opposed curves that shift the track sideways and hand back the original heading.',
    params: {
      offset: { default: 14, min: 2, max: 80, unit: 'm' },
      radius: { default: 40, min: 8, max: 200, unit: 'm' },
      hand: { default: 1, min: -1, max: 1, unit: '±1' },
    },
    ops: [
      {
        op: 'turn',
        args: { angle: '$hand*deg(acos(max(-1,1-$offset/(2*$radius))))', radius: '$radius' },
      },
      {
        op: 'turn',
        args: { angle: '-$hand*deg(acos(max(-1,1-$offset/(2*$radius))))', radius: '$radius' },
      },
    ],
  },
  {
    id: 'helix',
    name: 'Helix',
    category: 'turn',
    note: 'Pitched to the helix angle, wound at a constant gradient, levelled again.',
    params: {
      turns: { default: 1.5, min: 0.25, max: 5, unit: 'turns' },
      radius: { default: 18, min: 6, max: 80, unit: 'm' },
      drop: { default: 12, min: -40, max: 40, unit: 'm' },
      hand: { default: 1, min: -1, max: 1, unit: '±1' },
      bankFactor: { default: 1, min: 0, max: 1.2 },
    },
    ops: [
      {
        op: 'pitch',
        args: { angle: '-deg(atan($drop/(2*pi()*$radius*$turns)))', radius: '$radius*1.6' },
      },
      {
        op: 'turn',
        args: { angle: '360*$turns*$hand', radius: '$radius', bankFactor: '$bankFactor' },
      },
      {
        op: 'pitch',
        args: { angle: 'deg(atan($drop/(2*pi()*$radius*$turns)))', radius: '$radius*1.6' },
      },
    ],
  },
  {
    id: 'airtime-hill',
    name: 'Airtime hill',
    category: 'hill',
    note: 'Shaped by the g it delivers over the top: 0 floats, negative is ejector.',
    params: {
      height: { default: 10, min: 1, max: 40, unit: 'm' },
      g: { default: 0, min: -1.2, max: 0.9, unit: 'g' },
      gLoad: { default: 1.6, min: 0.4, max: 3.5, unit: 'g' },
    },
    ops: [{ op: 'hill', args: { height: '$height', g: '$g', gLoad: '$gLoad' } }],
  },
  {
    id: 'bunny-hop',
    name: 'Bunny hop',
    category: 'hill',
    note: 'The short ejector hop a wooden out-and-back strings together on the way home.',
    params: {
      height: { default: 4.5, min: 1, max: 14, unit: 'm' },
      g: { default: -0.35, min: -1.2, max: 0.5, unit: 'g' },
    },
    ops: [{ op: 'hill', args: { height: '$height', g: '$g', gLoad: 2.2 } }],
  },
  {
    id: 'loop',
    name: 'Vertical loop',
    category: 'inversion',
    note: 'Clothoid: constant centripetal load, so the radius follows v² and the shape is a teardrop.',
    params: {
      /**
       * 0 means "whatever `g` produces", and that is the useful default: a loop's height is not
       * a free choice, it is what a given centripetal load and a given entry speed add up to.
       * Ask for 18 m on a train doing 24 m/s and the answer is a 13 m entry radius and 5 g.
       */
      height: { default: 0, min: 0, max: 45, unit: 'm' },
      g: { default: 3.2, min: 1.5, max: 6, unit: 'g' },
    },
    ops: [{ op: 'loop', args: { height: '$height', g: '$g' } }],
  },
  {
    id: 'corkscrew',
    name: 'Corkscrew',
    category: 'inversion',
    note: 'One rigid rotation about a fixed axis: the rider stays on the inside of the helix.',
    params: {
      radius: { default: 4.6, min: 2, max: 12, unit: 'm' },
      turns: { default: 1, min: 0.5, max: 3, unit: 'turns' },
      g: { default: 2.8, min: 1, max: 5, unit: 'g' },
      hand: { default: 1, min: -1, max: 1, unit: '±1' },
    },
    ops: [{ op: 'spin', args: { turns: '$turns', radius: '$radius', g: '$g', hand: '$hand' } }],
  },
  {
    id: 'zero-g-roll',
    name: 'Zero-g roll',
    category: 'inversion',
    note: 'A 360° roll executed over a crest held near 0 g, so the inversion costs the rider nothing.',
    params: {
      height: { default: 6, min: 1, max: 20, unit: 'm' },
      hand: { default: 1, min: -1, max: 1, unit: '±1' },
      g: { default: 0.05, min: -0.4, max: 0.6, unit: 'g' },
    },
    ops: [{ op: 'hill', args: { height: '$height', g: '$g', gLoad: 1.5, roll: '360*$hand' } }],
  },
  {
    id: 'inline-twist',
    name: 'Inline twist',
    category: 'inversion',
    note: 'A barrel roll on a straight. The roll rate is a raised cosine, never a step.',
    params: {
      turns: { default: 1, min: 0.5, max: 3, unit: 'turns' },
      length: { default: 34, min: 10, max: 120, unit: 'm' },
      hand: { default: 1, min: -1, max: 1, unit: '±1' },
    },
    ops: [{ op: 'roll', args: { angle: '360*$turns*$hand', length: '$length' } }],
  },
  {
    id: 'brake-run',
    name: 'Brake run',
    category: 'brake',
    params: {
      length: { default: 34, min: 6, max: 120, unit: 'm' },
      speed: { default: 5, min: 0, max: 25, unit: 'm/s' },
    },
    ops: [{ op: 'straight', args: { length: '$length' } }],
    drive: { kind: 'brake', speed: '$speed' },
  },
  {
    id: 'block-brake',
    name: 'Block brake',
    category: 'brake',
    note: 'A mid-course block: trims the train and holds it if the section ahead is occupied.',
    params: {
      length: { default: 24, min: 6, max: 80, unit: 'm' },
      speed: { default: 9, min: 1, max: 30, unit: 'm/s' },
    },
    ops: [{ op: 'straight', args: { length: '$length' } }],
    drive: { kind: 'block', speed: '$speed' },
  },
];

for (const def of CATALOGUE) registerTrackElement(def);
