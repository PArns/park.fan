'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { plannerStore } from '@/lib/planner/store';
import { countAll } from '@/lib/planner/types';
import { plannerUi } from '@/lib/planner/ui-store';

/**
 * The planner's way in on a phone, in the header, where `PlannerEdgeTab` is `planner-phone:hidden`.
 * `planner-phone:` rather than the bar's `@container` width, so this and the tab ask the same
 * question and exactly one of them exists at any size. It only ever opens: on a phone the panel is
 * a modal sheet. `label` is `navigation.planner`, since this renders on every page and may read
 * only the layout chrome's messages.
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
      /* `max-sm:size-9` cancels the button scale's 44 px phone tier, like the burger beside it: a
         44 px control does not fit a 48 px bar. `relative` is for the count badge. */
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
