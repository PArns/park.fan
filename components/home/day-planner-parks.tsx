'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarPlus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { plannerQuickStarts, quickStartClick } from '@/lib/planner/quick-start';
import type { PlannerMenuPark } from '@/lib/navigation/planner-menu';
import { STOP_PILL_CLASS } from './home-stop';

/**
 * The day planner stop's quick starts, „Einen Tag planen im" over the planner band's parks: each a
 * pill linking the park's page, and a plain click starts the planner's wizard on that park on the
 * way there (`quickStartClick`, source `home-park`). Plain links in the first HTML.
 */
export function HomeDayPlannerParks({ parks }: { parks: readonly PlannerMenuPark[] }) {
  const t = useTranslations('navigation');
  const starts = useMemo(() => plannerQuickStarts(parks), [parks]);
  if (starts.length === 0) return null;
  return (
    <nav aria-label={t('planDayInList')}>
      <h3 className="mb-4 text-lg font-semibold">{t('planDayIn')}</h3>
      <ul className="flex flex-wrap gap-2">
        {starts.map((park) => (
          <li key={park.href} className={STOP_PILL_CLASS}>
            <Link
              href={park.href as '/'}
              prefetch={false}
              onClick={quickStartClick(park, 'home-park')}
              className="hover:text-primary flex items-center gap-1.5 self-stretch px-3 font-medium transition-colors"
            >
              <CalendarPlus className="text-primary/70 size-3.5" aria-hidden="true" />
              {park.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
