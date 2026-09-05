/**
 * Audio module: spatial ride/ambience/music buses on Babylon 9's audio engine, autoplay-safe,
 * muted by default. PLACEHOLDER owned by the audio builder.
 */

import type { GameModule } from '../core/types';

export const audioModule: GameModule = {
  id: 'audio',
  deps: ['core'],
  main: async () => ({ dispose() {} }),
};
