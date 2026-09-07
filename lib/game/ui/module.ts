/**
 * The `ui` module: the HUD's engine-side handle.
 *
 * This file is loaded on the worker along with `lib/game/modules.ts`, so it must stay free of
 * React, Babylon and the DOM — the whole interface sits behind the dynamic import below, the same
 * shape every other module uses for its Babylon half. `deps` is `['core']` and stays there: `ui`
 * has to be created BEFORE anything that registers a panel into it, and `tools` already names
 * `ui` in its own deps, so adding a module here would be a cycle.
 *
 * What it exposes on `api` is {@link UiMainApi}: the panel, inspector and stat registries, the
 * open-panel state and the park telemetry the HUD reads. A module contributes to the interface
 * from its own `main()`:
 *
 * ```ts
 * const ui = ctx.module<UiMainApi>('ui');
 * const off = ui?.registerPanel({ id: 'staff', title: 'Staff', icon: HardHat, Body: StaffPanel });
 * ```
 *
 * The types are NOT re-exported here, for the reason `terrain`, `paths`, `track`, `camera` and
 * `rides` all give in their own index files: a re-export keeps a module reference that a bundler
 * is free to follow, and this one would follow it into React. Import them from
 * `@/lib/game/ui/api`.
 */

import type { GameModule } from '../core/types';

export const uiModule: GameModule = {
  id: 'ui',
  deps: ['core'],
  main: async (ctx) => (await import('./main')).createUiMain(ctx),
};
