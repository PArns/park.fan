'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { MousePointer2, X } from 'lucide-react';
import { plannerDragCoach } from '@/lib/planner/drag-coach';

/**
 * How a ride gets into the day, said once.
 *
 * The gesture is drag and drop from the page behind the panel, and a gesture
 * nobody names is a gesture nobody finds. It used to be named by a badge on
 * every ride card, permanently, which covered forty ride names to repeat one
 * sentence; that badge now waits for the pointer to arrive on a card, and this
 * is what reaches somebody who has not thought to hover yet.
 *
 * Shown only where the gesture exists — `hidden sm:flex`, because a coarse
 * pointer has no drag and drop and the panel's own search is the way in there —
 * and only while there is a park page behind the panel to drag from. Dismissed
 * for good on the button, because a hint that comes back is not a hint.
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
      className="border-primary/30 bg-primary/10 mx-2 mt-2 hidden shrink-0 items-start gap-2 rounded-md border px-2 py-1.5 sm:flex"
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
