'use client';

import Image from 'next/image';
import { Flame } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { NewsAge } from '@/components/blog/news-age';
import { BlogCoverFallback } from '@/components/blog/blog-cover-fallback';
import type { MostReadPost } from '@/lib/blog/most-read';
import type { MostReadKind } from '@/lib/blog/most-read-config';
import { cn } from '@/lib/utils';

/**
 * A row's height, fixed rather than drawn by its text, so the placeholders that stand in for the
 * ranking until it arrives take exactly the room the rows will: a 16 px context line and two 20 px
 * title lines, centred.
 */
export const MOST_READ_ROW_HEIGHT = 'h-17';

/**
 * One post of a most-read list: its place (a flame for the clear leader), one line of context (the
 * category, or a news post's age) and the title, as a light row rather than a card, so the list
 * stays a side note next to the posts it ranks. `thumbnail` adds a small cover from `sm` up; the
 * header column has none, a phone neither. See docs/features/most-read.md.
 */
export function MostReadRow({
  post,
  kind,
  rank,
  leader = false,
  thumbnail = false,
}: {
  post: MostReadPost;
  kind: MostReadKind;
  rank: number;
  /** The post is `mostReadLeader`'s: the flame stands in for its number. */
  leader?: boolean;
  thumbnail?: boolean;
}) {
  return (
    <Link
      href={post.path}
      prefetch={false}
      className={cn(
        'group hover:bg-muted/60 -mx-2 flex items-center gap-3 overflow-hidden rounded-lg px-2 transition-colors',
        MOST_READ_ROW_HEIGHT
      )}
    >
      <span className="text-primary/80 flex w-5 shrink-0 items-center justify-center text-lg leading-none font-black tabular-nums">
        {leader ? (
          <>
            <Flame aria-hidden="true" className="size-[1.1rem] fill-current" />
            <span className="sr-only">{rank}</span>
          </>
        ) : (
          rank
        )}
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
        {kind === 'news' && post.date ? (
          <NewsAge date={post.date} className="leading-4" />
        ) : (
          <span className="text-primary block truncate text-[10px] leading-4 font-semibold tracking-wide uppercase">
            {post.category}
          </span>
        )}
        <span className="text-foreground group-hover:text-primary line-clamp-2 text-sm leading-5 font-semibold text-pretty transition-colors">
          {post.title}
        </span>
      </span>
    </Link>
  );
}
