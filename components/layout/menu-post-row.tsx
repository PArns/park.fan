import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { BlogCoverFallback, slugFromPostPath } from '@/components/blog/blog-cover-fallback';
import type { BlogMenuPost } from '@/lib/navigation/blog-menu';

/**
 * A post as a row of the guides panel, the same for the newest posts and for search results, and
 * of Parky's posts card in the chat: a small cover, the category, the title, one line of teaser,
 * and the two facts that decide a click, how old the post is and how long it takes.
 */
export function MenuPostRow({ post, meta }: { post: BlogMenuPost; meta: string }) {
  return (
    <Link
      href={post.path}
      prefetch={false}
      className="group hover:bg-muted/60 -mx-2 flex items-start gap-3 rounded-lg px-2 py-2 transition-colors"
    >
      {/* 16:10 at 8 rem: the row holds four lines of text (category, title, teaser, date), and a
          picture shorter than its text falls out of the row. */}
      <span className="bg-muted relative block aspect-[16/10] w-32 shrink-0 overflow-hidden rounded-lg">
        {post.image ? (
          <Image
            src={post.image}
            alt=""
            fill
            sizes="128px"
            style={post.imagePosition ? { objectPosition: post.imagePosition } : undefined}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <BlogCoverFallback
            slug={slugFromPostPath(post.path)}
            className="transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </span>
      <span className="min-w-0 flex-1">
        {/* The opener's look: above the title, small, uppercase, in the accent, so one band does
            not show the same field in two tones. */}
        {post.category && (
          <span className="text-primary mb-0.5 block text-[10px] font-semibold tracking-wide uppercase">
            {post.category}
          </span>
        )}
        <span className="text-foreground group-hover:text-primary line-clamp-2 text-sm leading-snug font-medium text-pretty transition-colors">
          {post.title}
        </span>
        {post.excerpt && (
          <span className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">{post.excerpt}</span>
        )}
        <span className="text-muted-foreground/80 mt-1 block text-[11px]">{meta}</span>
      </span>
    </Link>
  );
}
