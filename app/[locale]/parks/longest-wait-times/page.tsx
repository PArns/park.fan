import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Trophy } from 'lucide-react';

import { SITE_URL } from '@/i18n/config';
import type { Locale } from '@/i18n/config';
import { Link } from '@/i18n/navigation';
import { getRankedCountries, type RankedCountry } from '@/lib/api/rankings';
import { currentRankingYear } from '@/lib/rankings/year';
import { rankingHubPath, rankingPath } from '@/lib/rankings/segments';
import { translateCountry } from '@/lib/i18n/helpers';
import { assertServableRoute, isServableRoute } from '@/lib/utils/route-guards';
import { buildAlternates, buildOpenGraphMetadata, fitTitle } from '@/lib/utils/metadata';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { PageContainer } from '@/components/common/page-container';
import { PageHeader } from '@/components/common/page-header';
import { BreadcrumbStructuredData, ItemListStructuredData } from '@/components/seo/structured-data';

interface RankingHubPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Rendered per request behind the edge cache, like the country rankings it lists: each of them is
 * data-cached for a day, and the `CDN-Cache-Control` day in next.config.ts is the page's own cache.
 */
export const dynamic = 'force-dynamic';

/** The countries with a ranking of the quoted year, the most ranked rides first. */
async function loadCountries(): Promise<{ year: number; countries: RankedCountry[] }> {
  const year = currentRankingYear();
  const countries = [...(await getRankedCountries(year))].sort(
    (a, b) => b.ranking.meta.totalRanked - a.ranking.meta.totalRanked
  );
  return { year, countries };
}

export async function generateMetadata({ params }: RankingHubPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isServableRoute(locale)) return {};
  const { year, countries } = await loadCountries();
  if (countries.length === 0) return {};
  const t = await getTranslations({ locale, namespace: 'seo.rankings' });
  const title = fitTitle(t('hubTitle', { year: String(year) }));
  const description = t('hubDescription', { year: String(year), count: countries.length });
  return {
    title,
    description,
    ...buildOpenGraphMetadata({
      locale,
      title,
      description,
      url: `${SITE_URL}/${locale}${rankingHubPath(locale)}`,
      ogImageUrl: getOgImageUrl([locale]),
    }),
    alternates: buildAlternates(locale, (l: Locale) => rankingHubPath(l)),
  };
}

export default async function RankingHubPage({ params }: RankingHubPageProps) {
  const { locale } = await params;
  assertServableRoute(locale);
  setRequestLocale(locale);

  const { year, countries } = await loadCountries();
  if (countries.length === 0) notFound();

  const t = await getTranslations('rankings');
  const tGeo = await getTranslations('geo');
  const tCommon = await getTranslations('common');
  const tNav = await getTranslations('navigation');
  const yearText = String(year);
  const title = t('hubH1', { year: yearText });
  const breadcrumbs = [
    { name: tCommon('home'), url: '/' },
    { name: tNav('continents'), url: '/parks' },
  ];
  const currentPage = tNav('rankings');
  const hubPath = rankingHubPath(locale);

  const cards = countries.map(({ continent, country, ranking }) => ({
    key: `${continent}/${country}`,
    name: translateCountry(tGeo, country, locale),
    href: rankingPath(locale, continent, country, year),
    top: ranking.attractions[0],
    count: ranking.meta.totalRanked,
  }));

  return (
    <PageContainer>
      <BreadcrumbStructuredData
        breadcrumbs={breadcrumbs}
        currentPage={{ name: currentPage, url: hubPath }}
        locale={locale}
      />
      <ItemListStructuredData
        items={cards.map((card) => ({
          name: t('h1', { year: yearText, country: card.name }),
          url: `/${locale}${card.href}`,
        }))}
        listName={title}
        pageUrl={`/${locale}${hubPath}`}
      />
      <PageHeader
        breadcrumbs={breadcrumbs}
        currentPage={currentPage}
        title={title}
        description={t('hubLead', { year: yearText })}
      />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <li key={card.key}>
            <Link
              href={card.href}
              prefetch={false}
              className="bg-card/60 hover:border-primary/40 block h-full rounded-2xl border p-4 transition-colors"
            >
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Trophy className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                {card.name}
              </h2>
              <p className="mt-1 text-sm">
                {t('hubTop', {
                  ride: card.top.attractionName,
                  park: card.top.parkName,
                  minutes: card.top.avgWaitP90,
                })}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {t('hubRides', { count: card.count })}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}
