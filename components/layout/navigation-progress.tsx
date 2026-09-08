'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { onHistoryNavigation } from '@/lib/navigation/history-navigation';

/**
 * Thin top-of-viewport progress bar shown during client-side navigations — so a click feels
 * acknowledged instantly (the way GitHub/YouTube do it), even while the next route is still
 * being fetched/streamed.
 *
 * No dependency: it's driven by CSS transform/opacity transitions. It starts on a same-origin link
 * click or a `history.pushState`/`replaceState` (router navigation), trickles toward ~90 %, runs
 * to 100 % and then fades when the new route's `pathname`/`searchParams` land. A safety timeout
 * finishes it if a navigation never resolves to a route change.
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
    // `history.pushState` is patched below, so `start` can fire from inside
    // React's insertion-effect phase (e.g. a `router.replace` during render /
    // on mount), where scheduling a state update synchronously throws
    // "useInsertionEffect must not schedule updates". Defer the visual updates
    // one microtask so they run just outside that phase. The `active` guard and
    // timers above stay synchronous so de-duping and timing are unaffected.
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

    // BUBBLE, not capture. The `e.defaultPrevented` guard above is the whole
    // point of this listener's politeness, and in the capture phase it can
    // never be true: document-level capture runs BEFORE the component whose
    // handler does the preventing. Every control that sits inside a link and
    // handles its own click — the wait-time alert bell, the show bell, the
    // favourite star — therefore started a navigation that never happened,
    // and the bar then crept to 90 % and hung there until the 10 s safety
    // timeout. Nothing is lost by waiting for the bubble: a handler that
    // stops propagation on its way up is by definition one that is not
    // navigating, and a programmatic `router.push` is caught by the
    // pushState patch above rather than here.
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
