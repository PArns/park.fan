/**
 * When the site may read the visitor's position without being asked, as pure decisions. The
 * browser owns how long a grant lasts; the page owns how often it makes the browser ask. Kept out
 * of the provider so `pnpm test:geolocation-permission` can run it.
 * See docs/rules/location-is-asked-for-where-it-is-needed.md.
 */

/** What `navigator.permissions.query({ name: 'geolocation' })` answered; `null` = no answer. */
export type StoredPermission = PermissionState | null;

/**
 * Whether a Permissions API `prompt` means anything. WebKit (Safari and every iOS browser) reads
 * `prompt` while a grant is live and after „Deny" alike; Chromium and Firefox report a lapsed
 * grant faithfully. Detected by `navigator.vendor`, which starts with „Apple" exactly on WebKit.
 */
export function promptStateIsReliable(vendor: string | undefined): boolean {
  return !vendor?.startsWith('Apple');
}

/** What the location provider does on load. */
export type InitialLocationAction =
  /** Read a position now, on any page. The browser has said it will not ask. */
  | 'request'
  /** The browser has refused; asking again would do nothing. */
  | 'denied'
  /**
   * The visitor said yes on an earlier visit, and the browser no longer says so. Read as soon as a
   * page that uses location is open (`useLocationNeeded`), which may prompt; elsewhere, nothing.
   */
  | 'request-where-needed'
  /** Nobody has answered yet. Read nothing until the visitor taps a button that asks. */
  | 'wait';

/**
 * What the provider does on load, on every page. Only `granted` promises no prompt, so only it is
 * read everywhere. An earlier yes (`optedIn`) is acted on only where a page uses the position,
 * because Safari's default „Ask" and Chrome's „Allow this time" make that read a prompt, and on a
 * blog post it would be a prompt for nothing. Without an earlier yes the page shows its own button.
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
 * Whether a background refresh (the periodic tick, or the tab returning) may read a position now.
 * Chrome's „Allow this time" lapses back to `prompt` in the background, and a refresh then opens a
 * native prompt the moment the visitor returns; so `prompt` stops it, but only after this page saw
 * `granted` (`hadGrant`). Firefox keeps temporary grants at `prompt` from the start, so there the
 * refresh still works.
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
 * The error cannot tell them apart, but the Permissions API still reads `prompt` after a dismissal,
 * so the button stays. On WebKit `prompt` is no evidence, so a refusal counts as a block until the
 * page is reloaded.
 */
export function wasOnlyDismissed(state: StoredPermission, promptReliable: boolean): boolean {
  return promptReliable && state === 'prompt';
}

/** Which "how to allow location again" steps fit this browser. */
export type LocationHelpPlatform = 'ios-safari' | 'mac-safari' | 'default';

/**
 * Picks the steps for lifting a block, for help text only: Safari on iOS, Safari on macOS and the
 * rest each keep the setting somewhere else. An iPad reports itself as a Mac and gives itself away
 * by its touch points; Chrome, Firefox and Edge on iOS get the default steps.
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
 * A timestamp from the future (a clock that was wrong) does not hold the banner shut forever.
 */
export function locationBannerIsQuiet(dismissedAt: number | null, now: number): boolean {
  if (dismissedAt == null || !Number.isFinite(dismissedAt)) return false;
  const age = now - dismissedAt;
  return age >= 0 && age < LOCATION_BANNER_QUIET_MS;
}
