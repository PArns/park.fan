'use client';

import { flushSync } from 'react-dom';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { ArrowRight, CalendarPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlanner } from '@/lib/planner/use-planner';
import { plannerUi } from '@/lib/planner/ui-store';
import { plannerPageDay } from '@/lib/planner/page-day';
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
  /**
   * What pressing this leads to.
   *
   * `'panel'` is the original and the default: register the day, open the
   * panel, and take the reader to the park's own page where the ride cards
   * are. Every existing call site means this and reads exactly as before.
   *
   * `'wizard'` starts the trip planner's own dialog with the park AND the day
   * already answered, so it opens on „Wer kommt mit" with two steps left
   * instead of four. It is what the day comparison needs: somebody who has
   * just weighed two dates against each other has answered both questions the
   * first two steps ask, and being asked them again is the app pretending not
   * to have been there.
   *
   * The two modes differ in one more thing than the dialog: `'wizard'` does
   * NOT navigate. The wizard's own `finish` goes to the park page (with
   * `#attractions`), and a push from here would pull the page out from under
   * a dialog that is still asking questions.
   */
  mode?: 'panel' | 'wizard';
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
  mode = 'panel',
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
          if (mode === 'wizard') {
            // The date, left where the panel picks it up — the park is already
            // on `plannerPagePark`, published by the beacon this route mounts.
            // Nothing is registered in the plan here: the wizard files the day
            // itself at its last step, and writing one now would put a day in
            // somebody's plan that they may still cancel out of.
            plannerPageDay.set({ parkSlug, date });
            plannerUi.requestOpen('calendar-day', 'page-park-wizard');
            return;
          }
          openDay({ slug: parkSlug, name: parkName, geo, timezone }, date);
          plannerUi.requestOpen('calendar-day');
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
      {/* Two labels, because the two modes promise different things: `panel` puts the reader in
          front of the ride cards („Bahnen für diesen Tag einplanen"), `wizard` opens the three
          questions about the day itself. One label over both would over- or under-promise
          depending on which one ran. */}
      <span>{t(mode === 'wizard' ? 'planDayInWizard' : 'planThisDay')}</span>
      <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
    </button>
  );
}
