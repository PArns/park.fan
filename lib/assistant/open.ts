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
