/**
 * Environment module: sun cycle, sky, IBL, weather, seasons, fog.
 * PLACEHOLDER owned by the environment builder — the sim half already carries weather state so
 * the rest of the game can read it; the renderer half is the builder's.
 */

import type { GameModule, SimContext, SimHandle, WeatherKind } from '../core/types';
import { computeEnvironment } from '../core/sun';

interface EnvironmentSlot {
  weather: WeatherKind;
  forced?: boolean;
}

export const environmentModule: GameModule = {
  id: 'environment',
  deps: ['core'],
  sim(ctx: SimContext): SimHandle {
    const slot = (): EnvironmentSlot => {
      const s = ctx.world.modules.environment as EnvironmentSlot | undefined;
      if (s) return s;
      const fresh: EnvironmentSlot = { weather: 'clear' };
      ctx.world.modules.environment = fresh;
      return fresh;
    };
    return {
      api: {
        current: () =>
          computeEnvironment({
            minute: ctx.world.clock.minute,
            day: ctx.world.clock.day,
            weather: slot().weather,
          }),
      },
      tick() {},
      command(cmd) {
        if (cmd.type === 'environment:weather') {
          slot().weather = (cmd.payload as { weather: WeatherKind }).weather;
          slot().forced = true;
          return true;
        }
        return false;
      },
      serialize: () => slot(),
    };
  },
  main: async (ctx) => (await import('./main')).createEnvironmentMain(ctx),
};
