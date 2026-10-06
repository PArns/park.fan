'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { onHistoryNavigation } from '@/lib/navigation/history-navigation';

/**
 * Thin top-of-viewport progress bar for client-side navigations, so a click feels acknowledged
 * while the next route streams. It starts on a same-origin link click or a history push/replace,
 * trickles toward 90 % and finishes when the route's `pathname`/`searchParams` land; a safety
 * timeout ends it if no route change comes.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);

  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const safety = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeOut = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useRef(false);
  // Lets `start` schedule `finish` without a useCallback dependency cycle.
  const finishRef = useRef<() => void>(() => {});

  const clearLoadTimers = () => {
    if (trickle.current) clearInterval(trickle.current);
    if (safety.current) clearTimeout(safety.current);
    trickle.current = null;
    safety.current = null;
  };

  const finish = useCallback(() => {
    if (!active.current) return;
    active.current = false;
    clearLoadTimers();
    setProgress(100);
    // Let the bar visibly reach 100 % before the fade starts — fading immediately
    // would hide it mid-run and make it look like it never completed.
    fadeOut.current = setTimeout(() => {
      setFading(true);
      fadeOut.current = setTimeout(() => {
        setProgress(0);
        setFading(false);
      }, 220);
    }, 160);
  }, []);
  useEffect(() => {
    finishRef.current = finish;
  }, [finish]);

  const start = useCallback(() => {
    if (active.current) return;
    active.current = true;
    if (fadeOut.current) clearTimeout(fadeOut.current);
    // `history.pushState` is patched, so `start` can fire inside React's insertion-effect phase,
    // where a synchronous state update throws. The visual updates wait one microtask; the `active`
    // guard and the timers stay synchronous.
    queueMicrotask(() => {
      setFading(false);
      setProgress(8);
    });
    // Ease toward 90 % so the bar keeps creeping while the route loads.
    trickle.current = setInterval(() => {
      setProgress((p) => (p >= 90 ? 90 : p + Math.max(0.4, (90 - p) * 0.1)));
    }, 300);
    // Never leave it stuck if a navigation doesn't end in a route change.
    safety.current = setTimeout(() => finishRef.current(), 10_000);
  }, []);

  // START — same-origin link clicks + programmatic navigations (router.push patches pushState).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      const anchor = (e.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;
      const target = anchor.getAttribute('target');
      if ((target && target !== '_self') || anchor.hasAttribute('download')) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Same page (or pure hash change) — no navigation, no bar.
      if (url.pathname === window.location.pathname && url.search === window.location.search)
        return;
      start();
    };

    // router.push uses pushState, router.replace (e.g. the locale switcher) uses replaceState.
    // Listeners run before the History call lands, so `window.location` is still the old route.
    const unsubscribe = onHistoryNavigation((url) => {
      if (url.pathname !== window.location.pathname || url.search !== window.location.search) {
        start();
      }
    });

    // Bubble, not capture: the `e.defaultPrevented` guard is only ever true after the component
    // that prevents it has run, so in the capture phase a bell or star inside a link would start a
    // bar that hangs at 90 %. A handler that stops propagation is not navigating, and
    // `router.push` is caught by the pushState patch.
    document.addEventListener('click', onClick);
    return () => {
      unsubscribe();
      document.removeEventListener('click', onClick);
    };
  }, [start]);

  // END — the rendered route changed, so the navigation is done.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    finish();
  }, [pathname, searchParams, finish]);

  useEffect(
    () => () => {
      clearLoadTimers();
      if (fadeOut.current) clearTimeout(fadeOut.current);
    },
    []
  );

  if (progress === 0 && !fading) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px]">
      <div
        className="bg-primary h-full w-full origin-left transition-[transform,opacity] ease-out"
        style={{
          transform: `scaleX(${progress / 100})`,
          opacity: fading ? 0 : 1,
          // Finish fast so the run to 100 % completes before the fade kicks in.
          transitionDuration: fading ? '220ms' : progress === 100 ? '150ms' : '300ms',
        }}
      />
    </div>
  );
}
