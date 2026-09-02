'use client';

import { useTranslations } from 'next-intl';
import { CalendarPlus } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PlannerContextBand, type PlannerDayState } from './planner-context-band';
import { PlannerDayPicker } from './planner-day-picker';
import { PlannerTimeline } from './planner-timeline';
import { PlannerRideSearch } from './planner-ride-search';
import { usePlanner } from '@/lib/planner/use-planner';
import { usePlanDay } from '@/lib/hooks/use-plan-day';
import { totalsFor } from '@/lib/planner/estimate';
import { useMediaQuery } from '@/lib/hooks/use-media-query';

interface PlannerFlyoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Minutes as `1 h 25` or `45 Min.`, whichever reads shorter. */
function formatMinutes(total: number): string {
  if (total < 60) return `${total} Min.`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest}`;
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
  const {
    activeParkSlug,
    activeDate,
    activeEntries,
    state,
    reorderRide,
    setDone,
    removeRide,
    setActive,
  } = usePlanner();

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

  const parkSlugs = Object.keys(state.parks);
  // Days of THIS park that already have entries — marked in the picker so the
  // visitor can find them again without remembering the date.
  const plannedDates = park
    ? Object.values(park.days)
        .filter((d) => d.entries.length > 0)
        .map((d) => d.date)
    : [];

  /** Switching park keeps a day if that park has one planned, else offers today. */
  const switchPark = (slug: string) => {
    const target = state.parks[slug];
    const dates = Object.values(target?.days ?? {})
      .filter((d) => d.entries.length > 0)
      .map((d) => d.date)
      .sort();
    setActive(slug, dates[0] ?? activeDate);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
              <div className="min-w-0">
                <p className="text-muted-foreground truncate text-xs">{park.name}</p>
                {/* Other parks the visitor is planning. One line, and only when
                    there is somewhere else to go — a switcher offering one park
                    is a control that does nothing. */}
                {parkSlugs.length > 1 && (
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {parkSlugs
                      .filter((slug) => slug !== activeParkSlug)
                      .map((slug) => (
                        <button
                          key={slug}
                          type="button"
                          onClick={() => switchPark(slug)}
                          className="bg-accent/40 hover:bg-accent truncate rounded px-1.5 py-0.5 text-[11px] transition-colors"
                        >
                          {state.parks[slug].name}
                        </button>
                      ))}
                  </div>
                )}
              </div>
              {activeDate && (
                <PlannerDayPicker
                  value={activeDate}
                  onChange={(date) => setActive(activeParkSlug, date)}
                  plannedDates={plannedDates}
                />
              )}
            </div>
          )}
        </SheetHeader>

        <div className="border-border/60 shrink-0 border-b">
          <PlannerContextBand day={day ?? null} state={dayState} />
        </div>

        {/* The scroll lives here, not on SheetContent — see the note above. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-1 py-2">
          {activeEntries.length === 0 ? (
            <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-1 px-6 text-center">
              <p className="text-sm font-medium">{t('empty.title')}</p>
              <p className="text-muted-foreground text-xs">
                {isPhone ? t('empty.bodyMobile') : t('empty.body')}
              </p>
            </div>
          ) : (
            <PlannerTimeline
              entries={activeEntries}
              day={day ?? null}
              onReorder={(entryId, toIndex) =>
                activeParkSlug &&
                activeDate &&
                reorderRide(activeParkSlug, activeDate, entryId, toIndex)
              }
              onToggleDone={(entryId, done) =>
                activeParkSlug && activeDate && setDone(activeParkSlug, activeDate, entryId, done)
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
                <span>{t('summary.done', { done: totals.done, total: activeEntries.length })}</span>
              )}
              {/* Expected and actual are never added together: one is a
                  prediction and the other a measurement, and a single figure
                  mixing them moves for two reasons at once. */}
              {totals.counted > 0 && (
                <span className="text-foreground font-mono tabular-nums">
                  {formatMinutes(totals.expectedMinutes)}
                </span>
              )}
            </span>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
