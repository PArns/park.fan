import type { CSSProperties } from 'react';
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
  index,
}: {
  icon: LucideIcon;
  label: string;
  count?: number;
  /** Second line: what lies behind this tile right now. Pass `null` to keep the reserved box
   *  empty — a row where some tiles have a hint and others have nothing is a ragged row. */
  hint?: React.ReactNode;
  /** Extra chip classes — the park tabs light theirs up on `data-[state=active]`. */
  chipClassName?: string;
  /** The tile's place in its row, which delays its rise (`.pk-tile-reveal`, app/globals.css). */
  index?: number;
}) {
  const rise = index ? ({ '--tile-i': index } as CSSProperties) : undefined;
  return (
    <>
      {/* `data-tile-stagger` marks what `.pk-tile-reveal` (app/globals.css) may move. It sits on
          the tile's contents and never on the tile itself: the box carries `backdrop-blur-md`,
          and a transform on a backdrop-filtered element (or any ancestor) makes it a backdrop
          root and flattens the blur for the length of the animation. */}
      {/* Below `sm` a tile is a third of the row, too narrow for a chip beside the label without
          cutting words, so a phone gets the label alone in `text-xs`, clamped to its two lines,
          and no hint. */}
      <span
        data-tile-stagger
        style={rise}
        className={cn(entryTileChip, 'max-sm:hidden', chipClassName)}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span
        data-tile-stagger
        data-tile-label
        style={rise}
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
          style={rise}
          className="text-muted-foreground line-clamp-2 min-h-[2.25rem] text-xs leading-snug max-sm:hidden"
        >
          {hint}
        </span>
      )}
    </>
  );
}

/** The classes every cell of the row shares, tab trigger or link. */
export const tileCell = cn(
  'group relative border-border/50 flex h-auto w-full flex-col items-start justify-start gap-2',
  'border-r border-b px-4 py-3.5 text-left whitespace-normal transition-colors',
  'bg-muted/20 hover:bg-muted/40',
  // `TabsTrigger`'s base is built for a segmented control and has to be undone here, or the
  // selected cell draws a rounded, shadowed box inside a grid of borderless cells. On the link tile
  // these overrides are no-ops.
  'rounded-none',
  // …including its text colour: the base mutes an inactive trigger in dark mode, which a link is
  // not subject to, so the calendar cell read as selected too. The selected cell is marked by the
  // bar, the chip and the tint; below `sm` there is no chip.
  'text-foreground dark:text-foreground',
  'data-[state=active]:border-border/50 dark:data-[state=active]:border-border/50',
  // Phone: a third of the row, the label alone (`EntryTileBody` hides chip and hint). `min-h-11`
  // holds the 44 px touch target where the label has no reserved second line, as in the ride row.
  'max-sm:flex-row max-sm:items-center max-sm:gap-1.5 max-sm:px-2 max-sm:py-2 max-sm:min-h-11'
);

/**
 * The row on a phone: three columns instead of two, and no second line in the cells. Two columns
 * put seven cells in four rows, most of the first screen; three columns make three rows. Both rows
 * use it, `ParkTileGrid` and `RideNavTiles`.
 */
export const tileRowPhone = 'max-sm:grid-cols-3';

/**
 * The span of the LAST cell on a phone, so the three-column row never ends on an empty cell: one
 * cell left over takes the whole row, two share it. The last item of both rows' item lists is
 * also the visually last cell — the park row's `order` classes reproduce the list order.
 */
export function phoneLastCellSpan(index: number, count: number): string | undefined {
  if (index !== count - 1) return undefined;
  const rest = count % 3;
  return rest === 1 ? 'max-sm:col-span-3' : rest === 2 ? 'max-sm:col-span-2' : undefined;
}

/**
 * The selected cell's bar along its top edge. An element, not a border or a shadow:
 * `border-t-primary` loses to the shorthand border colour the cell needs to beat `TabsTrigger`'s
 * base, and an inset shadow loses to the base's `shadow-sm`. A positioned child also reserves no
 * space.
 *
 * Two selectors, because a cell is selected two ways: `data-state=active` on the park page's tab
 * triggers, `aria-current=page` on a sub-page's own cell.
 */
export function SelectionBar() {
  return (
    <span
      aria-hidden="true"
      className="bg-primary absolute inset-x-0 top-0 h-[3px] opacity-0 transition-opacity group-aria-[current=page]:opacity-100 group-data-[state=active]:opacity-100"
    />
  );
}
