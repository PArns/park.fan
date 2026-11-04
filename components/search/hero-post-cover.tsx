import Image from 'next/image';
import { BlogCoverFallback } from '@/components/blog/blog-cover-fallback';
import { cn } from '@/lib/utils';
import type { MostReadPost } from '@/lib/blog/most-read';

/**
 * A hero post's small cover, as both of the hero's lists draw it: the post's photo at its focal
 * point, or the brand fallback where it has none. The caller gives the box its size and corners;
 * `width` and `height` are the pixels the image is requested at.
 */
export function HeroPostCover({
  post,
  width,
  height,
  className,
}: {
  post: MostReadPost;
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <span className={cn('bg-muted relative block shrink-0 overflow-hidden', className)}>
      {post.image ? (
        <Image
          src={post.image}
          alt=""
          width={width}
          height={height}
          style={post.imagePosition ? { objectPosition: post.imagePosition } : undefined}
          className="h-full w-full object-cover"
        />
      ) : (
        <BlogCoverFallback slug={post.slug} />
      )}
    </span>
  );
}
