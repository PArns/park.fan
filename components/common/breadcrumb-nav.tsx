import { Fragment } from 'react';
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
}

/**
 * Breadcrumb navigation component
 * Displays a hierarchical navigation path with chevron separators
 */
export function BreadcrumbNav({ breadcrumbs, currentPage, className }: BreadcrumbNavProps) {
  return (
    <nav
      className={cn(
        'text-muted-foreground mb-4 flex flex-wrap items-center gap-2 text-sm',
        className
      )}
      aria-label="Breadcrumb"
    >
      {breadcrumbs.map((crumb, index) => (
        <Fragment key={crumb.url}>
          {index > 0 && (
            <ChevronRight className={cn('h-4 w-4', crumb.className)} aria-hidden="true" />
          )}
          <Link href={crumb.url} className={cn('hover:text-foreground', crumb.className)}>
            {crumb.name}
          </Link>
        </Fragment>
      ))}
      {currentPage && (
        <>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <span className="text-foreground font-bold" aria-current="page">
            {currentPage}
          </span>
        </>
      )}
    </nav>
  );
}
