import { adminFetch } from '../_lib/api';

/**
 * Retiring and restoring a ride, shared by the `/admin/retirement` worklist and a single ride's
 * page. What must not drift apart lives here (endpoint, required fields, invalidated caches); the
 * layout does not.
 */

/** Today as `YYYY-MM-DD`, the shape `<input type="date">` and the API both want. */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Reason and source are required: a retirement takes the ride out of every list and the sitemap,
 * and without a written reason nobody can answer for the decision later.
 */
export const RETIRE_REASON_REQUIRED =
  'Grund und Quelle sind Pflicht. Ohne sie steht später niemand für die Entscheidung ein.';

/** Query prefixes a retirement invalidates. */
export const RETIREMENT_KEYS = [
  ['admin', 'retirement-candidates'] as const,
  ['admin', 'retired-attractions'] as const,
];

/**
 * Retires one ride as of `retiredAt` with the given reason, through the admin retire endpoint. The
 * caller checks the reason first (`RETIRE_REASON_REQUIRED`) and invalidates `RETIREMENT_KEYS`.
 */
export function retireAttraction(input: {
  attractionId: string;
  retiredAt: string;
  reason: string;
}): Promise<unknown> {
  return adminFetch('/api/admin/retire-attractions', {
    method: 'POST',
    body: { retirements: [input] },
  });
}

/**
 * Hides a permanently closed ride from the park page's closed-rides list, or shows it again. The
 * ride's own page and sitemap entry stay, so the URL keeps its ranking.
 */
export function setRetiredHidden(attractionId: string, hidden: boolean): Promise<unknown> {
  return adminFetch(`/api/admin/retired-attractions/${attractionId}/hidden`, {
    method: 'POST',
    body: { hidden },
  });
}

/** Takes a ride's retirement back, so it counts as an active attraction again. */
export function unretireAttraction(attractionId: string): Promise<unknown> {
  return adminFetch(`/api/admin/unretire-attraction/${attractionId}`, { method: 'POST' });
}
