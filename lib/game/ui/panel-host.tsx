'use client';

/**
 * The panel frame and the layout that holds it: the piece every other module's inspector hangs
 * off.
 *
 * ## Docked by default, floating on demand
 *
 * A panel opens in the right-hand column, stacked under the ones already there. Dragging its
 * header lifts it out of the column to wherever it is dropped; dropping it back over the column's
 * band re-docks it. That is the whole interaction, and it is deliberately not a full window
 * manager — no resize handles, no z-order shuffling, no snap grid. What a park builder actually
 * needs is to put the ride list somewhere it does not cover the ride, and to have the next panel
 * land somewhere predictable; the rest is furniture.
 *
 * The drag begins only after four pixels of movement, so a click on the header still collapses
 * the panel rather than nudging it a pixel and swallowing the click.
 *
 * ## Below `sm` there is no column
 *
 * A 390 px screen has room for one panel and no room for a rail beside it, so the layout changes
 * shape rather than scaling: the newest open panel becomes a sheet across the bottom two thirds
 * and the others stay open but hidden behind it. Same call the site's blog card makes when it
 * drops its photo — a phone gets a different object, not a squeezed one.
 */

import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ChevronDown, PanelRightClose, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GameStore } from '../core/store';
import type { GameLocale, Translate } from '../i18n';
import type { PanelDef, UiMainApi } from './api';
import { HUD_PANEL } from './surface';
import { HudIconButton } from './parts';
import { useCommitTally } from './hooks';

/** Width of the dock column, and the band a dropped panel re-docks in. */
const DOCK_WIDTH = 344;
const DOCK_BAND = 400;
const DRAG_THRESHOLD = 4;

interface Position {
  x: number;
  y: number;
}

export interface PanelHostProps {
  ui: UiMainApi;
  store: GameStore;
  t: Translate;
  locale: GameLocale;
  panels: PanelDef[];
  narrow: boolean;
}

export function PanelHost({ ui, store, t, locale, panels, narrow }: PanelHostProps) {
  const [floating, setFloating] = useState<Record<string, Position | undefined>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const setPosition = useCallback((id: string, position: Position | undefined) => {
    setFloating((prev) => ({ ...prev, [id]: position }));
  }, []);

  if (panels.length === 0) return null;

  if (narrow) {
    const top = panels[panels.length - 1];
    return (
      <div className="pointer-events-none absolute inset-x-2 bottom-2 z-30 flex max-h-[72svh] flex-col justify-end">
        <PanelFrame
          key={top.id}
          def={top}
          ui={ui}
          store={store}
          t={t}
          locale={locale}
          collapsed={false}
          onCollapse={() => {}}
          bodyClass="max-h-[52svh]"
          className="pointer-events-auto w-full"
          showDockToggle={false}
        />
      </div>
    );
  }

  const docked = panels.filter((p) => !floating[p.id]);
  const loose = panels.filter((p) => floating[p.id]);
  /**
   * How tall a docked panel may be, and it depends on how many are open.
   *
   * One panel gets the column: the crowd breakdown and the park overview are both about 550 px of
   * real content and capping them at a third of the screen makes a reader scroll for no reason.
   * Two or more and each is capped instead, because the alternative — measured with `guests` and
   * its two dozen thoughts open — is one panel eating the whole column and pushing the other two
   * below the fold, which reads as though they had not opened at all.
   */
  const bodyClass = docked.length > 1 ? 'max-h-[22rem]' : 'max-h-[min(34rem,calc(100vh-16rem))]';

  return (
    <>
      {docked.length > 0 ? (
        <div
          className="pointer-events-none absolute top-28 right-3 bottom-24 z-30 flex w-[344px] flex-col items-end gap-2 overflow-x-hidden overflow-y-auto pb-1"
          data-panel-dock=""
        >
          {docked.map((def) => (
            <PanelFrame
              key={def.id}
              def={def}
              ui={ui}
              store={store}
              t={t}
              locale={locale}
              collapsed={!!collapsed[def.id]}
              onCollapse={() => setCollapsed((c) => ({ ...c, [def.id]: !c[def.id] }))}
              onDrag={(position) => setPosition(def.id, position)}
              className="pointer-events-auto w-full shrink-0"
              bodyClass={bodyClass}
            />
          ))}
        </div>
      ) : null}
      {loose.map((def) => {
        const position = floating[def.id]!;
        return (
          <PanelFrame
            key={def.id}
            def={def}
            ui={ui}
            store={store}
            t={t}
            locale={locale}
            collapsed={!!collapsed[def.id]}
            onCollapse={() => setCollapsed((c) => ({ ...c, [def.id]: !c[def.id] }))}
            onDrag={(next) => setPosition(def.id, next)}
            onDock={() => setPosition(def.id, undefined)}
            className="pointer-events-auto absolute z-40"
            style={{ left: position.x, top: position.y, width: def.width ?? DOCK_WIDTH }}
            bodyClass="max-h-[58vh]"
            floating
          />
        );
      })}
    </>
  );
}

