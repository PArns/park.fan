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
import { ArticleStructuredData } from '@/components/seo/structured-data';
import type { ComponentType } from 'react';

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

const PAGE_HEADERS: Record<Locale, { title: string; intro: string }> = {
  de: {
    title: 'Fancast',
    intro:
      'Unser Prognose-Modell für Wartezeiten und Andrang: Es liest Millionen Live-Wartezeiten, sagt bis zu 365 Tage im Voraus, wie voll ein Park wird — und benotet sich selbst. Öffentlich.',
  },
  en: {
    title: 'Fancast',
    intro:
      'Our forecasting model for wait times and crowds: it reads millions of live wait times, predicts how busy a park will be up to 365 days ahead — and grades itself. In the open.',
  },
  es: {
    title: 'Fancast',
    intro:
      'Nuestro modelo de predicción de tiempos de espera y afluencia: lee millones de tiempos de espera en directo, predice con hasta 365 días de antelación lo lleno que estará un parque — y se autoevalúa. En abierto.',
  },
  fr: {
    title: 'Fancast',
    intro:
      "Notre modèle de prévision des temps d'attente et de l'affluence : il lit des millions de temps d'attente en direct, prédit jusqu'à 365 jours à l'avance à quel point un parc sera fréquenté — et se note lui-même. En toute transparence.",
  },
  it: {
    title: 'Fancast',
    intro:
      "Il nostro modello di previsione per tempi di attesa e affluenza: legge milioni di tempi di attesa in tempo reale, prevede fino a 365 giorni in anticipo quanto sarà affollato un parco — e si autovaluta. In modo trasparente.",
  },
  nl: {
    title: 'Fancast',
    intro:
      'Ons voorspelmodel voor wachttijden en drukte: het leest miljoenen live wachttijden, voorspelt tot 365 dagen vooruit hoe druk een park wordt — en beoordeelt zichzelf. In het openbaar.',
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

  const Content = await CONTENT_LOADERS[locale as Locale]();
  const { title, intro } = PAGE_HEADERS[locale as Locale];

  return (
    <div className="container mx-auto px-4 py-12">
      <ArticleStructuredData
        title={`${title} — park.fan`}
        description={intro}
        url={`${SITE_URL}/${locale}/fancast`}
        locale={locale}
        image={getOgImageUrl([locale, 'fancast'])}
      />
      <div>
        <h1 className="mb-2 text-2xl font-bold sm:text-4xl">{title}</h1>
        <p className="text-muted-foreground mb-10 text-lg">{intro}</p>
        <Content />
      </div>
    </div>
  );
}
