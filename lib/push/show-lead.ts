/**
 * The API's two send windows, as far as this app needs to know them.
 *
 * `dueShowNotifications` notifies 25–35 minutes ahead of a performance and,
 * for a show followed after that window had already passed, once more at
 * 8–14 minutes. Only the lower bounds reach the UI: one decides whether the
 * reminder somebody is about to switch on still lands in the usual window,
 * the other whether there is any lead left to offer at all.
 *
 * These are mirrored numbers, not shared ones — the API is the authority and
 * a change to `SHOW_LEAD_MIN` / `SHOW_LATE_LEAD_MIN` there has to be copied
 * here by hand.
 */

/** Below this many minutes to the next performance the late window applies. */
export const SHOW_LEAD_MIN = 25;

/**
 * Below this many minutes the bell disappears: there is no reminder left to
 * give, and a control that cannot do anything is worse than none.
 *
 * Two minutes above the API's own 8, deliberately. A follow written at 9.5
 * minutes has to survive the trip to the API and then wait for a five-minute
 * cron tick to find it — at 8 the tick that mattered could already be past.
 */
export const SHOW_FOLLOW_MIN_LEAD_MIN = 10;
