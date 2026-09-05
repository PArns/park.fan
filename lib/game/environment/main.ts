/**
 * PLACEHOLDER owned by the environment builder: sky colour comes from core's `applyEnvironment`;
 * this handle only exposes `current()` so the host can ask for the environment of a minute.
 */

import type { MainContext, MainHandle } from '../core/types';
import { computeEnvironment } from '../core/sun';

export function createEnvironmentMain(ctx: MainContext): MainHandle {
  const weather = () =>
    (ctx.world.modules.environment as { weather?: import('../core/types').WeatherKind } | undefined)
      ?.weather;
  return {
    api: {
      current: (minute: number, day: number) =>
        computeEnvironment({ minute, day, weather: weather() }),
    },
    dispose() {},
  };
}
