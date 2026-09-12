/**
 * The counters: a queue per shop, a till per counter, stock, deliveries, takings and the demand
 * for staff. Pure — no Babylon, no DOM, node-safe, every draw from `ctx.rng`.
 *
 * ## What this module answers
 *
 * `guests` asks one question — *where is the nearest open thing that relieves need X, and how long
 * is its queue* — and `find()` is the whole answer: shops filtered by need, by opening hour, by
 * stock and by what the guest can pay, ranked by **walk plus wait in park minutes** rather than by
 * distance, because a shop ninety seconds away with a six-minute line is further away than one
 * three minutes' walk with nobody in it. `join` / `place` / `collect` / `leave` are the rest of the
 * conversation.
 *
 * ## The bridge, and why it exists
 *
 * The `guests` build in this tree does not call any of that yet: it walks to a shop entity, spends
 * 0.6–2.2 park minutes in `BUYING`, takes the manifest's `needRelief`, moves the money itself and
 * emits `shop:sale`. So this module would have real shops, a real till and permanently empty
 * queues — which is a module whose interesting half is never exercised, the exact criticism the
 * guests report made of itself.
 *
 * So `shop:sale` is subscribed to and treated as **a customer who has already been served at the
 * counter**: stock comes off, takings go up, the till's clock advances, and the utilisation that
 * drives the staffing demand is real demand from 700 real people. What it must NOT do is move
 * money a second time — `guests` has already credited `world.finance.cash` — so an external sale
 * is recorded and not banked, and the flag that tells the two apart is set for the length of one
 * synchronous `emit`. `docs/game/requests/shops.md` asks for the other half.
 *
 * Two things the bridge genuinely cannot see, stated rather than papered over: a **free** shop
 * (`price === 0` — first aid, the cash machine, information) emits nothing, so its counter looks
 * idle however busy it is; and a guest who reaches the counter with too little money is refused
 * inside `guests` without a word, so `refused.price` stays at zero until the API path is wired.
 *
 * ## Determinism
 *
 * Four things carry a fraction across a tick and all four are in `serialize()`: each till's
 * remaining service time, the delivery timer, the busy-minutes window behind `utilisation`, and the
 * rng stream that varies a service. The queue, the un-collected receipts and the next ticket number
 * are state as well — a resumed save that re-issued ticket 1 would hand two guests one receipt.
 * The shop list is written in id order and the tick runs in id order (ARCHITECTURE §1 rule 4).
 */

import type { Command, Entity, SimContext, SimHandle } from '../core/types';
import type { Rng } from '../core/rng';
import {
  attachShopContent,
  menuForShop,
  boardFor,
  styleForShop,
  type ResolvedShop,
  type ShopItemLike,
} from './manifest';
import type {
  Cents,
  ShopEntityData,
  ShopJoin,
  ShopOffer,
  ShopRefusal,
  ShopSale,
  ShopView,
  ShopsSimApi,
  ShopsStats,
} from './types';

/**
 * Metres from a shop's entity position back to the front face of the building.
 *
 * The entity position is **where a guest stands**, not where the building's centre is, and that is
 * the single most load-bearing decision in this module. `guests` walks to `entity.position` and
 * stops as soon as it is within `REACH_RADIUS` (3.2 m) of it, so whatever point is stored is where
 * the crowd forms — put the building's centre there and half the queue renders inside the wall.
 * The building is laid out backwards from this point and the apron forwards, so a shop placed with
 * nothing but a position and a yaw has its counter facing the person who walked to it.
 *
 * The number is small (a kiosk lands at 1.5 m) because the crowd forms on the far side of that
 * 3.2 m circle from the approach: counter-to-queue is `setback + 3.2`, and 4.7 m is a queue at a
 * counter. Take the setback to 4 and it is a crowd standing in the middle of the road.
 */
export function frontSetback(apron: number): number {
  return 1 + apron * 0.12;
}

/**
 * Metres a guest covers in a park minute, for ranking a walk against a wait.
 *
 * The `guests` module's own archetypes run 1.0–1.5 m per park minute and this module cannot import
 * them — that would pull the whole guest sim into the worker bundle of a showcase that has no
 * guests. 1.25 is the middle of that range, and it is used for **ranking only**, never to move
 * anybody, so being 20 % out reorders two shops that were nearly equal and does nothing else.
 */
