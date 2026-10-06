'use client';

import type { ComponentProps } from 'react';
import { BaseLink } from './navigation-internal';

type LinkProps = ComponentProps<typeof BaseLink>;

/**
 * App-wide Link with route prefetching off unless `prefetch={true}`. Viewport and hover prefetch
 * on long lists (a park's attraction cards, hub grids) generates and writes an ISR shell per link
 * that is mostly never visited. A click still navigates client-side as before.
 */
export function Link({ prefetch, ...rest }: LinkProps) {
  return <BaseLink prefetch={prefetch === true} {...rest} />;
}
