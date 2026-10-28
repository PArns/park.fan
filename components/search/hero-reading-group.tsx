'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { CommandGroup, CommandItem } from '@/components/ui/command';
import { BlogCoverFallback } from '@/components/blog/blog-cover-fallback';
import {
  HERO_READING_GROUP_CLASS,
  HERO_READING_ROW_CLASS,
} from '@/components/search/search-skeleton-list';
import { useAfterLoad } from '@/lib/hooks/use-after-load';
import { useMostRead } from '@/lib/hooks/use-most-read';
import { pickHeroNews, type HeroReading } from '@/lib/home/hero-search';
import type { MostReadPost } from '@/lib/blog/most-read';

/** One post under its kicker, as the hero lists it before anything is typed. */
function ReadingRow({
  post,
  kicker,
  onSelect,
}: {
  post: MostReadPost;
  kicker: string;
  onSelect: () => void;
}) {
  return (
    <CommandItem
      value={`${post.title} ${post.path}`}
      onSelect={onSelect}
      className={`flex cursor-pointer items-center ${HERO_READING_ROW_CLASS}`}
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
      </span>
    </CommandItem>
  );
}

/**
 * The two posts under the hero's resting list, side by side: the news post this language read
 * most in the last seven days (`useMostRead`, over the build's pick until it arrives), skipping
 * the one the badge row's chip already shows, and the newest guide. A news post nobody read yet
 * carries the section's label instead of „Meistgelesen". See docs/features/homepage-hero.md.
 */
export function HeroReadingGroup({
  reading,
  onSelect,
}: {
  reading: HeroReading;
  onSelect: (post: MostReadPost, item: 'news' | 'guide', index: number) => void;
}) {
  const tNav = useTranslations('navigation');
  const tSearch = useTranslations('search');
  const live = useMostRead(useAfterLoad()).data;
  const news = live ? pickHeroNews(live.news, reading.skipNewsSlug) : reading.news;

  const rows = [
    news && {
      post: news,
      item: 'news' as const,
      kicker: news.views > 0 ? `${tNav('mostRead')} · ${reading.newsLabel}` : reading.newsLabel,
    },
    reading.guide && {
      post: reading.guide,
      item: 'guide' as const,
      kicker: tSearch('newestGuide'),
    },
  ].filter((row) => !!row);

  if (rows.length === 0) return null;

  return (
    <CommandGroup className={HERO_READING_GROUP_CLASS}>
      {rows.map(({ post, item, kicker }, index) => (
        <ReadingRow
          key={post.path}
          post={post}
          kicker={kicker}
          onSelect={() => onSelect(post, item, index)}
        />
      ))}
    </CommandGroup>
  );
}
