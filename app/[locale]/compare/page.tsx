import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Scale } from 'lucide-react';
import { generateAlternateLanguages, SITE_URL } from '@/i18n/config';
import { buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { routing } from '@/i18n/routing';
import { RouteMessages } from '@/i18n/route-messages';
import { LandingHero } from '@/components/marketing/editorial-ui';
import { ParkCompareTool } from '@/components/compare/park-compare-tool';
import { parseCompareParam } from '@/lib/compare/selection';
import { resolveCompareParks } from '@/lib/compare/resolve';
import { weekdayName } from '@/lib/utils/intl-format';
import { assertServableRoute, isServableRoute } from '@/lib/utils/route-guards';

interface ComparePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ parks?: string | string[] }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: ComparePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isServableRoute(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'compare.meta' });

  return {
    title: t('title'),
    description: t('description'),
    // Never indexed, with or without a selection: the bare page is a search field, and every
    // `?parks=` variant is one more URL for the same table. Whether it should join the index is
    // a product decision (PAR-655), so the page ships closed and stays out of the sitemap.
    robots: { index: false, follow: true },
    ...buildOpenGraphMetadata({
      locale,
      title: t('title'),
      description: t('description'),
      url: `${SITE_URL}/${locale}/compare`,
      ogImageUrl: getOgImageUrl([locale, 'compare']),
    }),
    alternates: {
      canonical: `${SITE_URL}/${locale}/compare`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/compare`),
        'x-default': `${SITE_URL}/en/compare`,
      },
    },
  };
}

export default async function ComparePage({ params, searchParams }: ComparePageProps) {
  const { locale } = await params;
  assertServableRoute(locale);
  setRequestLocale(locale);

  const t = await getTranslations('compare');
  const tParks = await getTranslations('parks');
  const tQuietest = await getTranslations('bestTime.quietestByPark');

  const { parks, ambiguousSlugs } = await resolveCompareParks(
    parseCompareParam((await searchParams).parks)
  );

  return (
    <RouteMessages route="/compare">
      <LandingHero
        variant="compact"
        kicker={t('kicker')}
        title={t('title')}
        tagline={t('subtitle')}
        action={{ href: '#compare', label: t('action'), icon: Scale }}
      />

      <div id="compare" className="container mx-auto max-w-4xl scroll-mt-24 px-4 pt-10 pb-12">
        <ParkCompareTool
          initialParks={parks}
          ambiguousSlugs={ambiguousSlugs}
          cardLabels={{
            title: tParks('stats.comparisonTitle'),
            labelPark: tParks('stats.comparisonPark'),
            labelParkAverage: tParks('stats.parkAverage'),
            labelLongest: tParks('stats.longestQueue'),
            labelMinutes: tParks('overview.minutesUnit'),
            labelQuietestDay: tQuietest('colQuietest'),
            weekdayNames: Array.from({ length: 7 }, (_, i) => weekdayName(i, locale)),
          }}
        />
      </div>
    </RouteMessages>
  );
}
