'use client';

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { ChevronRight } from 'lucide-react';
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
  /**
   * Optional additional class names
   */
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
}

/**
 * Breadcrumb navigation component.
 *
 * Collapses middle items into a "…" button only when the available width
 * is too narrow to show everything on one line. Items collapse from left
 * to right (furthest from the current page first). Clicking "…" reveals
 * the full path.
 *
 * Always pinned:
 *   - First breadcrumb (e.g. Home)
 *   - currentPage (bold, non-link)
 *   - When pinLastBreadcrumb=true: also the last breadcrumb link (park on
 *     ride/attraction pages)
 */
export function BreadcrumbNav({
  breadcrumbs,
  currentPage,
  className,
  variant = 'pill',
  pinLastBreadcrumb,
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

  // If the nav overflows its container, collapse one more item from the right, re-render and
  // measure again — repeating until it fits. Runs synchronously before paint so no flash is
  // visible. Uses getBoundingClientRect so we detect overflow into the right padding area
  // before text touches the border, and avoids false positives on w-fit navs
  // where scrollWidth === clientWidth even when items perfectly fill the content.
  //
  // The effect deliberately has NO dependency array (the measurement has to follow every
  // collapse step), so `settledRef` stops the loop instead: once a measurement finds the nav
  // fits — or nothing is left to collapse — measuring is off until something that can change
  // the outcome happens (container shrink, or different breadcrumb content). Without it, the
  // two forced layouts below ran after EVERY render of this component, including the many
  // driven by unrelated parent re-renders.
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
    // Compare the last child's right edge against the nav's right content edge
    // (right border minus right padding). This correctly handles both w-fit navs
    // (where scrollWidth === clientWidth even when items fill the content area)
    // and constrained navs, without ever falsely triggering when items fit.
    const lastChild = nav.lastElementChild as HTMLElement | null;
    if (!lastChild) return;
    const navRect = nav.getBoundingClientRect();
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

  return (
    <nav
      ref={navRef}
      className={cn(
        // `overflow-hidden` is load-bearing, not cosmetic. Until the effect below has measured
        // and collapsed, the server render carries EVERY crumb, and each one is `shrink-0` — on a
        // park page that is ~578px of content in a 390px viewport. `max-w-full` caps this box, but
        // without clipping, the children still stick out of the document, and mobile Chrome answers
        // an overflowing page by widening the layout viewport to fit it. The whole page then lays
        // out at 578px until hydration collapses the trail, snaps the viewport back to 390 and
        // re-lays out everything — which re-paints the hero and moves LCP from ~1.3s to ~4.4s.
        // Measured on /de/parks/europe/germany/bruehl/phantasialand.
        'text-muted-foreground mb-4 flex max-w-full items-center gap-2 overflow-hidden text-sm',
        variant === 'pill' && 'glass-card w-fit rounded-lg px-3 py-1',
        // Allow wrapping only when user manually expanded (pinned items must
        // always be visible even if they wrap)
        userExpanded && 'flex-wrap',
        className
      )}
      aria-label="Breadcrumb"
    >
      {/* First item – always visible */}
      {firstCrumb && (
        <Link
          href={firstCrumb.url}
          prefetch={false}
          className={cn('hover:text-foreground', allCollapsed ? 'min-w-0 truncate' : 'shrink-0')}
        >
          {firstCrumb.name}
        </Link>
      )}

      {/* Collapse indicator – sits right after Home, before remaining items */}
      {showDots && (
        <>
          <Separator />
          <button
            onClick={() => setUserExpanded(true)}
            // ~17 × 14 px, and it exists ONLY where the trail collapses — which is the phone.
            // The one control on the page that a mouse never meets was the smallest one there.
            //
            // The target grows, the BOX does not, and that distinction is the whole point: a
            // `min-h-11` made this 44 px tall in a row of 20 px links, and since the button is
            // only mounted once the client has measured the overflow, the breadcrumb grew ~24 px
            // AFTER paint — 0.0227 of layout shift on a blog post, measured, where the row had
            // been still. A pseudo-element takes the finger instead and the row keeps its height.
            //
            // Measured with `elementFromPoint`, the reach is ~41 × 30 px rather than the 45 × 44
            // the `-inset-3` would suggest: this nav is `overflow-hidden` (load-bearing — see the
            // note on the `<nav>`), so it clips the pseudo-element to its own 30 px. Growing past
            // that means touching that clip, which is what keeps ~578 px of crumbs inside a
            // 390 px viewport before the effect has collapsed them. 41 × 30 against 17 × 14 is
            // the trade taken here.
            className="hover:text-foreground relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded px-1 leading-none tracking-widest max-sm:after:absolute max-sm:after:-inset-3 max-sm:after:content-['']"
            aria-label="Show full breadcrumb path"
          >
            &hellip;
          </button>
        </>
      )}

      {/* Visible middle items (leftmost collapse first; closest to current page survive longest) */}
      {visibleCollapsible.map((crumb) => (
        <Fragment key={crumb.url}>
          <Separator />
          <Link href={crumb.url} prefetch={false} className="hover:text-foreground shrink-0">
            {crumb.name}
          </Link>
        </Fragment>
      ))}

      {/* Pinned last breadcrumb (park on ride/attraction pages) – always visible */}
      {lastPinnedCrumb && (
        <>
          <Separator />
          <Link
            href={lastPinnedCrumb.url}
            prefetch={false}
            className={cn('hover:text-foreground', allCollapsed ? 'min-w-0 truncate' : 'shrink-0')}
          >
            {lastPinnedCrumb.name}
          </Link>
        </>
      )}

      {/* Current page – always visible */}
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
  );
}
