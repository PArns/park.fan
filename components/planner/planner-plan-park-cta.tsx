'use client';

import { useTranslations } from 'next-intl';
import { CalendarPlus } from 'lucide-react';

/**
 * "Toverland jetzt planen": the offer to plan the park the reader is standing in. Its own component
 * because it appears in two places that never render together, the grid's empty overlay and the
 * no-axis branch. It names the page's park whenever the day on screen is not already that park's.
 */
export function PlannerPlanParkCta({
  parkName,
  onStart,
  className,
}: {
  parkName: string;
  onStart: () => void;
  className?: string;
}) {
  const t = useTranslations('planner');

  return (
    <button
      type="button"
      onClick={onStart}
      data-planner-plan-this-park=""
      className={`bg-primary text-primary-foreground hover:bg-primary/90 planner-phone:min-h-11 flex w-full items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${className ?? ''}`}
    >
      <CalendarPlus className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{t('empty.planThisPark', { park: parkName })}</span>
    </button>
  );
}
