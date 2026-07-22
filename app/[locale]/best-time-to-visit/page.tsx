import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, localeToOpenGraphLocale, SITE_URL } from '@/i18n/config';
import { routing, type Locale } from '@/i18n/routing';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import type { Metadata } from 'next';
import { getOgImageUrl } from '@/lib/utils/og-image';
import {
  ArticleStructuredData,
  BreadcrumbStructuredData,
} from '@/components/seo/structured-data';
import { Hero } from '@/components/marketing/editorial-ui';
import type { ComponentType } from 'react';

const CONTENT_LOADERS: Record<Locale, () => Promise<ComponentType>> = {
  de: () => import('./content/de').then((m) => m.ContentDE),
  en: () => import('./content/en').then((m) => m.ContentEN),
  es: () => import('./content/es').then((m) => m.ContentES),
  fr: () => import('./content/fr').then((m) => m.ContentFR),
  it: () => import('./content/it').then((m) => m.ContentIT),
  nl: () => import('./content/nl').then((m) => m.ContentNL),
};

/** Scenic, calm establishing shot — sets the "plan the perfect day" tone. */
const HERO_IMAGE = '/images/parks/efteling/background.jpg';

interface PageHeader {
  title: string;
  /** Structured-data / meta fallback description (longer than the tagline). */
  intro: string;
  kicker: string;
  tagline: string;
  scrollLabel: string;
  heroAlt: string;
  stats: Array<{ value: string; label: string }>;
}

const PAGE_HEADERS: Record<Locale, PageHeader> = {
  de: {
    title: 'Beste Reisezeit für Freizeitparks',
    intro:
      'Wann sind Freizeitparks am leersten? Die ruhigsten Wochentage und Monate — aus echten Wartezeit-Daten von über 150 Parks — plus Tricks für kurze Schlangen und der Kalender, der dir den besten Tag für deinen Wunschpark zeigt.',
    kicker: 'park.fan · Reiseplanung',
    tagline:
      'Freizeitparks sind kein Zufall. Aus echten Wartezeit-Daten von 150+ Parks zeigen wir dir die ruhigsten Tage — und wie du den vollen ausweichst.',
    scrollLabel: 'Scrollen',
    heroAlt: 'Freizeitpark-Landschaft im Abendlicht',
    stats: [
      { value: '150+', label: 'Parks analysiert' },
      { value: '2 Jahre', label: 'echte Daten' },
      { value: '365', label: 'Tage im Voraus' },
    ],
  },
  en: {
    title: 'Best Time to Visit Theme Parks',
    intro:
      'When are theme parks least crowded? The quietest weekdays and months — from real wait-time data across 150+ parks — plus tactics for short queues and the calendar that shows the best day for your park.',
    kicker: 'park.fan · trip planner',
    tagline:
      'Theme-park crowds are not random. From real wait-time data across 150+ parks, here are the quietest days — and how to dodge the busy ones.',
    scrollLabel: 'Scroll',
    heroAlt: 'A theme-park landscape in the evening light',
    stats: [
      { value: '150+', label: 'parks analysed' },
      { value: '2 yrs', label: 'of real data' },
      { value: '365', label: 'days ahead' },
    ],
  },
  es: {
    title: 'Mejor época para visitar parques temáticos',
    intro:
      '¿Cuándo hay menos gente en los parques temáticos? Los días de la semana y los meses más tranquilos, a partir de datos reales de tiempos de espera de más de 150 parques, con trucos para colas cortas y el calendario que muestra el mejor día para tu parque.',
    kicker: 'park.fan · planificador de visitas',
    tagline:
      'La afluencia no es aleatoria. Con datos reales de más de 150 parques te mostramos los días más tranquilos y cómo esquivar los llenos.',
    scrollLabel: 'Desliza',
    heroAlt: 'Paisaje de un parque temático a la luz del atardecer',
    stats: [
      { value: '150+', label: 'parques analizados' },
      { value: '2 años', label: 'de datos reales' },
      { value: '365', label: 'días de previsión' },
    ],
  },
  fr: {
    title: "Meilleure période pour visiter les parcs d'attractions",
    intro:
      "Quand les parcs d'attractions sont-ils les moins fréquentés ? Les jours de la semaine et les mois les plus calmes, à partir de données réelles de temps d'attente de plus de 150 parcs, avec des astuces pour des files courtes et le calendrier du meilleur jour pour votre parc.",
    kicker: 'park.fan · planificateur de visite',
    tagline:
      "L'affluence n'a rien d'aléatoire. À partir de données réelles de plus de 150 parcs, voici les jours les plus calmes — et comment éviter les pires.",
    scrollLabel: 'Défiler',
    heroAlt: "Paysage d'un parc d'attractions dans la lumière du soir",
    stats: [
      { value: '150+', label: 'parcs analysés' },
      { value: '2 ans', label: 'de données réelles' },
      { value: '365', label: "jours à l'avance" },
    ],
  },
  it: {
    title: 'Periodo migliore per visitare i parchi divertimento',
    intro:
      'Quando i parchi divertimento sono meno affollati? I giorni della settimana e i mesi più tranquilli, da dati reali sui tempi di attesa di oltre 150 parchi, con trucchi per code brevi e il calendario che mostra il giorno migliore per il tuo parco.',
    kicker: 'park.fan · pianificatore di visite',
    tagline:
      "L'affluenza non è casuale. Dai dati reali di oltre 150 parchi, ecco i giorni più tranquilli — e come evitare quelli pieni.",
    scrollLabel: 'Scorri',
    heroAlt: 'Paesaggio di un parco divertimenti nella luce della sera',
    stats: [
      { value: '150+', label: 'parchi analizzati' },
      { value: '2 anni', label: 'di dati reali' },
      { value: '365', label: 'giorni in anticipo' },
    ],
  },
  nl: {
    title: 'Beste tijd om pretparken te bezoeken',
    intro:
      'Wanneer zijn pretparken het rustigst? De rustigste weekdagen en maanden — uit echte wachttijddata van 150+ parken — plus tips voor korte rijen en de kalender die de beste dag voor jouw park laat zien.',
    kicker: 'park.fan · reisplanner',
    tagline:
      'Drukte is geen toeval. Uit echte wachttijddata van 150+ parken laten we de rustigste dagen zien — en hoe je de drukke ontwijkt.',
    scrollLabel: 'Scroll',
    heroAlt: 'Pretparklandschap in het avondlicht',
    stats: [
      { value: '150+', label: 'parken geanalyseerd' },
      { value: '2 jaar', label: 'echte data' },
      { value: '365', label: 'dagen vooruit' },
    ],
  },
};

