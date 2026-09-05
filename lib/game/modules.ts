/**
 * The module list — the only place modules are registered. Integrator-owned.
 *
 * Order matters only through `deps`; `orderModules()` in core/host.ts resolves it. Every entry's
 * `index.ts` must be import-safe on the worker: `main`/`showcase` reach Babylon through a dynamic
 * import, `sim` is a plain function. A module that is not ready yet is simply absent here.
 */

import type { GameModule } from './core/types';
import { coreModule } from './core/module';
import { terrainModule } from './terrain';
import { environmentModule } from './environment';
import { uiModule } from './ui/module';
import { cameraModule } from './camera';
import { audioModule } from './audio';
import { effectsModule } from './effects';
import { demoParkModule } from './demo-park';

export const GAME_MODULES: readonly GameModule[] = [
  coreModule,
  terrainModule,
  environmentModule,
  cameraModule,
  uiModule,
  audioModule,
  effectsModule,
  demoParkModule,
];
