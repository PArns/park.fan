'use client';

import { useTranslations } from 'next-intl';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlannerBar } from './planner-bar';
import { formatGridTime } from '@/lib/planner/park-time';
import type { PlannerEntry } from '@/lib/planner/types';
import type { PlannerEstimate } from '@/lib/planner/estimate';
import type { PlanDayTier } from '@/lib/api/types';

interface PlannerEntryRowProps {
  entry: PlannerEntry;
  estimate: PlannerEstimate;
  scale: number;
  tier: PlanDayTier;
  /** Whether the band may carry a figure — see `bandCarriesFigure`. */
  showBandFigure: boolean;
  onToggleDone: () => void;
  onRemove: () => void;
}

/**
 * One planned ride.
 *
 * The row is a fixed 56 px whatever it contains — a bar, an em dash, or a reason
 * there is no figure. This panel lives in the layout and is on every page, so a
 * row that grows when its data arrives would shift the list under a finger that
 * is dragging it.
 *
 * The reason a figure is missing is shown, not swallowed. "Outside the park's
 * hours" and "we have never measured this ride's day" are different things to
 * tell someone, and both are better than a blank where a number should be.
 */
export function PlannerEntryRow({
  entry,
  estimate,
  scale,
  tier,
  showBandFigure,
  onToggleDone,
  onRemove,
}: PlannerEntryRowProps) {
  const t = useTranslations('planner');
  // `common` is in the layout set on every route, so this costs no chunk.
  const tCommon = useTranslations('common');
  const done = Boolean(entry.done);

  const figure = done
    ? typeof entry.actualWait === 'number'
      ? `${entry.actualWait}`
      : null
    : estimate.wait !== null
      ? `${estimate.wait}`
      : null;

  const missingLabel =
    estimate.missing === 'outside-hours'
      ? t('day.closed')
      : estimate.missing === 'no-curve'
        ? t('entry.noCurve')
        : null;

  return (
    <li
      data-planner-entry={entry.id}
      className={cn(
        'group relative flex h-14 items-center gap-2 rounded-lg px-2 transition-colors',
        done && 'opacity-70'
      )}
    >
      <time className="text-muted-foreground w-11 shrink-0 font-mono text-xs tabular-nums">
        {formatGridTime(entry.startMinute)}
      </time>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={cn('truncate text-sm', done && 'line-through')}>
            {entry.attractionName}
          </span>
          {/* The number alone does not say whether it is a prediction or a
              record — the strikethrough and the bar's tone carry that visually,
              and neither reaches a screen reader. */}
          <span
            className="shrink-0 text-right font-mono text-sm tabular-nums"
            aria-label={
              figure === null
                ? undefined
                : done
                  ? t('entry.actual', { minutes: figure })
                  : t('entry.expected')
            }
          >
            {figure ?? <span className="text-muted-foreground">—</span>}
            {figure && (
              <span className="text-muted-foreground ml-0.5 text-xs">{tCommon('minuteShort')}</span>
            )}
          </span>
        </div>

        {/* No figure, no bar. An empty track beside an em dash reads as a bar at
            zero — the one thing this row must never say. The reason line below
            takes the space instead. */}
        {figure !== null && (
          <div className="mt-1 flex items-center gap-2">
            <PlannerBar
              wait={done ? (entry.actualWait ?? null) : estimate.wait}
              uncertaintyMinutes={done ? null : estimate.uncertaintyMinutes}
              scale={scale}
              tier={tier}
              done={done}
            />
            {/* The figure for the band appears only where it is measured. Past
              that, the bar's soft edge carries the uncertainty and no number
              is attached to it. */}
            {!done && showBandFigure && estimate.uncertaintyMinutes !== null && (
              <span className="text-muted-foreground shrink-0 font-mono text-[10px] tabular-nums">
                {t('band.plusMinus', { minutes: estimate.uncertaintyMinutes })}
              </span>
            )}
          </div>
        )}

        {missingLabel && (
          <p className="text-muted-foreground mt-0.5 truncate text-[11px]">{missingLabel}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={onToggleDone}
          aria-pressed={done}
          aria-label={done ? t('entry.markUndone') : t('entry.markDone')}
          className={cn(
            'flex size-8 items-center justify-center rounded-md transition-colors max-sm:size-11',
            done
              ? 'bg-crowd-low/25 text-crowd-low'
              : 'text-muted-foreground/60 hover:bg-accent hover:text-foreground'
          )}
        >
          <Check className="size-4" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={t('removeRide')}
          className="text-muted-foreground/40 hover:bg-destructive/15 hover:text-destructive flex size-8 items-center justify-center rounded-md transition-colors max-sm:size-11"
        >
          <X className="size-4" />
        </button>
      </div>
    </li>
  );
}
