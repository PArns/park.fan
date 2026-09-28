/**
 * When the site may read the visitor's position without being asked, as pure decisions.
 *
 * The browser owns how long a grant lasts; a page cannot ask for a longer one. What the page does
 * own is how often it makes the browser ask. Every function here answers one version of that
 * question from what the browser reports, so the provider (`lib/contexts/geolocation-context.tsx`)
 * and the banner stay free of the reasoning and it is testable without a browser
 * (`pnpm test:geolocation-permission`). The rule: docs/rules/location-is-asked-for-where-it-is-needed.md.
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
  /** Read a position now, on any page. The browser has said it will not ask. */
  | 'request'
  /** The browser has refused; asking again would do nothing. */
  | 'denied'
  /**
   * The visitor said yes on an earlier visit, and the browser no longer says so. Read as soon as a
   * page that uses location is open (`useLocationNeeded`), which may open the browser's prompt;
   * on any other page, read nothing.
   */
  | 'request-where-needed'
  /** Nobody has answered yet. Read nothing until the visitor taps a button that asks. */
  | 'wait';

/**
 * What the provider does on load. It lives in the locale layout, so this runs on every page, blog
 * and news entry pages included.
 *
 * `granted` is the one answer that promises no prompt, so only it is read everywhere. An earlier
 * yes (`optedIn`, the site's own record of a fix it once got) is asked again only where a page uses
 * the position: the homepage and the park pages. Safari on iOS with its default "Ask" setting
 * prompts on every page load (https://developer.apple.com/forums/thread/740270), and Chrome's
 * "Allow this time" ends with the page, so for those visitors a read is a prompt, and one they said
 * yes to before. On a blog post it would be a prompt for nothing. Without an earlier yes the page
 * shows its own button first; the browser's prompt comes from the tap.
 */
export function initialLocationAction(
  state: StoredPermission,
  optedIn: boolean
): InitialLocationAction {
  if (state === 'granted') return 'request';
  if (state === 'denied') return 'denied';
  if (optedIn) return 'request-where-needed';
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

/**
 * Whether a refusal (`GeolocationPositionError` code 1) was only a dismissed prompt, not a block.
 *
 * The error cannot tell the two apart: Chrome answers code 1 to "Block" and to the prompt's close
 * button alike. The Permissions API can. After a block it reads `denied`; after a dismissal it still
 * reads `prompt`, and the next tap opens the prompt again. So a dismissal keeps the button, where
 * showing "blocked" would take away the one thing that works. On WebKit `prompt` is no evidence
 * (it reads `prompt` after "Don't Allow" too, and Safari refuses every further request in that
 * page), so there a refusal counts as a block until the page is loaded again.
 */
export function wasOnlyDismissed(state: StoredPermission, promptReliable: boolean): boolean {
  return promptReliable && state === 'prompt';
}

/** Which "how to allow location again" steps fit this browser. */
export type LocationHelpPlatform = 'ios-safari' | 'mac-safari' | 'default';

/**
 * Picks the steps for lifting a block. Only for help text: the three browser families put the
 * setting in three different places. Safari on iOS has it behind "aA" in the address bar, Safari on
 * macOS in its menu, and Chrome, Edge, Firefox and Samsung Internet behind the icon left of the
 * address. An iPad reports itself as a Mac and gives itself away by its touch points. Chrome,
 * Firefox and Edge on iOS have no "aA", so they get the default steps.
 */
export function locationHelpPlatform(
  userAgent: string,
  vendor: string | undefined,
  maxTouchPoints: number
): LocationHelpPlatform {
  if (/CriOS|FxiOS|EdgiOS/.test(userAgent)) return 'default';
  const ios =
    /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
  if (ios) return 'ios-safari';
  if (/Macintosh/.test(userAgent) && vendor?.startsWith('Apple')) return 'mac-safari';
  return 'default';
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
