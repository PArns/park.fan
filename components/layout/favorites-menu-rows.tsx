'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * The row-shaped vocabulary the header's favorites band shares between its groups.
 *
 * It sat inside `favorites-menu-panel.tsx` while that file was the only thing drawing rows. The
 * alerts group is lazily imported (its half of `lib/push` has no business in the chrome bundle of
 * ~35,000 pages), so it cannot reach into the panel's private helpers without importing the very
 * module that imports it. Same rows, one definition, no cycle.
 */

/** Rows per group in the sheet, where they are cheaper. */
export const MAX_ROWS = 5;

/**
 * The sheet's shape, and the shape of every group in the band that has no picture and no figure:
 * a 40 px box, two lines, something on the right.
 *
 * `action` is the one thing that does NOT go inside the link. A remove button nested in an
 * anchor is not a control a keyboard or a screen reader can reach on its own terms — the same
 * reason `SuggestionChip` puts its star beside the link rather than in it.
 */
export function Row({
  href,
  title,
  subtitle,
  image,
  imagePosition,
  leading,
  trailing,
  action,
}: {
  href: string;
  title: string;
  subtitle?: string | null;
  image?: string | null;
  imagePosition?: string;
  /** Drawn in the picture box for a group whose rows never have a picture. */
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <li className={action ? 'flex items-center gap-1' : undefined}>
      <Link
        href={href}
        prefetch={false}
        className={cn(
          'hover:bg-muted/60 -mx-2 flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors',
          // The bleed is what lets a row sit flush with the group's heading. On the right it
          // would pull the action back over the link's own padding, so that half is cancelled
          // and only the left edge keeps it.
          action && 'mr-0 min-w-0 flex-1'
        )}
      >
        {/* The box is always drawn, picture or not: a row that indents depending on which park it
            is reads as a rendering fault. */}
        <span className="bg-muted relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg">
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              sizes="40px"
              className="object-cover"
              style={{ objectPosition: imagePosition }}
            />
          ) : (
            leading
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-foreground block truncate text-sm font-medium">{title}</span>
          {subtitle && (
            <span className="text-muted-foreground block truncate text-xs">{subtitle}</span>
          )}
        </span>
        {trailing && <span className="shrink-0 text-right">{trailing}</span>}
      </Link>
      {action}
    </li>
  );
}

export function GroupHeading({ title, count }: { title: string; count: number }) {
  return (
    <div className="text-foreground border-border/60 mb-2.5 flex items-center justify-between gap-2 border-b pb-1.5 text-xs font-semibold tracking-wide uppercase">
      <span>{title}</span>
      <span className="text-muted-foreground/70 tabular-nums">{count}</span>
    </div>
  );
}

/**
 * `max` is the caller's own cap, not the sheet's: a group that slices its rows at `MAX_CARDS`
 * would otherwise reserve five and grow by three when the request lands.
 */
export function RowSkeletons({ count, max = MAX_ROWS }: { count: number; max?: number }) {
  return (
    <>
      {Array.from({ length: Math.min(count, max) }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-2 py-1.5">
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
          <span className="min-w-0 flex-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-1 h-3 w-16" />
          </span>
        </li>
      ))}
    </>
  );
}

/**
 * A row group's box before its content exists: the heading it is going to have, and as many
 * skeleton rows as it expects to fill.
 *
 * It is the `Suspense` fallback of the lazily imported alerts group, and it is a component rather
 * than an inline `<div>` because a placeholder has to reserve the group's HEIGHT and not only its
 * track in the band. An empty box held the 208 px slice and nothing else, so the chunk landing
 * dropped a heading plus three rows — about 210 px — into an open panel, and a server answering
 * "none" pulled it back out again.
 */
export function RowGroupSkeleton({
  title,
  count,
  max,
  className,
  style,
}: {
  title: string;
  count: number;
  max?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cn('min-w-0', className)} style={style}>
      <GroupHeading title={title} count={count} />
      <ul className="space-y-px">
        <RowSkeletons count={count} max={max} />
      </ul>
    </div>
  );
}

/**
 * „+3 weitere“ under a group that ran past its cap. `href` is where the rest actually is — the
 * homepage band for favorites, `/alerts` for the alerts group.
 */
export function MoreLine({
  hidden,
  label,
  href = '/#favorites',
}: {
  hidden: number;
  label: (n: number) => string;
  href?: string;
}) {
  if (hidden <= 0) return null;
  return (
    <li className="col-span-full px-2 pt-1">
      <Link
        href={href}
        prefetch={false}
        className="text-muted-foreground hover:text-foreground text-xs transition-colors"
      >
        {label(hidden)}
      </Link>
    </li>
  );
}
