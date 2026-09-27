'use client';

import { useEffect, useState, type RefObject } from 'react';

/**
 * Whether an element is on screen AND its tab is in front — the two conditions a sensor worth
 * pausing (the compass, a high-accuracy position watch) should run under.
 *
 * Watches the element from the render its ref is first filled in, so a component that renders
 * `null` at first and the element later still gets observed: `observed` is the ref's element as
 * of the last render, which the effect re-reads whenever it changes.
 */
export function useInViewAndFront(ref: RefObject<HTMLElement | null>, observed: unknown): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let inView = false;
    const update = () => setVisible(inView && document.visibilityState === 'visible');
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    observer.observe(el);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, [ref, observed]);
  return visible;
}
