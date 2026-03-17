import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getGlossaryTerms, getTermBySlug, GLOSSARY_SEGMENTS } from '@/lib/glossary/translations';
import { locales, SITE_URL } from '@/i18n/config';
import { buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { getGeoStructure } from '@/lib/api/discovery';
import { PageContainer } from '@/components/common/page-container';
import { GlossaryTermDetail } from '@/components/glossary/glossary-term-detail';
import { GlossaryBackground } from '@/components/glossary/glossary-background';
import { GlossaryStructuredData } from '@/components/seo/glossary-structured-data';
import { BreadcrumbStructuredData } from '@/components/seo/structured-data';
import { FeaturedParksSection } from '@/components/home/featured-parks-section';
import nextDynamic from 'next/dynamic';
import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';

const FavoritesSection = nextDynamic(
  () =>
    import('@/components/parks/favorites-section').then((m) => ({ default: m.FavoritesSection })),
  { loading: () => null, ssr: true }
);

const NearbyParksCard = nextDynamic(
  () =>
    import('@/components/parks/nearby-parks-card').then((m) => ({ default: m.NearbyParksCard })),
  { loading: () => null, ssr: true }
);

interface TermPageProps {
  params: Promise<{ locale: string; term: string }>;
}

export async function generateStaticParams() {
  const params: { locale: string; term: string }[] = [];
  for (const locale of locales) {
    const terms = await getGlossaryTerms(locale);
    for (const term of terms) {
      params.push({ locale, term: term.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: TermPageProps): Promise<Metadata> {
  const { locale, term: termSlug } = await params;
  const [term, t] = await Promise.all([
    getTermBySlug(locale as Locale, termSlug),
    getTranslations({ locale, namespace: 'glossary' }),
  ]);
  if (!term) return {};

  const segment = GLOSSARY_SEGMENTS[locale as Locale] ?? 'glossary';
  const url = `${SITE_URL}/${locale}/${segment}/${termSlug}`;

  // Keyword-rich title: "Wait Time – Theme Park Glossary | park.fan"
  const title = `${term.name} – ${t('termTitleSuffix')} | park.fan`;
  // Description: first paragraph of definition, capped at 155 chars
  const rawDesc = term.definition.split('\n\n')[0];
  const description =
    rawDesc.length > 155 ? rawDesc.slice(0, 152).replace(/\s\S*$/, '') + '…' : rawDesc;
  // Keywords: term name + related IDs resolved to names + category label
  const allTerms = await getGlossaryTerms(locale as Locale);
  const relatedNames = term.relatedTermIds
    ? allTerms.filter((x) => term.relatedTermIds!.includes(x.id)).map((x) => x.name)
    : [];
  const keywords = [term.name, t(`category.${term.category}`), ...relatedNames].join(', ');

  // Build hreflang entries with locale-specific slugs
  const languages: Record<string, string> = {};
  for (const l of locales) {
    const localSlug = term.slugs[l];
    const localSegment = GLOSSARY_SEGMENTS[l];
    languages[l] = `${SITE_URL}/${l}/${localSegment}/${localSlug}`;
  }
  languages['x-default'] = `${SITE_URL}/en/glossary/${term.slugs.en}`;

  return {
    title,
    description,
    keywords,
    ...buildOpenGraphMetadata({
      locale,
      title,
      description,
      url,
      ogImageUrl: getOgImageUrl([locale, segment, termSlug]),
    }),
    alternates: {
      canonical: url,
      languages,
    },
  };
}

export const revalidate = 86400;

export default async function GlossaryTermPage({ params }: TermPageProps) {
  const { locale, term: termSlug } = await params;
  setRequestLocale(locale);

  const term = await getTermBySlug(locale as Locale, termSlug);
  if (!term) notFound();

  const [t, tCommon, geoData] = await Promise.all([
    getTranslations('glossary'),
    getTranslations('common'),
    getGeoStructure().catch(() => null),
  ]);

  const segment = GLOSSARY_SEGMENTS[locale as Locale] ?? 'glossary';

  // Load related terms
  const allTerms = await getGlossaryTerms(locale as Locale);
  const relatedTerms = term.relatedTermIds
    ? allTerms.filter((t) => term.relatedTermIds!.includes(t.id))
    : [];

  const breadcrumbs = [
    { name: tCommon('home'), url: '/' },
    { name: t('overviewTitle'), url: `/${segment}` },
  ];

  return (
    <>
      <GlossaryBackground />
      <PageContainer>
        <GlossaryStructuredData
          term={term}
          locale={locale as Locale}
          segment={segment}
          variant="detail"
        />
        <BreadcrumbStructuredData
          breadcrumbs={[
            ...breadcrumbs,
            { name: term.name, url: `/${segment}/${termSlug}` },
          ]}
        />
        <GlossaryTermDetail
          term={term}
          relatedTerms={relatedTerms}
          breadcrumbs={breadcrumbs}
          locale={locale as Locale}
          segment={segment}
          labels={{
            backToGlossary: t('backToGlossary'),
            relatedTerms: t('relatedTerms'),
            category: t(`category.${term.category}`),
            termH1Suffix: t('termH1Suffix'),
          }}
        />
      </PageContainer>

      {/* Nearby parks + favorites — same widgets as homepage */}
      <section className="border-b px-4 py-8">
        <div className="container mx-auto">
          <NearbyParksCard />
        </div>
      </section>

      <FavoritesSection />

      <FeaturedParksSection locale={locale as Locale} geoData={geoData} />
    </>
  );
}
