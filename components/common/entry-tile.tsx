import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The entry tile — one definition for both places it appears.
 *
 * A park page's tiles are real tabs (`TabsTrigger`), a ride page's are jump links to chapters
 * that stay in the HTML, so the two cannot share a component. They CAN share the box and the
 * icon chip, and they have to: both rows sit a few hundred pixels apart on the same park photo,
 * and a second copy of these classes is a second copy that drifts on the next restyle.
 *
 * The glass matches the rest of the page (`bg-background/60` + `backdrop-blur-md`, with the
 * hand-mixed dark value the search box and the empty-state card already use) rather than
 * `GlassCard`, which brings `p-6` and its own radius — at tile size that is a card, not a tile.
 */
export const entryTileBox = cn(
  'border-border/50 bg-background/60 flex h-auto w-full flex-col items-start justify-start gap-2',
  'rounded-xl border p-3.5 text-left whitespace-normal backdrop-blur-md transition-colors',
  'dark:bg-[oklch(0.12_0.025_241_/_0.55)]'
);

/** The icon chip. Square, so the row is scannable by shape before any label is read. */
export const entryTileChip =
  'bg-muted text-foreground flex h-8 w-8 items-center justify-center rounded-lg transition-colors';

/**
 * Icon chip + label, with the optional count inside the label rather than on a line of its own:
 * it is the only figure a tile can show without a query, and a second row would reserve height
 * on every tile for the two that have one.
 */
export function EntryTileBody({
  icon: Icon,
  label,
  count,
  chipClassName,
}: {
  icon: LucideIcon;
  label: string;
  count?: number;
  /** Extra chip classes — the park tabs light theirs up on `data-[state=active]`. */
  chipClassName?: string;
}) {
  return (
    <>
      <span className={cn(entryTileChip, chipClassName)}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="text-sm leading-tight font-semibold">
        {label}
        {count !== undefined && (
          <span className="text-muted-foreground ml-1 font-normal tabular-nums">{count}</span>
        )}
      </span>
    </>
  );
}
