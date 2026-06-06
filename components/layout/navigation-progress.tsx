'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Thin top-of-viewport progress bar shown during client-side navigations — so a click feels
 * acknowledged instantly (the way GitHub/YouTube do it), even while the next route is still
 * being fetched/streamed.
 *
 * No dependency: it's driven by CSS width/opacity transitions. It starts on a same-origin link
 * click or a `history.pushState` (router navigation), trickles toward ~90 %, and snaps to 100 %
 * (then fades) when the new route's `pathname`/`searchParams` land. A safety timeout finishes it
 * if a navigation never resolves to a route change.
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
    setFading(true);
    fadeOut.current = setTimeout(() => {
      setProgress(0);
      setFading(false);
    }, 240);
  }, []);
  finishRef.current = finish;

  const start = useCallback(() => {
    if (active.current) return;
    active.current = true;
    if (fadeOut.current) clearTimeout(fadeOut.current);
    setFading(false);
    setProgress(8);
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

    const originalPushState = window.history.pushState;
    window.history.pushState = function patchedPushState(
      this: History,
      ...args: Parameters<History['pushState']>
    ) {
      const dest = args[2];
      if (dest != null) {
        try {
          const url = new URL(dest.toString(), window.location.href);
          if (url.pathname !== window.location.pathname || url.search !== window.location.search) {
            start();
          }
        } catch {
          /* ignore malformed URLs */
        }
      }
      return originalPushState.apply(this, args);
    };

    document.addEventListener('click', onClick, true);
    return () => {
      window.history.pushState = originalPushState;
      document.removeEventListener('click', onClick, true);
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
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-0.5">
      <div
        className="bg-park-primary h-full origin-left transition-[width,opacity] ease-out"
        style={{
          width: `${progress}%`,
          opacity: fading ? 0 : 1,
          transitionDuration: fading ? '220ms' : '300ms',
        }}
      />
    </div>
  );
}
