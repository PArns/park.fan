/**
 * The interface's public contract: what another module registers into, and what it gets handed
 * back.
 *
 * Nothing here imports React at runtime (`ComponentType` is a type-only import, erased at build)
 * and nothing here touches Babylon or the DOM, so this file is safe on every thread. That matters
 * because `lib/game/modules.ts` is loaded on the worker and reaches `ui/module.ts`; the React half
 * of this module sits behind the dynamic import in there.
 *
 * ## Why a registry rather than a list of panels
 *
 * The HUD is the one module every other module needs a hole in. A ride inspector belongs to
 * `rides`, a heatmap legend to `overlays`, a wage table to `management` — and if each of those is
 * a file in `lib/game/ui/`, then `ui` grows a switch over module ids and every new module is an
 * edit here. So `ui` owns the *chrome* and owns *no* content: a panel, an inspector for an entity
 * kind, and a figure in the top bar are all things a module hands over from its own `main()`:
 *
 * ```ts
 * const ui = ctx.module<UiMainApi>('ui');
 * const off = ui?.registerPanel({ id: 'overlays', title: 'Heatmaps', icon: Layers, Body: Legend });
 * // …and `off()` in dispose()
 * ```
 *
 * Three things are deliberate about that call.
 *
 * **It returns its own unregister.** A module that fails to unregister on dispose leaves a panel
 * pointing at a disposed handle, and the second boot of a strict-mode double mount would show two
 * of them. Handing back the exact undo removes the chance to get the key wrong.
 *
 * **`Body` is a component, not a render function.** A `render(ctx)` called from inside the host's
 * own render makes every hook in a foreign panel a hook of the host, so a panel that opens
 * conditionally reorders somebody else's hooks. As a component it is mounted with its own
 * identity, keyed by panel id, and a panel may use as many hooks as it likes.
 *
 * **The title is a string, not a key.** `ui` owns the string table, so a module that wants a
 * translated title asks for the key in `docs/game/requests/ui.md` and passes `t(key)`; a module
 * that has not asked yet passes English and is still readable. A registry that only accepted keys
 * would make every new panel wait for a table edit.
 */

import type { ComponentType } from 'react';
import type { GameHandle } from '../core/host';
import type { GameStore } from '../core/store';
import type { Entity, Speed } from '../core/types';
import type { GameLocale, GameStringKey, Translate } from '../i18n';
import type { ParkTelemetry } from './telemetry';

/** Lucide icons are components of this shape; so is anything else a module wants to draw. */
export type UiIcon = ComponentType<{ className?: string }>;

/** Where a panel is offered in the rail. Groups are drawn in this order, separated by a rule. */
export type PanelGroup = 'park' | 'build' | 'system';

export interface PanelBodyProps {
  t: Translate;
  locale: GameLocale;
  ui: UiMainApi;
  /**
   * Core's store: boot phase, engine, quality preset, capabilities, the live metrics and the
   * notice stack. Handed over rather than reached through `ui.handle()?.store`, because that is
   * null until the host resolves and a panel cannot put its hooks behind a null check.
   */
  store: GameStore;
  /** Close this panel. */
  close(): void;
}

export interface PanelDef {
  /** Unique. A second registration under the same id replaces the first, so HMR does not double. */
  id: string;
  /** Already localized. */
  title: string;
  icon?: UiIcon;
  group?: PanelGroup;
  /** Lower sorts first inside the group. Ties fall back to registration order. */
  order?: number;
  /** Offer it as a rail button. False for a panel only opened from somewhere else. */
  rail?: boolean;
  /** Column width in px when docked. Clamped to the viewport. */
  width?: number;
  Body: ComponentType<PanelBodyProps>;
  /**
   * A number or short string drawn on the rail button — a queue length, a count of things wanting
   * attention. Called on every telemetry publish, so it must be cheap and must not allocate.
   */
  badge?: (telemetry: ParkTelemetry) => string | number | null;
}

/**
 * An inspector for one entity kind.
 *
 * The selection lives in `tools` and is a bare entity id; what to draw for it is the business of
 * whichever module owns the kind. `ui` looks the kind up here and draws the chrome around it.
 */
export interface InspectorDef {
  kind: string;
  icon?: UiIcon;
  /** Falls back to the entity's item id when a module gives none. */
  title?: (entity: Entity, locale: GameLocale) => string;
  Body: ComponentType<InspectorBodyProps>;
}

