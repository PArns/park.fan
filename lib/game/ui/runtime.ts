'use client';

/**
 * The interface's engine-side half: one object that owns the registries, the open-panel set and
 * the telemetry collector, and that every panel is handed.
 *
 * It lives in the `ui` module's main handle rather than in React state for two reasons. A module
 * registers its panel from its own `main()`, which runs before anything is mounted, so the
 * registry has to outlive the tree. And the collector reads the frame buffers from `onFrame` at
 * 20 Hz, which must not be a React update — it is a mutation of a plain object that gets published
 * on a 4 Hz cadence instead.
 *
 * ## Two subscription channels, on purpose
 *
 * `subscribe` fires on every telemetry publish, four times a second. `subscribeChrome` fires when
 * a panel opens, closes or registers — a handful of times a session. If those were one channel,
 * the rail, the panel frames and the menu would all re-render four times a second for a number
 * they do not draw, and the whole point of the selector hooks would be lost at the first `useMemo`
 * that captured the wrong thing.
 */

import type { GameHandle } from '../core/host';
import type { EventBus } from '../core/events';
import type { Entity, GameEvents, MainContext, Speed, World } from '../core/types';
import type { GameLocale, Translate } from '../i18n';
import type { InspectorDef, PanelDef, StatDef, UiMainApi } from './api';
import { UiRegistry } from './api';
import { PUBLISH_MS, TelemetryCollector, entityLabel, type ParkTelemetry } from './telemetry';
import type { FlatRideProfile } from '../rides/types';

interface RidesLike {
  profile(id: string): FlatRideProfile | undefined;
}

interface ToolsStateLike {
  selected: string | null;
}

interface ToolsLike {
  select(id: string | null): void;
  selected(): string | null;
  state?(): ToolsStateLike;
  subscribe?(fn: (state: ToolsStateLike) => void): () => void;
}

interface CameraLike {
  focus(
    target: string | { x: number; z: number; y?: number; radius?: number },
    opts?: { instant?: boolean }
  ): boolean;
}

interface RideFocusLike {
  focus(id: string): { position: [number, number, number]; radius: number } | null;
}

export class UiRuntime implements UiMainApi {
  readonly t: Translate;
  private ctx: MainContext;
  private events: EventBus<GameEvents>;
  private panelRegistry = new UiRegistry<PanelDef>();
  private statRegistry = new UiRegistry<StatDef>();
  private inspectors = new Map<string, InspectorDef>();
  private collector: TelemetryCollector;
  private snapshot: ParkTelemetry;
  private telemetryListeners = new Set<() => void>();
  private chromeListeners = new Set<() => void>();
  private openIds: string[] = [];
  private menu = false;
  private lastPublish = 0;
  private getHandle: () => GameHandle | null = () => null;
  private offs: (() => void)[] = [];
  private toolsOff: (() => void) | null = null;
  private selectedId: string | null = null;
  /** Panel opened by a selection, so a manual close is not undone by the next publish. */
  private inspectorAuto = false;

  constructor(ctx: MainContext, t: Translate) {
    this.ctx = ctx;
    this.events = ctx.events;
    this.t = t;
    this.collector = new TelemetryCollector({
      world: ctx.world,
      registry: ctx.registry,
      locale: ctx.locale,
      rideProfile: (id) => ctx.module<RidesLike>('rides')?.profile(id),
    });
    this.snapshot = this.collector.snapshot();
    this.wire();
  }

  // ── wiring ──────────────────────────────────────────────────────────────────────────────
  private wire(): void {
    const on = <K extends keyof GameEvents>(name: K, fn: (p: GameEvents[K]) => void) => {
      this.offs.push(this.events.on(name, fn));
    };
    on('ride:roster', (p) => {
      const payload = p as { rides?: { id: string; key: string }[] };
      this.collector.onRoster(payload.rides ?? []);
    });
    on('ride:breakdown', (p) => {
      const payload = p as { name?: Record<string, string>; ride?: string };
      const name = payload.name?.[this.ctx.locale] ?? payload.name?.en ?? payload.ride ?? '';
      this.collector.addLog('ride', this.t('log.ride.breakdown', { name }));
    });
    on('ride:fixed', (p) => {
      const payload = p as { ride?: string };
      const row = payload.ride ? this.collector.ride(payload.ride) : null;
      this.collector.addLog(
        'ride',
        this.t('log.ride.fixed', { name: row?.name ?? payload.ride ?? '' })
      );
    });
    on('shop:sale', (p) => {
      const payload = p as { shop?: string; cents?: number };
      if (payload.shop) this.collector.onSale(payload.shop, payload.cents ?? 0);
    });
    on('shop:restock', (p) => {
      const payload = p as { shop?: string; units?: number };
      const row = payload.shop ? this.collector.shop(payload.shop) : null;
      this.collector.addLog(
        'shop',
        this.t('log.shop.restock', {
          name: row?.name ?? payload.shop ?? '',
          units: payload.units ?? 0,
        })
      );
    });
    on('guest:thought', (p) => {
      const payload = p as { id?: number; thought?: Record<string, string>; mood?: number };
      const text = payload.thought?.[this.ctx.locale] ?? payload.thought?.en ?? '';
      if (text) this.collector.onThought(payload.id ?? 0, text, payload.mood ?? 0);
    });
    on('clock:day', () => this.collector.onDayRollover());
    on('entity:add', () => this.collector.onEntitiesChanged());
    on('entity:remove', () => this.collector.onEntitiesChanged());
    on('entity:update', () => this.collector.onEntitiesChanged());
  }

