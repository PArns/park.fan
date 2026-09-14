/**
 * Where a train's numbers come from: a content pack, and nothing else in this module.
 *
 * **Nothing here switches on a pack id, a style id or a ride id, and that is the axis this module
 * can fail on outright.** A train is described by a `TrainProfile`, and a profile is assembled in
 * two steps: first the DERIVED profile, built out of what `trainStyles`, `rides` and `trackStyles`
 * already carry, then a pack's own `trainProfiles` entry laid over it field by field. Both halves
 * read the registry; neither reads a name.
 *
 * **The derivations are from the SHAPE of the content, never from its id.** `core/pack-schema.ts`
 * is not this module's to edit and `trainStyleSchema` carries four numbers — length, width, height,
 * seats — plus a colour. Everything else a train needs has to be inferred until the schema grows
 * the fields (`docs/game/requests/trains.md` §1 has the patch). Each inference is written down here
 * with the reason it is defensible:
 *
 * | field               | derived from                                         | why that and not a table              |
 * | ------------------- | ---------------------------------------------------- | ------------------------------------- |
 * | `cars`              | `rides[].carsPerTrain`                               | already content                       |
 * | `seatsPerCar`       | `rides[].seatsPerCar`, else `trainStyles[].car.seats`| already content                       |
 * | `seatsPerRow`       | 2 when the car seats 4 or more, else the seat count  | a coaster car is two across           |
 * | `massPerCar`        | `300 kg × car.length`                                | the number `track/physics.ts` uses    |
 * | `dragArea`          | `0.9 × w × h + 0.05 × cars × w`                      | ditto, so the two agree               |
 * | `rollingResistance` | the TRACK style's `supports`: timber 0.024 else 0.019| `track/resolve.ts` does the same      |
 * | `restraint`         | the ride's own comfort limits                        | a −1.8 g layout is a harness ride     |
 * | `nose`              | the track style's `supports`                         | a timber structure is a classic train |
 * | `livery.body`       | `trainStyles[].color`, else the track style's colour | already content                       |
 * | `dwellSeconds`      | `12 + 0.45 s` per rider the train seats              | a bigger train loads for longer       |
 *
 * The restraint rule is the one worth arguing with, so here it is in full: a ride whose declared
 * limits allow **4.6 g or more positive, or −1.2 g or less negative**, gets an over-the-shoulder
 * harness; anything gentler gets a lap bar. That is a statement about what the ride does to a
 * body, which is exactly what decides a restraint in reality, and it lands right on the three
 * bundled coasters without naming any of them — `steel-hyper` (5.0 / −1.8) and `neon-launch`
 * (5.2 / −1.8) get harnesses, `wooden-classic` (4.2 / −1.5) gets one on the negative rule, and
 * `family-invert` (3.5 / −1.0) gets a lap bar. A pack that disagrees writes `"restraint": "lap"`
 * and is obeyed.
 *
 * Pure and Babylon-free: the worker resolves the same profile the renderer draws.
 */

import type { Registry } from '../core/registry';
import type { CoasterDef, TrackStyleDef, TrainStyleDef } from '../core/pack-schema';
import type { TrackData } from '../track';
import { HEARTLINE_HEIGHT } from '../track';
import type { NoseKind, RestraintKind, TrainProfile } from './types';

/** Pack-authored overrides, keyed `pack:id`. Populated by `attachTrainContent`. */
const OVERRIDES = new Map<string, Partial<TrainProfile>>();

/** The vertical limit at or above which a ride is a harness ride. */
const HARNESS_VERTICAL_G = 4.6;
/** The negative limit at or below which a ride is a harness ride. */
const HARNESS_NEGATIVE_G = -1.2;

const RESTRAINTS: readonly RestraintKind[] = ['lap', 'shoulder', 'vest', 'none'];
const NOSES: readonly NoseKind[] = ['wedge', 'round', 'blunt'];

/**
 * The slice of `Registry` this file needs.
 *
 * Same reason `track/elements.ts` declares one: the attach helper is called from both halves of
 * the module and from `selftest.mjs`, and a structural type keeps this file honest about what it
 * actually touches.
 */
export interface TrainContentRegistry {
  registerPackCategory(category: string, owner: string): void;
  packs(): readonly unknown[];
  onPack(fn: (pack: unknown) => void): () => void;
}

/**
 * Claim `trainProfiles` and read it off every pack, present and future.
 *
 * Both halves are needed and five modules have now been caught with only one of them: `onPack`
 * fires on REGISTRATION, and `host.boot()` registers the bundled packs at step 2, before any
 * module's `main()` at step 5. Walking `packs()` first and subscribing second covers both, and
 * re-registering a profile is a map write, so the overlap costs nothing.
 */
