'use client';

import { useState, type ComponentProps } from 'react';
import { BaseLink } from './navigation-internal';

type LinkProps = ComponentProps<typeof BaseLink>;

/**
 * App-wide Link with viewport prefetching turned off: the route is prefetched
 * only after the user signals navigation intent (hover / keyboard focus /
 * touch start), never just because the link scrolled into view. This keeps the
 * snappy feel of prefetch on real intent while avoiding the flood of RSC
 * prefetch requests that viewport prefetching triggers for long lists (e.g.
 * the attraction cards on a park page).
 *
 * Pass `prefetch={true}` to opt a specific link back into Next.js' default
 * viewport prefetch. Any other value (`false`, `null`, omitted) yields the
 * hover-only behavior.
 */
export function Link({ prefetch, onMouseEnter, onFocus, onTouchStart, ...rest }: LinkProps) {
  const [intent, setIntent] = useState(false);
  const viewportPrefetch = prefetch === true;
  // `undefined` lets Next.js apply its default (auto) prefetch; `false` disables it.
  const effectivePrefetch = viewportPrefetch || intent ? undefined : false;

  return (
    <BaseLink
      prefetch={effectivePrefetch}
      onMouseEnter={(e) => {
        setIntent(true);
        onMouseEnter?.(e);
      }}
      onFocus={(e) => {
        setIntent(true);
        onFocus?.(e);
      }}
      onTouchStart={(e) => {
        setIntent(true);
        onTouchStart?.(e);
      }}
      {...rest}
    />
  );
}
