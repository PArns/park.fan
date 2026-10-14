import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { BlogIndexPageBody, buildBlogIndexMetadata } from '@/components/blog/blog-index-page';
import { RouteMessages } from '@/i18n/route-messages';

interface BlogIndexPageProps {
  params: Promise<{ locale: string }>;
}

// Static: a later page is the path-based `/blog/page/[n]`, never `?page=N`, which would render
// this page per request (`lib/blog/pagination.ts`).

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: BlogIndexPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildBlogIndexMetadata(locale, 1);
}

export default async function BlogIndexPage({ params }: BlogIndexPageProps) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  return (
    <RouteMessages route="/blog">
      <BlogIndexPageBody locale={locale} page={1} />
    </RouteMessages>
  );
}
