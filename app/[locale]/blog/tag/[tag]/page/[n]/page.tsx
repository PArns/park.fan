import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { locales, type Locale } from '@/i18n/config';
import { listTags } from '@/lib/blog/tags';
import { laterPageNumbers, parsePageNumber } from '@/lib/blog/pagination';
import { BlogTagPageBody, buildTagMetadata } from '@/components/blog/blog-tag-page';
import { routing } from '@/i18n/routing';
import { RouteMessages } from '@/i18n/route-messages';

interface TagLaterPageProps {
  params: Promise<{ locale: string; tag: string; n: string }>;
}

// Only the tags long enough for a second page have one; every other path is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    listTags(locale as Locale).flatMap((tag) =>
      laterPageNumbers(tag.count).map((page) => ({ locale, tag: tag.slug, n: String(page) }))
    )
  );
}

export async function generateMetadata({ params }: TagLaterPageProps): Promise<Metadata> {
  const { locale, tag, n } = await params;
  const page = parsePageNumber(n);
  return page ? buildTagMetadata(locale, tag, page) : {};
}

export default async function BlogTagLaterPage({ params }: TagLaterPageProps) {
  const { locale, tag, n } = await params;
  const page = parsePageNumber(n);
  if (!page || !routing.locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  return (
    <RouteMessages route="/blog/tag/[tag]/page/[n]">
      <BlogTagPageBody locale={locale} tag={tag} page={page} />
    </RouteMessages>
  );
}
