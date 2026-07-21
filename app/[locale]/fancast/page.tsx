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
import {
  ArticleStructuredData,
  BreadcrumbStructuredData,
} from '@/components/seo/structured-data';
import { getMLDashboard } from '@/lib/api/ml';
import type { ComponentType } from 'react';
import { Hero } from './_fancast-ui';

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

interface PageHeader {
  kicker: string;
  tagline: string;
  scrollLabel: string;
  statLabels: {
    avgError: string;
    parks: string;
    horizon: string;
    dailyValue: string;
    dailyLabel: string;
  };
}

const HERO_IMAGE = '/images/parks/europa-park/voltron-nevera-powered-by-rimac.jpg';

const PAGE_HEADERS: Record<Locale, PageHeader> = {
  de: {
    kicker: 'park.fan · Prognosemodell',
    tagline:
      'Es liest Millionen Live-Wartezeiten und sagt bis zu 365 Tage im Voraus, wie voll ein Park wird — und benotet sich dabei öffentlich selbst.',
    scrollLabel: 'Scrollen',
    statLabels: {
      avgError: 'Min. Ø-Fehler',
      parks: 'Parks',
      horizon: 'Tage Vorausschau',
      dailyValue: 'Täglich',
      dailyLabel: 'neu trainiert',
    },
  },
  en: {
    kicker: 'park.fan · forecasting model',
    tagline:
      'It reads millions of live wait times to predict how busy a park will be up to 365 days ahead — and grades itself, in the open.',
    scrollLabel: 'Scroll',
    statLabels: {
      avgError: 'min avg error',
      parks: 'parks',
      horizon: 'days ahead',
      dailyValue: 'Daily',
      dailyLabel: 'retrained',
    },
  },
  es: {
    kicker: 'park.fan · modelo de predicción',
    tagline:
      'Lee millones de tiempos de espera en directo para predecir la afluencia de un parque con hasta 365 días de antelación, y se autoevalúa en abierto.',
    scrollLabel: 'Desliza',
    statLabels: {
      avgError: 'min error medio',
      parks: 'parques',
      horizon: 'días de previsión',
      dailyValue: 'A diario',
      dailyLabel: 'reentrenado',
    },
  },
  fr: {
    kicker: 'park.fan · modèle de prévision',
    tagline:
      "Il lit des millions de temps d'attente en direct pour prédire l'affluence d'un parc jusqu'à 365 jours à l'avance, et se note lui-même en public.",
    scrollLabel: 'Défiler',
    statLabels: {
      avgError: "min d'erreur moy.",
      parks: 'parcs',
      horizon: "jours à l'avance",
      dailyValue: 'Chaque jour',
      dailyLabel: 'réentraîné',
    },
  },
  it: {
    kicker: 'park.fan · modello di previsione',
    tagline:
      "Legge milioni di tempi di attesa in tempo reale per prevedere l'affluenza di un parco fino a 365 giorni in anticipo, e si autovaluta in modo trasparente.",
    scrollLabel: 'Scorri',
    statLabels: {
      avgError: 'min errore medio',
      parks: 'parchi',
      horizon: 'giorni in anticipo',
      dailyValue: 'Ogni giorno',
      dailyLabel: 'riaddestrato',
    },
  },
  nl: {
    kicker: 'park.fan · voorspelmodel',
    tagline:
      'Het leest miljoenen live wachttijden om tot 365 dagen vooruit te voorspellen hoe druk een park wordt — en beoordeelt zichzelf, in het openbaar.',
    scrollLabel: 'Scroll',
    statLabels: {
      avgError: 'min gem. fout',
      parks: 'parken',
      horizon: 'dagen vooruit',
      dailyValue: 'Dagelijks',
      dailyLabel: 'hertraind',
    },
  },
};

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

  const [Content, dashboard, tFancast] = await Promise.all([
    CONTENT_LOADERS[locale as Locale](),
    getMLDashboard().catch(() => null),
    getTranslations({ locale, namespace: 'fancast' }),
  ]);

  const header = PAGE_HEADERS[locale as Locale];
  const live = dashboard?.performance?.live;

  const stats: Array<{ value: string; label: string }> = [];
  if (live?.mae != null && isFinite(live.mae)) {
    stats.push({ value: `±${live.mae.toFixed(1)}`, label: header.statLabels.avgError });
  }
  if (live?.uniqueParks) {
    stats.push({ value: `${live.uniqueParks}+`, label: header.statLabels.parks });
  }
  stats.push({ value: '365', label: header.statLabels.horizon });
  stats.push({ value: header.statLabels.dailyValue, label: header.statLabels.dailyLabel });

  return (
    <>
      <ArticleStructuredData
        title={`Fancast — park.fan`}
        description={header.tagline}
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

      <Hero
        kicker={header.kicker}
        title="Fancast"
        tagline={header.tagline}
        imageSrc={HERO_IMAGE}
        imageAlt="Voltron Nevera powered by Rimac im Europa-Park"
        stats={stats}
        scrollLabel={header.scrollLabel}
      />

      <div id="start" className="space-y-20 py-16 sm:space-y-28 sm:py-24">
        <Content />
      </div>
    </>
  );
}
