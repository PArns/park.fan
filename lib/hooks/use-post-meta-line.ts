'use client';

import { useFormatter, useTranslations } from 'next-intl';
import type { BlogMenuPost } from '@/lib/navigation/blog-menu';

/**
 * The line under an article in the guides panel and in the search results: the day it last changed
 * and its reading time. A post that got new content sorts by that day, so the line says it was
 * updated rather than passing the day off as its publication date.
 */
export function usePostMetaLine(): (post: BlogMenuPost) => string {
  // `navigation`, not `blog`: the panel is chrome, and the blog namespace would ride along.
  const t = useTranslations('navigation');
  const format = useFormatter();
  return (post) => {
    const date = format.dateTime(new Date(post.date), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const day = post.updated ? t('updatedOn', { date }) : date;
    return `${day} · ${t('readingTime', { minutes: post.readingTimeMinutes })}`;
  };
}
