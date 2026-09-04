'use client';

import { flushSync } from 'react-dom';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { ArrowRight, CalendarPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlanner } from '@/lib/planner/use-planner';
import { plannerUi } from '@/lib/planner/ui-store';
import type { PlannerGeo } from '@/lib/planner/types';

export interface PlanDayButtonProps {
  parkSlug: string;
  parkName: string;
  geo: PlannerGeo;
  /** The calendar day this sits under, YYYY-MM-DD in the park's own reckoning. */
  date: string;
  /**
   * The park's IANA zone. The calendar already computes `todayInPark` from it,
   * so it is always available here — and registering the park WITHOUT it is what
   * left the whole panel reckoning in UTC.
   */
  timezone?: string;
  className?: string;
  /**
   * Called after the plan is opened, before the navigation.
   *
   * The calendar's day detail is a MODAL dialog, so a planner opened from
   * inside it appeared behind an overlay that swallowed every click — the
   * button looked like it did nothing. Closing is the caller's business
   * because the dialog owns its own open state.
   */
  onPlanned?: () => void;
}

/**
 * "Plan this day" — the calendar's way into the planner.
 *
 * The reverse order from the ride page: here the day is chosen first and the
 * rides come after, which is why it calls `openDay` (registering the park and
 * pointing the panel at the date, adding nothing) and then asks for the panel
 * through `plannerUi`. Adding a placeholder entry instead would put a ride in
 * somebody's plan that they never chose.
 *
 * Everything that reads the `planner` namespace lives on this side of
 * `plan-day-button-lazy`'s import — see that file for why.
 */
export function PlanDayButton({
  parkSlug,
  parkName,
  geo,
  date,
  timezone,
  className,
  onPlanned,
}: PlanDayButtonProps) {
  const t = useTranslations('planner');
  const router = useRouter();
  const { openDay } = usePlanner();

  return (
    <button
      type="button"
      onClick={() => {
        // The close first, in a commit of its own, and the rest AFTER a paint.
        // Both halves are needed and neither is enough alone.
        //
        // Everything here is one discrete React event, so without `flushSync`
        // the close rides in the same commit as the store write, the panel
        // mounting and the route render. And `flushSync` only writes the DOM —
        // the browser still paints nothing until the handler returns, so on its
        // own it moved the measured freeze not at all: 2639 ms at 6× CPU
        // throttling, 12163 ms at 20×, with the dialog opaque and unresponsive
        // for all of it. That is the "schließt sich nicht sauber": not a dialog
        // that stays, a dialog that stops answering.
        //
        // So the expensive three go behind a double `requestAnimationFrame`,
        // which is the first moment the closed dialog is actually on screen.
        // They are not a gesture the browser gates (no popup, no download), and
        // `router.push` works the same one frame later.
        if (onPlanned) flushSync(onPlanned);
        const rest = () => {
          openDay({ slug: parkSlug, name: parkName, geo, timezone }, date);
          plannerUi.requestOpen();
          // The park's own page, where the ride cards are. The calendar is the
          // one park page with none, so a button that says "plan the rides for
          // this day" and leaves the reader there has not finished its
          // sentence. `@/i18n/navigation`'s router, so the localized path is
          // built rather than guessed.
          router.push(
            `/parks/${geo.continent}/${geo.country}/${geo.city}/${parkSlug}` as '/europe/germany/rust/europa-park'
          );
        };
        if (onPlanned) requestAnimationFrame(() => requestAnimationFrame(rest));
        else rest();
      }}
      className={cn(
        // A primary call to action, full width, and both halves of that are the
        // point: this is the only way from a day somebody has just decided on
        // into the thing that plans it, and it was a grey `text-xs` chip sitting
        // under a wind speed — the quietest element on a panel whose every other
        // row is a figure. It ends the panel, so it may as well be its width.
        'bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors max-sm:min-h-12',
        className
      )}
    >
      <CalendarPlus className="size-4 shrink-0" />
      <span>{t('planThisDay')}</span>
      <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
    </button>
  );
}
