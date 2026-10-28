import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  HERO_PHONE_LIST_CLASS,
  HERO_PHONE_READING_CLASS,
  HERO_PHONE_READING_ROW_CLASS,
  HERO_PHONE_ROW_CLASS,
} from '@/components/search/hero-search-classes';

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
 * The hero's resting rows from `md` up: a fixed 60 px, because a row's content is 44 px for a shut
 * park and 50 px for an open one with its wait badge, and the hero reserves the list's height; the
 * open row's extra 6 px stay inside its padding. The real rows take {@link HERO_ROW_CLASS}.
 */
export const HERO_SKELETON_ROW_CLASS = 'h-15 py-0 sm:py-0';

/** The real rows' half of {@link HERO_SKELETON_ROW_CLASS}; the padding is the panel root's. */
export const HERO_ROW_CLASS = 'h-15';

/**
 * The hero's two posts under its resting list: a hairline above, two columns, cmdk's group padding.
 * Here rather than beside the posts, so the shell's skeleton of them pulls in no image or cmdk.
 */
export const HERO_READING_GROUP_CLASS =
  'border-foreground/10 border-t [&_[cmdk-group-items]]:grid [&_[cmdk-group-items]]:grid-cols-2 [&_[cmdk-group-items]]:gap-1';

/**
 * A post row's box. Fixed, like `MOST_READ_ROW_HEIGHT`, so the skeleton and the posts that replace
 * it take the same room, whatever the ranking picks: a 16 px kicker, two 18 px title lines and two
 * 16 px teaser lines inside the hero's row padding.
 */
export const HERO_READING_ROW_CLASS = 'h-25 gap-3';

/** The two posts as the shell draws them, in the box {@link HERO_READING_GROUP_CLASS} gives them. */
export function HeroReadingSkeleton() {
  return (
    <div aria-hidden="true" className="border-foreground/10 border-t px-1.5 py-1">
      <div className="grid grid-cols-2 gap-1">
        {[0, 1].map((i) => (
          <div key={i} className={cn('flex items-start px-3 py-2', HERO_READING_ROW_CLASS)}>
            <div className="bg-foreground/10 h-10 w-16 shrink-0 animate-pulse rounded-md" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-1">
              <div className="bg-foreground/[8%] h-2.5 w-20 animate-pulse rounded-full" />
              <div className="bg-foreground/10 h-3 w-full animate-pulse rounded-full" />
              <div className="bg-foreground/10 h-3 w-3/5 animate-pulse rounded-full" />
              <div className="bg-foreground/[8%] h-2.5 w-full animate-pulse rounded-full" />
              <div className="bg-foreground/[8%] h-2.5 w-4/5 animate-pulse rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Widths of the name bars, so successive rows do not read as one grey block. */
const ROW_WIDTHS = ['55%', '72%', '48%', '65%', '58%'];

/**
 * The hero's phone list while it waits, in the boxes of `HeroPhoneList`: rows of a thumbnail, a
 * name and two small pills, then the two posts' rows of a kicker and a title.
 */
export function HeroPhoneSkeleton({ rows, reading }: { rows: number; reading: boolean }) {
  return (
    <div aria-hidden="true">
      <div className={HERO_PHONE_LIST_CLASS}>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className={cn('flex items-center gap-2.5 px-3', HERO_PHONE_ROW_CLASS)}>
            <div className="bg-foreground/10 size-9 shrink-0 animate-pulse rounded-lg" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div
                className="bg-foreground/10 h-3.5 animate-pulse rounded-full"
                style={{ width: ROW_WIDTHS[i % ROW_WIDTHS.length] }}
              />
              <div className="flex gap-1.5">
                <div className="bg-foreground/[8%] h-[18px] w-16 animate-pulse rounded-full" />
                <div className="bg-foreground/[8%] h-[18px] w-12 animate-pulse rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
      {reading && (
        <div className={HERO_PHONE_READING_CLASS}>
          {[0, 1].map((i) => (
            <div
              key={i}
              className={cn('flex items-center gap-2.5 px-3', HERO_PHONE_READING_ROW_CLASS)}
            >
              <div className="flex w-9 shrink-0 justify-center">
                <div className="bg-foreground/10 size-4 animate-pulse rounded" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="bg-foreground/[8%] h-2 w-20 animate-pulse rounded-full" />
                <div
                  className="bg-foreground/10 h-3 animate-pulse rounded-full"
                  style={{ width: ROW_WIDTHS[(i + 1) % ROW_WIDTHS.length] }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