const WALK_PACE = 1.25;
/** Metres between two people standing in a line. */
const QUEUE_PITCH = 0.85;
/** Half-width of the queue channel; the line switchbacks inside it rather than running to the sea. */
const QUEUE_HALF_WIDTH = 1.9;
/** Park minutes a guest will stand in a line before giving up, per unit of patience. */
const BALK_AFTER = 14;
/** The window `utilisation` is measured over, park minutes. */
const UTILISATION_WINDOW = 60;
/** Receipts nobody collected are dropped after this many park minutes. */
const RECEIPT_TTL = 20;

interface Waiting {
  guest: number;
  ticket: number;
  cash: Cents;
  /** Park minute (absolute) the guest joined. */
  joined: number;
}

interface Till {
  /** Park minutes left on the current service. 0 = free. */
  busy: number;
  /** The guest being served, or -1. */
  guest: number;
  ticket: number;
  joined: number;
}

interface ShopRuntime {
  id: string;
  entity: Entity;
  resolved: ResolvedShop;
  data: ShopEntityData;
  /** Effective values, recomputed on rebuild. */
  price: Cents;
  counters: number;
  need: string;
  relief: number;
  hours: [number, number];
  /** Where a guest stands. Same as the entity position; see `frontSetback`. */
  fx: number;
  fz: number;
  /** Unit direction the shop faces. */
  dx: number;
  dz: number;

  // ── State, all of it serialized ──────────────────────────────────────────────────────────
  stock: number;
  /** Park minutes since the last delivery. */
  restock: number;
  tills: Till[];
  queue: Waiting[];
  nextTicket: number;
  /** A `null` sale is a customer turned away at the counter; `collect` answers null for it. */
  receipts: Array<{ ticket: number; sale: ShopSale | null; at: number }>;
  served: number;
  servedToday: number;
  takings: Cents;
  takingsToday: Cents;
  cogsToday: Cents;
  refusedToday: Record<ShopRefusal, number>;
  /** Counter-minutes worked inside the utilisation window. */
  busyMinutes: number;
  windowMinutes: number;
  lastRefusal: ShopRefusal | null;
}

const REFUSAL_KEYS: readonly ShopRefusal[] = ['closed', 'full', 'stock', 'price', 'unknown'];

function zeroRefusals(): Record<ShopRefusal, number> {
  return { closed: 0, full: 0, stock: 0, price: 0, unknown: 0 };
}

interface RegistryLike {
  find(category: 'shops', pack: string, item: string): { def: Record<string, unknown> } | undefined;
  needOrder(): string[];
}

