/**
 * The park as the interface sees it: one immutable snapshot, republished four times a second.
 *
 * ## Why this file exists at all
 *
 * The HUD sits on the main thread and the park lives in the worker. What crosses between them is
 * a `SimFrame` (a handful of scalars plus a few transferable buffers) and a stream of forwarded
 * events — and that is *all* it is. Every per-entity API the sim modules publish (`RidesSimApi.
 * list()`, `ShopsSimApi.list()`, `GuestsSimApi.inspect()`) runs in the worker with no channel to
 * ask it a question from here; `docs/game/requests/ui.md` asks for one. So this file assembles
 * what the main thread genuinely has, and never invents the rest:
 *
 * - **frame scalars** — `rides.open`, `shops.takingsToday`, `guests.happiness`, `finance.cash`…
 * - **frame buffers** — `rides.state` (one byte per ride) and `rides.motion` (spin, drive, riders
 *   on board, queue length), both in the roster order the `ride:roster` event publishes, and
 *   `guests.anim` (one byte per guest slot), which is where the crowd breakdown comes from.
 * - **forwarded events** — `ride:roster`, `ride:breakdown`, `ride:fixed`, `shop:sale`,
 *   `shop:restock`, `guest:thought`, `notify`.
 * - **the main thread's own read model** — `world.entities`, the content registry, and the
 *   main-side module APIs (`rides.profile()` for the nameplate figures of a machine).
 *
 * Two consequences are worth stating plainly rather than hiding behind a number.
 *
 * **A wait time is not in here.** The sim computes one per ride (`RideView.waitMinutes`) and does
 * not publish it, and dividing a queue by a rated throughput would be a different quantity wearing
 * its name. The queue length is published, so the queue length is what the panels show.
 *
 * **Takings per shop are counted here from `shop:sale`, not read from the shop.** The aggregate
 * (`shops.takingsToday`) is authoritative and comes from the frame; the per-shop split is this
 * module adding up the sales it has seen since the page opened. On a park that has been running
 * since tick 0 those agree, and after a `load()` they do not — which is why the counters reset on
 * a load and on the day rollover, and why the panel labels the column for what it is.
 */

import type { Entity, EnvironmentState, SimFrame, Speed, World } from '../core/types';
import type { Registry } from '../core/registry';
import { MOTION_STRIDE, RIDE_STATE_NAMES } from '../rides/types';
import type { FlatRideProfile } from '../rides/types';
import { GUEST_STATE_NAMES } from '../guests/types';

/** How often the snapshot is rebuilt, in real milliseconds. */
export const PUBLISH_MS = 250;
/** Guest thoughts kept for the crowd panel. */
export const THOUGHT_HISTORY = 24;
/** Entries kept for the notification history. */
export const LOG_HISTORY = 80;

export interface RideRow {
  id: string;
  /** `pack:item`. */
  key: string;
  name: string;
  /** One of `RIDE_STATE_NAMES`: closed, loading, dispatching, running, unloading, broken, maintenance. */
  state: string;
  riders: number;
  capacity: number;
  queue: number;
  /** `capacity / cycleMinutes * 60` — what the machine could do with an endless queue. */
  ratedThroughput: number;
  excitement: number;
  fear: number;
  nausea: number;
  minHeightCm: number | null;
  /** Cents a rider pays; 0 for a ride included in the entry price. */
  price: number;
  /** Cents an hour the machine costs to keep. */
  upkeep: number;
  /** True while the player has shut it from the HUD. Optimistic: the sim owns the real flag. */
  shut: boolean;
}

export interface ShopRow {
  id: string;
  key: string;
  name: string;
  /** `food`, `drink`, `toilet`, … straight from the manifest. */
  kind: string;
  /** The guest need it answers, or `none`. */
  need: string;
  /** Cents. The live price from the entity's own data bag, or the manifest's. */
  price: number;
  closed: boolean;
  /** Sales this module has seen today. See the file docblock. */
  soldToday: number;
  takingsToday: number;
}

export interface ThoughtRow {
  seq: number;
  guest: number;
  text: string;
  mood: number;
  minute: number;
  day: number;
}

export type LogKind = 'info' | 'warning' | 'error' | 'ride' | 'shop';

export interface LogRow {
  seq: number;
  kind: LogKind;
  text: string;
  minute: number;
  day: number;
}

export interface ParkTotals {
  guests: number;
  /** Mean guest happiness 0..100, or -1 when nobody is in the park. */
  happiness: number;
  rides: number;
  ridesOpen: number;
  ridesDown: number;
  queued: number;
  riding: number;
  ridersToday: number;
  /** Riders an hour, measured over the last park hour across every ride. */
  throughputHour: number;
  shops: number;
  shopsOpen: number;
  shopQueue: number;
  takingsToday: number;
  pathNodes: number;
  /** More than one means part of the path network cannot be walked to from the gate. */
  pathIslands: number;
  trains: number;
  trainCars: number;
  cash: number;
}

