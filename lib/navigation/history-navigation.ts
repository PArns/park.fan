/**
 * One place that patches `history.pushState` / `history.replaceState`, so the components that
 * need to know a client-side navigation started (`NavigationProgress`, `ScrollToTop`) share a
 * single patch instead of wrapping the History API once per component.
 *
 * Why patch at all: the App Router navigates through `history.pushState` (React 19 patches it and
 * Next calls it from inside the transition), so this fires **before** React commits the new route
 * — early enough for an effect on the committed pathname to read it. `popstate`, by contrast,
 * fires *after* the commit, which makes it useless for classifying the navigation that just
 * rendered (see `ScrollToTop`).
 *
 * The discriminator that matters: a forward navigation calls `pushState` while `location` still
 * points at the *old* URL. A back/forward navigation never calls `pushState` — the App Router
 * only `replaceState`s, and by then `location` already holds the destination. So "a `pushState`
 * naming this pathname ran" is a reliable "this was a forward navigation".
 *
 * Listeners run *before* the original History method, i.e. while `window.location` is still the
 * pre-navigation URL, so they can compare the destination against the current route.
 */

export type HistoryNavigationType = 'push' | 'replace';

export type HistoryNavigationListener = (destination: URL, type: HistoryNavigationType) => void;

const listeners = new Set<HistoryNavigationListener>();
let patched = false;

function emit(destination: string | URL | null | undefined, type: HistoryNavigationType) {
  if (destination == null || listeners.size === 0) return;
  let url: URL;
  try {
    url = new URL(destination.toString(), window.location.href);
  } catch {
    return; // malformed URL — nothing meaningful to report
  }
  for (const listener of listeners) listener(url, type);
}

/**
 * Patch once and never unpatch: the History API is global and the subscribers live for the
 * lifetime of the app, so restoring the originals on unmount would only risk one component's
 * cleanup tearing down another's still-active patch.
 */
function patchHistory() {
  if (patched) return;
  patched = true;

  const originalPushState = window.history.pushState;
  window.history.pushState = function patchedPushState(
    this: History,
    ...args: Parameters<History['pushState']>
  ) {
    emit(args[2], 'push');
    return originalPushState.apply(this, args);
  };

  const originalReplaceState = window.history.replaceState;
  window.history.replaceState = function patchedReplaceState(
    this: History,
    ...args: Parameters<History['replaceState']>
  ) {
    emit(args[2], 'replace');
    return originalReplaceState.apply(this, args);
  };
}

/** Subscribe to programmatic history navigations. Returns the unsubscribe function. */
export function onHistoryNavigation(listener: HistoryNavigationListener): () => void {
  patchHistory();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
