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
  /** Which side the exhibit is drawn on from `lg` up. Alternate it per chapter. */
  exhibitSide?: 'start' | 'end';
  /** The chapter's prose and its links. */
  children: ReactNode;
  className?: string;
}) {
  const exhibitAtStart = exhibitSide === 'start';

  return (
    <div
      className={cn(
        'grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-12',
        className
      )}
    >
      <Reveal className={cn(exhibitAtStart && 'lg:order-2')}>{children}</Reveal>

      <div className={cn(exhibitAtStart ? 'lg:order-1 lg:-ml-8 xl:-ml-14' : 'lg:-mr-8 xl:-mr-14')}>
        {exhibit}
      </div>
    </div>
  );
}
