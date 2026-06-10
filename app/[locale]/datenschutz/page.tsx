import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  locales,
  generateAlternateLanguages,
  localeToOpenGraphLocale,
  SITE_URL,
} from '@/i18n/config';
import { routing, type Locale } from '@/i18n/routing';
import type { Metadata } from 'next';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { DatenschutzDE } from './content/de';
import { DatenschutzEN } from './content/en';

interface DatenschutzPageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: DatenschutzPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'datenschutz' });
  const ogImageUrl = getOgImageUrl([locale, 'datenschutz']);

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale: localeToOpenGraphLocale[locale as keyof typeof localeToOpenGraphLocale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeToOpenGraphLocale[l]),
      url: `${SITE_URL}/${locale}/datenschutz`,
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
      canonical: `${SITE_URL}/${locale}/datenschutz`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/datenschutz`),
        'x-default': `${SITE_URL}/en/datenschutz`,
      },
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function DatenschutzPage({ params }: DatenschutzPageProps) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as Locale)) {
    return null;
  }

  setRequestLocale(locale);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {locale === 'de' ? <DatenschutzDE /> : <DatenschutzEN />}
      </div>
    </div>
  );
}
