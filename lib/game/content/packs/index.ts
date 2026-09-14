/**
 * Packs bundled into the game chunk (decision #5). Both sides of the worker boundary register
 * them from this list; extra packs go through `registry.loadPackFromUrl('/game/packs/<id>.json')`.
 */

import coreClassic from './core-classic/pack.json';
import neonLagoon from './neon-lagoon/pack.json';

export const BUNDLED_PACKS: readonly unknown[] = [coreClassic, neonLagoon];