export interface ParkTelemetry {
  /** Bumps on every publish. Cheap way for a memo to notice. */
  rev: number;
  day: number;
  minute: number;
  speed: Speed;
  season: string;
  weather: string;
  temperatureC: number;
  /** 0..1, 1 at midnight. */
  night: number;
  windMs: number;
  cloud: number;
  wetness: number;
  precipitation: string;
  totals: ParkTotals;
  rides: readonly RideRow[];
  shops: readonly ShopRow[];
  /** Guests per behaviour: walking, queuing, riding, buying, … Only the non-zero ones. */
  crowd: readonly { state: string; count: number }[];
  thoughts: readonly ThoughtRow[];
  log: readonly LogRow[];
  /** True while the sim has answered at least one frame. */
  live: boolean;
}

export const EMPTY_TELEMETRY: ParkTelemetry = {
  rev: 0,
  day: 1,
  minute: 540,
  speed: 1,
  season: 'summer',
  weather: 'clear',
  temperatureC: 0,
  night: 0,
  windMs: 0,
  cloud: 0,
  wetness: 0,
  precipitation: 'none',
  totals: {
    guests: 0,
    happiness: -1,
    rides: 0,
    ridesOpen: 0,
    ridesDown: 0,
    queued: 0,
    riding: 0,
    ridersToday: 0,
    throughputHour: 0,
    shops: 0,
    shopsOpen: 0,
    shopQueue: 0,
    takingsToday: 0,
    pathNodes: 0,
    pathIslands: 0,
    trains: 0,
    trainCars: 0,
    cash: 0,
  },
  rides: [],
  shops: [],
  crowd: [],
  thoughts: [],
  log: [],
  live: false,
};

/** What the collector needs from the rest of the game. Narrow on purpose, so it is testable. */
export interface TelemetrySources {
  world: Readonly<World>;
  registry: Registry;
  locale: string;
  /** `RidesMainApi.profile`, or a stub when the rides module did not start. */
  rideProfile(id: string): FlatRideProfile | undefined;
}

interface RosterEntry {
  id: string;
  key: string;
}

interface ShopTally {
  sold: number;
  cents: number;
}

/**
 * Accumulates events and frames, and hands out an immutable snapshot on demand.
 *
 * Pure in the sense that matters here: no Babylon, no DOM, no timers of its own. The module's main
 * handle drives it from `onFrame`, which is also the only place the clock for the publish cadence
 * is read — this class never asks what time it is.
 */
export class TelemetryCollector {
  private sources: TelemetrySources;
  private roster: RosterEntry[] = [];
  private rideState: Uint8Array | null = null;
  private rideMotion: Float32Array | null = null;
  private guestAnim: Uint8Array | null = null;
  private stats: Record<string, number> = {};
  private env: EnvironmentState | null = null;
  private shopTally = new Map<string, ShopTally>();
  private thoughts: ThoughtRow[] = [];
  private log: LogRow[] = [];
  private shut = new Set<string>();
  private priceOverride = new Map<string, number>();
  private closedOverride = new Map<string, boolean>();
  private seq = 0;
  private rev = 0;
  private lastNoticeId = 0;
  private live = false;
  private cachedRides: RideRow[] = [];
  private cachedShops: ShopRow[] = [];
  private shopsDirty = true;

  constructor(sources: TelemetrySources) {
    this.sources = sources;
  }

  // ── inputs ──────────────────────────────────────────────────────────────────────────────
  onFrame(frame: SimFrame): void {
    this.live = true;
    this.stats = frame.stats;
    const state = frame.buffers['rides.state'];
    const motion = frame.buffers['rides.motion'];
    const anim = frame.buffers['guests.anim'];
    this.rideState = state ? new Uint8Array(state) : null;
    this.rideMotion = motion ? new Float32Array(motion) : null;
    this.guestAnim = anim ? new Uint8Array(anim) : null;
  }

  onEnvironment(env: EnvironmentState): void {
    this.env = env;
  }

  onRoster(entries: readonly RosterEntry[]): void {
    this.roster = entries.map((e) => ({ id: e.id, key: e.key }));
  }

  onEntitiesChanged(): void {
    this.shopsDirty = true;
  }

  onSale(shop: string, cents: number): void {
    const tally = this.shopTally.get(shop) ?? { sold: 0, cents: 0 };
    tally.sold += 1;
    tally.cents += cents;
    this.shopTally.set(shop, tally);
    this.shopsDirty = true;
  }

  onDayRollover(): void {
    this.shopTally.clear();
    this.shopsDirty = true;
  }