interface PanelFrameProps {
  def: PanelDef;
  ui: UiMainApi;
  store: GameStore;
  t: Translate;
  locale: GameLocale;
  collapsed: boolean;
  onCollapse(): void;
  /** `undefined` docks it; a point floats it there. */
  onDrag?(position: Position | undefined): void;
  onDock?(): void;
  className?: string;
  style?: React.CSSProperties;
  bodyClass?: string;
  floating?: boolean;
  showDockToggle?: boolean;
}

function PanelFrame({
  def,
  ui,
  store,
  t,
  locale,
  collapsed,
  onCollapse,
  onDrag,
  onDock,
  className,
  style,
  bodyClass,
  floating,
  showDockToggle = true,
}: PanelFrameProps) {
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    id: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    moved: boolean;
  } | null>(null);
  const Icon = def.icon;
  useCommitTally();

  const onPointerDown = (ev: ReactPointerEvent<HTMLDivElement>) => {
    if (!onDrag || ev.button !== 0) return;
    const rect = root.current?.getBoundingClientRect();
    if (!rect) return;
    drag.current = {
      id: ev.pointerId,
      startX: ev.clientX,
      startY: ev.clientY,
      offsetX: ev.clientX - rect.left,
      offsetY: ev.clientY - rect.top,
      moved: false,
    };
    ev.currentTarget.setPointerCapture(ev.pointerId);
  };

  const onPointerMove = (ev: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== ev.pointerId || !onDrag) return;
    if (!d.moved) {
      if (Math.abs(ev.clientX - d.startX) + Math.abs(ev.clientY - d.startY) < DRAG_THRESHOLD)
        return;
      d.moved = true;
    }
    const width = def.width ?? DOCK_WIDTH;
    const x = clamp(ev.clientX - d.offsetX, 8, window.innerWidth - Math.min(width, 160) - 8);
    const y = clamp(ev.clientY - d.offsetY, 56, window.innerHeight - 56);
    onDrag({ x, y });
  };

  const endDrag = (ev: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.moved || !onDrag) return;
    ev.currentTarget.releasePointerCapture?.(ev.pointerId);
    // Dropped over the dock band on the right: back into the column.
    if (ev.clientX > window.innerWidth - DOCK_BAND) onDrag(undefined);
  };

  return (
    <div
      ref={root}
      className={cn(HUD_PANEL, 'flex min-w-0 flex-col overflow-hidden', className)}
      style={style}
      data-panel={def.id}
    >
      <div
        className={cn(
          'flex h-9 shrink-0 items-center gap-2 border-b border-white/10 pr-1 pl-2.5',
          onDrag && 'cursor-grab active:cursor-grabbing',
          'bg-gradient-to-b from-white/[0.07] to-transparent'
        )}
        title={onDrag ? t('panel.drag') : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {Icon ? <Icon className="size-3.5 shrink-0 text-white/55" /> : null}
        <h2 className="min-w-0 flex-1 truncate text-xs font-semibold tracking-tight text-white/90">
          {def.title}
        </h2>
        {floating && onDock && showDockToggle ? (
          <HudIconButton label={t('panel.dock')} dense onClick={onDock} className="size-7">
            <PanelRightClose className="size-3.5" />
          </HudIconButton>
        ) : null}
        <HudIconButton
          label={collapsed ? t('panel.expand') : t('panel.collapse')}
          dense
          onClick={onCollapse}
          className="size-7"
        >
          <ChevronDown className={cn('size-3.5 transition-transform', collapsed && '-rotate-90')} />
        </HudIconButton>
        <HudIconButton
          label={t('panel.close')}
          dense
          onClick={() => ui.close(def.id)}
          className="size-7"
        >
          <X className="size-3.5" />
        </HudIconButton>
      </div>
      {collapsed ? null : (
        <div className={cn('min-h-0 overflow-x-hidden overflow-y-auto p-2.5', bodyClass)}>
          <def.Body t={t} locale={locale} ui={ui} store={store} close={() => ui.close(def.id)} />
        </div>
      )}
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
