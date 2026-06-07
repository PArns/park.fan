import { getTranslations } from 'next-intl/server';
import { Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { getTagColorClass, listTags } from '@/lib/blog/tags';
import type { Locale } from '@/i18n/config';

interface BlogTagCloudProps {
  locale: Locale;
  /** Maximum number of tags to render. Defaults to 30. */
  limit?: number;
  /** Highlight this tag slug (the page's own tag). */
  activeSlug?: string;
  className?: string;
}

/**
 * Sidebar / footer tag cloud. Each pill scales with its post count so the
 * tags people actually use most stand out. Same colour palette as the inline
 * BlogTags pills, keyed by tag slug for cross-page consistency.
 */
export async function BlogTagCloud({
  locale,
  limit = 30,
  activeSlug,
  className,
}: BlogTagCloudProps) {
  const t = await getTranslations('blog');
  const tags = listTags(locale).slice(0, limit);
  if (tags.length === 0) return null;

  // Bucket tag sizes 1..5 based on post count so a tag with the maximum
  // count gets the largest pill and the minimum gets the smallest.
  const maxCount = Math.max(...tags.map((t) => t.count));
  const minCount = Math.min(...tags.map((t) => t.count));
  const bucket = (c: number): number => {
    if (maxCount === minCount) return 3;
    const ratio = (c - minCount) / (maxCount - minCount);
    if (ratio >= 0.8) return 5;
    if (ratio >= 0.6) return 4;
    if (ratio >= 0.4) return 3;
    if (ratio >= 0.2) return 2;
    return 1;
  };
  const sizeClass: Record<number, string> = {
    1: 'text-[11px] px-2 py-0.5',
    2: 'text-[12px] px-2.5 py-0.5',
    3: 'text-[13px] px-2.5 py-1',
    4: 'text-[14px] px-3 py-1',
    5: 'text-[15px] px-3 py-1 font-semibold',
  };

  return (
    <Card className={cn('gap-3 py-4', className)}>
      <CardHeader className="px-4 pb-0">
        <CardTitle className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase">
          <Hash className="h-3.5 w-3.5" />
          {t('tag.cloudTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((tag) => {
            const palette = getTagColorClass(tag.slug);
            const size = bucket(tag.count);
            const isActive = tag.slug === activeSlug;
            return (
              <Link
                key={tag.slug}
                href={`/blog/tag/${tag.slug}` as '/'}
                prefetch={false}
                className={cn(
                  'inline-flex items-center rounded-full font-medium ring-1 transition-colors',
                  sizeClass[size],
                  palette,
                  isActive && 'ring-2 ring-current/60'
                )}
                aria-label={t('tag.postsCount', { count: tag.count }) + ` — #${tag.label}`}
              >
                #{tag.label}
                <span className="text-muted-foreground/80 ml-1 text-[10px] tabular-nums">
                  {tag.count}
                </span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
