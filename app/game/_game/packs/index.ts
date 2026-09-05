/**
 * Every pack this build ships with.
 *
 * Order matters twice: a pack's `requires.packs` must already be loaded, and later packs win on a
 * string-table key. `core-classic` therefore comes first and always will.
 *
 * Adding a pack is one line here. There is no registration call inside a module, no switch to
 * extend, and no core edit — which is the claim CONTENT_PACKS.md makes and this file is the whole
 * of the mechanism behind it.
 */

import { coreClassicPack } from './core-classic/pack';
import { neonLagoonPack } from './neon-lagoon/pack';

export const ALL_PACKS: readonly unknown[] = [coreClassicPack, neonLagoonPack];

export { coreClassicPack, neonLagoonPack };
