'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarArrowDown, CalendarPlus, Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { plannerStore } from '@/lib/planner/store';
import { reserveDays, setActive } from '@/lib/planner/actions';
import { plannerUi } from '@/lib/planner/ui-store';
import { formatParkDay } from '@/lib/utils/park-day';
import { canShareNatively, shareNatively } from '@/lib/utils/native-share';
import {
  planHref,
  reserveTripDays,
  type TripPlan,
  type TripPlanState,
} from '@/lib/trip-regions/plan';
import { primaryReason } from '@/lib/trip-regions/plan-copy';
import { buildTripIcs, type TripIcsEvent } from '@/lib/trip-regions/plan-ics';
import { calendarCell, shownDayWait } from '@/lib/trip-regions/plan-week';
import { TRIP_PLANNER_ID } from '@/lib/trip-regions/paths';
import type { TripCalendar } from '@/lib/trip-regions/types';
import { usePlanContext, useTripEvents } from './plan-context';
import { ActionRow } from './plan-day-actions';
import { dayGuestClose, useDayParks } from './plan-day-bits';
import { regionOrShared } from '@/lib/trip-regions/region-words';
import { oneFullStop } from '@/lib/utils/metadata';

/** The link to this plan: the page's own address, since the plan lives in the query. */
function planLink(state: TripPlanState): string {
  return `${window.location.origin}${planHref(window.location.pathname, state, TRIP_PLANNER_ID)}`;
}

/** The trip's name, „Reise nach Orlando 14.–22. Feb. 2027“: the calendar's and the share sheet's. */
function useTripTitle(plan: TripPlan): string {
  const t = useTranslations('tripPlanner');
  const tRegion = useTranslations('tripRegion.planner');
  const { region, locale } = usePlanContext();
  return regionOrShared(tRegion, t, 'ics.calendarName', {
    region: region.name,
    range: `${formatParkDay(locale, plan.meta.from, { day: 'numeric', month: 'short' })}–${formatParkDay(locale, plan.meta.to, { day: 'numeric', month: 'short', year: 'numeric' })}`,
  });
}

/**
 * „Teilen“ in the result's head: the system share sheet on a phone that has one, the link copied
 * at a desk, where a share sheet is the operating system's and rarely what a visitor expects. A
 * clipboard that refuses shows the link to copy by hand.
 */
export function PlanShare({ plan }: { plan: TripPlan }) {
  const t = useTranslations('tripPlanner');
  const { state } = usePlanContext();
  const track = useTripEvents();
  const title = useTripTitle(plan);
  const [link, setLink] = useState<'idle' | 'copied' | { manual: string }>('idle');

  const share = async () => {
    const url = planLink(state);
    const sheet = window.matchMedia('(pointer: coarse)').matches && canShareNatively();
    track('trip_link_copied', { method: sheet ? 'share' : 'copy' });
    if (sheet && (await shareNatively({ title, url })) !== 'unavailable') return;
    try {
      await navigator.clipboard.writeText(url);
      setLink('copied');
      setTimeout(() => setLink('idle'), 2000);
    } catch {
      setLink({ manual: url });
    }
  };

  const copied = link === 'copied';
  return (
    <Popover open={typeof link === 'object'} onOpenChange={(open) => !open && setLink('idle')}>
      <PopoverAnchor asChild>
        <Button variant="outline" onClick={() => void share()} data-plan-share="">
          {copied ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}
          <span aria-live="polite">{copied ? t('keep.copied') : t('result.share')}</span>
        </Button>
      </PopoverAnchor>
      <PopoverContent align="end" className="w-72">
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
      </PopoverContent>
    </Popover>
  );
}

/**
 * Keeping the plan, as entries of the result's „Mehr“: every park day into the day planner as a
 * reserved day in one write (the store's `reserveDays`, which Parky's trip action uses too; a day
 * that already holds a plan stays as it is), and the trip as an `.ics` file built here in the
 * region's time. List items, for the sheet's list.
 */
export function PlanKeep({
  plan,
  calendar,
  onLeave,
}: {
  plan: TripPlan;
  calendar: TripCalendar | undefined;
  /** Closes what holds these entries before the day planner opens over the page. */
  onLeave: () => void;
}) {
  const t = useTranslations('tripPlanner');
  const tRegion = useTranslations('tripRegion.planner');
  const { region, config, state, locale, parkName } = usePlanContext();
  const track = useTripEvents();
  const parksOf = useDayParks();
  const calendarName = useTripTitle(plan);
  const [added, setAdded] = useState<{ count: number; park: string; date: string } | null>(null);

  const addAll = () => {
    const days = reserveTripDays(plan, region.parks);
    if (days.length === 0) return;
    plannerStore.update((s) => reserveDays(s, days));
    track('trip_days_saved', { days: days.length });
    setAdded({ count: days.length, park: days[0].park.slug, date: days[0].date });
  };

  const download = () => {
    const url = planLink(state);
    const events: TripIcsEvent[] = plan.days
      .filter((d) => d.kind === 'park' || d.kind === 'hop')
      .map((day) => {
        const first = day.parks[0];
        const cell = first ? calendarCell(calendar, first.slug, day.date) : undefined;
        const close = dayGuestClose(day, calendar);
        const reason = primaryReason(day);
        const wait = shownDayWait(day, calendar);
        return {
          date: day.date,
          uid: `${day.date}-${day.parks.map((p) => p.slug).join('+')}@park.fan`,
          summary: parksOf(day),
          description: [
            wait != null ? t('ics.wait', { minutes: wait }) : null,
            reason
              ? regionOrShared(tRegion, t, `reason.${reason}`, {
                  park: first ? parkName(first.slug) : '',
                })
              : null,
            t('ics.link', { url }),
          ].filter((line): line is string => Boolean(line)),
          ...(cell?.opensAt && close ? { start: cell.opensAt, end: close } : {}),
          url,
        };
      });
    track('trip_ics_exported', { days: events.length });
    const file = buildTripIcs(events, { now: Date.now(), timeZone: config.timezone, calendarName });
    const blob = new Blob([file], { type: 'text/calendar;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `${region.slug}-${plan.meta.from}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  };

  return (
    <>
      <ActionRow icon={CalendarPlus} title={t('keep.addAll')} onClick={addAll} />
      {added !== null && (
        <li
          className="flex flex-wrap items-center gap-x-3 gap-y-1 px-2 pl-13 text-sm transition-opacity duration-200 starting:opacity-0"
          aria-live="polite"
        >
          {oneFullStop(
            t('keep.added', {
              count: added.count,
              park: parkName(added.park),
              date: formatParkDay(locale, added.date, {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              }),
            })
          )}
          <button
            type="button"
            onClick={() => {
              // The day planner opens on the trip's first filed day, not on the last one it showed.
              plannerStore.update((s) => setActive(s, added.park, added.date));
              onLeave();
              plannerUi.requestOpen(`${region.slug}-trip-first`);
            }}
            className="text-primary-ink min-h-11 font-medium underline-offset-4 hover:underline"
          >
            {t('keep.openPlanner')}
          </button>
        </li>
      )}
      <ActionRow icon={CalendarArrowDown} title={t('keep.ics')} onClick={download} />
    </>
  );
}
