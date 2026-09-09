/**
 * Content, not code: every slide style, tower and descent comes out of a manifest.
 *
 * Two sources, one parser — the shape `pools/manifest.ts` and `terrain/manifest.ts` established:
 *
 *  1. **A pack's `flumes` key**, claimed through `registry.registerPackCategory('flumes', 'flumes')`.
 *     Three arrays: `styles`, `towers`, `layouts`.
 *  2. **The built-in catalogue below**, which is the same JSON run through the same
 *     `registerFlumes()` a pack goes through — not a fallback path and not a `switch`. A pack that
 *     redefines `body` overwrites it by id, and anything the built-ins can say a pack can say.
 *
 * **`registry.packs()` AND `onPack`, both.** `onPack` fires on registration and the bundled packs
 * are registered at boot step 2, before any module's `main()` or `sim()` at step 5, so a listener
 * alone would see neither of them. Seven modules on this branch have now fallen into that; this one
 * is not the eighth, and `selftest.mjs` asserts a pack registered BEFORE attach and one registered
 * AFTER both land.
 *
 * ## Nothing here switches on a style id
 *
 * `flumeStyle` in `core/pack-schema.ts` is a four-way enum (`body | tube | raft | mat`) and that
 * file is not this module's to edit — so a ride entry can only name one of four. The style a flume
 * is DRAWN with is not read from there: it is the `style` of the **layout**, which is an entry in
 * this category and therefore an open string. A pack that wants a fifth kind of slide ships a
 * style and a layout that names it, and this module contains not one line about either;
 * `showcase.ts` does exactly that, live, so the claim is a picture rather than a paragraph. The
 * ride's own `flumeStyle` is used for one thing: picking the DEFAULT layout when an entity does
 * not name one. The request to open the enum is in `docs/game/requests/flumes.md`.
 *
 * ## The layouts are `track`'s elements
 *
 * A descent is a `TrackPiece[]` in the track module's own vocabulary — `drop`, `curve`, `helix`,
 * `s-bend`, `straight`. That grammar already solves the problem (clothoid transitions, an energy
 * estimate that shapes what follows, a C² spline with a roll channel), it is the highest-graded
 * thing in the project, and a slide's centreline is not a different problem from a coaster's. What
 * this module adds is the trough, the water, the tower, the vehicles and the landing.
 *
 * `bankFactor` is why this works at all: a slide is deliberately UNDER-banked, because riding up
 * the wall is the point. `resolve.ts` builds with `quick: true` so the first pass's factor stands
 * rather than being replaced by the resultant-banking pass, which would put every rider flat in
 * the bottom of the trough and turn the module into a coaster with a wet floor.
 *
 * Babylon-free and DOM-free: the worker reads this to price a slide's water and to run its riders.
 */

import { z } from 'zod';
import type { Registry } from '../core/registry';
import type { FlumeLayoutSpec, FlumeStyleSpec, FlumeTowerSpec } from './types';

/** The top-level manifest key this module owns. */
export const FLUME_CATEGORY = 'flumes';
/** The pack id the built-in catalogue is registered under. */
export const BUILTIN_PACK = 'flumes';

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const localized = z.record(z.string(), z.string());
const deg = (d: number) => (d * Math.PI) / 180;

const rigSchema = z.object({
  hull: z.enum(['none', 'ring', 'raft', 'mat']).default('none'),
  hullRadius: z.number().min(0).default(0.6),
  hullTube: z.number().min(0).default(0.18),
  seats: z.number().int().min(1).max(8).default(1),
  riderRadius: z.number().min(0.1).default(0.24),
  seatSpread: z.number().min(0).default(0),
  colors: z.array(color).min(1).default(['#ffd23f']),
  wear: z.array(color).min(1).default(['#e34b5f']),
});

