import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, generateAlternateLanguages, localeToOpenGraphLocale } from '@/i18n/config';
import { routing, type Locale } from '@/i18n/routing';
import type { Metadata } from 'next';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { LocaleContent } from '@/components/common/locale-content';
import { ContentDE } from './content/de';
import { ContentEN } from './content/en';
import { ContentES } from './content/es';
import { ContentFR } from './content/fr';
import { ContentIT } from './content/it';
import { ContentNL } from './content/nl';

interface HowtoPageProps {
  params: Promise<{ locale: string }>;
}

export const revalidate = 86400; // 1 day — static content; live parks via React Query

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

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
      url: `https://park.fan/${locale}/howto`,
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
      canonical: `https://park.fan/${locale}/howto`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/howto`),
        'x-default': 'https://park.fan/en/howto',
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
    keywords:
      locale === 'de'
        ? [
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
          ]
        : locale === 'es'
          ? [
              'tiempos de espera parque temático',
              'aplicación parque temático',
              'guía park.fan',
              'calendario de afluencia',
              'predicciones de visitantes',
              'colas atracciones',
              'tiempos de espera Disneyland',
              'PortAventura tiempos de espera',
              'Gardaland tiempos de espera',
            ]
          : locale === 'fr'
            ? [
                "temps d'attente parc d'attractions",
                "application parc d'attractions",
                'guide park.fan',
                "calendrier d'affluence",
                'prévisions visiteurs',
                "files d'attente attractions",
                "temps d'attente Disneyland Paris",
                "Europa-Park temps d'attente",
                "Parc Astérix temps d'attente",
              ]
            : locale === 'it'
              ? [
                  'tempi di attesa parco divertimenti',
                  'app parco divertimenti',
                  'guida park.fan',
                  'calendario affollamento',
                  'previsioni visitatori',
                  'code attrazioni',
                  'Gardaland tempi di attesa',
                  'Europa-Park tempi di attesa',
                ]
              : locale === 'nl'
                ? [
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
                  ]
                : [
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
}

export default async function HowtoPage({ params }: HowtoPageProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    return null;
  }

  setRequestLocale(locale);

  return (
    <div className="container mx-auto px-4 py-12">
      <div>
        <LocaleContent
          locale={locale as Locale}
          de={
            <>
              <h1 className="mb-2 text-2xl font-bold sm:text-4xl">Wie funktioniert park.fan?</h1>
              <p className="text-muted-foreground mb-10 text-lg">
                Die vollständige Anleitung für Freizeitpark-Besucher – von der Suche über den
                Crowd-Kalender bis zu allen Badges und KI-Prognosen.
              </p>
              <ContentDE />
            </>
          }
          en={
            <>
              <h1 className="mb-2 text-2xl font-bold sm:text-4xl">How does park.fan work?</h1>
              <p className="text-muted-foreground mb-10 text-lg">
                The complete guide for theme park visitors – from search and favorites to the crowd
                calendar, AI predictions and all badges explained.
              </p>
              <ContentEN />
            </>
          }
          es={
            <>
              <h1 className="mb-2 text-2xl font-bold sm:text-4xl">¿Cómo funciona park.fan?</h1>
              <p className="text-muted-foreground mb-10 text-lg">
                La guía completa para visitar parques temáticos – desde la búsqueda y los favoritos
                hasta el calendario de afluencia, las predicciones IA y todos los indicadores
                explicados.
              </p>
              <ContentES />
            </>
          }
          fr={
            <>
              <h1 className="mb-2 text-2xl font-bold sm:text-4xl">Comment fonctionne park.fan ?</h1>
              <p className="text-muted-foreground mb-10 text-lg">
                Le guide complet pour les visiteurs de parcs d&apos;attractions – de la recherche
                aux favoris en passant par le calendrier d&apos;affluence, les prédictions IA et
                tous les indicateurs expliqués.
              </p>
              <ContentFR />
            </>
          }
          it={
            <>
              <h1 className="mb-2 text-2xl font-bold sm:text-4xl">Come funziona park.fan?</h1>
              <p className="text-muted-foreground mb-10 text-lg">
                La guida completa per i visitatori dei parchi divertimento – dalla ricerca ai
                preferiti, passando per il calendario dell&apos;affluenza, le previsioni IA e tutti
                gli indicatori spiegati.
              </p>
              <ContentIT />
            </>
          }
          nl={
            <>
              <h1 className="mb-2 text-2xl font-bold sm:text-4xl">Hoe werkt park.fan?</h1>
              <p className="text-muted-foreground mb-10 text-lg">
                De complete gids voor pretparkbezoekers – van zoeken en favorieten tot de
                drukte-kalender, AI-voorspellingen en alle badges uitgelegd.
              </p>
              <ContentNL />
            </>
          }
        />
      </div>
    </div>
  );
}
