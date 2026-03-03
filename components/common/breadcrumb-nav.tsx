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
 * is too narrow to show everything on one line. Items collapse from right
 * to left (closest to the current page first). Clicking "…" reveals the
 * full path.
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
  // Number of collapsible items hidden from the right end (back-to-front)
  const [collapsedCount, setCollapsedCount] = useState(0);
  // Set to true when user manually clicks "…" to reveal all items
  const [userExpanded, setUserExpanded] = useState(false);

  const firstCrumb = breadcrumbs.length > 0 ? breadcrumbs[0] : null;
  const hasPinnedLast = pinLastBreadcrumb && breadcrumbs.length > 1;
  const lastPinnedCrumb = hasPinnedLast ? breadcrumbs[breadcrumbs.length - 1] : null;
  // Middle items that may be collapsed. Rightmost collapses first.
  const collapsibleCrumbs = breadcrumbs.slice(
    1,
    hasPinnedLast ? breadcrumbs.length - 1 : breadcrumbs.length
  );

  // After every render: if the nav overflows its container, collapse one more
  // item from the right. Runs synchronously before paint so no flash is visible.
  useLayoutEffect(() => {
    if (userExpanded) return;
    const nav = navRef.current;
    if (!nav) return;
    if (collapsedCount >= collapsibleCrumbs.length) return;
    if (nav.scrollWidth > nav.clientWidth + 1) {
      setCollapsedCount((c) => c + 1);
    }
  });

  // When the viewport grows, reset so items can re-expand. The layout effect
  // above will immediately re-collapse if still needed.
  useEffect(() => {
    if (userExpanded) return;

    let prevWidth = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth > prevWidth) {
        setCollapsedCount(0);
      }
      prevWidth = window.innerWidth;
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [userExpanded]);

  const showDots = !userExpanded && collapsedCount > 0;
  const visibleCollapsible = userExpanded
    ? collapsibleCrumbs
    : collapsibleCrumbs.slice(0, collapsibleCrumbs.length - collapsedCount);
  const hasAnyBefore = !!(
    firstCrumb ||
    visibleCollapsible.length > 0 ||
    showDots ||
    lastPinnedCrumb
  );

  return (
    <nav
      ref={navRef}
      className={cn(
        'text-muted-foreground mb-4 flex items-center gap-2 text-sm',
        // Allow wrapping only when user manually expanded (pinned items must
        // always be visible even if they wrap)
        userExpanded ? 'flex-wrap' : 'overflow-hidden',
        className
      )}
      aria-label="Breadcrumb"
    >
      {/* First item – always visible */}
      {firstCrumb && (
        <Link href={firstCrumb.url} prefetch={false} className="hover:text-foreground shrink-0">
          {firstCrumb.name}
        </Link>
      )}

      {/* Visible middle items (shown from left; rightmost collapse first) */}
      {visibleCollapsible.map((crumb) => (
        <Fragment key={crumb.url}>
          <Separator />
          <Link href={crumb.url} prefetch={false} className="hover:text-foreground shrink-0">
            {crumb.name}
          </Link>
        </Fragment>
      ))}

      {/* Collapse indicator */}
      {showDots && (
        <>
          <Separator />
          <button
            onClick={() => setUserExpanded(true)}
            className="hover:text-foreground shrink-0 rounded px-1 leading-none tracking-widest"
            aria-label="Show full breadcrumb path"
          >
            &hellip;
          </button>
        </>
      )}

      {/* Pinned last breadcrumb (park on ride/attraction pages) – always visible */}
      {lastPinnedCrumb && (
        <>
          <Separator />
          <Link
            href={lastPinnedCrumb.url}
            prefetch={false}
            className="hover:text-foreground shrink-0"
          >
            {lastPinnedCrumb.name}
          </Link>
        </>
      )}

      {/* Current page – always visible */}
      {currentPage && (
        <>
          {hasAnyBefore && <Separator />}
          <span className="text-foreground shrink-0 font-bold" aria-current="page">
            {currentPage}
          </span>
        </>
      )}
    </nav>
  );
}