  attachHost(getHandle: () => GameHandle | null): void {
    this.getHandle = getHandle;
  }

  dispose(): void {
    for (const off of this.offs) off();
    this.offs = [];
    this.toolsOff?.();
    this.toolsOff = null;
    this.telemetryListeners.clear();
    this.chromeListeners.clear();
  }

  // ── the frame ───────────────────────────────────────────────────────────────────────────
  onFrame(frame: Parameters<TelemetryCollector['onFrame']>[0]): void {
    this.collector.onFrame(frame);
  }

  onEnvironment(env: Parameters<TelemetryCollector['onEnvironment']>[0]): void {
    this.collector.onEnvironment(env);
  }

  /**
   * Called once per rendered frame. Publishes at most every {@link PUBLISH_MS}.
   *
   * The cadence is read off the wall clock rather than accumulated from `dt`, because the host
   * caps `dt` at 0.1 s: on the software renderer in the screenshot harness (0.3–2 fps) an
   * accumulator would need a dozen frames — half a minute — to reach a quarter of a second, and
   * every screenshot would show a HUD from thirty seconds ago.
   */
  pump(nowMs: number): void {
    this.attachTools();
    if (nowMs - this.lastPublish < PUBLISH_MS) return;
    this.lastPublish = nowMs;
    this.publish();
  }

  publish(): void {
    this.snapshot = this.collector.snapshot();
    for (const fn of this.telemetryListeners) fn();
  }

  private chromeChanged(): void {
    for (const fn of this.chromeListeners) fn();
  }

  /**
   * Subscribe to the build tools' state, once they exist.
   *
   * `tools` declares `ui` in its `deps`, so it is created AFTER this module and `ctx.module`
   * answers `undefined` for the whole of `main()`. Attaching lazily from the render pump is the
   * cheap fix; the alternative — `ui` depending on `tools` — is a cycle.
   *
   * The selection is read from the tool state rather than from the `tool:selected` event, because
   * two of the three places `tools` clears a selection (cancelling a tool, disposing) do not emit
   * it: they call `notify()`, which is the subscription this uses.
   */
  private attachTools(): void {
    if (this.toolsOff) return;
    const tools = this.ctx.module<ToolsLike>('tools');
    if (!tools?.subscribe || !tools.state) return;
    this.toolsOff = tools.subscribe((state) => this.onToolsState(state.selected));
    this.onToolsState(tools.state().selected);
  }

  private onToolsState(selected: string | null): void {
    if (selected === this.selectedId) return;
    this.selectedId = selected;
    // Selecting something in the park opens the inspector; clearing the selection puts it away
    // again, but only if it was this that opened it.
    if (selected && !this.isOpen('inspector')) {
      this.open('inspector');
      this.inspectorAuto = true;
    } else if (!selected && this.inspectorAuto) {
      this.close('inspector');
      this.inspectorAuto = false;
    }
    this.chromeChanged();
  }

  // ── UiMainApi ───────────────────────────────────────────────────────────────────────────
  registerPanel(def: PanelDef): () => void {
    const off = this.panelRegistry.register(def);
    this.chromeChanged();
    return () => {
      off();
      this.openIds = this.openIds.filter((id) => id !== def.id);
      this.chromeChanged();
    };
  }

  registerStat(def: StatDef): () => void {
    const off = this.statRegistry.register(def);
    this.chromeChanged();
    return () => {
      off();
      this.chromeChanged();
    };
  }

  registerInspector(def: InspectorDef): () => void {
    this.inspectors.set(def.kind, def);
    this.chromeChanged();
    return () => {
      if (this.inspectors.get(def.kind) === def) this.inspectors.delete(def.kind);
      this.chromeChanged();
    };
  }

