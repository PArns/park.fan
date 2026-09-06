/**
 * Thoughts: a condition over named signals, evaluated for a slice of the crowd every tick.
 *
 * **Where the data-driven line sits, stated rather than hidden.** A pack adds a thought by dropping
 * a manifest entry; it cannot add a *signal*, because a condition that could name any expression
 * would be a scripting language in a JSON file, with a parser and an evaluator and a security
 * story. The signals this module publishes are the table below, and they are the module's public
 * vocabulary in the same way `registry.needOrder()` is core's. A thought naming a signal that does
 * not exist is warned about once, by name, and then never fires — which is the failure mode a typo
 * should have.
 *
 * **Not every guest thinks every tick.** A round-robin cursor walks the slots, so at 20 ticks per
 * park minute a guest is considered roughly twice a park minute at speed 1 and about once every
 * five park minutes at 100×. Thought evaluation is the one part of the tick whose cost scales with
 * the number of REGISTERED thoughts rather than with the crowd, so it is the part that would go
 * quadratic first.
 *
 * **The event budget is separate from the model.** Every guest keeps the thought it had; only a
 * few of them are announced. `guest:thought` crosses the worker boundary as a postMessage, and a
 * park of 1 400 people thinking twice a minute is 2 800 messages a minute for a HUD that shows
 * five lines.
 *
 * Pure: no Babylon, no DOM, node-safe.
 */

import type { GuestThoughtDef } from './types';

/**
 * The signals a `when` clause may name.
 *
 * Anything a pack author might reasonably want to react to, and nothing that would need the module
 * to evaluate an expression. `need:<id>` is resolved dynamically against the registered needs, so
 * a pack that declares `cooling` can write `{ "signal": "need:cooling", "gte": 200 }` without this
 * list changing.
 */
export const SIGNAL_NAMES = [
  /** 0..100. The guest's running happiness, which lags the mood and takes the thought hits. */
  'happiness',
  /** 0..100. The needs mixed by their declared weights, right now. */
  'mood',
  /** Cents in the wallet. */
  'cash',
  /** Park minutes spent in the line they are standing in. 0 when not queuing. */
  'queueMinutes',
  /** 0..1. Guests within 3 m, over the count at which a path stops flowing. */
  'crowding',
  /** 0..1. What is falling and how hard; 0 when nothing is. */
  'rain',
  /** 0..1. Warmth above 19 °C, saturating at 31. */
  'hot',
  /** 0..1. Cold below 9 °C, saturating at −3. */
  'cold',
  /** Park minutes the guest has been unable to find a route. */
  'lostMinutes',
  /** 1 while heading for the gate, else 0. */
  'leaving',
  /** Park minutes since they walked in. */
  'visitMinutes',
  /** Rides in the park. */
  'rides',
  /** Shops in the park. */
  'shops',
  /** Scenery props within about 25 m of the guest. */
  'scenery',
  /** How many of their needs are past the need's own `urgentAt`. */
  'urgentNeeds',
] as const;

export type SignalName = (typeof SIGNAL_NAMES)[number];

export interface CompiledClause {
  /** Index into the signal array, or `-1` for a need column offset by `NEED_BASE`. */
  index: number;
  gte: number;
  lte: number;
}

export interface CompiledThought {
  def: GuestThoughtDef;
  clauses: CompiledClause[];
  /** False when a clause named a signal nothing publishes; it is skipped rather than throwing. */
  usable: boolean;
}

/** Need signals start here, so one flat array carries both kinds. */
export const NEED_BASE = 1000;

export function signalCount(): number {
  return SIGNAL_NAMES.length;
}

export function signalIndex(name: string): number {
  return SIGNAL_NAMES.indexOf(name as SignalName);
}

/**
 * Resolve every `when` clause to an array index once, at registration, instead of by string
 * lookup per guest per tick.
 */
export function compileThoughts(
  defs: readonly GuestThoughtDef[],
  needColumn: (id: string) => number,
  warn: (message: string) => void
): CompiledThought[] {
  const out: CompiledThought[] = [];
  for (const def of defs) {
    const clauses: CompiledClause[] = [];
    let usable = true;
    for (const clause of def.when) {
      let index = signalIndex(clause.signal);
      if (index < 0 && clause.signal.startsWith('need:')) {
        const column = needColumn(clause.signal.slice(5));
        index = column >= 0 ? NEED_BASE + column : -1;
      }
      if (index < 0) {
        warn(
          `thought "${def.id}" reads a signal called "${clause.signal}", which nothing publishes; ` +
            `it can never fire. Known signals: ${SIGNAL_NAMES.join(', ')}, need:<id>.`
        );
        usable = false;
        break;
      }
      clauses.push({
        index,
        gte: clause.gte ?? -Infinity,
        lte: clause.lte ?? Infinity,
      });
    }
    out.push({ def, clauses, usable: usable && clauses.length > 0 });
  }
  // Highest priority first, so the first match is the one that wins and the loop can stop.
  out.sort((a, b) => b.def.priority - a.def.priority || (a.def.id < b.def.id ? -1 : 1));
  return out;
}

/**
 * The first thought whose clauses all hold, or `-1`.
 *
 * `signals` holds the fixed table; `needs` is the guest's need row. Both are read-only here — the
 * caller owns the scratch arrays so this allocates nothing per guest.
 */
export function evaluateThought(
  thoughts: readonly CompiledThought[],
  signals: Float64Array,
  needs: Uint8Array,
  needBase: number
): number {
  for (let t = 0; t < thoughts.length; t++) {
    const thought = thoughts[t];
    if (!thought.usable) continue;
    let ok = true;
    for (let c = 0; c < thought.clauses.length; c++) {
      const clause = thought.clauses[c];
      const value =
        clause.index >= NEED_BASE
          ? needs[needBase + (clause.index - NEED_BASE)]
          : signals[clause.index];
      if (value < clause.gte || value > clause.lte) {
        ok = false;
        break;
      }
    }
    if (ok) return t;
  }
  return -1;
}
