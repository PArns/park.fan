'use client';

import type { ComponentProps } from 'react';
import { BaseLink } from './navigation-internal';

type LinkProps = ComponentProps<typeof BaseLink>;

/**
 * App-wide Link with route prefetching turned OFF by default.
 *
 * Next.js' App Router prefetches a route's static shell as soon as a link
 * enters the viewport, and again on hover / focus / touch. On long lists — a
 * park's ~90 attraction cards, hub grids — that fans out into a flood of RSC
 * prefetch requests, and under Cache Components each cold prefetch GENERATES +
 * WRITES a per-route ISR shell that is often never actually visited. That
 * prefetch "cold-fill" was the dominant ISR *write* cost on park.fan.
 *
 * Passing `prefetch={false}` to next/link disables prefetch on *all* triggers
 * (the viewport IntersectionObserver plus the onMouseEnter/onTouchStart
 * handlers early-return when prefetch is disabled — verified in
 * next/dist/client/app-dir/link.js), so this wrapper simply makes `false` the
 * default for every Link in the app.
 *
 * This does NOT change client-side ("in-place") navigation: a click still does
 * a soft App-Router transition and fetches the route at click time — we only
 * stop fetching it *ahead* of the click (on scroll / hover). The route is still
 * ISR-cached on the real visit; we just no longer pre-warm cold routes by
 * scrolling or sweeping the mouse past their links.
 *
 * `prefetch={true}` opts a specific high-intent link (e.g. a primary CTA) back
 * into Next.js' viewport prefetch. `false` / `null` / omitted all mean no
 * prefetch.
 */
export function Link({ prefetch, ...rest }: LinkProps) {
  return <BaseLink prefetch={prefetch === true} {...rest} />;
}
