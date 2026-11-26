import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Ruler } from 'lucide-react';

import { SITE_URL } from '@/i18n/config';
import type { Locale } from '@/i18n/config';
import { RouteMessages } from '@/i18n/route-messages';
import {
  getCountryAttractionRanking,
  getRankedCountriesSeed,
  RANKING_MIN_INDEXED_RIDES,
  type AttractionRanking,
} from '@/lib/api/rankings';
import { currentRankingYear, FIRST_RANKING_YEAR } from '@/lib/rankings/year';
import { rankingPath } from '@/lib/rankings/segments';
import { translateContinent, translateCountry } from '@/lib/i18n/helpers';
import { generateCountryBreadcrumbs } from '@/lib/utils/breadcrumb-utils';
import { assertServableRoute, isServableRoute } from '@/lib/utils/route-guards';
import { getDateTimeFormat, getListFormat } from '@/lib/utils/intl-format';
import {
  buildAlternates,
  buildOpenGraphMetadata,
  fitTitle,
  fitWithin,
  MAX_DESCRIPTION_LENGTH,
} from '@/lib/utils/metadata';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { PageContainer } from '@/components/common/page-container';
import { PageHeader } from '@/components/common/page-header';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { GlassCard } from '@/components/common/glass-card';
import { BreadcrumbStructuredData, ItemListStructuredData } from '@/components/seo/structured-data';
import { AttractionRankingTable } from '@/components/rankings/attraction-ranking-table';
import { RankingPodium } from '@/components/rankings/ranking-podium';
import { RankingParks, tallyParks } from '@/components/rankings/ranking-parks';
import { MoreRankings } from '@/components/rankings/more-rankings';

interface RankingPageProps {
  params: Promise<{ locale: string; continent: string; country: string; year: string }>;
}

/** Places shown as photo cards above the table. */
const PODIUM_PLACES = 3;

/** Rides the meta description names, the head of the list. */
const DESCRIPTION_RIDES = 3;

/**
 * Rendered per request behind the edge cache, like the park sub-pages: the ranking is recomputed
 * once a day and data-cached for a day (`CACHE_TTL.stats`), and the `CDN-Cache-Control` day in
 * next.config.ts is the page's only cache. See docs/rules/an-isr-route-needs-both-halves.md.
 */
export const dynamic = 'force-dynamic';

/** The year in the URL when it is one the site ranks, else `null` (a 404). */
function parseYear(raw: string): number | null {
  if (!/^\d{4}$/.test(raw)) return null;
  const year = Number(raw);
  const latest = new Date().getUTCFullYear();
  return year >= FIRST_RANKING_YEAR && year <= latest ? year : null;
}

async function loadRanking(
  continent: string,
  country: string,
  rawYear: string
): Promise<{ year: number; ranking: AttractionRanking } | null> {
  const year = parseYear(rawYear);
  if (year === null) return null;
  const ranking = await getCountryAttractionRanking(continent, country, year);
  if (!ranking || ranking.attractions.length === 0) return null;
  return { year, ranking };
}

export async function generateMetadata({ params }: RankingPageProps): Promise<Metadata> {
  const { locale, continent, country, year: rawYear } = await params;
  if (!isServableRoute(locale, continent, country, rawYear)) return {};
  const loaded = await loadRanking(continent, country, rawYear);
  if (!loaded) return {};
  const { year, ranking } = loaded;

  const t = await getTranslations({ locale, namespace: 'seo.rankings' });
  const tGeo = await getTranslations({ locale, namespace: 'geo' });
  const countryName = translateCountry(tGeo, country, locale);
  const values = { year: String(year), country: countryName };

  const title = fitTitle(t('title', values), t('titleShort', values));
  // The head of the list, one ride fewer per candidate until the description fits.
  const names = ranking.attractions.map((a) => `${a.attractionName} (${a.parkName})`);
  const list = getListFormat(locale, { type: 'conjunction' });
  const description = fitWithin(
    MAX_DESCRIPTION_LENGTH,
    ...[DESCRIPTION_RIDES, 2, 1].map((n) =>
      t('description', { ...values, top: list.format(names.slice(0, n)) })
    )
  );
  const path = (l: Locale) => rankingPath(l, continent, country, year);

  return {
    title,
    description,
    ...buildOpenGraphMetadata({
      locale,
      title,
      description,
      url: `${SITE_URL}/${locale}${path(locale as Locale)}`,
      ogImageUrl: getOgImageUrl([locale, continent, country]),
    }),
    alternates: buildAlternates(locale, path),
    ...(ranking.attractions.length < RANKING_MIN_INDEXED_RIDES && {
      robots: { index: false, follow: true },
    }),
  };
}

