import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, localeToOpenGraphLocale, SITE_URL } from '@/i18n/config';
import { routing, type Locale } from '@/i18n/routing';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import type { Metadata } from 'next';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { getParkBackgroundImage } from '@/lib/utils/park-assets';
import { ArticleStructuredData, BreadcrumbStructuredData } from '@/components/seo/structured-data';
import { LandingHero, HERO_FLOW_INTO_PULL } from '@/components/marketing/editorial-ui';
import { cn } from '@/lib/utils';
import type { ComponentType } from 'react';
import { RouteMessages } from '@/i18n/route-messages';

/**
 * When this page's copy was first published and last revised, for the `Article` node.
 *
 * Hand-maintained, because nothing else here knows: the page is six locale content modules and a
 * header table, not a feed, so there is no timestamp to read. The initial values are the dates
 * git has for `app/[locale]/best-time-to-visit`. Bump `MODIFIED` when the prose or the figures in
 * it change — an undated page that quotes measurements reads as stale to the engines most likely
 * to quote it.
 */
const CONTENT_PUBLISHED = '2026-07-22';
const CONTENT_MODIFIED = '2026-09-10';

const CONTENT_LOADERS: Record<Locale, () => Promise<ComponentType>> = {
  de: () => import('./content/de').then((m) => m.ContentDE),
  en: () => import('./content/en').then((m) => m.ContentEN),
  es: () => import('./content/es').then((m) => m.ContentES),
  fr: () => import('./content/fr').then((m) => m.ContentFR),
  it: () => import('./content/it').then((m) => m.ContentIT),
  nl: () => import('./content/nl').then((m) => m.ContentNL),
};

/**
 * Scenic, calm establishing shot — sets the "plan the perfect day" tone.
 *
 * Asked of the database rather than hard-coded. The path it used to name was a
 * byte-for-byte copy of `efteling/symbolica.jpg` kept only so the park had a file
 * called `background`; deduplicating those left this the one reference that broke.
 * Going through the role means the park can change which photo that is without
 * anything here knowing.
 */
const HERO_IMAGE = getParkBackgroundImage('efteling') ?? '/media/efteling/symbolica.jpg';

interface PageHeader {
  title: string;
  /** Structured-data / meta fallback description (longer than the tagline). */
  intro: string;
  heroAlt: string;
}

const PAGE_HEADERS: Record<Locale, PageHeader> = {
  de: {
    title: 'Beste Reisezeit für Freizeitparks',
    intro:
      'Wann sind Freizeitparks am leersten? Die ruhigsten Wochentage und Monate aus gemessenen Wartezeiten von über 200 Parks, dazu Tricks für kurze Warteschlangen und der Kalender mit dem besten Tag für deinen Wunschpark.',
    heroAlt: 'Symbolica im Efteling bei Nacht, blau angeleuchtet',
  },
  en: {
    title: 'Best Time to Visit Theme Parks',
    intro:
      'When are theme parks least crowded? The quietest weekdays and months, from wait times measured at 200+ parks, plus tactics for short queues and the calendar with the best day for your park.',
    heroAlt: 'Symbolica at Efteling by night, lit in blue',
  },
  es: {
    title: 'Mejor época para visitar parques temáticos',
    intro:
      '¿Cuándo hay menos gente en los parques temáticos? Los días de la semana y los meses más tranquilos, a partir de los tiempos de espera medidos en más de 200 parques, con trucos para colas cortas y el calendario con el mejor día para tu parque.',
    heroAlt: 'El palacio de Symbolica en Efteling, de noche e iluminado en azul',
  },
  fr: {
    title: "Meilleure période pour visiter les parcs d'attractions",
    intro:
      "Quand les parcs d'attractions sont-ils les moins fréquentés ? Les jours de la semaine et les mois les plus calmes, à partir des temps d'attente mesurés dans plus de 200 parcs, avec des astuces pour des files courtes et le calendrier du meilleur jour pour votre parc.",
    heroAlt: 'Le palais de Symbolica à Efteling, la nuit, éclairé en bleu',
  },
  it: {
    title: 'Periodo migliore per visitare i parchi divertimento',
    intro:
      'Quando i parchi divertimento sono meno affollati? I giorni della settimana e i mesi più tranquilli, dai tempi di attesa misurati in oltre 200 parchi, con trucchi per code brevi e il calendario con il giorno migliore per il tuo parco.',
    heroAlt: 'Il palazzo di Symbolica a Efteling di notte, illuminato di blu',
  },
  nl: {
    title: 'Beste tijd om pretparken te bezoeken',
    intro:
      'Wanneer zijn pretparken het rustigst? De rustigste weekdagen en maanden volgens de wachttijden van meer dan 200 parken, tips voor korte rijen en de kalender met de beste dag voor jouw park.',
    heroAlt: 'Het paleis van Symbolica in de Efteling bij nacht, blauw verlicht',
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
  const [t, tLanding] = await Promise.all([
    getTranslations({ locale, namespace: 'common' }),
    getTranslations({ locale, namespace: 'landing' }),
  ]);
  const stats = (['parks', 'since', 'daily'] as const).map((key) => ({
    value: tLanding(`bestTime.stats.${key}.value`),
    label: tLanding(`bestTime.stats.${key}.label`),
  }));

  return (
    <RouteMessages route="/best-time-to-visit">
      <>
        <ArticleStructuredData
          title={header.title}
          description={header.intro}
          url={url}
          locale={locale}
          image={getOgImageUrl([locale, BEST_TIME_SEGMENTS.en])}
          datePublished={CONTENT_PUBLISHED}
          dateModified={CONTENT_MODIFIED}
        />
        <BreadcrumbStructuredData
          breadcrumbs={[
            { name: t('home'), url: '/' },
            { name: header.title, url: `/${BEST_TIME_SEGMENTS[locale as Locale]}` },
          ]}
          locale={locale}
        />

        <LandingHero
          kicker={tLanding('bestTime.kicker')}
          title={header.title}
          tagline={tLanding('bestTime.tagline')}
          imageSrc={HERO_IMAGE}
          imageAlt={header.heroAlt}
          stats={stats}
          scrollLabel={tLanding('scroll')}
          flowInto
        />

        {/* Pulled up over the hero on phones — see `HERO_FLOW_INTO_PULL`, which
            owns the number so it stays paired with the hero's bottom padding. */}
        <div
          id="start"
          className={cn(
            'relative space-y-16 pt-0 pb-14 sm:space-y-24 sm:py-20',
            HERO_FLOW_INTO_PULL
          )}
        >
          <Content />
        </div>
      </>
    </RouteMessages>
  );
}
