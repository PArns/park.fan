import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import nextDynamic from 'next/dynamic';
import { generateAlternateLanguages, SITE_URL } from '@/i18n/config';
import type { Locale } from '@/i18n/config';
import type { Metadata } from 'next';
import { buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { assertServableRoute, isServableRoute } from '@/lib/utils/route-guards';
import { blogFeedAlternates } from '@/lib/blog/feed';
import { RouteMessages } from '@/i18n/route-messages';
import { pickHeroImage } from '@/lib/media/hero';
import { heroBlurDataUrl } from '@/lib/media/hero-lqip';
import { getMediaAltBySrc } from '@/lib/media/text';
import { HOME_HERO_ID } from '@/lib/home/hero-search';

import { Flame, Star } from 'lucide-react';
import { HeroBackground } from '@/components/layout/hero-background';
import { HeroImageInfoSwitch } from '@/components/layout/hero-image-info-switch';
import { HeroImageInfo } from '@/components/layout/hero-image-info';
import { HeroRotationProvider } from '@/components/layout/hero-rotation-context';
import { HeroInlineSearch } from '@/components/search/hero-inline-search';
import { HeroEntranceGate } from '@/components/home/hero-entrance-gate';
import { HeroStats } from '@/components/home/hero-stats';
import { HeroTextPanel } from '@/components/home/hero-text-panel';
import { HeroRail } from '@/components/home/hero-rail';
import { ParkCompassSlot } from '@/components/home/park-compass-slot';
import { AnnounceSection } from '@/components/home/announce-section';
import { HomeReading } from '@/components/home/home-reading';
import { HomeTour } from '@/components/home/home-tour';
import { FeaturedParksSlot } from '@/components/home/featured-parks-slot';
import { PopularParkLinks } from '@/components/home/popular-park-links';
import { FeaturedParksSkeleton } from '@/components/home/home-skeletons';
import { getFeaturedParksLabels } from '@/components/home/section-headings';
import { FaqSection } from '@/components/home/faq-section';
import { ParkyStop } from '@/components/home/parky-stop';
import { FavoritesIntro } from '@/components/home/favorites-intro';
import { HomeStop, StopLink } from '@/components/home/home-stop';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { FavoritesEmptyState } from '@/components/parks/favorites-empty-state';

const LocationBanner = nextDynamic(
  () => import('@/components/common/location-banner').then((m) => ({ default: m.LocationBanner })),
  { loading: () => null, ssr: true }
);

// `loading` is a real Suspense fallback (see page-bottom-sections.tsx), with the same `className`
// as the section, so the band keeps its height when the chunk lands.
const FavoritesSection = nextDynamic(
  () =>
    import('@/components/parks/favorites-section').then((m) => ({ default: m.FavoritesSection })),
  {
    loading: () => <FavoritesEmptyState textHidden heading="none" className={BORROWED_BAND} />,
    ssr: true,
  }
);

// A static shell per locale, served from the CDN. Every live figure on the page is a seed that a
// client query overlays on mount (the hero's counts and card rail, favourites, the popular
// parks' status), so the shell's age is invisible to a reader with JavaScript. The route's window
// is the lowest fetch revalidate in its render; every fetch left (`getGlobalStats`,
// `getGeoStructure`) is cached a week. Read `initialRevalidateSeconds` in
// `.next/prerender-manifest.json` after touching a fetch here. See
// docs/rules/a-revalidate-at-a-call-site-is-somebody-elses-page.md.
export const revalidate = 604800;

// The hero photo: a deterministic pick per 5-minute window, identical for concurrent requests and
// re-picked on each shell regeneration. Server-rendered for LCP.
const HERO_TTL_MS = 5 * 60_000;

// The favourites and the popular parks are sections other pages draw as bands of their own. Here
// they stand inside a stop (`HomeStop`), which sets the room and holds the heading, so their band
// padding and tint go.
const BORROWED_BAND = 'bg-transparent p-0';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isServableRoute(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'seo.home' });
  const ogImageUrl = getOgImageUrl([locale]);

  const fullTitle = `${t('title')} | park.fan`;

  return {
    title: { absolute: fullTitle },
    description: t('description'),
    ...buildOpenGraphMetadata({
      locale,
      title: fullTitle,
      description: t('description'),
      url: `${SITE_URL}/${locale}`,
      ogImageUrl,
    }),
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}`),
        'x-default': `${SITE_URL}/en`,
      },
      // The homepage is where a reader or a crawler looks for a site's feed first. Park and
      // glossary pages carry none: the spec wants a page's own main feed, and they have none.
      types: blogFeedAlternates(locale as Locale),
    },
  };
}

/**
 * The homepage, written for somebody who has never been here: what this is and where a queue is
 * short near them right now (the hero and its card rail), then one stop after another, each a
 * heading worded as people search beside its content (`HomeStop`): what is new (the news board),
 * their favourites where they have some, what park.fan does (the tour), for whoever has not found
 * it yet Parky, how favourites work where they have none, the popular parks and five questions.
 * Everything that explains a tool at length lives on that tool's own page.
 */
export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  assertServableRoute(locale);
  setRequestLocale(locale);

  // Only the static, above-the-fold shell needs translations up front. Every data-dependent
  // section below the hero fetches its own data (and translations) inside a Suspense boundary; the
  // hero's counts are the one wait, served from a week's cache (`getGlobalStats`).
  const [tHome, tStory, featuredParksLabels] = await Promise.all([
    getTranslations('home'),
    getTranslations('homeStory'),
    getFeaturedParksLabels(),
  ]);
  const heroImage = pickHeroImage(HERO_TTL_MS);
  const randomHeroImage = heroImage?.src;
  const heroMeta = heroImage?.meta ?? null;

  return (
    <RouteMessages route="/">
      <div className="flex flex-col">
        {/* z-10, not `isolate`, which stacked the section below later siblings: the search
          list floats out of this section over the content beneath it. The sticky header is z-50,
          so it still wins. `-mt-12` runs the photo up under the header. */}
        {/* `suppressHydrationWarning` covers `className`: HeroEntranceGate's inline script
          removes `hero-entering`, so on a slow load React hydrates against a class list the
          script already edited. React reads the flag one level deep, so a mismatch inside the
          hero still reports. */}
        <section
          id={HOME_HERO_ID}
          suppressHydrationWarning
          className="hero-entering relative z-10 -mt-12"
        >
          <HeroRotationProvider>
            {/* The photo, with the text on its lower edge. Its bottom padding is the room the
              card rail below takes from it (`-mt-10`, from `md` `-mt-44`) plus the gap above the
              rail, so the cards stand on the photo and the text sits high enough for them to be
              read on the first screen; on a phone the photo is as tall as its text. */}
            <div className="relative flex flex-col justify-end px-4 pt-20 pb-16 md:min-h-[min(40rem,74svh)] md:px-6 md:pt-24 md:pb-52">
              <HeroBackground
                imageSrc={randomHeroImage}
                blurDataURL={heroBlurDataUrl(randomHeroImage)}
                alt={getMediaAltBySrc(randomHeroImage, locale) ?? undefined}
              />
              {/* Closes the entrance window, so content that streams in later does not replay it
                (see HeroEntranceGate). Outside the text column on purpose: a child there would
                shift the content stagger's nth-child by one. */}
              <HeroEntranceGate />
              {/* Tailwind's `container` tiers, asked of `@container/page` instead of the window,
                which an open planner makes wider than the page. `z-20` lifts the open search
                list over the card rail, which overlaps the photo from `md`. */}
              <div className="relative z-20 mx-auto w-full @min-[640px]/page:max-w-[640px] @min-[768px]/page:max-w-[768px] @min-[1024px]/page:max-w-[1024px] @min-[1280px]/page:max-w-[1280px] @min-[1536px]/page:max-w-[1536px]">
                <HeroTextPanel className="hero-in-stagger">
                  {/* Rendered with the page, counts and all: Parky's slot is in the first HTML,
                    so his button finds it at once (the counts come from a week's cache). */}
                  <HeroStats />
                  <HeroInlineSearch
                    placeholder={tHome('hero.searchExamples')}
                    label={tHome('hero.searchPlaceholder')}
                    className="mt-6 max-w-2xl"
                  />
                </HeroTextPanel>
              </div>

              {/* Hero image attribution: the current image's park / city / country. */}
              {heroMeta && (
                <HeroImageInfoSwitch>
                  <HeroImageInfo meta={heroMeta} src={randomHeroImage} />
                </HeroImageInfoSwitch>
              )}
            </div>

            {/* What the headline asks, answered: the rides near the visitor with a short queue
              right now, or the parks near them. Over the photo's lower edge from `md`. */}
            <div className="relative z-10 -mt-10 px-4 md:-mt-44 md:px-6">
              <div className="mx-auto w-full @min-[640px]/page:max-w-[640px] @min-[768px]/page:max-w-[768px] @min-[1024px]/page:max-w-[1024px] @min-[1280px]/page:max-w-[1280px] @min-[1536px]/page:max-w-[1536px]">
                <HeroRail className="hero-in-stagger hero-in-late" />
              </div>
            </div>
          </HeroRotationProvider>
        </section>

        {/* Standing in a park: the headliners on a compass ring, straight under the hero that says
          which park it is (below `lg` under the news, further down). Client-only and absent for
          everybody else — see ParkCompassSlot. */}
        <ParkCompassSlot placement="hero" />

        <div className="pk-reveal">
          <AnnounceSection locale={locale} />
        </div>

        <LocationBanner />

        {/* What is new comes first: the hero already lists the parks near the visitor, and the
          news is what changes from one visit to the next. */}
        <HomeReading locale={locale as Locale} />

        <ParkCompassSlot placement="news" />

        {/* The visitor's favourites, right under the news, for a visitor who has some only: for
          them it is what they came back for, and for anybody else an empty state about a feature
          they have not used. The inline favourites script in app/[locale]/layout.tsx sets
          `data-has-favorites` before paint, and `.home-favorites` in globals.css reads it, so the
          choice moves nothing after load. A Client Component that decides late (a cookie), hence
          the dynamic import and the box-reserving fallback. */}
        <HomeStop
          stacked
          flushTop
          className="home-favorites"
          heading={
            <ChapterHeading
              variant="stop"
              icon={Star}
              kicker={tStory('favorites.kicker')}
              title={tStory('favorites.title')}
              hint={tStory('favorites.lead')}
            />
          }
        >
          <FavoritesSection heading="none" className={BORROWED_BAND} />
        </HomeStop>

        <HomeTour locale={locale as Locale} />

        {/* The tour's last stop: what park.fan does not show on a page, Parky answers. */}
        <ParkyStop locale={locale as Locale} />

        {/* For a visitor without favourites: how to star a park and where the favourites show. */}
        <FavoritesIntro locale={locale as Locale} />

        {/* Popular parks per locale: the cards (SSR seed + client live data) beside the heading,
          and under the heading a link to each one's waits and calendar, which needs no API. */}
        <HomeStop
          divider
          reverse
          heading={
            <ChapterHeading
              variant="stop"
              icon={Flame}
              kicker={tStory('popular.kicker')}
              title={tStory('popular.title')}
              hint={tStory('popular.lead')}
              action={<StopLink href="/parks">{tHome('hero.cta')}</StopLink>}
            />
          }
          aside={<PopularParkLinks locale={locale as Locale} />}
        >
          <Suspense
            fallback={
              <FeaturedParksSkeleton
                labels={featuredParksLabels}
                heading="none"
                className={BORROWED_BAND}
              />
            }
          >
            <FeaturedParksSlot locale={locale} heading="none" className={BORROWED_BAND} />
          </Suspense>
        </HomeStop>

        {/* The page's only FAQPage markup — FaqSection renders the questions and the JSON-LD from
          one array. */}
        <FaqSection locale={locale as Locale} />
      </div>
    </RouteMessages>
  );
}
