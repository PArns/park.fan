import { getTranslations } from 'next-intl/server';
import { locales, generateAlternateLanguages, localeToOpenGraphLocale } from '@/i18n/config';
import { setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import type { Metadata } from 'next';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { ImpressumDE } from './content/de';
import { ImpressumEN } from './content/en';

interface ImpressumPageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: ImpressumPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'impressum' });
  const ogImageUrl = getOgImageUrl([locale, 'impressum']);

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale: localeToOpenGraphLocale[locale as keyof typeof localeToOpenGraphLocale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeToOpenGraphLocale[l]),
      url: `https://park.fan/${locale}/impressum`,
      siteName: 'park.fan',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `https://park.fan/${locale}/impressum`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/impressum`),
        'x-default': 'https://park.fan/en/impressum',
      },
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function ImpressumPage({ params }: ImpressumPageProps) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as Locale)) {
    return null;
  }

  setRequestLocale(locale);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">{locale === 'de' ? <ImpressumDE /> : <ImpressumEN />}</div>
    </div>
  );
}
