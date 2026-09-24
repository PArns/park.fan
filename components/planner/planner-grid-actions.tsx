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
  PLANNER_BLOCK_ICONS,
  type PlannerCustomBlock,
  type PlannerEntry,
} from '@/lib/planner/types';
import { PLANNER_BLOCK_ICON_COMPONENTS } from './planner-block-icons';
import { actualVsEstimate, estimateFor } from '@/lib/planner/estimate';
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
   * Move the block by a signed number of minutes, clamped by the caller.
   *
   * The second way to move a block, and the only one that is not a gesture. The
   * caller clamps because the caller has the axis: {@link PlannerDayColumn} runs
   * the same `clampStart` against the same `rideFloor` the drag does, so the two
   * paths cannot disagree about where a block may go.
   */
  onNudge?: (entryId: string, deltaMinutes: number) => void;
  /**
   * A drag is running on this block, so the bar takes itself out of the way.
   *
   * Not a styling preference: it is opaque, it lies over the grid's lower edge,
   * and the figure it prints is the one the drag is in the middle of replacing.
   * The caller's comment carries the measurement.
   */
  standBack?: boolean;
}

/**
 * What one press of the move buttons is worth.
 *
 * {@link SNAP_MIN_FINE}, and deliberately NOT the step the drag uses on the
 * device this control exists for: a coarse pointer commits on
 * `SNAP_MIN_COARSE`, half an hour, because fifteen minutes under a finger
 * that is sliding reads as jitter rather than as a choice. A press is not
 * sliding. It lands on the minute it names, so it takes the granularity every
 * other start in this app sits on, and the two are different for a reason rather
 * than by omission.
 */
const NUDGE_MIN = SNAP_MIN_FINE;

/**
 * Every icon button in the bar, one class (PAR-326).
 *
 * 32 px on a fine pointer and 44 on a coarse one, which is the floor
 * `check:planner` sweeps the sheet for. `planner-phone:` rather than `max-sm:`
 * for the reason the rest of the sheet gives: a landscape phone is 844 px wide
 * and still a finger.
 */
const ICON_BUTTON =
  'text-muted-foreground hover:bg-accent hover:text-foreground planner-phone:size-11 flex size-8 shrink-0 items-center justify-center rounded-md transition-colors';

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
  onNudge,
  standBack = false,
}: PlannerGridActionsProps) {
  const t = useTranslations('planner');
  if (!entry) return null;

  const done = Boolean(entry.done);
  const custom = entry.custom ?? null;
  const estimate = estimateFor(day, entry);
  // Ticked off, the figure that matters is the one that HAPPENED. `actualWait`
  // is what the visitor recorded by ticking; the forecast beside it would be
  // this panel arguing with a measurement. The DIFFERENCE between the two is
  // not that argument — it is one statement, and it is what a tick is for.
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
    /* One size system and one gap for every button in the bar (PAR-326), and
       two lines on a phone instead of four (PAR-482).

       The bar used to mix `size-9` (moves, tick, delete), `size-7` (seven icon
       buttons, the two durations) and a bare padded "×", with no gap inside
       the pairs, so neighbouring targets touched. On a phone every one of them
       grew to 44 px and the row wrapped the way it happened to: the name, then
       the two moves, then seven icons, then the durations and the "×" — about
       200 px, docked over a scroller that is not much taller, so the selected
       block sat underneath the bar that was meant to act on it.

       Now: every icon button is `size-8` with `gap-1` inside a group and
       `gap-2` between groups, and 44 px where the pointer is coarse. The seven
       icon buttons became one dropdown, the only change that buys real width,
       and delete is a bin rather than a second "×" beside the deselect "×". On
       a phone the name and the deselect share the first line and the controls
       the second, spread over the width — 105 px at 390 px with a ride
       selected, which `check:planner` holds under 110. */
    <div
      data-planner-grid-actions=""
      className={cn(
        'border-border/60 bg-background/95 absolute inset-x-0 bottom-0 z-40 flex flex-wrap items-center gap-x-2 gap-y-1 border-t px-3 py-1.5 backdrop-blur-sm',
        // Gone for the length of the drag, and gone rather than faded: at any
        // opacity above zero the old figure is still readable beside the new
        // one, and that is half of what this is for. `invisible` also takes it
        // out of hit-testing and out of the accessibility tree, so the finger
        // holding a block cannot land on a button under it. It keeps its box,
        // which costs nothing: the bar is `absolute` and the grid's scroll
        // height never depended on it.
        standBack && 'invisible'
      )}
    >
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
          {/* The difference, on a ticked-off block. It is the one thing about the
              forecast that still belongs here: the bare forecast beside a
              measurement would be two figures for one queue, and a visitor
              cannot tell from that which of them happened. How far the
              measurement landed from it is a single fact, and it is the whole
              reason for ticking a ride off.
              A block can be twenty pixels tall, so this bar is the only surface
              in the grid that can carry it on every ticked entry — the block's
              own annotation line needs 68 px. */}
          {deltaLabel && <span className="font-sans">{deltaLabel}</span>}
        </p>
      </div>

      {/* The controls. One group per verb, and on a phone the whole set is the
          bar's second line (`basis-full`), spread across it so a thumb does not
          have to aim into one corner. `order-2` because the deselect "×" is
          last in the DOM — where a keyboard reaches it after the controls, as
          on the desktop — but belongs on the first line of a phone's bar. */}
      <div className="planner-phone:order-2 planner-phone:basis-full planner-phone:justify-between flex shrink-0 items-center gap-2">
        {/* Move, and it is for EVERY entry rather than for free blocks only.
            Dragging is one gesture on one 44 px strip of a box whose height is a
            queue, and on a phone that strip is the only pointer path there is —
            so the day depended on a gesture landing. These two buttons are the
            same write (`moveEntry`, through the caller's clamp), reachable with a
            thumb, and they say what they do: up is earlier, down is later, which
            is the axis's own direction and not a description of this row. */}
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

        {/* Icon and duration, for a free block only. The pointer path is the
            bottom edge of the block; these are the touch and keyboard path, and
            the only way to change the icon at all.

            The icon is a dropdown and not seven buttons. Seven 44 px targets
            are 320 px, which is a whole line of a phone's bar on their own, for
            a choice somebody makes once per block. The trigger shows the icon
            the block has, so the bar still says what it is set to. */}
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
              {/* `z-[80]`, above the sheet's `z-[70]` — the menu is portalled to
                  `<body>` like the day picker's popover and has the same need. */}
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
          {/* Delete, on every size again (PAR-482). PAR-313 moved it off the
              phone's bar onto the block's own corner ✕, because a four-line bar
              could be a screen away from the block it named. The bar is two
              lines now and the block is scrolled clear of it on selection (see
              `PlannerDayColumn`), and the corner ✕ is a 20 px glyph on a block
              that may be 20 px tall — so the bar carries the named, full-size
              delete, and the corner ✕ stays as the shortcut it was. A bin, not
              an "×": the "×" at the end of this bar only lets go of the
              selection, and two identical marks for "remove the ride" and
              "close this bar" is how the wrong one gets pressed. */}
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
