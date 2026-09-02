'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import {
  MIN_BLOCK_PX,
  SNAP_MIN_COARSE,
  SNAP_MIN_FINE,
  clampStart,
  heightFor,
  minuteAt,
  packLanes,
  rideFloor,
  snapTo,
  yFor,
  type DayGrid,
} from '@/lib/planner/day-grid';
import { legBetween, earliestGoodStart } from '@/lib/planner/leg';
import { formatGridTime, parkMinuteNow } from '@/lib/planner/park-time';
import { bandCarriesFigure, estimateFor } from '@/lib/planner/estimate';
import { PlannerGridGround } from './planner-grid-ground';
import { PlannerBlock } from './planner-block';
import { PlannerLeg } from './planner-leg';
import { showLinePositions } from '@/lib/planner/day-grid';
import type { PlannerEntry } from '@/lib/planner/types';
import type { PlanDay, PlanDayRide } from '@/lib/api/types';

interface PlannerDayGridProps {
  entries: readonly PlannerEntry[];
  day: PlanDay | null;
  grid: DayGrid;
  /** The park's IANA zone. The now line and "today" are read from it, never from the browser. */
  timezone: string;
  /** True when the plan's date is today in the PARK's reading. */
  isToday: boolean;
  /** Live standby minutes by ride slug, where a reading applies. */
  liveWaits?: Map<string, number> | null;
  /** Showtimes as park-local minutes. `null` means "not knowable for this date". */
  showLines?: import('@/lib/planner/live').PlannerShowLine[] | null;
  loading?: boolean;
  onMove: (entryId: string, startMinute: number) => void;
  onShiftFrom: (entryId: string, deltaMinutes: number) => void;
  onSelect: (entryId: string | null) => void;
  selectedId: string | null;
  /** The scroll container, for the drag's auto-scroll. */
  scrollerRef: React.RefObject<HTMLDivElement | null>;
}

/** How far from a live reading's own moment it may still speak for a block. */
const LIVE_WINDOW_MIN = 45;

const EDGE_PX = 48;
const MAX_SCROLL_SPEED = 12;

/**
 * One interval for every grid on the page, and a counter rather than a time:
 * the value only has to CHANGE each minute, and the actual clock is read in park
 * time where it is needed. On the server it is 0 and the now line is absent.
 */
let minuteTick = 0;
const minuteListeners = new Set<() => void>();

function subscribeToMinute(listener: () => void): () => void {
  minuteListeners.add(listener);
  if (minuteListeners.size === 1) {
    minuteTimer = window.setInterval(() => {
      minuteTick += 1;
      for (const l of minuteListeners) l();
    }, 60_000);
  }
  return () => {
    minuteListeners.delete(listener);
    if (minuteListeners.size === 0 && minuteTimer !== null) {
      window.clearInterval(minuteTimer);
      minuteTimer = null;
    }
  };
}

let minuteTimer: number | null = null;

function getMinuteTick(): number {
  return minuteTick;
}

/**
 * The day grid: the axis, the ground, the blocks and the legs between them.
 *
 * Everything positional comes from `lib/planner/day-grid.ts`, which is pure and
 * tested — this component owns the gesture and the DOM, and no arithmetic that
 * decides where a minute lives.
 */
