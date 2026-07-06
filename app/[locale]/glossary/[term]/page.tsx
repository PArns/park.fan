import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound, permanentRedirect } from 'next/navigation';
import { getGlossaryTerms, getTermBySlug, findTermByAnySlug } from '@/lib/glossary/translations';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { locales, SITE_URL } from '@/i18n/config';
import { buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { PageContainer } from '@/components/common/page-container';
import { GlossaryTermDetail } from '@/components/glossary/glossary-term-detail';
import { GlossaryBackground } from '@/components/glossary/glossary-background';
import { GlossaryStructuredData } from '@/components/seo/glossary-structured-data';
import { BreadcrumbStructuredData } from '@/components/seo/structured-data';
import { Suspense } from 'react';
import { FeaturedParksSlot } from '@/components/home/featured-parks-slot';
import { FeaturedParksSkeleton } from '@/components/home/home-skeletons';
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
  if (!term) {
    // Foreign-locale slug (legacy cross-locale URLs)? Point canonical at the
    // translated slug — the page body issues the actual 308.
    const translated = await findTermByAnySlug(locale as Locale, termSlug);
    if (translated) {
      const segment = GLOSSARY_SEGMENTS[locale as Locale] ?? 'glossary';
      return {
        alternates: { canonical: `${SITE_URL}/${locale}/${segment}/${translated.slug}` },
      };
    }
    return {};
  }

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

export default async function GlossaryTermPage({ params }: TermPageProps) {
  const { locale, term: termSlug } = await params;
  setRequestLocale(locale);

  const term = await getTermBySlug(locale as Locale, termSlug);
  if (!term) {
    // Legacy cross-locale URLs (e.g. /nl/glossaire/harnais-epaules — a French
    // slug under the NL locale, from next-intl's old auto-alternates) carry a
    // slug from another locale. Translate it and 308 to the local URL so the
    // thousands of such URLs in Google's index resolve instead of 404ing.
    const translated = await findTermByAnySlug(locale as Locale, termSlug);
    if (translated) {
      const segment = GLOSSARY_SEGMENTS[locale as Locale] ?? 'glossary';
      permanentRedirect(`/${locale}/${segment}/${translated.slug}`);
    }
    notFound();
  }

  const [t, tCommon] = await Promise.all([getTranslations('glossary'), getTranslations('common')]);

  const segment = GLOSSARY_SEGMENTS[locale as Locale] ?? 'glossary';

  // Load related terms
  const allTerms = await getGlossaryTerms(locale as Locale);
  const relatedTerms = term.relatedTermIds
    ? allTerms.filter((t) => term.relatedTermIds!.includes(t.id))
    : [];

  // Nav breadcrumbs: no locale prefix — next-intl Link adds it automatically
  const breadcrumbs = [
    { name: tCommon('home'), url: '/' },
    { name: t('overviewTitle'), url: `/${segment}` },
  ];

  // Localised strings for the 3-D coaster player (only consumed when term.player is set)
  const playerLabels = term.player
    ? {
        play: t('player.play'),
        pause: t('player.pause'),
        replay: t('player.replay'),
        view: t('player.view'),
        viewFront: t('player.viewFront'),
        viewFollow: t('player.viewFollow'),
        viewOnboard: t('player.viewOnboard'),
        loading: t('player.loading'),
        keys: t.raw('player.keys') as Record<string, string>,
      }
    : undefined;

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
            { name: tCommon('home'), url: `/${locale}` },
            { name: t('overviewTitle'), url: `/${locale}/${segment}` },
            { name: term.name, url: `/${locale}/${segment}/${termSlug}` },
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
            alsoKnownAs: t('alsoKnownAs'),
            category: t(`category.${term.category}`),
            termH1Suffix: t('termH1Suffix'),
          }}
          playerLabels={playerLabels}
        />
      </PageContainer>

      {/* Nearby parks + favorites — same widgets as homepage */}
      <section className="border-b px-4 py-8">
        <div className="container mx-auto">
          <NearbyParksCard />
        </div>
      </section>

      <FavoritesSection />

      <Suspense fallback={<FeaturedParksSkeleton />}>
        <FeaturedParksSlot locale={locale} />
      </Suspense>
    </>
  );
}
