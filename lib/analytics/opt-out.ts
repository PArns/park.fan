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
 * Whether this browser asked not to be counted: Do Not Track in each spelling Umami's tracker
 * reads (`data-do-not-track`), Global Privacy Control, or the opt-out on the privacy page. GPC
 * stops only our own page-view counter, which the API refuses under `Sec-GPC` as well; Umami does
 * not read it. Storage that cannot be read counts as no flag.
 */
export function analyticsOptedOut(): boolean {
  const dnt = (window as { doNotTrack?: string }).doNotTrack ?? navigator.doNotTrack ?? undefined;
  if (dnt === '1' || dnt === 'yes') return true;
  if ((navigator as { globalPrivacyControl?: boolean }).globalPrivacyControl === true) return true;
  try {
    return localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === '1';
  } catch {
    return false;
  }
}
