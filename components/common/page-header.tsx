import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import type { Breadcrumb } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  breadcrumbs: Breadcrumb[];
  currentPage?: string;
  title: string;
  description?: React.ReactNode;
  className?: string;
}

/**
 * Standard page header with breadcrumb, title, and optional description
 * Used across all geo pages (continent, country, city)
 */
export function PageHeader({
  breadcrumbs,
  currentPage,
  title,
  description,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      <BreadcrumbNav breadcrumbs={breadcrumbs} currentPage={currentPage} />
      <h1 className="mb-2 text-3xl font-bold">{title}</h1>
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
  );
}
