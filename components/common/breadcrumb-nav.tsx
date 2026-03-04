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
  pinLastBreadcrumb,
}: BreadcrumbNavProps) {
  const navRef = useRef<HTMLElement>(null);
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

  // After every render: if the nav overflows its container, collapse one more
  // item from the right. Runs synchronously before paint so no flash is visible.
  // Uses getBoundingClientRect so we detect overflow into the right padding area
  // before text touches the border, and avoids false positives on w-fit navs
  // where scrollWidth === clientWidth even when items perfectly fill the content.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (userExpanded) return;
    const nav = navRef.current;
    if (!nav) return;
    if (collapsedCount >= collapsibleCrumbs.length) return;
    // Compare the last child's right edge against the nav's right content edge
    // (right border minus right padding). This correctly handles both w-fit navs
    // (where scrollWidth === clientWidth even when items fill the content area)
    // and constrained navs, without ever falsely triggering when items fit.
    const lastChild = nav.lastElementChild as HTMLElement | null;
    if (!lastChild) return;
    const navRect = nav.getBoundingClientRect();
    const lastRect = lastChild.getBoundingClientRect();
    const paddingRight = parseFloat(getComputedStyle(nav).paddingRight) || 0;
    if (lastRect.right > navRect.right - paddingRight + 1) {
      setCollapsedCount((c) => c + 1);
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
        setCollapsedCount(0);
      } else if (w < prevWidth) {
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
        'text-muted-foreground mb-4 flex max-w-full items-center gap-2 text-sm',
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
            className="hover:text-foreground shrink-0 cursor-pointer rounded px-1 leading-none tracking-widest"
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
