'use client';

import { useCallback } from 'react';
import { trackSiteEvent } from '@/lib/analytics/site-analytics';
import type { ParkyElement } from '@/lib/analytics/parky-elements';

/** What a page view has counted already, so a park page with five walk-on cards counts one. */
const seenOnPage = new Set<string>();
let seenPath = '';

function countSeen(element: ParkyElement): void {
  const path = window.location.pathname;
  if (path !== seenPath) {
    seenOnPage.clear();
    seenPath = path;
  }
  const key = `${element.element}:${element.kind}`;
  if (seenOnPage.has(key)) return;
  seenOnPage.add(key);
  trackSiteEvent('parky_element_seen', element);
}

/**
 * A ref for the part of a Parky element a visitor can press: sends `parky_element_seen` the first
 * time half of it is on screen, once per page view and element kind. Only on the pressable part,
 * which stands only where Parky shows for this visitor, so seen and clicked count the same people
 * and their ratio is a click rate. `undefined` counts nothing.
 */
export function useParkyElementSeen(element: ParkyElement | undefined) {
  const name = element?.element;
  const kind = element?.kind;
  return useCallback(
    (node: Element | null) => {
      if (!node || !name || !kind) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer.disconnect();
          countSeen({ element: name, kind } as ParkyElement);
        },
        { threshold: 0.5 }
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [name, kind]
  );
}