const styleSchema = z.object({
  id: z.string(),
  name: localized.optional(),
  /** Degrees in the manifest, radians in the spec — the same convention `track`'s ops use. */
  wrapDeg: z.number().min(20).max(178).default(104),
  maxWrapDeg: z.number().min(20).max(178).default(160),
  wallResponse: z.number().min(0).max(1).default(1),
  floorFlat: z.number().min(0).max(0.85).default(0),
  thickness: z.number().min(0.01).max(0.4).default(0.055),
  sectionSamples: z.number().int().min(4).max(40).default(9),
  waterDepth: z.number().min(0.005).max(0.4).default(0.035),
  waterWrap: z.number().min(0.05).max(1).default(0.55),
  friction: z.number().min(0.01).max(0.5).default(0.12),
  dragArea: z.number().min(0.02).max(6).default(0.32),
  vehicleMass: z.number().min(0).default(0),
  riderMass: z.number().min(20).default(72),
  dispatchSeconds: z.number().min(2).max(180).default(12),
  entrySpeed: z.number().min(0).max(6).default(1.2),
  bankFactor: z.number().min(0).max(1).default(0.55),
  // Spelled out rather than `.default({})`: zod's default has to satisfy the OUTPUT type, and the
  // output of a schema whose every field has a default is a fully populated object.
  rig: rigSchema.default({
    hull: 'none',
    hullRadius: 0.34,
    hullTube: 0,
    seats: 1,
    riderRadius: 0.25,
    seatSpread: 0,
    colors: ['#f4f6f7'],
    wear: ['#ff2fa0'],
  }),
  shell: color.default('#eef3f5'),
  trim: color.default('#16e0c8'),
});

const towerSchema = z.object({
  id: z.string(),
  name: localized.optional(),
  footprint: z.tuple([z.number().positive(), z.number().positive()]).default([4.6, 4.6]),
  column: z.number().min(0.06).max(1).default(0.22),
  rail: z.number().min(0.6).max(1.6).default(1.05),
  stairWidth: z.number().min(0.6).max(3).default(1.15),
  flightRise: z.number().min(1).max(6).default(3.2),
  going: z.number().min(0.2).max(0.45).default(0.28),
  riser: z.number().min(0.12).max(0.24).default(0.18),
  canopy: z.boolean().default(true),
  steel: color.default('#9fb3bd'),
  deck: color.default('#5d6f79'),
  canopyColor: color.default('#16e0c8'),
});

const pieceSchema = z.object({
  element: z.string(),
  params: z.record(z.string(), z.number()).optional(),
});

const layoutSchema = z.object({
  id: z.string(),
  name: localized.optional(),
  style: z.string(),
  /**
   * Metres the tower deck stands above the ground, or **0 to derive it from the descent** — which
   * is the default and what every built-in layout uses. See `buildFlume`: a hand-written height is
   * a second number that has to agree with the drops, and it will not.
   */
  towerHeight: z.number().min(0).max(60).default(0),
  tower: z.string().default('open-steel'),
  pieces: z.array(pieceSchema).min(1),
});

export const flumesCategorySchema = z.object({
  styles: z.array(styleSchema).default([]),
  towers: z.array(towerSchema).default([]),
  layouts: z.array(layoutSchema).default([]),
});

/**
 * Parse a list of manifest entries ONE AT A TIME.
 *
 * `flumesCategorySchema.safeParse(block)` is the obvious thing and it is wrong for content: one
 * unreadable entry — a pack authored against a newer build, a typo in a number — would take the
 * whole pack's slides with it, silently, and a park would come back with a tower and no chute
 * rather than with one slide missing. Per entry, a bad one is named and skipped and everything
 * beside it still lands. Same reasoning as `pools/manifest.ts` and `Registry.unclaimedPackKeys`.
 */
function parseEach<T>(packId: string, what: string, list: unknown, schema: z.ZodType<T>): T[] {
  if (!Array.isArray(list)) return [];
  const out: T[] = [];
  list.forEach((entry, index) => {
    const parsed = schema.safeParse(entry);
    if (parsed.success) {
      out.push(parsed.data);
      return;
    }
    const id = (entry as { id?: string })?.id ?? `#${index}`;
    warnOnce(
      `entry:${packId}:${what}:${id}`,
      `pack "${packId}": ${what} "${id}" could not be read and was skipped — ` +
        parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    );
  });
  return out;
}

// ── the catalogue ───────────────────────────────────────────────────────────────────────────
const styles = new Map<string, FlumeStyleSpec>();
const towers = new Map<string, FlumeTowerSpec>();
const layouts = new Map<string, FlumeLayoutSpec>();
const warned = new Set<string>();

