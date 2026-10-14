import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { locales } from '@/i18n/config';
import { hasPublishedPosts, listArticles } from '@/lib/blog/listing';
import { laterPageNumbers, parsePageNumber } from '@/lib/blog/pagination';
import { BlogIndexPageBody, buildBlogIndexMetadata } from '@/components/blog/blog-index-page';
import { RouteMessages } from '@/i18n/route-messages';

interface BlogIndexLaterPageProps {
  params: Promise<{ locale: string; n: string }>;
}

// Every later page of every locale is built; anything else, `/page/1` included (page 1 is
// `/blog`), is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return locales
    .filter((locale) => hasPublishedPosts(locale))
    .flatMap((locale) =>
      laterPageNumbers(listArticles(locale).length).map((page) => ({ locale, n: String(page) }))
    );
}

export async function generateMetadata({ params }: BlogIndexLaterPageProps): Promise<Metadata> {
  const { locale, n } = await params;
  const page = parsePageNumber(n);
  return page ? buildBlogIndexMetadata(locale, page) : {};
}

export default async function BlogIndexLaterPage({ params }: BlogIndexLaterPageProps) {
  const { locale, n } = await params;
  const page = parsePageNumber(n);
  if (!page || !routing.locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  return (
    <RouteMessages route="/blog/page/[n]">
      <BlogIndexPageBody locale={locale} page={page} />
    </RouteMessages>
  );
}