export default async function RankingPage({ params }: RankingPageProps) {
  const { locale, continent, country, year: rawYear } = await params;
  assertServableRoute(locale, continent, country, rawYear);
  setRequestLocale(locale);

  const loaded = await loadRanking(continent, country, rawYear);
  if (!loaded) notFound();
  const { year, ranking } = loaded;

  // The way on: the other countries of this year and this country's other ranked years, from the
  // data-cached requests their pages answer with, so no link leads to a 404.
  const otherYears = Array.from(
    { length: Math.max(0, currentRankingYear() - FIRST_RANKING_YEAR + 1) },
    (_, i) => FIRST_RANKING_YEAR + i
  ).filter((y) => y !== year);
  const [rankedCountries, otherYearRankings] = await Promise.all([
    getRankedCountriesSeed(year),
    Promise.all(otherYears.map((y) => getCountryAttractionRanking(continent, country, y))),
  ]);
  const rankedYears = otherYears.filter(
    (_, i) => (otherYearRankings[i]?.attractions.length ?? 0) > 0
  );

  const t = await getTranslations('rankings');
  const tGeo = await getTranslations('geo');
  const tCommon = await getTranslations('common');
  const tNav = await getTranslations('navigation');

  const countryName = translateCountry(tGeo, country, locale);
  const continentName = translateContinent(tGeo, continent, locale);
  const yearText = String(year);
  const title = t('h1', { year: yearText, country: countryName });

  // The country is the last crumb before this page, so it becomes a link and the page itself the
  // current one.
  const { breadcrumbs: geoCrumbs, currentPage: countryCrumb } = generateCountryBreadcrumbs({
    continent,
    continentName,
    countryName,
    homeLabel: tCommon('home'),
    continentsLabel: tNav('continents'),
  });
  const breadcrumbs = [...geoCrumbs, { name: countryCrumb, url: `/parks/${continent}/${country}` }];
  const pagePath = rankingPath(locale, continent, country, year);
  const currentPage = t('countryLink', { year: yearText });

  const dataTo = ranking.meta.dataTo
    ? getDateTimeFormat(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(`${ranking.meta.dataTo}T00:00:00Z`))
    : null;

  return (
    <RouteMessages route="/parks/[continent]/[country]/longest-wait-times/[year]">
      <PageContainer>
        <BreadcrumbStructuredData
          breadcrumbs={breadcrumbs}
          currentPage={{ name: currentPage, url: pagePath }}
          locale={locale}
        />
        <ItemListStructuredData
          items={ranking.attractions.map((a) => ({
            name: `${a.attractionName} (${a.parkName})`,
            url: `/${locale}/parks/${a.continentSlug}/${a.countrySlug}/${a.citySlug}/${a.parkSlug}/${a.attractionSlug}`,
          }))}
          listName={title}
          pageUrl={`/${locale}${pagePath}`}
        />
        <PageHeader
          breadcrumbs={breadcrumbs}
          currentPage={currentPage}
          title={title}
          description={
            <>
              <span className="block">
                {t('lead', {
                  year: yearText,
                  // What the page lists, not the whole ranking, which runs past the listed head.
                  count: ranking.attractions.length,
                  parks: tallyParks(ranking.attractions).length,
                })}
              </span>
              <span className="mt-1 block">
                {ranking.meta.yearComplete || !dataTo
                  ? t('complete', { year: yearText })
                  : t('running', { date: dataTo })}
              </span>
            </>
          }
        />

        {/* The first three as photo cards, the rest as the table, on one scale. */}
        <RankingPodium attractions={ranking.attractions.slice(0, PODIUM_PLACES)} />
        {ranking.attractions.length > PODIUM_PLACES && (
          <AttractionRankingTable
            attractions={ranking.attractions.slice(PODIUM_PLACES)}
            longestPeak={ranking.attractions[0].avgWaitP90}
          />
        )}

        <RankingParks attractions={ranking.attractions} />

        <section className="mt-10 max-w-3xl">
          <ChapterHeading icon={Ruler} title={t('methodTitle')} className="mb-3" />
          <GlassCard variant="medium" className="p-4">
            <p className="text-foreground/85 text-[15px] leading-relaxed">
              {t('method', { year: yearText, minDays: ranking.meta.minAttractionDays })}
            </p>
          </GlassCard>
        </section>

        <MoreRankings
          locale={locale}
          continent={continent}
          country={country}
          year={year}
          countries={rankedCountries ?? []}
          years={rankedYears}
        />
      </PageContainer>
    </RouteMessages>
  );
}
