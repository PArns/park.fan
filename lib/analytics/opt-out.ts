/** The localStorage flag Umami's tracker reads; `'1'` keeps this browser out of the statistics. */
export const ANALYTICS_OPT_OUT_KEY = 'umami.disabled';

/**
 * The hosts that count: production only, never a preview or a local build. Umami's
 * `data-domains` and the page-view beacon read the same list.
 */
export const ANALYTICS_HOSTS = ['park.fan', 'www.park.fan'] as const;

/** Whether a page on `hostname` may be counted at all. */
export function isAnalyticsHost(hostname: string): boolean {
  return (ANALYTICS_HOSTS as readonly string[]).includes(hostname);
}

/**
 * The do-not-count signal this browser sends, if any: Do Not Track in each spelling Umami's tracker
 * reads (`data-do-not-track`), which stops both counters, or Global Privacy Control, which only our
 * own page-view counter reads (the API refuses `Sec-GPC` as well).
 */
export function privacySignal(): 'dnt' | 'gpc' | null {
  const dnt = (window as { doNotTrack?: string }).doNotTrack ?? navigator.doNotTrack ?? undefined;
  if (dnt === '1' || dnt === 'yes') return 'dnt';
  if ((navigator as { globalPrivacyControl?: boolean }).globalPrivacyControl === true) return 'gpc';
  return null;
}

/**
 * Whether this browser asked not to be counted by our page-view counter: a {@link privacySignal}
 * or the opt-out on the privacy page. Storage that cannot be read counts as no flag.
 */
export function analyticsOptedOut(): boolean {
  if (privacySignal()) return true;
  try {
    return localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === '1';
  } catch {
    return false;
  }
}
