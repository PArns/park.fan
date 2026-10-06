'use client';

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Breadcrumb } from '@/lib/api/types';

const Separator = () => <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />;

interface BreadcrumbNavProps {
  /**
   * Breadcrumbs from the API
   */
  breadcrumbs: Breadcrumb[];
  /**
   * Optional current page name (not a link)
   */
  currentPage?: string;
  className?: string;
  /**
   * Visual style:
   * - "pill" (default): glass card with border + padding — for pages with a background image
   * - "plain": unstyled inline text — for listing pages without a background
   */
  variant?: 'pill' | 'plain';
  /**
   * When true, the last breadcrumb link is pinned (always visible).
   * Use on ride/attraction pages so the park name stays visible alongside
   * the first item and currentPage.
   */
  pinLastBreadcrumb?: boolean;
  /**
   * What a phone (below `sm`) gets instead of the trail:
   * - "back" (default): one link, one level up — the last crumb before the current page.
   * - "hidden": nothing, for a page whose title card already carries that link (the park page's
   *   address line, the ride page's park link). The full trail stays in the HTML either way.
   */
  phone?: 'back' | 'hidden';
}

/**
 * Breadcrumb trail that collapses middle items into a "…" button only when the width is too
 * narrow, furthest from the current page first; "…" reveals the full path. The first crumb, the
 * current page and, with `pinLastBreadcrumb`, the last crumb stay visible. A phone gets a single
 * back link instead.
 */
