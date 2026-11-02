const OPEN_EVENT = 'parkfan:parky-open';

/**
 * Opens Parky's chat window from elsewhere on the page, as the button on Parky's own page does.
 * The launcher hears it once its button shows; until then the request waits there.
 */
export function openParky(): void {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** Hears {@link openParky}; returns the unsubscribe. */
export function onParkyOpen(listener: () => void): () => void {
  window.addEventListener(OPEN_EVENT, listener);
  return () => window.removeEventListener(OPEN_EVENT, listener);
}
