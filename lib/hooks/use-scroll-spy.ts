'use client';

import { useEffect, useRef, useState } from 'react';

/** How far below the viewport top a section counts as reached: clears the 48 px header. */
const SPY_OFFSET = 120;

/**
 * Scroll-spy for a sticky table of contents: the id of the last element in `ids` whose top has
 * scrolled past {@link SPY_OFFSET}, and a ref for the link that shows it, which is kept in view
 * inside the nearest `data-toc-scroll` box. Positions are measured on layout changes only, so the
 * per-scroll path is a plain `scrollY` comparison. `enabled` is the question the markup answers
 * (a `hidden lg:block` list passes its media query) so a hidden list does not spy.
 */
export function useScrollSpy(ids: readonly string[], enabled = true) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let tops: { id: string; top: number }[] = [];
    const measureTops = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      tops = [];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el) tops.push({ id, top: el.getBoundingClientRect().top + scrollTop });
      }
    };

    const apply = () => {
      const y = (window.scrollY || document.documentElement.scrollTop) + SPY_OFFSET;
      let current: string | null = null;
      for (const t of tops) {
        if (t.top <= y) current = t.id;
        else break;
      }
      setActiveId(current);
    };

    let frame: number | null = null;
    const onScroll = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        apply();
      });
    };

    let measureFrame: number | null = null;
    const scheduleMeasure = () => {
      if (measureFrame !== null) return;
      measureFrame = requestAnimationFrame(() => {
        measureFrame = null;
        measureTops();
        apply();
      });
    };

    // ResizeObserver delivers an initial callback right after observe(), so the first measure
    // runs async — that also highlights the right section on an anchor-link load.
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
  }, [ids, enabled]);

  // Scrolls only the sidebar's own box, never the window, and only when it overflows.
  useEffect(() => {
    if (!activeId) return;
    const link = activeRef.current;
    const container = link?.closest('[data-toc-scroll]');
    if (!link || !(container instanceof HTMLElement)) return;
    if (container.scrollHeight <= container.clientHeight) return;
    const pad = 24;
    const linkRect = link.getBoundingClientRect();
    const boxRect = container.getBoundingClientRect();
    if (linkRect.top < boxRect.top + pad) {
      container.scrollTop -= boxRect.top + pad - linkRect.top;
    } else if (linkRect.bottom > boxRect.bottom - pad) {
      container.scrollTop += linkRect.bottom - (boxRect.bottom - pad);
    }
  }, [activeId]);

  return { activeId, activeRef };
}
