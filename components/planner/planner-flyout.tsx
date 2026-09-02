'use client';

import { useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarPlus, ChevronDown } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PlannerContextBand, type PlannerDayState } from './planner-context-band';
import { PlannerDayPicker } from './planner-day-picker';
import { PlannerTimeline } from './planner-timeline';
import { PlannerDayGrid } from './planner-day-grid';
import { PlannerRideSearch } from './planner-ride-search';
import { PlannerOverview } from './planner-overview';
import { usePlanner } from '@/lib/planner/use-planner';
import { usePlanDay } from '@/lib/hooks/use-plan-day';
import { totalsFor } from '@/lib/planner/estimate';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { formatShortDuration } from '@/lib/utils/duration';
import { buildDayGrid } from '@/lib/planner/day-grid';
import { parkToday } from '@/lib/planner/park-time';
import { cn } from '@/lib/utils';

interface PlannerFlyoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The planner panel.
 *
 * A right-hand sheet on a desktop and a bottom sheet on a phone, which is the
 * same component with a different `side` — the content is a column either way,
 * and the two differ in where they come from rather than in what they are.
 *
 * The scroll belongs to the list, never to `SheetContent`: that element is the
 * positioned ancestor of the close button, so scrolling it takes the close
 * button off screen. `components/ui/sheet.tsx` says so at the button, and the
 * burger menu solves it the same way.
 */
