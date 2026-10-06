'use client';

import { useTranslations } from 'next-intl';
import { Check, Droplets, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlannerBar } from './planner-bar';
import { formatGridTime } from '@/lib/planner/park-time';
import type { PlannerEntry } from '@/lib/planner/types';
import { actualVsEstimate, type PlannerEstimate } from '@/lib/planner/estimate';
import type { PlanDayTier } from '@/lib/api/types';

interface PlannerEntryRowProps {
  entry: PlannerEntry;
  estimate: PlannerEstimate;
  scale: number;
  tier: PlanDayTier;
  /** Whether the band may carry a figure — see `bandCarriesFigure`. */
  showBandFigure: boolean;
  /**
   * The party asked to stay dry and this is a water ride (`partyFlags().wet`), decided by the
   * caller, which has the day payload. A flag, never a filter.
   */
  wet?: boolean;
  onToggleDone: () => void;
  onRemove: () => void;
}

/**
 * One planned ride, in a fixed 56 px row, so the list does not shift under a dragging finger when
 * data arrives. The line under the bar names why a figure is missing, or on a ticked-off ride how
 * far the queue came in from the forecast, never both.
 */
export function PlannerEntryRow({
  entry,
  estimate,
  scale,
  tier,
  showBandFigure,
  wet = false,
  onToggleDone,
  onRemove,
}: PlannerEntryRowProps) {
  const t = useTranslations('planner');
  // `common` is in the layout's set on every route, so this costs no chunk.
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
        : estimate.missing === 'no-source'
          ? t('entry.noSource')
          : null;

  // What the queue cost against the forecast. It shares the reason's line: a delta needs a figure,
  // and every `missingLabel` state has none.
  const delta = actualVsEstimate(entry, estimate);
  const deltaLabel = !delta
    ? null
    : delta.direction === 'same'
      ? t('entry.deltaAsEstimated')
      : t(delta.direction === 'over' ? 'entry.deltaOver' : 'entry.deltaUnder', {
          minutes: Math.abs(delta.minutes),
        });

  return (
    <li
      data-planner-entry={entry.id}
      className={cn(
        'group relative flex h-14 items-center gap-2 rounded-lg px-2 transition',
        done && 'opacity-70'
      )}
    >
      <time className="text-muted-foreground w-11 shrink-0 font-mono text-xs tabular-nums">
        {formatGridTime(entry.startMinute)}
      </time>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          {/* Name and the party's mark are one column, so the name gives way and the figure keeps
              its place. The strike is on the text alone, not through the droplet. */}
          <span className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className={cn('truncate text-sm', done && 'line-through')}>
              {entry.attractionName}
            </span>
            {wet && (
              <Droplets
                className="text-crowd-moderate size-3 shrink-0"
                aria-label={t('party.wet')}
              />
            )}
          </span>
          {/* The `aria-label` says whether the number is a prediction or a record, which only the
              strike and the bar's tone show, and neither reaches a screen reader. */}
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

        {/* No figure, no bar: an empty track beside an em dash reads as a bar at zero. */}
        {figure !== null && (
          <div className="mt-1 flex items-center gap-2">
            <PlannerBar
              wait={done ? (entry.actualWait ?? null) : estimate.wait}
              uncertaintyMinutes={done ? null : estimate.uncertaintyMinutes}
              scale={scale}
              tier={tier}
              done={done}
            />
            {/* The band's figure only where it is measured; past that the soft edge alone. */}
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

        {deltaLabel && (
          <p className="text-muted-foreground mt-0.5 truncate text-[11px]">{deltaLabel}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={onToggleDone}
          aria-pressed={done}
          aria-label={done ? t('entry.markUndone') : t('entry.markDone')}
          className={cn(
            'planner-phone:size-11 flex size-8 items-center justify-center rounded-md transition-colors',
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
          className="text-muted-foreground/40 hover:bg-destructive/15 hover:text-destructive planner-phone:size-11 flex size-8 items-center justify-center rounded-md transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>
    </li>
  );
}
