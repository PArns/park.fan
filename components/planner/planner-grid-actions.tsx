'use client';

import { useTranslations } from 'next-intl';
import { Check, ChevronDown, ChevronUp, Minus, Plus, Trash2, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatGridTime } from '@/lib/planner/park-time';
import { SNAP_MIN_FINE } from '@/lib/planner/day-grid';
import {
  MAX_CUSTOM_LABEL_LENGTH,
  PLANNER_BLOCK_ICONS,
  type PlannerCustomBlock,
  type PlannerEntry,
} from '@/lib/planner/types';
import { PLANNER_BLOCK_ICON_COMPONENTS } from './planner-block-icons';
import { actualVsEstimate, estimateFor, isAssumedWait } from '@/lib/planner/estimate';
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
  /**
   * Move the block by a signed number of minutes, the one way to move it without a gesture.
   * {@link PlannerDayColumn} clamps it with the same `clampStart` and `rideFloor` the drag uses.
   */
  onNudge?: (entryId: string, deltaMinutes: number) => void;
  /**
   * A drag is running on this block, so the bar gets out of the way: it is opaque, lies over the
   * grid's lower edge, and prints the figure the drag is replacing.
   */
  standBack?: boolean;
}

/**
 * What one press of the move buttons is worth: the quarter hour, not the drag's five minutes. A
 * press names a distance, and six presses for half an hour is too many.
 */
const NUDGE_MIN = SNAP_MIN_FINE;

/**
 * Every icon button in the bar, one class: 32 px on a fine pointer and 44 px on a coarse one, the
 * floor `check:planner` sweeps for. `planner-phone:`, because a landscape phone is still a finger.
 */
const ICON_BUTTON =
  'text-muted-foreground hover:bg-accent hover:text-foreground planner-phone:size-11 flex size-8 shrink-0 items-center justify-center rounded-md transition-colors';

/**
 * The actions for the selected block, docked under the grid rather than on the block: a block can
 * be twenty pixels tall, and growing it to fit 44 px targets would make it lie about its duration.
 * `absolute`, so it never resizes the grid's scroll box.
 */
