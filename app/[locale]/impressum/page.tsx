import { getTranslations } from 'next-intl/server';
import {
  locales,
  generateAlternateLanguages,
  localeToOpenGraphLocale,
  SITE_URL,
} from '@/i18n/config';
import { setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import type { Metadata } from 'next';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { resolveEntryForLocale } from '@/lib/blog/listing';
import { postPath } from '@/lib/blog/paths';
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
      url: `${SITE_URL}/${locale}/impressum`,
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
      canonical: `${SITE_URL}/${locale}/impressum`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/impressum`),
        'x-default': `${SITE_URL}/en/impressum`,
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

  if (!routing.locales.includes(locale as Locale)) {
    return null;
  }

  setRequestLocale(locale);

  // The story behind the project, in the reader's language where it exists.
  const welcome = resolveEntryForLocale('welcome-to-park-fan-blog', locale as Locale);
  const story = welcome
    ? {
        href: postPath({ slug: welcome.entry.slug, frontmatter: welcome.entry.fm }),
        title: welcome.entry.fm.title,
      }
    : null;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {locale === 'de' ? <ImpressumDE story={story} /> : <ImpressumEN story={story} />}
      </div>
    </div>
  );
}
