/**
 * Camera module: RTS orbit/pan/zoom, walk mode, ride cam, photo mode.
 * PLACEHOLDER owned by the camera builder — the core ArcRotateCamera and its fallback presets in
 * core/host.ts stand in until then.
 */

import type { GameModule } from '../core/types';

export const cameraModule: GameModule = {
  id: 'camera',
  deps: ['core', 'terrain'],
  main: async () => ({ api: { preset: () => false }, dispose() {} }),
};
