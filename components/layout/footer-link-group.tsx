'use client';

import { Children, isValidElement, useId, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { MenuSectionHeading } from '@/components/layout/menu-section-heading';
import { cn } from '@/lib/utils';

/**
 * One column of the footer's link list: a plain column from `sm` up, a collapsed row below it, so
 * the footer does not take most of a phone screen. Folding hides with `max-sm:hidden` and never
 * unmounts, because the footer is part of the link graph and a crawler does not press buttons.
 * Each child becomes one item of the column's `<ul>`.
 */
export function FooterLinkGroup({ heading, children }: { heading: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const listId = useId();

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="text-foreground border-border/60 flex min-h-11 w-full items-center justify-between gap-2 border-b text-xs font-semibold tracking-wide uppercase sm:hidden"
      >
        {heading}
        <ChevronDown
          className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      <div className="max-sm:hidden">
        <MenuSectionHeading label={heading} />
      </div>
      <ul id={listId} className={cn('flex flex-col', !open && 'max-sm:hidden')}>
        {Children.toArray(children).map((child, i) => (
          // A flex column, so the link stays a stretched flex item as it was before the list.
          <li
            key={isValidElement(child) && child.key != null ? child.key : i}
            className="flex flex-col"
          >
            {child}
          </li>
        ))}
      </ul>
    </div>
  );
}
