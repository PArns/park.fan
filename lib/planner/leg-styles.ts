import type { TransferVerdict } from './leg';

/**
 * How a transfer verdict looks.
 *
 * Full literal strings, never built by interpolation: Tailwind's scanner reads
 * source text, so `bg-crowd-${level}/20` produces a class that exists in the
 * markup and in no stylesheet. `crowd-level-styles.ts` says the same at the top
 * of the file and it is the same trap here.
 *
 * The palette is borrowed rather than invented, and the mapping is deliberate:
 * a tight transfer is the same amber a busy queue is, a comfortable one the same
 * green as a quiet park. `broken` is the one verdict that leaves the crowd
 * palette entirely — it is not "very busy", it is "this does not work", and
 * `destructive` is the only colour in the system that says so.
 *
 * The colour is in the TEXT and the border, never in the fill, and that is about
 * what a chip sits on. These float in the gap between two blocks, and a block is
 * a park photograph under two sheets of frosted glass — a `/20` tint took
 * whatever was behind it, so a sentence about a transfer was read against a
 * queue rail or a tree. Each chip carries the ground colour and a blur of its
 * own, which is the same construction the panel itself uses: a small pane of the
 * same glass, not a coloured film.
 */
export const TRANSFER_CHIP_CLASS: Record<TransferVerdict, string> = {
  broken: 'bg-background/85 text-destructive border-destructive/50 shadow-sm backdrop-blur-md',
  tight: 'bg-background/85 text-crowd-high border-crowd-high/40 shadow-sm backdrop-blur-md',
  good: 'bg-background/85 text-crowd-low border-crowd-low/40 shadow-sm backdrop-blur-md',
  generous:
    'bg-background/85 text-crowd-very-low border-crowd-very-low/40 shadow-sm backdrop-blur-md',
  unknown: 'bg-background/85 text-muted-foreground border-border/60 shadow-sm backdrop-blur-md',
};

/** The rail between two blocks. `broken` is the only one that is solid and loud. */
export const TRANSFER_RAIL_CLASS: Record<TransferVerdict, string> = {
  broken: 'bg-destructive/70',
  tight: 'bg-crowd-high/45',
  good: 'bg-crowd-low/40',
  generous: 'bg-crowd-very-low/40',
  unknown: 'bg-border',
};
