import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { buildNewsIndexMetadata, NewsIndexPageBody } from '@/components/blog/news-index-page';
import { RouteMessages } from '@/i18n/route-messages';

interface NewsIndexPageProps {
  params: Promise<{ locale: string }>;
}

// The park filter is a query parameter read in the browser, so it adds no URLs and the canonical
// stays `/news`. A later page is the path-based `/news/page/[n]`.

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: NewsIndexPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildNewsIndexMetadata(locale, 1);
}

export default async function NewsIndexPage({ params }: NewsIndexPageProps) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  return (
    <RouteMessages route="/news">
      <NewsIndexPageBody locale={locale} page={1} />
    </RouteMessages>
  );
}
