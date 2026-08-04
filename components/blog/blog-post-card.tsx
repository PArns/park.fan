import { useLocale } from 'next-intl';

import { resolveAuthor } from '@/lib/blog/authors';
import { resolveCategoryLabel } from '@/lib/blog/categories';
import type { BlogListItem } from '@/lib/blog/types';
import type { Locale } from '@/i18n/config';
import { BlogPostCardView } from './blog-post-card-view';

interface BlogPostCardProps {
  post: BlogListItem;
  variant?: 'default' | 'compact' | 'feature';
  /** Mark the cover as LCP priority — set on the first card above the fold. */
  priority?: boolean;
  className?: string;
}

/**
 * Blog post card — resolves the author and category label, then renders
 * {@link BlogPostCardView}.
 *
 * The two resolvers read the filesystem, so they cannot be part of a client
 * bundle. Keeping them here and the markup in the view is what lets the admin's
 * focal-point previews render the real card instead of a look-alike.
 */
export function BlogPostCard({
  post,
  variant = 'default',
  priority = false,
  className,
}: BlogPostCardProps) {
  const locale = useLocale() as Locale;

  const author = resolveAuthor(post.frontmatter.author, locale).name;
  const categoryPath = post.frontmatter.category ?? '';
  const lastSegment = categoryPath.split('/').filter(Boolean).pop() ?? '';
  const categoryLabel = categoryPath
    ? resolveCategoryLabel(categoryPath, locale, lastSegment)
    : null;

  return (
    <BlogPostCardView
      post={post}
      variant={variant}
      priority={priority}
      className={className}
      author={author}
      categoryLabel={categoryLabel}
    />
  );
}
