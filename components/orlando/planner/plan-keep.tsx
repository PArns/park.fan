'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarArrowDown, CalendarPlus, Check, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackSiteEvent } from '@/lib/analytics/site-analytics';
import { plannerStore } from '@/lib/planner/store';
import { reserveDays } from '@/lib/planner/actions';
import { plannerUi } from '@/lib/planner/ui-store';
import { formatParkDay } from '@/lib/utils/park-day';
import { planHref, reserveTripDays, type TripPlan } from '@/lib/orlando/plan';
import { primaryReason } from '@/lib/orlando/plan-copy';
import { buildTripIcs, type TripIcsEvent } from '@/lib/orlando/plan-ics';
import { calendarCell } from '@/lib/orlando/plan-week';
import { ORLANDO_PLANNER_ID } from '@/lib/orlando/paths';
import type { TripCalendar } from '@/lib/orlando/types';
import { usePlanContext } from './plan-context';
import { dayGuestClose, useDayParks } from './plan-day-bits';

/**
 * Keeping the plan: every park day into the day planner as a reserved day in one write (the
 * store's `reserveDays`, which Parky's trip action uses too; a day that already holds a plan stays
 * as it is), the trip as an `.ics` file built here in Orlando time, and the link to this plan,
 * which is the page's own address because the plan lives in the query.
 */
export function PlanKeep({
  plan,
  calendar,
}: {
  plan: TripPlan;
  calendar: TripCalendar | undefined;
}) {
  const t = useTranslations('orlandoPlanner');
  const { region, state, locale, parkName } = usePlanContext();
  const parksOf = useDayParks();
  const [added, setAdded] = useState<number | null>(null);
  const [link, setLink] = useState<'idle' | 'copied' | { manual: string }>('idle');

  const addAll = () => {
    const days = reserveTripDays(plan, region.parks);
    if (days.length === 0) return;
    plannerStore.update((s) => reserveDays(s, days));
    trackSiteEvent('trip_days_saved', { days: days.length });
    setAdded(days.length);
  };

  const shareUrl = () =>
    `${window.location.origin}${planHref(window.location.pathname, state, ORLANDO_PLANNER_ID)}`;

  const download = () => {
    const url = shareUrl();
    const events: TripIcsEvent[] = plan.days
      .filter((d) => d.kind === 'park' || d.kind === 'hop')
      .map((day) => {
        const first = day.parks[0];
        const cell = first ? calendarCell(calendar, first.slug, day.date) : undefined;
        const close = dayGuestClose(day, calendar);
        const reason = primaryReason(day);
        return {
          date: day.date,
          uid: `${day.date}-${day.parks.map((p) => p.slug).join('+')}@park.fan`,
          summary: parksOf(day),
          description: [
            day.headlinerWait != null ? t('ics.wait', { minutes: day.headlinerWait }) : null,
            reason
              ? t(`reason.${reason}`, {
                  park: first ? parkName(first.slug) : '',
                })
              : null,
            t('ics.link', { url }),
          ].filter((line): line is string => Boolean(line)),
          ...(cell?.opensAt && close ? { start: cell.opensAt, end: close } : {}),
          url,
        };
      });
    trackSiteEvent('trip_ics_exported', { days: events.length });
    const file = buildTripIcs(events, {
      now: Date.now(),
      calendarName: t('ics.calendarName', {
        range: `${formatParkDay(locale, plan.meta.from, { day: 'numeric', month: 'short' })}–${formatParkDay(locale, plan.meta.to, { day: 'numeric', month: 'short', year: 'numeric' })}`,
      }),
    });
    const blob = new Blob([file], { type: 'text/calendar;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `orlando-${plan.meta.from}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  };

  const copy = async () => {
    const url = shareUrl();
    trackSiteEvent('trip_link_copied');
    try {
      await navigator.clipboard.writeText(url);
      setLink('copied');
      setTimeout(() => setLink('idle'), 2000);
    } catch {
      // The clipboard refused: the link is shown so it can be copied by hand.
      setLink({ manual: url });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="grid gap-2 sm:grid-cols-3">
        <Button variant="outline" onClick={addAll}>
          <CalendarPlus aria-hidden="true" />
          {t('keep.addAll')}
        </Button>
        <Button variant="outline" onClick={download}>
          <CalendarArrowDown aria-hidden="true" />
          {t('keep.ics')}
        </Button>
        <Button variant="outline" onClick={() => void copy()}>
          {link === 'copied' ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
          <span aria-live="polite">{link === 'copied' ? t('keep.copied') : t('keep.copy')}</span>
        </Button>
      </div>
      {added !== null && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm" aria-live="polite">
          {t('keep.added', { count: added })}
          <button
            type="button"
            onClick={() => plannerUi.requestOpen('orlando-hub')}
            className="text-primary-ink min-h-11 font-medium underline-offset-4 hover:underline"
          >
            {t('keep.openPlanner')}
          </button>
        </p>
      )}
      {typeof link === 'object' && (
        <label className="flex flex-col gap-1 text-xs">
          {t('keep.manual')}
          <input
            type="text"
            readOnly
            value={link.manual}
            onFocus={(e) => e.currentTarget.select()}
            className="border-border bg-background h-11 rounded-md border px-2 font-mono text-xs"
          />
        </label>
      )}
    </div>
  );
}
