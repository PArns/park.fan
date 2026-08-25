'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * A fixed rail of chapter dots down the right edge, marking which chapter the
 * reader is in.
 *
 * Only above `xl`. Narrower than that there is no gutter to put it in without
 * either overlapping the measure or squeezing it, and the chapter list at the
 * top of the page already covers orientation on a phone.
 *
 * It is `position: fixed` and therefore out of flow, so it cannot contribute
 * layout shift however late it decides which dot is active. Without JavaScript
 * it renders every chapter as a plain anchor with the first one marked — still
 * a usable table of contents, just not a live one.
 */
export interface Chapter {
  id: string;
  index: string;
  label: string;
}

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
    <nav
      aria-label={ariaLabel}
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
                {/* The label rides in on hover/focus only. Width is animated, not
                    display, so the row height never changes and the rail cannot
                    nudge anything — it is fixed anyway, but the same rule keeps
                    the dots from jumping against each other. */}
                {/* aria-hidden: the sr-only span below carries the same index and
                    label, and without this a screen reader announced both. */}
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
    </nav>
  );
}