export function PlannerDayGrid({
  entries,
  day,
  grid,
  timezone,
  isToday,
  liveWaits,
  showLines = null,
  loading = false,
  onMove,
  onShiftFrom,
  onSelect,
  selectedId,
  scrollerRef,
}: PlannerDayGridProps) {
  const t = useTranslations('planner');
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dense, setDense] = useState(false);

  // The half-hour hairlines are a question about the CANVAS's width, not the
  // viewport's: this same component is 448 px in a desktop sheet and ~342 px on
  // a phone, and `/ui` could render it narrower still.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => setDense(entry.contentRect.width >= 400));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The now line, in park time. Through `useSyncExternalStore` because a clock
  // IS an external source that changes on its own — and because its server
  // snapshot is `null`, so the line is never in the first HTML for a client to
  // disagree with.
  const nowTick = useSyncExternalStore(subscribeToMinute, getMinuteTick, () => 0);
  const nowMinute = useMemo(
    () => (isToday && nowTick >= 0 ? parkMinuteNow(timezone) : null),
    // `nowTick` is the dependency that makes this recompute each minute.
    [isToday, timezone, nowTick]
  );

  const ridesBySlug = useMemo(() => {
    const map = new Map<string, PlanDayRide>();
    for (const ride of day?.rides ?? []) map.set(ride.attractionSlug, ride);
    return map;
  }, [day]);

  const tier = day?.tier ?? 'composed';
  const showBandFigure = bandCarriesFigure(day);

  /**
   * Everything the grid draws, in one pass.
   *
   * A live standby reading replaces the forecast only for a block within
   * `LIVE_WINDOW_MIN` of the reading's own moment: a queue measured at 11:05
   * describes 11:05, and pushing it into a 16:00 block would put the
   * freshest-looking number on the least relevant row. The later curve is
   * deliberately NOT scaled by the live-to-forecast ratio — that is the obvious
   * move and nothing measures it.
   */
  const layout = useMemo(() => {
    const ordered = [...entries].sort((a, b) => a.startMinute - b.startMinute);

    const rows = ordered.map((entry) => {
      const ride = ridesBySlug.get(entry.attractionSlug);
      const estimate = estimateFor(day, entry);

      const liveWait =
        !entry.done &&
        nowMinute !== null &&
        Math.abs(entry.startMinute - nowMinute) <= LIVE_WINDOW_MIN
          ? (liveWaits?.get(entry.attractionSlug) ?? null)
          : null;

      const effective =
        liveWait !== null
          ? { ...estimate, wait: liveWait, uncertaintyMinutes: null, missing: 'none' as const }
          : estimate;

      const wait = entry.done ? (entry.actualWait ?? null) : effective.wait;
      const spanMinutes = Math.max(
        (wait ?? 0) + (entry.done ? 0 : (effective.uncertaintyMinutes ?? 0)),
        MIN_BLOCK_PX / grid.pxPerMin
      );

      return { entry, ride, estimate: effective, wait, spanMinutes, live: liveWait !== null };
    });

    const lanes = packLanes(
      rows.map((r) => ({
        id: r.entry.id,
        topMin: r.entry.startMinute,
        bottomMin: r.entry.startMinute + r.spanMinutes,
      }))
    );

    const legs = rows.slice(0, -1).map((from, index) => {
      const to = rows[index + 1];
      return {
        id: `${from.entry.id}->${to.entry.id}`,
        fromEntry: from.entry,
        toEntry: to.entry,
        leg: legBetween(
          { startMinute: from.entry.startMinute, wait: from.wait, ride: from.ride },
          { startMinute: to.entry.startMinute, wait: to.wait, ride: to.ride },
          from.estimate.uncertaintyMinutes
        ),
        lane: lanes.get(to.entry.id) ?? { column: 0, columns: 1, overflow: 0 },
        fromMinute: from.entry.startMinute + (from.wait ?? 0),
      };
    });

    const broken = new Set<string>();
    for (const l of legs) {
      if (l.leg.verdict === 'broken') {
        broken.add(l.fromEntry.id);
        broken.add(l.toEntry.id);
      }
    }

    return { rows, lanes, legs, broken };
  }, [entries, day, ridesBySlug, liveWaits, nowMinute, grid.pxPerMin]);

  /** Median share of each hour's own peak — the rush strip's shape. */
  const rushByHour = useMemo(() => {
    const out = new Map<number, number>();
    const rides = day?.rides ?? [];
    if (rides.length === 0) return out;

    const byHour = new Map<number, number[]>();
    for (const ride of rides) {
      if (ride.dayPeak <= 0) continue;
      for (const point of ride.hours) {
        const list = byHour.get(point.hour) ?? [];
        list.push(point.wait / ride.dayPeak);
        byHour.set(point.hour, list);
      }
    }
    for (const [hour, shares] of byHour) {
      shares.sort((a, b) => a - b);
      out.set(hour, shares[Math.floor(shares.length / 2)]);
    }
    return out;
  }, [day]);

  // ── The drag ───────────────────────────────────────────────────────────────
  const dragState = useRef<{
    entryId: string;
    grabOffsetPx: number;
    startMinute: number;
    lastClientY: number;
    floorMin: number;
    element: HTMLElement;
    frame: number | null;
    committed: boolean;
  } | null>(null);

  const targetMinute = useCallback(() => {
    const state = dragState.current;
    const canvas = canvasRef.current;
    if (!state || !canvas) return 0;
    // Re-read the rect EVERY frame: it folds in the container's own scroll,
    // which is the one thing the old index-based hit test already got right.
    const top = canvas.getBoundingClientRect().top;
    const raw = minuteAt(grid, state.lastClientY - top - state.grabOffsetPx);
    const step = matchMedia('(pointer: coarse)').matches ? SNAP_MIN_COARSE : SNAP_MIN_FINE;
    return clampStart(grid, snapTo(raw, step), state.floorMin);
  }, [grid]);

  const endDrag = useCallback(
    (commit: boolean) => {
      const state = dragState.current;
      if (!state) return;
      if (state.frame !== null) cancelAnimationFrame(state.frame);
      state.element.style.removeProperty('--pl-drag-dy');

      const minute = targetMinute();
      dragState.current = null;
      setDraggingId(null);

      // A gesture the browser steals must not write. The old list bound its end
      // handler to `pointerup` AND `pointercancel` and committed unconditionally,
      // so a scroll that took the pointer over silently wrote a move nobody made.
      if (commit && minute !== state.startMinute) onMove(state.entryId, minute);
    },
    [onMove, targetMinute]
  );

  const handleDragStart = useCallback(
    (entry: PlannerEntry, floorMin: number) => (event: React.PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();

      const block = event.currentTarget.closest('[data-planner-block]') as HTMLElement | null;
      if (!block) return;

      const handle = event.currentTarget;
      handle.setPointerCapture(event.pointerId);
      // `preventDefault` above eats the focus a mouse drag would take, so a
      // keyboard user cannot resume where the pointer just was.
      handle.focus({ preventScroll: true });

      dragState.current = {
        entryId: entry.id,
        grabOffsetPx: event.clientY - block.getBoundingClientRect().top,
        startMinute: entry.startMinute,
        lastClientY: event.clientY,
        floorMin,
        element: block,
        frame: null,
        committed: false,
      };
      setDraggingId(entry.id);
      onSelect(entry.id);

      const onPointerMove = (moveEvent: PointerEvent) => {
        if (dragState.current) dragState.current.lastClientY = moveEvent.clientY;
      };
      const onUp = () => {
        detach();
        endDrag(true);
      };
      const onCancel = () => {
        detach();
        endDrag(false);
      };
      const detach = () => {
        handle.removeEventListener('pointermove', onPointerMove);
        handle.removeEventListener('pointerup', onUp);
        handle.removeEventListener('pointercancel', onCancel);
        try {
          handle.releasePointerCapture(event.pointerId);
        } catch {
          // Already released — a cancelled gesture, or the element unmounted
          // mid-drag. Nothing to release and nothing to report.
        }
      };

      handle.addEventListener('pointermove', onPointerMove);
      handle.addEventListener('pointerup', onUp);
      handle.addEventListener('pointercancel', onCancel);

      // The loop lives in the gesture rather than in a `useCallback`: it is
      // per-gesture state, and a self-recursive rAF callback hoisted to a hook
      // is both harder to read and something React's compiler rightly objects to.
      //
      // A rAF loop and NOT an event-driven one: `pointermove` does not fire
      // while a finger is held still, so an auto-scroll driven by it would move
      // the grid out from under the finger and freeze the drop time where the
      // finger last moved.
      const frame = () => {
        const state = dragState.current;
        if (!state) return;

        const scroller = scrollerRef.current;
        if (scroller && scroller.scrollHeight > scroller.clientHeight) {
          // The SCROLLER's rect, not the viewport's: on a phone the bottom
          // sixth of the screen is the page behind the sheet.
          const box = scroller.getBoundingClientRect();
          const depthTop = box.top + EDGE_PX - state.lastClientY;
          const depthBottom = state.lastClientY - (box.bottom - EDGE_PX);
          if (depthTop > 0) {
            scroller.scrollTop -= MAX_SCROLL_SPEED * Math.min(1, depthTop / EDGE_PX);
          } else if (depthBottom > 0) {
            scroller.scrollTop += MAX_SCROLL_SPEED * Math.min(1, depthBottom / EDGE_PX);
          }
        }

        // A custom property, never `top`: writing `top` on every frame is layout
        // on N blocks in a panel that is mounted in every page's layout.
        state.element.style.setProperty(
          '--pl-drag-dy',
          `${heightFor(grid, targetMinute() - state.startMinute)}px`
        );

        state.frame = requestAnimationFrame(frame);
      };

      dragState.current.frame = requestAnimationFrame(frame);
    },
    [endDrag, grid, onSelect, scrollerRef, targetMinute]
  );

  useEffect(() => {
    const stop = () => endDrag(false);
    document.addEventListener('visibilitychange', stop);
    return () => {
      document.removeEventListener('visibilitychange', stop);
      endDrag(false);
    };
  }, [endDrag]);

  const snapStep =
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
      ? SNAP_MIN_COARSE
      : SNAP_MIN_FINE;

  const hours: number[] = [];
  for (let h = Math.ceil(grid.openMin / 60); h * 60 <= grid.closeMin; h++) hours.push(h);

  return (
    <div className="relative flex" data-planner-grid="">
      {/* The gutter. Its own column, so a show pill and an hour label resolve
          their only possible collision with the pill's own background. */}
      <div className="relative w-11 shrink-0 max-sm:w-10" style={{ height: grid.heightPx }}>
        {hours.map((hour) => (
          <span
            key={hour}
            className="text-muted-foreground absolute right-1 -translate-y-1/2 text-[11px] tabular-nums"
            style={{ top: yFor(grid, hour * 60) }}
          >
            {formatGridTime(hour * 60)}
          </span>
        ))}
        {grid.closeIsTruncated && (
          <span
            className="text-muted-foreground/70 absolute right-1 translate-y-1 text-[10px] whitespace-nowrap"
            style={{ top: yFor(grid, grid.closeMin) }}
          >
            {t('grid.closesApprox', { time: formatGridTime(grid.closeMin) })}
          </span>
        )}
        {showLines !== null &&
          showLinePositions(
            grid,
            showLines.map((line) => line.minute)
          )
            .filter((line) => line.minute >= grid.gridStartMin && line.minute <= grid.gridEndMin)
            .map((line) => (
              <span
                key={`show-time-${line.minute}`}
                className="bg-background text-foreground/70 absolute right-1 -translate-y-1/2 rounded px-0.5 text-[10px] tabular-nums"
                style={{ top: line.y }}
              >
                {formatGridTime(line.minute)}
              </span>
            ))}

        {nowMinute !== null && nowMinute >= grid.gridStartMin && nowMinute <= grid.gridEndMin && (
          <span
            className="bg-destructive text-destructive-foreground absolute right-1 -translate-y-1/2 rounded-full px-1 text-[10px] tabular-nums"
            style={{ top: yFor(grid, nowMinute) }}
          >
            {formatGridTime(nowMinute)}
          </span>
        )}
      </div>

      <div
        ref={canvasRef}
        className="relative min-w-0 flex-1 pr-2"
        style={{ height: grid.heightPx }}
      >
        <PlannerGridGround grid={grid} rushByHour={rushByHour} dense={dense} loading={loading} />

        {/* Shows as lines across the grid, UNDER the blocks (`z-10` against the
            blocks' `10 + column`) so a line never buries a name. The time goes
            in the gutter, which is why the grid keeps its full width on the
            ~92 % of park-days with no shows to draw. */}
        {showLines !== null &&
          showLinePositions(
            grid,
            showLines.map((line) => line.minute)
          )
            .filter((line) => line.minute >= grid.gridStartMin && line.minute <= grid.gridEndMin)
            .map((line) => (
              <div
                key={`show-${line.minute}`}
                className="border-foreground/25 pointer-events-none absolute inset-x-0 z-10 border-t border-dashed"
                style={{ top: line.y }}
                aria-hidden="true"
              />
            ))}

        {/* The now line. Outlook's, and the reason the panel says out loud that
            its clock is the park's. */}
        {nowMinute !== null && nowMinute >= grid.gridStartMin && nowMinute <= grid.gridEndMin && (
          <div
            className="bg-destructive/70 pointer-events-none absolute inset-x-0 z-[15] h-px"
            style={{ top: yFor(grid, nowMinute) }}
            aria-hidden="true"
          />
        )}

        {entries.length === 0 ? (
          <div className="text-muted-foreground absolute inset-x-4 top-1/3 text-center text-xs">
            <p className="text-foreground text-sm font-medium">{t('empty.title')}</p>
            <p className="mt-1">{t('empty.bodyGrid')}</p>
          </div>
        ) : (
          <ol className="absolute inset-0">
            {layout.legs.map((entry) => (
              <PlannerLeg
                key={entry.id}
                leg={entry.leg}
                grid={grid}
                fromMinute={entry.fromMinute}
                toMinute={entry.toEntry.startMinute}
                lane={entry.lane}
                onRepair={() =>
                  onMove(
                    entry.toEntry.id,
                    earliestGoodStart(
                      {
                        startMinute: entry.fromEntry.startMinute,
                        wait:
                          layout.rows.find((r) => r.entry.id === entry.fromEntry.id)?.wait ?? null,
                        ride: null,
                      },
                      entry.leg
                    )
                  )
                }
                onRepairCascade={() =>
                  onShiftFrom(
                    entry.toEntry.id,
                    Math.max(0, entry.leg.floorMinutes - entry.leg.gapMinutes)
                  )
                }
              />
            ))}

            {layout.rows.map((row, index) => {
              const floor = rideFloor(grid, row.ride);
              const previous = index > 0 ? layout.legs[index - 1] : null;
              return (
                <PlannerBlock
                  key={row.entry.id}
                  entry={row.entry}
                  estimate={row.estimate}
                  grid={grid}
                  tier={tier}
                  lane={layout.lanes.get(row.entry.id) ?? { column: 0, columns: 1, overflow: 0 }}
                  land={row.ride?.land}
                  metresFromPrevious={previous?.leg.metres ?? null}
                  showBandFigure={showBandFigure}
                  live={row.live}
                  selected={selectedId === row.entry.id}
                  dragging={draggingId === row.entry.id}
                  conflict={layout.broken.has(row.entry.id)}
                  onSelect={() => onSelect(row.entry.id)}
                  onDragStart={handleDragStart(row.entry, floor.hardMin)}
                  onMove={(minute) => onMove(row.entry.id, minute)}
                  minMinute={floor.hardMin}
                  maxMinute={grid.closeMin - SNAP_MIN_FINE}
                  snapStep={snapStep}
                />
              );
            })}
          </ol>
        )}

        {/* The not-yet-open region of the ride being dragged, drawn in its own
            lane only so it never becomes a wall across the grid. Hard region:
            the drag cannot enter it. */}
        {draggingId !== null &&
          (() => {
            const row = layout.rows.find((r) => r.entry.id === draggingId);
            if (!row) return null;
            const floor = rideFloor(grid, row.ride);
            const lane = layout.lanes.get(row.entry.id) ?? { column: 0, columns: 1, overflow: 0 };
            const laneWidth = `calc((100% - ${(lane.columns - 1) * 2}px) / ${lane.columns})`;
            const laneLeft = `calc((${laneWidth} + 2px) * ${lane.column})`;
            return (
              <>
                <div
                  className="border-primary/70 pointer-events-none absolute top-0 z-[25] border-b"
                  style={{
                    height: yFor(grid, floor.hardMin),
                    left: laneLeft,
                    width: laneWidth,
                    backgroundColor: 'color-mix(in oklch, var(--background) 70%, transparent)',
                    backgroundImage:
                      'repeating-linear-gradient(135deg, color-mix(in oklch, var(--muted-foreground) 22%, transparent) 0 2px, transparent 2px 7px)',
                  }}
                  aria-hidden="true"
                />
                {/* Soft region: measurement, not opening. It never blocks — a
                    block dropped in it honestly loses its figure, which is what
                    the data actually says. */}
                {floor.softMin > floor.hardMin && (
                  <div
                    className="pointer-events-none absolute z-[24] opacity-20"
                    style={{
                      top: yFor(grid, floor.hardMin),
                      height: heightFor(grid, floor.softMin - floor.hardMin),
                      left: laneLeft,
                      width: laneWidth,
                      backgroundImage:
                        'repeating-linear-gradient(135deg, color-mix(in oklch, var(--muted-foreground) 22%, transparent) 0 2px, transparent 2px 7px)',
                    }}
                    aria-hidden="true"
                  />
                )}
              </>
            );
          })()}
      </div>
    </div>
  );
}
