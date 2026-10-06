'use client';

import { flushSync } from 'react-dom';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { ArrowRight, CalendarPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlanner } from '@/lib/planner/use-planner';
import { plannerUi } from '@/lib/planner/ui-store';
import { plannerPageDay } from '@/lib/planner/page-day';
import type { PlannerGeo } from '@/lib/planner/types';

/** Props of {@link PlanDayButton}. */
export interface PlanDayButtonProps {
  parkSlug: string;
  parkName: string;
  geo: PlannerGeo;
  /** The calendar day this sits under, YYYY-MM-DD in the park's own reckoning. */
  date: string;
  /** The park's IANA zone; registering the park without it leaves the panel reckoning in UTC. */
  timezone?: string;
  className?: string;
  /**
   * Called after the plan is opened, before the navigation, so the calendar's modal day dialog can
   * close; otherwise the panel opens behind its overlay.
   */
  onPlanned?: () => void;
  /**
   * What pressing this leads to. `'panel'` (the default) registers the day, opens the panel and
   * goes to the park's page. `'wizard'` opens the planner's dialog with park and day already
   * answered, for the day comparison, and does not navigate: the wizard's own `finish` does.
   */
  mode?: 'panel' | 'wizard';
}

/**
 * "Plan this day", the calendar's way into the planner. The day comes first here, so it calls
 * `openDay` (registering the park and date, adding nothing) and asks for the panel through
 * `plannerUi`; a placeholder entry would be a ride nobody chose. Everything that reads the
 * `planner` namespace stays behind `plan-day-button-lazy`'s import.
 */
export function PlanDayButton({
  parkSlug,
  parkName,
  geo,
  date,
  timezone,
  className,
  onPlanned,
  mode = 'panel',
}: PlanDayButtonProps) {
  const t = useTranslations('planner');
  const router = useRouter();
  const { openDay } = usePlanner();

  return (
    <button
      type="button"
      onClick={() => {
        // The close first, in a commit of its own (`flushSync`), and the rest after a paint (a
        // double `requestAnimationFrame`): `flushSync` alone writes the DOM but nothing is painted
        // until the handler returns, so the dialog froze, opaque, for the whole store write, panel
        // mount and route render.
        if (onPlanned) flushSync(onPlanned);
        const rest = () => {
          if (mode === 'wizard') {
            // The date goes where the panel picks it up; the park is already on `plannerPagePark`.
            // Nothing is filed here: the wizard files the day at its last step.
            plannerPageDay.set({ parkSlug, date });
            plannerUi.requestOpen('calendar-day', 'page-park-wizard');
            return;
          }
          openDay({ slug: parkSlug, name: parkName, geo, timezone }, date);
          plannerUi.requestOpen('calendar-day');
          // The park's own page, where the ride cards are, via the localized router.
          router.push(
            `/parks/${geo.continent}/${geo.country}/${geo.city}/${parkSlug}` as '/europe/germany/rust/europa-park'
          );
        };
        if (onPlanned) requestAnimationFrame(() => requestAnimationFrame(rest));
        else rest();
      }}
      className={cn(
        // A primary call to action, full width: the only way from a day just decided on into the
        // thing that plans it.
        'bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors max-sm:min-h-12',
        className
      )}
    >
      <CalendarPlus className="size-4 shrink-0" />
      {/* Two labels, because the two modes promise different things: the ride cards, or the
          questions about the day itself. */}
      <span>{t(mode === 'wizard' ? 'planDayInWizard' : 'planThisDay')}</span>
      <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
    </button>
  );
}
