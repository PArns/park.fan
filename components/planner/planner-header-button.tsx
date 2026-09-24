'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { plannerStore } from '@/lib/planner/store';
import { countAll } from '@/lib/planner/types';
import { plannerUi } from '@/lib/planner/ui-store';

/**
 * The planner's way in on a phone, in the header instead of on the window's edge.
 *
 * `PlannerEdgeTab` is the way in everywhere else and it is `planner-phone:hidden` now: on a
 * 390 px screen it was a 34 px strip laid over the right edge of every page, across card text
 * and prices (PAR-434). This button takes its place in the bar, where the three preference
 * controls moved out to the burger sheet and left the room for it.
 *
 * **`planner-phone:` on both sides and not the bar's `@container` width**, because the question
 * is which way in exists, and the tab answers it with the planner's own variant. A container
 * query here would disagree with the tab at 844x390 on a coarse pointer — the bar is 844 px wide
 * there, so the button would stay hidden while the tab is hidden too, and the phone would have
 * no way in at all. On `planner-phone` the panel is a bottom sheet and never insets the page, so
 * the bar's width and the window's are the same number there anyway.
 *
 * It only ever OPENS. On `planner-phone` the panel is a modal sheet with its own handle and
 * overlay, so the closed → open press is the only one this button can receive.
 *
 * `label` is `navigation.planner`, passed in by the header, for the reason the edge tab gives:
 * this renders on every page, so it may only read what the layout chrome already carries. The
 * same word is the button's accessible name and, visually hidden, its text — which is what
 * `check:planner` reads off either way in.
 */
export function PlannerHeaderButton({ label }: { label: string }) {
  const state = useSyncExternalStore(
    plannerStore.subscribe,
    plannerStore.getSnapshot,
    plannerStore.getServerSnapshot
  );
  const total = useMemo(() => countAll(state), [state]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      data-planner-launcher=""
      onClick={() => plannerUi.requestOpen('header')}
      /* `max-sm:size-9` cancels the button scale's 44 px phone tier, like the burger beside it:
         a 44 px control in a 48 px bar is the mistake the header-geometry requirement names.
         `relative` is for the count badge. */
      className="planner-phone:inline-flex relative hidden max-sm:size-9"
    >
      <CalendarPlus className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only">{label}</span>
      {/* No badge at zero, for the edge tab's reason: a "0" reads as a count that failed. */}
      {total > 0 && (
        <span
          aria-hidden="true"
          className="bg-primary text-primary-foreground absolute top-0.5 right-0.5 flex min-w-4 items-center justify-center rounded-full px-0.5 font-mono text-[10px] leading-4 tabular-nums"
        >
          {total}
        </span>
      )}
    </Button>
  );
}
