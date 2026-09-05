/**
 * Effects module: water spray, splash, fireworks, sparks, steam, night light rigs.
 * PLACEHOLDER owned by the effects builder.
 */

import type { GameModule } from '../core/types';

export const effectsModule: GameModule = {
  id: 'effects',
  deps: ['core', 'environment'],
  main: async () => ({ dispose() {} }),
};
