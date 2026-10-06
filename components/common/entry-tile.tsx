import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The entry tile's contents, one definition for both places it appears: a park page's tiles are
 * tabs and a ride page's are jump links, so they cannot share a component, but they share the cell,
 * chip and body so the two rows on the same photo cannot drift.
 */

/** The icon chip. Square, so the row is scannable by shape before any label is read. */
export const entryTileChip =
  'bg-muted text-foreground flex h-8 w-8 items-center justify-center rounded-lg transition-colors';

/**
 * Icon chip and label, with the optional count inside the label. `hint` is the second line, what is
 * behind the tile right now; its box is reserved and clamped at two lines on every tile, because
 * the text changes on the live poll and a third line would make the whole row taller.
 */
export function EntryTileBody({
  icon: Icon,
  label,
  count,
  hint,
  chipClassName,
}: {
  icon: LucideIcon;
  label: string;
  count?: number;
  /** Second line: what lies behind this tile right now. Pass `null` to keep the reserved box
   *  empty — a row where some tiles have a hint and others have nothing is a ragged row. */
  hint?: React.ReactNode;
  /** Extra chip classes — the park tabs light theirs up on `data-[state=active]`. */
  chipClassName?: string;
}) {
  return (
    <>
      {/* `data-tile-stagger` marks what `useTileReveal` may move. It sits on the tile's contents
          and never on the tile itself: the box carries `backdrop-blur-md`, and a transform on a
          backdrop-filtered element (or any ancestor) makes it a backdrop root and flattens the
          blur for the length of the animation. */}
      {/* Below `sm` a tile is a third of the row, too narrow for a chip beside the label without
          cutting words, so a phone gets the label alone in `text-xs`, clamped to its two lines,
          and no hint. */}
      <span data-tile-stagger className={cn(entryTileChip, 'max-sm:hidden', chipClassName)}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span
        data-tile-stagger
        data-tile-label
        className="text-sm leading-tight font-semibold max-sm:line-clamp-2 max-sm:min-w-0 max-sm:text-xs"
      >
        {label}
        {count !== undefined && (
          <>
            {/* The label and the count are adjacent inline boxes with no space between them, so
                without this there is no place to break: in a third of a 390 px row „Attraktionen"
                fills the line and the count was pushed past the edge and clipped. */}
            <wbr />
            <span className="text-muted-foreground ml-1 font-normal tabular-nums">{count}</span>
          </>
        )}
      </span>
      {hint !== undefined && (
        <span
          data-tile-stagger
          className="text-muted-foreground line-clamp-2 min-h-[2.25rem] text-xs leading-snug max-sm:hidden"
        >
          {hint}
        </span>
      )}
    </>
  );
}
