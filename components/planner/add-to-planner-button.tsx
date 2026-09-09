'use client';

import { useTranslations } from 'next-intl';
import { Plus, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlanner, usePlannedCount } from '@/lib/planner/use-planner';
import { todayInZone } from '@/lib/planner/park-time';
import type { PlannerGeo } from '@/lib/planner/types';

interface AddToPlannerButtonProps {
  parkSlug: string;
  parkName: string;
  geo: PlannerGeo;
  attractionSlug: string;
  attractionName: string;
  /**
   * The park's IANA zone. Optional only because the payloads that carry it
   * declare it optional — pass it wherever it is known, because it is BOTH the
   * date this files under and the zone the whole plan then reckons in.
   */
  timezone?: string;
  /** Park-local date. Defaults to today where the park is. */
  date?: string;
  className?: string;
}

/**
 * Puts one ride into the plan.
 *
 * This is the feature's real entry point — the floating launcher only appears
 * once something is in — so it has to work from a ride card, a ride page and the
 * mobile search alike, which is why it takes the park's identity as props rather
 * than reading a context. A card deep in a list has that information already; a
 * context would mean wrapping the tree for it.
 *
 * The state is read through the module store, so pressing this on one card
 * updates the launcher's count and any other copy of this button for the same
 * ride, with no provider between them.
 */
export function AddToPlannerButton({
  parkSlug,
  parkName,
  geo,
  attractionSlug,
  attractionName,
  timezone,
  date,
  className,
}: AddToPlannerButtonProps) {
  const t = useTranslations('planner');
  const { addRide, setActive } = usePlanner();
  // What this button DISPLAYS a count for, and deliberately not what a press
  // files under: this is a render-time reading of the clock, and `handleAdd`
  // takes its own. A stale date here shows the wrong count for one render and
  // corrects itself on the next; a stale date on the write is a misfiling.
  const targetDate = date ?? todayInZone(timezone);
  const plannedCount = usePlannedCount(parkSlug, targetDate, attractionSlug);
  const planned = plannedCount > 0;

  const handleAdd = () => {
    // ONE clock read decides both halves, and the two are not independent: the
    // day this files under and the earliest minute inside that day. `targetDate`
    // above is computed at RENDER, so a ride page left open across park-local
    // midnight would file under yesterday — where `addEntry`'s floor reads
    // `phase: 'past'`, declines to raise anything and lands the ride at 10:00 on
    // a day that has ended. That is the fault this button was fixed for, at the
    // one boundary a floor cannot see from inside the day it is given.
    const now = Date.now();
    const filingDate = date ?? todayInZone(timezone, now);

    addRide(
      {
        parkSlug,
        parkName,
        geo,
        timezone,
        date: filingDate,
        attractionSlug,
        attractionName,
      },
      now
    );
    // Adding also decides what the flyout shows: a visitor who just planned a
    // ride at this park on this day means to look at that day, not at whatever
    // was open last week.
    setActive(parkSlug, filingDate);
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      aria-label={
        planned ? `${t('plannedTimes', { count: plannedCount })} — ${t('addAgain')}` : t('addRide')
      }
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors',
        planned
          ? 'bg-crowd-low/20 text-crowd-low hover:bg-crowd-low/30'
          : 'bg-accent/60 text-foreground hover:bg-accent',
        className
      )}
    >
      {planned ? <Repeat className="size-3.5" /> : <Plus className="size-3.5" />}
      <span>{planned ? t('addAgain') : t('addRide')}</span>
    </button>
  );
}
