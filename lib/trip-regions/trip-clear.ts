import { trackSiteEvent } from '@/lib/analytics/site-analytics';
import { interviewEnded, interviewStore } from '@/lib/assistant/interview';
import { forgetTripChange } from '@/lib/assistant/trip-context';
import { tripPlannerBridge } from './planner-bridge';
import { tripWizardAnswered } from './planner-ui';
import { hubPicks } from './hub-picks';
import { forgetTrip } from './remembered-trip';
import { tripTicketAnswer } from './ticket-answer';
import { visitedParks } from './visited-parks';

/** A trip cleared by {@link clearTrip}, kept in memory until it is put back or dropped. */
export interface ClearedTrip {
  /** Put every store back as it was, the address bar included. */
  restore(): void;
  /**
   * Let the copy go, for good: an interview of Parky's the clear ended counts as left now, so a
   * delete taken back within its few seconds counts nothing.
   */
  drop(): void;
}

/**
 * Clear every place this device keeps one region's trip in, the same for „Reise löschen“ and
 * „Neue Reise planen“, and keep what it cleared in memory only:
 *
 * - the planner on screen: its query in the address bar (dates, parks, pins, tickets, options),
 *   its edits and their undo (`tripPlannerBridge.clear`), counted as no option changed; without a
 *   planner on screen the address bar's query is dropped directly;
 * - the address bar: the hub's own path, no query and no fragment, so a reload is the landing page;
 * - the remembered trip in localStorage, query and party (`forgetTrip`), which `restorableTrip`
 *   would otherwise put back on the next bare visit and Parky reads with every question;
 * - the questions answered in the assistant, in this tab (`tripWizardAnswered`);
 * - the answer to „Schon Tickets?“ (`tripTicketAnswer`);
 * - the parks ticked off as visited in the hub (`visitedParks`), which belong to this trip;
 * - the days picked in the hub calendar (`hubPicks`);
 * - Parky's trip interview for this region, where one runs (`interviewStore`), and his last
 *   change, so his undo cannot bring the trip back (`forgetTripChange`).
 *
 * Other regions' trips stay. The result's chosen view and the day planner's days stay: the one is
 * a preference of the browser, the others were filed into another planner on purpose.
 */
export function clearTrip(region: string): ClearedTrip {
  const href = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const planner = tripPlannerBridge.clear(region);
  window.history.replaceState(null, '', window.location.pathname);
  const remembered = forgetTrip(region);
  const answered = tripWizardAnswered.forget(region);
  const tickets = tripTicketAnswer(region).forget();
  const visited = visitedParks(region).forget();
  const picks = hubPicks(region).forget();
  const change = forgetTripChange(region);
  const running = interviewStore.getSnapshot();
  const interview = running?.kind === 'trip' && running.region === region ? running : null;
  if (interview) interviewStore.set(null);

  let settled = false;
  return {
    restore() {
      if (settled) return;
      settled = true;
      remembered();
      answered();
      tickets();
      visited();
      picks();
      change();
      if (interview) interviewStore.set(interview);
      if (planner) {
        planner();
        // The planner writes its query with its own anchor; the fragment the visitor had comes back.
        const { pathname, search, hash } = window.location;
        const was = new URL(href, window.location.origin).hash;
        if (hash !== was) window.history.replaceState(null, '', `${pathname}${search}${was}`);
      } else {
        window.history.replaceState(null, '', href);
      }
    },
    drop() {
      if (settled) return;
      settled = true;
      if (interview) {
        trackSiteEvent('assistant_interview_ended', interviewEnded(interview, 'left'));
      }
    },
  };
}
