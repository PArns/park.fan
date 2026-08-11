import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Camera, ImageUp } from 'lucide-react';
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
import { getParkBackgroundImage } from '@/lib/utils/park-assets';
import { RouteMessages } from '@/i18n/route-messages';

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

  return (
    <RouteMessages route="/contribute">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
        {/* Hero with a themed photo backdrop */}
        <header className="relative mb-10 overflow-hidden rounded-3xl border shadow-sm">
          <Image
            src={getParkBackgroundImage('europa-park') ?? '/media/europa-park/background.jpg'}
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/35" />
          <div className="relative flex flex-col items-center px-6 py-14 text-center text-white sm:py-20">
            <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-md">
              <Camera className="size-8" />
            </div>
            <h1 className="max-w-2xl text-3xl font-bold drop-shadow-md sm:text-5xl">
              {t('title')}
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/85 drop-shadow sm:text-lg">
              {t('subtitle')}
            </p>
            <a
              href="#upload"
              className="text-primary-foreground bg-primary mt-7 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium shadow-lg transition-transform hover:-translate-y-0.5"
            >
              <ImageUp className="size-4" />
              {tBanner('cta')}
            </a>
          </div>
        </header>

        {/* Inspiration gallery */}
        <ExampleGallery />

        {/* Rights + form, in a narrower reading column */}
        <div id="upload" className="mx-auto max-w-3xl scroll-mt-8">
          <RightsNotice />
          <ContributeForm initialEntity={initialEntity} />
        </div>
      </div>
    </RouteMessages>
  );
}
