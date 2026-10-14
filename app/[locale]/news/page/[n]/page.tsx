import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { locales } from '@/i18n/config';
import { hasPublishedPosts, listNewsByDate } from '@/lib/blog/listing';
import { laterPageNumbers, parsePageNumber } from '@/lib/blog/pagination';
import { buildNewsIndexMetadata, NewsIndexPageBody } from '@/components/blog/news-index-page';
import { RouteMessages } from '@/i18n/route-messages';

interface NewsLaterPageProps {
  params: Promise<{ locale: string; n: string }>;
}

// Every later page of every locale is built; anything else, `/page/1` included (page 1 is
// `/news`), is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return locales
    .filter((locale) => hasPublishedPosts(locale))
    .flatMap((locale) =>
      laterPageNumbers(listNewsByDate(locale).length).map((page) => ({ locale, n: String(page) }))
    );
}

export async function generateMetadata({ params }: NewsLaterPageProps): Promise<Metadata> {
  const { locale, n } = await params;
  const page = parsePageNumber(n);
  return page ? buildNewsIndexMetadata(locale, page) : {};
}

export default async function NewsLaterPage({ params }: NewsLaterPageProps) {
  const { locale, n } = await params;
  const page = parsePageNumber(n);
  if (!page || !routing.locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  return (
    <RouteMessages route="/news/page/[n]">
      <NewsIndexPageBody locale={locale} page={page} />
    </RouteMessages>
  );
}
