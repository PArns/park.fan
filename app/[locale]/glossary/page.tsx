import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getGlossaryTerms, GLOSSARY_SEGMENTS } from '@/lib/glossary/translations';
import { locales, generateAlternateLanguages, SITE_URL } from '@/i18n/config';
import { buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { PageContainer } from '@/components/common/page-container';
import { GlossaryOverviewClient } from '@/components/glossary/glossary-overview-client';
import { GlossaryBackground } from '@/components/glossary/glossary-background';
import { GlossaryStructuredData } from '@/components/seo/glossary-structured-data';
import type { GlossaryCategory, GlossaryTermWithEnName } from '@/lib/glossary/types';
import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';

interface GlossaryPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: GlossaryPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'glossary' });
  const segment = GLOSSARY_SEGMENTS[locale as Locale] ?? 'glossary';
  const url = `${SITE_URL}/${locale}/${segment}`;
  const title = `${t('overviewTitle')} | park.fan`;
  const description = t('overviewDescription');

  return {
    title,
    description,
    keywords: t('overviewKeywords'),
    ...buildOpenGraphMetadata({
      locale,
      title,
      description,
      url,
      ogImageUrl: getOgImageUrl([locale, segment]),
    }),
    alternates: {
      canonical: url,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/${GLOSSARY_SEGMENTS[l]}`),
        'x-default': `${SITE_URL}/en/glossary`,
      },
    },
  };
}

export const revalidate = 86400; // 24h — static content

const CATEGORY_ORDER: GlossaryCategory[] = [
  'wait-times',
  'crowd-levels',
  'park-operations',
  'planning',
  'attractions',
  'coasters',
  'coaster-elements',
];

export default async function GlossaryPage({ params }: GlossaryPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('glossary');
  const tCommon = await getTranslations('common');

  const terms = await getGlossaryTerms(locale as Locale);
  const segment = GLOSSARY_SEGMENTS[locale as Locale] ?? 'glossary';

  // Load English names for cross-language search (cached — no extra I/O for EN locale)
  const enTerms = locale !== 'en' ? await getGlossaryTerms('en') : terms;
  const enNameMap = new Map(enTerms.map((t) => [t.id, t.name]));

  // Group by category, sort alphabetically within each group
  const grouped = new Map<GlossaryCategory, GlossaryTermWithEnName[]>();
  for (const term of terms) {
    const withEnName: GlossaryTermWithEnName = {
      ...term,
      enName: enNameMap.get(term.id) ?? term.name,
    };
    const existing = grouped.get(term.category) ?? [];
    existing.push(withEnName);
    grouped.set(term.category, existing);
  }
  for (const [cat, catTerms] of grouped) {
    grouped.set(
      cat,
      [...catTerms].sort((a, b) => a.name.localeCompare(b.name, locale))
    );
  }

  // Build ordered array for the client component (with translated category labels)
  const groupedTerms = CATEGORY_ORDER.flatMap((category) => {
    const categoryTerms = grouped.get(category);
    if (!categoryTerms || categoryTerms.length === 0) return [];
    return [{ category, categoryLabel: t(`category.${category}`), terms: categoryTerms }];
  });

  const breadcrumbs = [{ name: tCommon('home'), url: '/' }];

  return (
    <>
      <GlossaryBackground />
      <PageContainer>
        <GlossaryStructuredData
          terms={terms}
          locale={locale as Locale}
          segment={segment}
          variant="overview"
        />
        <GlossaryOverviewClient
          groupedTerms={groupedTerms}
          locale={locale as Locale}
          segment={segment}
          title={t('overviewTitle')}
          description={t('overviewDescription')}
          breadcrumbs={breadcrumbs}
        />
      </PageContainer>
    </>
  );
}
