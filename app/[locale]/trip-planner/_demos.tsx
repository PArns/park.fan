'use client';

import { useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PlannerDayGrid } from '@/components/planner/planner-day-grid';
import { PlannerShowBand } from '@/components/planner/planner-show-band';
import { PlannerGridActions } from '@/components/planner/planner-grid-actions';
import { PlannerContextBand } from '@/components/planner/planner-context-band';
import { buildDayGrid } from '@/lib/planner/day-grid';
import { showLinesFor } from '@/lib/planner/shows';
import type { PlanDay } from '@/lib/api/types';
import type { PlannerCustomBlock, PlannerEntry } from '@/lib/planner/types';

/**
 * The demos on the planner's own page.
 *
 * They render the PRODUCTION components — `PlannerDayGrid`, `PlannerShowBand`,
 * `PlannerGridActions`, `PlannerContextBand` — off a frozen but real payload,
 * which is the same rule the guide page follows and for the same two reasons: a
 * redrawn lookalike starts lying at the first restyle, and an invented number
 * sits one link away from the ride's own page, where the real one is.
 *
 * They are also genuinely operable. The grid is the panel's grid, so a block
 * here drags, snaps, pushes its neighbours and recomputes its height from the
 * hour it lands on — the state lives in this component instead of in the
 * planner's store, so nothing a reader does here is written to their plan.
 */

/** The panel is 448 px by default, and these are drawn at that width. */
const PANEL_WIDTH = 'mx-auto w-full max-w-[448px]';

function useDemoState(initial: PlannerEntry[]) {
  const [entries, setEntries] = useState<PlannerEntry[]>(initial);

  const byStart = (list: PlannerEntry[]) => [...list].sort((a, b) => a.startMinute - b.startMinute);

  return {
    entries,
    move: (entryId: string, startMinute: number) =>
      setEntries((list) =>
        byStart(list.map((e) => (e.id === entryId ? { ...e, startMinute } : e)))
      ),
    shiftFrom: (entryId: string, delta: number) =>
      setEntries((list) => {
        const ordered = byStart(list);
        const from = ordered.findIndex((e) => e.id === entryId);
        if (from === -1) return list;
        return byStart(
          ordered.map((e, index) =>
            index >= from ? { ...e, startMinute: e.startMinute + delta } : e
          )
        );
      }),
    resize: (entryId: string, durationMinutes: number) =>
      setEntries((list) =>
        list.map((e) =>
          e.id === entryId && e.custom ? { ...e, custom: { ...e.custom, durationMinutes } } : e
        )
      ),
    editCustom: (entryId: string, patch: Partial<PlannerCustomBlock>) =>
      setEntries((list) =>
        list.map((e) =>
          e.id === entryId && e.custom ? { ...e, custom: { ...e.custom, ...patch } } : e
        )
      ),
    toggleDone: (entryId: string, done: boolean) =>
      setEntries((list) => list.map((e) => (e.id === entryId ? { ...e, done } : e))),
    remove: (entryId: string) => setEntries((list) => list.filter((e) => e.id !== entryId)),
  };
}

/**
 * A whole planned day, at the panel's own width.
 *
 * `isToday` is false and stays false: the day in the fixture has passed, so
 * there is no now line to draw and no minute timer to hold open — and
 * `PlannerDayGrid` gates its weather request on the forecast horizon, which a
 * date this far back is outside, so the exhibit makes no network call at all.
 */
export function PlannerDayDemo({
  day,
  entries: initial,
  selected = null,
}: {
  day: PlanDay;
  entries: PlannerEntry[];
  /** Pre-selected block, so the action bar's figures are on screen. */
  selected?: string | null;
}) {
  const state = useDemoState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(selected);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const grid = buildDayGrid(day.context.openHour, day.context.closeHour);
  const showLines = useMemo(
    () =>
      showLinesFor(day.shows, {
        openMin: (day.context.openHour ?? 0) * 60,
        closeMin: (day.context.closeHour ?? 24) * 60,
      }),
    [day]
  );

  if (!grid) return null;

  return (
    <figure className={PANEL_WIDTH}>
      <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
        <PlannerContextBand day={day} state="ready" />
        <div className="relative">
          <PlannerShowBand lines={showLines} timezone={day.timezone} isToday={false} />
          <div ref={scrollerRef} className="relative max-h-[680px] overflow-y-auto px-1 py-2">
            <PlannerDayGrid
              entries={state.entries}
              day={day}
              grid={grid}
              timezone={day.timezone}
              isToday={false}
              showLines={showLines}
              parkSlug={day.parkSlug}
              onMove={state.move}
              onShiftFrom={state.shiftFrom}
              onResize={state.resize}
              onSelect={setSelectedId}
              selectedId={selectedId}
              scrollerRef={scrollerRef}
            />
          </div>
          {selectedId && (
            <PlannerGridActions
              entry={state.entries.find((e) => e.id === selectedId) ?? null}
              day={day}
              onToggleDone={state.toggleDone}
              onRemove={(entryId) => {
                state.remove(entryId);
                setSelectedId(null);
              }}
              onClose={() => setSelectedId(null)}
              onEditCustom={state.editCustom}
            />
          )}
        </div>
      </div>
      <DemoCaption />
    </figure>
  );
}

/**
 * Which day the numbers are from, under every demo.
 *
 * Not decoration: the blocks above it carry minutes, and a figure with no date
 * on it reads as the forecast for whatever day the reader is having.
 */
function DemoCaption() {
  const t = useTranslations('planner.page.demo');
  return (
    <figcaption className="text-muted-foreground mt-2 text-center text-xs">
      {t('caption')}
    </figcaption>
  );
}
