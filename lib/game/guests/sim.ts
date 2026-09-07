/**
 * The guests, on the sim side: needs, wayfinding, decisions, groups, money and thoughts.
 *
 * DOM-free and Babylon-free. It runs on the worker in the browser and directly in node under
 * `scripts/game-soak.mjs`, which is where `stuckCount()` and the tick budget are graded.
 *
 * ── The one number that decides how this feels ──────────────────────────────────────────────
 * `speed` on an archetype is **metres per PARK minute**, and D-006 fixes one park minute to one
 * real second at speed 1. So an archetype's `speed` is also, exactly, the guest's speed in metres
 * per second on screen at speed 1: 2.0 there is a person walking at 2 m/s, which is a brisk but
 * completely ordinary pace, and it is what the frame shows.
 *
 * The other half of that arithmetic is uncomfortable and is not hidden: in PARK time the same
 * guest crosses the 300 m main street in 2.5 park hours. Nothing can fix both halves while a
 * minute is compressed sixtyfold — a realistic 1.35 m/s in park time would be 81 m/s on screen,
 * and a realistic park-time schedule would be a blur. What makes it work as a game rather than as
 * a spreadsheet is that the guest's DAY is right: a visitor who stays five park hours walks about
 * 600 m and does five things, which is a park visit. The number to revisit is the compression, not
 * this constant, and revisiting it is a decision about D-006 rather than about guests.
 *
 * ── Determinism ────────────────────────────────────────────────────────────────────────────
 * One `Rng`, forked into four named streams so that adding a roll to the arrival model cannot
 * shift a guest's clothing. Iteration is always ascending over slots (ARCHITECTURE §1 rule 4), the
 * clock is `world.clock` and never a wall clock, and the store's slot allocator is lowest-free so
 * a save can be resumed rather than merely reloaded (see `store.ts`).
 *
 * ── A clock jump is a scene change ─────────────────────────────────────────────────────────
 * `setTimeOfDay` (the screenshot harness, and later a debug control) writes the clock directly, so
 * the sim can see 09:00 become 18:30 between two ticks. Simulating the gap is not an option — nine
 * park hours at the tick rate is 10 800 ticks — and carrying on regardless would photograph a
 * midday crowd under a night sky. So a jump larger than `JUMP_MINUTES` re-seeds the park for the
 * hour it landed on: the population the attendance curve asks for, placed on the network, with
 * needs aged by how long each guest would have been inside. It is deterministic (one seeded
 * stream, one pass in slot order) and it is the only place in this module that discards state.
 *
 * ── Buying is somebody else's model ────────────────────────────────────────────────────────
 * This module used to run its own: a shop entity was a venue with a price and a `throughput`, a
 * guest stood at it for a park minute, took the manifest's relief, credited `world.finance.cash`
 * and emitted `shop:sale`. Meanwhile the `shops` module simulated a queue per shop, a till per
 * counter, stock, deliveries and refusals, and had **no caller at all** — its own report said so:
 * "No frame shows a queue at a counter, because nothing queues."
 *
 * So a shop is now asked rather than modelled. `shops.find(need, x, z, cash)` answers with the
 * frontage point and a measured wait; `join` gives a ticket; `place` says where the holder should
 * be standing THIS tick, which is what makes the line a place and not a marker on a building;
 * `collect` hands over a receipt that moves real money against real stock; `leave` is a balk, and
 * `lastRefusal` says why a counter turned somebody away instead of letting them wander off. Two
 * halves of one contract: **`shops` banks the sale and this module debits the wallet**, so
 * `serve()` — which does both — is now only reachable when no `shops` module answered.
 *
 * Which it may not: a showcase loads five modules. `ctx.module('shops')` returning `undefined` is a
 * supported state everywhere below and puts the old venue model back, entity list and all. Rides
 * keep it regardless, because that module does not exist yet and nothing else can answer for them.
 */

import type { Command, Entity, EnvironmentState, SimContext, SimHandle } from '../core/types';
// Type-only, so nothing of the shops module is linked into this one's graph: the API is reached
// through `ctx.module('shops')` at run time and may answer `undefined`, which is the whole point of
// the `shops == null` branches below. A showcase loads five modules, not twenty-four.
import type { ShopOffer, ShopsSimApi } from '../shops/types';
import type { RidesSimApi } from '../rides/sim';
import { Rng } from '../core/rng';
import { createStore, type StoreHandle } from './store';
import {
  readNeeds,
  weatherFactor,
  moodFromNeeds,
  type NeedModel,
  type NeedRegistry,
} from './needs';
import { attachGuestContent, guestArchetypes, guestParties, guestThoughts } from './manifest';
import {
  compileThoughts,
  evaluateThought,
  signalCount,
  signalIndex,
  type CompiledThought,
} from './thoughts';
import { decide, FLOOR, urgency, type Venue } from './decide';
import { encodeStyle, STYLE_VARIANTS } from './appearance';
import {
  GuestState,
  GUEST_STATE_NAMES,
  type GuestArchetypeDef,
  type GuestRecord,
  type GuestStats,
  type GuestsSimApi,
  type Localized,
} from './types';

// ── The park's day ──────────────────────────────────────────────────────────────────────────
/**
 * Opening hours, owned here only until the management module exists.
 *
 * Nothing in the world model carries them today, so a number had to be chosen; 09:00 to 23:00 is a
 * European park in summer with an evening programme, which is also the only reading under which
 * the 22:00 screenshot is a park rather than a car park. `docs/game/requests/guests.md` asks for
 * this to move to `management`, where a player can change it.
 */
export const PARK_OPEN = 9 * 60;
export const PARK_CLOSE = 23 * 60;
/** How many guests the park holds at its busiest, before appeal scales it. */
const BASE_PEAK = 1500;
/** Hard ceiling. The renderer draws `quality.maxGuestsDrawn` of them; the sim keeps all of them. */
const MAX_GUESTS = 2000;
/**
 * How long a party may have been away from its needs before it reached the gate, in park minutes.
 *
 * Four hours, drawn uniformly per party. It is not a claim about journeys; it is the width of the
 * spread that keeps a park from getting hungry all at once, and it is the difference between a
 * fourteen-hour day whose first four hours take no money and one that trades from the first hour.
 */
const PRE_VISIT_MAX_MINUTES = 240;

/** Parties admitted per tick when the park is filling. A crowd should arrive, not appear. */
const MAX_PARTIES_PER_TICK = 3;
/** A clock move larger than this is a cut, not time passing. */
const JUMP_MINUTES = 8;
/** Guests per party across the shipped party manifest; used only to pace admissions. */
const AVERAGE_PARTY = 2.4;

// ── Movement ────────────────────────────────────────────────────────────────────────────────
/** Waypoint queries a guest may make in one tick; the cap is what bounds the 100× soak. */
const MAX_HOPS_PER_TICK = 8;
/** Close enough to a waypoint to take the next one. */
const ARRIVE_RADIUS = 0.9;
/** Close enough to the destination to act on it. */
const REACH_RADIUS = 3.2;
/** Park minutes of not moving before the guest is treated as lost. */
const LOST_AFTER = 3;
/** Park minutes of not moving before the soak calls it stuck. Nothing should ever reach this. */
const STUCK_AFTER = 10;
/** Crowd grid cell, metres. Two guests in one cell are shoulder to shoulder. */
const CELL = 4;
/** Guests in a cell at which a path stops flowing. */
const JAM = 7;

// ── Shopping ────────────────────────────────────────────────────────────────────────────────
/**
 * Destination kinds, as written into `destKind`.
 *
 * A byte in the store and therefore part of the save, so the numbers are appended to and never
 * reordered. `KIND_QUEUE` is the one that is not a place the guest chose: it is where the shop
 * said to stand, it moves every time the line shuffles forward, and it is deliberately walked to
 * OFF the path graph — a queue slot is on the shop's own apron, and asking `paths.next()` for a
 * route to it answers null, which this module reads as "lost".
 */
const KIND_SHOP = 2;
const KIND_GATE = 6;
const KIND_QUEUE = 7;
/** Offers per need `shops.find()` is asked for. Four is the shortlist `decide` keeps anyway. */
const SHOP_OFFERS = 3;
/** Park minutes a guest with no patience at all will stand in a line; the rest is the archetype's. */
const BALK_BASE = 4;
/** Park minutes of line a guest with `patience: 1` will stand, on top of `BALK_BASE`. */
const BALK_SPAN = 12;
/** Close enough to the spot the shop named to count as standing in the line. */
const STAND_RADIUS = 0.55;
/** The ticket a served guest still carries while they stand at the counter with their food. */
const SPENT_TICKET = -1;
/**
 * Fraction of the walking pace a guest covers the last metre of a line at.
 *
 * Only the last metre, and the distinction is what the first version of this got wrong. Joining is
 * a WALK: the guest is standing up to `REACH_RADIUS` short of the frontage and the spot the shop
 * names is another 0.7–4 m into its apron, so at 0.45 pace a guest took six park minutes to reach
 * the front of an EMPTY queue — longer than the counter takes to serve them — and the line read as
 * a trickle of people walking past a shop rather than as anybody standing at it. Past
 * `SHUFFLE_STEP` they walk at their own pace; inside it, where the move is one place forward, they
 * shuffle, because the crowd renderer interpolates between two frames and cannot tell a step from
 * a teleport.
 */
const SHUFFLE_PACE = 0.45;
/** Metres above which closing the gap to the named spot is a walk rather than a shuffle. */
const SHUFFLE_STEP = 1.2;

interface PathsLike {
  next(
    fromX: number,
    fromZ: number,
    toX: number,
    toZ: number,
    node?: number
  ): { x: number; z: number; node: number } | null;
  reachable(fromX: number, fromZ: number, toX: number, toZ: number): boolean;
  entrance(): { x: number; z: number };
  nearestNode(x: number, z: number, maxDistance?: number): number;
  nodeAt(node: number): { x: number; y: number; z: number; halfWidth: number } | null;
  queues(): ReadonlyArray<{
    entityId: string;
    rideId: string | null;
    tailNode: number;
    headNode: number;
  }>;
  version(): number;
  stats(): { nodes: number; edges: number; components: number; entities: number };
}

interface TerrainLike {
  height(x: number, z: number): number;
}

interface RegistryLike {
  find(
    category: 'shops' | 'rides' | 'scenery',
    pack: string,
    item: string
  ): { def: Record<string, unknown> } | undefined;
}

