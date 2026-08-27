import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

/**
 * One column of a park panel: hairline rules on the right and bottom, and the padding they need.
 *
 * The dividers are drawn by every cell carrying a right and bottom hairline while the wrapper
 * clips the trailing ones — see {@link PanelGrid}. Written instead as `border-r` on all but the
 * last child it is only correct at the widest column count and puts a stray rule at the end of
 * the row at two and one.
 */
export const PANEL_CELL = 'border-border/50 flex flex-col gap-3 border-r border-b px-5 py-4';

/**
 * The grid the cells sit in.
 *
 * `-mr-px -mb-px` plus the caller's `overflow-hidden` clip the trailing hairlines, so the rules
 * stay correct at every column count. The count is passed rather than written into a class because
 * columns are conditional on both panels that use this: at a fixed `lg:grid-cols-4` a park with no
 * headliners and no showtimes left two empty tracks sitting inside the panel's border, which is
 * exactly what shipped once.
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
        '-mr-px -mb-px grid grid-cols-1 sm:grid-cols-2',
        columnCount >= 4 && 'lg:grid-cols-4',
        columnCount === 3 && 'lg:grid-cols-3',
        columnCount === 2 && 'lg:grid-cols-2',
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