export function PlannerGridActions({
  entry,
  day = null,
  onToggleDone,
  onRemove,
  onClose,
  onEditCustom: onEditCustomProp,
  onNudge: onNudgeProp,
  standBack = false,
}: PlannerGridActionsProps) {
  const t = useTranslations('planner');
  if (!entry) return null;

  // A show is bound to its performance: no nudge, no name or length to edit.
  const bound = Boolean(entry.showSlug);
  const onEditCustom = bound ? undefined : onEditCustomProp;
  const onNudge = bound ? undefined : onNudgeProp;

  const done = Boolean(entry.done);
  const custom = entry.custom ?? null;
  const estimate = estimateFor(day, entry);
  // Ticked off, the figure is the one that happened. The difference from the forecast is one
  // statement and what a tick is for; the bare forecast beside it would be a second figure.
  const actual = done ? (entry.actualWait ?? null) : null;
  const delta = actualVsEstimate(entry, estimate);
  const deltaLabel = !delta
    ? null
    : delta.direction === 'same'
      ? t('entry.deltaAsEstimated')
      : t(delta.direction === 'over' ? 'entry.deltaOver' : 'entry.deltaUnder', {
          minutes: Math.abs(delta.minutes),
        });

  const CurrentIcon = custom ? PLANNER_BLOCK_ICON_COMPONENTS[custom.icon] : null;

  return (
    /* One size system and one gap for every button: `size-8`, `gap-1` within a group and `gap-2`
       between groups, 44 px on a coarse pointer. Seven icons became one dropdown, the change that
       buys real width. On a phone the name and the deselect share the first line and the controls
       the second, which `check:planner` holds under 110 px. */
    <div
      data-planner-grid-actions=""
      className={cn(
        'border-border/60 bg-background/95 absolute inset-x-0 bottom-0 z-40 flex flex-wrap items-center gap-x-2 gap-y-1 border-t px-3 py-1.5 backdrop-blur-sm',
        // Gone for the length of the drag rather than faded, or the old figure stays readable
        // beside the new one. `invisible` also removes it from hit-testing and the accessibility
        // tree.
        standBack && 'invisible'
      )}
    >
      <div className="min-w-0 flex-1">
        {custom && onEditCustom ? (
          <input
            value={custom.label}
            onChange={(event) => onEditCustom(entry.id, { label: event.target.value })}
            aria-label={t('custom.label')}
            maxLength={MAX_CUSTOM_LABEL_LENGTH}
            className="focus:bg-accent/50 w-full truncate rounded-sm bg-transparent text-sm outline-none"
          />
        ) : (
          <p className={cn('truncate text-sm', done && 'line-through')}>{entry.attractionName}</p>
        )}
        {/* The block's own figure, which a short block cannot carry. Three different claims: `~` is
            an assumed five minutes, `±` is the model's spread on this prediction, and the typical
            error is a labelled statement about the model, never a range around the figure. Rounded
            to the minute. */}
        <p className="text-muted-foreground flex flex-wrap items-baseline gap-x-1.5 font-mono text-[11px] tabular-nums">
          <span>{formatGridTime(entry.startMinute)}</span>
          {custom && <span>· {t('custom.duration', { minutes: custom.durationMinutes })}</span>}
          {actual !== null && (
            <span className="text-foreground">· {t('entry.actual', { minutes: actual })}</span>
          )}
          {actual === null && estimate.wait !== null && (
            <span className="text-foreground">
              · {isAssumedWait(estimate) && '~'}
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
          {/* The difference from the forecast on a ticked-off block: one fact instead of two
              figures for one queue. This bar is the one surface that can carry it on every ticked
              entry. */}
          {deltaLabel && <span className="font-sans">{deltaLabel}</span>}
        </p>
      </div>

      {/* The controls, one group per verb; on a phone the bar's second line, spread across it.
          `order-2` because the deselect "×" is last in the DOM, for the keyboard, but belongs on
          the first line of a phone's bar. */}
      <div className="planner-phone:order-2 planner-phone:basis-full planner-phone:justify-between flex shrink-0 items-center gap-2">
        {/* Move, for every entry: on a phone the grip is the only pointer path, so the day may not
            depend on a gesture landing. The same write as a drag (`moveEntry`); up is earlier. */}
        {onNudge && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onNudge(entry.id, -NUDGE_MIN)}
              aria-label={t('entry.earlier', { minutes: NUDGE_MIN })}
              title={t('entry.earlier', { minutes: NUDGE_MIN })}
              className={ICON_BUTTON}
            >
              <ChevronUp className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onNudge(entry.id, NUDGE_MIN)}
              aria-label={t('entry.later', { minutes: NUDGE_MIN })}
              title={t('entry.later', { minutes: NUDGE_MIN })}
              className={ICON_BUTTON}
            >
              <ChevronDown className="size-4" />
            </button>
          </div>
        )}

        {/* Icon and duration, free blocks only: the touch and keyboard path, and the only way to
            change the icon. A dropdown, because seven 44 px icon buttons fill a phone's line. */}
        {custom && onEditCustom && CurrentIcon && (
          <div className="flex items-center gap-1">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                aria-label={t('custom.iconPick', { icon: t(`custom.icon.${custom.icon}`) })}
                title={t('custom.iconPick', { icon: t(`custom.icon.${custom.icon}`) })}
                data-planner-block-icon-pick=""
                className="text-foreground hover:bg-accent data-[state=open]:bg-accent planner-phone:h-11 planner-phone:min-w-11 flex h-8 items-center justify-center gap-0.5 rounded-md px-1.5 transition-colors"
              >
                <CurrentIcon className="size-4" aria-hidden="true" />
                <ChevronDown className="text-muted-foreground size-3" aria-hidden="true" />
              </DropdownMenuTrigger>
              {/* `z-[80]`, above the sheet's `z-[70]`: the menu is portalled to `<body>`. */}
              <DropdownMenuContent align="start" side="top" className="z-[80] min-w-44">
                {PLANNER_BLOCK_ICONS.map((key) => {
                  const Icon = PLANNER_BLOCK_ICON_COMPONENTS[key];
                  const active = custom.icon === key;
                  return (
                    <DropdownMenuItem
                      key={key}
                      onSelect={() => onEditCustom(entry.id, { icon: key })}
                      aria-current={active ? 'true' : undefined}
                      className={cn('planner-phone:min-h-11', active && 'bg-accent/60')}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      <span className="flex-1">{t(`custom.icon.${key}`)}</span>
                      {active && <Check className="size-3.5" aria-hidden="true" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              type="button"
              onClick={() =>
                onEditCustom(entry.id, { durationMinutes: custom.durationMinutes - 15 })
              }
              aria-label={t('custom.shorter')}
              title={t('custom.shorter')}
              className={ICON_BUTTON}
            >
              <Minus className="size-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                onEditCustom(entry.id, { durationMinutes: custom.durationMinutes + 15 })
              }
              aria-label={t('custom.longer')}
              title={t('custom.longer')}
              className={ICON_BUTTON}
            >
              <Plus className="size-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1">
          {!custom && (
            <button
              type="button"
              onClick={() => onToggleDone(entry.id, !done)}
              aria-pressed={done}
              aria-label={done ? t('entry.markUndone') : t('entry.markDone')}
              title={done ? t('entry.markUndone') : t('entry.markDone')}
              className={cn(
                ICON_BUTTON,
                done && 'bg-crowd-low/25 text-crowd-low hover:bg-crowd-low/30 hover:text-crowd-low'
              )}
            >
              <Check className="size-4" />
            </button>
          )}
          {/* Delete, on every size; the block's corner ✕ stays as a shortcut. A bin, not an "×":
              the "×" at the end of this bar only lets go of the selection. */}
          <button
            type="button"
            onClick={() => onRemove(entry.id)}
            aria-label={t('removeRide')}
            title={t('removeRide')}
            data-planner-grid-remove=""
            className={cn(ICON_BUTTON, 'hover:bg-destructive/15 hover:text-destructive')}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label={t('close')}
        title={t('close')}
        data-planner-grid-deselect=""
        className={cn(ICON_BUTTON, 'planner-phone:order-1 shrink-0')}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
