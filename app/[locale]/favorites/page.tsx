import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Star } from 'lucide-react';
import { SITE_URL } from '@/i18n/config';
import { routing } from '@/i18n/routing';
import { assertServableRoute, isServableRoute } from '@/lib/utils/route-guards';
import { PageContainer } from '@/components/common/page-container';
import { FavoritesSection } from '@/components/parks/favorites-section';
import { FavoritesHowTo } from '@/components/parks/favorites-how-to';

/**
 * Everything this browser has starred, on a page of its own — the destination the header
 * band's "+N more" and "view all" links point at.
 *
 * Same shape as `/alerts`, down to the segment: both report state that lives in this one
 * browser, so both are `noindex` and neither is in a sitemap (a noindex URL in a sitemap is a
 * Search Console error), and neither gets a localized slug — the four routes that have one
 * (`lib/glossary/segments.ts` and its siblings) are the four that are meant to rank.
 *
 * `FavoritesSection` is imported directly rather than through `next/dynamic` as it is on the
 * homepage and the editorial routes. There it is a band most visitors never fill and the split
 * chunk is the point; here it is the page, so a `<Suspense>` boundary around it would only buy
 * the graft-in that `FavoritesEmptyState` exists to prevent.
 *
 * And there is no `<RouteMessages>`: the page's own three strings are read on the server, and
 * the two client components below need `favorites` and `navigation`, which the locale layout
 * already ships. The card namespaces travel the way they do everywhere else, as the lazy chunk
 * `FavoritesSection` fetches for itself.
 */
interface FavoritesPageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: FavoritesPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isServableRoute(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'favoritesPage' });
  return {
    title: t('title'),
    // A cookie in one browser — nothing here is the same page twice.
    robots: { index: false, follow: false },
    alternates: { canonical: `${SITE_URL}/${locale}/favorites` },
  };
}

export default async function FavoritesPage({ params }: FavoritesPageProps) {
  const { locale } = await params;
  assertServableRoute(locale);
  setRequestLocale(locale);
  const t = await getTranslations('favoritesPage');

  return (
    <>
      <PageContainer className="pb-0">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-xl">
            <Star className="text-primary size-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
          </div>
        </div>
      </PageContainer>

      {/* `standalone`: the heading is the `<h1>` above and the instructions are the block
          below, in every state — the band would otherwise draw both a second time, and in the
          empty state the three steps would stand twice under each other. */}
      <FavoritesSection standalone />

      <PageContainer>
        <h2 className="mb-4 text-lg font-semibold">{t('howToTitle')}</h2>
        <FavoritesHowTo />
      </PageContainer>
    </>
  );
}
