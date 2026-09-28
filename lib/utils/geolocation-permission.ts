/**
 * When the site may read the visitor's position without being asked, as pure decisions.
 *
 * The browser owns how long a grant lasts; a page cannot ask for a longer one. What the page does
 * own is how often it makes the browser ask. Every function here answers one version of that
 * question from what the browser reports, so the provider (`lib/contexts/geolocation-context.tsx`)
 * and the banner stay free of the reasoning and it is testable without a browser
 * (`pnpm test:geolocation-permission`). The rule: docs/rules/location-is-asked-for-by-a-tap.md.
 */

/** What `navigator.permissions.query({ name: 'geolocation' })` answered; `null` = no answer. */
export type StoredPermission = PermissionState | null;

/**
 * WebKit (Safari, and every browser on iOS) keeps the Permissions API at `prompt` while a grant
 * is live. With Safari's default "Ask" setting, allowing without "Remember for one day" leaves it
 * at `prompt`, and so does "Deny"; only the per-site "Allow" setting reads `granted`. There,
 * `prompt` says nothing about whether the browser would ask again right now. Chromium and Firefox
 * report a change away from `granted` faithfully: `prompt` after a grant means the grant is gone
 * ("Allow this time" ran out).
 *
 * Detected by `navigator.vendor`, which is "Apple Computer, Inc." exactly on WebKit (Safari and
 * every iOS browser), "Google Inc." on Chromium and empty on Firefox.
 */
export function promptStateIsReliable(vendor: string | undefined): boolean {
  return !vendor?.startsWith('Apple');
}

export type InitialLocationAction =
  /** Read a position now. The browser has said it will not ask. */
  | 'request'
  /** The browser has refused; asking again would do nothing. */
  | 'denied'
  /** Read nothing until the visitor taps a button that asks. */
  | 'wait';

/**
 * What the provider does on load, on every page (it lives in the locale layout, so blog and news
 * entry pages included): read only on `granted`, the one answer that promises no prompt.
 *
 * Everything else waits for a tap, including an earlier yes the browser no longer reports. Safari
 * on iOS with its default "Ask" setting prompts again on every page load
 * (https://developer.apple.com/forums/thread/740270), so a read "reusing" that yes was a native
 * prompt on every page a reader landed on. `null` (no Permissions API, or it threw) is the same:
 * nothing says the read would be silent.
 */
export function initialLocationAction(state: StoredPermission): InitialLocationAction {
  if (state === 'granted') return 'request';
  if (state === 'denied') return 'denied';
  return 'wait';
}

/**
 * Whether a background refresh (the 5-minute / in-park 1-minute tick, or the tab coming back to
 * the front) may read a position right now.
 *
 * Chrome's "Allow this time" expires after five minutes in the background, and the Permissions
 * API then reads `prompt` again. A refresh fired at that moment opened a native prompt the instant
 * the visitor switched back to the tab. So a `prompt` stops the refresh, but only after this page
 * has seen the state read `granted` (`hadGrant`): that is a grant that ran out. Firefox keeps a
 * temporary grant ("Remember this decision" left unticked) at `prompt` from the start and never
 * fires `change` for it, and there the refresh still works. On WebKit `prompt` is the steady state.
 */
export function canRefreshSilently(
  state: StoredPermission,
  promptReliable: boolean,
  hadGrant: boolean
): boolean {
  if (state === 'denied') return false;
  if (state === 'prompt' && promptReliable && hadGrant) return false;
  return true;
}

/** How long a closed location banner stays closed. */
export const LOCATION_BANNER_QUIET_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Whether a banner closed at `dismissedAt` (epoch ms, `null` = never) is still closed at `now`.
 * It used to be closed for the browser session only, so a visitor who said no was asked again on
 * every visit. A timestamp from the future (a clock that was wrong when it was written) does not
 * hold the banner shut forever.
 */
export function locationBannerIsQuiet(dismissedAt: number | null, now: number): boolean {
  if (dismissedAt == null || !Number.isFinite(dismissedAt)) return false;
  const age = now - dismissedAt;
  return age >= 0 && age < LOCATION_BANNER_QUIET_MS;
}
