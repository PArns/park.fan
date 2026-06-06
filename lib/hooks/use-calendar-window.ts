import { format, startOfMonth, endOfMonth, addMonths, addDays, min } from 'date-fns';

export interface CalendarWindow {
  /** Start of the window (current month start), `YYYY-MM-DD`. */
  from: string;
  /** End of the window (end of month +2, capped at 90 days), `YYYY-MM-DD`. */
  to: string;
}

/**
 * Derive the best-days / FAQ calendar window (current month + next 2 months, capped at the API's
 * 90-day max) from a "now" Date.
 *
 * Previously computed in the park's server shell from getServerNowMs() — which read the clock in
 * the static prerender and pinned the shell's revalidate to the clock's cacheLife. Pass a
 * client-derived "now" (e.g. from useBrowserNow, which is null until mount) so the shell stays
 * time-independent (1-day TTL); `now` is null during SSR/prerender, where we return a stable
 * placeholder window that the calendar query never uses (it's browser-gated) and which is replaced
 * once the browser clock is available.
 */
export function getCalendarWindow(now: Date | null): CalendarWindow {
  if (!now) {
    // Placeholder for the pre-mount render; the calendar fetch is browser-only so this is never
    // actually requested, and it's replaced as soon as the browser clock lands.
    return { from: '', to: '' };
  }
  const from = startOfMonth(now);
  const to = min([endOfMonth(addMonths(now, 2)), addDays(from, 89)]);
  return { from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') };
}
