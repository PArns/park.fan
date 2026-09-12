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

/**
 * Width of the dock column, and the band a dropped panel re-docks in.
 *
 * 288, down from 344. The column is the single largest thing this module puts on the park — at
 * 1280 x 720 it was 344 x 572, a fifth of the frame on its own — and the panels inside it are
 * rows of small type that were never using the width: the widest row in any of the ten is the
 * ride list's, and it fits in 266 px of content box with the meter still 120 px long. Measured
 * cost of the change: 21.4 % of the frame to 17.9 % before the panels were trimmed, and it is the
 * reason the build cluster's reserve in `hud.tsx` is 300 (288 + the 12 px gap) rather than 368.
 */
const DOCK_WIDTH = 288;
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
   * The build cluster shifts left by the column's width so the two do not overlap, and only this
   * component knows the answer: a panel dragged out of the column is open and not docked, and the
   * cluster should have the middle of the screen back.
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
      // ## On a phone the sheet lies OVER the build cluster, and that is a reversal
      //
      // It used to sit above the cluster in the same flow column, so the build bar kept its place
      // — and the bill for that arrived at 390 x 844, where the cluster is a palette whose height
      // is somebody else's decision (512 px with five item rows open): the sheet was handed what
      // was left, which measured **16.0 px**, the clipped top of its own 40 px header with two
      // half-cut buttons in it. A panel that cannot show one row is not a panel, and a flow item
      // that can be crushed to nothing will be.
      //
      // So the sheet leaves the flow. It is anchored to the bottom of the screen, takes 58svh or
      // its content, whichever is smaller, and the build cluster is behind it until it is closed —
      // one tap on a 44 px key. What it may never do is reach the top row: 58svh of an 844 px
      // phone is 490, which leaves 346 px above it against the 180 the clock and the rail need.
      <div className="pointer-events-none absolute inset-x-2 bottom-2 z-40 flex justify-center">
        <PanelFrame
          key={top.id}
          def={top}
          ui={ui}
          store={store}
          t={t}
          locale={locale}
          collapsed={false}
          onCollapse={() => {}}
          bodyClass="min-h-0"
          className="pointer-events-auto max-h-[58svh] min-h-0 w-full"
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
        // Where the column starts and stops, and both numbers are measured rather than chosen.
        //
        // `top-[124px]`: the top-right cluster is a 52 px figure tray, an 8 px gap and a 44 px
        // rail under 12 px of padding, so it ends at 116 — and a panel at `z-30` over a rail at
        // `z-auto` would cut the rail's bottom bevel off rather than tuck under it.
        //
        // `bottom-[52px]`: the last 52 px of the right edge belong to core's corner lockup, a
        // 123 x 38 watermark at `right-3 bottom-3` on `z-20` — above this whole HUD, since the
        // HUD's own root is `z-10` and a child cannot climb out of its stacking context. The
        // version before this reserved the space as 46 px of padding INSIDE the bottom panel's
        // body, which was wrong the moment the body scrolled: padding in a scroller moves with
        // the content, so the logo ends up over whatever scrolled under it. Shortening the column
        // costs the same 46 px and cannot come apart. `docs/game/requests/ui.md` asks core to drop
        // the corner copy — the toolbelt already carries the mark eight pixels away.
        <div
          className="pointer-events-none absolute top-[124px] right-3 bottom-[52px] z-30 flex w-[288px] flex-col items-end gap-2 overflow-hidden"
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
              className="pointer-events-auto max-h-max min-h-0 w-full flex-1 basis-0"
              bodyClass="min-h-0 flex-1"
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
  const body = useRef<HTMLDivElement>(null);
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
      className={cn(PANEL, 'relative flex min-h-0 min-w-0 flex-col overflow-hidden', className)}
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
      {/* The body scrolls inside the header, and {@link ScrollEdge} is what says so. */}
      {collapsed ? null : (
        <div
          ref={body}
          className={cn('min-h-0 overflow-x-hidden overflow-y-auto p-[11px]', bodyClass)}
          data-panel-body=""
        >
          <def.Body t={t} locale={locale} ui={ui} store={store} close={() => ui.close(def.id)} />
        </div>
      )}
      {collapsed ? null : <ScrollEdge target={body} />}
    </div>
  );
}

/**
 * The mark that says a panel has more below, and it is a shadow rather than a scrollbar.
 *
 * The body always scrolled; nothing said so. Chromium's scrollbar in this app is an OVERLAY —
 * measured on all three open panels at 1280 x 720, `offsetWidth - clientWidth` = 0 — so it is
 * invisible until something is dragged, and a panel with rows below the fold reads as a panel
 * whose last row was cut off. Neither CSS route reaches it: `scrollbar-width: thin` leaves the
 * gutter at 0, and `::-webkit-scrollbar` is ignored outright because `globals.css` sets
 * `scrollbar-color` on `.dark`, which inherits into every element in the game. That is also the
 * reason not to chase it — on macOS an overlay scrollbar is the platform default and a real
 * player would never see one either.
 *
 * So: a 24 px shadow across the bottom edge of the panel, drawn only while there is something
 * under it and gone at the end of the scroll. It is the same gradient the well uses, so it reads
 * as depth in the moulding rather than as a widget.
 */
function ScrollEdge({ target }: { target: React.RefObject<HTMLDivElement | null> }) {
  const [more, setMore] = useState(false);
  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const read = () => {
      const slack = el.scrollHeight - el.clientHeight - el.scrollTop;
      setMore(el.scrollHeight - el.clientHeight > 4 && slack > 4);
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(el);
    for (const child of el.children) observer.observe(child);
    el.addEventListener('scroll', read, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', read);
    };
  }, [target]);
  if (!more) return null;
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-6 rounded-b-(--game-hud-radius) bg-[image:linear-gradient(0deg,rgb(0_0_0/0.45),rgb(0_0_0/0.14)_55%,transparent)]"
      data-panel-more=""
    />
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
