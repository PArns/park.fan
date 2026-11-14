'use client';

import type { MouseEvent } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDown, CalendarDays, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { buttonLinkProps } from '@/components/ui/button';
import { formatDateRange } from '@/lib/trip-regions/hub-data';
import { TRIP_PLANNER_ID } from '@/lib/trip-regions/paths';
import { trackTripEvent } from '@/lib/trip-regions/plan-analytics';
import { tripPlannerUi } from '@/lib/trip-regions/planner-ui';
import { useHubTrip } from './hub-trip-state';

/** Which page the hub's ways in sit on, for `trip_hub_action`. */
type HubPage = 'hub' | 'month';

/**
 * Start the trip planner from the hub: the one place every "plan your trip" button of the page goes
 * through (the head, chapter 01, the closing band). It asks the planner to open its first step
 * through `tripPlannerUi.openStart()`, which the mounted planner answers, so the assistant opens
 * on its first step once it answers that signal. Counted as `trip_hub_action`.
 */
function startPlanner(
  event: MouseEvent<HTMLAnchorElement>,
  region: string,
  page: HubPage
): void {
  trackTripEvent(region, 'trip_hub_action', { action: 'plan', page });
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
  event.preventDefault();
  tripPlannerUi.openStart();
}

/**
 * A "plan your trip" button of the hub: a link to `#planner` that starts the planner
 * (`startPlanner`), so a modified click and a page without script still reach the chapter.
 * `landingAction` marks the head's one primary action (`data-landing-action`); the same button in
 * chapter 01 and the closing band carries none.
 */
export function HubPlanAction({
  href,
  label,
  region,
  page,
  landingAction = false,
  variant = 'default',
  className,
}: {
  href: string;
  label: string;
  region: string;
  page: HubPage;
  landingAction?: boolean;
  variant?: 'default' | 'outline';
  className?: string;
}) {
  return (
    <Link
      href={href}
      data-landing-action={landingAction ? '' : undefined}
      onClick={(event) => startPlanner(event, region, page)}
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
      {...buttonLinkProps({ variant: 'outline', size: 'lg', withIcon: true, className })}
    >
      <CalendarDays aria-hidden />
      {label}
    </Link>
  );
}

/**
 * The head's two ways in and the line under them, by the hub's state. Landing page (and the served
 * HTML): „Reise planen“, „Zum Kalender“ and what the planner asks. With a plan: „Zu deinem Plan“
 * (a jump to chapter 01, still the head's one primary action), „Neue Reise planen“ and the trip's
 * dates. The boxes keep their size, so the swap after hydration moves nothing below them.
 */
export function HubHeroActions({
  planHref,
  calendarHref,
  region,
  page,
  locale,
}: {
  planHref: string;
  calendarHref: string;
  region: string;
  page: HubPage;
  locale: string;
}) {
  const t = useTranslations('tripHub');
  const trip = useHubTrip();
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
              {t('howItWorks.toPlan')}
            </a>
            <HubPlanAction
              href={planHref}
              label={t('howItWorks.newTrip')}
              region={region}
              page={page}
              variant="outline"
              className={button}
            />
          </>
        ) : (
          <>
            <HubPlanAction
              href={planHref}
              label={t('plan')}
              region={region}
              page={page}
              landingAction
              className={button}
            />
            <HubCalendarAction
              href={calendarHref}
              label={t('toCalendar')}
              region={region}
              page={page}
              className={button}
            />
          </>
        )}
      </div>
      <p className="text-muted-foreground text-sm">
        {trip
          ? t('howItWorks.remembered', { range: formatDateRange(trip.from, trip.to, locale) })
          : t('howItWorks.heroNote')}
      </p>
    </div>
  );
}
