/**
 * Needs, read off the registry rather than written down here.
 *
 * `needs` is a first-class pack category (`needSchema` in `core/pack-schema.ts`), and
 * `registry.needOrder()` hands back every registered need in REGISTRATION order. That order is
 * this module's column order: the guest store is struct-of-arrays and indexes needs by position,
 * so a sort would silently re-map every need in a saved world the first time a pack was added.
 * Appending cannot, which is why `neon-lagoon`'s `cooling` lands as column 6 and the six columns
 * `core-classic` declared keep their meaning.
 *
 * A save carries the id list it was written against (`store.ts`), so a world saved before a pack
 * was added still loads correctly afterwards: the columns are remapped by id, and a need the save
 * has no column for starts at zero rather than at whatever number happened to be in that slot.
 *
 * The weather half is the one thing here that is not straight out of the manifest. `weather` is
 * declared per need as `none | warm | cold | wet`, and what that multiplier should be is a
 * judgement: thirst at 30 °C rises about twice as fast as at 19 °C, which is the curve below.
 */

import type { EnvironmentState } from '../core/types';
import type { NeedColumn } from './types';

/** The slice of `Registry` this needs, so the file stays worker-safe. */
export interface NeedRegistry {
  needOrder(): string[];
  items(category: 'needs'): Array<{ key: string; pack: string; def: unknown }>;
  onPack(fn: (pack: unknown) => void): () => void;
  packs(): readonly unknown[];
}

export interface NeedModel {
  columns: NeedColumn[];
  byId: Map<string, NeedColumn>;
  /** Sum of the declared mood weights, so the mix normalises without a division per guest. */
  weightSum: number;
  /** `columns.length`, hot enough to be worth not reading through the array. */
  count: number;
}

export function readNeeds(registry: NeedRegistry): NeedModel {
  const order = registry.needOrder();
  const defs = new Map<string, Record<string, unknown>>();
  for (const item of registry.items('needs')) {
    const def = item.def as Record<string, unknown>;
    const id = typeof def.id === 'string' ? def.id : '';
    // First declaration of an id wins: two packs declaring `hunger` is one need, and the base
    // pack's numbers are the ones a scenario was balanced against.
    if (id && !defs.has(id)) defs.set(id, def);
  }
  const columns: NeedColumn[] = [];
  const byId = new Map<string, NeedColumn>();
  let weightSum = 0;
  order.forEach((id, column) => {
    const def = defs.get(id);
    if (!def) return;
    const entry: NeedColumn = {
      id,
      column,
      name: (def.name as NeedColumn['name']) ?? { en: id },
      decayPerHour: numberOr(def.decayPerHour, 20),
      moodWeight: numberOr(def.moodWeight, 1),
      urgentAt: numberOr(def.urgentAt, 180),
      criticalAt: numberOr(def.criticalAt, 230),
      weather: weatherOf(def.weather),
      icon: typeof def.icon === 'string' ? def.icon : undefined,
      thoughts: Array.isArray(def.thoughts) ? (def.thoughts as NeedColumn['thoughts']) : [],
    };
    columns.push(entry);
    byId.set(id, entry);
    weightSum += entry.moodWeight;
  });
  // Re-index: `needOrder()` may name a need whose definition failed to resolve, and a hole in the
  // column numbering would put every later need one byte off in the store.
  columns.forEach((c, i) => {
    c.column = i;
  });
  return { columns, byId, weightSum: weightSum || 1, count: columns.length };
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function weatherOf(value: unknown): NeedColumn['weather'] {
  return value === 'warm' || value === 'cold' || value === 'wet' ? value : 'none';
}

/**
 * How much faster a need rises in this weather.
 *
 * `warm` doubles by 30 °C and does nothing below 19; `cold` is the mirror around 9 °C and is
 * gentler, because a park visitor gets cold slower than they get thirsty. `wet` follows what is
 * actually falling rather than the cloud cover: an overcast day is not a wet one.
 */
export function weatherFactor(need: NeedColumn, env: EnvironmentState): number {
  switch (need.weather) {
    case 'warm':
      return 1 + Math.max(0, (env.temperatureC - 19) / 11) * 1;
    case 'cold':
      return 1 + Math.max(0, (9 - env.temperatureC) / 12) * 0.9;
    case 'wet':
      return env.precipitation === 'none' ? 1 : 1 + env.intensity * 0.8;
    default:
      return 1;
  }
}

/**
 * The mood a guest's needs add up to, 0..100, 100 being nothing wrong.
 *
 * A weighted mix rather than the worst need: a guest who is a little hungry, a little tired and a
 * little bored is having a worse time than one who is only hungry, and a `min` would say they are
 * the same. The weights are the pack's (`moodWeight`), so a theme pack that considers its own need
 * more important than hunger says so in the manifest.
 */
export function moodFromNeeds(
  levels: Uint8Array,
  base: number,
  model: NeedModel,
  multipliers?: Float32Array
): number {
  let sum = 0;
  let weight = 0;
  for (let i = 0; i < model.count; i++) {
    const need = model.columns[i];
    // A need the archetype barely feels also matters less to its mood: a coaster enthusiast who
    // does not care about being tired should not have their day ruined by it.
    const w = need.moodWeight * (multipliers ? multipliers[i] : 1);
    sum += w * (1 - levels[base + i] / 255);
    weight += w;
  }
  return weight > 0 ? (sum / weight) * 100 : 100;
}
