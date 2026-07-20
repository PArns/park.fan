'use client';

import { useEffect, useState } from 'react';

/**
 * True while the attached element is in (or near) the viewport AND the tab is
 * visible. Drives pausable per-second work — countdown intervals, the hero
 * typewriter, chart "now"-marker ticks — so timers stop burning CPU (and
 * re-rendering) while their element is scrolled away or the tab is in the
 * background.
 *
 * Attach via the returned callback ref (`<div ref={ref}>`): it is state-backed,
 * so the observer correctly re-attaches when the target element is swapped or
 * temporarily unmounted (skeleton → live content, conditional renders).
 *
 * `active` starts `false` and flips on the first observer callback right after
 * mount — gate *effects* with it, never rendered output (SSR/hydration markup
 * must not depend on it).
 */
export function useActiveOnScreen(rootMargin: string = '100px'): {
  ref: (element: Element | null) => void;
  active: boolean;
} {
  const [element, setElement] = useState<Element | null>(null);
  const [onScreen, setOnScreen] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    if (!element) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setOnScreen(entry.isIntersecting);
        // Also stamp the tab state: for a load in a background tab there is no
        // visibilitychange until the user switches over, and the initial `true`
        // would otherwise let timers run hidden until then.
        setTabVisible(!document.hidden);
      },
      { rootMargin }
    );
    io.observe(element);
    return () => {
      io.disconnect();
      // Element went away (or is being swapped) — don't leave a stale `true`
      // behind for the next element's pre-observer frames.
      setOnScreen(false);
    };
  }, [element, rootMargin]);

  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return { ref: setElement, active: element != null && onScreen && tabVisible };
}
