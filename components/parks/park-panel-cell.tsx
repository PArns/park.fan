import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

/**
 * One column of a park panel: hairline rules on the right and bottom, and the padding they need.
 * Every cell carries both hairlines and the wrapper clips the trailing ones (see {@link
 * PanelGrid}); `border-r` on all but the last child would be right only at the widest column count.
 */
export const PANEL_CELL = 'border-border/50 flex flex-col gap-3 border-r border-b px-5 py-4';

/**
 * The grid the cells sit in. `-mr-px -mb-px` plus the caller's `overflow-hidden` clip the trailing
 * hairlines at every column count. The count is passed in because columns are conditional in both
 * panels that use this, and a fixed track set leaves empty tracks inside the border;
 * `sm:grid-cols-2` is part of that count, so a single cell never draws its hairline down the middle
 * of the box.
 */
export function PanelGrid({
  columnCount,
  className,
  children,
}: {
  columnCount: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        '-mr-px -mb-px grid grid-cols-1',
        columnCount >= 2 && 'sm:grid-cols-2',
        columnCount >= 4 && '@min-[1024px]/page:grid-cols-4',
        columnCount === 3 && '@min-[1024px]/page:grid-cols-3',
        columnCount === 2 && '@min-[1024px]/page:grid-cols-2',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * A caption and its value inside a {@link PANEL_CELL}.
 *
 * The caption is the small uppercase line the park header uses throughout — the label of a
 * reading, not a heading. `min-w-0` because several of these hold a truncating name.
 */
export function PanelMetric({
  caption,
  icon: Icon,
  action,
  children,
}: {
  caption: string;
  icon?: LucideIcon;
  /** Pushed to the caption's right — a count, an average, a link. */
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold tracking-[0.08em] uppercase">
          {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
          {caption}
        </span>
        {action}
      </div>
      {children}
    </div>
  );
}
