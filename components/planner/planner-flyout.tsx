'use client';

import { useTranslations } from 'next-intl';
import { CalendarPlus } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PlannerContextBand } from './planner-context-band';
import { PlannerTimeline } from './planner-timeline';
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
  const { activeParkSlug, activeDate, activeEntries, state, reorderRide, setDone, removeRide } =
    usePlanner();

  const isPhone = useMediaQuery('(max-width: 639px)');
  const park = activeParkSlug ? state.parks[activeParkSlug] : null;

  const { data: day, isLoading } = usePlanDay({
    continent: park?.geo.continent ?? '',
    country: park?.geo.country ?? '',
    city: park?.geo.city ?? '',
    parkSlug: activeParkSlug ?? '',
    date: activeDate ?? undefined,
    enabled: open && Boolean(park && activeDate),
  });

  const totals = totalsFor(day ?? null, activeEntries);

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
            <p className="text-muted-foreground truncate text-xs">
              {park.name}
              {activeDate && <span className="ml-1 tabular-nums">{activeDate}</span>}
            </p>
          )}
        </SheetHeader>

        <div className="border-border/60 shrink-0 border-b">
          <PlannerContextBand day={day ?? null} loading={isLoading} />
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
