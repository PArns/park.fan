'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { MousePointer2, X } from 'lucide-react';
import { plannerDragCoach } from '@/lib/planner/drag-coach';

/**
 * How a ride gets into the day, said once: dragging from the page behind the panel is a gesture
 * nobody finds unless it is named. Shown only where the gesture exists (a fine pointer, with a park
 * page behind the panel), and dismissed for good on the button.
 */
export function PlannerDragCoach({ show }: { show: boolean }) {
  const t = useTranslations('planner');
  const dismissed = useSyncExternalStore(
    plannerDragCoach.subscribe,
    plannerDragCoach.getSnapshot,
    plannerDragCoach.getServerSnapshot
  );

  if (dismissed || !show) return null;

  return (
    <div
      data-planner-drag-coach=""
      /* `planner-wide:flex`, not `sm:flex`: on a phone the sheet is modal, so the page this points
         at is covered; the empty day's lines in `planner-day-grid.tsx` pair the same way. `my-2`,
         since it is the panel's last row. */
      className="border-primary/30 bg-primary/10 planner-wide:flex mx-2 my-2 hidden shrink-0 items-start gap-2 rounded-md border px-2 py-1.5"
    >
      <MousePointer2 className="text-primary mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <p className="text-foreground/90 min-w-0 flex-1 text-[11px] leading-snug">
        {t('coach.drag')}
      </p>
      <button
        type="button"
        onClick={() => plannerDragCoach.dismiss()}
        aria-label={t('coach.dismiss')}
        className="text-muted-foreground/60 hover:bg-accent hover:text-foreground -mt-0.5 flex size-6 shrink-0 items-center justify-center rounded transition-colors"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
