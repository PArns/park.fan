import { getTranslations } from 'next-intl/server';
import { GlassCard } from '@/components/common/glass-card';

/**
 * What a post's widget shows when its `park` reference resolves to nothing: the slug as written, so
 * a typo in the post is visible on the page instead of a widget that is silently missing.
 */
export async function BlogWidgetParkNotFound({
  slug,
  className = 'not-prose clear-both my-8',
}: {
  slug: string;
  className?: string;
}) {
  const tBlog = await getTranslations('blog');
  return (
    <GlassCard variant="light" className={className}>
      <p className="text-muted-foreground text-sm">{tBlog('widget.parkNotFound', { slug })}</p>
    </GlassCard>
  );
}
