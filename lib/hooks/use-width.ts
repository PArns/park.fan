'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * The width of an element, kept current with a `ResizeObserver`, so SVG text is drawn at its size:
 * the admin's charts and the trip planner's area map. `0` until the first report.
 */
export function useWidth<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    // The observer reports once when it starts watching, so no measuring is needed here.
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}
