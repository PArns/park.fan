import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { locales } from '@/i18n/config';
import { buildCategoryTree } from '@/lib/blog/categories';
import { BlogCategoryPageBody, buildCategoryMetadata } from '@/components/blog/blog-category-page';
import { RouteMessages } from '@/i18n/route-messages';

interface CategoryPageProps {
  params: Promise<{ locale: string; path: string[] }>;
}

// Statically generated for every category in every locale. See the index
// page for the pagination plan when post counts grow past one page. The news
// category is not one of them: its listing is `/news` (`lib/blog/paths.ts`),
// and `buildCategoryTree` no longer carries it at all (articles only).

export async function generateStaticParams() {
  const out: Array<{ locale: string; path: string[] }> = [];
  for (const locale of locales) {
    const { flat } = buildCategoryTree(locale);
    for (const path of flat.keys()) {
      out.push({ locale, path: path.split('/') });
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
