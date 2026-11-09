import { Badge } from '@/components/ui/badge';
import { TapTooltip } from '@/components/common/tap-tooltip';
import { cn } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';
import type { WorksPeriod } from '@/lib/api/types';
import {
  nextWorksPeriod,
  worksPeriodOn,
  worksPeriodsOf,
  worksRunningLabel,
  worksUpcomingLabel,
} from '@/lib/utils/works-period';
import { WorksPeriodList, WorksIcon } from './works-period-list';

interface WorksPeriodBadgeProps {
  /** The curated window from the API. Renders nothing when absent. */
  worksPeriod?: WorksPeriod | null;
  /** Every curated window of the ride; read before `worksPeriod` (see `worksPeriodsOf`). */
  worksPeriods?: readonly WorksPeriod[] | null;
  /** The park's own day as `YYYY-MM-DD`, computed on the server. */
  todayIso?: string;
  /**
   * Whether the badge names dates: the end in its label, the windows on hover or tap. Off where the
   * caller only knows that a window covers today and has no dates to show (Parky's ride card).
   */
  showDates?: boolean;
  /** The badge sits inside a link (the ride card); see `TapTooltip`. */
  insideLink?: boolean;
  className?: string;
}

/** The „Wartung" badge's surface without its fill, shared with the planner's works chip. */
export const WORKS_BADGE_CLASS =
  'border border-orange-500/30 font-semibold text-orange-600 backdrop-blur-md dark:text-orange-300';

/**
 * „Wartung": the word that separates a ride shut on purpose, for a day of maintenance or a winter's
 * rebuild, from one that happens to be shut. Both
 * read `CLOSED` and no feed tells them apart, so the window is curated.
 *
 * Its own badge beside `SeasonalBadge`, because "only opens in winter" and "being rebuilt" are
 * different facts that may both hold; orange because no other badge on these cards uses it. While
 * a window covers `todayIso` it says until when („In Wartung bis 4. Dez.", plain „Wartung" with
 * no end on file); before the next one starts it says „Wartung ab 16. Jan." („am 8. Dez." for a
 * single day) in a paler tint, because a visitor planning a trip wants to know before the day.
 * Hover or tap lists the running window and the ones after it with their dates. A window that is
 * over says nothing, and without the park's day neither form is drawn.
 */
export function WorksPeriodBadge({
  worksPeriod,
  worksPeriods,
  todayIso,
  showDates = true,
  insideLink = false,
  className,
}: WorksPeriodBadgeProps) {
  const t = useTranslations('parks.worksPeriod');
  const locale = useLocale();

  const periods = worksPeriodsOf({ worksPeriod, worksPeriods });
  const running = worksPeriodOn(periods, todayIso);
  const next = running ? null : nextWorksPeriod(periods, todayIso);
  if (!running && !next) return null;

  const badge = (
    <Badge
      className={cn(WORKS_BADGE_CLASS, running ? 'bg-orange-500/15' : 'bg-orange-500/5', className)}
    >
      <WorksIcon className="h-3 w-3 text-inherit" />
      {/* No end where Parky only knows that a window runs today (`showDates` off). */}
      {running
        ? showDates
          ? worksRunningLabel(running, locale, t)
          : t('label')
        : worksUpcomingLabel(next!, locale, t)}
    </Badge>
  );
  if (!showDates) return badge;

  // The running window and every one after it; one that is over is no longer news.
  const ahead = periods.filter(
    (period) => period === running || Boolean(period.from && period.from > todayIso!)
  );
  return (
    <TapTooltip
      insideLink={insideLink}
      content={
        <WorksPeriodList
          items={ahead.map((period) => ({ key: `${period.from}|${period.to}`, period }))}
        />
      }
    >
      {badge}
    </TapTooltip>
  );
}
