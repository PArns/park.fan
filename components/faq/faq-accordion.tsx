import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FaqRow {
  question: string;
  answer: ReactNode;
  /** Optional leading glyph. Park and ride questions carry one; the editorial pages do not. */
  icon?: LucideIcon;
}

/**
 * One list of questions, for every FAQ on the site.
 *
 * There were three, and they disagreed about everything a reader would notice: the park page
 * stacked separate `Card`s, each drawing its own border over the park photo; the ride page had
 * the same until it became rows; and the editorial pages (`FaqList`) had rows with a chevron that
 * rotates the other way, no hover, no rule under the question, and different padding. Three
 * answers to „what does a question look like here".
 *
 * The row is the ride's: the whole summary is the click target, the chevron turns 180° so its
 * open state reads at a glance, and the answer sits under a hairline so a long one does not run
 * into the next question. The icon is optional because the editorial FAQ arrays carry none — an
 * invented one per question would be decoration with no meaning behind it.
 *
 * **Every answer stays in the served HTML.** A collapsed `<details>` is in the DOM, which is what
 * lets a crawler read all seven answers of a page that shows one; the `FAQPage` JSON-LD is
 * emitted by the caller from the same array it passes here, so the two cannot drift.
 *
 * Two paddings, because the list appears in two kinds of container. `panel` is for a
 * {@link ChapterPanel} whose box the rows fill edge to edge; `flush` drops the horizontal padding
 * for the editorial pages, where the list sits in a prose column and an indented question would
 * hang 16 px off the text above it. A negative margin would do the same and would be a number to
 * keep in step with the panel's.
 *
 * `@min-[768px]/page:px-6` and not `md:`: the trip planner's panel insets the page without the
 * window moving.
 */
export function FaqAccordion({
  items,
  padding = 'panel',
  className,
}: {
  items: FaqRow[];
  padding?: 'panel' | 'flush';
  className?: string;
}) {
  const inset = padding === 'panel' ? 'px-4 @min-[768px]/page:px-6' : '';
  return (
    <div className={cn('divide-border/50 divide-y', className)}>
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <details key={index} className="group">
            <summary
              className={cn(
                'hover:bg-muted/40 flex cursor-pointer list-none items-center justify-between gap-3 py-4 transition-colors',
                inset
              )}
            >
              <div className="flex items-center gap-3">
                {Icon && <Icon className="text-primary h-5 w-5 shrink-0" aria-hidden="true" />}
                <span className="text-left font-medium">{item.question}</span>
              </div>
              <ChevronDown
                className="text-muted-foreground h-5 w-5 shrink-0 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className={cn('text-muted-foreground border-border/50 border-t pt-3 pb-4', inset)}>
              {item.answer}
            </div>
          </details>
        );
      })}
    </div>
  );
}
