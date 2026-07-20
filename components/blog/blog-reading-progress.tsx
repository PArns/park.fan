'use client';

import { useEffect, useRef } from 'react';

/**
 * Thin fixed bar at the top of the viewport tracking how far the reader has
 * scrolled through the article body. Progress reaches 100% at the end of the
 * post content (the `#blog-progress-end` marker), not the end of the page — so
 * the references, related posts and footer below it don't count.
 *
 * Driven imperatively: the scroll handler only reads `scrollY` and writes a
 * compositor-friendly `transform: scaleX(...)` to a ref — no React re-render
 * and no forced layout per scroll frame. The expensive part (locating the end
 * marker via getBoundingClientRect) runs once and again only when the document
 * actually changes size (images/lazy content loading in, viewport resize).
 */
export function BlogReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    // Document-space scroll position at which the bar reaches 100%. Cached so
    // the per-scroll work stays layout-read-free.
    let max = 0;

    const measureMax = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const end = document.getElementById('blog-progress-end');
      if (end) {
        // Document Y of the marker minus one viewport: the scroll position at
        // which the end of the article reaches the bottom of the screen.
        max = end.getBoundingClientRect().top + scrollTop - window.innerHeight;
      } else {
        const doc = document.documentElement;
        max = doc.scrollHeight - doc.clientHeight;
      }
    };

    const apply = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const progress = max > 0 ? Math.min(1, Math.max(0, scrollTop / max)) : 0;
      bar.style.transform = `scaleX(${progress})`;
    };

    // rAF-throttle the scroll path (scroll can fire more than once per frame).
    let frame: number | null = null;
    const onScroll = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        apply();
      });
    };

    // Re-measure only when layout really changed. Observing <body> tracks
    // content growth (images without dimensions, lazy sections); the window
    // resize listener covers viewport height changes.
    let measureFrame: number | null = null;
    const scheduleMeasure = () => {
      if (measureFrame !== null) return;
      measureFrame = requestAnimationFrame(() => {
        measureFrame = null;
        measureMax();
        apply();
      });
    };

    measureMax();
    apply();

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(document.body);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', scheduleMeasure, { passive: true });
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      if (measureFrame !== null) cancelAnimationFrame(measureFrame);
      resizeObserver.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', scheduleMeasure);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5" aria-hidden="true">
      <div
        ref={barRef}
        className="bg-primary h-full w-full origin-left"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  );
}
