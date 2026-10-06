import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  generateAlternateLanguages,
  locales,
  localeToOpenGraphLocale,
  SITE_URL,
} from '@/i18n/config';
import { routing, type Locale } from '@/i18n/routing';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { RouteMessages } from '@/i18n/route-messages';
import { PLANNER_SEGMENTS, PLANNER_START_ID, plannerPath } from '@/lib/planner/segments';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { CalendarPlus, CalendarDays, Compass } from 'lucide-react';
import {
  BreadcrumbStructuredData,
  WebApplicationStructuredData,
} from '@/components/seo/structured-data';
import { PlannerPageBody } from '@/components/planner/planner-page-body';
import type { PolaroidPhoto } from '@/components/planner/planner-polaroids';
import {
  LandingHero,
  LandingNextSteps,
  HERO_FLOW_INTO_PULL,
} from '@/components/marketing/editorial-ui';
import { cn } from '@/lib/utils';
import { getParkBackground } from '@/lib/media';
import { getMediaAlt } from '@/lib/media/text';
import { focusToObjectPosition, versionedSrc } from '@/lib/media/focus';
import { demoEntries, demoPlanDay } from './_fixtures';
import type { ComponentType } from 'react';
import type { PlanDay } from '@/lib/api/types';
import type { PlannerEntry } from '@/lib/planner/types';

/**
 * The article under the directory, one module per language, loaded lazily so a render evaluates
 * only the requested locale's prose.
 */
type ContentProps = { day: PlanDay; entries: PlannerEntry[] };
const CONTENT_LOADERS: Record<Locale, () => Promise<ComponentType<ContentProps>>> = {
  de: () => import('./content/de').then((m) => m.ContentDE),
  en: () => import('./content/en').then((m) => m.ContentEN),
  es: () => import('./content/es').then((m) => m.ContentES),
  fr: () => import('./content/fr').then((m) => m.ContentFR),
  it: () => import('./content/it').then((m) => m.ContentIT),
  nl: () => import('./content/nl').then((m) => m.ContentNL),
};

/**
 * The park whose photograph runs behind the hero. `disneyland-park` is the only park background
 * wider than 1024 px, and this photo is the LCP element of a `sizes="100vw"` hero. It is a wide
 * shot of a park on an open day, and the castle survives the centred phone crop, which matters
 * because the shared `Hero` sets no `object-position`.
 */
const HERO_PARK_SLUG = 'disneyland-park';

interface PlannerPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Six URLs, all prerendered: nothing here reads a request, and the plan itself lives in the
 * visitor's browser.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

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
 * The trip planner's own page: the URL a menu entry, a link or a search engine can point at, and
 * the place that explains the planner before there is anything in it. It renders the directory,
 * never the editor: picking a day opens the same panel the launcher opens.
 */
