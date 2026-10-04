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

  // Every park and ride page links here through `buildContributeHref`, which encodes the
  // pre-selected entity as query params (`?type=…&id=…&name=…&slug=…&url=…`). That mints ONE
  // crawlable URL per entity — thousands of them, all rendering the same form. It showed: over
  // 24 h this page took 4 K requests and 154 MB, more than the park pages themselves, on a page
  // nobody searches for.
  //
  // The banner links now carry rel="nofollow" so crawlers stop walking into them at all; this
  // pairs with that to clean up what is already indexed — the prefilled variants are noindex and
  // point their canonical at the bare page, so Google consolidates them onto the one URL that is
  // worth having.
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
      {/* A tool page: the compact head (docs/product/landing-pages.md §1), whose one action is
          the upload form further down (§4). It replaces a centred photo card under a black
          scrim that stayed black in the light theme. Its photo, Europa-Park's generic park
          background, was not dropped into the example gallery: that gallery shows the kind of
          picture a reader is asked for, and a stock park backdrop is not one. */}
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
          {/* Inspiration gallery */}
          <ExampleGallery />

          {/* Rights + form, in a narrower reading column */}
          <div id="upload" className="max-w-3xl scroll-mt-24">
            <RightsNotice />
            <ContributeForm initialEntity={initialEntity} />
          </div>
        </div>
      </div>
    </RouteMessages>
  );
}
