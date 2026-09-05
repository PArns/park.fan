/**
 * IndexedDB saves, JSON export and import, blueprint sharing behind its flag.
 *
 * SCAFFOLD — registered so the host, the module graph and the screenshot harness can address this
 * module while its builder fills it in. It owns nothing yet and does nothing; a module with no
 * `main` and no `sim` is a legal member of the graph, which is what lets the route stay loadable
 * while sixteen folders are being written at once.
 */

import type { GameModule } from '../core/types';

export const persistenceModule: GameModule = {
  id: 'persistence',
  deps: ['core'],
};
