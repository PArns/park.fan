import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * The search dropdown's pending body — a group heading and N result rows — rendered by every
 * surface that has to stand in for the real list.
 *
 * It is its own module, free of `next/image`, cmdk and the result tree, because one of those
 * surfaces is {@link HeroSearchRestingCard}: the static shell that paints the hero's resting
 * dropdown before the search chunk exists. Importing it from `search-result-items.tsx` would
 * drag the whole result tree into the shell's chunk, which is the one thing that file is not
 * allowed to do.
 *
 * **Every one of these boxes has to be the height of the row it stands in for.** The hero
 * reserves the dropdown's resting height in its own flow (`--hero-search-rest-h`), so a skeleton
 * that is not exactly as tall as the list it precedes moves the nearby pills underneath it. Three
 * versions of "the same" card had drifted apart — the shell's at 252 px, the panel's pending
 * state at 288 px, the settled list at 270 px — and the pill row hopped 19 px down when the panel
 * mounted and back up two seconds later when its data landed.
 *
 * A result row's height comes from its photo box plus the surface's own vertical padding, which
 * each surface sets on its cmdk root (`[&_[cmdk-item]]:py-*`): 2.5 in the hero, 3.5 in the
 * palette. A plain `<div>` is not a `[cmdk-item]`, so `rowClassName` passes that padding in
 * rather than this file guessing which surface it is on. The default matches the palette, which
 * is where these rows started.
 *
 * @see {@link HERO_SKELETON_ROW_CLASS} for the hero's.
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
export function SkeletonItem({ width, className }: SkeletonItemProps) {
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
 * Heading + rows, i.e. everything inside a pending dropdown above its footer.
 *
 * The bar standing in for the heading is **inline-block inside a `text-[10px]` line box**, not a
 * block-level bar. A block bar makes the box its own height — 8 px against the 13 px line the
 * real heading occupies, and those 4 px were part of the card's jump. Inline, the line box keeps
 * the height text would have given it and the bar sits inside it.
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
