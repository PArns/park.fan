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
   * The party asked to stay dry and this is a water ride — `partyFlags().wet`.
   *
   * A boolean, decided by the caller, because this row has the plan's entry and
   * not the catalogue's ride: `PlannerEntry` stores a slug and a name, and the
   * two facts the flag is computed from live in the day payload. A FLAG and
   * never a filter — the row is the same row with a mark on it.
   */
  wet?: boolean;
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
 *
 * That one line under the bar carries the reason OR, on a ticked-off ride, how
 * far the queue came in from the forecast. Never both — see `deltaLabel` — so
 * the row's height is the same row it has always been.
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
        : estimate.missing === 'no-source'
          ? t('entry.noSource')
          : null;

  // What the queue cost against what was forecast for it. It takes the line the
  // reason takes, and the two cannot both be there: a delta needs a figure and a
  // forecast, and every `missingLabel` is a state that has neither.
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
          {/* The name and the party's mark are ONE column, so the figure on the
              right keeps its place and the name is what gives way. The strike
              stays on the text alone: a line drawn through the droplet would
              read as the flag itself being crossed out. */}
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
