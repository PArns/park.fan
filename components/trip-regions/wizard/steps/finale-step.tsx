'use client';

import { useTranslations } from 'next-intl';
import { Check, CircleAlert, type LucideIcon } from 'lucide-react';
import { getListFormat } from '@/lib/utils/intl-format';
import { parksLeftOut, planSavings } from '@/lib/trip-regions/plan-copy';
import { shownTotals } from '@/lib/trip-regions/plan-week';
import { planStays } from '@/lib/trip-regions/plan-stays';
import { tripDates } from '@/lib/trip-regions/plan';
import { PlannerPolaroids, type PolaroidPhoto } from '@/components/planner/planner-polaroids';
import { usePlanContext } from '../../planner/plan-context';
import { useBaseName } from '../../planner/plan-place-words';
import { useStatePlan, useTripCalendar } from '../../planner/use-trip-plan';
import { PlanRibbon } from '../plan-ribbon';

/**
 * The finale after the last step, "Your plan is ready": the planned parks as polaroids, the trip in
 * one line (days, park days, cities), the peak wait against the trip's average in the result's own
 * words (`planSavings`), the plan as a ribbon from the first day to the last, and what the plan did
 * in short lines, each from the plan: the cities and their nights, the parks it had no day for, and
 * where the day planner takes over. "See the plan" is the footer's.
 */
export function FinaleStep() {
  const t = useTranslations('tripPlanner');
  const { state, photos, parkName, locale } = usePlanContext();
  const plan = useStatePlan();
  const calendar = useTripCalendar(state.from, state.to);
  const baseName = useBaseName();
  const data = plan.data;
  if (!data) return <PlanRibbon ends />;

  const planned = data.parks.filter((p) => p.dates.length > 0).map((p) => p.slug);
  const polaroids: PolaroidPhoto[] = planned.flatMap((slug) =>
    photos[slug] ? [{ ...photos[slug], label: parkName(slug), alt: '' }] : []
  );
  const stays = planStays(data);
  const savings = planSavings({ ...data.totals, ...shownTotals(data, calendar.data) });
  const left = parksLeftOut(data);
  const list = getListFormat(locale, { style: 'long', type: 'conjunction' });
  const lines: Array<{ text: string; icon: LucideIcon }> = [];
  if (stays.length > 1) {
    const [first, ...rest] = stays.map((s) =>
      t('route.stayShort', { city: baseName(s.base), count: s.nights })
    );
    lines.push({
      text: t('wizard.finale.stays', { first, rest: list.format(rest) }),
      icon: Check,
    });
  }
  if (left.length > 0) {
    lines.push({
      text: t('answer.leftOut', {
        parks: list.format(left.map(parkName)),
        count: left.length,
        days: data.totals.parkDays,
      }),
      icon: CircleAlert,
    });
  }
  lines.push({ text: t('wizard.finale.dayPlanner'), icon: Check });

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <PlannerPolaroids photos={polaroids} />
      <div className="flex flex-col gap-1.5">
        <p className="text-2xl font-bold text-balance sm:text-3xl">
          {[
            t('wizard.finale.days', { count: tripDates(state).length }),
            t('wizard.ribbon.parkDays', { count: data.totals.parkDays }),
            stays.length > 1 ? t('wizard.finale.cities', { count: stays.length }) : null,
          ]
            .filter(Boolean)
            .join(', ')}
        </p>
        {savings && (
          <p className="text-muted-foreground text-sm text-balance">
            {savings.kind === 'saving'
              ? t('answer.peakSaved', { minutes: savings.planned, saved: savings.saved })
              : t('answer.peakFlat', { minutes: savings.planned })}
          </p>
        )}
      </div>
      <PlanRibbon ends className="w-full text-left" />
      <ul className="flex w-full flex-col gap-2 text-left text-sm">
        {lines.map(({ text, icon: Icon }) => (
          <li key={text} className="flex gap-2">
            <Icon className="text-primary-ink mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
