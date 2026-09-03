'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarPlus } from 'lucide-react';
import { PlannerFlyout } from './planner-flyout';

/**
 * The button and the panel behind it.
 *
 * Its own file, and that is structural rather than tidiness. `planner-launcher`
 * is a lazy message boundary, and the generator counts a boundary's OWN
 * `useTranslations` calls while stopping the walk at its imports — so a boundary
 * that reads the namespace itself puts it straight back into the layout chrome
 * of every page. Everything that reads `planner` therefore sits on this side of
 * the import.
 */
export function PlannerLauncherButton({
  total,
  openRequests = 0,
}: {
  total: number;
  openRequests?: number;
}) {
  const t = useTranslations('planner');
  const [open, setOpen] = useState(false);

  // Something outside the panel asked for it — a day picked in the park
  // calendar. An effect is right here and a render-time branch is not: the
  // request arrives from another component's event, and the panel must reopen on
  // a SECOND request after the visitor has closed it, which is why the counter
  // is compared against the last one seen rather than against zero.
  //
  // Seeded with 0, NOT with the current prop: the first request is also what
  // MOUNTS this component when nothing is planned yet, and seeding from the prop
  // would make that first render see no change and swallow the very request that
  // caused it.
  const lastSeen = useRef(0);
  useEffect(() => {
    if (openRequests === lastSeen.current) return;
    lastSeen.current = openRequests;
    setOpen(true);
  }, [openRequests]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('open')}
        // Primary, not glass. It was `bg-popover/95` with a hairline ring —
        // the same treatment the menu band and every card on the site use, and
        // over a park photo at the bottom of a long page that reads as another
        // panel edge rather than as the one control that opens the feature.
        // This is the planner's only floating entry point; it is allowed to be
        // the loudest thing in the corner.
        className="bg-primary text-primary-foreground ring-primary/30 hover:bg-primary/90 fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full px-4 py-3 shadow-lg ring-1 transition-colors max-sm:right-3 max-sm:bottom-3"
      >
        <CalendarPlus className="size-4" />
        <span className="text-sm font-medium">{t('title')}</span>
        {/* No badge at zero. Opened from the calendar there is nothing planned
            yet, and a "0" beside the label reads as a count that failed. */}
        {total > 0 && (
          // On the primary fill, so the badge inverts with it: `bg-primary/15
          // text-primary` was a tint of the button's own colour and disappeared
          // into it the moment the button became primary.
          <span className="bg-primary-foreground/20 text-primary-foreground rounded-full px-1.5 py-0.5 font-mono text-xs tabular-nums">
            {total}
          </span>
        )}
      </button>

      <PlannerFlyout open={open} onOpenChange={setOpen} />
    </>
  );
}
