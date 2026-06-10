import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ChevronRight, FolderTree } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { buildCategoryTree } from '@/lib/blog/categories';
import type { CategoryNode } from '@/lib/blog/types';
import type { Locale } from '@/i18n/config';

interface BlogCategoryTreeProps {
  locale: Locale;
  /** Current category path (highlights the active branch). */
  activePath?: string;
  className?: string;
  title?: string;
}

function isActiveAncestor(activePath: string | undefined, nodePath: string): boolean {
  if (!activePath) return false;
  return activePath === nodePath || activePath.startsWith(`${nodePath}/`);
}

function CategoryNodeView({
  node,
  activePath,
  depth = 0,
}: {
  node: CategoryNode;
  activePath?: string;
  depth?: number;
}) {
  const isActive = activePath === node.path;
  const isAncestor = isActiveAncestor(activePath, node.path);
  const expanded = depth < 1 || isAncestor;

  return (
    <li>
      <Link
        href={`/blog/category/${node.path}` as '/'}
        className={cn(
          'group hover:bg-accent/40 flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors',
          isActive
            ? 'bg-primary/10 text-primary font-semibold'
            : isAncestor
              ? 'text-foreground font-medium'
              : 'text-foreground/80'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <span className="inline-flex items-center gap-1.5 truncate">
          {node.children.length > 0 && (
            <ChevronRight
              className={cn('h-3 w-3 shrink-0 transition-transform', expanded && 'rotate-90')}
            />
          )}
          {node.children.length === 0 && <span className="w-3 shrink-0" />}
          <span className="truncate">{node.label}</span>
        </span>
        <span className="text-muted-foreground bg-muted ml-2 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums">
          {node.totalPostCount}
        </span>
      </Link>
      {expanded && node.children.length > 0 && (
        <ul className="space-y-0.5">
          {node.children.map((child) => (
            <CategoryNodeView
              key={child.path}
              node={child}
              activePath={activePath}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export async function BlogCategoryTree({
  locale,
  activePath,
  className,
  title,
}: BlogCategoryTreeProps) {
  const t = await getTranslations('blog');
  const { root } = buildCategoryTree(locale);

  if (root.children.length === 0) return null;

  return (
    <nav aria-label={t('categories')}>
      <Card className={cn('gap-3 py-4', className)}>
        <CardHeader className="px-4 pb-0">
          <CardTitle className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase">
            <FolderTree className="h-3.5 w-3.5" />
            {title ?? t('categories')}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2">
          <ul className="space-y-0.5">
            {root.children.map((child) => (
              <CategoryNodeView key={child.path} node={child} activePath={activePath} />
            ))}
          </ul>
        </CardContent>
      </Card>
    </nav>
  );
}
