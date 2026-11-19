'use client';

import { useTranslations } from 'next-intl';
import { formatParkDay } from '@/lib/utils/park-day';
import { pastTrip, planFromToday, type PastTrip } from '@/lib/trip-regions/trip-dates';
import { Button } from '@/components/ui/button';
import { usePlanContext } from './plan-context';

/** Whether the planner's trip began before the region's today; `null` for a trip ahead. */
export function usePastTrip(): PastTrip | null {
  const { state, today } = usePlanContext();
  return today ? pastTrip(state, today) : null;
}

/**
 * Where the plan would stand, for a trip that began before the region's today (a remembered trip
 * put back, an old link): no request goes out, since the API answers it with a 400. One sentence
 * names the first day, then the ways out: the rest of a trip under way from today, or new dates.
 */
export function PlanPastNotice({
  past,
  onNewDates,
}: {
  past: PastTrip;
  /** Open the dates step. */
  onNewDates: () => void;
}) {
  const t = useTranslations('tripPlanner.past');
  const { state, update, today, locale, live } = usePlanContext();
  const date = state.from
    ? formatParkDay(locale, state.from, { day: 'numeric', month: 'short' })
    : '';
  return (
    <div
      className="border-border/60 flex flex-col items-start gap-3 rounded-2xl border p-5"
      role="status"
      data-plan-past={past}
    >
      <p className="text-sm">{t(past, { date })}</p>
      <div className="flex flex-wrap gap-2">
        {past === 'started' && today && (
          <Button disabled={!live} onClick={() => update((s) => planFromToday(s, today))}>
            {t('fromToday')}
          </Button>
        )}
        <Button variant="outline" disabled={!live} onClick={onNewDates}>
          {t('newDates')}
        </Button>
      </div>
    </div>
  );
}