export function BreadcrumbNav({
  breadcrumbs,
  currentPage,
  className,
  variant = 'pill',
  pinLastBreadcrumb,
  phone = 'back',
}: BreadcrumbNavProps) {
  const navRef = useRef<HTMLElement>(null);
  const paddingRightRef = useRef<number | null>(null);
  // True once the current layout has been measured and needs no further collapsing. Cleared
  // by a container shrink (below) and by a breadcrumb-content change (`contentKey`).
  const settledRef = useRef(false);
  const contentKeyRef = useRef<string | null>(null);
  // Number of collapsible items hidden from the left end (front-to-back)
  const [collapsedCount, setCollapsedCount] = useState(0);
  // Set to true when user manually clicks "…" to reveal all items
  const [userExpanded, setUserExpanded] = useState(false);
  // Bumped on container-shrink to force a re-render so the layout effect
  // can detect overflow even when collapsedCount itself didn't change yet.
  const [, setResizeGen] = useState(0);

  const firstCrumb = breadcrumbs.length > 0 ? breadcrumbs[0] : null;
  const hasPinnedLast = pinLastBreadcrumb && breadcrumbs.length > 1;
  const lastPinnedCrumb = hasPinnedLast ? breadcrumbs[breadcrumbs.length - 1] : null;
  // Middle items that may be collapsed. Leftmost (furthest from current page) collapses first.
  const collapsibleCrumbs = breadcrumbs.slice(
    1,
    hasPinnedLast ? breadcrumbs.length - 1 : breadcrumbs.length
  );

  // Identity of what is being measured. Different labels mean different widths, so a change
  // here must re-arm the measurement even though the container size didn't move.
  const contentKey = `${breadcrumbs.map((c) => c.name).join('\0')}\0${currentPage ?? ''}`;

  // If the nav overflows its container, collapse one more item, re-render and measure again until
  // it fits, before paint. No dependency array, because the measurement follows every collapse
  // step; `settledRef` stops the loop once it fits, until the container shrinks or the content
  // changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (contentKeyRef.current !== contentKey) {
      contentKeyRef.current = contentKey;
      settledRef.current = false;
    }
    if (userExpanded || settledRef.current) return;
    const nav = navRef.current;
    if (!nav) return;
    if (collapsedCount >= collapsibleCrumbs.length) {
      settledRef.current = true;
      return;
    }
    // Compare the last child's right edge with the nav's right content edge, which works for
    // `w-fit` navs (where scrollWidth equals clientWidth) and constrained ones alike.
    const lastChild = nav.lastElementChild as HTMLElement | null;
    if (!lastChild) return;
    const navRect = nav.getBoundingClientRect();
    // `max-sm:hidden` on a phone: a box that is not rendered has no width to overflow, and
    // measuring it anyway reads 0 > -padding and collapses every crumb one render at a time.
    // Settled rather than skipped, so it costs nothing until the parent grows — which is what
    // turning the phone sideways past `sm` does, and the observer below re-arms on that.
    if (navRect.width === 0) {
      settledRef.current = true;
      return;
    }
    const lastRect = lastChild.getBoundingClientRect();
    if (paddingRightRef.current === null) {
      paddingRightRef.current = parseFloat(getComputedStyle(nav).paddingRight) || 0;
    }
    const paddingRight = paddingRightRef.current;
    if (lastRect.right > navRect.right - paddingRight + 1) {
      // Still overflowing — collapse one more and let the re-render measure again.
      setCollapsedCount((c) => c + 1);
    } else {
      settledRef.current = true;
    }
  });

  // Observe the parent element's width so we react to both grow and shrink:
  //   grow  → reset collapsedCount so items can re-expand
  //   shrink → bump resizeGen to force a re-render so the layout effect above
  //            can detect the new overflow and collapse one more item
  useEffect(() => {
    if (userExpanded) return;
    const parent = navRef.current?.parentElement;
    if (!parent) return;

    let prevWidth = parent.clientWidth;
    const ro = new ResizeObserver(() => {
      const w = parent.clientWidth;
      if (w > prevWidth) {
        // More room: re-expand everything and re-measure from scratch.
        settledRef.current = false;
        setCollapsedCount(0);
      } else if (w < prevWidth) {
        // Less room: the previous "it fits" verdict no longer holds.
        settledRef.current = false;
        setResizeGen((n) => n + 1);
      }
      prevWidth = w;
    });

    ro.observe(parent);
    return () => ro.disconnect();
  }, [userExpanded]);

  const showDots = !userExpanded && collapsedCount > 0;
  // Once every collapsible item is hidden, allow pinned items to truncate with
  // ellipsis instead of just being clipped by the nav's overflow:hidden.
  const allCollapsed = !userExpanded && collapsedCount >= collapsibleCrumbs.length;
  // Collapse from the left (front): skip the first `collapsedCount` items
  const visibleCollapsible = userExpanded
    ? collapsibleCrumbs
    : collapsibleCrumbs.slice(collapsedCount);
  const hasAnyBefore = !!(
    firstCrumb ||
    showDots ||
    visibleCollapsible.length > 0 ||
    lastPinnedCrumb
  );

  /*
   * The phone's version: a second, much smaller element rather than the trail collapsed further,
   * because on a phone the trail is for the way one level up. Both are server-rendered and CSS
   * picks one, so nothing moves at hydration.
   */
  const parent = currentPage
    ? breadcrumbs[breadcrumbs.length - 1]
    : breadcrumbs[breadcrumbs.length - 2];
  const phoneBack =
    phone === 'back' && parent ? (
      <nav
        className={cn(
          'text-muted-foreground mb-4 flex max-w-full text-sm sm:hidden',
          variant === 'pill' && 'glass-card w-fit rounded-lg px-3 py-1',
          className
        )}
        aria-label="Breadcrumb"
      >
        <Link
          href={parent.url}
          prefetch={false}
          className="hover:text-foreground flex min-w-0 items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{parent.name}</span>
        </Link>
      </nav>
    ) : null;

  return (
    <>
      {phoneBack}
      <nav
        ref={navRef}
        className={cn(
          // `overflow-hidden` is load-bearing: until the effect has collapsed the trail, the server
          // render carries every `shrink-0` crumb, and an overflowing page makes mobile Chrome
          // widen the layout viewport and lay the page out again at hydration, which delays LCP.
          'text-muted-foreground mb-4 flex max-w-full items-center gap-2 overflow-hidden text-sm',
          variant === 'pill' && 'glass-card w-fit rounded-lg px-3 py-1',
          // Allow wrapping only when user manually expanded (pinned items must
          // always be visible even if they wrap)
          userExpanded && 'flex-wrap',
          'max-sm:hidden',
          className
        )}
        aria-label="Breadcrumb"
      >
        {firstCrumb && (
          <Link
            href={firstCrumb.url}
            prefetch={false}
            className={cn('hover:text-foreground', allCollapsed ? 'min-w-0 truncate' : 'shrink-0')}
          >
            {firstCrumb.name}
          </Link>
        )}

        {showDots && (
          <>
            <Separator />
            <button
              onClick={() => setUserExpanded(true)}
              // The trail only collapses on narrow screens, so this small button gets a larger
              // touch target from a pseudo-element: a `min-h-11` would grow the row after paint,
              // since the button mounts only once the overflow is measured. The nav's
              // `overflow-hidden` clips the pseudo-element to the row's height.
              className="hover:text-foreground relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded px-1 leading-none tracking-widest max-sm:after:absolute max-sm:after:-inset-3 max-sm:after:content-['']"
              aria-label="Show full breadcrumb path"
            >
              &hellip;
            </button>
          </>
        )}

        {visibleCollapsible.map((crumb) => (
          <Fragment key={crumb.url}>
            <Separator />
            <Link href={crumb.url} prefetch={false} className="hover:text-foreground shrink-0">
              {crumb.name}
            </Link>
          </Fragment>
        ))}

        {lastPinnedCrumb && (
          <>
            <Separator />
            <Link
              href={lastPinnedCrumb.url}
              prefetch={false}
              className={cn(
                'hover:text-foreground',
                allCollapsed ? 'min-w-0 truncate' : 'shrink-0'
              )}
            >
              {lastPinnedCrumb.name}
            </Link>
          </>
        )}

        {currentPage && (
          <>
            {hasAnyBefore && <Separator />}
            <span
              className={cn(
                'text-foreground font-bold',
                allCollapsed ? 'min-w-0 truncate' : 'shrink-0'
              )}
              aria-current="page"
            >
              {currentPage}
            </span>
          </>
        )}
      </nav>
    </>
  );
}
