import type { TransferVerdict } from './leg';

/**
 * How a transfer verdict looks, as full literal class strings, since Tailwind's scanner never sees
 * an interpolated one. The palette is borrowed: tight is a busy queue's amber, comfortable a quiet
 * park's green, and `broken` leaves the crowd palette for `destructive`, because it means "this
 * does not work". The colour is in the text and border, never a fill, over the chip's own small
 * pane of glass; the short chip's ring takes `current`, so there is no second map.
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
