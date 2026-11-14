'use client';

import { useEffect } from 'react';
import { trackSiteEvent } from '@/lib/analytics/site-analytics';
import { isSeenSection, SECTION_SEEN_ATTRIBUTE } from '@/lib/analytics/section-seen';

/** The marks a mounted tracker watches, so a second tracker on the page leaves them to it. */
const watched = new WeakSet<Element>();

/**
 * Sends `section_seen` the first time each `SectionMark` of the page comes on screen. One observer
 * for all marks, each dropped once it has reported, so a page view counts a place at most once.
 * Mounted with the page whose marks it reads, after them: `ParkPageShell` on a park's pages, the
 * planner band on the pages it stands on. Renders nothing.
 */
export function SectionSeenTracker() {
  useEffect(() => {
    const marks = [...document.querySelectorAll(`[${SECTION_SEEN_ATTRIBUTE}]`)].filter(
      (mark) => !watched.has(mark)
    );
    if (marks.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        const section = entry.target.getAttribute(SECTION_SEEN_ATTRIBUTE);
        if (isSeenSection(section)) trackSiteEvent('section_seen', { section });
      }
    });
    for (const mark of marks) {
      watched.add(mark);
      observer.observe(mark);
    }
    return () => {
      observer.disconnect();
      for (const mark of marks) watched.delete(mark);
    };
  }, []);

  return null;
}
