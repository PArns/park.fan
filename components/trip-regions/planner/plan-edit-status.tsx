'use client';

import { useTranslations } from 'next-intl';
import { Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getListFormat } from '@/lib/utils/intl-format';
import { formatParkDay } from '@/lib/utils/park-day';
import { oneFullStop } from '@/lib/utils/metadata';
import type { PlanEditChange, TripPlan } from '@/lib/trip-regions/plan';
import { editCost } from '@/lib/trip-regions/plan-copy';
import { shownTotals } from '@/lib/trip-regions/plan-week';
import type { TripCalendar } from '@/lib/trip-regions/types';
import { usePlanContext } from './plan-context';
import { useIdeaWords } from './plan-ideas';

/**
 * The band over the answer after an edit (`role="status"`, so it is read out): what changed, in
 * words („Tokyo DisneySea liegt jetzt am Mi., 20. Jan.“), that the pinned days stay, and the peak
 * wait now, or what the pins cost against the best order without them. „Rückgängig“ takes back
 * every edit in turn (`usePlanState`), „Alle lösen“ releases every pin as one more edit. A change
 * Parky made in the chat is one of them („Parky hat die Reisedaten geändert.“). With pins from a
 * link and no edit yet it says what the pins cost.
 */
export function PlanEditStatus({
  plan,
  best,
  calendar,
}: {
  plan: TripPlan;
  /** The same plan without the pins, for what they cost; `null` while it is asked or without pins. */
  best: TripPlan | null;
  calendar: TripCalendar | undefined;
}) {
  const t = useTranslations('tripPlanner');
  const { state, edits, edit, undo, locale, parkName } = usePlanContext();
  const idea = useIdeaWords();
  const change = edits.change;
  const pins = state.locks.length;
  if (!change && pins === 0) return null;

  const day = (date: string) =>
    formatParkDay(locale, date, { weekday: 'short', day: 'numeric', month: 'short' });
  const weekday = (date: string) => formatParkDay(locale, date, { weekday: 'short' });
  const what = (target: string) => (target === 'rest' ? t('day.rest') : parkName(target));
  const list = getListFormat(locale, { style: 'long', type: 'conjunction' });

  const said = (c: PlanEditChange): string => {
    switch (c.kind) {
      case 'pin':
        return t(c.pinned ? 'edit.pinnedNow' : 'edit.unpinnedNow', {
          what: what(c.target),
          date: day(c.date),
        });
      case 'swap':
        return t('edit.swapped', {
          first: what(c.first),
          firstDay: weekday(c.firstDay),
          second: what(c.second),
          secondDay: weekday(c.secondDay),
        });
      case 'move':
        return t('edit.moved', { park: parkName(c.slug), date: day(c.to) });
      case 'free': {
        const dates = plan.parks.find((p) => p.slug === c.slug)?.dates ?? [];
        return `${t('edit.freed', { date: day(c.date) })} ${t('edit.freedPark', {
          park: parkName(c.slug),
          count: dates.length,
          dates: list.format(dates.map(day)),
        })}`;
      }
      case 'remove':
        return t('edit.removed', { park: parkName(c.slug) });
      case 'add':
        return t('spare.added', { park: parkName(c.slug), date: day(c.date) });
      case 'release':
        return t('edit.released');
      case 'idea':
        return t('ideas.applied', { idea: idea.title(c.idea) });
      case 'parky':
        return t('edit.byParky', { change: c.changes[0] ?? 'other' });
    }
  };

  // Both plans in the figure the days show, or both in the API's; never one of each.
  const bestShown = best ? shownTotals(best, calendar) : null;
  const currentShown = shownTotals(plan, calendar);
  const cost =
    pins > 0
      ? bestShown && currentShown
        ? editCost(bestShown, currentShown)
        : editCost(best?.totals ?? null, plan.totals)
      : null;
  const peak = currentShown?.headlinerWait ?? plan.totals.headlinerWait;

  const lines = [
    edits.undone ? t('edit.undone') : change ? said(change) : t('edit.pinned'),
    change && pins > 0 && change.kind !== 'pin' ? t('edit.pinned') : null,
    cost && cost.delta > 0
      ? t('edit.cost', { delta: cost.delta, current: cost.current, best: cost.best })
      : cost && !change
        ? t('edit.noCost')
        : peak != null && change
          ? t('edit.peakNow', { minutes: Math.round(peak) })
          : null,
  ].filter(Boolean);

  return (
    <div
      className="border-primary/40 bg-primary/5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border px-4 py-3"
      role="status"
      data-plan-edit-status={change?.kind ?? 'pins'}
    >
      <p className="min-w-0 flex-[1_1_16rem] text-sm">{oneFullStop(lines.join(' '))}</p>
      <div className="flex gap-2">
        {edits.canUndo && (
          <Button variant="outline" size="sm" onClick={() => undo()}>
            <Undo2 aria-hidden="true" />
            {t('edit.undo')}
          </Button>
        )}
        {pins > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => edit((s) => ({ ...s, locks: [] }), { kind: 'release' })}
          >
            {t('edit.release')}
          </Button>
        )}
      </div>
    </div>
  );
}