export function attachTrainContent(registry: TrainContentRegistry): () => void {
  registry.registerPackCategory('trainProfiles', 'trains');
  for (const pack of registry.packs()) registerTrainProfilesFromPack(pack);
  return registry.onPack((pack) => {
    registerTrainProfilesFromPack(pack);
  });
}

/**
 * Read a pack's `trainProfiles` array.
 *
 * Validated by hand rather than by zod, because `core/pack-schema.ts` is not this module's to edit
 * and a category claimed through `registerPackCategory` reaches the module as raw JSON. A bad
 * entry throws with the pack and the entry that made it — the same contract the schema would give
 * — because a silently ignored profile is a train that quietly falls back to derived numbers and
 * looks like it worked.
 */
export function registerTrainProfilesFromPack(manifest: unknown): number {
  const packId = (manifest as { id?: string }).id ?? '?';
  const list = (manifest as { trainProfiles?: unknown }).trainProfiles;
  if (!Array.isArray(list)) return 0;
  let count = 0;
  for (const raw of list) {
    const entry = raw as Record<string, unknown>;
    if (!entry || typeof entry.id !== 'string') {
      throw new Error(`trainProfiles: pack "${packId}" has an entry with no id`);
    }
    OVERRIDES.set(`${packId}:${entry.id}`, parseProfileOverride(entry, `${packId}:${entry.id}`));
    count += 1;
  }
  return count;
}

/** Register (or replace) a profile override at runtime. Used by `selftest.mjs` and by tools. */
export function registerTrainProfile(key: string, patch: Partial<TrainProfile>): void {
  OVERRIDES.set(key, patch);
}

/** Every pack-authored override, for a report or a build panel. */
export function trainProfileOverrides(): Array<{ key: string; patch: Partial<TrainProfile> }> {
  return [...OVERRIDES.entries()].map(([key, patch]) => ({ key, patch }));
}

/** Drop every override. `selftest.mjs` calls it between cases; nothing in the game does. */
export function resetTrainProfiles(): void {
  OVERRIDES.clear();
}

function num(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}

function hex(value: unknown): string | undefined {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : undefined;
}

function parseProfileOverride(entry: Record<string, unknown>, key: string): Partial<TrainProfile> {
  const out: Partial<TrainProfile> = {};
  const put = <K extends keyof TrainProfile>(field: K, value: TrainProfile[K] | undefined) => {
    if (value !== undefined) out[field] = value;
  };
  if (entry.cars !== undefined) put('cars', Math.round(num(entry.cars, 1, 1, 24)));
  if (entry.seatsPerCar !== undefined)
    put('seatsPerCar', Math.round(num(entry.seatsPerCar, 4, 1, 12)));
  if (entry.seatsPerRow !== undefined)
    put('seatsPerRow', Math.round(num(entry.seatsPerRow, 2, 1, 6)));
  if (entry.carLength !== undefined) put('carLength', num(entry.carLength, 3, 0.8, 12));
  if (entry.carWidth !== undefined) put('carWidth', num(entry.carWidth, 1.8, 0.6, 4));
  if (entry.carHeight !== undefined) put('carHeight', num(entry.carHeight, 1.1, 0.4, 3));
  if (entry.massPerCar !== undefined) put('massPerCar', num(entry.massPerCar, 900, 50, 10000));
  if (entry.riderMass !== undefined) put('riderMass', num(entry.riderMass, 70, 20, 200));
  if (entry.dragArea !== undefined) put('dragArea', num(entry.dragArea, 2, 0.05, 40));
  if (entry.rollingResistance !== undefined)
    put('rollingResistance', num(entry.rollingResistance, 0.019, 0, 0.2));
  if (entry.heartline !== undefined) put('heartline', num(entry.heartline, 1.1, -4, 4));
  if (entry.dwellSeconds !== undefined) put('dwellSeconds', num(entry.dwellSeconds, 22, 2, 600));
  if (entry.restraint !== undefined) {
    const value = entry.restraint;
    if (!RESTRAINTS.includes(value as RestraintKind)) {
      throw new Error(
        `trainProfiles "${key}": restraint "${String(value)}" is not one of ${RESTRAINTS.join(', ')}`
      );
    }
    put('restraint', value as RestraintKind);
  }
  if (entry.nose !== undefined) {
    const value = entry.nose;
    if (!NOSES.includes(value as NoseKind)) {
      throw new Error(
        `trainProfiles "${key}": nose "${String(value)}" is not one of ${NOSES.join(', ')}`
      );
    }
    put('nose', value as NoseKind);
  }
  const livery = entry.livery as Record<string, unknown> | undefined;
  if (livery && typeof livery === 'object') {
    const patch: Record<string, string> = {};
    for (const field of ['body', 'trim', 'chassis', 'seat'] as const) {
      const value = hex(livery[field]);
      if (value) patch[field] = value;
    }
    if (Object.keys(patch).length > 0) {
      out.livery = { body: '', trim: '', chassis: '', seat: '', ...patch };
    }
  }
  return out;
}

