import { BlogPostCard } from './blog-post-card';
import type { BlogListItem } from '@/lib/blog/types';

/**
 * Uniform post grid shared by the blog index and category pages so both
 * surfaces render identically:
 *  - a single post → one centered portrait tile (a full-width strip stretched
 *    portrait covers into a thin panoramic band),
 *  - multiple posts → a responsive 2-up grid.
 *
 * The first card gets image `priority` (it's the above-the-fold LCP element).
 */
export function BlogPostGrid({ posts }: { posts: BlogListItem[] }) {
  if (posts.length === 0) return null;

  if (posts.length === 1) {
    return (
      <div className="mx-auto w-full max-w-md">
        <BlogPostCard post={posts[0]} priority />
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {posts.map((post, i) => (
        <BlogPostCard key={post.translationKey} post={post} priority={i === 0} />
      ))}
    </div>
  );
}
