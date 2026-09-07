/**
 * The module list — the only place modules are registered. Integrator-owned.
 *
 * Order matters only through `deps`; `orderModules()` in core/host.ts resolves it. Every entry's
 * `index.ts` must be import-safe on the worker: `main`/`showcase` reach Babylon through a dynamic
 * import, `sim` is a plain function.
 *
 * Every module in the plan is listed from the start, including the ones still being written. A
 * module with neither `main` nor `sim` is a legal member of the graph and costs a map entry — and
 * listing it up front is what lets sixteen builders work in parallel against a route that stays
 * loadable, and what lets the screenshot harness address `?showcase=<id>` the moment a builder
 * adds one. The alternative — registering each module as it lands — makes this file a queue that
 * every builder has to wait in.
 */

import type { GameModule } from './core/types';
import { coreModule } from './core/module';
import { terrainModule } from './terrain';
import { environmentModule } from './environment';
import { uiModule } from './ui/module';
import { cameraModule } from './camera';
import { audioModule } from './audio';
import { effectsModule } from './effects';
import { pathsModule } from './paths';
import { poolsModule } from './pools';
import { trackModule } from './track';
import { buildingsModule } from './buildings';
import { sceneryModule } from './scenery';
import { shopsModule } from './shops';
import { ridesModule } from './rides';
import { flumesModule } from './flumes';
import { trainsModule } from './trains';
import { guestsModule } from './guests';
import { staffModule } from './staff';
import { managementModule } from './management';
import { overlaysModule } from './overlays';
import { toolsModule } from './tools';
import { scenariosModule } from './scenarios';
import { persistenceModule } from './persistence';
import { demoParkModule } from './demo-park';

export const GAME_MODULES: readonly GameModule[] = [
  coreModule,
  terrainModule,
  environmentModule,
  cameraModule,
  uiModule,
  audioModule,
  effectsModule,
  pathsModule,
  poolsModule,
  trackModule,
  buildingsModule,
  sceneryModule,
  shopsModule,
  ridesModule,
  flumesModule,
  trainsModule,
  guestsModule,
  staffModule,
  managementModule,
  overlaysModule,
  toolsModule,
  scenariosModule,
  persistenceModule,
  demoParkModule,
];
