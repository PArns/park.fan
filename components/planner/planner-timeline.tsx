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
  /** Who is coming, if anybody asked: these rows carry the party's marks like the grid's blocks. */
  prefs?: PlannerDayPrefs;
  onToggleDone: (entryId: string, done: boolean) => void;
  onRemove: (entryId: string) => void;
}

/**
 * The day's plan as a flat list, the fallback for a day whose opening hours are unknown: without
 * them there is no honest axis, neither 00:00–24:00 nor an invented 09:00–18:00. No reordering, as
 * there is no time to drop onto.
 */
export function PlannerTimeline({
  entries,
  day,
  prefs,
  onToggleDone,
  onRemove,
}: PlannerTimelineProps) {
  const t = useTranslations('planner');

  // A keyed lookup rather than a `find` per row.
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
      {/* The count as text for screen readers. */}
      <li className="sr-only" aria-live="polite">
        {t('summary.rides', { count: entries.length })}
      </li>
    </ol>
  );
}
