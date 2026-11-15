'use client';

import type { MouseEvent } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDown, CalendarDays, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { buttonLinkProps } from '@/components/ui/button';
import { formatDateRange } from '@/lib/trip-regions/hub-data';
import { TRIP_PLANNER_ID } from '@/lib/trip-regions/paths';
import { trackTripEvent } from '@/lib/trip-regions/plan-analytics';
import { tripPlannerUi, type TripPlannerStartSource } from '@/lib/trip-regions/planner-ui';
import { clearTrip } from '@/lib/trip-regions/trip-clear';
import { cn } from '@/lib/utils';
import { isPlainPrimaryClick } from '@/lib/utils/plain-click';
import { PlanDelete, PlanDeleteStatus, useTripDeleted } from '../planner/plan-delete';
import { useHubTrip } from './hub-trip-state';

/** Which page the hub's ways in sit on, for `trip_hub_action`. */
type HubPage = 'hub' | 'month';

/**
 * Start the trip planner from the hub: the one place every "plan your trip" button of the page goes
 * through. It asks the mounted planner to open the assistant on its first step
 * (`tripPlannerUi.openStart`), with where the start came from: the head (`hero`), chapter 01 and
 * the closing band (`landing`), or „Neue Reise planen“ (`restart`), which first clears the trip
 * as „Reise löschen“ does (`clearTrip`, with no undo), so the assistant starts with no answers and
 * a reload brings back no old trip. Counted as `trip_hub_action`, the clear as no option changed;
 * a modified click keeps the link's own way to `#planner`.
 */
function startPlanner(
  event: MouseEvent<HTMLAnchorElement>,
  region: string,
  page: HubPage,
  source: TripPlannerStartSource
): void {
  trackTripEvent(region, 'trip_hub_action', { action: 'plan', page });
  if (!isPlainPrimaryClick(event)) return;
  event.preventDefault();
  if (source === 'restart') clearTrip(region).drop();
  tripPlannerUi.openStart(source);
}

/**
 * A "plan your trip" button of the hub: a link to `#planner` that starts the planner
 * (`startPlanner`, as `source`), so a modified click and a page without script still reach the
 * chapter.
 * `landingAction` marks the head's one primary action (`data-landing-action`); the same button in
 * chapter 01 and the closing band carries none.
 */
export function HubPlanAction({
  href,
  label,
  region,
  page,
  source,
  landingAction = false,
  variant = 'default',
  className,
}: {
  href: string;
  label: string;
  region: string;
  page: HubPage;
  source: TripPlannerStartSource;
  landingAction?: boolean;
  variant?: 'default' | 'glass';
  className?: string;
}) {
  return (
    <Link
      href={href}
      data-landing-action={landingAction ? '' : undefined}
      onClick={(event) => startPlanner(event, region, page, source)}
      {...buttonLinkProps({ variant, size: 'lg', withIcon: true, className })}
    >
      <Sparkles aria-hidden />
      {label}
    </Link>
  );
}

/**
 * The head's second way in ("Zum Kalender"), the same size as the first and never its primary
 * action: a link to the calendar chapter that counts as `trip_hub_action`.
 */
export function HubCalendarAction({
  href,
  label,
  region,
  page,
  className,
}: {
  href: string;
  label: string;
  region: string;
  page: HubPage;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={() => trackTripEvent(region, 'trip_hub_action', { action: 'calendar', page })}
      {...buttonLinkProps({ variant: 'glass', size: 'lg', withIcon: true, className })}
    >
      <CalendarDays aria-hidden />
      {label}
    </Link>
  );
}

/**
 * The head's two ways in and the line under them, by the hub's state. Landing page (and the served
 * HTML): „Reise planen“, „Zum Kalender“ and what the planner asks. With a plan: „Zu deinem Plan“
 * (a jump to chapter 01, still the head's one primary action), „Neue Reise planen“, the trip's
 * dates and „Reise löschen“ at the end of that line (`PlanDelete`), whose undo stands in the
 * line's cell (`PlanDeleteStatus`). The boxes keep their size, so the swap after hydration moves
 * nothing below them.
 */
export function HubHeroActions({
  planHref,
  calendarHref,
  planLabel,
  calendarLabel,
  region,
  page,
  locale,
}: {
  planHref: string;
  calendarHref: string;
  /** „Reise planen“ and „Zum Kalender“, from the server's messages. */
  planLabel: string;
  calendarLabel: string;
  region: string;
  page: HubPage;
  locale: string;
}) {
  const t = useTranslations('tripHub.howItWorks.hero');
  const trip = useHubTrip();
  const deleted = useTripDeleted(region);
  const button = 'max-sm:w-full';
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        {trip ? (
          <>
            <a
              href={`#${TRIP_PLANNER_ID}`}
              data-landing-action=""
              onClick={() => trackTripEvent(region, 'trip_hub_action', { action: 'plan', page })}
              {...buttonLinkProps({ size: 'lg', withIcon: true, className: button })}
            >
              <ArrowDown aria-hidden />
              {t('toPlan')}
            </a>
            <HubPlanAction
              href={planHref}
              label={t('newTrip')}
              region={region}
              page={page}
              source="restart"
              variant="glass"
              className={button}
            />
          </>
        ) : (
          <>
            <HubPlanAction
              href={planHref}
              label={planLabel}
              region={region}
              page={page}
              source="hero"
              landingAction
              className={button}
            />
            <HubCalendarAction
              href={calendarHref}
              label={calendarLabel}
              region={region}
              page={page}
              className={button}
            />
          </>
        )}
      </div>
      {/* One cell for the note and the status after a delete, so the status's end moves nothing. */}
      <div className="text-muted-foreground grid min-h-10 text-sm">
        {trip ? (
          <PlanDelete region={region} from="head" className="col-start-1 row-start-1">
            {t('remembered', { range: formatDateRange(trip.from, trip.to, locale) })}
          </PlanDelete>
        ) : (
          <p
            className={cn(
              'col-start-1 row-start-1 transition-[opacity,visibility]',
              deleted && 'invisible opacity-0'
            )}
          >
            {t('note')}
          </p>
        )}
        <PlanDeleteStatus region={region} className="text-foreground col-start-1 row-start-1" />
      </div>
    </div>
  );
}
