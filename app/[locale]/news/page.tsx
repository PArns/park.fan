import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { NEWS_CATEGORY } from '@/lib/blog/paths';
import { BlogCategoryPageBody, buildCategoryMetadata } from '@/components/blog/blog-category-page';
import { RouteMessages } from '@/i18n/route-messages';

interface NewsIndexPageProps {
  params: Promise<{ locale: string }>;
}

// The news overview, which was `/blog/category/news`. For now it is that category listing at its
// new URL; its own look is PAR-473. Statically generated per locale, like the blog index.

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: NewsIndexPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildCategoryMetadata(locale, [NEWS_CATEGORY]);
}

export default async function NewsIndexPage({ params }: NewsIndexPageProps) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  return (
    <RouteMessages route="/news">
      <BlogCategoryPageBody locale={locale} path={[NEWS_CATEGORY]} section="news" />
    </RouteMessages>
  );
}
