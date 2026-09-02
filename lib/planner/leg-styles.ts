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
 */
export const TRANSFER_CHIP_CLASS: Record<TransferVerdict, string> = {
  broken: 'bg-destructive/15 text-destructive border-destructive/40',
  tight: 'bg-crowd-high/20 text-crowd-high border-crowd-high/30',
  good: 'bg-crowd-low/20 text-crowd-low border-crowd-low/30',
  generous: 'bg-crowd-very-low/20 text-crowd-very-low border-crowd-very-low/30',
  unknown: 'bg-muted/60 text-muted-foreground border-border/60',
};

/** The rail between two blocks. `broken` is the only one that is solid and loud. */
export const TRANSFER_RAIL_CLASS: Record<TransferVerdict, string> = {
  broken: 'bg-destructive/70',
  tight: 'bg-crowd-high/45',
  good: 'bg-crowd-low/40',
  generous: 'bg-crowd-very-low/40',
  unknown: 'bg-border',
};
