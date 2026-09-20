'use client';

import { useTranslations } from 'next-intl';
import { PlannerEntryRow } from './planner-entry-row';
import { bandCarriesFigure, estimateFor } from '@/lib/planner/estimate';
import { dayScale } from '@/lib/planner/bar-geometry';
import { partyFlags } from '@/lib/planner/party';
import type { PlannerDayPrefs, PlannerEntry } from '@/lib/planner/types';
import type { PlanDay } from '@/lib/api/types';

interface PlannerTimelineProps {
  entries: readonly PlannerEntry[];
  day: PlanDay | null;
  /**
   * Who is coming, if anybody asked. The grid's blocks carry the party's marks
   * and so do these rows — this is the same plan drawn without an axis, and a
   * park whose hours we do not know is not a park where the water is drier.
   */
  prefs?: PlannerDayPrefs;
  onToggleDone: (entryId: string, done: boolean) => void;
  onRemove: (entryId: string) => void;
}

/**
 * The day's plan as a flat list — the fallback for a day whose opening hours are
 * unknown.
 *
 * It is not the main view any more: `PlannerDayGrid` is, and it positions a
 * block at its start minute with a height that is its queue. This survives for
 * the one case that grid cannot honestly draw, because without an opening and a
 * closing hour there is no axis to draw on — inventing 00:00–24:00 would assert
 * a park that never closes, and inventing 09:00–18:00 would invent a schedule.
 *
 * There is no reordering here, and that is not a regression. Dragging meant
 * "take the hour of the row you landed on", which was only ever a way to express
 * a time without an axis to express it against. With no hours there is no time
 * to drop onto; the grid does the real thing.
 */
export function PlannerTimeline({
  entries,
  day,
  prefs,
  onToggleDone,
  onRemove,
}: PlannerTimelineProps) {
  const t = useTranslations('planner');

  // Keyed lookup rather than a `find` per row: the grid reaches its ride through
  // a layout that has already paired the two, and this view has only the entry.
  const ridesBySlug = new Map((day?.rides ?? []).map((ride) => [ride.attractionSlug, ride]));

  const estimates = entries.map((entry) => estimateFor(day, entry));
  const scale = dayScale(estimates.map((e) => e.wait));
  const tier = day?.tier ?? 'composed';
  const showBandFigure = bandCarriesFigure(day);

  if (entries.length === 0) return null;

  return (
    <ol className="flex flex-col">
      {entries.map((entry, index) => (
        <PlannerEntryRow
          key={entry.id}
          entry={entry}
          estimate={estimates[index]}
          scale={scale}
          tier={tier}
          showBandFigure={showBandFigure}
          wet={
            partyFlags(
              (entry.attractionSlug ? ridesBySlug.get(entry.attractionSlug) : undefined) ?? {},
              prefs
            ).wet
          }
          onToggleDone={() => onToggleDone(entry.id, !entry.done)}
          onRemove={() => onRemove(entry.id)}
        />
      ))}
      {/* Screen readers get the order as text. */}
      <li className="sr-only" aria-live="polite">
        {t('summary.rides', { count: entries.length })}
      </li>
    </ol>
  );
}
