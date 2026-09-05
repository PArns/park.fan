/**
 * The `ui` module's engine-side handle. PLACEHOLDER owned by the ui builder: the HUD in
 * `lib/game/ui/hud.tsx` reads the store; this handle is where the builder wires tools, panels and
 * selection into the scene.
 */

import type { GameModule } from '../core/types';

export const uiModule: GameModule = {
  id: 'ui',
  deps: ['core'],
  main: async () => ({ dispose() {} }),
};
