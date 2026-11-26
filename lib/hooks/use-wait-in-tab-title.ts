import { useEffect } from 'react';

/**
 * Puts a ride's live wait into the browser tab title while the tab is in the background, so a tab
 * left behind still answers „how long now". `formatTitle` receives the title the server rendered
 * and returns the one to show; with a null `wait` the server title stays.
 *
 * Only a hidden tab gets the wait: a crawler that renders the page sees a visible document, and the
 * title it indexes must not carry a figure that is stale by the time the snippet is shown. A visible
 * tab needs no help either, the panel on the page shows the same number.
 *
 * Next writes the route's metadata title into the DOM again after hydration, and a navigation
 * within the page does too. Any title that is not ours is taken as the new server title. The
 * cleanup puts the server title back, on every change of the wait and on leaving the page, unless
 * something else has set a title since.
 */
export function useWaitInTabTitle(
  wait: number | null,
  formatTitle: (wait: number, serverTitle: string) => string
): void {
  useEffect(() => {
    if (wait === null) return;
    let serverTitle = document.title;
    let shown = '';

    const apply = () => {
      if (!serverTitle) return;
      if (!document.hidden) {
        if (shown && document.title === shown) document.title = serverTitle;
        shown = '';
        return;
      }
      shown = formatTitle(wait, serverTitle);
      if (document.title !== shown) document.title = shown;
    };
    const observer = new MutationObserver(() => {
      if (shown && document.title === shown) return;
      if (document.title === serverTitle) return;
      serverTitle = document.title;
      apply();
    });
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    document.addEventListener('visibilitychange', apply);
    apply();

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', apply);
      // After a navigation Next may already have written the next page's title.
      if (shown && document.title === shown) document.title = serverTitle;
    };
  }, [wait, formatTitle]);
}
