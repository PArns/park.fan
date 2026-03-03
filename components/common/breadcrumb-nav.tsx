'use client';

import { Fragment, useState } from 'react';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { ChevronRight } from 'lucide-react';
import type { Breadcrumb } from '@/lib/api/types';

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
   * When true, the last breadcrumb link is always visible (pinned).
   * Use on ride/attraction pages so the park name stays visible.
   */
  pinLastBreadcrumb?: boolean;
}

const Separator = () => <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />;

/**
 * Breadcrumb navigation component
 * On mobile the middle breadcrumbs collapse into a "…" button.
 * First item and currentPage are always visible.
 * When pinLastBreadcrumb is true the last breadcrumb link (e.g. park on ride
 * pages) is also always visible.
 */
export function BreadcrumbNav({
  breadcrumbs,
  currentPage,
  className,
  pinLastBreadcrumb,
}: BreadcrumbNavProps) {
  const [expanded, setExpanded] = useState(false);

  const firstCrumb = breadcrumbs.length > 0 ? breadcrumbs[0] : null;
  const hasPinnedLast = pinLastBreadcrumb && breadcrumbs.length > 1;
  const lastPinnedCrumb = hasPinnedLast ? breadcrumbs[breadcrumbs.length - 1] : null;
  // Everything between the first and the pinned-last crumb is collapsible
  const collapsibleCrumbs = breadcrumbs.slice(1, hasPinnedLast ? breadcrumbs.length - 1 : breadcrumbs.length);

  const hasBeforeCurrentPage = !!(firstCrumb || collapsibleCrumbs.length > 0 || lastPinnedCrumb);

  return (
    <nav
      className={cn(
        'text-muted-foreground mb-4 flex flex-wrap items-center gap-2 text-sm',
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

      {/* Collapsible middle section */}
      {collapsibleCrumbs.length > 0 && (
        <>
          <Separator />
          {expanded ? (
            collapsibleCrumbs.map((crumb) => (
              <Fragment key={crumb.url}>
                <Link
                  href={crumb.url}
                  prefetch={false}
                  className="hover:text-foreground shrink-0"
                >
                  {crumb.name}
                </Link>
                <Separator />
              </Fragment>
            ))
          ) : (
            <>
              <button
                onClick={() => setExpanded(true)}
                className={cn(
                  'text-muted-foreground hover:text-foreground shrink-0',
                  'rounded px-1 leading-none tracking-widest'
                )}
                aria-label="Show full breadcrumb path"
              >
                &hellip;
              </button>
              <Separator />
            </>
          )}
        </>
      )}

      {/* Pinned last breadcrumb – always visible (e.g. park on ride pages) */}
      {lastPinnedCrumb && (
        <>
          {collapsibleCrumbs.length === 0 && <Separator />}
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
          {hasBeforeCurrentPage && <Separator />}
          <span className="text-foreground shrink-0 font-bold" aria-current="page">
            {currentPage}
          </span>
        </>
      )}
    </nav>
  );
}
