import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, localeToOpenGraphLocale, SITE_URL } from '@/i18n/config';
import { routing, type Locale } from '@/i18n/routing';
import type { Metadata } from 'next';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { getParkBackgroundImage } from '@/lib/utils/park-assets';
import { ArticleStructuredData, BreadcrumbStructuredData } from '@/components/seo/structured-data';
import { GuideHero } from './_chrome';
import { HERO_FLOW_INTO_PULL } from '@/components/marketing/editorial-ui';
import { cn } from '@/lib/utils';
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
 * When the guide's content last actually changed. Hand-maintained: a date wired
 * to the build clock would move on every unrelated deploy and stop meaning
 * anything. Bump it when a chapter is rewritten, not when a typo is fixed.
 */
const CONTENT_UPDATED_AT = '2026-08-24';

interface PageHeader {
  title: string;
  /** Meta/structured-data description. Longer than the tagline. */
  intro: string;
  kicker: string;
  tagline: string;
  scrollLabel: string;
  heroAlt: string;
  stats: Array<{ value: string; label: string }>;
  /**
   * Document `<title>`. The H1 already ends in the brand, so the generic
   * `"{title} | park.fan"` doubled it ("So funktioniert park.fan | park.fan")
   * and opened on the brand rather than on what anyone types into a search box.
   * Lead with the query and keep the brand exactly once; ~60 characters is the
   * budget.
   */
  metaTitle: string;
  /** Unit under the hero's wait-time sign. */
  signUnit: string;
  /** One line under the sign, naming what it is. */
  signCaption: string;
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
    signCaption: 'Taron im Phantasialand. Mehr steht am Eingang nicht.',
    stats: [
      { value: '212', label: 'Parks' },
      { value: '7.156', label: 'Attraktionen' },
      { value: 'alle 5 Min.', label: 'neue Messwerte' },
    ],
  },
  en: {
    title: 'How park.fan works',
    metaTitle: 'Understanding wait times – how park.fan works',
    intro:
      '70 minutes at Taron: a lot, or normal? This guide shows on real examples how to place a wait time, when a ride has its quietest moment and where the numbers come from.',
    kicker: 'park.fan · The guide',
    tagline:
      '70 minutes at Taron. A lot? Normal? A number on its own does not answer that. This page shows what park.fan makes of it, and how it knows.',
    scrollLabel: 'Scroll',
    heroAlt: 'Phantasialand in the evening',
    signUnit: 'minutes',
    signCaption: 'Taron at Phantasialand. Nothing else is posted at the entrance.',
    stats: [
      { value: '212', label: 'parks' },
      { value: '7,156', label: 'attractions' },
      { value: 'every 5 min', label: 'new readings' },
    ],
  },
  es: {
    title: 'Así funciona park.fan',
    metaTitle: 'Entender los tiempos de espera – park.fan',
    intro:
      '70 minutos en Taron: ¿mucho o normal? Esta guía muestra con ejemplos reales cómo situar un tiempo de espera, cuándo una atracción está más tranquila y de dónde salen las cifras.',
    kicker: 'park.fan · La guía',
    tagline:
      '70 minutos en Taron. ¿Mucho? ¿Normal? Una cifra sola no lo responde. Esta página muestra qué hace park.fan con ella y cómo lo sabe.',
    scrollLabel: 'Desplazar',
    heroAlt: 'Phantasialand al anochecer',
    signUnit: 'minutos',
    signCaption: 'Taron, en Phantasialand. En la entrada no pone nada más.',
    stats: [
      { value: '212', label: 'parques' },
      { value: '7.156', label: 'atracciones' },
      { value: 'cada 5 min', label: 'mediciones nuevas' },
    ],
  },
  fr: {
    title: 'Comment fonctionne park.fan',
    metaTitle: 'Comprendre les temps d’attente – park.fan',
    intro:
      '70 minutes à Taron : beaucoup, ou normal ? Ce guide montre sur des exemples réels comment situer un temps d’attente, quand une attraction connaît son moment le plus calme et d’où viennent les chiffres.',
    kicker: 'park.fan · Le guide',
    tagline:
      '70 minutes à Taron. Beaucoup ? Normal ? Un chiffre seul n’y répond pas. Cette page montre ce que park.fan en fait, et comment il le sait.',
    scrollLabel: 'Défiler',
    heroAlt: 'Phantasialand le soir',
    signUnit: 'minutes',
    signCaption: 'Taron, à Phantasialand. Rien de plus à l’entrée.',
    stats: [
      { value: '212', label: 'parcs' },
      { value: '7 156', label: 'attractions' },
      { value: 'toutes les 5 min', label: 'nouveaux relevés' },
    ],
  },
  it: {
    title: 'Come funziona park.fan',
    metaTitle: 'Capire i tempi di attesa – park.fan',
    intro:
      '70 minuti a Taron: tanti o normali? Questa guida mostra con esempi reali come collocare un tempo di attesa, quando un’attrazione ha il suo momento più tranquillo e da dove arrivano i numeri.',
    kicker: 'park.fan · La guida',
    tagline:
      '70 minuti a Taron. Tanti? Normali? Un numero da solo non risponde. Questa pagina mostra cosa ne ricava park.fan, e come fa a saperlo.',
    scrollLabel: 'Scorri',
    heroAlt: 'Phantasialand di sera',
    signUnit: 'minuti',
    signCaption: 'Taron, al Phantasialand. All’ingresso non c’è altro.',
    stats: [
      { value: '212', label: 'parchi' },
      { value: '7.156', label: 'attrazioni' },
      { value: 'ogni 5 min', label: 'nuove rilevazioni' },
    ],
  },
  nl: {
    title: 'Zo werkt park.fan',
    metaTitle: 'Wachttijden begrijpen – zo werkt park.fan',
    intro:
      '70 minuten bij Taron: veel of normaal? Deze gids laat aan echte voorbeelden zien hoe je een wachttijd plaatst, wanneer een attractie haar rustigste moment heeft en waar de cijfers vandaan komen.',
    kicker: 'park.fan · De gids',
    tagline:
      '70 minuten bij Taron. Veel? Normaal? Eén getal alleen beantwoordt dat niet. Deze pagina laat zien wat park.fan ermee doet, en hoe het dat weet.',
    scrollLabel: 'Scrollen',
    heroAlt: 'Phantasialand in de avond',
    signUnit: 'minuten',
    signCaption: 'Taron in Phantasialand. Meer staat er bij de ingang niet.',
    stats: [
      { value: '212', label: 'parken' },
      { value: '7.156', label: 'attracties' },
      { value: 'elke 5 min.', label: 'nieuwe metingen' },
    ],
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
    'entender los tiempos de espera',
    'tiempos de espera parque temático',
    '¿es normal esta cola?',
    'aplicación parque temático',
    'guía park.fan',
    'calendario de afluencia',
    'predicciones de visitantes',
    'rope drop',
    'mejor hora parque temático',
    'PortAventura tiempos de espera',
    'Disneyland Paris tiempos de espera',
  ],
  fr: [
    'comprendre les temps d’attente',
    'temps d’attente parc d’attractions',
    'cette file est-elle normale',
    'application parc d’attractions',
    'guide park.fan',
    'calendrier d’affluence',
    'prévisions visiteurs',
    'rope drop',
    'meilleure heure parc d’attractions',
    'Disneyland Paris temps d’attente',
    'Parc Astérix temps d’attente',
  ],
  it: [
    'capire i tempi di attesa',
    'tempi di attesa parco divertimenti',
    'questa coda è normale',
    'app parco divertimenti',
    'guida park.fan',
    'calendario affollamento',
    'previsioni visitatori',
    'rope drop',
    'orario migliore parco divertimenti',
    'Gardaland tempi di attesa',
    'Europa-Park tempi di attesa',
  ],
  nl: [
    'wachttijden begrijpen',
    'wachttijden pretpark',
    'is deze wachttijd normaal',
    'pretpark app',
    'park.fan gids',
    'drukte-kalender',
    'bezoekersvoorspellingen',
    'rope drop',
    'beste tijd pretpark',
    'Efteling wachttijden',
    'Toverland wachttijden',
  ],
  en: [
    'understanding wait times',
    'theme park wait times',
    'is this wait time normal',
    'theme park app',
    'park.fan guide',
    'crowd calendar',
    'visitor predictions',
    'rope drop',
    'best time of day theme park',
    'Europa-Park wait times',
    'Disney wait times',
  ],
};

