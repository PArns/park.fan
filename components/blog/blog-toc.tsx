import { getTranslations } from 'next-intl/server';
import { BLOG_TOP_ID, extractToc, type TocEntry } from '@/lib/blog/toc';
import { BlogTocList } from './blog-toc-list';

/**
 * Table of contents built from the post's h2/h3 headings. Server shell that
 * extracts + translates, then hands off to the client BlogTocList for
 * scroll-spy highlighting. Hidden for short posts where a ToC adds noise.
 *
 * The post title is prepended as the first entry (linking to the <h1>) so
 * readers can jump back to the top from anywhere in the article.
 */
export async function BlogToc({ markdown, title }: { markdown: string; title: string }) {
  const t = await getTranslations('blog');
  const entries = extractToc(markdown);
  if (entries.length < 3) return null;

  const withTitle: TocEntry[] = [{ depth: 2, text: title, id: BLOG_TOP_ID }, ...entries];

  return <BlogTocList entries={withTitle} title={t('toc.title')} label={t('toc.label')} />;
}
