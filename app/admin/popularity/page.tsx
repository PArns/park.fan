import type { Metadata } from 'next';
import { listArticles, listNewsByDate } from '@/lib/blog/listing';
import { postPath } from '@/lib/blog/paths';
import { PopularityView, type PostTitles } from './popularity-view';

export const metadata: Metadata = {
  title: 'Beliebtheit — park.fan',
  robots: { index: false, follow: false },
};

/**
 * The admin's popularity overview. A server page only to hand the client the posts' German titles:
 * the API counts a post by its `translationKey` and knows no title, and the manifest is server-side.
 */
export default function PopularityPage() {
  const titles: PostTitles = {};
  for (const post of [...listArticles('de'), ...listNewsByDate('de')]) {
    titles[post.translationKey] = { title: post.frontmatter.title, path: `/de${postPath(post)}` };
  }
  return <PopularityView postTitles={titles} />;
}
