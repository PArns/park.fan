'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ChevronDown, LayoutList, MapPin, Plus, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { PlannerPark } from '@/lib/planner/types';
import { PlannerDayPicker } from './planner-day-picker';
import type { CalendarDay } from '@/lib/api/types';

interface PlannerColumnHeadProps {
  /** Every park the plan holds, which is what this column may switch between. */
  parks: readonly PlannerPark[];
  parkSlug: string | null;
  date: string | null;
  onPickPark: (parkSlug: string) => void;
  onPickDate: (date: string) => void;
  /** Starts a park this plan does not have yet — the wizard asks all three questions. */
  onNewPark: () => void;
  /**
   * Opens the plan overview from inside the park list. Phone only.
   *
   * The chooser lists the plan's parks; the overview lists its parks AND their
   * days, which is the next question after "which park am I in". They used to
   * be two controls in one row — this one and a chevron beside the day picker
   * — and on a phone that chevron was 44 px of icon against the picker's own
   * `›`, read as a minimize button (PAR-313). So the route moved to where its
   * neighbour already is. Absent on a desktop, where the labelled button in
   * the panel header says „Meine Pläne" in as many words.
   */
  onShowOverview?: () => void;
  /** Absent on the first column: it is the plan's active day and cannot be closed. */
  onClose?: () => void;
  plannedDates?: readonly string[];
  timezone?: string;
  facts?: ReadonlyMap<string, CalendarDay> | null;
  maxDate?: string;
  /**
   * Extra classes for the row, because on a phone this row is not the column's.
   *
   * There the panel draws it in its own `SheetHeader` instead — one row rather
   * than two, see the note on `withHead` in {@link PlannerDayColumn} — and a
   * host that already carries a border and a padding needs this one to carry
   * neither. It is the same element in the same place in the DOM either way,
   * which is what keeps `[data-planner-column-head]` a single answer.
   */
  className?: string;
}

/**
 * What a column says about itself: which park, which day.
 *
 * With one column both questions were answered in the PANEL's header — one park
 * name, one day picker — and that stops working the moment a second column
 * exists, because the header has no way to say which of the two it is talking
 * about. So the pair moves onto the column, where the answer is unambiguous by
 * position, and the panel header keeps only what is about the panel.
 *
 * The day picker is the existing one, unchanged: it already carries the ‹ ›
 * arrows that step a day at a time — the common move, "what if we went Saturday
 * instead" — with the month grid behind the label for the jump that is further
 * than a step. Two columns give that control a second job it did not have: with
 * the same park in both, the arrows are how a second day is put beside the
 * first.
 *
 * The park chooser lists the plan's OWN parks and nothing else. A search over
 * all 212 would be a different control answering a different question — this one
 * is "show me the other park I have already planned", and the wizard at the foot
 * of the list is where a new one comes from, because a park with no day is not
 * a column.
 */
