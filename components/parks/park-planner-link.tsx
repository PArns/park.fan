'use client';

import { CalendarPlus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { plannerPath } from '@/lib/planner/segments';
import { plannerUi } from '@/lib/planner/ui-store';
import { cn } from '@/lib/utils';
import type { buttonLinkProps } from '@/components/ui/button';
import type { Locale } from '@/i18n/config';

/**
 * „Plan a day at this park", in the park's own header (park page and calendar, both
 * `ParkTitleHeader`): the planner's one inbound link that carries an intent. The anchor names the
 * park, since 212 pages saying „trip planner" would say nothing about where the link goes.
 *
 * A plain primary click does not navigate: it opens the panel on the wizard's date step for the
 * park on screen (`plannerUi.requestOpen('park-header', 'page-park-wizard')`), like the calendar's
 * "plan this day". The request carries no park because `plannerPagePark` already publishes it. The
 * `href` is real, so a modified click still opens the planner page and a crawler follows it.
 *
 * The label arrives finished from the server, which keeps this component off the `parks` namespace.
 */
export function ParkPlannerLink({
  label,
  locale,
  className,
  button,
}: {
  /** The finished sentence, resolved on the server — see the note above. */
  label: string;
  locale: Locale | string;
  /** Merged with the button's own look rather than replacing it: the one caller
   * decides where the button sits in its row, never what it is. */
  className?: string;
  /**
   * The same press drawn as a button of the scale instead of the header's chip, the
   * `buttonLinkProps` of the row it stands in (`LandingNextSteps`). Only the header's link carries
   * `data-park-planner-link`, which `check:planner` counts on the park page.
   */
  button?: ReturnType<typeof buttonLinkProps>;
}) {
  const look = button ?? {
    'data-park-planner-link': '',
    className: cn(
      'bg-primary/10 text-primary hover:bg-primary/20 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors max-sm:min-h-11',
      className
    ),
  };
  return (
    <Link
      href={plannerPath(locale) as '/trip-planner'}
      // No prefetch: the href serves only the modified click this component does not take over, and
      // the link is in the viewport on every park and calendar page.
      prefetch={false}
      {...look}
      onClick={(event) => {
        // Everything but a plain primary click is left alone: a modified click asks for the
        // planner's own page in a window of its own. The middle button fires `auxclick` and never
        // arrives here.
        if (event.defaultPrevented) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (event.button !== 0) return;
        event.preventDefault();
        plannerUi.requestOpen('park-header', 'page-park-wizard');
      }}
    >
      <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </Link>
  );
}
