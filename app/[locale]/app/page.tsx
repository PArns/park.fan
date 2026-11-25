import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SITE_URL } from '@/i18n/config';
import { buildAlternates, buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { routing, type Locale } from '@/i18n/routing';
import type { Metadata } from 'next';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import { AppSupportDE } from './content/de';
import { AppSupportEN } from './content/en';

interface AppSupportPageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: AppSupportPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'appSupport' });
  const ogImageUrl = getOgImageUrl([locale, 'app']);

  return {
    title: t('title'),
    description: t('description'),
    ...buildOpenGraphMetadata({
      locale,
      title: t('title'),
      description: t('description'),
      url: `${SITE_URL}/${locale}/app`,
      ogImageUrl,
    }),
    alternates: buildAlternates(locale, () => '/app'),
    robots: {
      index: false,
      follow: true,
    },
  };
}

/** The support page for the iPhone app, the App Store's support URL. */
export default async function AppSupportPage({ params }: AppSupportPageProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    return null;
  }

  setRequestLocale(locale);
  const howtoPath = '/' + HOWTO_SEGMENTS[locale as Locale];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {locale === 'de' ? (
          <AppSupportDE howtoPath={howtoPath} />
        ) : (
          <AppSupportEN howtoPath={howtoPath} />
        )}
      </div>
    </div>
  );
}
