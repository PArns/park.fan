'use client';

import { useTranslations } from 'next-intl';
import { Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlanner, useIsPlanned } from '@/lib/planner/use-planner';
import type { PlannerGeo } from '@/lib/planner/types';

interface AddToPlannerButtonProps {
  parkSlug: string;
  parkName: string;
  geo: PlannerGeo;
  attractionSlug: string;
  attractionName: string;
  /** Park-local date. Defaults to today in the visitor's own reckoning. */
  date?: string;
  className?: string;
}

/** Today, as the browser sees it. Close enough for a park the visitor is at. */
function todayLocal(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
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
  date,
  className,
}: AddToPlannerButtonProps) {
  const t = useTranslations('planner');
  const { addRide, setActive } = usePlanner();
  const targetDate = date ?? todayLocal();
  const planned = useIsPlanned(parkSlug, targetDate, attractionSlug);

  const handleAdd = () => {
    addRide({ parkSlug, parkName, geo, date: targetDate, attractionSlug, attractionName });
    // Adding also decides what the flyout shows: a visitor who just planned a
    // ride at this park on this day means to look at that day, not at whatever
    // was open last week.
    setActive(parkSlug, targetDate);
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={planned}
      aria-label={planned ? t('inPlan') : t('addRide')}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors',
        planned
          ? 'bg-crowd-low/20 text-crowd-low cursor-default'
          : 'bg-accent/60 text-foreground hover:bg-accent',
        className
      )}
    >
      {planned ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
      <span>{planned ? t('inPlan') : t('addRide')}</span>
    </button>
  );
}
