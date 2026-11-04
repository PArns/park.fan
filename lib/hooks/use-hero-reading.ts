'use client';

import { useTranslations } from 'next-intl';
import type { HeroReading } from '@/lib/home/hero-search';
import type { MostReadPost } from '@/lib/blog/most-read';

/** One of the hero's two posts, as both lists draw it. */
interface HeroReadingRow {
  post: MostReadPost;
  /** What `search_browse_clicked` reports. */
  item: 'news' | 'guide';
  /** „Neueste News" or „Neuester Guide". */
  kicker: string;
  /** The post's teaser, where the server sent one for it. */
  excerpt?: string;
}

/**
 * The hero's two posts, the newest news post and the newest guide, with their kickers. One source
 * for the desktop's group and the phone's rows, so the two never list different posts. See
 * docs/features/homepage-hero.md.
 */
export function useHeroReadingRows(reading: HeroReading | null | undefined): HeroReadingRow[] {
  const tSearch = useTranslations('search');
  if (!reading) return [];
  const { news } = reading;

  return [
    news && {
      post: news,
      item: 'news' as const,
      kicker: tSearch('newestNews'),
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
