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

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ChevronDown, PanelRightClose, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GameStore } from '../core/store';
import type { GameLocale, Translate } from '../i18n';
import type { PanelDef, UiMainApi } from './api';
import { PANEL, PANEL_HEAD } from './surface';
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
  /**
   * Whether the dock column is occupied.
   *
   * The bottom cluster pads itself by the column's width so the two do not overlap, and only this
   * component knows the answer: a panel dragged out of the column is open and not docked, and the
   * cluster should have the width back.
   */
  onDockedChange?(docked: boolean): void;
}

export function PanelHost({
  ui,
  store,
  t,
  locale,
  panels,
  narrow,
  onDockedChange,
}: PanelHostProps) {
  const [floating, setFloating] = useState<Record<string, Position | undefined>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const setPosition = useCallback((id: string, position: Position | undefined) => {
    setFloating((prev) => ({ ...prev, [id]: position }));
  }, []);

  const dockedCount = narrow ? 0 : panels.filter((p) => !floating[p.id]).length;
  useEffect(() => {
    onDockedChange?.(dockedCount > 0);
  }, [dockedCount, onDockedChange]);

  if (panels.length === 0) return null;

  if (narrow) {
    const top = panels[panels.length - 1];
    return (
      // The sheet takes what the build cluster leaves, up to 46svh. A fixed cap was the version
      // before it and it is a cap on the wrong element: the cluster below is a palette whose
      // height is somebody else's decision (512 px at 390 px wide with five item rows open), so a
      // sheet that insists on 46svh pushes the top bar off the screen rather than giving way.
      <div className="flex min-h-0 w-full flex-1 flex-col justify-end">
        <PanelFrame
          key={top.id}
          def={top}
          ui={ui}
          store={store}
          t={t}
          locale={locale}
          collapsed={false}
          onCollapse={() => {}}
          bodyClass="min-h-0 flex-1"
          className="pointer-events-auto max-h-[46svh] min-h-0 w-full flex-1"
          showDockToggle={false}
        />
      </div>
    );
  }

  const docked = panels.filter((p) => !floating[p.id]);
  const loose = panels.filter((p) => floating[p.id]);

  return (
    <>
      {docked.length > 0 ? (
        // The column does not scroll; its panels SHARE it, in EQUAL shares that a panel with
        // less to say hands back.
        //
        // `flex-1 basis-0` gives every panel the same share of the column and
        // `max-h-max` (max-height: max-content) caps it at what it actually needs — and flexbox
        // resolves a max-height violation by freezing that item and dividing the freed space
        // among the rest, which is the two-pass behaviour this wants and the reason it is worth
        // spelling out. Proportional shrink was the version before it (`shrink` on an `auto`
        // basis) and it is backwards: shrink is proportional to content height, so the panel with
        // the most rows keeps the most pixels. Measured at 1440x900 with the park, the rides and
        // the messages open, that gave the ride list 220 px with two of four rides visible while
        // the message log — an endless list by nature — took a share it had no use for. Now the
        // log is frozen at its own 87 px, the rides list gets its full 326 and shows all four,
        // and the park panel takes everything left.
        //
        // The column reaches to `bottom-3` rather than stopping above the build cluster, because
        // the cluster no longer lies under it: it pads itself by the column's width. That is 84
        // px given back, and it is exactly the 73 px by which the park panel was clipped at 1280.
        // `top-[136px]` is measured, not chosen: the top-right cluster is a 59 px stat tray, an
        // 8 px gap and a 48 px rail under 12 px of padding, so it ends at 127 — and a panel at
        // `z-30` over a rail at `z-auto` cuts the rail's bottom bevel off rather than tucking
        // under it. Nine pixels of daylight between the two.
        <div
          className="pointer-events-none absolute top-[136px] right-3 bottom-3 z-30 flex w-[344px] flex-col items-end gap-2 overflow-hidden"
          data-panel-dock=""
        >
          {docked.map((def, index) => (
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
              className="pointer-events-auto max-h-max min-h-0 w-full flex-1 basis-0"
              // The bottom panel keeps 46 px clear of core's corner lockup, which is a 123 x 38
              // watermark at `right-3 bottom-3` on `z-20` — above this whole HUD, because the
              // HUD's own root is `z-10` and a child cannot climb out of its stacking context.
              // It never came up while the column stopped 96 px above the floor. The lockup is
              // now drawn twice on this screen (the toolbelt carries one), so the request in
              // `docs/game/requests/ui.md` asks core to drop the corner copy; until it does,
              // this keeps a figure from being read through a logo.
              bodyClass={cn('min-h-0 flex-1', index === docked.length - 1 && 'pb-[46px]')}
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
      className={cn(PANEL, 'flex min-h-0 min-w-0 flex-col overflow-hidden', className)}
      style={style}
      data-panel={def.id}
    >
      {/* The header is its own raised strip rather than a tinted band: it is the part of the panel
          you grab, and on this skin the thing you can grab is the thing that stands proud. The
          hard 1 px shadow under it is what makes the body look recessed behind it. */}
      <div
        className={cn(
          PANEL_HEAD,
          'flex h-10 shrink-0 items-center gap-2 pr-1.5 pl-3',
          onDrag && 'cursor-grab active:cursor-grabbing'
        )}
        title={onDrag ? t('panel.drag') : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {Icon ? <Icon className="size-[15px] shrink-0 text-white/70" /> : null}
        <h2 className="min-w-0 flex-1 truncate text-[12.5px] font-bold tracking-[0.005em] text-white/95 [text-shadow:var(--game-engrave)]">
          {def.title}
        </h2>
        {floating && onDock && showDockToggle ? (
          <HudIconButton label={t('panel.dock')} onClick={onDock}>
            <PanelRightClose className="size-3.5" />
          </HudIconButton>
        ) : null}
        <HudIconButton
          label={collapsed ? t('panel.expand') : t('panel.collapse')}
          onClick={onCollapse}
        >
          <ChevronDown className={cn('size-3.5 transition-transform', collapsed && '-rotate-90')} />
        </HudIconButton>
        <HudIconButton label={t('panel.close')} onClick={() => ui.close(def.id)}>
          <X className="size-3.5" />
        </HudIconButton>
      </div>
      {collapsed ? null : (
        <div className={cn('min-h-0 overflow-x-hidden overflow-y-auto p-[11px]', bodyClass)}>
          <def.Body t={t} locale={locale} ui={ui} store={store} close={() => ui.close(def.id)} />
        </div>
      )}
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
