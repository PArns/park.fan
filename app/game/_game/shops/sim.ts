/**
 * Shops: the transaction, and what it does to a guest.
 *
 * Runs after guests, so a purchase settles on the same tick the decision was made rather than on
 * the next one — which matters because a guest who bought food this tick must not also be counted
 * as still hungry when the stats system runs at the end of the same tick.
 */

import type { SimSystem } from '../core/sim/context';
import { TICKS_PER_GAME_MINUTE, clamp } from '../core/units';
import { NO_ENTITY, type EntityId } from '../core/ids';
import { GUEST_STATE, dropLitter } from '../guests/sim';

/** Ticks one guest takes at a counter. Faster with a vendor working the shop. */
const SERVICE_TICKS = TICKS_PER_GAME_MINUTE * 0.75;

export const shopsSystem: SimSystem = {
  id: 'shops',
  tick(ctx) {
    const world = ctx.world;
    const guests = ctx.guests;
    const needs = ctx.registry.needOrder();

    for (const key of Object.keys(world.entities.shop)) {
      const shopIndex = Number(key);
      const shop = world.entities.shop[shopIndex]!;
      if (shop.queue.length === 0) continue;

      const definition = ctx.registry.get('shop', shop.defId);
      if (!definition) continue;

      const staffed = hasVendor(ctx, shopIndex);
      const period = Math.max(4, Math.round(SERVICE_TICKS * (staffed ? 0.6 : 1)));
      if (world.tick % period !== 0) continue;

      const guestId = shop.queue[0]!;
      const i = guests.find(guestId);
      if (i < 0) {
        shop.queue.shift();
        continue;
      }
      if (guests.state[i] !== GUEST_STATE.shopping) {
        shop.queue.shift();
        continue;
      }

      if (shop.stock <= 0) {
        // Out of stock is not a silent no-op: the guest leaves the queue unhappy, which is the
        // signal that this shop needs a vendor.
        shop.queue.shift();
        guests.state[i] = GUEST_STATE.walking;
        guests.target[i] = NO_ENTITY;
        guests.happiness[i] = Math.max(0, guests.happiness[i]! - 15);
        continue;
      }

      const item = definition.sells[0];
      const price = item ? (shop.price[item.sku] ?? item.defaultPrice) : 0;

      if (price > guests.wallet[i]!) {
        shop.queue.shift();
        guests.state[i] = GUEST_STATE.walking;
        guests.target[i] = NO_ENTITY;
        guests.happiness[i] = Math.max(0, guests.happiness[i]! - 8);
        continue;
      }

      if (price > 0) {
        guests.wallet[i] = guests.wallet[i]! - price;
        guests.spent[i] = guests.spent[i]! + price;
        shop.revenue += price;
        ctx.earn(price, 'shopIncome');
        if (item) ctx.spend(item.cost, 'upkeep');
      }
      shop.stock--;

      for (const entry of definition.satisfies) {
        const index = needs.indexOf(entry.need);
        if (index < 0) continue;
        const slot = i * guests.needCount + index;
        guests.needs[slot] = clamp(guests.needs[slot]! - entry.amount, 0, 255);
      }

      /**
       * Value for money.
       *
       * A guest compares the price against what it costs the park, not against a fixed table:
       * charge twice the cost and nobody minds, charge six times and happiness falls. That is what
       * makes pricing a decision rather than a slider to max out.
       */
      if (item && item.cost > 0) {
        const ratio = price / item.cost;
        const delta = ratio < 2.5 ? 6 : ratio < 4 ? 2 : ratio < 6 ? -4 : -14;
        guests.happiness[i] = clamp(guests.happiness[i]! + delta, 0, 255);
      } else {
        guests.happiness[i] = clamp(guests.happiness[i]! + 4, 0, 255);
      }

      // Food comes with a wrapper. Whether it ends up in a bin is a question for the scenery.
      if (definition.category === 'food' || definition.category === 'drink') {
        const rng = ctx.rng('guests');
        if (rng.bool(0.35)) dropLitter(ctx, guests.x[i]!, guests.z[i]!, 'litter');
      }

      shop.queue.shift();
      guests.state[i] = GUEST_STATE.walking;
      guests.target[i] = NO_ENTITY;
      guests.ticksInState[i] = 0;
      shop.cleanliness = Math.max(0, shop.cleanliness - 0.002);
    }
  },

  audit(ctx) {
    let revenue = 0;
    for (const shop of Object.values(ctx.world.entities.shop)) revenue += shop.revenue;
    return { shopRevenue: revenue };
  },
};

function hasVendor(ctx: Parameters<NonNullable<SimSystem['tick']>>[0], shopIndex: number): boolean {
  for (const key of Object.keys(ctx.world.entities.staff)) {
    const staff = ctx.world.entities.staff[Number(key)]!;
    if (staff.role === 'vendor' && (staff.target & 0xfffff) === shopIndex) return true;
  }
  void (NO_ENTITY as EntityId);
  return false;
}
