'use client';

import { useTranslations } from 'next-intl';
import { CalendarPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlanner } from '@/lib/planner/use-planner';
import { plannerUi } from '@/lib/planner/ui-store';
import type { PlannerGeo } from '@/lib/planner/types';

export interface PlanDayButtonProps {
  parkSlug: string;
  parkName: string;
  geo: PlannerGeo;
  /** The calendar day this sits under, YYYY-MM-DD in the park's own reckoning. */
  date: string;
  /**
   * The park's IANA zone. The calendar already computes `todayInPark` from it,
   * so it is always available here — and registering the park WITHOUT it is what
   * left the whole panel reckoning in UTC.
   */
  timezone?: string;
  className?: string;
}

/**
 * "Plan this day" — the calendar's way into the planner.
 *
 * The reverse order from the ride page: here the day is chosen first and the
 * rides come after, which is why it calls `openDay` (registering the park and
 * pointing the panel at the date, adding nothing) and then asks for the panel
 * through `plannerUi`. Adding a placeholder entry instead would put a ride in
 * somebody's plan that they never chose.
 *
 * Everything that reads the `planner` namespace lives on this side of
 * `plan-day-button-lazy`'s import — see that file for why.
 */
export function PlanDayButton({
  parkSlug,
  parkName,
  geo,
  date,
  timezone,
  className,
}: PlanDayButtonProps) {
  const t = useTranslations('planner');
  const { openDay } = usePlanner();

  return (
    <button
      type="button"
      onClick={() => {
        openDay({ slug: parkSlug, name: parkName, geo, timezone }, date);
        plannerUi.requestOpen();
      }}
      className={cn(
        'bg-accent/60 text-foreground hover:bg-accent inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors max-sm:min-h-11 max-sm:px-3',
        className
      )}
    >
      <CalendarPlus className="size-3.5" />
      <span>{t('planThisDay')}</span>
    </button>
  );
}
