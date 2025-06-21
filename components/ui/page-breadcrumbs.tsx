import Link from 'next/link';

interface BreadcrumbItem {
  href?: string;
  label: string;
  isActive?: boolean;
}

interface PageBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function PageBreadcrumbs({ items, className }: PageBreadcrumbsProps) {
  return (
    <nav className={`text-sm text-muted-foreground mb-4 ${className || ''}`}>
      {items.map((item, index) => (
        <span key={index}>
          {index > 0 && <span className="mx-2">/</span>}
          {item.href && !item.isActive ? (
            <Link href={item.href} className="hover:text-primary transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className={item.isActive ? 'text-foreground' : ''}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