const KEYWORDS: Record<Locale, string[]> = {
  de: [
    'beste reisezeit freizeitpark',
    'wann freizeitpark am leersten',
    'ruhigste tage freizeitpark',
    'freizeitpark wochentag',
    'freizeitpark nebensaison',
    'crowd kalender',
    'wann ist wenig los im freizeitpark',
  ],
  en: [
    'best time to visit theme parks',
    'least crowded day theme park',
    'quietest theme park days',
    'theme park off season',
    'best day to visit theme park',
    'crowd calendar',
  ],
  es: [
    'mejor época para visitar parques temáticos',
    'días menos concurridos parque temático',
    'temporada baja parque temático',
    'calendario de afluencia',
  ],
  fr: [
    "meilleure période parc d'attractions",
    "jours les moins fréquentés parc d'attractions",
    "basse saison parc d'attractions",
    "calendrier d'affluence",
  ],
  it: [
    'periodo migliore parco divertimenti',
    'giorni meno affollati parco divertimenti',
    'bassa stagione parco divertimenti',
    'calendario affollamento',
  ],
  nl: [
    'beste tijd pretpark bezoeken',
    'rustigste dagen pretpark',
    'laagseizoen pretpark',
    'drukte-kalender',
  ],
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function urlFor(locale: Locale) {
  return `${SITE_URL}/${locale}/${BEST_TIME_SEGMENTS[locale]}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'bestTime' });
  const ogImageUrl = getOgImageUrl([locale, BEST_TIME_SEGMENTS.en]);
  const fullTitle = `${t('title')} | park.fan`;
  const url = urlFor(locale as Locale);

  return {
    title: { absolute: fullTitle },
    description: t('description'),
    openGraph: {
      title: fullTitle,
      description: t('description'),
      locale: localeToOpenGraphLocale[locale as keyof typeof localeToOpenGraphLocale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeToOpenGraphLocale[l]),
      url,
      siteName: 'park.fan',
      type: 'article',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: t('description'),
      images: [ogImageUrl],
    },
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, urlFor(l)])),
        'x-default': urlFor('en'),
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    keywords: KEYWORDS[locale as Locale] ?? KEYWORDS.en,
  };
}

export default async function BestTimeToVisitPage({ params }: PageProps) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) return null;
  setRequestLocale(locale);

  const Content = await CONTENT_LOADERS[locale as Locale]();
  const header = PAGE_HEADERS[locale as Locale];
  const url = urlFor(locale as Locale);
  const t = await getTranslations({ locale, namespace: 'common' });

  return (
    <>
      <ArticleStructuredData
        title={header.title}
        description={header.intro}
        url={url}
        locale={locale}
        image={getOgImageUrl([locale, BEST_TIME_SEGMENTS.en])}
      />
      <BreadcrumbStructuredData
        breadcrumbs={[
          { name: t('home'), url: '/' },
          { name: header.title, url: `/${BEST_TIME_SEGMENTS[locale as Locale]}` },
        ]}
        locale={locale}
      />

      <Hero
        kicker={header.kicker}
        title={header.title}
        tagline={header.tagline}
        imageSrc={HERO_IMAGE}
        imageAlt={header.heroAlt}
        stats={header.stats}
        scrollLabel={header.scrollLabel}
        titleClassName="max-w-4xl text-4xl font-black tracking-tight sm:text-6xl"
      />

      <div id="start" className="space-y-16 py-14 sm:space-y-24 sm:py-20">
        <Content />
      </div>
    </>
  );
}
