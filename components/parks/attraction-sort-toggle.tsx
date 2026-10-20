'use client';

import { cn } from '@/lib/utils';
import type { AttractionSort } from '@/lib/hooks/use-attraction-filter';

interface AttractionSortToggleProps {
  value: AttractionSort;
  onChange: (sort: AttractionSort) => void;
  labels: Record<AttractionSort, string>;
  className?: string;
}

/**
 * The ride list's order, two segments in one glass box: by land, or shortest wait first. Same
 * height and lit state as the panel's pills (`FilterToggle`), but a choice between two orders,
 * not a switch, so each segment is a pressed button of its own.
 */
export function AttractionSortToggle({
  value,
  onChange,
  labels,
  className,
}: AttractionSortToggleProps) {
  return (
    <div
      role="group"
      className={cn(
        'border-border/60 bg-background/60 flex w-fit rounded-md border text-xs shadow-md backdrop-blur-md dark:bg-[oklch(0.12_0.025_241_/_0.55)]',
        className
      )}
    >
      {(['land', 'wait'] as const).map((sort) => (
        <button
          key={sort}
          type="button"
          aria-pressed={value === sort}
          onClick={() => value !== sort && onChange(sort)}
          className={cn(
            'h-9 touch-manipulation rounded-[5px] px-3 whitespace-nowrap transition-colors max-sm:h-11',
            value === sort
              ? 'bg-primary/15 text-primary dark:bg-primary/10'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {labels[sort]}
        </button>
      ))}
    </div>
  );
}
