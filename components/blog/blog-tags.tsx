import { Tag } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { getTagColorClass, normalizeTagSlug } from '@/lib/blog/tags';

interface BlogTagsProps {
  tags: string[];
  className?: string;
  label?: string;
  /**
   * When false, renders plain pills (used on the post hero or inside a
   * BlogPostCard where the entire card already links to the article).
   * Defaults to true — turns each tag into a link to its archive page.
   */
  asLinks?: boolean;
}

export function BlogTags({ tags, className, label, asLinks = true }: BlogTagsProps) {
  if (tags.length === 0) return null;
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {label && (
        <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
          <Tag className="h-3 w-3" />
          {label}
        </span>
      )}
      {tags.map((tag) => {
        const slug = normalizeTagSlug(tag);
        const palette = getTagColorClass(slug);
        const pillClass = cn(
          'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-colors',
          palette
        );
        if (!asLinks) {
          return (
            <span key={tag} className={pillClass}>
              #{tag}
            </span>
          );
        }
        return (
          <Link key={tag} href={`/blog/tag/${slug}` as '/'} prefetch={false} className={pillClass}>
            #{tag}
          </Link>
        );
      })}
    </div>
  );
}
