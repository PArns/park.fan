import type { LucideIcon } from 'lucide-react';
import { TILE_GLASS } from '@/components/common/glass-card';
import { cn } from '@/lib/utils';

/**
 * The entry tile — one definition for both places it appears.
 *
 * A park page's tiles are real tabs (`TabsTrigger`), a ride page's are jump links to chapters
 * that stay in the HTML, so the two cannot share a component. They CAN share the box and the
 * icon chip, and they have to: both rows sit a few hundred pixels apart on the same park photo,
 * and a second copy of these classes is a second copy that drifts on the next restyle.
 *
 * Not `GlassCard`: that brings `p-6` and its own radius, and at tile size that is a card. The fill
 * is `TILE_GLASS` — the header stack's own glass one grade more solid, which is written down with
 * why a tile needs that grade and the two panels above it do not. What it replaces is a fill
 * invented here (`/85`, `oklch(…/0.88)` in the dark) with no relation to theirs, so the park page
 * opened with two panes of glass and a strip of black plastic underneath them.
 */
export const entryTileBox = cn(
  'border-border/50 flex h-auto w-full flex-col items-start justify-start gap-2',
  'rounded-xl border p-3.5 text-left whitespace-normal transition-colors',
  TILE_GLASS
);

/** The icon chip. Square, so the row is scannable by shape before any label is read. */
export const entryTileChip =
  'bg-muted text-foreground flex h-8 w-8 items-center justify-center rounded-lg transition-colors';

/**
 * Icon chip + label, with the optional count inside the label rather than on a line of its own:
 * it is the only figure that belongs on the same line as the name.
 *
 * `hint` is the second line — what is actually behind the tile ("24 offen · Ø 33 min") rather
 * than another label. Its box is reserved at two lines and clamped to two, on EVERY tile that
 * passes one, because the text moves on the live poll: unclamped, an eight-word hint in French
 * is a third line, and `auto-rows-fr` then makes every tile in the row taller at once.
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
      <span data-tile-stagger className={cn(entryTileChip, chipClassName)}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span data-tile-stagger className="text-sm leading-tight font-semibold">
        {label}
        {count !== undefined && (
          <span className="text-muted-foreground ml-1 font-normal tabular-nums">{count}</span>
        )}
      </span>
      {hint !== undefined && (
        <span
          data-tile-stagger
          className="text-muted-foreground line-clamp-2 min-h-[2.25rem] text-xs leading-snug"
        >
          {hint}
        </span>
      )}
    </>
  );
}
