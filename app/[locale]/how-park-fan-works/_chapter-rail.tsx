'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Chapter } from '@/lib/howto/chapters';

/**
 * The chapter list at the top of the guide, numbered as the chapters are: the page's one chapter
 * `<nav>`, an `<ol>` because the chapters have an order. The rail below repeats it as dots.
 */
export function ChapterList({ chapters, ariaLabel }: { chapters: Chapter[]; ariaLabel: string }) {
  return (
    <nav aria-label={ariaLabel} className="bg-muted/40 not-prose rounded-2xl border p-5 text-sm">
      <ol className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
        {chapters.map((c) => (
          <li key={c.id}>
            <a
              href={`#${c.id}`}
              className="text-muted-foreground hover:text-primary group flex items-baseline gap-2 transition-colors"
            >
              <span className="text-primary/40 group-hover:text-primary/70 text-xs font-bold tabular-nums transition-colors">
                {c.index}
              </span>
              {c.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * A fixed rail of chapter dots down the right edge, marking the chapter the reader is in. Only
 * above `xl`, where there is a gutter for it; the chapter list at the top covers a phone. Fixed,
 * so it cannot shift layout however late it picks the active dot, and without JavaScript it is
 * still a plain table of contents. A `<div>`, not a second `<nav>`: it repeats `ChapterList`, and
 * two landmarks with one name tell a reader nothing about which is which.
 */
export function ChapterRail({ chapters, ariaLabel }: { chapters: Chapter[]; ariaLabel: string }) {
  const [active, setActive] = useState(chapters[0]?.id ?? '');

  useEffect(() => {
    const sections = chapters
      .map((c) => document.getElementById(c.id))
      .filter((el): el is HTMLElement => el != null);
    if (sections.length === 0) return;

    // Same band as the wait-scale stage uses: a chapter owns the rail while its
    // heading region sits in the middle of the viewport. Topmost intersecting
    // section wins, so scrolling up hands the marker back in the same order.
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: '-30% 0px -55% 0px' }
    );
    sections.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [chapters]);

  return (
    <div
      aria-label={ariaLabel}
      role="group"
      className="pointer-events-none fixed top-1/2 right-4 z-30 hidden -translate-y-1/2 xl:block"
    >
      <ol className="flex flex-col gap-1">
        {chapters.map((c) => {
          const isActive = c.id === active;
          return (
            <li key={c.id} className="pointer-events-auto">
              <a
                href={`#${c.id}`}
                aria-current={isActive ? 'true' : undefined}
                className="group flex items-center justify-end gap-2 py-1"
              >
                {/* The label rides in on hover or focus. Width is animated, not display, so the
                    dots never jump against each other. aria-hidden: the sr-only span below carries
                    the same text. */}
                <span
                  aria-hidden
                  className={cn(
                    'bg-popover/90 text-foreground max-w-0 overflow-hidden rounded-md text-xs',
                    'whitespace-nowrap opacity-0 shadow-sm backdrop-blur-sm transition-all duration-200',
                    'group-hover:max-w-[14rem] group-hover:px-2 group-hover:py-1 group-hover:opacity-100',
                    'group-focus-visible:max-w-[14rem] group-focus-visible:px-2 group-focus-visible:py-1',
                    'group-focus-visible:opacity-100'
                  )}
                >
                  <span className="text-muted-foreground tabular-nums">{c.index}</span> {c.label}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    'block rounded-full transition-all duration-300',
                    isActive
                      ? 'bg-primary h-6 w-1.5'
                      : 'bg-foreground/25 group-hover:bg-foreground/50 h-1.5 w-1.5'
                  )}
                />
                <span className="sr-only">
                  {c.index} {c.label}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
