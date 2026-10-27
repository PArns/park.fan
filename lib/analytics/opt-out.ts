/** The localStorage flag Umami's tracker reads; `'1'` keeps this browser out of the statistics. */
export const ANALYTICS_OPT_OUT_KEY = 'umami.disabled';

/**
 * Whether this browser asked not to be counted: Do Not Track, which the Umami script honours as
 * well (`data-do-not-track`), or the opt-out on the privacy page. Our own page-view counter asks
 * the same question, so one switch covers both. Storage that cannot be read counts as no flag.
 */
export function analyticsOptedOut(): boolean {
  if (navigator.doNotTrack === '1') return true;
  try {
    return localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === '1';
  } catch {
    return false;
  }
}
