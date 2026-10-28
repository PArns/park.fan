'use client';

import Image from 'next/image';
import { CommandGroup, CommandItem } from '@/components/ui/command';
import { BlogCoverFallback } from '@/components/blog/blog-cover-fallback';
import {
  HERO_READING_GROUP_CLASS,
  HERO_READING_ROW_CLASS,
} from '@/components/search/search-skeleton-list';
import { useHeroReadingRows } from '@/lib/hooks/use-hero-reading';
import type { HeroReading } from '@/lib/home/hero-search';
import type { MostReadPost } from '@/lib/blog/most-read';

/** One post under its kicker, with up to two lines of its teaser, as the hero lists it at rest. */
function ReadingRow({
  post,
  kicker,
  excerpt,
  onSelect,
}: {
  post: MostReadPost;
  kicker: string;
  excerpt?: string;
  onSelect: () => void;
}) {
  return (
    <CommandItem
      value={`${post.title} ${post.path}`}
      onSelect={onSelect}
      className={`flex cursor-pointer items-start ${HERO_READING_ROW_CLASS}`}
    >
      <span className="bg-muted relative block h-10 w-16 shrink-0 overflow-hidden rounded-md">
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
      <span className="min-w-0 flex-1">
        <span className="text-primary block truncate text-[10px] leading-4 font-semibold tracking-wide uppercase">
          {kicker}
        </span>
        <span className="text-foreground line-clamp-2 text-[13px] leading-[18px] font-semibold text-pretty">
          {post.title}
        </span>
        {excerpt && (
          <span className="text-muted-foreground line-clamp-2 text-xs leading-4">{excerpt}</span>
        )}
      </span>
    </CommandItem>
  );
}

/**
 * The two posts under the hero's resting list from `md` up, side by side, as cmdk items
 * (`useHeroReadingRows`). The phone draws the same rows as links (`HeroPhoneList`).
 */
export function HeroReadingGroup({
  reading,
  onSelect,
}: {
  reading: HeroReading;
  onSelect: (post: MostReadPost, item: 'news' | 'guide', index: number) => void;
}) {
  const rows = useHeroReadingRows(reading);
  if (rows.length === 0) return null;

  return (
    <CommandGroup className={HERO_READING_GROUP_CLASS}>
      {rows.map(({ post, item, kicker, excerpt }, index) => (
        <ReadingRow
          key={post.path}
          post={post}
          kicker={kicker}
          excerpt={excerpt}
          onSelect={() => onSelect(post, item, index)}
        />
      ))}
    </CommandGroup>
  );
}