function warnOnce(key: string, message: string): void {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[game/flumes] ${message}`);
}

/**
 * The built-in catalogue, written as the JSON a pack would carry.
 *
 * Four styles, two towers, four descents. The references are the three manufacturers whose
 * catalogues define the form — open body slides and closed tube slides in the Wiegand/WhiteWater
 * West idiom, family rafts in the ProSlide one — and the numbers are theirs rather than invented:
 *
 *  - A body slide's flume is a **1.0-1.2 m half-pipe** (the pack's `fiberglass-open` is r = 0.5)
 *    with the shell carried past horizontal on the turns, which is the 104° at rest here. A rider
 *    hydroplanes on the sheet at an effective µ of about 0.11-0.13 and tops out at 10-14 m/s.
 *  - A closed tube slide is a **1.2 m pipe** (`fiberglass-closed`, r = 0.6) with a slot along the
 *    crown for light — 170° per side leaves 20° of it — and the section never changes, because a
 *    pipe's wall is already over the rider's head. Hence `wallResponse: 0`, which is the one entry
 *    in the table that switches the wall rule off, by DATA rather than by a branch.
 *  - A family raft trough is **2.4 m wide with a flat floor** (`fiberglass-wide`, r = 1.2): a
 *    six-seat raft is 2.6 m across and rides on the flat, not in a groove, which is what
 *    `floorFlat: 0.55` says.
 *  - A mat racer is a **wide shallow lane** with a low kerb; the rider is prone on a mat and never
 *    climbs a wall, so it wants the section a body slide has and a fraction of its wrap. No pack
 *    ships a mat ride — this entry is here so that the FIRST one costs nobody a code change.
 *
 * Dispatch intervals are the operator's: 10-14 s on a body slide, 12-16 s on a tube, 25-35 s on a
 * raft that carries five or six. Read `SLIDE_SECONDS_PER_TICK` before comparing them to the clock.
 */
const BUILTIN: unknown = {
  towers: [
    {
      id: 'open-steel',
      name: { en: 'Open steel tower', de: 'Offener Stahlturm' },
      footprint: [4.8, 4.8],
      column: 0.22,
      rail: 1.05,
      stairWidth: 1.2,
      flightRise: 3.2,
      going: 0.28,
      riser: 0.18,
      canopy: true,
      steel: '#a8bcc6',
      deck: '#4e6069',
      canopyColor: '#16e0c8',
    },
    {
      id: 'lagoon-timber',
      name: { en: 'Timber deck tower', de: 'Holzdeck-Turm' },
      footprint: [6.2, 5.4],
      column: 0.3,
      rail: 1.05,
      stairWidth: 1.35,
      flightRise: 3.6,
      going: 0.3,
      riser: 0.175,
      canopy: true,
      steel: '#8d7150',
      deck: '#9c7c52',
      canopyColor: '#ff2fa0',
    },
  ],
  styles: [
    {
      id: 'body',
      name: { en: 'Open body slide', de: 'Offene Körperrutsche' },
      wrapDeg: 62,
      maxWrapDeg: 168,
      wallResponse: 1,
      floorFlat: 0,
      thickness: 0.05,
      sectionSamples: 9,
      waterDepth: 0.03,
      waterWrap: 0.5,
      friction: 0.12,
      dragArea: 0.34,
      vehicleMass: 0,
      riderMass: 74,
      dispatchSeconds: 11,
      entrySpeed: 1.4,
      bankFactor: 0.3,
      rig: {
        hull: 'none',
        hullRadius: 0.34,
        hullTube: 0,
        seats: 1,
        riderRadius: 0.25,
        seatSpread: 0,
        colors: ['#f4f6f7'],
        wear: ['#ff2fa0', '#ffd23f', '#16e0c8', '#7c4dff', '#ff6b35'],
      },
      shell: '#eef3f5',
      trim: '#16e0c8',
    },
    {
      id: 'tube',
      name: { en: 'Closed tube slide', de: 'Geschlossene Reifenrutsche' },
      wrapDeg: 170,
      maxWrapDeg: 170,
      wallResponse: 0,
      floorFlat: 0,
      thickness: 0.055,
      sectionSamples: 14,
      waterDepth: 0.035,
      waterWrap: 0.34,
      friction: 0.075,
      dragArea: 0.55,
      vehicleMass: 9,
      riderMass: 72,
      dispatchSeconds: 13,
      entrySpeed: 1.2,
      bankFactor: 0.55,
      rig: {
        hull: 'ring',
        hullRadius: 0.62,
        hullTube: 0.19,
        seats: 1,
        riderRadius: 0.25,
        seatSpread: 0,
        colors: ['#ffd23f', '#ff2fa0', '#16e0c8'],
        wear: ['#7c4dff', '#ff6b35', '#2ec4b6', '#ef476f'],
      },
      shell: '#dfe8ee',
      trim: '#7c4dff',
    },
    {
      id: 'raft',
      name: { en: 'Family raft', de: 'Familien-Raft' },
      wrapDeg: 62,
      maxWrapDeg: 150,
      wallResponse: 0.85,
      floorFlat: 0.55,
      thickness: 0.07,
      sectionSamples: 9,
      waterDepth: 0.06,
      waterWrap: 0.7,
      friction: 0.09,
      dragArea: 2.1,
      vehicleMass: 95,
      riderMass: 70,
      dispatchSeconds: 28,
      entrySpeed: 1,
      bankFactor: 0.45,
      rig: {
        hull: 'raft',
        hullRadius: 1.3,
        hullTube: 0.34,
        seats: 5,
        riderRadius: 0.24,
        seatSpread: 0.66,
        colors: ['#ffd23f'],
        wear: ['#16e0c8', '#7c4dff', '#ff6b35', '#f4f6f7', '#2ec4b6'],
      },
      shell: '#e6eef2',
      trim: '#ff2fa0',
    },
    {
      id: 'mat',
      name: { en: 'Mat racer', de: 'Mattenrutsche' },
      wrapDeg: 46,
      maxWrapDeg: 124,
      wallResponse: 0.8,
      floorFlat: 0.35,
      thickness: 0.05,
      sectionSamples: 8,
      waterDepth: 0.028,
      waterWrap: 0.8,
      friction: 0.095,
      dragArea: 0.42,
      vehicleMass: 3,
      riderMass: 73,
      dispatchSeconds: 9,
      entrySpeed: 1.6,
      bankFactor: 0.3,
      rig: {
        hull: 'mat',
        hullRadius: 0.5,
        hullTube: 0.07,
        seats: 1,
        riderRadius: 0.22,
        seatSpread: 0,
        colors: ['#ffd23f', '#16e0c8', '#ff6b35'],
        wear: ['#0f2a3a', '#ef476f', '#7c4dff'],
      },
      shell: '#f0f4f6',
      trim: '#ffd23f',
    },
  ],
  layouts: [
    {
      id: 'plunge-drop',
      name: { en: 'Plunge and hook', de: 'Steilst\u00fcck mit Haken' },
      style: 'body',
      tower: 'open-steel',
      pieces: [
        { element: 'launch', params: { length: 5, speed: 4.5 } },
        { element: 'drop', params: { height: 5, angle: 48, crestRadius: 6, pullout: 9 } },
        { element: 'curve', params: { angle: 96, radius: 9 } },
        { element: 'drop', params: { height: 3, angle: 26, crestRadius: 10, pullout: 12 } },
        { element: 'curve', params: { angle: -112, radius: 8 } },
        { element: 'drop', params: { height: 3, angle: 20, crestRadius: 14, pullout: 16 } },
        { element: 'straight', params: { length: 7 } },
      ],
    },
    {
      id: 'spiral-tower',
      name: { en: 'Spiral tower', de: 'Wendelturm' },
      style: 'tube',
      tower: 'open-steel',
      pieces: [
        { element: 'launch', params: { length: 5, speed: 4.5 } },
        { element: 'drop', params: { height: 4, angle: 40, crestRadius: 6, pullout: 9 } },
        { element: 'helix', params: { turns: 1.75, radius: 7, drop: 6, hand: 1 } },
        { element: 'drop', params: { height: 3, angle: 30, crestRadius: 8, pullout: 11 } },
        { element: 's-bend', params: { offset: 6, radius: 11, hand: -1 } },
        { element: 'straight', params: { length: 10 } },
      ],
    },
    {
      id: 'family-bowl',
      name: { en: 'Family run', de: 'Familienabfahrt' },
      style: 'raft',
      tower: 'lagoon-timber',
      pieces: [
        { element: 'launch', params: { length: 6, speed: 4.5 } },
        { element: 'drop', params: { height: 5, angle: 34, crestRadius: 9, pullout: 14 } },
        { element: 'curve', params: { angle: 140, radius: 12 } },
        { element: 'drop', params: { height: 4.5, angle: 28, crestRadius: 12, pullout: 16 } },
        { element: 'curve', params: { angle: -120, radius: 11 } },
        { element: 'drop', params: { height: 3.5, angle: 20, crestRadius: 16, pullout: 20 } },
        { element: 'straight', params: { length: 6 } },
      ],
    },
    {
      id: 'mat-straight',
      name: { en: 'Mat racer', de: 'Mattenbahn' },
      style: 'mat',
      tower: 'open-steel',
      pieces: [
        { element: 'launch', params: { length: 5, speed: 5 } },
        { element: 'drop', params: { height: 6, angle: 44, crestRadius: 7, pullout: 12 } },
        { element: 's-bend', params: { offset: 5, radius: 14, hand: 1 } },
        { element: 'drop', params: { height: 3, angle: 22, crestRadius: 14, pullout: 18 } },
        { element: 'straight', params: { length: 8 } },
      ],
    },
  ],
};

/** Register one manifest fragment. Later entries with the same id win, by design. */
export function registerFlumes(packId: string, input: unknown): number {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    warnOnce(`pack:${packId}`, `pack "${packId}": the "flumes" key must be an object`);
    return 0;
  }
  const block = input as Record<string, unknown>;
  let count = 0;
  for (const def of parseEach(packId, 'tower', block.towers, towerSchema)) {
    towers.set(def.id, { key: `${packId}:${def.id}`, ...def, name: def.name ?? { en: def.id } });
    count++;
  }
  for (const def of parseEach(packId, 'slide style', block.styles, styleSchema)) {
    const wrap = deg(def.wrapDeg);
    styles.set(def.id, {
      key: `${packId}:${def.id}`,
      id: def.id,
      name: def.name ?? { en: def.id },
      wrap,
      maxWrap: Math.max(wrap, deg(def.maxWrapDeg)),
      wallResponse: def.wallResponse,
      floorFlat: def.floorFlat,
      thickness: def.thickness,
      sectionSamples: def.sectionSamples,
      waterDepth: def.waterDepth,
      waterWrap: def.waterWrap,
      friction: def.friction,
      dragArea: def.dragArea,
      vehicleMass: def.vehicleMass,
      riderMass: def.riderMass,
      dispatchSeconds: def.dispatchSeconds,
      entrySpeed: def.entrySpeed,
      bankFactor: def.bankFactor,
      rig: def.rig,
      shell: def.shell,
      trim: def.trim,
    });
    count++;
  }
  for (const def of parseEach(packId, 'layout', block.layouts, layoutSchema)) {
    layouts.set(def.id, { key: `${packId}:${def.id}`, ...def, name: def.name ?? { en: def.id } });
    count++;
  }
  return count;
}

let builtinsDone = false;

/**
 * Claim the `flumes` key, load the built-ins, read every pack already registered, and subscribe.
 *
 * Both halves of the module call it: a showcase may create the main handle without the sim, a soak
 * run creates the sim without the main, and re-registering an id is a map write.
 */
export function attachFlumeContent(registry: Registry): () => void {
  try {
    registry.registerPackCategory(FLUME_CATEGORY, 'flumes');
  } catch (error) {
    warnOnce('category', `could not claim "${FLUME_CATEGORY}": ${String(error)}`);
  }
  if (!builtinsDone) {
    builtinsDone = true;
    registerFlumes(BUILTIN_PACK, BUILTIN);
  }
  const read = (pack: { id: string } & Record<string, unknown>): void => {
    const block = pack[FLUME_CATEGORY];
    if (block) registerFlumes(pack.id, block);
  };
  for (const pack of registry.packs()) read(pack as { id: string } & Record<string, unknown>);
  return registry.onPack((pack) =>
    read(pack as unknown as { id: string } & Record<string, unknown>)
  );
}

/** Every registered entry, in registration order. A build bar reads these, not a literal. */
export const flumeStyles = (): FlumeStyleSpec[] => [...styles.values()];
export const flumeTowers = (): FlumeTowerSpec[] => [...towers.values()];
export const flumeLayouts = (): FlumeLayoutSpec[] => [...layouts.values()];

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

export const flumeStyle = (id?: string): FlumeStyleSpec | undefined =>
  lookup(styles, id, 'slide style');
export const flumeTower = (id?: string): FlumeTowerSpec | undefined => lookup(towers, id, 'tower');
export const flumeLayout = (id?: string): FlumeLayoutSpec | undefined =>
  lookup(layouts, id, 'layout');

/**
 * The first layout drawn for a given style, or the first layout of all.
 *
 * This is the ONE place a ride's `flumeStyle` is read, and it is read as a preference rather than
 * as a discriminator: an entity that names no layout gets the first descent somebody wrote for
 * that kind of slide. See the file docblock on why the style itself comes off the layout.
 */
export function defaultLayoutFor(styleId: string | undefined): FlumeLayoutSpec | undefined {
  if (styleId) {
    for (const layout of layouts.values()) if (layout.style === styleId) return layout;
  }
  return layouts.values().next().value;
}

/** Test seam: drop everything so a selftest can assert registration order from scratch. */
export function resetFlumeContent(): void {
  styles.clear();
  towers.clear();
  layouts.clear();
  warned.clear();
  builtinsDone = false;
}
