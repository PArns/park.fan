import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, localeToOpenGraphLocale, SITE_URL } from '@/i18n/config';
import { routing, type Locale } from '@/i18n/routing';
import type { Metadata } from 'next';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { getParkBackgroundImage } from '@/lib/utils/park-assets';
import { ArticleStructuredData, BreadcrumbStructuredData } from '@/components/seo/structured-data';
import { GuideHero } from './_chrome';
import { TARON_WAIT_NOW } from './_fixtures';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import type { ComponentType } from 'react';
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

/**
 * Locales whose content module has been rewritten as the editorial guide: it
 * brings its own numbered sections and lives under a full-bleed hero.
 *
 * The rest still carry the previous feature manual, which renders inside a
 * plain container under an `<h1>`. Both shapes are served here rather than one
 * being held back, because the two things are independent: the URL and the
 * routing moved for every language at once (a slug change is a one-shot 301
 * campaign, not something to do six times), while the prose is translated as it
 * is written. Delete this set — and the `legacy` branch below — once the last
 * locale is across.
 */
const EDITORIAL_LOCALES = new Set<Locale>(['de']);

/**
 * When the guide's content last actually changed. Hand-maintained: a date wired
 * to the build clock would move on every unrelated deploy and stop meaning
 * anything. Bump it when a chapter is rewritten, not when a typo is fixed.
 */
const CONTENT_UPDATED_AT = '2026-08-24';

interface PageHeader {
  title: string;
  /** Meta/structured-data description. Longer than the tagline. */
  intro: string;
  /** Editorial locales only. */
  kicker?: string;
  tagline?: string;
  scrollLabel?: string;
  heroAlt?: string;
  stats?: Array<{ value: string; label: string }>;
  /**
   * Document `<title>`, when the generic `"{title} | park.fan"` is wrong for
   * this page. The H1 already ends in the brand, so the generic form doubled it
   * ("So funktioniert park.fan | park.fan"), and it opened on the brand rather
   * than on what anyone types into a search box. Set this to lead with the
   * query and keep the brand exactly once; ~60 characters is the budget.
   */
  metaTitle?: string;
  /** Unit under the hero's wait-time sign. */
  signUnit?: string;
  /** One line under the sign, naming what it is. */
  signCaption?: string;
}

const PAGE_HEADERS: Record<Locale, PageHeader> = {
  de: {
    title: 'So funktioniert park.fan',
    metaTitle: 'Wartezeiten verstehen – so funktioniert park.fan',
    intro:
      '70 Minuten bei Taron: viel oder normal? Diese Anleitung zeigt an echten Beispielen, wie du eine Wartezeit einordnest, wann eine Bahn ihren ruhigsten Moment hat und woher die Zahlen kommen.',
    kicker: 'park.fan · Die Anleitung',
    tagline:
      '70 Minuten bei Taron. Viel? Normal? Eine Zahl allein beantwortet das nicht. Diese Seite zeigt, was park.fan daraus macht, und woher es das weiß.',
    scrollLabel: 'Scrollen',
    heroAlt: 'Phantasialand am Abend',
    signUnit: 'Minuten',
    signCaption: 'Taron, Phantasialand. Mehr sagt das Schild nicht.',
    stats: [
      { value: '212', label: 'Parks' },
      { value: '7.156', label: 'Attraktionen' },
      { value: 'alle 5 Min.', label: 'neue Messwerte' },
    ],
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

/**
 * Establishing shot for the hero. Asked of the media database by role rather
 * than named by path, so the park can change which photo that is.
 */
const HERO_IMAGE = getParkBackgroundImage('phantasialand') ?? '/media/phantasialand/background.jpg';

interface HowtoPageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function urlFor(locale: Locale) {
  return `${SITE_URL}/${locale}/${HOWTO_SEGMENTS[locale]}`;
}

const KEYWORDS: Record<Locale, string[]> = {
  de: [
    'Wartezeiten verstehen',
    'Freizeitpark Wartezeiten',
    'ist die Wartezeit normal',
    'Taron Wartezeit',
    'Freizeitpark App',
    'park.fan Anleitung',
    'Crowd-Kalender',
    'Besucherprognose',
    'Rope Drop',
    'beste Uhrzeit Freizeitpark',
    'Phantasialand Wartezeiten',
    'Europa-Park Wartezeiten',
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
  // Locale-stable OG path: one `genericPages` key covers all six languages.
  const ogImageUrl = getOgImageUrl([locale, HOWTO_SEGMENTS.en]);

  const header = PAGE_HEADERS[locale as Locale];
  // `metaTitle` is already brand-suffixed where it is set; the generic form is
  // for the locales still on the old headline.
  const fullTitle = header?.metaTitle ?? `${t('title')} | park.fan`;
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
      canonical: url,
      languages: {
        // Built from `urlFor`, the same function the canonical uses, so the two
        // can never disagree — and so the locale prefix cannot go missing, which
        // is exactly what a hand-written path template did here once.
        ...Object.fromEntries(locales.map((l) => [l, urlFor(l)])),
        'x-default': urlFor('en'),
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

  const typedLocale = locale as Locale;
  const Content = await CONTENT_LOADERS[typedLocale]();
  const header = PAGE_HEADERS[typedLocale];
  const url = urlFor(typedLocale);
  const t = await getTranslations({ locale, namespace: 'common' });

  const seo = (
    <>
      <ArticleStructuredData
        title={header.title}
        description={header.intro}
        url={url}
        locale={locale}
        image={getOgImageUrl([locale, HOWTO_SEGMENTS.en])}
        dateModified={CONTENT_UPDATED_AT}
      />
      <BreadcrumbStructuredData
        breadcrumbs={[
          { name: t('home'), url: '/' },
          { name: header.title, url: `/${HOWTO_SEGMENTS[typedLocale]}` },
        ]}
        locale={locale}
      />
    </>
  );

  if (!EDITORIAL_LOCALES.has(typedLocale)) {
    return (
      <RouteMessages route="/how-park-fan-works">
        <div className="container mx-auto px-4 py-12">
          {seo}
          <div>
            <h1 className="mb-2 text-2xl font-bold sm:text-4xl">{header.title}</h1>
            <p className="text-muted-foreground mb-10 text-lg">{header.intro}</p>
            <Content />
          </div>
        </div>
      </RouteMessages>
    );
  }

  return (
    <RouteMessages route="/how-park-fan-works">
      <>
        {seo}

        <GuideHero
          kicker={header.kicker!}
          title={header.title}
          tagline={header.tagline!}
          imageSrc={HERO_IMAGE}
          imageAlt={header.heroAlt!}
          stats={header.stats!}
          scrollLabel={header.scrollLabel!}
          sign={{
            value: TARON_WAIT_NOW,
            unit: header.signUnit!,
            caption: header.signCaption!,
          }}
        />

        {/* `overflow-x-clip` catches the decorative bleed — the sign's glow, the
            per-chapter ambience — which is wider than a phone and would otherwise
            hand the document a horizontal scrollbar. `clip` rather than `hidden`:
            hidden makes this a scroll container and the sticky figure in chapter
            02 would stick to it instead of the viewport. */}
        <div id="start" className="space-y-16 overflow-x-clip py-14 sm:space-y-24 sm:py-20">
          <Content />
        </div>
      </>
    </RouteMessages>
  );
}