export async function generateMetadata({ params }: HowtoPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'howto' });
  // Locale-stable OG path: one `genericPages` key covers all six languages.
  const ogImageUrl = getOgImageUrl([locale, HOWTO_SEGMENTS.en]);

  const header = PAGE_HEADERS[locale as Locale];
  const fullTitle = header.metaTitle;
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

  return (
    <RouteMessages route="/how-park-fan-works">
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

        <GuideHero
          kicker={header.kicker}
          title={header.title}
          tagline={header.tagline}
          imageSrc={HERO_IMAGE}
          imageAlt={header.heroAlt}
          stats={header.stats}
          scrollLabel={header.scrollLabel}
          sign={{
            value: TARON_WAIT_NOW,
            unit: header.signUnit,
            caption: header.signCaption,
          }}
        />

        {/* One column at the container's width, no cap of its own.

            Every section spans `container mx-auto`, and running text used to
            stop at a 768 px measure inside it — a 752 px dead strip beside every
            paragraph at 1920 while the headings, rules, grids and tables beside
            it ran the full width. Capping the column instead only moved the
            problem: it narrowed the figures too. So the measure is gone from
            `Lead`, `P`, `PG`, `Highlight` and the demo captions, and text and
            figures share the section's edges. What is still narrower is narrower
            because a layout says so — a card, a column of a two-column demo, the
            sticky copy beside the wait-time scale.

            `overflow-x-clip` catches the decorative bleed — the glow behind the
            opening figure, the per-chapter ambience — which is wider than a phone
            and would otherwise hand the document a horizontal scrollbar. `clip`
            rather than `hidden`: hidden makes this a scroll container and the
            sticky figure in chapter 02 would stick to it instead of the
            viewport. */}
        <div
          id="start"
          className={cn(
            'u-force-metric relative space-y-16 overflow-x-clip pt-0 pb-14 sm:space-y-24 sm:py-20',
            HERO_FLOW_INTO_PULL
          )}
        >
          <Content />
        </div>
      </>
    </RouteMessages>
  );
}
