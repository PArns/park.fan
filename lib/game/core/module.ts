/**
 * The `core` module: the part of core that behaves like a module (finance day rollover, the
 * `finance.cash` stat). Kept tiny on purpose; real money rules live in `management`.
 */

import type { GameModule, SimContext, SimHandle } from './types';

export const coreModule: GameModule = {
  id: 'core',
  sim(ctx: SimContext): SimHandle {
    let lastDay = ctx.world.clock.day;
    return {
      tick() {
        const { clock, finance } = ctx.world;
        if (clock.day !== lastDay) {
          lastDay = clock.day;
          if (!finance.history.some((d) => d.day === clock.day - 1)) {
            finance.history.push({
              day: clock.day - 1,
              income: 0,
              expenses: 0,
              guests: 0,
              rating: 0,
            });
            if (finance.history.length > 365) finance.history.shift();
          }
          ctx.events.emit('finance:changed', finance);
        }
      },
      fill(w) {
        w.stat('finance.cash', ctx.world.finance.cash);
        w.stat('clock.minute', ctx.world.clock.minute);
      },
    };
  },
};
