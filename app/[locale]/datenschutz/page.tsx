import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SITE_URL } from '@/i18n/config';
import { buildAlternates, buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { routing, type Locale } from '@/i18n/routing';
import type { Metadata } from 'next';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { DatenschutzDE } from './content/de';
import { DatenschutzEN } from './content/en';
import { RouteMessages } from '@/i18n/route-messages';

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
    ...buildOpenGraphMetadata({
      locale,
      title: t('title'),
      description: t('description'),
      url: `${SITE_URL}/${locale}/datenschutz`,
      ogImageUrl,
    }),
    alternates: buildAlternates(locale, () => '/datenschutz'),
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function DatenschutzPage({ params }: DatenschutzPageProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    return null;
  }

  setRequestLocale(locale);

  return (
    <RouteMessages route="/datenschutz">
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          {locale === 'de' ? <DatenschutzDE /> : <DatenschutzEN />}
        </div>
      </div>
    </RouteMessages>
  );
}