function coasterOf(registry: Registry, key: string | undefined): CoasterDef | undefined {
  if (!key) return undefined;
  const def = registry.item('rides', key)?.def;
  return def && (def as { kind?: string }).kind === 'coaster' ? (def as CoasterDef) : undefined;
}

/**
 * The profile a layout's train is drawn and simulated from.
 *
 * `data.train` names the `trainStyles` entry; `data.ride` names the coaster definition;
 * `data.style` names the track style. All three are optional in `TrackData`, and a layout that
 * names none still gets a complete profile — a plain four-car steel train — because a coaster with
 * no train is a sculpture and a crash on a missing field is worse than a default.
 */
export function resolveTrainProfile(registry: Registry, data: TrackData): TrainProfile {
  const ride = coasterOf(registry, data.ride);
  const style = data.train
    ? (registry.item('trainStyles', data.train)?.def as TrainStyleDef | undefined)
    : undefined;
  const track = data.style
    ? (registry.item('trackStyles', data.style)?.def as TrackStyleDef | undefined)
    : undefined;
  const car = style?.car;

  const cars = Math.max(1, Math.round(ride?.carsPerTrain ?? 4));
  const seatsPerCar = Math.max(1, Math.round(ride?.seatsPerCar ?? car?.seats ?? 4));
  const carLength = car?.length ?? 3;
  const carWidth = car?.width ?? 1.85;
  const carHeight = car?.height ?? 1.15;
  const timber = track?.supports === 'timber';
  const limits = ride?.limits;
  const harness =
    !!limits && (limits.vertical >= HARNESS_VERTICAL_G || limits.negative <= HARNESS_NEGATIVE_G);
  const riders = cars * seatsPerCar;

  const derived: TrainProfile = {
    key: data.train ?? data.ride ?? data.style ?? 'default',
    cars,
    seatsPerCar,
    // Two across is what a coaster car is; a car seating two or three is one row of them.
    seatsPerRow: seatsPerCar >= 4 ? 2 : seatsPerCar,
    carLength,
    carWidth,
    carHeight,
    // A coaster car is a steel chassis under a fibreglass shell: about 900 kg empty for a 3 m car.
    massPerCar: 300 * carLength,
    riderMass: 70,
    dragArea: 0.9 * carWidth * carHeight + 0.05 * cars * carWidth,
    // Timber flexes under the train and takes more out of it. From the STYLE, so a new wooden
    // track style inherits it — `track/resolve.ts` gives the same reason for the same number.
    rollingResistance: timber ? 0.024 : 0.019,
    heartline: HEARTLINE_HEIGHT,
    restraint: harness ? 'shoulder' : 'lap',
    // A timber structure carries a classic train with a blunt, boxy front; a steel one carries a
    // moulded fairing. Again the structure and not the id.
    nose: timber ? 'blunt' : 'wedge',
    dwellSeconds: Math.round(12 + 0.45 * riders),
    livery: {
      body: style?.color ?? track?.color ?? '#c0c6cf',
      trim: '#1c222a',
      chassis: '#2b3038',
      seat: '#15181d',
    },
  };

  const override = data.train ? OVERRIDES.get(data.train) : undefined;
  if (!override) return derived;
  return {
    ...derived,
    ...override,
    livery: { ...derived.livery, ...stripEmpty(override.livery) },
    key: derived.key,
  };
}

function stripEmpty(livery: TrainProfile['livery'] | undefined): Partial<TrainProfile['livery']> {
  if (!livery) return {};
  const out: Partial<TrainProfile['livery']> = {};
  for (const field of ['body', 'trim', 'chassis', 'seat'] as const) {
    if (livery[field]) out[field] = livery[field];
  }
  return out;
}

/** Total mass of a full train, kg. Riders included: a coaster is signed off on its worst case. */
export function trainMassKg(profile: TrainProfile): number {
  return profile.cars * (profile.massPerCar + profile.seatsPerCar * profile.riderMass);
}

/** Length of the whole train over couplers, metres. */
export function trainLengthM(profile: TrainProfile): number {
  return profile.cars * profile.carLength;
}
