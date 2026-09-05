/**
 * The order simulation systems run in.
 *
 * Declared, not derived. Determinism rests on it: two builds that import the same modules in a
 * different order would otherwise produce two different parks from the same seed, and nothing
 * would say so.
 *
 * The order is causal, and each position has a reason:
 *
 * 1. `weather` — everything downstream reads it, nothing writes it.
 * 2. `research` — may unlock a definition this tick; the build UI reads the result next frame.
 * 3. `rides` — status, reliability, breakdowns. Trains need to know if the ride just broke.
 * 4. `trains` — motion, blocks, dispatch. Produces the "ride finished" events guests wait on.
 * 5. `queues` — moves guests from a queue into a vehicle, and vehicles' riders back out.
 * 6. `guests` — needs, decisions, navigation. Reads everything above, writes only guests.
 * 7. `staff` — reacts to what guests left behind, so it runs after them.
 * 8. `shops` — transactions settle after the guest that made them has decided.
 * 9. `litter` — ages and decays what the two above produced.
 * 10. `economy` — the day's ledger closes over the tick's income and spending.
 * 11. `stats` — last, because it reads the settled state of everything else.
 */

import type { SimSystem } from './context';

import { weatherSystem } from '../../environment/sim';
import { researchSystem, economySystem } from '../../management/sim';
import { ridesSystem } from '../../rides/sim';
import { trainsSystem } from '../../trains/sim';
import { queueSystem, guestsSystem } from '../../guests/sim';
import { staffSystem } from '../../staff/sim';
import { shopsSystem } from '../../shops/sim';
import { litterSystem, statsSystem } from './core-systems';

export const SIM_SYSTEM_ORDER: readonly SimSystem[] = [
  weatherSystem,
  researchSystem,
  ridesSystem,
  trainsSystem,
  queueSystem,
  guestsSystem,
  staffSystem,
  shopsSystem,
  litterSystem,
  economySystem,
  statsSystem,
];
