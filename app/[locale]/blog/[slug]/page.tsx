import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { BlogPostPageBody, buildPostMetadata } from '@/components/blog/blog-post-page';
import { RouteMessages } from '@/i18n/route-messages';

interface BlogPostPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/**
 * Rendered per request behind the edge cache, like a park page, and neither built nor stored in
 * Vercel's ISR cache: a post's widgets read park data the backend revalidates by tag, so a stored
 * post is rewritten at every push. The tables are server-rendered from the Data Cache, the live
 * values arrive in the browser, and the `CDN-Cache-Control` day in next.config.ts is the page's
 * only cache. See docs/rules/an-isr-route-needs-both-halves.md.
 */
export const dynamic = 'force-dynamic';

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
