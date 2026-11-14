'use client';

import { CalendarDays, CalendarPlus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { buttonLinkProps } from '@/components/ui/button';
import { trackTripEvent } from '@/lib/trip-regions/plan-analytics';
import { tripPlannerUi } from '@/lib/trip-regions/planner-ui';

/** Which head the two ways in sit in, for `trip_hub_action`. */
type HubPage = 'hub' | 'month';

/**
 * The hub's one primary action ("Reise planen"): it asks the planner to open its first step (the
 * walk's first sheet on a phone, the focused panel at a desk), so a reader starts the plan with one
 * tap. The `#planner` link stays the target for a modified click and for a page without script.
 * Every press counts as `trip_hub_action`, modified ones too.
 */
export function HubHeroAction({
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
      data-landing-action=""
      onClick={(event) => {
        trackTripEvent(region, 'trip_hub_action', { action: 'plan', page });
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        tripPlannerUi.openStart();
      }}
      {...buttonLinkProps({ size: 'lg', withIcon: true, className })}
    >
      <CalendarPlus aria-hidden />
      {label}
    </Link>
  );
}

/**
 * The head's second way in ("Zum Kalender"), the same size as the first and never its primary
 * action: a link to chapter 01 that counts as `trip_hub_action`.
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
