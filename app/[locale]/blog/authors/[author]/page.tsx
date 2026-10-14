import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n/config';
import { listAuthorKeys } from '@/lib/blog/authors';
import { BlogAuthorPageBody, buildAuthorMetadata } from '@/components/blog/blog-author-page';
import { routing, type Locale } from '@/i18n/routing';
import { RouteMessages } from '@/i18n/route-messages';

interface AuthorPageProps {
  params: Promise<{ locale: string; author: string }>;
}

/** One page per (locale × registry author). */
export async function generateStaticParams() {
  const out: Array<{ locale: string; author: string }> = [];
  for (const locale of locales) {
    for (const author of listAuthorKeys()) {
      out.push({ locale, author });
    }
  }
  return out;
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { locale, author } = await params;
  return buildAuthorMetadata(locale, author, 1);
}

export default async function BlogAuthorPage({ params }: AuthorPageProps) {
  const { locale, author } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  return (
    <RouteMessages route="/blog/authors/[author]">
      <BlogAuthorPageBody locale={locale} author={author} page={1} />
    </RouteMessages>
  );
}