export function createShopsSim(ctx: SimContext): SimHandle {
  const detachContent = attachShopContent(ctx.registry);
  const registry = ctx.registry as unknown as RegistryLike;
  /** One stream. Adding a roll here may not shift another module (ARCHITECTURE §1 rule 1). */
  const rng: Rng = ctx.rng.fork('tills');

  const shops = new Map<string, ShopRuntime>();
  /** Id order, rebuilt with the index. The tick and `serialize` both walk this. */
  let order: string[] = [];
  let dirty = true;
  let lastTickMs = 0;
  let day = ctx.world.clock.day;
  /** Set for the length of one `shop:sale` emit so the bridge does not double-count our own. */
  let selling = false;
  let warnedFallback = false;
  /** State restored from a save before the index existed; applied on the next rebuild. */
  let pending: Record<string, unknown> | null = null;

  const absMinute = (): number => ctx.world.clock.day * 1440 + ctx.world.clock.minute;

  // ── Index ─────────────────────────────────────────────────────────────────────────────────

  function markDirty(entity: Entity): void {
    if (entity.kind === 'shop') dirty = true;
  }
  const offAdd = ctx.events.on('entity:add', markDirty);
  const offRemove = ctx.events.on('entity:remove', markDirty);
  const offUpdate = ctx.events.on('entity:update', (change: { entity: Entity }) =>
    markDirty(change.entity)
  );
  const offPack = ctx.registry.onPack(() => {
    dirty = true;
  });

  /**
   * The sale a guest made through the OLD path in `guests`.
   *
   * Recorded, never banked: `guests` has already credited `world.finance.cash`, and two writers of
   * one number is the "state written from both sides" the determinism axis fails a module for.
   */
  const offSale = ctx.events.on(
    'shop:sale',
    (payload: { shop?: string; cents?: number; guest?: number }) => {
      if (selling) return;
      if (dirty) rebuildIndex();
      const shop = payload?.shop ? shops.get(payload.shop) : undefined;
      if (!shop) return;
      const cents = typeof payload.cents === 'number' ? Math.round(payload.cents) : shop.price;
      shop.served += 1;
      shop.servedToday += 1;
      shop.takings += cents;
      shop.takingsToday += cents;
      if (shop.stock > 0) {
        shop.stock -= 1;
        shop.cogsToday += shop.resolved.menu.unitCost;
      } else {
        shop.refusedToday.stock += 1;
      }
      // The customer occupied a counter for a service. Charging it to the busy-minutes window is
      // what makes `utilisation` and therefore the staffing demand real rather than a guess.
      shop.busyMinutes += shop.resolved.menu.serviceMinutes;
    }
  );

  function rebuildIndex(): void {
    dirty = false;
    const seen = new Set<string>();
    const ids = Object.keys(ctx.world.entities).sort();
    for (const id of ids) {
      const entity = ctx.world.entities[id];
      if (entity.kind !== 'shop') continue;
      const found = registry.find('shops', entity.pack, entity.item);
      if (!found) continue;
      seen.add(id);
      const def = found.def as unknown as ShopItemLike;
      const data = (entity.data ?? {}) as ShopEntityData;
      const { style, fallback } = styleForShop(def, data.style);
      if (fallback && !warnedFallback) {
        warnedFallback = true;
        console.warn(
          `[game/shops] "${entity.pack}:${entity.item}" names no known style ` +
            `("${def.procedural ?? '—'}"); falling back to a form derived from kind "${def.kind}"`
        );
      }
      const menu = menuForShop(entity.pack, entity.item, def.kind);
      const resolved: ResolvedShop = {
        key: `${entity.pack}:${entity.item}`,
        pack: entity.pack,
        item: entity.item,
        def,
        style,
        menu,
        board: boardFor(menu, typeof data.price === 'number' ? data.price : def.price),
        styleFallback: fallback,
      };
      const price = Math.max(0, Math.round(data.price ?? def.price ?? 0));
      const counters = Math.max(1, Math.round(data.counters ?? style.counters ?? 1));
      const yaw = entity.yaw ?? 0;
      const existing = shops.get(id);
      const shop: ShopRuntime = existing ?? {
        id,
        entity,
        resolved,
        data,
        price,
        counters,
        need: typeof def.need === 'string' ? def.need : 'none',
        relief: typeof def.needRelief === 'number' ? def.needRelief : 160,
        hours: data.hours ?? menu.hours,
        fx: entity.position[0],
        fz: entity.position[2],
        dx: Math.sin(yaw),
        dz: Math.cos(yaw),
        stock: menu.stock,
        restock: 0,
        tills: [],
        queue: [],
        nextTicket: 1,
        receipts: [],
        served: 0,
        servedToday: 0,
        takings: 0,
        takingsToday: 0,
        cogsToday: 0,
        refusedToday: zeroRefusals(),
        busyMinutes: 0,
        windowMinutes: 0,
        lastRefusal: null,
      };
      // A rebuild re-reads the definition (a pack may have landed, a price may have changed) but
      // never resets the running state — a re-index is not a new trading day.
      shop.entity = entity;
      shop.resolved = resolved;
      shop.data = data;
      shop.price = price;
      shop.counters = counters;
      shop.need = typeof def.need === 'string' ? def.need : 'none';
      shop.relief = typeof def.needRelief === 'number' ? def.needRelief : 160;
      shop.hours = data.hours ?? menu.hours;
      shop.fx = entity.position[0];
      shop.fz = entity.position[2];
      shop.dx = Math.sin(yaw);
      shop.dz = Math.cos(yaw);
      if (shop.stock > menu.stock) shop.stock = menu.stock;
      while (shop.tills.length < counters) {
        shop.tills.push({ busy: 0, guest: -1, ticket: 0, joined: 0 });
      }
      // Losing a counter must not lose the person standing at it: they go back to the head.
      while (shop.tills.length > counters) {
        const till = shop.tills.pop();
        if (till && till.guest >= 0) {
          shop.queue.unshift({
            guest: till.guest,
            ticket: till.ticket,
            cash: shop.price,
            joined: till.joined,
          });
        }
      }
      shops.set(id, shop);
    }
    for (const id of [...shops.keys()]) if (!seen.has(id)) shops.delete(id);
    order = [...shops.keys()].sort();
    if (pending) {
      applyState(pending);
      pending = null;
    }
  }

  // ── Queue geometry ────────────────────────────────────────────────────────────────────────
  /**
   * Where the `n`-th person in the line stands.
   *
   * A switchback inside a channel `QUEUE_HALF_WIDTH` wide rather than a single file running away
   * from the counter: a line of forty people in single file is 34 m long and leaves the park, and
   * every queue rail in every park in the world folds for the same reason. Row 0 is at the counter.
   */
  function standAt(shop: ShopRuntime, n: number): [number, number] {
    const perRow = Math.max(1, Math.floor((QUEUE_HALF_WIDTH * 2) / QUEUE_PITCH) + 1);
    const row = Math.floor(n / perRow);
    const inRow = n % perRow;
    // Serpentine, so the person after the end of a row is beside them and not back at the start.
    const lane = row % 2 === 0 ? inRow : perRow - 1 - inRow;
    const across = (lane - (perRow - 1) / 2) * QUEUE_PITCH;
    const back = 0.7 + row * QUEUE_PITCH * 1.15;
    // `d` faces out of the shop; `across` is perpendicular to it.
    return [
      shop.fx + shop.dx * back + shop.dz * across,
      shop.fz + shop.dz * back - shop.dx * across,
    ];
  }

  function openAt(shop: ShopRuntime, minute: number): boolean {
    if (shop.data.closed) return false;
    const [from, to] = shop.hours;
    return minute >= from && minute < to;
  }

  function waitMinutes(shop: ShopRuntime): number {
    const service = shop.resolved.menu.serviceMinutes;
    let soonest = Infinity;
    for (const till of shop.tills) {
      if (till.guest < 0) soonest = 0;
      else soonest = Math.min(soonest, till.busy);
    }
    if (!Number.isFinite(soonest)) soonest = service;
    // Everybody ahead shares the counters, so the line clears in rounds rather than one at a time.
    const rounds = Math.floor(shop.queue.length / Math.max(1, shop.counters));
    return soonest + rounds * service;
  }

  // ── The tick ──────────────────────────────────────────────────────────────────────────────

  function completeSale(shop: ShopRuntime, till: Till, now: number): void {
    const sale: ShopSale = {
      shop: shop.id,
      guest: till.guest,
      cents: shop.price,
      need: shop.need,
      relief: shop.relief,
      waited: Math.max(0, now - till.joined),
    };
    if (shop.price > 0) {
      shop.takings += shop.price;
      shop.takingsToday += shop.price;
      // This module is the seller, so it banks the sale. `guests`'s own path banks its own and is
      // told apart by `selling`; see the bridge above.
      ctx.world.finance.cash += shop.price;
    }
    if (shop.stock > 0) {
      shop.stock -= 1;
      shop.cogsToday += shop.resolved.menu.unitCost;
    }
    shop.served += 1;
    shop.servedToday += 1;
    shop.receipts.push({ ticket: till.ticket, sale, at: now });
    selling = true;
    try {
      ctx.events.emit('shop:sale', {
        shop: shop.id,
        cents: shop.price,
        guest: till.guest,
        source: 'shops',
      });
    } finally {
      selling = false;
    }
    till.guest = -1;
    till.ticket = 0;
    till.busy = 0;
  }

  function tickShop(shop: ShopRuntime, dt: number, minute: number, now: number): void {
    // 1. Deliveries. The timer is an accumulator and is saved; a restock that only happens while
    //    somebody is watching is a restock that breaks a resumed save.
    const menu = shop.resolved.menu;
    shop.restock += dt;
    while (shop.restock >= menu.restockMinutes) {
      shop.restock -= menu.restockMinutes;
      const before = shop.stock;
      shop.stock = Math.min(menu.stock, shop.stock + menu.restockUnits);
      if (shop.stock > before) {
        ctx.events.emit('shop:restock', {
          shop: shop.id,
          units: shop.stock - before,
          // Reported for a management module to book; this module never writes an expense.
          cost: (shop.stock - before) * menu.unitCost,
        });
      }
    }

    // 2. The utilisation window, a leaky integrator over the last hour.
    shop.windowMinutes = Math.min(UTILISATION_WINDOW, shop.windowMinutes + dt);
    const decay = dt / UTILISATION_WINDOW;
    shop.busyMinutes = Math.max(0, shop.busyMinutes * (1 - decay));

    const open = openAt(shop, minute);

    // 3. Serve. Every till independently, in order, so the same save always serves the same person.
    for (const till of shop.tills) {
      if (till.guest < 0) continue;
      till.busy -= dt;
      shop.busyMinutes += dt;
      if (till.busy <= 0) completeSale(shop, till, now);
    }

    // 4. Take the next customer — or turn them away, which is what an empty counter really does.
    if (open && shop.stock > 0) {
      for (const till of shop.tills) {
        if (till.guest >= 0 || shop.queue.length === 0) continue;
        const next = shop.queue.shift();
        if (!next) break;
        till.guest = next.guest;
        till.ticket = next.ticket;
        till.joined = next.joined;
        // Service time varies ±30 %: a till that takes exactly the same time for everybody makes
        // a queue advance in lockstep, which reads as a conveyor rather than as a counter.
        till.busy = menu.serviceMinutes * (0.7 + rng.next() * 0.6);
      }
    } else if (open && shop.queue.length > 0) {
      // Sold out. One apology per counter per tick, and a receipt with no sale in it so the caller
      // stops waiting rather than standing there for ever.
      for (let i = 0; i < shop.counters && shop.queue.length > 0; i++) {
        const dropped = shop.queue.shift() as Waiting;
        shop.refusedToday.stock += 1;
        shop.receipts.push({ ticket: dropped.ticket, sale: null, at: now });
      }
    }

    // 5. Balking, and the closing time. Both empty the line; neither is silent, and they are
    //    counted apart — "twelve people gave up" and "twelve people were still there at closing"
    //    are different facts about a shop and an operator would act on them differently.
    if (shop.queue.length) {
      const limit = open ? BALK_AFTER : 0;
      const reason: ShopRefusal = open ? 'full' : 'closed';
      let i = 0;
      while (i < shop.queue.length) {
        if (now - shop.queue[i].joined > limit) {
          shop.refusedToday[reason] += 1;
          shop.queue.splice(i, 1);
        } else i++;
      }
    }

    // 6. Receipts nobody came back for.
    if (shop.receipts.length) {
      shop.receipts = shop.receipts.filter((r) => now - r.at <= RECEIPT_TTL);
    }
  }

  function tick(dtMinutes: number): void {
    const started = performance.now();
    try {
      if (dirty) rebuildIndex();
      if (ctx.world.clock.day !== day) {
        day = ctx.world.clock.day;
        for (const id of order) {
          const shop = shops.get(id);
          if (!shop) continue;
          shop.servedToday = 0;
          shop.takingsToday = 0;
          shop.cogsToday = 0;
          shop.refusedToday = zeroRefusals();
        }
      }
      const minute = ctx.world.clock.minute;
      const now = absMinute();
      for (const id of order) {
        const shop = shops.get(id);
        if (shop) tickShop(shop, dtMinutes, minute, now);
      }
    } finally {
      lastTickMs = performance.now() - started;
    }
  }

  // ── The public API ────────────────────────────────────────────────────────────────────────

  function offerOf(shop: ShopRuntime, minute: number): ShopOffer {
    return {
      id: shop.id,
      key: shop.resolved.key,
      frontage: [shop.fx, shop.fz],
      at: [shop.entity.position[0], shop.entity.position[2]],
      need: shop.need,
      relief: shop.relief,
      price: shop.price,
      queue: shop.queue.length,
      waitMinutes: waitMinutes(shop),
      stock: shop.stock,
      open: openAt(shop, minute) && shop.stock > 0,
    };
  }

  const api: ShopsSimApi = {
    find(need, x, z, cash, limit = 4) {
      if (dirty) rebuildIndex();
      const minute = ctx.world.clock.minute;
      const out: Array<{ offer: ShopOffer; cost: number }> = [];
      for (const id of order) {
        const shop = shops.get(id);
        if (!shop || shop.need !== need) continue;
        if (!openAt(shop, minute) || shop.stock <= 0) continue;
        if (cash !== undefined && cash < shop.price) continue;
        if (shop.queue.length >= shop.counters * shop.resolved.menu.queuePerCounter) continue;
        const dx = shop.fx - x;
        const dz = shop.fz - z;
        // The rank is walk + wait in park minutes, at a typical guest pace (see WALK_PACE).
        const cost = Math.sqrt(dx * dx + dz * dz) / WALK_PACE + waitMinutes(shop);
        out.push({ offer: offerOf(shop, minute), cost });
      }
      out.sort((a, b) => a.cost - b.cost || (a.offer.id < b.offer.id ? -1 : 1));
      return out.slice(0, Math.max(1, limit)).map((e) => e.offer);
    },
    offer(id) {
      if (dirty) rebuildIndex();
      const shop = shops.get(id);
      return shop ? offerOf(shop, ctx.world.clock.minute) : null;
    },
    join(id, guest, cash) {
      if (dirty) rebuildIndex();
      const shop = shops.get(id);
      if (!shop) return null;
      const refuse = (why: ShopRefusal): null => {
        shop.lastRefusal = why;
        shop.refusedToday[why] += 1;
        return null;
      };
      if (!openAt(shop, ctx.world.clock.minute)) return refuse('closed');
      if (shop.stock <= 0) return refuse('stock');
      if (cash < shop.price) return refuse('price');
      if (shop.queue.length >= shop.counters * shop.resolved.menu.queuePerCounter) {
        return refuse('full');
      }
      const ticket = shop.nextTicket++;
      shop.queue.push({ guest, ticket, cash, joined: absMinute() });
      shop.lastRefusal = null;
      return {
        ticket,
        stand: standAt(shop, shop.queue.length - 1),
        waitMinutes: waitMinutes(shop),
      } satisfies ShopJoin;
    },
    place(id, ticket) {
      const shop = shops.get(id);
      if (!shop) return null;
      for (let i = 0; i < shop.tills.length; i++) {
        if (shop.tills[i].ticket === ticket && shop.tills[i].guest >= 0) {
          // At the counter: one bay per till, spread across the frontage.
          const spread = (i - (shop.tills.length - 1) / 2) * 1.5;
          return [shop.fx + shop.dz * spread, shop.fz - shop.dx * spread];
        }
      }
      const at = shop.queue.findIndex((w) => w.ticket === ticket);
      return at < 0 ? null : standAt(shop, at);
    },
    collect(id, ticket) {
      const shop = shops.get(id);
      if (!shop) return null;
      const at = shop.receipts.findIndex((r) => r.ticket === ticket);
      if (at < 0) return null;
      const [taken] = shop.receipts.splice(at, 1);
      return taken.sale ?? null;
    },
    leave(id, ticket) {
      const shop = shops.get(id);
      if (!shop) return;
      const at = shop.queue.findIndex((w) => w.ticket === ticket);
      if (at >= 0) {
        shop.queue.splice(at, 1);
        shop.refusedToday.full += 1;
      }
    },
    lastRefusal(id) {
      return shops.get(id)?.lastRefusal ?? null;
    },
    frontage(id) {
      const shop = shops.get(id);
      return shop ? [shop.fx, shop.fz] : null;
    },
    list() {
      if (dirty) rebuildIndex();
      const minute = ctx.world.clock.minute;
      return order.map((id) => {
        const shop = shops.get(id) as ShopRuntime;
        return {
          id: shop.id,
          key: shop.resolved.key,
          name: shop.resolved.def.name ?? { en: shop.resolved.item },
          kind: shop.resolved.def.kind,
          style: shop.resolved.style.id,
          need: shop.need,
          price: shop.price,
          at: [shop.entity.position[0], shop.entity.position[2]],
          frontage: [shop.fx, shop.fz],
          yaw: shop.entity.yaw ?? 0,
          open: openAt(shop, minute),
          counters: shop.counters,
          staffWanted: staffWanted(shop),
          queue: shop.queue.length,
          waitMinutes: waitMinutes(shop),
          stock: shop.stock,
          stockCapacity: shop.resolved.menu.stock,
          servedToday: shop.servedToday,
          takingsToday: shop.takingsToday,
          cogsToday: shop.cogsToday,
          refusedToday: { ...shop.refusedToday },
          utilisation: utilisationOf(shop),
        } satisfies ShopView;
      });
    },
    stats() {
      if (dirty) rebuildIndex();
      const minute = ctx.world.clock.minute;
      const refused = zeroRefusals();
      const answered = new Set<string>();
      let open = 0;
      let queue = 0;
      let servedToday = 0;
      let takingsToday = 0;
      let cogsToday = 0;
      let upkeep = 0;
      let staff = 0;
      let stockouts = 0;
      for (const id of order) {
        const shop = shops.get(id) as ShopRuntime;
        const isOpen = openAt(shop, minute);
        if (isOpen) {
          open += 1;
          if (shop.stock > 0) answered.add(shop.need);
        }
        queue += shop.queue.length;
        servedToday += shop.servedToday;
        takingsToday += shop.takingsToday;
        cogsToday += shop.cogsToday;
        upkeep += shop.resolved.def.upkeep ?? 0;
        staff += staffWanted(shop);
        if (shop.stock <= 0) stockouts += 1;
        for (const key of REFUSAL_KEYS) refused[key] += shop.refusedToday[key];
      }
      const unanswered = registry
        .needOrder()
        .filter((need) => !answered.has(need))
        .sort();
      return {
        shops: order.length,
        open,
        queue,
        servedToday,
        takingsToday,
        cogsToday,
        upkeepPerHour: upkeep,
        staffWanted: staff,
        stockouts,
        refusedToday: refused,
        unanswered,
        tickMs: lastTickMs,
      } satisfies ShopsStats;
    },
  };

  /**
   * How many people this counter needs on it.
   *
   * One per till that is actually working, plus one when the line is longer than the counters can
   * clear inside a service round — which is the moment a real operator opens the second window.
   * Never zero for an open shop: an unstaffed open shop is a contradiction, and the `staff` module
   * needs a floor to hire against.
   */
  function staffWanted(shop: ShopRuntime): number {
    if (!openAt(shop, ctx.world.clock.minute)) return 0;
    const load = utilisationOf(shop);
    const pressure = shop.queue.length > shop.counters * 2 ? 1 : 0;
    return Math.min(shop.counters + 1, Math.max(1, Math.ceil(shop.counters * load) + pressure));
  }

  function utilisationOf(shop: ShopRuntime): number {
    const span = Math.max(1, shop.windowMinutes) * Math.max(1, shop.counters);
    return Math.min(1, shop.busyMinutes / span);
  }

  // ── Persistence ───────────────────────────────────────────────────────────────────────────

  function applyState(state: Record<string, unknown>): void {
    const list = Array.isArray(state.shops) ? (state.shops as Array<Record<string, unknown>>) : [];
    for (const entry of list) {
      const id = typeof entry.id === 'string' ? entry.id : '';
      const shop = shops.get(id);
      if (!shop) continue;
      shop.stock = numberOr(entry.stock, shop.stock);
      shop.restock = numberOr(entry.restock, 0);
      shop.nextTicket = numberOr(entry.nextTicket, 1);
      shop.served = numberOr(entry.served, 0);
      shop.servedToday = numberOr(entry.servedToday, 0);
      shop.takings = numberOr(entry.takings, 0);
      shop.takingsToday = numberOr(entry.takingsToday, 0);
      shop.cogsToday = numberOr(entry.cogsToday, 0);
      shop.busyMinutes = numberOr(entry.busyMinutes, 0);
      shop.windowMinutes = numberOr(entry.windowMinutes, 0);
      const refused = (entry.refusedToday ?? {}) as Record<string, unknown>;
      shop.refusedToday = zeroRefusals();
      for (const key of REFUSAL_KEYS) shop.refusedToday[key] = numberOr(refused[key], 0);
      shop.tills = Array.isArray(entry.tills)
        ? (entry.tills as Array<Record<string, unknown>>).map((t) => ({
            busy: numberOr(t.busy, 0),
            guest: numberOr(t.guest, -1),
            ticket: numberOr(t.ticket, 0),
            joined: numberOr(t.joined, 0),
          }))
        : [];
      while (shop.tills.length < shop.counters) {
        shop.tills.push({ busy: 0, guest: -1, ticket: 0, joined: 0 });
      }
      shop.queue = Array.isArray(entry.queue)
        ? (entry.queue as Array<Record<string, unknown>>).map((w) => ({
            guest: numberOr(w.guest, -1),
            ticket: numberOr(w.ticket, 0),
            cash: numberOr(w.cash, 0),
            joined: numberOr(w.joined, 0),
          }))
        : [];
      // Receipts are deliberately not restored: they are a handshake with a caller that no longer
      // exists after a reload, and a stale one would be collected by whoever next holds that
      // ticket number. `nextTicket` is restored, so no ticket is ever re-issued.
      shop.receipts = [];
    }
    const state4 = state.rng;
    if (Array.isArray(state4) && state4.length === 4) {
      rng.restore([
        numberOr(state4[0], 0) >>> 0,
        numberOr(state4[1], 0) >>> 0,
        numberOr(state4[2], 0) >>> 0,
        numberOr(state4[3], 0) >>> 0,
      ]);
    }
    day = numberOr(state.day, ctx.world.clock.day);
  }

  function numberOr(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  const handle: SimHandle = {
    tick,
    command(cmd: Command): boolean {
      // `shops:price` and `shops:close` are the two a HUD needs and the two a management module
      // would send. They write the entity's own data bag, so they survive a save with the entity.
      if (cmd.type === 'shops:price') {
        const p = cmd.payload as { id?: string; price?: number };
        const entity = p?.id ? ctx.world.entities[p.id] : undefined;
        if (!entity || entity.kind !== 'shop' || typeof p.price !== 'number') return false;
        entity.data = { ...(entity.data ?? {}), price: Math.max(0, Math.round(p.price)) };
        dirty = true;
        return true;
      }
      if (cmd.type === 'shops:close') {
        const p = cmd.payload as { id?: string; closed?: boolean };
        const entity = p?.id ? ctx.world.entities[p.id] : undefined;
        if (!entity || entity.kind !== 'shop') return false;
        entity.data = { ...(entity.data ?? {}), closed: !!p.closed };
        dirty = true;
        return true;
      }
      return false;
    },
    fill(writer) {
      if (dirty) rebuildIndex();
      const minute = ctx.world.clock.minute;
      let open = 0;
      let queue = 0;
      let takings = 0;
      for (const id of order) {
        const shop = shops.get(id) as ShopRuntime;
        if (openAt(shop, minute)) open += 1;
        queue += shop.queue.length;
        takings += shop.takingsToday;
      }
      writer.stat('shops.count', order.length);
      writer.stat('shops.open', open);
      writer.stat('shops.queue', queue);
      writer.stat('shops.takingsToday', takings);
    },
    api,
    serialize() {
      const list = order.map((id) => {
        const shop = shops.get(id) as ShopRuntime;
        return {
          id,
          stock: shop.stock,
          restock: shop.restock,
          nextTicket: shop.nextTicket,
          served: shop.served,
          servedToday: shop.servedToday,
          takings: shop.takings,
          takingsToday: shop.takingsToday,
          cogsToday: shop.cogsToday,
          busyMinutes: shop.busyMinutes,
          windowMinutes: shop.windowMinutes,
          refusedToday: { ...shop.refusedToday },
          tills: shop.tills.map((t) => ({
            busy: t.busy,
            guest: t.guest,
            ticket: t.ticket,
            joined: t.joined,
          })),
          queue: shop.queue.map((w) => ({
            guest: w.guest,
            ticket: w.ticket,
            cash: w.cash,
            joined: w.joined,
          })),
        };
      });
      /**
       * The rng state is written UNSIGNED, and that is not tidiness.
       *
       * `Rng.state()` hands back the four words as JavaScript sees them, and `^=` leaves an int32
       * that may be negative; `deserialize` normalises with `>>> 0`, which is the same 32 bits and
       * the same generator — and a different STRING. So an uninterrupted run wrote `-958509949`
       * where the run resumed from its own save wrote `3336457347`, the two serialisations differed,
       * and nothing was actually wrong with the simulation. Found by the field-by-field diff in
       * `selftest.mjs`; `pnpm test:game-save-roundtrip` cannot see it, because its world has no
       * shops in it.
       */
      const state = rng.state().map((v) => v >>> 0);
      return { version: 1, day, rng: state, shops: list };
    },
    rebuild() {
      // `SimRuntime` calls this after the world is set and every sim module is created, so the
      // entities are already in `ctx.world`. The saved state is held in `pending` rather than
      // applied here because `rebuildIndex` is what creates the records it has to land on, and it
      // consumes `pending` at the end of its own pass — including on the rebuild a later
      // `entity:add` triggers, which is the case a save loaded into a running game hits.
      const slot = ctx.world.modules.shops as Record<string, unknown> | undefined;
      dirty = true;
      pending = slot && typeof slot === 'object' ? slot : null;
      rebuildIndex();
    },
    dispose() {
      offAdd();
      offRemove();
      offUpdate();
      offSale();
      offPack();
      detachContent();
      shops.clear();
      order = [];
    },
  };
  return handle;
}
