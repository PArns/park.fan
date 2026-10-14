import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { locales } from '@/i18n/config';
import { buildCategoryTree } from '@/lib/blog/categories';
import { laterPageNumbers, pagedSegments } from '@/lib/blog/pagination';
import { BlogCategoryPageBody, buildCategoryMetadata } from '@/components/blog/blog-category-page';
import { RouteMessages } from '@/i18n/route-messages';

interface CategoryPageProps {
  params: Promise<{ locale: string; path: string[] }>;
}

// Every category in every locale, and every later page of it (`/page/<n>` ends the catch-all).
// News is not a category: its listing is `/news` (`lib/blog/paths.ts`).

export async function generateStaticParams() {
  const out: Array<{ locale: string; path: string[] }> = [];
  for (const locale of locales) {
    const { flat } = buildCategoryTree(locale);
    for (const [path, node] of flat) {
      const segments = path.split('/');
      out.push({ locale, path: segments });
      for (const page of laterPageNumbers(node.totalPostCount)) {
        out.push({ locale, path: pagedSegments(segments, page) });
      }
    }
  }
  return out;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { locale, path } = await params;
  return buildCategoryMetadata(locale, path);
}

export default async function BlogCategoryPage({ params }: CategoryPageProps) {
  const { locale, path } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  return (
    <RouteMessages route="/blog/category/[...path]">
      <BlogCategoryPageBody locale={locale} path={path} />
    </RouteMessages>
  );
}
