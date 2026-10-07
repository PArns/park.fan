'use client';

import { Fragment } from 'react';
import { TILE_GLASS } from '@/components/common/glass-card';
import { cn } from '@/lib/utils';

/**
 * The park page's header card: „Heute im Park" on top, the entry-tile row as its footer band. One
 * card, and the box lives here because both halves need the same `overflow-hidden` to clip their
 * trailing hairlines. The panel comes in as a slot because it is a Client Component the server page
 * builds.
 */
export function ParkHeaderCard({
  panel,
  tiles,
  className,
}: {
  panel?: React.ReactNode;
  tiles: React.ReactNode;
  /** Spacing from the page that places the card; its box stays here. */
  className?: string;
}) {
  return (
    <div
      data-card=""
      className={cn(
        'border-border/50 mb-4 overflow-hidden rounded-xl border shadow-sm',
        TILE_GLASS,
        className
      )}
    >
      {/* Keyed fragments: these two children compile to an array, and an element handed in through
          a prop is a keyless array child to React's dev validation. Keying here spares both pages
          that build this card. */}
      <Fragment key="panel">{panel}</Fragment>
      <Fragment key="tiles">{tiles}</Fragment>
    </div>
  );
}