  /** Called on `load()`: everything counted on this side is about a park that is now gone. */
  reset(): void {
    this.shopTally.clear();
    this.thoughts = [];
    this.log = [];
    this.shut.clear();
    this.priceOverride.clear();
    this.closedOverride.clear();
    this.roster = [];
    this.shopsDirty = true;
  }

  onThought(guest: number, text: string, mood: number): void {
    this.thoughts.unshift({
      seq: ++this.seq,
      guest,
      text,
      mood,
      minute: this.sources.world.clock.minute,
      day: this.sources.world.clock.day,
    });
    if (this.thoughts.length > THOUGHT_HISTORY) this.thoughts.length = THOUGHT_HISTORY;
  }

  addLog(kind: LogKind, text: string): void {
    const { minute, day } = this.sources.world.clock;
    const last = this.log[0];
    // A ride that breaks twice in one minute is two lines; the same line twice in one minute is
    // one. Without this the queue-full notice from a shop repeats until somebody looks at it.
    if (last && last.text === text && last.minute === Math.floor(minute)) return;
    this.log.unshift({
      seq: ++this.seq,
      kind,
      text,
      minute,
      day,
    });
    if (this.log.length > LOG_HISTORY) this.log.length = LOG_HISTORY;
  }

  /** Core's store owns the live notice stack; this keeps the history behind it. */
  ingestNotices(notices: readonly { id: number; level: LogKind; text: string }[]): void {
    for (const n of notices) {
      if (n.id <= this.lastNoticeId) continue;
      this.lastNoticeId = n.id;
      this.addLog(n.level, n.text);
    }
  }

  setShut(id: string, shut: boolean): void {
    if (shut) this.shut.add(id);
    else this.shut.delete(id);
  }

  isShut(id: string): boolean {
    return this.shut.has(id);
  }

  setShopPrice(id: string, price: number): void {
    this.priceOverride.set(id, price);
    this.shopsDirty = true;
  }

  setShopClosed(id: string, closed: boolean): void {
    this.closedOverride.set(id, closed);
    this.shopsDirty = true;
  }

  // ── output ──────────────────────────────────────────────────────────────────────────────
  snapshot(): ParkTelemetry {
    this.rev += 1;
    const s = this.stats;
    const num = (k: string, fallback = 0) => (typeof s[k] === 'number' ? s[k] : fallback);
    /**
     * The clock is read from the world, not from the last frame.
     *
     * `host.ts` copies every frame's clock onto `world.clock` inside the render loop, so the two
     * agree while the simulation is answering — and when it is NOT, the world is still the one
     * that `setTimeOfDay()` and `setSpeed()` wrote to. Reading the frame meant that a park whose
     * worker had not reported yet showed 09:00 at speed 1 while the harness had set 13:00 and
     * paused it, which is a HUD contradicting the scene behind it.
     */
    const clock = this.sources.world.clock;
    const rides = this.buildRides();
    if (this.shopsDirty) {
      this.cachedShops = this.buildShops();
      this.shopsDirty = false;
    } else {
      this.cachedShops = this.refreshShopTallies(this.cachedShops);
    }
    const env = this.env;
    let ridesDown = 0;
    let queued = 0;
    let riding = 0;
    let open = 0;
    for (const r of rides) {
      if (r.state === 'broken' || r.state === 'maintenance') ridesDown += 1;
      else if (r.state !== 'closed') open += 1;
      queued += r.queue;
      riding += r.riders;
    }
    return {
      rev: this.rev,
      day: clock.day,
      minute: clock.minute,
      speed: clock.speed,
      season: env?.season ?? 'summer',
      weather: env?.weather ?? 'clear',
      temperatureC: env?.temperatureC ?? 0,
      night: env?.night ?? 0,
      windMs: env?.windMs ?? 0,
      cloud: env?.cloud ?? 0,
      wetness: env?.wetness ?? 0,
      precipitation: env?.precipitation ?? 'none',
      totals: {
        guests: num('guests.count'),
        happiness: num('guests.count') > 0 ? num('guests.happiness') : -1,
        rides: rides.length || num('rides.count'),
        // `rides.open` from the frame counts what the sim calls open; the buffer's own state
        // bytes are counted here so the number and the list a reader is looking at agree.
        ridesOpen: rides.length ? open : num('rides.open'),
        ridesDown,
        queued: rides.length ? queued : num('rides.queued'),
        riding: rides.length ? riding : num('rides.riding'),
        ridersToday: num('rides.ridersToday'),
        throughputHour: num('rides.throughputHour'),
        shops: this.cachedShops.length || num('shops.count'),
        shopsOpen: num('shops.open'),
        shopQueue: num('shops.queue'),
        takingsToday: num('shops.takingsToday'),
        pathNodes: num('paths.nodes'),
        pathIslands: num('paths.components'),
        trains: num('trains.count'),
        trainCars: num('trains.cars'),
        cash: num('finance.cash', this.sources.world.finance.cash),
      },
      rides,
      shops: this.cachedShops,
      crowd: this.buildCrowd(),
      thoughts: this.thoughts,
      log: this.log,
      live: this.live,
    };
  }

