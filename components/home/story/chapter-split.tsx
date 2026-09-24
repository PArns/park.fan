import type { ReactNode } from 'react';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { cn } from '@/lib/utils';

/**
 * A chapter's body as an argument beside its exhibit, alternating down the page.
 *
 * Every chapter used to be "heading, then a full-width grid", which reads the
 * same however good the individual section is — the page had one rhythm and
 * fourteen chances to use it. This is the other one: the prose in a narrow
 * column, the live component wide beside it and running off the container edge,
 * and the sides swapping from one chapter to the next.
 *
 * Three decisions are load-bearing.
 *
 * **The prose comes first in the DOM, whichever side it is drawn on.** The
 * exhibit is a table of numbers; the argument for reading it belongs ahead of it
 * for a screen reader and for a crawler. `order` moves the box, never the source.
 * Below a 768 px page the prose is drawn under the exhibit: a phone reads the
 * chapter as heading, then the live component, then the argument behind "show
 * more" (PAR-435). Every switch here asks the page's width, not the window's,
 * so the collapse and the two-column grid cannot disagree while the trip
 * planner narrows the page.
 *
 * **The exhibit is not wrapped in `Reveal`.** `Reveal` keeps a `translate-y-0`
 * on its wrapper for good, and a transform makes that wrapper a backdrop root —
 * any glass inside then has only the wrapper to sample and goes flat. Exhibits
 * here are real production components and several of them are `GlassCard`s, so
 * the entrance belongs to the text alone.
 *
 * **The bleed needs `overflow-x-clip` on the SECTION, never `overflow-hidden`.**
 * The overhang is what makes the component read as an object on the page rather
 * than a picture in a frame, and an unclipped one gives the document a
 * horizontal scrollbar. `hidden` would additionally make the section a scroll
 * container, which breaks any sticky inside it.
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
