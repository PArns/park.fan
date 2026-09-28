import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { buildNewsIndexMetadata, NewsIndexPageBody } from '@/components/blog/news-index-page';
import { RouteMessages } from '@/i18n/route-messages';

interface NewsIndexPageProps {
  params: Promise<{ locale: string }>;
}

// The news overview, which was `/blog/category/news`: a dated stream with a park filter
// (`NewsIndexPageBody`). Statically generated per locale, like the blog index; the filter is a
// query parameter read in the browser, so it adds no URLs and the canonical stays `/news`.

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: NewsIndexPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildNewsIndexMetadata(locale);
}

export default async function NewsIndexPage({ params }: NewsIndexPageProps) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  return (
    <RouteMessages route="/news">
      <NewsIndexPageBody locale={locale} />
    </RouteMessages>
  );
}
