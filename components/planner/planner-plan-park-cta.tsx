'use client';

import { useTranslations } from 'next-intl';
import { CalendarPlus } from 'lucide-react';

/**
 * "Toverland jetzt planen" — the offer to plan the park the reader is standing in.
 *
 * Its own component because it has to appear in two places that never render
 * together, and it used to appear in neither. It lived inside the panel's
 * no-axis empty branch, which is reached only when `buildDayGrid` returns
 * `null` — and the grid is non-null for every date `/plan/day` names hours for,
 * which is every open day. So one press of the calendar's plan button, or one
 * finished wizard, made the whole container unreachable and the reader was left
 * with the grid's own "Noch nichts geplant" overlay, which offers nothing.
 *
 * The other half is which park it names: the question is not whether the store
 * has heard of this park, it is whether the day on screen is already this
 * park's. Standing on Toverland's page with a Phantasialand day open, the right
 * offer is Toverland.
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
      className={`bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors max-sm:min-h-11 ${className ?? ''}`}
    >
      <CalendarPlus className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{t('empty.planThisPark', { park: parkName })}</span>
    </button>
  );
}
