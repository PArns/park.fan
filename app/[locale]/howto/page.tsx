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

// Lazy per-locale loaders so only the requested language's ~1000-line content
// module is evaluated per render instead of all six.
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
    title: 'Wie funktioniert park.fan?',
    intro:
      'Die vollständige Anleitung für Freizeitpark-Besucher – von der Suche über den Crowd-Kalender bis zu allen Badges und KI-Prognosen.',
  },
  en: {
    title: 'How does park.fan work?',
    intro:
      'The complete guide for theme park visitors – from search and favorites to the crowd calendar, AI predictions and all badges explained.',
  },
  es: {
    title: '¿Cómo funciona park.fan?',
    intro:
      'La guía completa para visitar parques temáticos – desde la búsqueda y los favoritos hasta el calendario de afluencia, las predicciones IA y todos los indicadores explicados.',
  },
  fr: {
    title: 'Comment fonctionne park.fan ?',
    intro:
      "Le guide complet pour les visiteurs de parcs d'attractions – de la recherche aux favoris en passant par le calendrier d'affluence, les prédictions IA et tous les indicateurs expliqués.",
  },
  it: {
    title: 'Come funziona park.fan?',
    intro:
      "La guida completa per i visitatori dei parchi divertimento – dalla ricerca ai preferiti, passando per il calendario dell'affluenza, le previsioni IA e tutti gli indicatori spiegati.",
  },
  nl: {
    title: 'Hoe werkt park.fan?',
    intro:
      'De complete gids voor pretparkbezoekers – van zoeken en favorieten tot de drukte-kalender, AI-voorspellingen en alle badges uitgelegd.',
  },
};

interface HowtoPageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const KEYWORDS: Record<Locale, string[]> = {
  de: [
    'Freizeitpark Wartezeiten',
    'Freizeitpark App',
    'park.fan Anleitung',
    'Crowd-Kalender',
    'Besucherprognose',
    'Warteschlangen',
    'Disney Wartezeiten',
    'Europa-Park Wartezeiten',
    'Phantasialand Wartezeiten',
    'Heide Park Wartezeiten',
    'Efteling Wartezeiten',
    'Freizeitpark planen',
  ],
  es: [
    'tiempos de espera parque temático',
    'aplicación parque temático',
    'guía park.fan',
    'calendario de afluencia',
    'predicciones de visitantes',
    'colas atracciones',
    'tiempos de espera Disneyland',
    'PortAventura tiempos de espera',
    'Gardaland tiempos de espera',
  ],
  fr: [
    "temps d'attente parc d'attractions",
    "application parc d'attractions",
    'guide park.fan',
    "calendrier d'affluence",
    'prévisions visiteurs',
    "files d'attente attractions",
    "temps d'attente Disneyland Paris",
    "Europa-Park temps d'attente",
    "Parc Astérix temps d'attente",
  ],
  it: [
    'tempi di attesa parco divertimenti',
    'app parco divertimenti',
    'guida park.fan',
    'calendario affollamento',
    'previsioni visitatori',
    'code attrazioni',
    'Gardaland tempi di attesa',
    'Europa-Park tempi di attesa',
  ],
  nl: [
    'wachttijden pretpark',
    'pretpark app',
    'park.fan handleiding',
    'drukte-kalender',
    'bezoekersvoorspellingen',
    'wachtrijen attracties',
    'wachttijden Disneyland Paris',
    'Efteling wachttijden',
    'Europa-Park wachttijden',
    'Toverland wachttijden',
  ],
  en: [
    'theme park wait times',
    'theme park app',
    'park.fan guide',
    'crowd calendar',
    'visitor predictions',
    'ride queues',
    'Disney wait times',
    'Europa-Park wait times',
    'Universal Studios wait times',
    'Magic Kingdom wait times',
    'theme park planning',
  ],
};

export async function generateMetadata({ params }: HowtoPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'howto' });
  const ogImageUrl = getOgImageUrl([locale, 'howto']);

  const fullTitle = `${t('title')} | park.fan`;

  return {
    title: { absolute: fullTitle },
    description: t('description'),
    openGraph: {
      title: fullTitle,
      description: t('description'),
      locale: localeToOpenGraphLocale[locale as keyof typeof localeToOpenGraphLocale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeToOpenGraphLocale[l]),
      url: `${SITE_URL}/${locale}/howto`,
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
      canonical: `${SITE_URL}/${locale}/howto`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/howto`),
        'x-default': `${SITE_URL}/en/howto`,
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

export default async function HowtoPage({ params }: HowtoPageProps) {
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
        title={title}
        description={intro}
        url={`${SITE_URL}/${locale}/howto`}
        locale={locale}
        image={getOgImageUrl([locale, 'howto'])}
      />
      <div>
        <h1 className="mb-2 text-2xl font-bold sm:text-4xl">{title}</h1>
        <p className="text-muted-foreground mb-10 text-lg">{intro}</p>
        <Content />
      </div>
    </div>
  );
}
