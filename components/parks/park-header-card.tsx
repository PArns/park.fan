'use client';

import { Fragment } from 'react';
import { HEAVY_GLASS } from '@/components/common/glass-card';
import { cn } from '@/lib/utils';

/**
 * The park page's header card: "Heute im Park" on top, the entry-tile row as its footer band.
 *
 * They were two cards with a gap. Both carried the same glass, the same 12 px radius and the same
 * hairline border, so the page opened with two objects that were made of the same thing and were
 * not the same thing — and the row of navigation cells, being the smaller and more opaque of the
 * two, read as a separate strip rather than as the way into what the panel had just summarised.
 *
 * One card, and the box lives here rather than in either half: `ParkTodayPanel` renders bands and
 * `ParkTabsList` renders a cell grid, and both need the same `overflow-hidden` to clip their
 * trailing hairlines. Which is also why the panel comes through as a SLOT — it is a Client
 * Component the (server) page builds, and this is where its box had to end up.
 */
export function ParkHeaderCard({
  panel,
  tiles,
}: {
  panel?: React.ReactNode;
  tiles: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'border-border/50 mb-4 overflow-hidden rounded-xl border shadow-sm',
        HEAVY_GLASS
      )}
    >
      {/* Keyed fragments, and not for decoration: these two children compile to an ARRAY, and an
        element created in a page and handed in through a prop is a keyless array child as far as
        React's dev validation is concerned — it warns naming this component and pointing back at
        whichever page passed the panel. Keying here rather than at each call site keeps the two
        pages that build this card from having to know about it. */}
      <Fragment key="panel">{panel}</Fragment>
      <Fragment key="tiles">{tiles}</Fragment>
    </div>
  );
}
