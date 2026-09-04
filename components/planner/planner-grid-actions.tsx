'use client';

import { useTranslations } from 'next-intl';
import { Check, Minus, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatGridTime } from '@/lib/planner/park-time';
import {
  PLANNER_BLOCK_ICONS,
  type PlannerCustomBlock,
  type PlannerEntry,
} from '@/lib/planner/types';
import { PLANNER_BLOCK_ICON_COMPONENTS } from './planner-block-icons';
import { estimateFor } from '@/lib/planner/estimate';
import type { PlanDay } from '@/lib/api/types';

interface PlannerGridActionsProps {
  entry: PlannerEntry | null;
  /** The day this block sits in, for the figure the bar states. */
  day?: PlanDay | null;
  onToggleDone: (entryId: string, done: boolean) => void;
  onRemove: (entryId: string) => void;
  onClose: () => void;
  /** Free blocks only: rename, re-icon, or set the duration without dragging. */
  onEditCustom?: (entryId: string, patch: Partial<PlannerCustomBlock>) => void;
}

/**
 * Tick-off and remove for the selected block.
 *
 * They are not on the block, and that is forced rather than chosen: a block can
 * legitimately be twenty pixels tall, and two 44 px targets do not fit in twenty
 * pixels. Forcing a `min-h-11` on the block instead would make the box lie about
 * the duration, which is the one thing this view may not do. So tapping selects
 * and the actions dock here.
 *
 * `absolute`, so it costs no layout at all and cannot resize the grid's scroll
 * box — the only arrangement in which the 44 px touch tier and an honest 20 px
 * block can both hold.
 */
export function PlannerGridActions({
  entry,
  day = null,
  onToggleDone,
  onRemove,
  onClose,
  onEditCustom,
}: PlannerGridActionsProps) {
  const t = useTranslations('planner');
  if (!entry) return null;

  const done = Boolean(entry.done);
  const custom = entry.custom ?? null;
  const estimate = estimateFor(day, entry);
  // Ticked off, the figure that matters is the one that HAPPENED. `actualWait`
  // is what the visitor recorded by ticking; the forecast beside it would be
  // this panel arguing with a measurement.
  const actual = done ? (entry.actualWait ?? null) : null;

  return (
    <div className="border-border/60 bg-background/95 absolute inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t px-3 py-1.5 backdrop-blur-sm">
      <div className="min-w-0 flex-1">
        {custom && onEditCustom ? (
          <input
            value={custom.label}
            onChange={(event) => onEditCustom(entry.id, { label: event.target.value })}
            aria-label={t('custom.label')}
            maxLength={60}
            className="focus:bg-accent/50 w-full truncate rounded-sm bg-transparent text-sm outline-none"
          />
        ) : (
          <p className={cn('truncate text-sm', done && 'line-through')}>{entry.attractionName}</p>
        )}
        {/* What the bar is FOR, beside the two buttons: the block's own figure.
            A selected block is the one a visitor is deciding about, and until
            now this row said only when it starts — the wait was on the block
            itself, which at twenty pixels is exactly the block that cannot
            carry it.

            Three things, and they are three different claims. `~` marks an
            assumed five minutes, never a forecast. `±` is the MODEL's own
            spread on this prediction. The typical error is how far its
            predictions have landed from the days that then happened, which is
            a statement about the model rather than about today — so it is
            labelled, and it is never turned into a range around the figure,
            because half the days fall outside it. Rounded to the minute: the
            API answers 13.5, and a tenth of a minute on a figure whose own
            point is that it is approximate reads as precision nobody has. */}
        <p className="text-muted-foreground flex flex-wrap items-baseline gap-x-1.5 font-mono text-[11px] tabular-nums">
          <span>{formatGridTime(entry.startMinute)}</span>
          {custom && <span>· {t('custom.duration', { minutes: custom.durationMinutes })}</span>}
          {actual !== null && (
            <span className="text-foreground">· {t('entry.actual', { minutes: actual })}</span>
          )}
          {actual === null && estimate.wait !== null && (
            <span className="text-foreground">
              · {estimate.missing === 'assumed' && '~'}
              {estimate.wait} {t('unit.min')}
            </span>
          )}
          {actual === null && estimate.uncertaintyMinutes !== null && (
            <span title={t('entry.bandHint')}>
              {t('band.plusMinus', { minutes: estimate.uncertaintyMinutes })}
            </span>
          )}
          {actual === null && estimate.expectedError !== null && (
            <span className="font-sans" title={t('entry.typicalErrorHint')}>
              {t('entry.typicalError', { minutes: Math.round(estimate.expectedError) })}
            </span>
          )}
        </p>
      </div>

      {/* Icon and duration, for a free block only. The pointer path is the
          bottom edge of the block; these are the touch and keyboard path, and
          the only way to change the icon at all. */}
      {custom && onEditCustom && (
        <>
          <div className="flex shrink-0 items-center gap-0.5">
            {PLANNER_BLOCK_ICONS.map((key) => {
              const Icon = PLANNER_BLOCK_ICON_COMPONENTS[key];
              const active = custom.icon === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onEditCustom(entry.id, { icon: key })}
                  aria-label={t(`custom.icon.${key}`)}
                  aria-pressed={active}
                  className={cn(
                    'flex size-7 items-center justify-center rounded-md transition-colors max-sm:size-9',
                    active
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground/50 hover:bg-accent/60 hover:text-foreground'
                  )}
                >
                  <Icon className="size-3.5" />
                </button>
              );
            })}
          </div>
          <div className="flex shrink-0 items-center">
            <button
              type="button"
              onClick={() =>
                onEditCustom(entry.id, { durationMinutes: custom.durationMinutes - 15 })
              }
              aria-label={t('custom.shorter')}
              className="text-muted-foreground/60 hover:bg-accent hover:text-foreground flex size-7 items-center justify-center rounded-md transition-colors max-sm:size-9"
            >
              <Minus className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() =>
                onEditCustom(entry.id, { durationMinutes: custom.durationMinutes + 15 })
              }
              aria-label={t('custom.longer')}
              className="text-muted-foreground/60 hover:bg-accent hover:text-foreground flex size-7 items-center justify-center rounded-md transition-colors max-sm:size-9"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </>
      )}

      {!custom && (
        <button
          type="button"
          onClick={() => onToggleDone(entry.id, !done)}
          aria-pressed={done}
          aria-label={done ? t('entry.markUndone') : t('entry.markDone')}
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-md transition-colors max-sm:size-11',
            done
              ? 'bg-crowd-low/25 text-crowd-low'
              : 'text-muted-foreground/60 hover:bg-accent hover:text-foreground'
          )}
        >
          <Check className="size-4" />
        </button>
      )}
      <button
        type="button"
        onClick={() => onRemove(entry.id)}
        aria-label={t('removeRide')}
        className="text-muted-foreground/40 hover:bg-destructive/15 hover:text-destructive flex size-9 shrink-0 items-center justify-center rounded-md transition-colors max-sm:size-11"
      >
        <X className="size-4" />
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label={t('close')}
        className="text-muted-foreground/40 hover:text-foreground shrink-0 px-1 text-xs"
      >
        ×
      </button>
    </div>
  );
}
