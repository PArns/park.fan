import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { listAllUrlSlugsByLocale } from '@/lib/blog';
import { BlogPostPageBody, buildPostMetadata } from '@/components/blog/blog-post-page';
import { RouteMessages } from '@/i18n/route-messages';

interface BlogPostPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// All blog routes are statically generated at build time. Geo + glossary
// data is fetched in cached server helpers, so the markup is produced once
// per build (re-generated every `revalidate` window). News posts are not
// listed here: they live under `/news/[slug]` (`lib/blog/paths.ts`).

export function generateStaticParams() {
  return listAllUrlSlugsByLocale('blog').map(({ locale, slug }) => ({ locale, slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  return buildPostMetadata(await params, 'blog');
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale, slug } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  return (
    <RouteMessages route="/blog/[slug]">
      <BlogPostPageBody locale={locale} slug={slug} section="blog" />
    </RouteMessages>
  );
}
