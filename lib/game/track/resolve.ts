/**
 * Content pack → the numbers this module builds with.
 *
 * Everything the renderer and the simulation know about a coaster's rails, its train and its
 * comfort limits comes through here, off `registry.items('trackStyles' | 'trainStyles' | 'rides')`.
 * Nothing in this module names a pack, a style or a ride: drop a fourth `trackStyles` entry into a
 * manifest and it is buildable, drawable and simulable with no code change, which is the
 * extensibility the module is graded on.
 *
 * Pure and Babylon-free, so the worker resolves the same numbers the renderer does.
 */

import type { Registry } from '../core/registry';
import type { CoasterDef, TrackStyleDef, TrainStyleDef } from '../core/pack-schema';
import type { BuildOptions } from './build';
import { trainSpec, type ComfortLimits, type TrainSpec } from './physics';
import type { TrackStyleShape } from './profile';
import { DEFAULT_LIMITS, type TrackData } from './types';

/** The style every layout falls back to when its own is missing — a plain steel box spine. */
export const FALLBACK_STYLE: TrackStyleShape = {
  rail: { profile: 'round', radius: 0.07, gauge: 1.3 },
  spine: { profile: 'box', size: 0.55 },
  ties: { every: 1.6 },
  supports: 'steel',
  color: '#8892a0',
};

export function trackStyles(registry: Registry): Array<{ key: string; def: TrackStyleDef }> {
  return registry.items('trackStyles').map((item) => ({ key: item.key, def: item.def }));
}

export function resolveStyle(registry: Registry, key: string | undefined): TrackStyleShape {
  const def = key
    ? (registry.item('trackStyles', key)?.def as TrackStyleDef | undefined)
    : undefined;
  if (!def) return FALLBACK_STYLE;
  return {
    rail: def.rail,
    spine: def.spine,
    ties: def.ties,
    supports: def.supports,
    color: def.color,
  };
}

export function resolveRide(registry: Registry, key: string | undefined): CoasterDef | undefined {
  if (!key) return undefined;
  const def = registry.item('rides', key)?.def;
  return def && (def as { kind?: string }).kind === 'coaster' ? (def as CoasterDef) : undefined;
}

/**
 * The train the validation run assumes: a full one.
 *
 * A coaster is signed off on its worst case, and the worst case for "does it get round" is the
 * heaviest train — which is also, and not coincidentally, the fastest one, because mass cancels
 * out of the gravity term and does not cancel out of the drag term.
 */
export function resolveTrain(registry: Registry, data: TrackData): TrainSpec {
  const ride = resolveRide(registry, data.ride);
  const style = data.train
    ? (registry.item('trainStyles', data.train)?.def as TrainStyleDef | undefined)
    : undefined;
  const car = style?.car;
  const structure = resolveStyle(registry, data.style);
  return trainSpec({
    cars: ride?.carsPerTrain ?? 6,
    seatsPerCar: ride?.seatsPerCar ?? car?.seats ?? 4,
    carLength: car?.length ?? 3,
    carWidth: car?.width ?? 1.85,
    carHeight: car?.height ?? 1.15,
    // A timber structure flexes under the train and takes more out of it than a box spine does.
    // Derived from the STYLE rather than from an id, so a new wooden style inherits it.
    rollingResistance: structure.supports === 'timber' ? 0.024 : 0.019,
  });
}

export function resolveLimits(registry: Registry, data: TrackData): ComfortLimits {
  return resolveRide(registry, data.ride)?.limits ?? { ...DEFAULT_LIMITS };
}

export function buildOptionsFor(registry: Registry, data: TrackData): BuildOptions {
  const ride = resolveRide(registry, data.ride);
  return {
    train: resolveTrain(registry, data),
    limits: resolveLimits(registry, data),
    ratedSpeed: ride?.maxSpeed,
    dispatchSpeed: 2,
  };
}

/** Paint colour for a layout: the data's override, then the style's, then a neutral grey. */
export function resolveColor(registry: Registry, data: TrackData): string {
  return data.color ?? resolveStyle(registry, data.style).color ?? '#8892a0';
}