export function createGuestsSim(ctx: SimContext): SimHandle {
  const detachContent = attachGuestContent(ctx.registry);
  const paths = ctx.module<PathsLike>('paths');
  const terrain = ctx.module<TerrainLike>('terrain');
  const registry = ctx.registry as unknown as RegistryLike;

  // Four streams. Adding a roll to one may not shift another (ARCHITECTURE §1 rule 1).
  const rngArrivals = ctx.rng.fork('arrivals');
  const rngBodies = ctx.rng.fork('bodies');
  const rngChoice = ctx.rng.fork('choice');
  const rngWander = ctx.rng.fork('wander');

  /**
   * The counters, if anybody is running them.
   *
   * Resolved lazily and re-asked for until it answers, rather than captured once at construction:
   * `ctx.module` reads the runtime's handle map, and which modules are in it is the integrator's
   * list — a showcase loads five. Everything below has a `shops == null` branch that is exactly
   * what this module did before the bridge existed, so an absent counter is a park with no shops in
   * it and not a park with broken ones.
   */
  let shops: ShopsSimApi | undefined;
  /**
   * The rides module's sim half, resolved per call for the same reason `shopsApi` is: a showcase
   * loads five modules and not twenty-four, and a park with no `rides` in it must still run.
   */
  let rides: RidesSimApi | undefined;
  let ridesBridgeStoodDown = false;
  function ridesApi(): RidesSimApi | undefined {
    if (!rides) rides = ctx.module<RidesSimApi>('rides');
    // Told once, the first time this module actually holds the handle: `rides` ships a walk-up
    // bridge that scans the guest store and puts people in lines by proximity, and with this
    // module joining for real the two would each give the same person a place. Its own docblock
    // says it exists until this hook lands.
    if (rides && !ridesBridgeStoodDown) {
      ridesBridgeStoodDown = true;
      rides.setBridge(false);
    }
    return rides;
  }

  function shopsApi(): ShopsSimApi | undefined {
    if (!shops) shops = ctx.module<ShopsSimApi>('shops');
    return shops;
  }

  let needs: NeedModel = readNeeds(ctx.registry as unknown as NeedRegistry);
  let archetypes: GuestArchetypeDef[] = guestArchetypes();
  let thoughts: CompiledThought[] = compile();
  const store: StoreHandle = createStore(
    256,
    needs.columns.map((c) => c.id)
  );
  /** Per-archetype need multipliers, flattened to `archetype × needCount`. */
  let needWeights = buildNeedWeights();

  const offPack = ctx.registry.onPack(() => {
    needs = readNeeds(ctx.registry as unknown as NeedRegistry);
    archetypes = guestArchetypes();
    store.setNeedColumns(needs.columns.map((c) => c.id));
    needWeights = buildNeedWeights();
    thoughts = compile();
    venuesDirty = true;
  });

  function compile(): CompiledThought[] {
    return compileThoughts(
      guestThoughts(),
      (id) => needs.byId.get(id)?.column ?? -1,
      (message) => console.warn(`[game/guests] ${message}`)
    );
  }

  function buildNeedWeights(): Float32Array {
    const out = new Float32Array(Math.max(1, archetypes.length) * Math.max(1, needs.count));
    archetypes.forEach((a, i) => {
      for (let c = 0; c < needs.count; c++) {
        out[i * needs.count + c] = a.needs[needs.columns[c].id] ?? 1;
      }
    });
    return out;
  }

  // ── Errands ───────────────────────────────────────────────────────────────────────────────
  /**
   * What a guest is doing at a shop, keyed by slot.
   *
   * Sparse on purpose — only the few dozen people mid-errand are in here, against a store that
   * carries two thousand — and never iterated for anything the simulation depends on: every read is
   * a `get` in the slot-ascending loop the tick already runs. `serialize` sorts it by slot so the
   * bytes are stable, and that is the whole reason it can be a `Map` at all.
   *
   * `ticket` is the shop's own handle and `0` means "walking there, not in the line yet". Which of
   * those two a guest is in is also readable off `destKind`, and the two must agree: `join` is the
   * only place a ticket is issued and `endErrand` the only place one is dropped.
   */
  interface Errand {
    /**
     * Which module holds the other half of this ticket.
     *
     * One map rather than two, because the serialisation is one sorted list and two would have to
     * agree about the order of a slot that appears in both — which cannot happen, but proving that
     * costs more than a discriminator. `venue` is the shop's or the ride's entity id.
     */
    kind: 'shop' | 'ride';
    venue: string;
    ticket: number;
    /** Absolute park minute they joined the line; 0 while still walking. */
    joined: number;
    /** Absolute park minute they give up. */
    balkAt: number;
  }
  const errands = new Map<number, Errand>();

  /**
   * Give up a ticket and forget the errand.
   *
   * Called from every exit a guest has — served, balked, refused, gone home, re-seeded after a
   * clock jump — because a ticket nobody hands back is a person standing in a shop's line who is
   * not in the park any more, and the shop would hold their place for `BALK_AFTER` park minutes.
   */
  function endErrand(slot: number, giveUp: boolean): void {
    const errand = errands.get(slot);
    if (!errand) return;
    errands.delete(slot);
    if (giveUp && errand.ticket > 0) {
      if (errand.kind === 'ride') ridesApi()?.leave(errand.venue, errand.ticket);
      else shopsApi()?.leave(errand.venue, errand.ticket);
    }
  }

  /** Every outstanding ticket, handed back in slot order. A clock jump discards the whole park. */
  function endAllErrands(): void {
    const slots = [...errands.keys()].sort((a, b) => a - b);
    for (const slot of slots) endErrand(slot, true);
  }

  // ── World index ───────────────────────────────────────────────────────────────────────────
  let venues: Venue[] = [];
  let venuesDirty = true;
  let graphVersion = -1;
  let rideCount = 0;
  let shopCount = 0;
  let sceneryPoints: Float32Array = new Float32Array(0);
  const venueById = new Map<string, Venue>();
  /**
   * The reservations a save carried, waiting for the index that will hold them.
   *
   * Same shape as the shops module's `pending`, and for the same reason: `rebuild()` runs before
   * the first tick but `venues` is built lazily from the entity list, so the numbers have nowhere
   * to land yet.
   */
  let pendingIncoming: Array<[string, number]> | null = null;
  /** `venues` plus this guest's shop offers. Refilled per decision; see `rebuildVenues`. */
  let candidates: Venue[] = [];
  let staticVenues = 0;
  /**
   * One reusable `Venue` per offer slot.
   *
   * `decide` reads a candidate and hands one back; nothing keeps a reference past the call, so the
   * objects are pooled. Without it a park of 1 400 people re-planning every few park minutes mints
   * a few thousand short-lived objects a tick, which is a garbage collector inside the 6 ms budget.
   */
  const offerPool: Venue[] = [];

  const markDirty = (entity: Entity): void => {
    if (entity.kind === 'shop' || entity.kind === 'ride' || entity.kind === 'scenery') {
      venuesDirty = true;
    }
  };
  const offAdd = ctx.events.on('entity:add', markDirty);
  const offRemove = ctx.events.on('entity:remove', markDirty);
  const offUpdate = ctx.events.on('entity:update', (change: { entity: Entity }) =>
    markDirty(change.entity)
  );
  const offPaths = ctx.events.on('paths:changed', () => {
    venuesDirty = true;
  });

  /**
   * Rebuild the destination index from the world.
   *
   * Everything in here is derived from a manifest field rather than from an id: a shop's `need`
   * and `needRelief`, a ride's `excitement`, and a scenery prop's `furniture === 'bench'`. So a
   * pack that ships a new bench is a place to sit with no code change, and this module never
   * learns the word `bench-wood`.
   *
   * **Shops are in here only when nothing better is.** With the `shops` module loaded, a shop
   * venue built from the entity list would be a second, worse model of the same building: it would
   * price it off the manifest rather than off the entity's own data bag, guess a wait from
   * `incoming / throughput`, and know nothing about opening hours or an empty counter. So the
   * entities are still COUNTED — `shopCount` feeds the park's appeal and the `shops` thought
   * signal — and the candidates come from `shops.find()` per decision instead.
   */
  function rebuildVenues(): void {
    venuesDirty = false;
    graphVersion = paths?.version() ?? 0;
    venues = [];
    venueById.clear();
    rideCount = 0;
    shopCount = 0;
    const sights: number[] = [];
    const ownShops = shopsApi() == null;

    for (const id of Object.keys(ctx.world.entities).sort()) {
      const entity = ctx.world.entities[id];
      const [x, , z] = entity.position;
      if (entity.kind === 'shop') {
        const def = registry.find('shops', entity.pack, entity.item)?.def;
        if (!def) continue;
        shopCount++;
        if (!ownShops) continue;
        const needId = typeof def.need === 'string' ? def.need : 'none';
        const column = needs.byId.get(needId)?.column ?? -1;
        const amount = typeof def.needRelief === 'number' ? def.needRelief : 160;
        venues.push({
          id,
          kind: 'shop',
          x,
          z,
          relief: column >= 0 ? [{ column, amount }] : [],
          price: typeof def.price === 'number' ? def.price : 0,
          excitement: 0,
          throughput: typeof def.throughput === 'number' ? def.throughput : 4,
          incoming: 0,
        });
      } else if (entity.kind === 'ride') {
        const def = registry.find('rides', entity.pack, entity.item)?.def;
        if (!def) continue;
        rideCount++;
        const happiness = needs.byId.get('happiness');
        venues.push({
          id,
          kind: 'ride',
          x,
          z,
          relief: happiness ? [{ column: happiness.column, amount: 190 }] : [],
          price: typeof def.price === 'number' ? def.price : 0,
          excitement: typeof def.excitement === 'number' ? def.excitement : 4,
          throughput: typeof def.capacity === 'number' ? def.capacity / 3 : 6,
          incoming: 0,
        });
      } else if (entity.kind === 'scenery') {
        const def = registry.find('scenery', entity.pack, entity.item)?.def;
        if (!def) continue;
        const footprint = Array.isArray(def.footprint) ? (def.footprint as number[]) : [1, 1];
        const area = (footprint[0] ?? 1) * (footprint[1] ?? 1);
        if (def.furniture === 'bench') {
          const energy = needs.byId.get('energy');
          venues.push({
            id,
            kind: 'seat',
            x,
            z,
            relief: energy ? [{ column: energy.column, amount: 120 }] : [],
            price: 0,
            excitement: 0,
            throughput: 0.5,
            incoming: 0,
          });
        } else if (area >= 4 && def.furniture == null) {
          // Something worth stopping in front of: a fountain, a parterre, an arch. Derived from
          // the footprint the manifest declares, not from a list of ids.
          sights.push(x, z);
          const happiness = needs.byId.get('happiness');
          if (sights.length <= 48) {
            venues.push({
              id,
              kind: 'sight',
              x,
              z,
              relief: happiness ? [{ column: happiness.column, amount: 34 }] : [],
              price: 0,
              excitement: 0,
              throughput: 3,
              incoming: 0,
            });
          }
        } else if (area >= 0.9) {
          sights.push(x, z);
        }
      }
    }
    sceneryPoints = new Float32Array(sights);

    // Wander points: somewhere to go when there is nothing to do. Sampled off the path graph so
    // they are always on a walkable surface and always reachable from it.
    const nodes = paths?.stats().nodes ?? 0;
    if (nodes > 0 && paths) {
      const wanted = Math.min(96, Math.max(8, Math.floor(nodes / 12)));
      const stride = Math.max(1, Math.floor(nodes / wanted));
      for (let i = 0, n = 0; i < nodes && n < wanted; i += stride, n++) {
        const node = paths.nodeAt(i);
        if (!node) continue;
        venues.push({
          id: `w${i}`,
          kind: 'wander',
          x: node.x,
          z: node.z,
          relief: [],
          price: 0,
          excitement: 0,
          throughput: 0,
          incoming: 0,
        });
      }
    }
    for (const venue of venues) venueById.set(venue.id, venue);
    // The soft reservations a save was written with, applied to the index that has just been built
    // from the entities. Consumed once: a later rebuild (a bench added, the path graph re-cut) is
    // not a load and must keep whatever the venues have accumulated since.
    if (pendingIncoming) {
      for (const [id, count] of pendingIncoming) {
        const venue = venueById.get(id);
        if (venue) venue.incoming = count;
      }
      pendingIncoming = null;
    }
    // The shortlist `chooseDestination` scores: these, plus whatever the shops answer with. The
    // static half is copied once here rather than per decision, and the offers are truncated back
    // to `staticVenues` each time, so a plan costs a `length =` and three pushes.
    candidates = venues.slice();
    staticVenues = candidates.length;
  }

  // ── Crowd grid ────────────────────────────────────────────────────────────────────────────
  const parkSize = ctx.world.terrain?.size ?? 512;
  const gridW = Math.max(1, Math.ceil(parkSize / CELL) + 2);
  const gridOrigin = -parkSize / 2 - CELL;
  const density = new Uint16Array(gridW * gridW);

  function cellOf(x: number, z: number): number {
    const i = Math.floor((x - gridOrigin) / CELL);
    const j = Math.floor((z - gridOrigin) / CELL);
    if (i < 0 || j < 0 || i >= gridW || j >= gridW) return -1;
    return j * gridW + i;
  }

  // ── State ─────────────────────────────────────────────────────────────────────────────────
  const d = store.data;
  let lastAbsMinute = absMinute();
  let arrivedToday = 0;
  let leftToday = 0;
  let spentToday = 0;
  let boughtToday = 0;
  /**
   * Errands that ended in nothing, by reason, reset with the day.
   *
   * The five shop refusals plus two this side owns: `balk`, the guest running out of patience, and
   * `dropped`, a ticket that stopped being a place in a line without a receipt on it — sold out at
   * the counter, or still standing there at closing. Declared with every key so the save is the
   * same shape whatever happened, which is what keeps two serialisations comparable.
   */
  const REFUSAL_KEYS = [
    'closed',
    'full',
    'stock',
    'price',
    'unknown',
    'balk',
    'dropped',
    // A ride can refuse for two reasons a counter cannot, and they are counted under their own
    // names rather than folded into `closed`: a broken machine is an operations problem and a
    // height limit is a fact about the person, and a park manager wants to tell them apart.
    'broken',
    'height',
  ] as const;
  /** `rides`' own refusal vocabulary, mapped onto this module's counters. */
  const RIDE_REFUSAL: Record<string, string> = {
    closed: 'closed',
    broken: 'broken',
    'too-short': 'height',
    'queue-full': 'full',
    'no-money': 'price',
    'unknown-ride': 'unknown',
  };
  const zeroRefusals = (): Record<string, number> =>
    Object.fromEntries(REFUSAL_KEYS.map((k) => [k, 0]));
  let refusedToday: Record<string, number> = zeroRefusals();
  let nextGroup = 1;
  let partyDebt = 0;
  let thoughtCursor = 0;
  let thoughtBudget = 0;
  let maxSlot = 0;
  /** Thought counts this day, for the management panel later. */
  const thoughtTally = new Map<string, number>();
  const signals = new Float64Array(signalCount());
  const SIG = {
    happiness: signalIndex('happiness'),
    mood: signalIndex('mood'),
    cash: signalIndex('cash'),
    queueMinutes: signalIndex('queueMinutes'),
    crowding: signalIndex('crowding'),
    rain: signalIndex('rain'),
    hot: signalIndex('hot'),
    cold: signalIndex('cold'),
    lostMinutes: signalIndex('lostMinutes'),
    leaving: signalIndex('leaving'),
    visitMinutes: signalIndex('visitMinutes'),
    rides: signalIndex('rides'),
    shops: signalIndex('shops'),
    scenery: signalIndex('scenery'),
    urgentNeeds: signalIndex('urgentNeeds'),
  };

  function absMinute(): number {
    return ctx.world.clock.day * 1440 + ctx.world.clock.minute;
  }

  /**
   * Share of the peak population in the park at this minute.
   *
   * Six anchors and linear interpolation between them, which is the shape every gate count in a
   * park operator's annual report has: a hard ramp after opening, a broad afternoon plateau, and a
   * long evening tail that does not reach zero until the gates do.
   */
  function attendance(minute: number): number {
    const points: Array<[number, number]> = [
      [PARK_OPEN - 30, 0],
      [PARK_OPEN + 60, 0.34],
      [PARK_OPEN + 180, 0.82],
      [13 * 60, 1],
      [16 * 60, 0.95],
      [19 * 60, 0.7],
      [21 * 60 + 30, 0.36],
      [PARK_CLOSE, 0.04],
      [PARK_CLOSE + 45, 0],
    ];
    if (minute <= points[0][0]) return 0;
    for (let i = 1; i < points.length; i++) {
      if (minute <= points[i][0]) {
        const [x0, y0] = points[i - 1];
        const [x1, y1] = points[i];
        const t = (minute - x0) / Math.max(1, x1 - x0);
        return y0 + (y1 - y0) * t;
      }
    }
    return 0;
  }

  /**
   * How many people the park could hold at its busiest.
   *
   * Rides and shops raise it; the base term is not zero because a park with gardens and a gate is
   * still somewhere people walk on a Sunday, which is exactly the state of the demo park today.
   * When the rides module lands this is the line that turns three coasters into a queue.
   */
  function peakPopulation(): number {
    const appeal = 0.55 + rideCount * 0.09 + shopCount * 0.02;
    return Math.min(MAX_GUESTS, Math.round(BASE_PEAK * Math.min(1.6, appeal)));
  }

  // ── Spawning ──────────────────────────────────────────────────────────────────────────────
  function pickWeighted<T extends { weight: number }>(list: readonly T[], rng: Rng): T | null {
    let total = 0;
    for (const entry of list) total += Math.max(0, entry.weight);
    if (total <= 0) return null;
    let roll = rng.next() * total;
    for (const entry of list) {
      roll -= Math.max(0, entry.weight);
      if (roll <= 0) return entry;
    }
    return list[list.length - 1];
  }

  function archetypeIndex(id: string): number {
    for (let i = 0; i < archetypes.length; i++) if (archetypes[i].id === id) return i;
    return -1;
  }

  /**
   * Admit one party.
   *
   * `at` places them; `aged` is how many park minutes of need decay to give them on arrival, which
   * is 0 for a real arrival and a real number when the park is being re-seeded after a clock jump.
   */
  /**
   * `aged` is time already spent INSIDE the park; `preVisit` is time spent getting to it.
   *
   * They are two different things and only the first one belongs in `arrivedAt`/`leaveAt`. The
   * second exists because every guest used to walk in with its needs seeded at a flat 6-42 of 255,
   * which made a whole park identical and about five hours away from wanting anything: measured
   * from the 09:00 boot at speed 1, `takingsToday` was 0 at park minute 720 with 620 people inside
   * and still 0 at 780, and the first sale landed somewhere before 1,020. Four hours of a fourteen
   * hour operating day with no revenue in them, on a park full of visitors.
   *
   * Nobody arrives having just eaten. A coach party that left at six is not a family that drove in
   * from twenty minutes away, so the pre-visit history is drawn PER PARTY and the needs are aged by
   * it with the same arithmetic `resettle()` already uses for time inside.
   */
  function spawnParty(
    at: { x: number; y: number; z: number } | null,
    aged: number,
    preVisit = 0
  ): number {
    const party = pickWeighted(guestParties(), rngArrivals);
    if (!party) return 0;
    const group = nextGroup++;
    const now = absMinute();
    const members: number[] = [];
    for (const member of party.members) {
      const index = archetypeIndex(member.archetype);
      if (index < 0) continue;
      const count = rngArrivals.int(member.count[0], member.count[1]);
      for (let i = 0; i < count; i++) {
        if (d.count >= MAX_GUESTS) break;
        const slot = store.alloc();
        if (slot < 0) break;
        members.push(slot);
        initGuest(slot, index, group, at, aged, preVisit, now, members.length - 1);
      }
    }
    if (!members.length) return 0;
    const leader = members[0];
    for (const slot of members) d.leader[slot] = leader;
    if (maxSlot < leader) maxSlot = leader;
    for (const slot of members) if (maxSlot < slot) maxSlot = slot;
    arrivedToday += members.length;
    return members.length;
  }

  function initGuest(
    slot: number,
    index: number,
    group: number,
    at: { x: number; y: number; z: number } | null,
    aged: number,
    preVisit: number,
    now: number,
    inGroup: number
  ): void {
    const archetype = archetypes[index];
    if (!archetype) return;
    d.archetype[slot] = index;
    d.style[slot] = encodeStyle(index, rngBodies.int(0, STYLE_VARIANTS - 1));
    d.group[slot] = group;
    d.state[slot] = at ? GuestState.WALKING : GuestState.ARRIVING;

    const gate = paths?.entrance() ?? { x: 0, z: parkSize * 0.33 };
    const spread = 1.4;
    const x = at ? at.x + rngBodies.range(-spread, spread) : gate.x + rngBodies.range(-4, 4);
    const z = at ? at.z + rngBodies.range(-spread, spread) : gate.z + rngBodies.range(1, 9);
    d.x[slot] = x;
    d.z[slot] = z;
    d.y[slot] = at ? at.y : (terrain?.height(x, z) ?? 0) + 0.07;
    d.lastX[slot] = x;
    d.lastZ[slot] = z;
    d.heading[slot] = rngBodies.range(-Math.PI, Math.PI);
    d.phase[slot] = rngBodies.range(0, Math.PI * 2);
    // ±7 % on the pace on top of the archetype's, plus a lane across the path. Both exist for the
    // same reason: a column of identical figures on one line is the clearest tell a crowd is
    // instanced, and neither costs anything.
    d.speed[slot] = archetype.speed * rngBodies.range(0.93, 1.07);
    d.actual[slot] = d.speed[slot];
    d.lane[slot] = rngBodies.range(-1, 1) * 0.62 + (inGroup % 2 === 0 ? 0.18 : -0.18);
    d.node[slot] = -1;
    d.wpNode[slot] = -1;
    d.cash[slot] = rngBodies.int(archetype.wallet[0], archetype.wallet[1]);
    d.arrivedAt[slot] = now - aged;
    d.leaveAt[slot] = now - aged + rngBodies.int(archetype.stay[0], archetype.stay[1]);
    d.happiness[slot] = 78 + rngBodies.range(-8, 8);
    d.decideIn[slot] = 0;
    d.thought[slot] = -1;
    // The store hands out the LOWEST free slot, so this is the one the last person to walk out was
    // in. Everything else about them was zeroed; the errand lives beside the store rather than in
    // it, so it is cleared here — an inherited one would send a new arrival to somebody else's
    // counter with somebody else's ticket.
    errands.delete(slot);

    const base = slot * d.needCount;
    for (let c = 0; c < needs.count; c++) {
      const need = needs.columns[c];
      const weight = needWeights[index * needs.count + c];
      // A guest arrives with a little of everything already on the clock; nobody walks through a
      // gate having just eaten, slept and been to the toilet. The flat part is the jitter between
      // people in one party; `preVisit` is the party's own history and is what stops a park
      // opening with fourteen hundred identical visitors.
      const start = rngBodies.range(6, 42);
      const grown = (need.decayPerHour * weight * (aged + preVisit)) / 60;
      d.needs[base + c] = Math.max(0, Math.min(255, start + grown));
    }
    d.mood[slot] = moodFromNeeds(
      d.needs,
      base,
      needs,
      needWeights.subarray(index * needs.count, index * needs.count + needs.count)
    );
    if (aged > 0)
      d.happiness[slot] = Math.max(20, Math.min(100, d.mood[slot] + rngBodies.range(-8, 8)));
  }

  // ── Re-seeding after a clock jump ─────────────────────────────────────────────────────────
  function resettle(): void {
    // Hand every ticket back before the people holding them stop existing. A shop keeps a place in
    // its line for `BALK_AFTER` park minutes whatever happens to the guest, so a jump that skipped
    // this would photograph a counter whose queue is full of nobody.
    endAllErrands();
    store.clear();
    maxSlot = 0;
    nextGroup = 1;
    arrivedToday = 0;
    leftToday = 0;
    spentToday = 0;
    boughtToday = 0;
    refusedToday = zeroRefusals();
    if (venuesDirty || graphVersion !== (paths?.version() ?? 0)) rebuildVenues();
    const minute = ctx.world.clock.minute;
    const target = Math.round(peakPopulation() * attendance(minute));
    if (target <= 0) return;
    const nodes = paths?.stats().nodes ?? 0;
    let guard = 0;
    while (d.count < target && guard++ < target * 2) {
      let at: { x: number; y: number; z: number } | null = null;
      if (nodes > 0 && paths) {
        const node = paths.nodeAt(rngWander.int(0, nodes - 1));
        if (node) at = { x: node.x, y: node.y, z: node.z };
      }
      // Time already spent inside: somebody in the park at 18:30 has been there a while, and a
      // crowd whose needs are all at zero behaves like a crowd that has just walked in.
      const inside = Math.min(300, Math.max(0, minute - PARK_OPEN)) * rngWander.next();
      spawnParty(at, inside, rngWander.range(0, PRE_VISIT_MAX_MINUTES));
    }
    // Everybody who was placed on the network gets a destination immediately, so the first frame
    // after a jump has people walking rather than a field of statues.
    for (let slot = 0; slot <= maxSlot; slot++) {
      if (d.state[slot] === GuestState.GONE) continue;
      if (d.leader[slot] !== slot) continue;
      chooseDestination(slot);
    }
    for (let slot = 0; slot <= maxSlot; slot++) {
      if (d.state[slot] === GuestState.GONE) continue;
      if (d.leader[slot] === slot) continue;
      followLeader(slot);
    }
  }

  // ── Decisions ─────────────────────────────────────────────────────────────────────────────
  const scratchWeights = new Float32Array(64);

  function weightsFor(index: number): Float32Array {
    const n = needs.count;
    if (scratchWeights.length < n) return needWeights.subarray(index * n, index * n + n);
    for (let c = 0; c < n; c++) scratchWeights[c] = needWeights[index * n + c];
    return scratchWeights.subarray(0, n);
  }

  /**
   * Ask the counters what they can do for this guest, and turn the answers into candidates.
   *
   * One `find()` per need that is actually pressing, and "pressing" is not a mood: it is the exact
   * relief term `scoreVenue` would compute, tested against the same `FLOOR` the decision uses. Every
   * factor applied after it — the price penalty, the wait penalty, the walk — is at most 1, so a
   * need that cannot clear the floor on its own cannot produce a candidate that clears it either,
   * and the query is skipped without changing a single decision. In the demo park that is one or
   * two calls where the naive version made seven.
   *
   * The offer is trusted for everything it carries. `frontage` and not `at`, because those are two
   * points the moment a build tool lets a player turn a kiosk round; `waitMinutes` rather than this
   * module's `incoming / throughput` guess, because a real line has been counted at the other end.
   */
  function shopCandidates(slot: number, index: number): void {
    const api = shopsApi();
    candidates.length = staticVenues;
    if (!api) return;
    const base = slot * d.needCount;
    const weights = needWeights;
    let pooled = 0;
    for (let c = 0; c < needs.count; c++) {
      const need = needs.columns[c];
      const level = d.needs[base + c];
      if (level <= 0) continue;
      const weight = weights[index * needs.count + c];
      // The relief term, with the shop's own relief still unknown — 255 stands in for "all of it",
      // which is the most generous reading and therefore the safe one for a gate that only skips.
      const value =
        urgency(level, need.urgentAt, need.criticalAt) * (level / 255) * need.moodWeight;
      if (value * weight <= FLOOR) continue;
      const offers = api.find(need.id, d.x[slot], d.z[slot], d.cash[slot], SHOP_OFFERS);
      for (const offer of offers) {
        candidates.push(fillOffer(pooled++, offer, c));
      }
    }
  }

  function fillOffer(index: number, offer: ShopOffer, column: number): Venue {
    let venue = offerPool[index];
    if (!venue) {
      venue = {
        id: '',
        kind: 'shop',
        x: 0,
        z: 0,
        relief: [{ column: 0, amount: 0 }],
        price: 0,
        excitement: 0,
        throughput: 0,
        incoming: 0,
      };
      offerPool[index] = venue;
    }
    venue.id = offer.id;
    venue.x = offer.frontage[0];
    venue.z = offer.frontage[1];
    venue.relief[0].column = column;
    venue.relief[0].amount = offer.relief;
    venue.price = offer.price;
    venue.waitMinutes = offer.waitMinutes;
    return venue;
  }

  function chooseDestination(slot: number): void {
    const index = d.archetype[slot];
    const archetype = archetypes[index];
    if (!archetype) return;
    endErrand(slot, true);
    shopCandidates(slot, index);
    const result = decide({
      venues: candidates,
      needs,
      archetype,
      levels: d.needs,
      base: slot * d.needCount,
      x: d.x[slot],
      z: d.z[slot],
      cash: d.cash[slot],
      speed: d.speed[slot],
      needWeights: weightsFor(index),
      rng: rngChoice,
      lastVenue: '',
    });
    if (!result) {
      d.destKind[slot] = 0;
      d.state[slot] = GuestState.IDLE;
      d.busyUntil[slot] = absMinute() + 2;
      return;
    }
    const venue = result.venue;
    // O(1): two component labels compared. A destination in another component is a guest who would
    // otherwise walk into a fence forever.
    if (paths && !paths.reachable(d.x[slot], d.z[slot], venue.x, venue.z)) {
      d.destKind[slot] = 0;
      d.state[slot] = GuestState.LOST;
      d.decideIn[slot] = 1.5;
      return;
    }
    setDestination(slot, venue.x, venue.z, kindCode(venue.kind));
    // Which shop, remembered now: `arriveAt` fires three park minutes from here on a REACH_RADIUS
    // that catches whatever is nearest, and "the shop I chose" is not a thing a position can be
    // asked afterwards once two kiosks share a plot.
    if (venue.kind === 'shop' && shopsApi()) {
      errands.set(slot, { kind: 'shop', venue: venue.id, ticket: 0, joined: 0, balkAt: 0 });
    } else if (venue.kind === 'ride' && ridesApi()) {
      errands.set(slot, { kind: 'ride', venue: venue.id, ticket: 0, joined: 0, balkAt: 0 });
    } else {
      // A pooled offer is refilled on the next decision, so a reservation written into one is a
      // number nobody will ever read; the real line is what `waitMinutes` already said.
      venue.incoming += 1;
    }
    d.decideIn[slot] = 4 + rngChoice.next() * 8;
  }

  function kindCode(kind: Venue['kind']): number {
    switch (kind) {
      case 'shop':
        return KIND_SHOP;
      case 'ride':
        return 3;
      case 'seat':
        return 4;
      case 'sight':
        return 5;
      case 'gate':
        return KIND_GATE;
      default:
        return 1;
    }
  }

  function setDestination(slot: number, x: number, z: number, kind: number): void {
    d.destX[slot] = x;
    d.destZ[slot] = z;
    d.destKind[slot] = kind;
    d.state[slot] = kind === 6 ? GuestState.LEAVING : GuestState.WALKING;
    d.wpNode[slot] = -1;
  }

  /**
   * Does this guest still have a leader?
   *
   * The group id is compared as well as the slot, and that is not belt and braces: the store hands
   * out the LOWEST free slot, so the slot a leader vacated at the gate is the first one the next
   * arrival gets. Without the group check a family whose parent went home would spend the rest of
   * the day following a stranger who happened to inherit the parent's slot.
   */
  function hasLeader(slot: number): boolean {
    const leader = d.leader[slot];
    if (leader === slot || leader < 0 || leader >= d.capacity) return false;
    if (d.state[leader] === GuestState.GONE) return false;
    return d.group[leader] === d.group[slot];
  }

  /**
   * Whose wallet pays for what this guest is about to do.
   *
   * A party has one purse and it is the leader's. That is not a simplification of the money model,
   * it is the money model the archetypes were written for — the `family` entry says so in its own
   * comment ("a parent buys for the children too") and the `child` entry carries a wallet of
   * 200-900 cents, which is pocket money and not a share of the family's day out. Every follower
   * paid for itself until now, so a child sent to the burger van behind its parent arrived with
   * 4.20 in hand against a 6.50 counter and was turned away: 5,824 price refusals against 1,652
   * sales in a measured park day, and every one of them a person who walked somewhere for nothing.
   *
   * Only the leader ever plans, so the scorer and `shops.find()` were already reading this wallet
   * when they decided the party was going. Paying from a different one at the counter is what made
   * the two disagree.
   */
  function purseOf(slot: number): number {
    return hasLeader(slot) ? d.leader[slot] : slot;
  }

  function followLeader(slot: number): void {
    if (!hasLeader(slot)) {
      d.leader[slot] = slot;
      return;
    }
    // Somebody standing in a line is not available to be led anywhere; they have a ticket.
    if (d.destKind[slot] === KIND_QUEUE) return;
    const leader = d.leader[slot];
    if (d.state[leader] === GuestState.LEAVING) {
      leaveNow(slot);
      return;
    }
    // A leader already in a line is not a destination. The follower keeps whatever it was doing —
    // usually walking to the same shop, where it will join and get a ticket of its own — because
    // copying a queue slot would put two people on one square metre and give one of them a place in
    // a line they never joined.
    if (d.destKind[leader] === 0 || d.destKind[leader] === KIND_QUEUE) return;
    // A party walks abreast rather than in single file: the member's own lane offset is what
    // spreads them across the path, and it is already in `stepMove`.
    d.destX[slot] = d.destX[leader];
    d.destZ[slot] = d.destZ[leader];
    d.destKind[slot] = d.destKind[leader];
    // Which shop, so the follower joins the one the leader chose rather than whatever building it
    // happens to stop within 3.2 m of.
    const errand = errands.get(leader);
    if ((d.destKind[leader] === KIND_SHOP || d.destKind[leader] === 3) && errand) {
      errands.set(slot, {
        kind: errand.kind,
        venue: errand.venue,
        ticket: 0,
        joined: 0,
        balkAt: 0,
      });
    } else {
      endErrand(slot, true);
    }
    if (d.state[slot] !== GuestState.SITTING && d.state[slot] !== GuestState.BUYING) {
      d.state[slot] = GuestState.WALKING;
    }
    d.wpNode[slot] = -1;
    d.decideIn[slot] = d.decideIn[leader];
  }

  function leaveNow(slot: number): void {
    endErrand(slot, true);
    const gate = paths?.entrance() ?? { x: 0, z: parkSize * 0.33 };
    setDestination(slot, gate.x, gate.z, KIND_GATE);
    d.state[slot] = GuestState.LEAVING;
  }

  // ── Arrival at a destination ──────────────────────────────────────────────────────────────
  function arriveAt(slot: number, now: number): void {
    const kind = d.destKind[slot];
    const errand = errands.get(slot);
    // The soft reservation is a static venue's business. A shop's is a real queue, counted at the
    // counter, so an errand skips this — and skips the 3 m position search that finds it.
    if (!errand) {
      const venue = venueById.get(nearestVenueId(slot));
      if (venue && venue.incoming > 0) venue.incoming -= 1;
    }
    switch (kind) {
      case KIND_GATE: {
        // The gate. This is the only exit; a guest is never deleted mid-park.
        endErrand(slot, true);
        leftToday++;
        ctx.events.emit('guest:left', {
          id: d.id[slot],
          happiness: Math.round(d.happiness[slot]),
          spent: d.spent[slot],
        });
        store.free(slot);
        return;
      }
      case 4: {
        d.state[slot] = GuestState.SITTING;
        d.busyUntil[slot] = now + 3 + rngChoice.next() * 9;
        break;
      }
      case KIND_SHOP: {
        // With a counter answering, arriving is joining a line — and being turned away from one is
        // an outcome too. The old path below is what happens when no `shops` module is loaded: walk
        // up, stand there for a park minute, take the manifest's relief.
        if (errand) {
          if (!joinQueue(slot, errand, now)) refuseErrand(slot, errand, now);
          return;
        }
        d.state[slot] = GuestState.BUYING;
        d.busyUntil[slot] = now + 0.6 + rngChoice.next() * 1.6;
        break;
      }
      case 3: {
        // A ride, and there is a line to join — the same two lines as a counter, because
        // `RidesSimApi` is deliberately the same five verbs as `ShopsSimApi`.
        //
        // The fallback under it is what this branch used to be on its own: a guest reaching a ride
        // with no `rides` module behind it waits and moves on, which is what somebody does at a
        // machine that is not running. It is still the path a showcase takes.
        const errand = errands.get(slot);
        if (errand && errand.kind === 'ride') {
          if (!joinQueue(slot, errand, now)) refuseErrand(slot, errand, now);
          return;
        }
        d.state[slot] = GuestState.QUEUING;
        d.busyUntil[slot] = now + 2 + rngChoice.next() * 4;
        break;
      }
      default: {
        d.state[slot] = GuestState.IDLE;
        d.busyUntil[slot] = now + 0.5 + rngChoice.next() * 3.5;
        break;
      }
    }
    d.destKind[slot] = 0;
  }

  function nearestVenueId(slot: number): string {
    // The venue the guest was walking to, by position. Cheaper than storing an id per guest and
    // exact enough: two venues never share a metre.
    let best = '';
    let bestD = 9;
    for (const venue of venues) {
      const dx = venue.x - d.destX[slot];
      const dz = venue.z - d.destZ[slot];
      const dist = dx * dx + dz * dz;
      if (dist < bestD) {
        bestD = dist;
        best = venue.id;
      }
    }
    return best;
  }

  // ── The counter ───────────────────────────────────────────────────────────────────────────
  /**
   * Join the line, and start walking to the spot the shop names.
   *
   * The guest is standing within `REACH_RADIUS` of the frontage at this point, which is up to 3.2 m
   * short of it, and the spot is another 0.7–4 m into the shop's apron — so joining is not arriving.
   * The walk to it goes through `KIND_QUEUE`, which is the one destination this module reaches
   * WITHOUT the path graph: the apron is the shop's own paving and `paths.next()` has nothing to
   * say about it, so asking would answer null and this module reads null as lost.
   */
  function joinQueue(slot: number, errand: Errand, now: number): boolean {
    let ticket = 0;
    let stand: [number, number] | null = null;
    if (errand.kind === 'ride') {
      const api = ridesApi();
      if (!api) return false;
      // The height is the archetype's, in centimetres, because that is what a ride's own limit is
      // written in — a child at 1.18 m is turned away from a machine that asks for 1.20 and the
      // refusal is counted under its own name below.
      const archetype = archetypes[d.archetype[slot]];
      const join = api.join(errand.venue, d.id[slot], {
        heightCm: Math.round((archetype?.height ?? 1.7) * 100),
        cash: d.cash[purseOf(slot)],
      });
      if (!join) return false;
      ticket = join.ticket;
      stand = [join.x, join.z];
    } else {
      const api = shopsApi();
      if (!api) return false;
      const join = api.join(errand.venue, d.id[slot], d.cash[purseOf(slot)]);
      if (!join) return false;
      ticket = join.ticket;
      stand = join.stand;
    }
    errand.ticket = ticket;
    errand.joined = now;
    const archetype = archetypes[d.archetype[slot]];
    // How long they will stand there before it is not worth it — their own patience, not the
    // shop's. The shop has a limit too and it is longer for most archetypes, so who gives up first
    // is a fact about the person: a child at 0.2 lasts 6.4 park minutes, an enthusiast at 0.95
    // lasts 15.4 and is thrown out by the shop's own 14 before that.
    errand.balkAt = now + BALK_BASE + (archetype?.patience ?? 0.5) * BALK_SPAN;
    setDestination(slot, stand[0], stand[1], KIND_QUEUE);
    return true;
  }

  /**
   * Turned away, with a reason.
   *
   * A guest who walked to a counter and got nothing used to be indistinguishable from one that
   * wandered off, which is the criticism the shops module made of this bridge in its own report.
   * The reason comes from the shop rather than from a guess here, it is counted, and the need that
   * sent them keeps rising — so the next plan looks somewhere else, and `find()` will not offer
   * this shop again while whatever was wrong with it is still wrong.
   */
  function refuseErrand(slot: number, errand: Errand, now: number): void {
    const why: string =
      errand.kind === 'ride'
        ? RIDE_REFUSAL[ridesApi()?.lastRefusal(errand.venue) ?? 'unknown-ride']
        : (shopsApi()?.lastRefusal(errand.venue) ?? 'unknown');
    refusedToday[why] = (refusedToday[why] ?? 0) + 1;
    endErrand(slot, false);
    d.destKind[slot] = 0;
    d.state[slot] = GuestState.IDLE;
    d.busyUntil[slot] = now + 0.4 + rngChoice.next() * 0.8;
    d.decideIn[slot] = 0;
    // Being turned away is a small unhappiness, and it is the only one this module charges for a
    // shop: a queue that is merely slow is already paid for by the need that kept rising in it.
    d.happiness[slot] = Math.max(0, d.happiness[slot] - 2);
  }

  /**
   * One tick of standing in a line.
   *
   * Four questions in a fixed order, and the order is the contract. `collect` first, because the
   * shops module ticks before this one and a sale completed in the same step is already sitting
   * there as a receipt — asking `place` first would read null and call a served guest lost. Then
   * `place`, which answers null for everything else that can end a ticket: sold out at the counter,
   * thrown out at closing time, balked by the shop's own patience. Then this guest's own patience.
   * Then the shuffle.
   */
  function stepQueue(slot: number, dt: number, now: number): void {
    const errand = errands.get(slot);
    const api = errand?.kind === 'ride' ? undefined : shopsApi();
    const rides = errand?.kind === 'ride' ? ridesApi() : undefined;
    /** Where this ticket stands now, whichever module holds it. Null means the ticket is gone. */
    const placeOf = (): [number, number] | null =>
      errand
        ? errand.kind === 'ride'
          ? (rides?.place(errand.venue, errand.ticket) ?? null)
          : (api?.place(errand.venue, errand.ticket) ?? null)
        : null;
    const leaveLine = (): void => {
      if (!errand) return;
      if (errand.kind === 'ride') rides?.leave(errand.venue, errand.ticket);
      else api?.leave(errand.venue, errand.ticket);
    };
    if ((!api && !rides) || !errand || errand.ticket <= 0) {
      // Nothing is holding this guest here. Never leave one standing: a queue with no counter
      // behind it is exactly the "stuck guest" the soak fails on.
      endErrand(slot, false);
      d.destKind[slot] = 0;
      d.state[slot] = GuestState.IDLE;
      d.decideIn[slot] = 0;
      return;
    }
    d.stuckFor[slot] = 0;

    if (errand.kind === 'ride') {
      // `board` is the ride's `collect`: the receipt exists exactly once, on the tick the machine
      // took them on. Everything below it is the same four questions in the same order, and the
      // order is the same contract — `rides` ticks before this module, so a boarding completed in
      // this step is already sitting there and asking `place` first would read null and call a
      // rider lost.
      const boarding = rides?.board(errand.venue, errand.ticket) ?? null;
      if (boarding) {
        const purse = purseOf(slot);
        const paid = Math.min(d.cash[purse], Math.max(0, boarding.price));
        d.cash[purse] -= paid;
        d.spent[purse] += paid;
        spentToday += paid;
        boughtToday += 1;
        // `rides` banked it. Crediting `finance.cash` here as well is the two-writers failure the
        // determinism axis exists for, and it is the same reason the shop path below does not.
        const fun = needs.byId.get('fun') ?? needs.byId.get('happiness');
        if (fun) {
          const at = slot * d.needCount + fun.column;
          d.needs[at] = Math.max(0, d.needs[at] - 70 - boarding.satisfaction * 0.3);
        }
        // What they thought of it, weighted by what they came for: `satisfaction` is the machine's
        // opinion of the ride it just gave, and the archetype's thrill preference is the person's.
        const archetype = archetypes[d.archetype[slot]];
        const match = 1 - Math.abs((archetype?.thrill ?? 0.5) - boarding.satisfaction / 100);
        d.happiness[slot] = Math.min(100, d.happiness[slot] + 2 + 8 * match);
        errand.ticket = SPENT_TICKET;
        d.destKind[slot] = 0;
        d.state[slot] = GuestState.RIDING;
        d.busyUntil[slot] = now + boarding.rideMinutes;
        d.decideIn[slot] = 0;
        return;
      }
    }

    const sale = api ? api.collect(errand.venue, errand.ticket) : null;
    if (sale) {
      const base = slot * d.needCount;
      const purse = purseOf(slot);
      const paid = Math.min(d.cash[purse], Math.max(0, sale.cents));
      d.cash[purse] -= paid;
      d.spent[purse] += paid;
      spentToday += paid;
      boughtToday += 1;
      // `shops` banked it in `completeSale`. Crediting `finance.cash` here as well is the "two
      // writers of one number" the determinism axis fails a module for, and it is why the old
      // `serve()` path below is unreachable whenever a counter answered.
      const column = needs.byId.get(sale.need)?.column;
      if (column !== undefined) {
        const at = base + column;
        d.needs[at] = Math.max(0, d.needs[at] - sale.relief);
      }
      d.happiness[slot] = Math.min(100, d.happiness[slot] + 3);
      // The errand stays in the map with a spent ticket for as long as the guest is at the counter
      // taking their food, and that is what tells `stepBehaviour` not to run `serve()` over the top
      // of a sale that has already been paid for. Dropped there, not here.
      errand.ticket = SPENT_TICKET;
      d.destKind[slot] = 0;
      d.state[slot] = GuestState.BUYING;
      d.busyUntil[slot] = now + 0.4 + rngChoice.next() * 1.1;
      d.decideIn[slot] = 0;
      return;
    }

    const stand = placeOf();
    if (!stand) {
      // The ticket is gone and there was no sale on it: sold out, closing time, or the shop's own
      // balk. `lastRefusal` is per shop rather than per ticket, so this is counted under its own
      // name instead of borrowing one that may belong to somebody else's join.
      refusedToday.dropped += 1;
      endErrand(slot, false);
      d.destKind[slot] = 0;
      d.state[slot] = GuestState.IDLE;
      d.busyUntil[slot] = now + 0.3;
      d.decideIn[slot] = 0;
      return;
    }

    if (now >= errand.balkAt) {
      leaveLine();
      // `leave` only reaches the line, never a till: a guest already being served cannot be pulled
      // back, and asking again is how this tells the two apart without a fifth API call.
      if (placeOf() == null) {
        refusedToday.balk += 1;
        endErrand(slot, false);
        d.destKind[slot] = 0;
        d.state[slot] = GuestState.IDLE;
        d.decideIn[slot] = 0;
        d.happiness[slot] = Math.max(0, d.happiness[slot] - 4);
        return;
      }
    }

    // Shuffle. The spot moves every time somebody ahead is served, and a line that snaps to its new
    // spot is a line the renderer draws teleporting — it interpolates between two frames and has no
    // way to tell a step from a jump.
    d.destX[slot] = stand[0];
    d.destZ[slot] = stand[1];
    const dx = stand[0] - d.x[slot];
    const dz = stand[1] - d.z[slot];
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len <= STAND_RADIUS) {
      d.state[slot] = GuestState.QUEUING;
      d.actual[slot] = 0;
      // Face the counter, which is the direction the line runs, not wherever they last walked.
      const stall = shopsApi()?.frontage(errand.venue);
      if (stall) d.heading[slot] = turnToward(d.heading[slot], atan2To(stall, slot), 0.25);
      return;
    }
    d.state[slot] = GuestState.WALKING;
    const speed = d.speed[slot] * (len > SHUFFLE_STEP ? 1 : SHUFFLE_PACE);
    const step = Math.min(speed * dt, len);
    d.x[slot] += (dx / len) * step;
    d.z[slot] += (dz / len) * step;
    d.y[slot] = (terrain?.height(d.x[slot], d.z[slot]) ?? d.y[slot]) + 0.07;
    d.actual[slot] = speed;
    d.heading[slot] = turnToward(d.heading[slot], Math.atan2(dx, dz), Math.min(1, dt * 6));
    d.phase[slot] = (d.phase[slot] + step * 3.7) % (Math.PI * 2);
    d.lastX[slot] = d.x[slot];
    d.lastZ[slot] = d.z[slot];
  }

  function atan2To(at: [number, number], slot: number): number {
    return Math.atan2(at[0] - d.x[slot], at[1] - d.z[slot]);
  }

  /** Pay for what the venue sells and take the relief. */
  function serve(slot: number): void {
    const venue = venueById.get(nearestVenueId(slot));
    if (!venue) return;
    if (venue.price > 0) {
      const purse = purseOf(slot);
      if (d.cash[purse] < venue.price) return;
      d.cash[purse] -= venue.price;
      d.spent[purse] += venue.price;
      spentToday += venue.price;
      ctx.world.finance.cash += venue.price;
      ctx.events.emit('shop:sale', { shop: venue.id, cents: venue.price, guest: d.id[slot] });
    }
    const base = slot * d.needCount;
    for (const relief of venue.relief) {
      d.needs[base + relief.column] = Math.max(0, d.needs[base + relief.column] - relief.amount);
    }
    d.happiness[slot] = Math.min(100, d.happiness[slot] + 3);
  }

  // ── The tick ──────────────────────────────────────────────────────────────────────────────
  /**
   * Milliseconds the last tick cost, measured with the worker's own clock.
   *
   * `performance.now()` and not `Date.now()`: the determinism rule bans the latter because it is a
   * wall clock a save could be replayed against, and this number never enters the world state — it
   * is a report for the soak harness and the HUD, written after the tick has already happened.
   */
  let lastTickMs = 0;

  function tick(dtMinutes: number): void {
    const started = performance.now();
    try {
      tickBody(dtMinutes);
    } finally {
      lastTickMs = performance.now() - started;
    }
  }

  function tickBody(dtMinutes: number): void {
    const now = absMinute();
    const jumped = Math.abs(now - lastAbsMinute - dtMinutes) > JUMP_MINUTES;
    lastAbsMinute = now;
    if (jumped) {
      resettle();
      return;
    }
    if (venuesDirty || graphVersion !== (paths?.version() ?? 0)) rebuildVenues();

    const env = ctx.environment();
    admit(dtMinutes);
    fillDensity();

    const minute = ctx.world.clock.minute;
    const closing = minute > PARK_CLOSE - 45 || minute < PARK_OPEN - 60;

    for (let slot = 0; slot <= maxSlot; slot++) {
      if (d.state[slot] === GuestState.GONE) continue;
      stepNeeds(slot, dtMinutes, env);
      stepBehaviour(slot, dtMinutes, now, closing);
      stepMove(slot, dtMinutes);
    }
    stepThoughts(dtMinutes, env, now);
  }

  /**
   * Let people in.
   *
   * The shortfall against the attendance curve is closed over about an hour of park time rather
   * than at once, through a fractional debt, so a park fills and empties instead of stepping. The
   * `ceil` this replaced admitted a party on every tick that had any shortfall at all, which at
   * 20 ticks a park minute filled a 1 400-guest park in fourteen park minutes.
   */
  function admit(dtMinutes: number): void {
    const minute = ctx.world.clock.minute;
    const target = Math.round(peakPopulation() * attendance(minute));
    if (d.count >= target) {
      partyDebt = 0;
      return;
    }
    partyDebt += ((target - d.count) * dtMinutes) / 60 / AVERAGE_PARTY;
    // Capped so a paused park, or one whose clock crawled, does not empty its queue in one tick.
    if (partyDebt > MAX_PARTIES_PER_TICK) partyDebt = MAX_PARTIES_PER_TICK;
    while (partyDebt >= 1 && d.count < target) {
      partyDebt -= 1;
      // 0 to 4 hours since this party last met its needs. Uniform on purpose: the point is the
      // SPREAD, so that a park has somebody ready to buy in its first hour and somebody who will
      // not want anything until the afternoon, rather than one crowd that all gets hungry at once.
      if (spawnParty(null, 0, rngArrivals.range(0, PRE_VISIT_MAX_MINUTES)) === 0) break;
    }
  }

  function fillDensity(): void {
    density.fill(0);
    for (let slot = 0; slot <= maxSlot; slot++) {
      if (d.state[slot] === GuestState.GONE) continue;
      const cell = cellOf(d.x[slot], d.z[slot]);
      if (cell >= 0 && density[cell] < 65535) density[cell]++;
    }
  }

  function stepNeeds(slot: number, dt: number, env: EnvironmentState): void {
    const index = d.archetype[slot];
    const base = slot * d.needCount;
    const hours = dt / 60;
    for (let c = 0; c < needs.count; c++) {
      const need = needs.columns[c];
      const weight = needWeights[index * needs.count + c];
      const rise = need.decayPerHour * weight * weatherFactor(need, env) * hours;
      // No `Math.round` here, and no clamp to an integer: the column is a Float32 precisely so a
      // rise of 0.0217 per tick accumulates instead of vanishing.
      const level = d.needs[base + c] + rise;
      d.needs[base + c] = level > 255 ? 255 : level < 0 ? 0 : level;
    }
    const weights = needWeights.subarray(index * needs.count, index * needs.count + needs.count);
    const mood = moodFromNeeds(d.needs, base, needs, weights);
    d.mood[slot] = mood;
    // Happiness lags the mood and is what a thought moves. A guest whose needs are met does not
    // instantly forget the twenty minutes they spent looking for a toilet.
    const rate = Math.min(1, dt / 25);
    d.happiness[slot] += (mood - d.happiness[slot]) * rate;
    if (d.happiness[slot] < 0) d.happiness[slot] = 0;
    if (d.happiness[slot] > 100) d.happiness[slot] = 100;
  }

  function stepBehaviour(slot: number, dt: number, now: number, closing: boolean): void {
    d.decideIn[slot] -= dt;

    // 0. Holding a ticket. Nothing else applies while a guest is in somebody's line — not the
    //    leader's plan, not the closing sweep — and `stepQueue` is the only way out of it.
    if (d.destKind[slot] === KIND_QUEUE) {
      stepQueue(slot, dt, now);
      return;
    }

    // 1. Timed states: sitting on a bench, being served, standing in a line.
    const busy = d.state[slot];
    if (
      busy === GuestState.SITTING ||
      busy === GuestState.BUYING ||
      busy === GuestState.QUEUING ||
      busy === GuestState.RIDING
    ) {
      if (now < d.busyUntil[slot]) {
        if (busy === GuestState.SITTING) {
          const energy = needs.byId.get('energy');
          if (energy) {
            const at = slot * d.needCount + energy.column;
            // Resting is worth about three times what walking costs, which is why a bench is a
            // destination at all and not just somewhere to stop.
            d.needs[at] = Math.max(0, d.needs[at] - energy.decayPerHour * 3 * (dt / 60));
          }
        }
        return;
      }
      // `serve` is the no-shops-module path: it moves the money AND takes the relief. A guest who
      // came through a counter has been paid for once already, at `collect`, and calling this on
      // them would credit `finance.cash` a second time for one sale. The spent ticket still in the
      // map is what says which of the two this was.
      if (busy === GuestState.BUYING) {
        if (errands.has(slot)) errands.delete(slot);
        else serve(slot);
      }
      // Off the machine. The ticket is spent by now, so `leave` is a courtesy the ride uses to
      // free the seat rather than a way out of a line — and dropping the errand here is what stops
      // a rider being counted as still aboard for the rest of the park's life.
      if (busy === GuestState.RIDING) {
        const errand = errands.get(slot);
        if (errand) {
          ridesApi()?.leave(errand.venue, errand.ticket);
          errands.delete(slot);
        }
      }
      d.state[slot] = GuestState.IDLE;
      d.busyUntil[slot] = now;
      d.destKind[slot] = 0;
      d.decideIn[slot] = 0;
      return;
    }

    if (busy === GuestState.IDLE && now < d.busyUntil[slot]) return;

    // 2. Time to go? Only a leader decides that; a party leaves together, and a follower whose own
    // stay is up waits for the rest of them, which is what people do.
    if (d.state[slot] !== GuestState.LEAVING) {
      if (hasLeader(slot)) {
        if (d.state[d.leader[slot]] === GuestState.LEAVING) {
          leaveNow(slot);
          return;
        }
      } else {
        const broke = d.cash[slot] < 100;
        const miserable = d.happiness[slot] < 24;
        if (closing || now >= d.leaveAt[slot] || miserable || (broke && d.mood[slot] < 45)) {
          leaveNow(slot);
          return;
        }
      }
    }

    // 3. Lost: try again, and give up after long enough. Standing still is what an entity does.
    if (d.state[slot] === GuestState.LOST) {
      d.lostFor[slot] += dt;
      if (d.decideIn[slot] <= 0) {
        if (d.lostFor[slot] > 12) leaveNow(slot);
        else chooseDestination(slot);
        d.decideIn[slot] = 2;
      }
      return;
    }

    if (d.state[slot] === GuestState.LEAVING) return;

    // 4. Followers copy the leader; only the leader plans.
    if (hasLeader(slot)) {
      if (d.decideIn[slot] <= 0 || d.destKind[slot] === 0) followLeader(slot);
      return;
    }

    // 5. Plan. Momentum is the point: a guest re-plans when it has arrived, or when a need has
    // gone past its own `criticalAt` and the previous decision has had a moment to run. Re-scoring
    // every tick makes guests turn round in the middle of the path.
    const base = slot * d.needCount;
    let critical = false;
    for (let c = 0; c < needs.count; c++) {
      if (d.needs[base + c] >= needs.columns[c].criticalAt) {
        critical = true;
        break;
      }
    }
    if (d.destKind[slot] === 0 || (critical && d.decideIn[slot] <= 0)) chooseDestination(slot);
  }

  /**
   * Walk.
   *
   * The waypoint comes from `paths.next(...)`, which is one array read after the first call for a
   * destination (the paths module keeps a route tree per destination). The guest's own `lane`
   * offset is applied ACROSS the direction of travel and clamped to the node's half-width, so a
   * crowd fills the width of a path instead of threading its centreline, and an eight-metre avenue
   * looks like an eight-metre avenue rather than a queue.
   */
  function stepMove(slot: number, dt: number): void {
    // A queue slot is off the graph and `stepQueue` has already moved this guest to it. Routing to
    // it would ask `paths.next()` for the apron of a shop, get null, and call the guest lost.
    if (d.destKind[slot] === KIND_QUEUE) return;
    const state = d.state[slot];
    const moving =
      state === GuestState.WALKING ||
      state === GuestState.LEAVING ||
      state === GuestState.ARRIVING ||
      state === GuestState.LOST;
    if (!moving) {
      d.actual[slot] = 0;
      d.stuckFor[slot] = 0;
      return;
    }

    const cell = cellOf(d.x[slot], d.z[slot]);
    const crowd = cell >= 0 ? density[cell] : 0;
    // A busy path is a slow path. This is where the bunching at junctions comes from: nothing
    // steers around anybody, but everybody slows down where everybody is.
    const jam = Math.min(0.72, Math.max(0, (crowd - 2) / JAM) * 0.72);
    const speed = d.speed[slot] * (1 - jam);
    d.actual[slot] = speed;

    let budget = speed * dt;
    if (budget <= 0) return;
    const startX = d.x[slot];
    const startZ = d.z[slot];

    for (let hop = 0; hop < MAX_HOPS_PER_TICK && budget > 0; hop++) {
      let tx = d.wpX[slot];
      let tz = d.wpZ[slot];
      if (d.wpNode[slot] < 0) {
        const wp = paths?.next(
          d.x[slot],
          d.z[slot],
          d.destX[slot],
          d.destZ[slot],
          d.node[slot] >= 0 ? d.node[slot] : undefined
        );
        if (!wp) {
          // No route. Either the destination is reached, or the graph cannot answer.
          const dx = d.destX[slot] - d.x[slot];
          const dz = d.destZ[slot] - d.z[slot];
          if (dx * dx + dz * dz <= REACH_RADIUS * REACH_RADIUS) {
            arriveAt(slot, absMinute());
            return;
          }
          // Walk at it directly. A lost guest walks across the grass, which is what people do.
          const len = Math.sqrt(dx * dx + dz * dz) || 1;
          const step = Math.min(budget, len);
          d.x[slot] += (dx / len) * step;
          d.z[slot] += (dz / len) * step;
          d.heading[slot] = Math.atan2(dx, dz);
          budget -= step;
          d.lostFor[slot] += dt;
          if (d.lostFor[slot] > LOST_AFTER && d.state[slot] !== GuestState.LEAVING) {
            d.state[slot] = GuestState.LOST;
          }
          break;
        }
        d.lostFor[slot] = 0;
        d.node[slot] = wp.node;
        d.wpNode[slot] = wp.node;
        const node = paths?.nodeAt(wp.node);
        const half = node ? Math.max(0.4, node.halfWidth - 0.55) : 1;
        // The lane offset is perpendicular to the leg being walked, which is why it is applied
        // here and not at the destination.
        const ax = wp.x - d.x[slot];
        const az = wp.z - d.z[slot];
        const alen = Math.sqrt(ax * ax + az * az) || 1;
        const offset = Math.max(-half, Math.min(half, d.lane[slot] * half));
        d.wpX[slot] = wp.x + (-az / alen) * offset;
        d.wpZ[slot] = wp.z + (ax / alen) * offset;
        if (node) d.y[slot] += (node.y - d.y[slot]) * Math.min(1, dt * 3);
        tx = d.wpX[slot];
        tz = d.wpZ[slot];
      }

      const dx = tx - d.x[slot];
      const dz = tz - d.z[slot];
      const len = Math.sqrt(dx * dx + dz * dz);
      if (len <= ARRIVE_RADIUS) {
        d.x[slot] = tx;
        d.z[slot] = tz;
        d.wpNode[slot] = -1;
        const ddx = d.destX[slot] - d.x[slot];
        const ddz = d.destZ[slot] - d.z[slot];
        if (ddx * ddx + ddz * ddz <= REACH_RADIUS * REACH_RADIUS) {
          arriveAt(slot, absMinute());
          return;
        }
        continue;
      }
      const step = Math.min(budget, len);
      d.x[slot] += (dx / len) * step;
      d.z[slot] += (dz / len) * step;
      // Turn towards the direction of travel rather than snapping to it: a snap is what makes a
      // crowd look like arrows on a map.
      const want = Math.atan2(dx, dz);
      d.heading[slot] = turnToward(d.heading[slot], want, Math.min(1, dt * 6));
      budget -= step;
      if (step >= len) d.wpNode[slot] = -1;
    }

    const movedX = d.x[slot] - startX;
    const movedZ = d.z[slot] - startZ;
    const moved = Math.sqrt(movedX * movedX + movedZ * movedZ);
    // The walk cycle advances with the ground covered, not with the clock, so a guest slowed by a
    // crowd takes shorter steps instead of moonwalking.
    d.phase[slot] = (d.phase[slot] + moved * 3.7) % (Math.PI * 2);
    if (moved < 0.02 * Math.max(0.25, dt)) {
      d.stuckFor[slot] += dt;
      if (d.stuckFor[slot] > LOST_AFTER && d.state[slot] !== GuestState.LEAVING) {
        d.state[slot] = GuestState.LOST;
        d.wpNode[slot] = -1;
        d.node[slot] = -1;
      }
      if (d.stuckFor[slot] > STUCK_AFTER) {
        // Never a frozen entity: give up on the network entirely and walk out.
        leaveNow(slot);
        d.stuckFor[slot] = 0;
        d.node[slot] = -1;
        d.wpNode[slot] = -1;
      }
    } else {
      d.stuckFor[slot] = 0;
    }
    d.lastX[slot] = d.x[slot];
    d.lastZ[slot] = d.z[slot];

    if (d.state[slot] === GuestState.ARRIVING && d.destKind[slot] === 0) {
      d.state[slot] = GuestState.WALKING;
      d.decideIn[slot] = 0;
    }
  }

  function turnToward(from: number, to: number, t: number): number {
    let delta = to - from;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    return from + delta * t;
  }

  // ── Thoughts ──────────────────────────────────────────────────────────────────────────────
  function stepThoughts(dt: number, env: EnvironmentState, now: number): void {
    if (!thoughts.length || d.count === 0) return;
    thoughtBudget = Math.min(4, thoughtBudget + dt * 0.9);
    const slice = Math.max(8, Math.ceil((maxSlot + 1) / 32));
    for (let n = 0; n < slice; n++) {
      thoughtCursor = (thoughtCursor + 1) % Math.max(1, maxSlot + 1);
      const slot = thoughtCursor;
      if (d.state[slot] === GuestState.GONE) continue;
      const base = slot * d.needCount;
      let urgent = 0;
      for (let c = 0; c < needs.count; c++) {
        if (d.needs[base + c] >= needs.columns[c].urgentAt) urgent++;
      }
      const cell = cellOf(d.x[slot], d.z[slot]);
      signals[SIG.happiness] = d.happiness[slot];
      signals[SIG.mood] = d.mood[slot];
      signals[SIG.cash] = d.cash[slot];
      // Park minutes ALREADY spent in the line, which is what the signal's own docstring promises
      // and what a person complains about. The fallback is the ride placeholder's timer, where the
      // only number available is how much of it is left.
      const errand = errands.get(slot);
      signals[SIG.queueMinutes] =
        errand && errand.joined > 0 && errand.ticket > 0
          ? Math.max(0, now - errand.joined)
          : d.state[slot] === GuestState.QUEUING
            ? Math.max(0, d.busyUntil[slot] - now)
            : 0;
      signals[SIG.crowding] = cell >= 0 ? Math.min(1, density[cell] / JAM) : 0;
      signals[SIG.rain] = env.precipitation === 'none' ? 0 : env.intensity;
      signals[SIG.hot] = Math.max(0, Math.min(1, (env.temperatureC - 19) / 12));
      signals[SIG.cold] = Math.max(0, Math.min(1, (9 - env.temperatureC) / 12));
      signals[SIG.lostMinutes] = d.lostFor[slot];
      signals[SIG.leaving] = d.state[slot] === GuestState.LEAVING ? 1 : 0;
      signals[SIG.visitMinutes] = now - d.arrivedAt[slot];
      signals[SIG.rides] = rideCount;
      signals[SIG.shops] = shopCount;
      signals[SIG.scenery] = sceneryNear(d.x[slot], d.z[slot]);
      signals[SIG.urgentNeeds] = urgent;

      const hit = evaluateThought(thoughts, signals, d.needs, base);
      const chosen = hit >= 0 ? thoughts[hit] : null;
      const fromNeed = chosen ? null : needThought(slot, base);
      if (!chosen && !fromNeed) continue;

      const id = chosen ? chosen.def.id : `need:${fromNeed?.id}`;
      const index = chosen ? hit : -1;
      if (d.thought[slot] === index && now - d.thoughtAt[slot] < (chosen?.def.cooldown ?? 45)) {
        continue;
      }
      d.thought[slot] = index;
      d.thoughtAt[slot] = now;
      if (chosen) {
        d.happiness[slot] = Math.max(0, Math.min(100, d.happiness[slot] + chosen.def.mood));
      }
      thoughtTally.set(id, (thoughtTally.get(id) ?? 0) + 1);
      if (thoughtBudget >= 1) {
        thoughtBudget -= 1;
        ctx.events.emit('guest:thought', {
          id: d.id[slot],
          slot,
          thought: chosen ? chosen.def.text : (fromNeed?.text as Localized),
          mood: chosen ? chosen.def.mood : -2,
          at: [d.x[slot], d.y[slot], d.z[slot]],
        });
      }
    }
  }

  /** The most urgent need past its own threshold, and one of the lines the pack declared for it. */
  function needThought(slot: number, base: number): { id: string; text: Localized } | null {
    let worst = -1;
    let worstOver = 0;
    for (let c = 0; c < needs.count; c++) {
      const need = needs.columns[c];
      if (!need.thoughts.length) continue;
      const over = d.needs[base + c] - need.urgentAt;
      if (over > worstOver) {
        worstOver = over;
        worst = c;
      }
    }
    if (worst < 0) return null;
    const need = needs.columns[worst];
    const pick = need.thoughts[d.id[slot] % need.thoughts.length];
    return { id: need.id, text: pick };
  }

  function sceneryNear(x: number, z: number): number {
    let n = 0;
    for (let i = 0; i + 1 < sceneryPoints.length; i += 2) {
      const dx = sceneryPoints[i] - x;
      const dz = sceneryPoints[i + 1] - z;
      if (dx * dx + dz * dz < 625) n++;
      if (n >= 24) break;
    }
    return n;
  }

  // ── Reporting ─────────────────────────────────────────────────────────────────────────────
  function stats(): GuestStats {
    const byState: Record<string, number> = {};
    const needTotals = new Float64Array(Math.max(1, needs.count));
    const unmet: Record<string, number> = {};
    let happiness = 0;
    let mood = 0;
    let stuck = 0;
    let lost = 0;
    const groups = new Set<number>();
    const answered = new Uint8Array(Math.max(1, needs.count));
    for (const venue of venues) for (const relief of venue.relief) answered[relief.column] = 1;
    // With a shops module loaded, the shops are not in `venues` — so `unmet` would report every
    // hungry guest as unanswered in a park full of burger vans. The counters say which needs they
    // are open for; `unanswered` on their side is the same question asked the other way round.
    const api = shopsApi();
    if (api) {
      for (const view of api.list()) {
        if (!view.open || view.stock <= 0) continue;
        const column = needs.byId.get(view.need)?.column;
        if (column !== undefined) answered[column] = 1;
      }
    }

    let queuing = 0;
    for (let slot = 0; slot <= maxSlot; slot++) {
      const state = d.state[slot];
      if (state === GuestState.GONE) continue;
      if (d.destKind[slot] === KIND_QUEUE) queuing++;
      const name = GUEST_STATE_NAMES[state] ?? String(state);
      byState[name] = (byState[name] ?? 0) + 1;
      happiness += d.happiness[slot];
      mood += d.mood[slot];
      groups.add(d.group[slot]);
      if (d.stuckFor[slot] > STUCK_AFTER) stuck++;
      if (state === GuestState.LOST) lost++;
      const base = slot * d.needCount;
      for (let c = 0; c < needs.count; c++) {
        needTotals[c] += d.needs[base + c];
        if (!answered[c] && d.needs[base + c] >= needs.columns[c].urgentAt) {
          const id = needs.columns[c].id;
          unmet[id] = (unmet[id] ?? 0) + 1;
        }
      }
    }
    const n = Math.max(1, d.count);
    const needAverages: Record<string, number> = {};
    for (let c = 0; c < needs.count; c++) {
      needAverages[needs.columns[c].id] = Number((needTotals[c] / n).toFixed(1));
    }
    for (const need of needs.columns) if (!(need.id in unmet)) unmet[need.id] = 0;
    return {
      count: d.count,
      capacity: d.capacity,
      arrivedToday,
      leftToday,
      byState,
      meanHappiness: Number((happiness / n).toFixed(1)),
      meanMood: Number((mood / n).toFixed(1)),
      needs: needAverages,
      unmet,
      stuck,
      lost,
      groups: groups.size,
      spentToday,
      queuing,
      boughtToday,
      refusedToday: { ...refusedToday },
      tickMs: Number(lastTickMs.toFixed(3)),
    };
  }

  const api: GuestsSimApi = {
    count: () => d.count,
    stuckCount() {
      let stuck = 0;
      for (let slot = 0; slot <= maxSlot; slot++) {
        if (d.state[slot] === GuestState.GONE) continue;
        if (d.stuckFor[slot] > STUCK_AFTER) stuck++;
      }
      return stuck;
    },
    stats,
    needs: () => needs.columns.map((c) => ({ ...c })),
    archetypes: () => archetypes.map((a) => ({ ...a })),
    spawn(n) {
      let made = 0;
      let guard = 0;
      while (made < n && guard++ < n * 3 && d.count < MAX_GUESTS)
        // The debug spawner gets the same history as the admission path, or a park summoned from
        // the console behaves differently from one that filled itself.
        made += spawnParty(null, 0, rngArrivals.range(0, PRE_VISIT_MAX_MINUTES));
      return made;
    },
    inspect(slot): GuestRecord | null {
      if (slot < 0 || slot >= d.capacity || d.state[slot] === GuestState.GONE) return null;
      const base = slot * d.needCount;
      const levels: Record<string, number> = {};
      for (let c = 0; c < needs.count; c++) levels[needs.columns[c].id] = d.needs[base + c];
      const thoughtIndex = d.thought[slot];
      const errand = errands.get(slot);
      return {
        slot,
        id: d.id[slot],
        archetype: archetypes[d.archetype[slot]]?.id ?? 'unknown',
        state: GUEST_STATE_NAMES[d.state[slot]] ?? 'unknown',
        position: [d.x[slot], d.y[slot], d.z[slot]],
        happiness: Math.round(d.happiness[slot]),
        mood: Math.round(d.mood[slot]),
        cash: d.cash[slot],
        needs: levels,
        group: d.group[slot],
        arrivedAt: d.arrivedAt[slot],
        destination: d.destKind[slot] ? [d.destX[slot], d.destZ[slot]] : null,
        thought: thoughtIndex >= 0 ? (thoughts[thoughtIndex]?.def.text ?? null) : null,
        errand: errand
          ? {
              shop: errand.venue,
              ticket: errand.ticket,
              waited: errand.joined > 0 ? Math.max(0, absMinute() - errand.joined) : 0,
            }
          : null,
      };
    },
  };

  ctx.events.on('clock:day', () => {
    arrivedToday = 0;
    leftToday = 0;
    spentToday = 0;
    boughtToday = 0;
    refusedToday = zeroRefusals();
    thoughtTally.clear();
  });

  return {
    api,
    tick,
    command(cmd: Command): boolean {
      if (cmd.type === 'guests:spawn') {
        const payload = cmd.payload as { count?: number } | null;
        api.spawn(Math.max(1, Math.min(500, Math.floor(payload?.count ?? 1))));
        return true;
      }
      if (cmd.type === 'guests:clear') {
        endAllErrands();
        store.clear();
        maxSlot = 0;
        return true;
      }
      return false;
    },
    /**
     * Five buffers, `maxSlot + 1` entries each, dead slots included.
     *
     * Slots are stable so index `i` is the same person between two frames, which is what the main
     * thread's interpolation needs; the cost is the dead slots, which at a park's worst is a few
     * hundred bytes. `guests.style` is the appearance word both sides decode with `appearance.ts`.
     */
    fill(writer) {
      const n = d.count === 0 ? 0 : maxSlot + 1;
      const position = writer.f32('guests.position', n * 3);
      const heading = writer.f32('guests.heading', n);
      const anim = writer.u8('guests.anim', n);
      const phase = writer.u8('guests.phase', n);
      const style = writer.u16('guests.style', n);
      let happinessSum = 0;
      for (let slot = 0; slot < n; slot++) {
        if (d.state[slot] !== GuestState.GONE) happinessSum += d.happiness[slot];
        position[slot * 3] = d.x[slot];
        position[slot * 3 + 1] = d.y[slot];
        position[slot * 3 + 2] = d.z[slot];
        heading[slot] = d.heading[slot];
        anim[slot] = d.state[slot];
        phase[slot] = Math.round((d.phase[slot] / (Math.PI * 2)) * 255) & 0xff;
        style[slot] = d.style[slot];
      }
      // Two scalars, computed in the loop above rather than by calling `stats()`: that walks every
      // need column of every guest and allocates a Set, twenty times a second, for two numbers.
      writer.stat('guests.count', d.count);
      writer.stat('guests.happiness', d.count ? Math.round((happinessSum / d.count) * 10) / 10 : 0);
    },
    serialize() {
      return {
        version: 1,
        store: store.serialize(),
        nextGroup,
        arrivedToday,
        leftToday,
        spentToday,
        boughtToday,
        refusedToday: { ...refusedToday },
        // Tickets, and they are state in exactly the way the three accumulators below are.
        //
        // A guest holding one is a person standing in a shop's line, and the shop has that ticket
        // in its own save; drop this half and a resumed park has a queue of ghosts at the counter
        // and a crowd of people who walked to a shop and forgot why. Written as an array sorted by
        // slot rather than as the `Map`'s own order, because insertion order is the order people
        // happened to join and a resumed run rebuilds it in slot order — two identical parks whose
        // saves differ by nothing but the order of a list is the same failure as the unsigned rng
        // words the shops module found.
        errands: [...errands.keys()]
          .sort((a, b) => a - b)
          .map((slot) => {
            const errand = errands.get(slot) as Errand;
            return {
              slot,
              kind: errand.kind,
              venue: errand.venue,
              ticket: errand.ticket,
              joined: errand.joined,
              balkAt: errand.balkAt,
            };
          }),
        /**
         * The soft reservations on the venues, and they are the fourth unsaved accumulator.
         *
         * `incoming` is how many people said they were on their way somewhere; `scoreVenue`
         * divides a candidate's worth by the wait it implies, so it is an input to every decision.
         * Rebuilt from the entity list it starts at zero, which means the first plan made after a
         * resume is scored against an empty park — and it showed up as exactly that: one tick after
         * a save was reloaded, `rng.choice` had advanced a different number of draws and
         * `decideIn`, `destX` and `destZ` differed, with every position, need and id identical.
         * Same class as `partyDebt` and the thought cursor, found the same way.
         *
         * Sorted by id, and only the non-zero ones: two identical parks must serialise to the same
         * bytes, and a `Map` in whatever order the venues happened to be indexed does not.
         */
        //
        // Still pending means the index has not been built since the load, so nothing has changed
        // them and the save is written back as it arrived: save → load → save is byte-identical
        // even when nothing ever ticked, which is the shape `test-game-save-roundtrip`'s first case
        // asks of the world and the same courtesy this owes it.
        incoming:
          pendingIncoming ??
          venues
            .filter((v) => v.incoming !== 0)
            .map((v) => [v.id, v.incoming] as [string, number])
            .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)),
        maxSlot,
        lastAbsMinute,
        // The thought scanner's cursor and its budget. Same class of bug as the gate's debt below,
        // and the last two of the three the round-trip test caught: `stepThoughts` walks a slice of
        // the park per tick round-robin and spends a fractional allowance of thoughts, so a resumed
        // run that restarts the cursor at 0 visits different people in a different order and hands
        // out its thoughts on different ticks. It showed up as exactly three columns differing —
        // `thought`, `thoughtAt` and the `happiness` a thought nudges — with every position, need
        // and id identical.
        thoughtCursor,
        thoughtBudget,
        // The gate's fractional debt. Not optional either, and it is the subtler of the two.
        //
        // `admit` closes the shortfall against the attendance curve through a fraction of a party
        // per tick, so a park fills smoothly. Leave that fraction out of the save and a resumed
        // run starts the accumulation from zero: the first guest to arrive AFTER the save came in
        // at park minute 2006 in the uninterrupted run and 2006.25 in the resumed one — one tick —
        // and every timestamp downstream of it was shifted by the same quarter minute while the
        // people, their ids and their slots were identical. That is what
        // `test-game-save-roundtrip`'s fourth case caught, and it took a field-by-field diff of
        // the two serialisations to see, because 52 of 106 guests matched exactly.
        partyDebt,
        // The four streams' xoshiro states, and they are not optional.
        //
        // Without them a load restarts every stream at its fork seed while the uninterrupted run
        // has advanced them thousands of draws, so the same save resumed twice diverges from the
        // run it was taken from — which is exactly what `test-game-save-roundtrip`'s fourth case
        // asserts and what it caught here. `environment/sim.ts` had the precedent
        // (`slot.rng = ctx.rng.state()`); four streams need four.
        rng: {
          arrivals: rngArrivals.state(),
          bodies: rngBodies.state(),
          choice: rngChoice.state(),
          wander: rngWander.state(),
        },
      };
    },
    rebuild() {
      const slot = ctx.world.modules.guests as Record<string, unknown> | undefined;
      lastAbsMinute = absMinute();
      venuesDirty = true;
      if (!slot || typeof slot !== 'object' || slot.version !== 1) return;
      store.load(slot.store);
      store.setNeedColumns(needs.columns.map((c) => c.id));
      nextGroup = Number(slot.nextGroup ?? 1);
      arrivedToday = Number(slot.arrivedToday ?? 0);
      leftToday = Number(slot.leftToday ?? 0);
      spentToday = Number(slot.spentToday ?? 0);
      boughtToday = Number(slot.boughtToday ?? 0);
      refusedToday = zeroRefusals();
      const savedRefusals = slot.refusedToday as Record<string, unknown> | undefined;
      if (savedRefusals) {
        for (const key of REFUSAL_KEYS) {
          const value = Number(savedRefusals[key]);
          refusedToday[key] = Number.isFinite(value) ? value : 0;
        }
      }
      pendingIncoming = Array.isArray(slot.incoming)
        ? (slot.incoming as unknown[])
            .filter(
              (e): e is [string, number] =>
                Array.isArray(e) && typeof e[0] === 'string' && Number.isFinite(Number(e[1]))
            )
            .map(([id, n]) => [id, Number(n)] as [string, number])
        : null;
      errands.clear();
      const savedErrands = Array.isArray(slot.errands) ? slot.errands : [];
      for (const raw of savedErrands as Array<Record<string, unknown>>) {
        const at = Number(raw?.slot);
        // `venue` since rides joined the same map; `shop` is what saves written before that
        // carried, and they are all shop errands by construction.
        const venue =
          typeof raw?.venue === 'string'
            ? raw.venue
            : typeof raw?.shop === 'string'
              ? raw.shop
              : '';
        const kind = raw?.kind === 'ride' ? 'ride' : 'shop';
        // A slot with nobody in it cannot be on an errand. Written saves never contain one, since
        // a ticket is handed back at the gate; a hand-edited or truncated one might, and it would
        // sit in the map for the rest of the park's life being serialised back out.
        if (!venue || !Number.isFinite(at) || at < 0 || at >= d.capacity) continue;
        if (d.state[at] === GuestState.GONE) continue;
        errands.set(at, {
          kind,
          venue,
          ticket: Number.isFinite(Number(raw.ticket)) ? Number(raw.ticket) : 0,
          joined: Number.isFinite(Number(raw.joined)) ? Number(raw.joined) : 0,
          balkAt: Number.isFinite(Number(raw.balkAt)) ? Number(raw.balkAt) : 0,
        });
      }
      maxSlot = Math.min(d.capacity - 1, Math.max(0, Number(slot.maxSlot ?? 0)));
      lastAbsMinute = Number(slot.lastAbsMinute ?? lastAbsMinute);
      partyDebt = Number(slot.partyDebt ?? 0);
      thoughtCursor = Math.max(0, Math.floor(Number(slot.thoughtCursor ?? 0)));
      thoughtBudget = Number(slot.thoughtBudget ?? 0);
      // A save written before the streams were serialised has no `rng` block; leaving the forks at
      // their seed is what that save already meant, so an absent block is not an error.
      const rngState = slot.rng as Record<string, [number, number, number, number]> | undefined;
      if (rngState) {
        if (rngState.arrivals) rngArrivals.restore(rngState.arrivals);
        if (rngState.bodies) rngBodies.restore(rngState.bodies);
        if (rngState.choice) rngChoice.restore(rngState.choice);
        if (rngState.wander) rngWander.restore(rngState.wander);
      }
    },
    dispose() {
      // Not `endAllErrands()`: a dispose is a teardown of the whole runtime, the shops module is
      // being disposed alongside this one, and calling into a module that is halfway through its
      // own teardown is how a leak check ends up chasing a queue entry nobody owns.
      errands.clear();
      shops = undefined;
      detachContent();
      offPack();
      offAdd();
      offRemove();
      offUpdate();
      offPaths();
    },
  };
}