  private buildRides(): RideRow[] {
    const { locale } = this.sources;
    const state = this.rideState;
    const motion = this.rideMotion;
    const rows: RideRow[] = [];
    for (let i = 0; i < this.roster.length; i++) {
      const entry = this.roster[i];
      const profile = this.sources.rideProfile(entry.id);
      const cycle = profile && profile.cycleMinutes > 0 ? profile.cycleMinutes : 0;
      rows.push({
        id: entry.id,
        key: entry.key,
        name: profile ? localized(profile.name, locale) : entry.id,
        state: state && i < state.length ? (RIDE_STATE_NAMES[state[i]] ?? 'closed') : 'closed',
        riders: motion ? Math.round(motion[i * MOTION_STRIDE + 2] ?? 0) : 0,
        capacity: profile?.capacity ?? 0,
        queue: motion ? Math.round(motion[i * MOTION_STRIDE + 3] ?? 0) : 0,
        ratedThroughput: profile && cycle > 0 ? Math.round((profile.capacity / cycle) * 60) : 0,
        excitement: profile?.excitement ?? 0,
        fear: profile?.fear ?? 0,
        nausea: profile?.nausea ?? 0,
        minHeightCm: profile?.minHeightCm ?? null,
        price: profile?.price ?? 0,
        upkeep: profile?.upkeep ?? 0,
        shut: this.shut.has(entry.id),
      });
    }
    this.cachedRides = rows;
    return rows;
  }

  private buildShops(): ShopRow[] {
    const { world, registry, locale } = this.sources;
    const rows: ShopRow[] = [];
    for (const id of Object.keys(world.entities).sort()) {
      const entity = world.entities[id];
      if (entity.kind !== 'shop') continue;
      const item = registry.find('shops', entity.pack, entity.item);
      const def = item?.def as
        { name?: Record<string, string>; kind?: string; need?: string; price?: number } | undefined;
      const data = (entity.data ?? {}) as { price?: number; closed?: boolean };
      const tally = this.shopTally.get(id);
      rows.push({
        id,
        key: `${entity.pack}:${entity.item}`,
        name: def?.name ? localized(def.name, locale) : entity.item,
        kind: def?.kind ?? 'shop',
        need: def?.need ?? 'none',
        price: this.priceOverride.get(id) ?? data.price ?? def?.price ?? 0,
        closed: this.closedOverride.get(id) ?? data.closed ?? false,
        soldToday: tally?.sold ?? 0,
        takingsToday: tally?.cents ?? 0,
      });
    }
    return rows;
  }

  /** The cheap path: the shop list has not changed, only what the tills have taken. */
  private refreshShopTallies(rows: ShopRow[]): ShopRow[] {
    let changed = false;
    const next = rows.map((row) => {
      const tally = this.shopTally.get(row.id);
      const sold = tally?.sold ?? 0;
      const cents = tally?.cents ?? 0;
      if (sold === row.soldToday && cents === row.takingsToday) return row;
      changed = true;
      return { ...row, soldToday: sold, takingsToday: cents };
    });
    return changed ? next : rows;
  }

  private buildCrowd(): { state: string; count: number }[] {
    const anim = this.guestAnim;
    if (!anim || anim.length === 0) return [];
    const counts = new Map<number, number>();
    for (let i = 0; i < anim.length; i++) {
      // The low nibble is the behaviour; the store never compacts, so 0 is a free slot rather
      // than somebody standing still.
      const code = anim[i] & 0x0f;
      if (code === 0) continue;
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([code, count]) => ({ state: GUEST_STATE_NAMES[code] ?? String(code), count }));
  }

  /** The last built ride list, without republishing. Used by the inspector. */
  ride(id: string): RideRow | null {
    return this.cachedRides.find((r) => r.id === id) ?? null;
  }

  shop(id: string): ShopRow | null {
    return this.cachedShops.find((r) => r.id === id) ?? null;
  }
}

/** Localized name with an `en` fallback, matching `Registry.name`. */
export function localized(names: Record<string, string>, locale: string): string {
  return names[locale] ?? names.en ?? Object.values(names)[0] ?? '';
}

/** The entity kinds the built-in inspectors cover, for a caller that wants to know. */
export function entityLabel(entity: Entity, registry: Registry, locale: string): string {
  for (const category of ['shops', 'rides', 'scenery', 'foliage', 'buildings'] as const) {
    const item = registry.find(category, entity.pack, entity.item);
    const def = item?.def as { name?: Record<string, string> } | undefined;
    if (def?.name) return localized(def.name, locale);
  }
  return entity.item;
}