export interface InspectorBodyProps extends PanelBodyProps {
  entity: Entity;
}

/**
 * A figure in the top bar.
 *
 * `management` will want a park rating there, `staff` a headcount. Both are one of these and no
 * edit to the bar. `value` runs on every telemetry publish; return `null` to take the slot back
 * (a figure that is not measurable yet is better absent than zero).
 */
export interface StatDef {
  id: string;
  label: string;
  icon?: UiIcon;
  order?: number;
  /**
   * `lg` is the bar's headline figure — the money. There is room for one or two of those and no
   * more; a bar of six headlines has no headline.
   */
  size?: 'lg' | 'sm';
  /** Hidden below `sm`, where the bar has room for about three figures. */
  phone?: boolean;
  value: (telemetry: ParkTelemetry) => StatValue | null;
}

export interface StatValue {
  /** Rendered as-is, tabular. */
  text: string;
  tone?: 'neutral' | 'good' | 'warn' | 'bad';
  /** Tooltip. */
  hint?: string;
}

/** What panels, inspectors and the HUD itself are handed. */
export interface UiMainApi {
  // ── registration ────────────────────────────────────────────────────────────────────────
  registerPanel(def: PanelDef): () => void;
  registerInspector(def: InspectorDef): () => void;
  registerStat(def: StatDef): () => void;
  panels(): readonly PanelDef[];
  stats(): readonly StatDef[];
  inspectorFor(kind: string): InspectorDef | null;

  // ── panel state ─────────────────────────────────────────────────────────────────────────
  open(id: string): void;
  close(id: string): void;
  toggle(id: string): void;
  isOpen(id: string): boolean;
  openPanels(): readonly string[];
  /** The pause / main menu. */
  menuOpen(): boolean;
  setMenu(open: boolean): void;

  // ── the park, as the interface sees it ──────────────────────────────────────────────────
  telemetry(): ParkTelemetry;
  /** Fires on every telemetry publish (4 Hz), never per frame. */
  subscribe(fn: () => void): () => void;
  /** Fires when a panel opens or closes, a panel is registered, or the menu toggles. */
  subscribeChrome(fn: () => void): () => void;

  // ── acting on the world ─────────────────────────────────────────────────────────────────
  handle(): GameHandle | null;
  dispatch(type: string, payload: unknown): void;
  setSpeed(speed: Speed): void;
  notify(level: 'info' | 'warning' | 'error', text: string, key?: string): void;
  /** Select an entity through `tools`, so the build bar and the HUD agree on what is selected. */
  select(entityId: string | null): void;
  selected(): string | null;
  /** Point the camera at an entity. No-op when the camera module did not start. */
  focus(entityId: string): boolean;
  locale(): GameLocale;
  t: Translate;
}

/** Panels the module ships itself. Ids are stable: a save or a hotkey may name one. */
export const BUILTIN_PANELS = {
  park: 'park',
  rides: 'rides',
  shops: 'shops',
  guests: 'guests',
  weather: 'weather',
  settings: 'settings',
  saves: 'saves',
  help: 'help',
  inspector: 'inspector',
} as const;

/**
 * A registry with a stable order.
 *
 * Insertion order decides ties rather than the map's iteration order, because a panel that jumps
 * position when an unrelated module registers is a panel nobody can build muscle memory for.
 */
export class UiRegistry<T extends { id: string; order?: number }> {
  private items = new Map<string, T>();
  private seq = new Map<string, number>();
  private next = 0;
  private version = 0;

  register(item: T): () => void {
    if (!this.seq.has(item.id)) this.seq.set(item.id, this.next++);
    this.items.set(item.id, item);
    this.version += 1;
    return () => {
      if (this.items.get(item.id) === item) {
        this.items.delete(item.id);
        this.version += 1;
      }
    };
  }

  get(id: string): T | null {
    return this.items.get(id) ?? null;
  }

  /** Sorted by `order`, then by when it was first registered. */
  list(): T[] {
    return [...this.items.values()].sort(
      (a, b) =>
        (a.order ?? 100) - (b.order ?? 100) || (this.seq.get(a.id) ?? 0) - (this.seq.get(b.id) ?? 0)
    );
  }

  /** Bumps on every register and unregister; the HUD memoises the sorted list against it. */
  rev(): number {
    return this.version;
  }
}

/** Keys the built-in panels use, so a request for a new one can name the convention. */
export type PanelTitleKey = Extract<GameStringKey, `panel.${string}`>;
