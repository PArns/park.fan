import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CalendarDays } from 'lucide-react';
import {
  generateAlternateLanguages,
  locales,
  localeToOpenGraphLocale,
  SITE_URL,
} from '@/i18n/config';
import { routing, type Locale } from '@/i18n/routing';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { RouteMessages } from '@/i18n/route-messages';
import { PLANNER_SEGMENTS } from '@/lib/planner/segments';
import { BreadcrumbStructuredData } from '@/components/seo/structured-data';
import { PlannerPageBody } from '@/components/planner/planner-page-body';
import type { PolaroidPhoto } from '@/components/planner/planner-polaroids';
import { getParkBackground } from '@/lib/media';
import { focusToObjectPosition, versionedSrc } from '@/lib/media/focus';
import { plannerFlag } from '@/flags';
import { PLANNER_ENABLED } from '@/lib/config/features';
import { notFound } from 'next/navigation';

interface PlannerPageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Reading a flag reads headers, so this route is dynamic and says so rather than
 * letting Next discover it. That costs nothing here — six URLs — and it is the
 * reason the flag is NOT read in the locale layout, which is the shell of 3,109
 * prerendered routes.
 */
export const dynamic = 'force-dynamic';

/** The localized path for this locale, which is what every link and canonical uses. */
function path(locale: string): string {
  return `/${locale}/${PLANNER_SEGMENTS[locale as Locale] ?? PLANNER_SEGMENTS.en}`;
}

export async function generateMetadata({ params }: PlannerPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'planner.page' });
  const ogImageUrl = getOgImageUrl([locale, 'trip-planner']);

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      locale: localeToOpenGraphLocale[locale as keyof typeof localeToOpenGraphLocale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeToOpenGraphLocale[l]),
      url: `${SITE_URL}${path(locale)}`,
      siteName: 'park.fan',
      type: 'website',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: t('metaTitle') }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('metaTitle'),
      description: t('metaDescription'),
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `${SITE_URL}${path(locale)}`,
      languages: {
        // The LOCALIZED segment per language, not this route's folder name:
        // `/de/trip-planner` is a rewrite target and not a URL anybody should be
        // pointed at.
        ...generateAlternateLanguages((l) => path(l)),
        'x-default': `${SITE_URL}${path('en')}`,
      },
    },
  };
}

/**
 * The trip planner's own page.
 *
 * The feature had no URL. Its launcher appears only once something is planned
 * and its panel is opened from a floating button, so a visitor who had not
 * already used it could not find it, could not link to it, and could not be sent
 * to it — and a search engine had nothing to index for it at all. This is the
 * page a menu entry can point at, and the one place that explains what the thing
 * is for before there is anything in it.
 *
 * It renders the DIRECTORY, never the editor. Picking a day here opens the same
 * panel the launcher opens; a page-sized second copy of the day grid would be
 * two implementations of one thing.
 */
export default async function PlannerPage({ params }: PlannerPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // The same kill switch the launcher and the two add controls are behind. A
  // page that renders a feature nobody can reach is worse than a 404: the menu
  // would still link to it.
  if (!PLANNER_ENABLED || !(await plannerFlag())) notFound();

  const t = await getTranslations('planner.page');
  const tNav = await getTranslations('navigation');
  const photos = polaroidPhotos();

  return (
    <RouteMessages route="/trip-planner">
      {/* The trail, and the leaf with it. The guide and Fancast both publish one
          and this page — reachable from four places in the chrome — published
          none, so a result for it had nothing under the title. `currentPage`
          rather than stopping at Home: Google's examples end the list with the
          page being rendered, and the URL is the one the canonical points at. */}
      <BreadcrumbStructuredData
        breadcrumbs={[{ name: tNav('home'), url: '/' }]}
        currentPage={{ name: t('title'), url: path(locale) }}
        locale={locale}
      />
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
        <header className="mb-8">
          <p className="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
            <CalendarDays className="size-4" aria-hidden="true" />
            {t('kicker')}
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">{t('title')}</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-relaxed">
            {t('lead')}
          </p>
        </header>

        <PlannerPageBody photos={photos} />
      </div>
    </RouteMessages>
  );
}

/**
 * The three photos the empty state lays out as polaroids.
 *
 * Resolved HERE, on the server, because `@/lib/media` is the 107 KB catalogue
 * and `PlannerPolaroids` is a Client Component — importing it there would ship
 * the whole thing to every visitor of this page.
 *
 * A fixed, hand-picked three rather than "the first three with a picture": the
 * database holds a background for nine of 212 parks, so a derived list would be
 * whatever the iteration order happens to be, and these are the three this
 * project's own homepage already leads with. Any that has lost its photo simply
 * drops out — the component draws what it is given and nothing if that is empty,
 * so a picture disappearing from the catalogue cannot leave a hole here.
 */
function polaroidPhotos(): PolaroidPhoto[] {
  // Every park the media database has a background for, in the order they are
  // laid down. Nine exist; six are drawn (see `SLOTS`), and naming all of them
  // means the fan stays full if one picture is retired rather than silently
  // losing a card. Slugs are the API's, which is why two of them do not look
  // like their labels.
  const picks: Array<{ slug: string; label: string }> = [
    { slug: 'phantasialand', label: 'Phantasialand' },
    { slug: 'europa-park', label: 'Europa-Park' },
    { slug: 'attractiepark-toverland', label: 'Toverland' },
    { slug: 'efteling', label: 'Efteling' },
    { slug: 'walibi-holland', label: 'Walibi Holland' },
    { slug: 'disneyland-park', label: 'Disneyland Paris' },
    { slug: 'bobbejaanland', label: 'Bobbejaanland' },
    { slug: 'walibi-belgium', label: 'Walibi Belgium' },
    { slug: 'movie-park-germany', label: 'Movie Park Germany' },
  ];

  const out: PolaroidPhoto[] = [];
  for (const pick of picks) {
    const image = getParkBackground(pick.slug);
    if (!image) continue;
    out.push({
      src: versionedSrc(image),
      position: focusToObjectPosition(image.focus),
      label: pick.label,
    });
  }
  return out;
}
