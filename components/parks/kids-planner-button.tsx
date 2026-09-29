'use client';

import { CalendarPlus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { plannerPath } from '@/lib/planner/segments';
import { plannerPageHeight } from '@/lib/planner/page-height';
import { riderHeightChoiceFor } from '@/lib/planner/party';
import { plannerUi } from '@/lib/planner/ui-store';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';

/**
 * "Plan a day for this height", on a step of a park's "with kids" page.
 *
 * The same gesture as `ParkPlannerLink` — panel open, wizard on the park the route is about — with
 * the one thing that page knows and the header does not: how tall the smallest person is. It
 * leaves that for the wizard in `plannerPageHeight` before it asks, and the wizard opens its "who
 * is coming" step with the height already chosen.
 *
 * A real `href` for the click this one does not take over (a modified click, a crawler), as
 * there. Only a plain primary click is intercepted.
 */
export function KidsPlannerButton({
  parkSlug,
  cm,
  label,
  locale,
  className,
}: {
  parkSlug: string;
  /** The step's height. The wizard's chips are round tens, so it is rounded down for them. */
  cm: number;
  /** The finished sentence, resolved on the server. */
  label: string;
  locale: Locale | string;
  className?: string;
}) {
  return (
    <Link
      href={plannerPath(locale) as '/trip-planner'}
      prefetch={false}
      onClick={(event) => {
        if (event.defaultPrevented) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (event.button !== 0) return;
        event.preventDefault();
        plannerPageHeight.set({ parkSlug, cm: riderHeightChoiceFor(cm) });
        plannerUi.requestOpen('kids-page', 'page-park-wizard');
      }}
      className={cn(
        'text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline max-sm:min-h-11',
        className
      )}
    >
      <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </Link>
  );
}
