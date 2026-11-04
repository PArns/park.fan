import type { AssistantOpenSource } from '@/lib/analytics/site-analytics';

const OPEN_EVENT = 'parkfan:parky-open';

/**
 * Opens Parky's chat window from elsewhere on the page, as the button on Parky's own page does,
 * counted with `source` (`assistant_opened`). The launcher hears it once its button shows; until
 * then the request waits there.
 */
export function openParky(source: AssistantOpenSource = 'page'): void {
  window.dispatchEvent(new CustomEvent<AssistantOpenSource>(OPEN_EVENT, { detail: source }));
}

/** Hears {@link openParky}, with what asked for the window; returns the unsubscribe. */
export function onParkyOpen(listener: (source: AssistantOpenSource) => void): () => void {
  const handle = (event: Event) =>
    listener((event as CustomEvent<AssistantOpenSource>).detail ?? 'page');
  window.addEventListener(OPEN_EVENT, handle);
  return () => window.removeEventListener(OPEN_EVENT, handle);
}

const REOPEN_KEY = 'parkfan:assistant-reopen';
/** A switch that has not landed by then is stale: a later page must not open Parky by itself. */
const REOPEN_WITHIN_MS = 30_000;

/**
 * Asks the launcher on the page Parky's language switch leads to for the window open: the new
 * locale mounts the layout, and the launcher with it, afresh. The chat itself is in session storage.
 */
export function reopenAfterSwitch(): void {
  try {
    window.sessionStorage.setItem(REOPEN_KEY, String(Date.now()));
  } catch {
    // Without storage the chat waits behind the button, as after a reload.
  }
}

/** Whether a language switch asked for the window open, once: reading it clears the request. */
export function takeReopen(now = Date.now()): boolean {
  try {
    const at = Number(window.sessionStorage.getItem(REOPEN_KEY));
    window.sessionStorage.removeItem(REOPEN_KEY);
    return at > 0 && now - at < REOPEN_WITHIN_MS;
  } catch {
    return false;
  }
}