export function PlannerFlyout({ open, onOpenChange }: PlannerFlyoutProps) {
  const t = useTranslations('planner');
  const locale = useLocale();
  const {
    activeParkSlug,
    activeDate,
    activeEntries,
    state,
    setDone,
    removeRide,
    setActive,
    clearDay,
    moveRide,
    shiftFrom,
  } = usePlanner();

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Which of the two things the panel is: one day, or everything planned. It
  // resets on close rather than persisting, because the day is what the panel is
  // FOR — reopening it into a list of dates would make the common case a step
  // longer for the sake of the rare one. Reset in the close handler rather than
  // in an effect on `open`: the state change belongs to the event that caused it.
  const [showOverview, setShowOverview] = useState(false);
  const handleOpenChange = (next: boolean) => {
    if (!next) setShowOverview(false);
    onOpenChange(next);
  };

  const isPhone = useMediaQuery('(max-width: 639px)');
  const park = activeParkSlug ? state.parks[activeParkSlug] : null;

  const {
    data: day,
    isFetching,
    isError,
  } = usePlanDay({
    continent: park?.geo.continent ?? '',
    country: park?.geo.country ?? '',
    city: park?.geo.city ?? '',
    parkSlug: activeParkSlug ?? '',
    date: activeDate ?? undefined,
    enabled: open && Boolean(park && activeDate),
  });

  // Four states, keyed off `isFetching` rather than `isPending`: a disabled query
  // is pending forever, so with no park picked yet the band would pulse without a
  // request ever having been made. `isFetching && !day` also keeps a background
  // refetch from throwing the band back to a skeleton it has already left.
  const dayState: PlannerDayState = isError
    ? 'error'
    : isFetching && !day
      ? 'loading'
      : day
        ? 'ready'
        : 'empty';

  const totals = totalsFor(day ?? null, activeEntries);

  // The axis, or null when the park's hours are unknown — in which case there is
  // no honest grid to draw and the flat list is the answer.
  const timezone = day?.timezone ?? park?.timezone ?? 'UTC';
  const grid = buildDayGrid(day?.context.openHour, day?.context.closeHour);
  const isToday = Boolean(activeDate && activeDate === parkToday(timezone));

  const parkSlugs = Object.keys(state.parks);
  // Days of THIS park that already have entries — marked in the picker so the
  // visitor can find them again without remembering the date.
  const plannedDates = park
    ? Object.values(park.days)
        .filter((d) => d.entries.length > 0)
        .map((d) => d.date)
    : [];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side={isPhone ? 'bottom' : 'right'}
        // `side="bottom"` ships `h-auto` and no ceiling, so the height is the
        // call site's business. `svh` rather than `vh`: on iOS the address bar
        // makes `vh` taller than what is actually visible, and the summary row
        // at the bottom would sit under it.
        className="flex w-full flex-col gap-0 p-0 max-sm:max-h-[85svh] max-sm:rounded-t-xl sm:max-w-md"
      >
        <SheetHeader className="border-border/60 shrink-0 border-b px-3 py-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <CalendarPlus className="size-4" />
            {t('title')}
          </SheetTitle>
          {park && (
            <div className="flex items-center justify-between gap-2">
              {/* The park name is the way into the overview. It was a plain
                  label with a row of chips under it naming the OTHER parks, and
                  a chip said nothing about what was planned in one. */}
              <button
                type="button"
                onClick={() => setShowOverview((value) => !value)}
                aria-expanded={showOverview}
                className="text-muted-foreground hover:text-foreground -mx-1 flex min-w-0 items-center gap-1 rounded px-1 py-0.5 text-xs transition-colors"
              >
                <span className="truncate">{park.name}</span>
                {/* Only ever a disclosure of a list worth opening. */}
                {(parkSlugs.length > 1 || plannedDates.length > 1) && (
                  <ChevronDown
                    className={cn(
                      'size-3 shrink-0 transition-transform',
                      showOverview && 'rotate-180'
                    )}
                  />
                )}
              </button>
              {activeDate && !showOverview && (
                <PlannerDayPicker
                  value={activeDate}
                  onChange={(date) => setActive(activeParkSlug, date)}
                  plannedDates={plannedDates}
                />
              )}
            </div>
          )}
        </SheetHeader>

        {showOverview ? (
          <div className="min-h-0 flex-1 overflow-y-auto py-2">
            <PlannerOverview
              state={state}
              activeParkSlug={activeParkSlug}
              activeDate={activeDate}
              onPick={(slug, date) => {
                setActive(slug, date);
                setShowOverview(false);
              }}
              onClearDay={clearDay}
            />
          </div>
        ) : (
          <>
            <div className="border-border/60 shrink-0 border-b">
              <PlannerContextBand day={day ?? null} state={dayState} />
            </div>

            {/* The scroll lives here, not on SheetContent — see the note above.
                `relative` is load-bearing: `overflow-y-auto` makes a scroll
                container but NOT a containing block, so without it the grid's
                absolutely positioned blocks would position against the fixed
                sheet and stay put while the grid scrolled under them.
                `overscroll-y-contain` is on every other scroll surface in this
                repo; a drag past the end of a bottom sheet is otherwise a
                pull-to-refresh. */}
            <div
              ref={scrollerRef}
              className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-1 py-2"
            >
              {grid ? (
                <PlannerDayGrid
                  entries={activeEntries}
                  day={day ?? null}
                  grid={grid}
                  timezone={timezone}
                  isToday={isToday}
                  loading={dayState === 'loading'}
                  selectedId={selectedId}
                  scrollerRef={scrollerRef}
                  onSelect={setSelectedId}
                  onMove={(entryId, startMinute) =>
                    activeParkSlug &&
                    activeDate &&
                    moveRide(activeParkSlug, activeDate, entryId, startMinute)
                  }
                  onShiftFrom={(entryId, delta) =>
                    activeParkSlug &&
                    activeDate &&
                    shiftFrom(activeParkSlug, activeDate, entryId, delta)
                  }
                />
              ) : activeEntries.length === 0 ? (
                <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-1 px-6 text-center">
                  <p className="text-sm font-medium">{t('empty.title')}</p>
                  <p className="text-muted-foreground text-xs">
                    {isPhone ? t('empty.bodyMobile') : t('empty.body')}
                  </p>
                </div>
              ) : (
                /* No opening hours means no honest axis — not a 24-hour one,
                   which would assert a park that never closes, and not an
                   invented 9-to-6. The flat list is what this branch is for,
                   and why those three components survive. */
                <PlannerTimeline
                  entries={activeEntries}
                  day={day ?? null}
                  onToggleDone={(entryId, done) =>
                    activeParkSlug &&
                    activeDate &&
                    setDone(activeParkSlug, activeDate, entryId, done)
                  }
                  onRemove={(entryId) =>
                    activeParkSlug && activeDate && removeRide(activeParkSlug, activeDate, entryId)
                  }
                />
              )}
            </div>

            {/* The way in on a phone, where there is no ride card to drag from. Also
            shown on desktop: typing a name beats hunting for its card, and the
            list is the day's own rides either way. */}
            {park && activeDate && (
              <div className="shrink-0">
                <PlannerRideSearch
                  parkSlug={park.slug}
                  parkName={park.name}
                  geo={park.geo}
                  date={activeDate}
                  day={day ?? null}
                  dayState={dayState}
                />
              </div>
            )}

            {activeEntries.length > 0 && (
              <div className="border-border/60 text-muted-foreground flex shrink-0 items-baseline justify-between gap-3 border-t px-3 py-2.5 text-xs">
                <span>{t('summary.rides', { count: activeEntries.length })}</span>
                <span className="flex items-baseline gap-3">
                  {totals.done > 0 && (
                    <span>
                      {t('summary.done', { done: totals.done, total: activeEntries.length })}
                    </span>
                  )}
                  {/* Expected and actual are never added together: one is a
                  prediction and the other a measurement, and a single figure
                  mixing them moves for two reasons at once. */}
                  {totals.counted > 0 && (
                    <span
                      className="text-foreground font-mono tabular-nums"
                      title={t('summary.waiting')}
                    >
                      {/* The site's own duration format, not a second one invented
                      here: `formatShortDuration` is what the weather warnings
                      already print and it knows all six locales' unit labels. */}
                      {formatShortDuration(totals.expectedMinutes, locale)}
                    </span>
                  )}
                </span>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
