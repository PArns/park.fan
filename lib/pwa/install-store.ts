/*
 * Whether this browser can be asked to install park.fan, as an external store.
 *
 * Chromium fires `beforeinstallprompt` once, early, and not again: a component that subscribed
 * in an effect could miss it. The listener is therefore registered when this module loads, and
 * the component only reads the store (`useSyncExternalStore`, the mount-gate rule).
 *
 * Three answers: `prompt` (the browser handed us an event to call), `ios` (Safari on iOS and
 * iPadOS has no event, only the Share sheet), `none` (installed already, dismissed, or a browser
 * that offers neither). The server and hydration read `none`.
 */

export type InstallMode = 'none' | 'prompt' | 'ios';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const INSTALL_DISMISSED_KEY = 'install-hint-dismissed';
/** A dismissal holds for 30 days, the same as the location banner's. */
const DISMISS_MS = 30 * 24 * 60 * 60 * 1000;

const listeners = new Set<() => void>();
let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
let dismissed: boolean | null = null;
let iosCache: boolean | null = null;

function emit() {
  for (const listener of listeners) listener();
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  // iPadOS 13+ reports a Mac; a Mac has no touch points.
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  // Only Safari has the Share-sheet route to the Home Screen that the hint describes. Chrome,
  // Firefox, Edge and Opera on iOS carry their own token, and the in-app browsers (Facebook,
  // Instagram, Line, Google app, Snapchat) have no such sheet at all.
  return (
    ios &&
    /Safari\//.test(ua) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|FBAN|FBAV|Instagram|Line\/|GSA\/|Snapchat/.test(ua)
  );
}

function readDismissed(): boolean {
  try {
    const at = Number(localStorage.getItem(INSTALL_DISMISSED_KEY));
    return Number.isFinite(at) && at > 0 && Date.now() - at < DISMISS_MS;
  } catch {
    return false;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferred = null;
    emit();
  });
}

function computeMode(): InstallMode {
  if (installed || isStandalone()) return 'none';
  dismissed ??= readDismissed();
  if (dismissed) return 'none';
  if (deferred) return 'prompt';
  iosCache ??= isIosSafari();
  return iosCache ? 'ios' : 'none';
}

export function subscribeToInstall(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getInstallMode(): InstallMode {
  return computeMode();
}

export const getServerInstallMode = (): InstallMode => 'none';

/** Opens the browser's own install dialog. The event is single-use, so it is dropped after. */
export async function promptInstall(): Promise<void> {
  const event = deferred;
  if (!event) return;
  deferred = null;
  emit();
  try {
    await event.prompt();
  } catch {
    // The browser refused to show the dialog; the single-use event is spent either way.
  }
}

export function dismissInstall(): void {
  dismissed = true;
  try {
    localStorage.setItem(INSTALL_DISMISSED_KEY, String(Date.now()));
  } catch {
    // Private mode: the hint stays hidden for this page view only.
  }
  emit();
}
