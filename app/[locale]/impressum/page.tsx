import { getTranslations } from 'next-intl/server';
import { SITE_URL } from '@/i18n/config';
import { buildAlternates, buildOpenGraphMetadata } from '@/lib/utils/metadata';
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
    ...buildOpenGraphMetadata({
      locale,
      title: t('title'),
      description: t('description'),
      url: `${SITE_URL}/${locale}/impressum`,
      ogImageUrl,
    }),
    alternates: buildAlternates(locale, () => '/impressum'),
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