export default async function PlannerPage({ params }: PlannerPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('planner.page');
  const tNav = await getTranslations('navigation');
  const tPlanner = await getTranslations('planner');
  const tLanding = await getTranslations('landing');
  const photos = polaroidPhotos(locale);
  const hero = heroPhoto(locale);
  const Content = await (CONTENT_LOADERS[locale as Locale] ?? CONTENT_LOADERS.en)();
  const day = demoPlanDay();
  // The free block's label is a word, and this page exists in six languages.
  const entries = demoEntries(tPlanner('custom.icon.food'));
  // The page's one action (docs/product/landing-pages.md §4) is the tool on this same page, so it
  // is an anchor to whichever of the body's „plan a new day" controls is showing. The planner
  // itself opens nowhere else.
  const action = {
    href: `${plannerPath(locale)}#${PLANNER_START_ID}`,
    label: tLanding('planner.action'),
    icon: CalendarPlus,
  };

  return (
    <RouteMessages route="/trip-planner">
      {/* The trail ends with this page itself (`currentPage`), as in Google's examples, at
          the URL the canonical points at. */}
      <BreadcrumbStructuredData
        breadcrumbs={[{ name: tNav('home'), url: '/' }]}
        currentPage={{ name: t('title'), url: path(locale) }}
        locale={locale}
      />
      <WebApplicationStructuredData
        name={t('title')}
        description={t('metaDescription')}
        path={path(locale)}
        locale={locale}
      />
      {/* The full-bleed hero the blog index, Fancast and the best-time hub use. The H1 is
          `planner.page.title`, the page's strongest on-page signal. Without a photo in the
          database it gets the compact head with the same three strings, in flow below the
          header. */}
      {hero ? (
        <LandingHero
          kicker={tLanding('planner.kicker')}
          title={t('title')}
          tagline={t('lead')}
          imageSrc={hero.src}
          imageAlt={hero.alt}
          scrollLabel={tLanding('scroll')}
          action={action}
          flowInto
        />
      ) : (
        <LandingHero
          variant="compact"
          kicker={tLanding('planner.kicker')}
          title={t('title')}
          tagline={t('lead')}
          action={action}
        />
      )}

      {/* The container's width, with no cap of its own: the directory is a grid of park cards
          and the chapters draw the planner's components at their real size. `relative` puts it
          above the hero's stacking context, and `id="start"` is what the hero's scroll cue
          points at. */}
      <div
        id="start"
        className={cn(
          'relative container mx-auto px-4 pb-16 sm:pb-24',
          // Below `sm` this section is pulled up over the photo by `HERO_FLOW_INTO_PULL`, which
          // pairs with the hero's mobile `pb-48`. With no photo there is no pull, or the compact
          // head would slide up under the header.
          hero ? cn('pt-0 sm:pt-12', HERO_FLOW_INTO_PULL) : 'pt-8 sm:pt-12'
        )}
      >
        <PlannerPageBody photos={photos} />

        {/* What the thing actually does, with the planner's own components
            drawing a real day. It sits BELOW the directory: somebody who
            already has a plan came here to open it, and the explanation is for
            the visit before that one. */}
        <article className="mt-16 space-y-16 sm:mt-24 sm:space-y-24">
          <Content day={day} entries={entries} />
        </article>
      </div>

      {/* The closing band runs the full width like on the other hubs, so it stands outside the
          container above. Its first destination is the head's action again. It is the last
          thing before the footer, with no gap under it: a gap reads as a dark bar. */}
      <LandingNextSteps
        title={tLanding('planner.next.title')}
        body={tLanding('planner.next.body')}
        destinations={[
          action,
          {
            href: `/${BEST_TIME_SEGMENTS[locale as Locale]}`,
            label: tNav('bestTime'),
            icon: CalendarDays,
          },
          { href: '/parks', label: tNav('parks'), icon: Compass },
        ]}
      />
    </RouteMessages>
  );
}

/**
 * The hero's photograph and its description, or `null` when the database has none, resolved on
 * the server so the media catalogue stays out of the client. `null` is a real branch: `next/image`
 * throws on an empty source, so the caller draws the compact head instead. The alt is the
 * sidecar's in the reader's language, or `''` for a photo nobody has described, never a sentence
 * built from the slug.
 */
function heroPhoto(locale: string): { src: string; alt: string } | null {
  const image = getParkBackground(HERO_PARK_SLUG);
  if (!image) return null;
  return { src: versionedSrc(image), alt: getMediaAlt(image.id, locale) ?? '' };
}

/**
 * The photos the empty state lays out as polaroids, resolved here on the server because
 * `@/lib/media` is the whole catalogue and `PlannerPolaroids` is a Client Component. A fixed,
 * hand-picked list; one that has lost its photo drops out. The locale is for the alt text alone,
 * as for the hero.
 */
function polaroidPhotos(locale: string): PolaroidPhoto[] {
  // Every park the media database has a background for, more than the fan's `SLOTS`, so it
  // stays full if one picture is retired. Slugs are the API's, which is why two of them do
  // not look like their labels.
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
    // The hero's own park sits this one out: the same picture twice in one screen reads as a
    // mistake rather than a motif.
    if (pick.slug === HERO_PARK_SLUG) continue;
    const image = getParkBackground(pick.slug);
    if (!image) continue;
    out.push({
      src: versionedSrc(image),
      position: focusToObjectPosition(image.focus),
      label: pick.label,
      alt: getMediaAlt(image.id, locale) ?? '',
    });
  }
  return out;
}
