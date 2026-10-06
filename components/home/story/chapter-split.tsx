import type { ReactNode } from 'react';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { cn } from '@/lib/utils';

/**
 * A chapter's body as an argument beside its exhibit, the sides alternating down the page: the
 * prose in a narrow column, the live component wide beside it and running off the container edge.
 *
 * - The prose comes first in the DOM whichever side it is drawn on, ahead of the table for a
 *   screen reader and a crawler; `order` moves the box. Below a 768 px page it is drawn under the
 *   exhibit, behind "show more". Every switch asks the page's width, not the window's.
 * - The exhibit is not wrapped in `Reveal`, whose lasting transform would make its wrapper a
 *   backdrop root and flatten any glass inside.
 * - The bleed needs `overflow-x-clip` on the section, never `overflow-hidden`, which would make it
 *   a scroll container and break any sticky inside.
 */
export function ChapterSplit({
  exhibit,
  exhibitSide = 'end',
  children,
  className,
}: {
  /** The live component. Rendered wide, and allowed off the container edge. */
  exhibit: ReactNode;
  /** Which side the exhibit is drawn on from a 1024 px page up. Alternate it per chapter. */
  exhibitSide?: 'start' | 'end';
  /** The chapter's prose and its links. */
  children: ReactNode;
  className?: string;
}) {
  const exhibitAtStart = exhibitSide === 'start';

  return (
    <div
      className={cn(
        'grid gap-8 @min-[1024px]/page:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] @min-[1024px]/page:items-center @min-[1024px]/page:gap-12',
        className
      )}
    >
      <Reveal
        className={cn(
          '@max-[768px]/page:order-last',
          exhibitAtStart && '@min-[1024px]/page:order-2'
        )}
      >
        {children}
      </Reveal>

      <div
        className={cn(
          exhibitAtStart
            ? '@min-[1024px]/page:order-1 @min-[1024px]/page:-ml-8 @min-[1280px]/page:-ml-14'
            : '@min-[1024px]/page:-mr-8 @min-[1280px]/page:-mr-14'
        )}
      >
        {exhibit}
      </div>
    </div>
  );
}
