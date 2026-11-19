'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarDays, Ellipsis, LayoutList, Rows3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { formatParkDayRange } from '@/lib/utils/park-day';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import type { TripPlan } from '@/lib/trip-regions/plan';
import { tripPlanView, PLAN_VIEWS, type PlanView } from '@/lib/trip-regions/plan-view';
import type { TripCalendar } from '@/lib/trip-regions/types';
import { usePlanContext, useTripEvents } from './plan-context';
import { PLAN_FOCUS, PLAN_WIDE_QUERY } from './plan-controls';
import { PlanKeep } from './plan-keep';
import { PlanAccuracy } from './plan-peak-card';
import { PlanSheetContent } from './plan-sheet';

const VIEW_ICON = { agenda: LayoutList, week: Rows3, month: CalendarDays } as const;

/**
 * The result's view: the one this browser chose (`plan-view.ts`), else the Week in a wide window
 * and the Days on a phone.
 */
export function usePlanView(): PlanView {
  const wide = useMediaQuery(PLAN_WIDE_QUERY);
  const choice = tripPlanView(usePlanContext().region.slug);
  const chosen = useSyncExternalStore(
    choice.subscribe,
    choice.getSnapshot,
    choice.getServerSnapshot
  );
  return chosen ?? (wide ? 'week' : 'agenda');
}

/**
 * „Mehr“ in the result's head: the tools few visitors use, in the planner's sheet. The view (Tage,
 * Woche, Monat), the days into the day planner, the `.ics` file and „Wie genau ist das?“. A day's
 * own edits are in that day's „Mehr“.
 */
export function PlanMore({
  plan,
  calendar,
}: {
  plan: TripPlan;
  calendar: TripCalendar | undefined;
}) {
  const t = useTranslations('tripPlanner');
  const { locale } = usePlanContext();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);
  return (
    <>
      <Button
        ref={button}
        variant="outline"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        data-plan-more=""
      >
        <Ellipsis aria-hidden="true" />
        {t('edit.more')}
      </Button>
      <Sheet open={open} onOpenChange={(next) => !next && close()}>
        {open && (
          <PlanSheetContent
            kicker={formatParkDayRange(locale, plan.meta.from, plan.meta.to, {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}
            title={t('edit.more')}
            onClose={close}
            returnFocus={() => button.current?.focus()}
            bodyClassName="flex flex-col gap-4 px-2 py-3"
          >
            <PlanViewSwitch onChosen={close} />
            <ul className="flex flex-col" data-plan-more-list="">
              <PlanKeep plan={plan} calendar={calendar} onLeave={close} />
              <PlanAccuracy plan={plan} calendar={calendar} />
            </ul>
          </PlanSheetContent>
        )}
      </Sheet>
    </>
  );
}

/** Tage | Woche | Monat, as a radio group; a choice closes the sheet so the view is seen. */
function PlanViewSwitch({ onChosen }: { onChosen: () => void }) {
  const t = useTranslations('tripPlanner.views');
  const track = useTripEvents();
  const choice = tripPlanView(usePlanContext().region.slug);
  const view = usePlanView();
  return (
    <div className="flex flex-col gap-2 px-2">
      <p id="plan-view-label" className="text-muted-foreground text-xs font-medium">
        {t('label')}
      </p>
      <div
        role="radiogroup"
        aria-labelledby="plan-view-label"
        className="bg-muted/50 grid grid-cols-3 gap-1 rounded-xl p-1"
      >
        {PLAN_VIEWS.map((key) => {
          const Icon = VIEW_ICON[key];
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={view === key}
              onClick={() => {
                if (key !== view) track('trip_view_changed', { view: key });
                choice.set(key);
                onChosen();
              }}
              className={cn(
                'flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors',
                view === key
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
                PLAN_FOCUS
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {t(key)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
