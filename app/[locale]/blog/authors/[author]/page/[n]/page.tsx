import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n/config';
import { listAuthorKeys } from '@/lib/blog/authors';
import { hasPublishedPosts } from '@/lib/blog/listing';
import { laterPageNumbers, parsePageNumber } from '@/lib/blog/pagination';
import {
  BlogAuthorPageBody,
  buildAuthorMetadata,
  listAuthorArticles,
} from '@/components/blog/blog-author-page';
import { routing, type Locale } from '@/i18n/routing';
import { RouteMessages } from '@/i18n/route-messages';

interface AuthorLaterPageProps {
  params: Promise<{ locale: string; author: string; n: string }>;
}

// Only an author with enough articles for a second page has one; every other path is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return locales
    .filter((locale) => hasPublishedPosts(locale))
    .flatMap((locale) =>
      listAuthorKeys().flatMap((author) =>
        laterPageNumbers(listAuthorArticles(locale, author).length).map((page) => ({
          locale,
          author,
          n: String(page),
        }))
      )
    );
}

export async function generateMetadata({ params }: AuthorLaterPageProps): Promise<Metadata> {
  const { locale, author, n } = await params;
  const page = parsePageNumber(n);
  return page ? buildAuthorMetadata(locale, author, page) : {};
}

export default async function BlogAuthorLaterPage({ params }: AuthorLaterPageProps) {
  const { locale, author, n } = await params;
  const page = parsePageNumber(n);
  if (!page || !routing.locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  return (
    <RouteMessages route="/blog/authors/[author]/page/[n]">
      <BlogAuthorPageBody locale={locale} author={author} page={page} />
    </RouteMessages>
  );
}