export function PlannerColumnHead({
  parks,
  parkSlug,
  date,
  onPickPark,
  onPickDate,
  onNewPark,
  onShowOverview,
  onClose,
  plannedDates = [],
  timezone,
  facts,
  maxDate,
  className,
}: PlannerColumnHeadProps) {
  const t = useTranslations('planner');
  const [open, setOpen] = useState(false);
  const park = parks.find((entry) => entry.slug === parkSlug) ?? null;

  return (
    <div
      data-planner-column-head=""
      // `planner-phone:py-0`, because everything in this row is 44 px on a phone now
      // and the 2 px that used to give a 28 px control air is 4 px of axis
      // spent on nothing. The row is 32 → 44 px, and those 12 px buy the panel's
      // primary navigation: the park, and the day. Both were 28 px, i.e. under
      // a thumb, in the one control row every visit goes through.
      className={cn(
        'border-border/60 planner-phone:py-0 flex min-w-0 shrink-0 items-center gap-1 border-b px-2 py-1.5',
        className
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            data-planner-column-park=""
            aria-label={t('column.pickPark')}
            // `planner-phone:bg-accent/40`, and it is the fix for "the park
            // button is hard to press" (PAR-313). The target is not the
            // problem: measured at 360 px it is 106 × 44 and `elementFromPoint`
            // answers this button at all 25 points of a 5 × 5 grid over it —
            // nothing overlaps it, and 44 px is the floor. What it has no
            // is a SURFACE. `hover:bg-accent` is the only ground here and a
            // touch screen has no hover, so beside a day picker that carries
            // `bg-accent/40` at rest this reads as the panel's heading rather
            // than as the control that changes the park. Same tint as its
            // neighbour, phone only: a fine pointer gets the hover and the
            // desktop row keeps the two controls it has always had.
            className="hover:bg-accent planner-phone:bg-accent/40 planner-phone:h-11 flex h-7 min-w-0 flex-1 items-center gap-1 rounded-md px-1.5 text-xs font-medium transition-colors"
          >
            <span className="truncate">{park?.name ?? t('column.noPark')}</span>
            <ChevronDown className="size-3 shrink-0 opacity-60" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        {/* Aligned to the column's own edge, so with two columns the list opens
            under the one it belongs to rather than in the middle of the panel.

            `z-[80]` because this list opens INSIDE the sheet, and the sheet is
            `z-[70]`: `PopoverContent`'s own `z-50` puts the portal under it, so
            the list was drawn behind the panel's own frosted glass and every row
            in it was untappable — `elementFromPoint` over the list answered with
            the sheet's content, at 390 px and at 1440 px alike. The two other
            popovers of this panel (the day picker beside this button, the party
            chips) already carry the same number for the same reason; this one
            was the third and did not.

            It was invisible to the check because `die Parkliste ist antippbar`
            OPENS the list and measures the rows it finds: a popper behind the
            sheet has a box, it just cannot be reached. The assertion that
            catches it is a trial click on a ROW, and it is in `check:planner`
            now. */}
        <PopoverContent align="start" className="z-[80] w-56 p-1">
          <ul className="max-h-64 overflow-y-auto">
            {parks.map((entry) => (
              <li key={entry.slug}>
                <button
                  type="button"
                  onClick={() => {
                    onPickPark(entry.slug);
                    setOpen(false);
                  }}
                  className={cn(
                    // A list a 44 px button opens is not allowed to be a list
                    // of 28 px rows: the door and the destination are one
                    // gesture, and this one is a scrolling list of parks where
                    // the wrong pick is a whole panel's worth of undo.
                    'hover:bg-accent planner-phone:min-h-11 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                    entry.slug === parkSlug && 'bg-accent/60'
                  )}
                >
                  <MapPin
                    className="text-muted-foreground/70 size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate">{entry.name}</span>
                  {entry.slug === parkSlug && (
                    <Check className="size-3.5 shrink-0" aria-hidden="true" />
                  )}
                </button>
              </li>
            ))}
          </ul>
          {/* The foot of the list, and its two rows are one pair: this one
              goes to the days that exist, the one below starts a park that does
              not. The border sits on the first of them, so the pair reads as a
              foot rather than as two loose rows — which is why `mt-1 border-t`
              moved off "Park hinzufügen" when this was added. */}
          {onShowOverview && (
            <button
              type="button"
              onClick={() => {
                onShowOverview();
                setOpen(false);
              }}
              data-planner-overview-row=""
              className="hover:bg-accent border-border/60 planner-phone:min-h-11 mt-1 flex w-full items-center gap-2 rounded-md border-t px-2 py-1.5 text-left text-xs transition-colors"
            >
              <LayoutList className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{t('plans.title')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onNewPark();
              setOpen(false);
            }}
            className={cn(
              'hover:bg-accent border-border/60 planner-phone:min-h-11 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
              !onShowOverview && 'mt-1 border-t'
            )}
          >
            <Plus className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{t('column.addPark')}</span>
          </button>
        </PopoverContent>
      </Popover>

      {date && (
        <PlannerDayPicker
          value={date}
          onChange={onPickDate}
          plannedDates={plannedDates}
          timezone={timezone}
          facts={facts}
          maxDate={maxDate}
        />
      )}

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          data-planner-column-close=""
          aria-label={t('column.close')}
          title={t('column.close')}
          className="text-muted-foreground hover:text-foreground hover:bg-accent planner-phone:size-11 flex size-7 shrink-0 items-center justify-center rounded-md transition-colors"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
