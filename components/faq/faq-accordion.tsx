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
 * One list of questions, for every FAQ on the site. The whole summary is the click target, the
 * chevron turns 180°, and the answer sits under a hairline. The icon is optional: the editorial
 * FAQ arrays carry none. Every answer stays in the served HTML (a collapsed `<details>` is in the
 * DOM), and the caller emits the `FAQPage` JSON-LD from the same array. `panel` padding fills a
 * {@link ChapterPanel} edge to edge; `flush` drops it for a prose column. The width asks
 * `@container/page`, since the trip planner insets the page.
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
