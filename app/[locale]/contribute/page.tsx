import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ImageUp } from 'lucide-react';
import {
  locales,
  generateAlternateLanguages,
  localeToOpenGraphLocale,
  SITE_URL,
} from '@/i18n/config';
import { routing } from '@/i18n/routing';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { ContributeForm } from '@/components/contribute/contribute-form';
import { RightsNotice } from '@/components/contribute/rights-notice';
import { ExampleGallery } from '@/components/contribute/example-gallery';
import { parseEntityFromParams } from '@/lib/contribute/prefill';
import { RouteMessages } from '@/i18n/route-messages';
import { LandingHero } from '@/components/marketing/editorial-ui';

interface ContributePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
  searchParams,
}: ContributePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contribute.meta' });
  const ogImageUrl = getOgImageUrl([locale, 'contribute']);

  // Every park and ride page links here through `buildContributeHref` with the entity as query
  // params, one crawlable URL per entity, all rendering the same form. The links are `nofollow`;
  // the prefilled variants are also `noindex` with the bare page as canonical, so Google
  // consolidates them onto one URL.
  const isPrefilled = parseEntityFromParams(await searchParams) !== null;

  return {
    title: t('title'),
    description: t('description'),
    ...(isPrefilled && { robots: { index: false, follow: true } }),
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale: localeToOpenGraphLocale[locale as keyof typeof localeToOpenGraphLocale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeToOpenGraphLocale[l]),
      url: `${SITE_URL}/${locale}/contribute`,
      siteName: 'park.fan',
      type: 'website',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: t('title') }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}/contribute`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/contribute`),
        'x-default': `${SITE_URL}/en/contribute`,
      },
    },
  };
}

export default async function ContributePage({ params, searchParams }: ContributePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const initialEntity = parseEntityFromParams(await searchParams);
  const t = await getTranslations('contribute.hero');
  const tBanner = await getTranslations('contribute.banner');
  const tLanding = await getTranslations('landing.contribute');

  return (
    <RouteMessages route="/contribute">
      {/* A tool page: the compact head, whose one action is the upload form further down
          (docs/product/landing-pages.md §1, §4). */}
      <LandingHero
        variant="compact"
        kicker={tLanding('kicker')}
        title={t('title')}
        tagline={t('subtitle')}
        action={{ href: '#upload', label: tBanner('cta'), icon: ImageUp }}
      />

      {/* Gallery and form keep their widths but start at the `container` edge with the head. */}
      <div className="container mx-auto px-4 pt-12 pb-8 sm:pt-16 sm:pb-12">
        <div className="max-w-5xl">
          <ExampleGallery />

          <div id="upload" className="max-w-3xl scroll-mt-24">
            <RightsNotice />
            <ContributeForm initialEntity={initialEntity} />
          </div>
        </div>
      </div>
    </RouteMessages>
  );
}
