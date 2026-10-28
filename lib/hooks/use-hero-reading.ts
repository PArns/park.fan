'use client';

import { useTranslations } from 'next-intl';
import { useAfterLoad } from '@/lib/hooks/use-after-load';
import { useMostRead } from '@/lib/hooks/use-most-read';
import { pickHeroNews, type HeroReading } from '@/lib/home/hero-search';
import type { MostReadPost } from '@/lib/blog/most-read';

/** One of the hero's two posts, as both lists draw it. */
export interface HeroReadingRow {
  post: MostReadPost;
  /** What `search_browse_clicked` reports. */
  item: 'news' | 'guide';
  /** „Meistgelesen · News" (the section's label alone while nobody read it yet) or „Neuester Guide". */
  kicker: string;
  /** The post's teaser, where the server sent one for it. */
  excerpt?: string;
}

/**
 * The hero's two posts: the news post this language read most in the last seven days
 * (`useMostRead`, over the build's pick until it arrives), skipping the one the badge row's chip
 * already shows, and the newest guide. One source for the desktop's group and the phone's rows, so
 * the two never list different posts. See docs/features/homepage-hero.md.
 */
export function useHeroReadingRows(reading: HeroReading | null | undefined): HeroReadingRow[] {
  const tNav = useTranslations('navigation');
  const tSearch = useTranslations('search');
  const live = useMostRead(useAfterLoad()).data;
  if (!reading) return [];
  const news = live ? pickHeroNews(live.news, reading.skipNewsSlug) : reading.news;

  return [
    news && {
      post: news,
      item: 'news' as const,
      kicker: news.views > 0 ? `${tNav('mostRead')} · ${reading.newsLabel}` : reading.newsLabel,
      excerpt: reading.excerpts[news.key],
    },
    reading.guide && {
      post: reading.guide,
      item: 'guide' as const,
      kicker: tSearch('newestGuide'),
      excerpt: reading.excerpts[reading.guide.key],
    },
  ].filter((row) => !!row);
}
