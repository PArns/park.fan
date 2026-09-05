/**
 * Research and the daily economy.
 *
 * Two systems, at opposite ends of the tick order: research runs early because it can unlock a
 * definition the build UI reads this frame, the economy runs late because it closes over income
 * every other system produced.
 */

import type { SimSystem } from '../core/sim/context';
import { TICKS_PER_GAME_DAY, TICKS_PER_GAME_MINUTE } from '../core/units';

/** A definition's research cost, derived from its build cost so a pack needs no second number. */
function researchCost(buildCost: number): number {
  // Square-root rather than linear: an expensive coaster should take longer to research than a
  // bench, but not four hundred times longer, which is what a linear rule produces.
  return Math.round(1200 + Math.sqrt(Math.max(0, buildCost)) * 40);
}

export const researchSystem: SimSystem = {
  id: 'research',
  tick(ctx) {
    const research = ctx.world.state.research;
    if (!research.current || research.spendPerDay <= 0) return;

    const perTick = research.spendPerDay / TICKS_PER_GAME_DAY;
    // Spend in whole cents once a minute rather than a fraction every tick — a float that
    // accumulates twenty times a second is a rounding drift the ledger would show by day thirty.
    if (ctx.world.tick % TICKS_PER_GAME_MINUTE !== 0) return;
    const spend = Math.round(perTick * TICKS_PER_GAME_MINUTE);
    if (!ctx.spend(spend, 'upkeep')) {
      ctx.notify({ level: 'warn', title: 'Forschung pausiert', body: 'Das Budget ist leer.' });
      research.spendPerDay = 0;
      return;
    }

    research.progress += spend;

    const cost = costOf(ctx, research.current);
    if (research.progress >= cost) {
      research.unlocked.push(research.current);
      ctx.notify({ level: 'info', title: 'Forschung abgeschlossen', body: research.current });
      research.current = '';
      research.progress = 0;
    }
  },
};

function costOf(ctx: Parameters<NonNullable<SimSystem['tick']>>[0], id: string): number {
  for (const kind of ['flat-ride', 'coaster', 'flume', 'shop', 'scenery'] as const) {
    const definition = ctx.registry.get(kind, id);
    if (definition) return researchCost(definition.cost.build);
  }
  return 5000;
}

export const economySystem: SimSystem = {
  id: 'economy',
  tick(ctx) {
    const economy = ctx.world.state.economy;

    // Wages, upkeep and interest are charged once a game hour rather than per tick: the same
    // amount, a twentieth of the arithmetic, and a ledger a player can read.
    if (ctx.world.tick % (TICKS_PER_GAME_MINUTE * 60) === 0) {
      let wages = 0;
      for (const staff of Object.values(ctx.world.entities.staff)) {
        wages += Math.round(staff.wage / 24);
      }
      if (wages > 0 && !ctx.spend(wages, 'wages')) {
        // Unpaid staff are not silently free: the park goes into the red and the notice says so.
        economy.cash -= wages;
        ctx.notify({
          level: 'error',
          title: 'Löhne nicht gedeckt',
          body: 'Der Park ist im Minus. Nimm einen Kredit auf oder entlasse Personal.',
        });
      }

      let upkeep = 0;
      for (const ride of Object.values(ctx.world.entities.ride)) {
        if (ride.status === 'open' || ride.status === 'testing') {
          const definition =
            ctx.registry.get('flat-ride', ride.defId) ??
            ctx.registry.get('coaster', ride.defId) ??
            ctx.registry.get('flume', ride.defId);
          upkeep += definition?.cost.runPerHour ?? 0;
        }
      }
      if (upkeep > 0) ctx.spend(upkeep, 'upkeep');

      if (economy.loan > 0) {
        const interest = Math.round((economy.loan * (economy.interestBp / 10000)) / 24 / 96);
        if (interest > 0) ctx.spend(interest, 'interest');
      }
    }

    // Marketing campaigns tick down and stop on their own.
    for (let i = economy.marketing.length - 1; i >= 0; i--) {
      const campaign = economy.marketing[i]!;
      campaign.ticksLeft--;
      if (campaign.ticksLeft <= 0) economy.marketing.splice(i, 1);
    }
  },

  audit(ctx) {
    return { cash: ctx.world.state.economy.cash, loan: ctx.world.state.economy.loan };
  },
};
