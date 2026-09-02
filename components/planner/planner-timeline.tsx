'use client';

import { useCallback, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PlannerEntryRow } from './planner-entry-row';
import { bandCarriesFigure, estimateFor } from '@/lib/planner/estimate';
import { dayScale } from '@/lib/planner/bar-geometry';
import type { PlannerEntry } from '@/lib/planner/types';
import type { PlanDay } from '@/lib/api/types';

/** Must match `h-14` on the row — the drag maths counts rows by height. */
const ROW_HEIGHT = 56;

interface PlannerTimelineProps {
  entries: readonly PlannerEntry[];
  day: PlanDay | null;
  onReorder: (entryId: string, toIndex: number) => void;
  onToggleDone: (entryId: string, done: boolean) => void;
  onRemove: (entryId: string) => void;
}

/**
 * The day's plan, in order.
 *
 * Drag and drop is hand-written on pointer events, and that is a decision rather
 * than an omission: no drag library is installed, the list is short and uniform,
 * and the rows are a fixed height — which turns "which row is under the finger"
 * into one division instead of a hit-testing pass.
 *
 * Three things it has to get right, and all three are why it does not simply
 * reuse a card's own pointer handling:
 *
 * `setPointerCapture` on the handle, so the drag survives the pointer leaving the
 * row — without it, moving faster than React re-renders drops the gesture.
 *
 * `touch-none` on the handle (not the row), so a drag does not fight the panel's
 * own scrolling. Putting it on the row would make the list unscrollable on a
 * phone, which is how most of it gets read.
 *
 * And the drop index is clamped to the list, so dragging past the last row lands
 * on the last row rather than nowhere.
 */
export function PlannerTimeline({
  entries,
  day,
  onReorder,
  onToggleDone,
  onRemove,
}: PlannerTimelineProps) {
  const t = useTranslations('planner');
  const listRef = useRef<HTMLOListElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const tier = day?.tier ?? 'composed';
  const showBandFigure = bandCarriesFigure(day);

  const estimates = entries.map((entry) => estimateFor(day, entry));
  const scale = dayScale(estimates.map((e) => e.wait));

  const indexFromPointer = useCallback(
    (clientY: number): number => {
      const list = listRef.current;
      if (!list) return 0;
      const top = list.getBoundingClientRect().top;
      const raw = Math.floor((clientY - top) / ROW_HEIGHT);
      return Math.max(0, Math.min(raw, entries.length - 1));
    },
    [entries.length]
  );

  const handleDragStart = useCallback(
    (entryId: string) => (event: React.PointerEvent<HTMLElement>) => {
      // Left button or touch only: a right-click drag would start a gesture the
      // visitor cannot see the end of.
      if (event.button !== 0) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      setDraggingId(entryId);
      setDropIndex(indexFromPointer(event.clientY));

      const handle = event.currentTarget;

      const onMove = (moveEvent: PointerEvent) => {
        setDropIndex(indexFromPointer(moveEvent.clientY));
      };

      const onEnd = (endEvent: PointerEvent) => {
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onEnd);
        handle.removeEventListener('pointercancel', onEnd);
        try {
          handle.releasePointerCapture(endEvent.pointerId);
        } catch {
          // The capture is already gone — a cancelled gesture, or the element
          // unmounted mid-drag. Nothing to release and nothing to report.
        }
        const target = indexFromPointer(endEvent.clientY);
        setDraggingId(null);
        setDropIndex(null);
        onReorder(entryId, target);
      };

      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onEnd);
      handle.addEventListener('pointercancel', onEnd);
    },
    [indexFromPointer, onReorder]
  );

  if (entries.length === 0) return null;

  return (
    <ol ref={listRef} className="flex flex-col">
      {entries.map((entry, index) => (
        <PlannerEntryRow
          key={entry.id}
          entry={entry}
          estimate={estimates[index]}
          scale={scale}
          tier={tier}
          showBandFigure={showBandFigure}
          dragging={draggingId === entry.id}
          dropTarget={draggingId !== null && draggingId !== entry.id && dropIndex === index}
          onToggleDone={() => onToggleDone(entry.id, !entry.done)}
          onRemove={() => onRemove(entry.id)}
          onDragStart={handleDragStart(entry.id)}
        />
      ))}
      {/* Screen readers get the order as text; the drag handle is a button they
          can reach but not usefully drag. Reordering by keyboard is not built
          yet and is listed in todo.md. */}
      <li className="sr-only" aria-live="polite">
        {t('summary.rides', { count: entries.length })}
      </li>
    </ol>
  );
}
