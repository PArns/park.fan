'use client';

import Image from 'next/image';
import { Flame } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { NewsAge } from '@/components/blog/news-age';
import { BlogCoverFallback } from '@/components/blog/blog-cover-fallback';
import type { MostReadPost } from '@/lib/blog/most-read';
import type { MostReadKind } from '@/lib/blog/most-read-config';
import { cn } from '@/lib/utils';

/** A row's height, which the placeholders hold while the ranking is on its way. */
export const MOST_READ_ROW_HEIGHT = 'min-h-14';

/**
 * One post of a most-read list: its place (a flame for the first), one line of context (the
 * category, or a news post's age) and the title, as a light row rather than a card, so the list
 * stays a side note next to the posts it ranks. `thumbnail` adds a small cover from `sm` up; the
 * header column has none, a phone neither. See docs/features/most-read.md.
 */
export function MostReadRow({
  post,
  kind,
  rank,
  thumbnail = false,
}: {
  post: MostReadPost;
  kind: MostReadKind;
  rank: number;
  thumbnail?: boolean;
}) {
  return (
    <Link
      href={post.path}
      prefetch={false}
      className={cn(
        'group hover:bg-muted/60 -mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors',
        MOST_READ_ROW_HEIGHT
      )}
    >
      <span
        aria-hidden="true"
        className="text-primary/80 flex w-5 shrink-0 items-center justify-center text-lg leading-none font-black tabular-nums"
      >
        {rank === 1 ? <Flame className="size-[1.1rem] fill-current" /> : rank}
      </span>
      {thumbnail && (
        <span className="bg-muted relative hidden h-10 w-16 shrink-0 overflow-hidden rounded-md sm:block">
          {post.image ? (
            <Image
              src={post.image}
              alt=""
              width={64}
              height={40}
              style={post.imagePosition ? { objectPosition: post.imagePosition } : undefined}
              className="h-full w-full object-cover"
            />
          ) : (
            <BlogCoverFallback slug={post.slug} />
          )}
        </span>
      )}
      <span className="min-w-0 flex-1">
        {kind === 'news' ? (
          <NewsAge date={post.date} />
        ) : (
          post.category && (
            <span className="text-primary block text-[10px] font-semibold tracking-wide uppercase">
              {post.category}
            </span>
          )
        )}
        <span className="text-foreground group-hover:text-primary mt-0.5 line-clamp-2 text-sm leading-snug font-semibold text-pretty transition-colors">
          {post.title}
        </span>
      </span>
    </Link>
  );
}
