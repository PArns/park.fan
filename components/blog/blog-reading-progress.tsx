'use client';

import { useEffect, useState } from 'react';

/**
 * Thin fixed bar at the top of the viewport tracking how far the reader has
 * scrolled through the article body. Progress reaches 100% at the end of the
 * post content (the `#blog-progress-end` marker), not the end of the page — so
 * the references, related posts and footer below it don't count. State only
 * updates from the scroll handler, never synchronously inside the effect.
 */
export function BlogReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const end = document.getElementById('blog-progress-end');
      let max: number;
      if (end) {
        // Document Y of the marker minus one viewport: the scroll position at
        // which the end of the article reaches the bottom of the screen.
        max = end.getBoundingClientRect().top + scrollTop - window.innerHeight;
      } else {
        const doc = document.documentElement;
        max = doc.scrollHeight - doc.clientHeight;
      }
      setProgress(max > 0 ? Math.min(100, Math.max(0, (scrollTop / max) * 100)) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5"
      aria-hidden="true"
    >
      <div className="bg-primary h-full origin-left" style={{ width: `${progress}%` }} />
    </div>
  );
}
