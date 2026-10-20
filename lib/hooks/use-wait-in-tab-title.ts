import { useEffect } from 'react';

/**
 * Puts a ride's live wait into the browser tab title while the page is open, so a tab left in the
 * background still answers „how long now". `formatTitle` receives the title the server rendered and
 * returns the one to show; with a null `wait` the server title stays.
 *
 * Next writes the route's metadata title into the DOM again after hydration, and a navigation
 * within the page does too. Any title that is not ours is taken as the new server title and the
 * wait goes back on top of it. The cleanup puts the server title back, on every change of the wait
 * and on leaving the page.
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
      shown = formatTitle(wait, serverTitle);
      if (document.title !== shown) document.title = shown;
    };
    const observer = new MutationObserver(() => {
      if (document.title === shown) return;
      serverTitle = document.title;
      apply();
    });
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    apply();

    return () => {
      observer.disconnect();
      document.title = serverTitle;
    };
  }, [wait, formatTitle]);
}
