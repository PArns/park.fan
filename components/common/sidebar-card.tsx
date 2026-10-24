import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * A block in an article's sidebar: a small uppercase label with its icon over the content. The
 * blog's categories and tag cloud and a glossary term's related terms stand in one, so a sidebar
 * reads as one column wherever it appears.
 */
export function SidebarCard({
  icon: Icon,
  title,
  children,
  className,
  contentClassName,
}: {
  icon: LucideIcon;
  title: ReactNode;
  children: ReactNode;
  className?: string;
  /** The content's padding, `px-4` by default; a list whose rows carry their own passes less. */
  contentClassName?: string;
}) {
  return (
    <Card className={cn('gap-3 py-4', className)}>
      <CardHeader className="px-4 pb-0">
        <CardTitle className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('px-4', contentClassName)}>{children}</CardContent>
    </Card>
  );
}
