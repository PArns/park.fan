import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { listAllUrlSlugsByLocale } from '@/lib/blog';
import { BlogPostPageBody, buildPostMetadata } from '@/components/blog/blog-post-page';
import { RouteMessages } from '@/i18n/route-messages';

interface NewsPostPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// News posts, statically generated like the blog posts they used to sit among. The page is the
// blog post page; only the section differs (`lib/blog/paths.ts`, `docs/rules/news-live-under-news.md`).

export function generateStaticParams() {
  return listAllUrlSlugsByLocale('news').map(({ locale, slug }) => ({ locale, slug }));
}

export async function generateMetadata({ params }: NewsPostPageProps): Promise<Metadata> {
  return buildPostMetadata(await params, 'news');
}

export default async function NewsPostPage({ params }: NewsPostPageProps) {
  const { locale, slug } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  return (
    <RouteMessages route="/news/[slug]">
      <BlogPostPageBody locale={locale} slug={slug} section="news" />
    </RouteMessages>
  );
}
