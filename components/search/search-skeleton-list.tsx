import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * The search dropdown's pending body (a group heading and N result rows) for every surface that
 * stands in for the real list. Its own module, free of `next/image`, cmdk and the result tree,
 * because the hero's static shell paints it. Every box has the height of the row it stands in for,
 * so the list does not jump when the real rows replace it. A row's padding comes from the surface's cmdk root, so
 * `rowClassName` passes it in; the default matches the palette, see
 * {@link HERO_SKELETON_ROW_CLASS} for the hero's.
 */

/**
 * The hero's resting rows from `md` up: a fixed 60 px, because a row's content is 44 px for a shut
 * park and 50 px for an open one with its wait badge, and the hero reserves the list's height; the
 * open row's extra 6 px stay inside its padding. The real rows take {@link HERO_ROW_CLASS}.
 */
export const HERO_SKELETON_ROW_CLASS = 'h-15 py-0 sm:py-0';

/** The real rows' half of {@link HERO_SKELETON_ROW_CLASS}; the padding is the panel root's. */
export const HERO_ROW_CLASS = 'h-15';

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
  /** How many rows: the palette four, the hero what its resting list holds. */
  rows: number;
  /** Padding utilities matching this surface's real rows. */
  rowClassName?: string;
  /**
   * Padding utilities matching this surface's real group heading, or `null` where the surface
   * draws its heading outside the list (the hero).
   */
  headingClassName?: string | null;
  /** Classes of the list's own box, which the hero gives its rows' reserved height. */
  className?: string;
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
  className,
}: SearchSkeletonListProps) {
  return (
    <div aria-hidden="true" className={cn('p-1', className)}>
      {headingClassName !== null && (
        <div className={cn('text-[10px]', headingClassName)}>
          <Skeleton as="span" className="inline-block h-2 w-16 rounded-full" />
        </div>
      )}
      {Array.from({ length: rows }, (_, i) => ROW_WIDTHS[i % ROW_WIDTHS.length]).map((width, i) => (
        <SkeletonItem key={i} width={width} className={rowClassName} />
      ))}
    </div>
  );
}
