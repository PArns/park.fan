'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ChevronDown, MapPin, Plus, X } from 'lucide-react';
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
  /** Absent on the first column: it is the plan's active day and cannot be closed. */
  onClose?: () => void;
  plannedDates?: readonly string[];
  timezone?: string;
  facts?: ReadonlyMap<string, CalendarDay> | null;
  maxDate?: string;
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
  onClose,
  plannedDates = [],
  timezone,
  facts,
  maxDate,
}: PlannerColumnHeadProps) {
  const t = useTranslations('planner');
  const [open, setOpen] = useState(false);
  const park = parks.find((entry) => entry.slug === parkSlug) ?? null;

  return (
    <div
      data-planner-column-head=""
      className="border-border/60 flex min-w-0 shrink-0 items-center gap-1 border-b px-2 py-1.5"
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            data-planner-column-park=""
            aria-label={t('column.pickPark')}
            className="hover:bg-accent flex h-7 min-w-0 flex-1 items-center gap-1 rounded-md px-1.5 text-xs font-medium transition-colors"
          >
            <span className="truncate">{park?.name ?? t('column.noPark')}</span>
            <ChevronDown className="size-3 shrink-0 opacity-60" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        {/* Aligned to the column's own edge, so with two columns the list opens
            under the one it belongs to rather than in the middle of the panel. */}
        <PopoverContent align="start" className="w-56 p-1">
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
                    'hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
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
          <button
            type="button"
            onClick={() => {
              onNewPark();
              setOpen(false);
            }}
            className="hover:bg-accent border-border/60 mt-1 flex w-full items-center gap-2 rounded-md border-t px-2 py-1.5 text-left text-xs transition-colors"
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
          className="text-muted-foreground hover:text-foreground hover:bg-accent flex size-7 shrink-0 items-center justify-center rounded-md transition-colors"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
