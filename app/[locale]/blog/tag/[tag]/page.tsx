import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { locales, type Locale } from '@/i18n/config';
import { listTags } from '@/lib/blog/tags';
import { BlogTagPageBody, buildTagMetadata } from '@/components/blog/blog-tag-page';
import { routing } from '@/i18n/routing';
import { RouteMessages } from '@/i18n/route-messages';

interface TagPageProps {
  params: Promise<{ locale: string; tag: string }>;
}

/** One page per (locale × tag). */
export async function generateStaticParams() {
  const out: Array<{ locale: string; tag: string }> = [];
  for (const locale of locales) {
    for (const tag of listTags(locale as Locale)) {
      out.push({ locale, tag: tag.slug });
    }
  }
  return out;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { locale, tag } = await params;
  return buildTagMetadata(locale, tag, 1);
}

export default async function BlogTagPage({ params }: TagPageProps) {
  const { locale, tag } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  return (
    <RouteMessages route="/blog/tag/[tag]">
      <BlogTagPageBody locale={locale} tag={tag} page={1} />
    </RouteMessages>
  );
}
