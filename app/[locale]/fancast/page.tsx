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
import { ArticleStructuredData, BreadcrumbStructuredData } from '@/components/seo/structured-data';
import { getMLDashboard } from '@/lib/api/ml';
import type { ComponentType } from 'react';
import { LandingHero, LandingNextSteps, HERO_FLOW_INTO_PULL } from './_fancast-ui';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import { BookOpen, CalendarRange, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RouteMessages } from '@/i18n/route-messages';

// Lazy per-locale loaders so only the requested language's content module is
// evaluated per render instead of all six.
const CONTENT_LOADERS: Record<Locale, () => Promise<ComponentType>> = {
  de: () => import('./content/de').then((m) => m.ContentDE),
  en: () => import('./content/en').then((m) => m.ContentEN),
  es: () => import('./content/es').then((m) => m.ContentES),
  fr: () => import('./content/fr').then((m) => m.ContentFR),
  it: () => import('./content/it').then((m) => m.ContentIT),
  nl: () => import('./content/nl').then((m) => m.ContentNL),
};

const HERO_IMAGE = '/media/europa-park/voltron-nevera-powered-by-rimac.jpg';

const KEYWORDS: Record<Locale, string[]> = {
  de: [
    'Freizeitpark Prognose',
    'Wartezeiten Prognose',
    'Crowd-Level',
    'Besucherprognose',
    'Andrang Vorhersage',
    'KI-Modell Freizeitpark',
    'beste Besuchszeit',
    'Crowd-Kalender',
    'park.fan Fancast',
    'Wartezeiten Vorhersage',
  ],
  en: [
    'theme park crowd prediction',
    'wait time forecast',
    'crowd calendar',
    'crowd levels',
    'visitor forecast',
    'theme park AI model',
    'best time to visit',
    'ride wait prediction',
    'park.fan Fancast',
  ],
  es: [
    'predicción afluencia parque temático',
    'previsión tiempos de espera',
    'calendario de afluencia',
    'nivel de afluencia',
    'modelo IA parque temático',
    'mejor época para visitar',
    'park.fan Fancast',
  ],
  fr: [
    "prévision d'affluence parc d'attractions",
    "prévision temps d'attente",
    "calendrier d'affluence",
    "niveau d'affluence",
    "modèle IA parc d'attractions",
    'meilleure période pour visiter',
    'park.fan Fancast',
  ],
  it: [
    'previsione affluenza parco divertimenti',
    'previsione tempi di attesa',
    'calendario affollamento',
    'livello di affollamento',
    'modello IA parco divertimenti',
    'periodo migliore per visitare',
    'park.fan Fancast',
  ],
  nl: [
    'drukte voorspelling pretpark',
    'wachttijden voorspelling',
    'drukte-kalender',
    'drukteniveau',
    'AI-model pretpark',
    'beste tijd om te bezoeken',
    'park.fan Fancast',
  ],
};

interface FancastPageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: FancastPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'fancast' });
  const ogImageUrl = getOgImageUrl([locale, 'fancast']);

  const fullTitle = `${t('title')} | park.fan`;

  return {
    title: { absolute: fullTitle },
    description: t('description'),
    openGraph: {
      title: fullTitle,
      description: t('description'),
      locale: localeToOpenGraphLocale[locale as keyof typeof localeToOpenGraphLocale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeToOpenGraphLocale[l]),
      url: `${SITE_URL}/${locale}/fancast`,
      siteName: 'park.fan',
      type: 'article',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: t('description'),
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}/fancast`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/fancast`),
        'x-default': `${SITE_URL}/en/fancast`,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    keywords: KEYWORDS[locale as Locale] ?? KEYWORDS.en,
  };
}

export default async function FancastPage({ params }: FancastPageProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    return null;
  }

  setRequestLocale(locale);

  const [Content, dashboard, tFancast, tLanding, tNav] = await Promise.all([
    CONTENT_LOADERS[locale as Locale](),
    getMLDashboard().catch(() => null),
    getTranslations({ locale, namespace: 'fancast' }),
    getTranslations({ locale, namespace: 'landing' }),
    getTranslations({ locale, namespace: 'navigation' }),
  ]);

  const live = dashboard?.performance?.live;
  const tagline = tLanding('fancast.tagline');

  // The values are the model's own figures, so they stay computed here; only the labels are copy.
  const stats: Array<{ value: string; label: string }> = [];
  if (live?.mae != null && isFinite(live.mae)) {
    stats.push({ value: `±${live.mae.toFixed(1)}`, label: tLanding('fancast.stats.avgError') });
  }
  if (live?.uniqueParks) {
    stats.push({ value: `${live.uniqueParks}+`, label: tLanding('fancast.stats.parks') });
  }
  stats.push({
    value: tLanding('fancast.stats.dailyValue'),
    label: tLanding('fancast.stats.dailyLabel'),
  });

  // The page's one action is "a park's crowd calendar" (docs/product/landing-pages.md §4). The
  // calendar lives on every park page and this page names no single park (chapter 06 offers
  // several), so the action goes to the best-time hub's chapter 05, which explains the calendar
  // and lists the parks to open it on. `/parks` alone would be a park list, not a calendar.
  const action = {
    href: `/${BEST_TIME_SEGMENTS[locale as Locale]}#parks`,
    label: tLanding('fancast.action'),
    icon: CalendarRange,
  };

  return (
    <RouteMessages route="/fancast">
      <>
        <ArticleStructuredData
          title={`Fancast — park.fan`}
          description={tagline}
          url={`${SITE_URL}/${locale}/fancast`}
          locale={locale}
          image={getOgImageUrl([locale, 'fancast'])}
        />
        <BreadcrumbStructuredData
          breadcrumbs={[
            { name: 'park.fan', url: '/' },
            { name: tFancast('title'), url: '/fancast' },
          ]}
          locale={locale}
        />

        <LandingHero
          kicker={tLanding('fancast.kicker')}
          title="Fancast"
          tagline={tagline}
          imageSrc={HERO_IMAGE}
          imageAlt="Voltron Nevera powered by Rimac im Europa-Park"
          stats={stats}
          scrollLabel={tLanding('scroll')}
          action={action}
          flowInto
        />

        {/* Pulled up over the hero on phones — see `HERO_FLOW_INTO_PULL`, which
            owns the number so it stays paired with the hero's bottom padding. */}
        <div
          id="start"
          className={cn(
            'relative space-y-16 pt-0 sm:space-y-24 sm:pt-20',
            HERO_FLOW_INTO_PULL
          )}
        >
          <Content />

          <LandingNextSteps
            title={tLanding('fancast.next.title')}
            body={tLanding('fancast.next.body')}
            destinations={[
              action,
              { href: '/parks', label: tNav('parks'), icon: Compass },
              {
                href: `/${HOWTO_SEGMENTS[locale as Locale]}`,
                label: tNav('howto'),
                icon: BookOpen,
              },
            ]}
          />
        </div>
      </>
    </RouteMessages>
  );
}
