'use client';

import { useEffect, useRef } from 'react';
import { PAGE_VIEW_DWELL_MS } from '@/lib/analytics/page-views';
import { trackSiteEvent } from '@/lib/analytics/site-analytics';

/** The depths of `article_read`, in percent of the way to the end of the post. */
const DEPTHS = [25, 50, 75, 100] as const;

/**
 * Thin fixed bar at the top of the viewport tracking how far the reader has scrolled through the
 * article body, reaching 100% at the `#blog-progress-end` marker rather than the end of the page.
 * The scroll handler only reads `scrollY` and writes a `scaleX` transform to a ref; the marker is
 * measured again only when the document changes size.
 *
 * The same progress is counted as `article_read`, once per depth (25, 50, 75, 100) per page view,
 * and only after the page has been in front for {@link PAGE_VIEW_DWELL_MS}, so a post short enough
 * to fit the screen does not report a full read to somebody who left at once.
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

    const openedAt = performance.now();
    const reported = new Set<number>();
    const reportDepth = (progress: number) => {
      if (performance.now() - openedAt < PAGE_VIEW_DWELL_MS) return;
      if (document.visibilityState !== 'visible') return;
      for (const depth of DEPTHS) {
        if (progress * 100 >= depth && !reported.has(depth)) {
          reported.add(depth);
          trackSiteEvent('article_read', { depth });
        }
      }
    };

    const apply = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const progress = max > 0 ? Math.min(1, Math.max(0, scrollTop / max)) : 0;
      bar.style.transform = `scaleX(${progress})`;
      reportDepth(progress);
    };

    // A reader who scrolled to the end inside the wait and stays has no more scrolls to report it.
    const dwellTimer = setTimeout(apply, PAGE_VIEW_DWELL_MS);

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
      clearTimeout(dwellTimer);
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