  panels(): readonly PanelDef[] {
    return this.panelRegistry.list();
  }

  stats(): readonly StatDef[] {
    return this.statRegistry.list();
  }

  inspectorFor(kind: string): InspectorDef | null {
    return this.inspectors.get(kind) ?? null;
  }

  /** Bumps whenever the registries change; the HUD memoises its sorted lists against it. */
  chromeRev(): number {
    return this.panelRegistry.rev() + this.statRegistry.rev() + this.inspectors.size;
  }

  open(id: string): void {
    if (!this.panelRegistry.get(id)) return;
    if (this.openIds.includes(id)) return;
    if (id === 'inspector') this.inspectorAuto = false;
    this.openIds = [...this.openIds, id];
    this.chromeChanged();
  }

  close(id: string): void {
    if (id === 'inspector') this.inspectorAuto = false;
    if (!this.openIds.includes(id)) return;
    this.openIds = this.openIds.filter((x) => x !== id);
    this.chromeChanged();
  }

  toggle(id: string): void {
    if (this.openIds.includes(id)) this.close(id);
    else this.open(id);
  }

  isOpen(id: string): boolean {
    return this.openIds.includes(id);
  }

  openPanels(): readonly string[] {
    return this.openIds;
  }

  menuOpen(): boolean {
    return this.menu;
  }

  setMenu(open: boolean): void {
    if (this.menu === open) return;
    this.menu = open;
    this.chromeChanged();
  }

  telemetry(): ParkTelemetry {
    return this.snapshot;
  }

  subscribe(fn: () => void): () => void {
    this.telemetryListeners.add(fn);
    return () => this.telemetryListeners.delete(fn);
  }

  subscribeChrome(fn: () => void): () => void {
    this.chromeListeners.add(fn);
    return () => this.chromeListeners.delete(fn);
  }

  handle(): GameHandle | null {
    return this.getHandle();
  }

  dispatch(type: string, payload: unknown): void {
    this.ctx.dispatch(type, payload);
  }

  setSpeed(speed: Speed): void {
    this.getHandle()?.setSpeed(speed);
  }

  notify(level: 'info' | 'warning' | 'error', text: string, key?: string): void {
    this.getHandle()?.store.notify(level, text, key);
  }

  select(entityId: string | null): void {
    this.ctx.module<ToolsLike>('tools')?.select(entityId);
  }

  selected(): string | null {
    return this.selectedId;
  }

  world(): Readonly<World> {
    return this.ctx.world;
  }

  /** A placed thing's name, from whichever manifest category declared it. */
  entityName(entity: Entity): string {
    return entityLabel(entity, this.ctx.registry, this.ctx.locale);
  }

  /**
   * Frame an entity.
   *
   * A ride is asked for its own framing first: `RidesMainApi.focus()` knows how tall the machine
   * is and how far back to stand, which the generic `entity:` anchor cannot — it would put the
   * camera the same distance from a carousel and a ferris wheel.
   */
  focus(entityId: string): boolean {
    const camera = this.ctx.module<CameraLike>('camera');
    if (!camera) return false;
    const rideFocus = this.ctx.module<RideFocusLike>('rides')?.focus(entityId);
    if (rideFocus) {
      return camera.focus({
        x: rideFocus.position[0],
        y: rideFocus.position[1],
        z: rideFocus.position[2],
        radius: rideFocus.radius,
      });
    }
    return camera.focus(`entity:${entityId}`);
  }

  locale(): GameLocale {
    return this.ctx.locale as GameLocale;
  }

  // ── things only the HUD calls ───────────────────────────────────────────────────────────
  /** Core's store owns the live notice stack; the runtime keeps the history behind it. */
  ingestNotices(notices: readonly { id: number; level: string; text: string }[]): void {
    this.collector.ingestNotices(
      notices.map((n) => ({
        id: n.id,
        level: (n.level === 'warning' || n.level === 'error' ? n.level : 'info') as
          'info' | 'warning' | 'error',
        text: n.text,
      }))
    );
  }

  /** Optimistic mirrors: the sim owns these flags and does not publish them back. */
  setRideShut(id: string, shut: boolean): void {
    this.collector.setShut(id, shut);
    this.dispatch('rides:close', { id, closed: shut });
    this.publish();
  }

  setShopPrice(id: string, price: number): void {
    this.collector.setShopPrice(id, price);
    this.dispatch('shops:price', { id, price });
    this.publish();
  }

  setShopClosed(id: string, closed: boolean): void {
    this.collector.setShopClosed(id, closed);
    this.dispatch('shops:close', { id, closed });
    this.publish();
  }

  resetAfterLoad(): void {
    this.collector.reset();
    this.publish();
  }
}
