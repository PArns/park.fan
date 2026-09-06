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
 */

import type { Command, Entity, EnvironmentState, SimContext, SimHandle } from '../core/types';
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
import { decide, type Venue } from './decide';
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

  // ── World index ───────────────────────────────────────────────────────────────────────────
  let venues: Venue[] = [];
  let venuesDirty = true;
  let graphVersion = -1;
  let rideCount = 0;
  let shopCount = 0;
  let sceneryPoints: Float32Array = new Float32Array(0);
  const venueById = new Map<string, Venue>();

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
   */
  function rebuildVenues(): void {
    venuesDirty = false;
    graphVersion = paths?.version() ?? 0;
    venues = [];
    venueById.clear();
    rideCount = 0;
    shopCount = 0;
    const sights: number[] = [];

    for (const id of Object.keys(ctx.world.entities).sort()) {
      const entity = ctx.world.entities[id];
      const [x, , z] = entity.position;
      if (entity.kind === 'shop') {
        const def = registry.find('shops', entity.pack, entity.item)?.def;
        if (!def) continue;
        shopCount++;
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
  function spawnParty(at: { x: number; y: number; z: number } | null, aged: number): number {
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
        initGuest(slot, index, group, at, aged, now, members.length - 1);
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

    const base = slot * d.needCount;
    for (let c = 0; c < needs.count; c++) {
      const need = needs.columns[c];
      const weight = needWeights[index * needs.count + c];
      // A guest arrives with a little of everything already on the clock; nobody walks through a
      // gate having just eaten, slept and been to the toilet.
      const start = rngBodies.range(6, 42);
      const grown = (need.decayPerHour * weight * aged) / 60;
      d.needs[base + c] = Math.max(0, Math.min(255, Math.round(start + grown)));
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
    store.clear();
    maxSlot = 0;
    nextGroup = 1;
    arrivedToday = 0;
    leftToday = 0;
    spentToday = 0;
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
      spawnParty(at, inside);
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

  function chooseDestination(slot: number): void {
    const index = d.archetype[slot];
    const archetype = archetypes[index];
    if (!archetype) return;
    const result = decide({
      venues,
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
    venue.incoming += 1;
    d.decideIn[slot] = 4 + rngChoice.next() * 8;
  }

  function kindCode(kind: Venue['kind']): number {
    switch (kind) {
      case 'shop':
        return 2;
      case 'ride':
        return 3;
      case 'seat':
        return 4;
      case 'sight':
        return 5;
      case 'gate':
        return 6;
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

  function followLeader(slot: number): void {
    if (!hasLeader(slot)) {
      d.leader[slot] = slot;
      return;
    }
    const leader = d.leader[slot];
    if (d.state[leader] === GuestState.LEAVING) {
      leaveNow(slot);
      return;
    }
    if (d.destKind[leader] === 0) return;
    // A party walks abreast rather than in single file: the member's own lane offset is what
    // spreads them across the path, and it is already in `stepMove`.
    d.destX[slot] = d.destX[leader];
    d.destZ[slot] = d.destZ[leader];
    d.destKind[slot] = d.destKind[leader];
    if (d.state[slot] !== GuestState.SITTING && d.state[slot] !== GuestState.BUYING) {
      d.state[slot] = GuestState.WALKING;
    }
    d.wpNode[slot] = -1;
    d.decideIn[slot] = d.decideIn[leader];
  }

  function leaveNow(slot: number): void {
    const gate = paths?.entrance() ?? { x: 0, z: parkSize * 0.33 };
    setDestination(slot, gate.x, gate.z, 6);
    d.state[slot] = GuestState.LEAVING;
  }

  // ── Arrival at a destination ──────────────────────────────────────────────────────────────
  function arriveAt(slot: number, now: number): void {
    const kind = d.destKind[slot];
    const venue = venueById.get(nearestVenueId(slot));
    if (venue && venue.incoming > 0) venue.incoming -= 1;
    switch (kind) {
      case 6: {
        // The gate. This is the only exit; a guest is never deleted mid-park.
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
      case 2: {
        d.state[slot] = GuestState.BUYING;
        d.busyUntil[slot] = now + 0.6 + rngChoice.next() * 1.6;
        break;
      }
      case 3: {
        // A ride exists as a venue but nothing boards yet: the `rides` and `trains` modules own
        // that. Until they do, a guest reaching a ride waits at it and then moves on, which is
        // what somebody does at a ride that is not running.
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

  /** Pay for what the venue sells and take the relief. */
  function serve(slot: number): void {
    const venue = venueById.get(nearestVenueId(slot));
    if (!venue) return;
    if (venue.price > 0) {
      if (d.cash[slot] < venue.price) return;
      d.cash[slot] -= venue.price;
      d.spent[slot] += venue.price;
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
      if (spawnParty(null, 0) === 0) break;
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
      const level = d.needs[base + c] + rise;
      d.needs[base + c] = level > 255 ? 255 : level < 0 ? 0 : Math.round(level);
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

    // 1. Timed states: sitting on a bench, being served, standing in a line.
    const busy = d.state[slot];
    if (busy === GuestState.SITTING || busy === GuestState.BUYING || busy === GuestState.QUEUING) {
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
      if (busy === GuestState.BUYING) serve(slot);
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
      signals[SIG.queueMinutes] =
        d.state[slot] === GuestState.QUEUING ? Math.max(0, d.busyUntil[slot] - now) : 0;
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

    for (let slot = 0; slot <= maxSlot; slot++) {
      const state = d.state[slot];
      if (state === GuestState.GONE) continue;
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
      while (made < n && guard++ < n * 3 && d.count < MAX_GUESTS) made += spawnParty(null, 0);
      return made;
    },
    inspect(slot): GuestRecord | null {
      if (slot < 0 || slot >= d.capacity || d.state[slot] === GuestState.GONE) return null;
      const base = slot * d.needCount;
      const levels: Record<string, number> = {};
      for (let c = 0; c < needs.count; c++) levels[needs.columns[c].id] = d.needs[base + c];
      const thoughtIndex = d.thought[slot];
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
      };
    },
  };

  ctx.events.on('clock:day', () => {
    arrivedToday = 0;
    leftToday = 0;
    spentToday = 0;
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
      detachContent();
      offPack();
      offAdd();
      offRemove();
      offUpdate();
      offPaths();
    },
  };
}
