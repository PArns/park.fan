import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * The search dropdown's pending body (a group heading and N result rows) for every surface that
 * stands in for the real list. Its own module, free of `next/image`, cmdk and the result tree,
 * because {@link HeroSearchRestingCard} paints it in the static shell. Every box has the height of
 * the row it stands in for, since the hero reserves the dropdown's resting height and any
 * difference moves the nearby pills. A row's padding comes from the surface's cmdk root, so
 * `rowClassName` passes it in; the default matches the palette, see
 * {@link HERO_SKELETON_ROW_CLASS} for the hero's.
 */

/**
 * Hero row padding — matches `[&_[cmdk-item]]:py-2.5` on that panel's cmdk root at every width
 * (the `sm:` half is what keeps the palette's `sm:py-3.5` default from winning back).
 */
export const HERO_SKELETON_ROW_CLASS = 'py-2.5 sm:py-2.5';

/** Widths of the name bars, so successive rows do not read as one grey block. */
const ROW_WIDTHS = ['55%', '72%', '48%', '65%', '58%'];

interface SkeletonItemProps {
  width: string;
  /** The surface's own row padding — see the note above. */
  className?: string;
}

/** One placeholder result row, in the box a real `SearchResultRow` occupies. */
function SkeletonItem({ width, className }: SkeletonItemProps) {
  return (
    <div
      className={cn('flex items-center gap-2.5 rounded-lg px-3 py-2 sm:gap-4 sm:py-3.5', className)}
    >
      <div className="bg-foreground/10 h-9 w-9 shrink-0 animate-pulse rounded-lg sm:h-11 sm:w-11 sm:rounded-xl" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="bg-foreground/10 h-3.5 animate-pulse rounded-full" style={{ width }} />
          <div className="bg-foreground/[8%] h-4 w-14 animate-pulse rounded-full" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="bg-foreground/[8%] h-2.5 w-28 animate-pulse rounded-full" />
          <div className="bg-foreground/[8%] h-2.5 w-10 animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
}

interface SearchSkeletonListProps {
  /** How many rows — the hero shows three, the palette four. */
  rows: number;
  /** Padding utilities matching this surface's real rows. */
  rowClassName?: string;
  /** Padding utilities matching this surface's real group heading. */
  headingClassName?: string;
}

/**
 * Heading and rows, everything inside a pending dropdown above its footer. The heading's bar is
 * inline-block inside a `text-[10px]` line box, so the line keeps the height the real heading's
 * text gives it.
 */
export function SearchSkeletonList({
  rows,
  rowClassName,
  headingClassName = 'px-4 pt-3.5 pb-1',
}: SearchSkeletonListProps) {
  return (
    <div className="p-1">
      <div className={cn('text-[10px]', headingClassName)}>
        <Skeleton as="span" className="inline-block h-2 w-16 rounded-full" />
      </div>
      {ROW_WIDTHS.slice(0, rows).map((width, i) => (
        <SkeletonItem key={i} width={width} className={rowClassName} />
      ))}
    </div>
  );
}
