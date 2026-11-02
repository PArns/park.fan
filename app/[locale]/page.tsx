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
import { getHeroReading } from '@/lib/home/hero-reading';
import { getNewsMenu } from '@/lib/navigation/news-menu';
import { latestNewsFrom } from '@/components/blog/latest-news-chip';

import { HeroBackground } from '@/components/layout/hero-background';
import { HeroImageInfoSwitch } from '@/components/layout/hero-image-info-switch';
import { HeroImageInfo } from '@/components/layout/hero-image-info';
import { HeroRotationProvider } from '@/components/layout/hero-rotation-context';
import { HeroInlineSearch } from '@/components/search/hero-inline-search';
import { HeroEntranceGate } from '@/components/home/hero-entrance-gate';
import { HeroWithNearby } from '@/components/home/hero-with-nearby';
import { HeroStats } from '@/components/home/hero-stats';
import { HeroTextPanel } from '@/components/home/hero-text-panel';
import { HeroWorldPanel } from '@/components/home/hero-world-panel';
import { HeroWorldPanelSkeleton } from '@/components/home/hero-skeletons';
import { ParkCompassSlot } from '@/components/home/park-compass-slot';
import { AnnounceSection } from '@/components/home/announce-section';
import { NearbyChapter } from '@/components/home/nearby-chapter';
import { HomeReading } from '@/components/home/home-reading';
import { HomeTour } from '@/components/home/home-tour';
import { FeaturedParksSlot } from '@/components/home/featured-parks-slot';
import { PopularParkLinks } from '@/components/home/popular-park-links';
import { FeaturedParksSkeleton } from '@/components/home/home-skeletons';
import { getFeaturedParksLabels } from '@/components/home/section-headings';
import { FaqSection } from '@/components/home/faq-section';
import { STORY_SECTION_Y } from '@/components/home/section-chrome';
import { NearbyParksCardSkeleton } from '@/components/parks/nearby-parks-card-skeleton';
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
    loading: () => <FavoritesEmptyState textHidden heading="tile" className={FAVORITES_BAND} />,
    ssr: true,
  }
);

const NearbyParksCard = nextDynamic(
  () =>
    import('@/components/parks/nearby-parks-card').then((m) => ({ default: m.NearbyParksCard })),
  {
    loading: () => <NearbyParksCardSkeleton nested />,
    ssr: true,
  }
);

// A static shell per locale, served from the CDN. Every live figure on the page is a seed that a
// client query overlays on mount (the hero's counts and map, nearby parks, favourites, the popular
// parks' status), so the shell's age is invisible to a reader with JavaScript. The route's window
// is the lowest fetch revalidate in its render; every fetch left (`getGlobalStats`,
// `getGeoLiveStats`, `getGeoStructure`) is cached a week. Read `initialRevalidateSeconds` in
// `.next/prerender-manifest.json` after touching a fetch here. See
// docs/rules/a-revalidate-at-a-call-site-is-somebody-elses-page.md.
export const revalidate = 604800;

// The hero photo: a deterministic pick per 5-minute window, identical for concurrent requests and
// re-picked on each shell regeneration. Server-rendered for LCP.
const HERO_TTL_MS = 5 * 60_000;

// The favourites band, for a visitor with favourites only, and then above the nearby parks: the
// inline favourites script in app/[locale]/layout.tsx sets `data-has-favorites` before paint, and
// `.home-favorites` in globals.css reads it, so neither choice moves anything after load.
const FAVORITES_BAND = `${STORY_SECTION_Y} home-favorites`;

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
 * The homepage, written for somebody who has never been here: what this is (the hero's headline
 * and one sentence), whether their park is in it (the search, four popular parks, the parks near
 * them), what is new (guides and news), what else it does (four tools), the popular parks and four
 * questions. Everything that explains a tool at length lives on that tool's own page.
 */
export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  assertServableRoute(locale);
  setRequestLocale(locale);

  // Only the static, above-the-fold shell needs translations up front. Every data-dependent
  // section fetches its own data (and translations) inside a Suspense boundary below, so the hero
  // renders and streams without waiting on the API.
  const [tHome, featuredParksLabels] = await Promise.all([
    getTranslations('home'),
    getFeaturedParksLabels(),
  ]);
  const heroImage = pickHeroImage(HERO_TTL_MS);
  const randomHeroImage = heroImage?.src;
  const heroMeta = heroImage?.meta ?? null;
  // The newest news post for the chip in the hero's badge row, out of the same news menu the
  // header draws its chip from. The manifest, read synchronously, so the chip is in the static
  // shell and in the fallback alike.
  const latestNews = latestNewsFrom(getNewsMenu(locale as Locale));

  return (
    <RouteMessages route="/">
      <div className="flex flex-col">
        {/* z-10, not `isolate`, which stacked the section below later siblings: the search
          dropdown floats out of this section over the content beneath it. The sticky header is
          z-50, so it still wins. */}
        {/* Below `md` the plate sits 12 px under the header and 12 px from the screen's edges: the
          room goes to the search list (docs/features/homepage-hero.md). */}
        {/* `lg:pb-24` keeps the photo's caption, bottom-left (`HeroImageInfoPanel`), clear of the
          plate. */}
        {/* `suppressHydrationWarning` covers `className`: HeroEntranceGate's inline script
          removes `hero-entering`, so on a slow load React hydrates against a class list the
          script already edited. React reads the flag one level deep, so a mismatch inside the
          hero still reports. */}
        <section
          id={HOME_HERO_ID}
          suppressHydrationWarning
          className="hero-entering relative z-10 -mt-12 overflow-visible px-3 pt-15 pb-8 md:px-6 md:pt-24 md:pb-10 lg:flex lg:min-h-dvh lg:flex-col lg:justify-center lg:pt-20 lg:pb-24"
        >
          <HeroRotationProvider>
            <HeroBackground
              imageSrc={randomHeroImage}
              blurDataURL={heroBlurDataUrl(randomHeroImage)}
              alt={getMediaAltBySrc(randomHeroImage, locale) ?? undefined}
            />
            {/* Closes the entrance window, so content that streams in later does not replay it
              (see HeroEntranceGate). Outside the plate on purpose: a child there would shift the
              content stagger's nth-child by one. */}
            <HeroEntranceGate />
            {/* No legibility scrim: a scrim would give the two panels different backdrops to
              blur, and the plate's own blur does the legibility work. */}
            {/* Tailwind's `container` tiers, asked of `@container/page` instead of the window,
              which an open planner makes wider than the page. Same five tiers, so nothing moves
              with the panel shut. `z-10` lifts the open search list over the image attribution
              drawn on the photo below it. */}
            <div className="relative z-10 mx-auto w-full @min-[640px]/page:max-w-[640px] @min-[768px]/page:max-w-[768px] @min-[1024px]/page:max-w-[1024px] @min-[1280px]/page:max-w-[1280px] @min-[1536px]/page:max-w-[1536px]">
              {/* grid-cols-1, not a bare `grid`: an implicit column is sized to its content's
                max-content width, and a truncated row or chip inside is as wide as its whole
                text. Tailwind's grid-cols-1 is `minmax(0, 1fr)`, which caps it at the container
                instead — without it the whole hero overflowed the viewport. */}
              {/* The two-column split asks the page, not the window, so an open planner does not
                leave the map its full column and the text a sliver. */}
              <div className="grid grid-cols-1 items-start gap-10 @min-[1280px]/page:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] @min-[1536px]/page:grid-cols-[minmax(0,1fr)_minmax(0,40rem)] @min-[1536px]/page:gap-14">
                <HeroTextPanel className="hero-in-stagger">
                  <Suspense
                    fallback={
                      <HeroWithNearby initialCounts={null} latestNews={latestNews} isFallback />
                    }
                  >
                    <HeroStats latestNews={latestNews} />
                  </Suspense>
                  <HeroInlineSearch
                    placeholder={tHome('hero.searchExamples')}
                    label={tHome('hero.searchPlaceholder')}
                    reading={getHeroReading(locale as Locale, latestNews)}
                    className="mt-5"
                  />
                </HeroTextPanel>

                {/* The world-map panel, only where the page's box has room. Pushed down while the
                  text column is pulled up, so the search dropdown, open at rest in the left
                  column, has room. */}
                <div className="hero-in-late hidden @min-[1280px]/page:mt-24 @min-[1280px]/page:block @min-[1536px]/page:mt-28">
                  <Suspense fallback={<HeroWorldPanelSkeleton />}>
                    <HeroWorldPanel />
                  </Suspense>
                </div>
              </div>
            </div>

            {/* Hero image attribution: the current image's park / city / country. */}
            {heroMeta && (
              <HeroImageInfoSwitch>
                <HeroImageInfo meta={heroMeta} src={randomHeroImage} />
              </HeroImageInfoSwitch>
            )}
          </HeroRotationProvider>
        </section>

        {/* Standing in a park: the headliners on a compass ring, straight under the hero that says
          which park it is. Client-only and absent for everybody else — see ParkCompassSlot. */}
        <ParkCompassSlot />

        <div className="pk-reveal">
          <AnnounceSection locale={locale} />
        </div>

        <LocationBanner />

        {/* What is new comes first: the hero already lists the parks near the visitor, and the
          news is what changes from one visit to the next. */}
        <HomeReading locale={locale as Locale} />

        <HomeTour locale={locale as Locale} />

        {/* The visitor's own parks: the nearest ones with the rides where a wait is short right
          now, and their favourites, which stand first for a visitor who has some (`order` from
          `.home-favorites`). Client Components that decide late (geolocation, a cookie), hence the
          dynamic imports and the box-reserving fallbacks. */}
        <div className="flex flex-col">
          <NearbyChapter>
            <NearbyParksCard nested showShortWaits />
          </NearbyChapter>
          <FavoritesSection heading="tile" className={FAVORITES_BAND} />
        </div>

        {/* Popular parks per locale: the cards (SSR seed + client live data), then a link to each
          one's waits and calendar, which the fallback draws as well, since it needs no API. */}
        <Suspense
          fallback={
            <FeaturedParksSkeleton
              labels={featuredParksLabels}
              heading="tile"
              className={`border-border border-t ${STORY_SECTION_Y}`}
            >
              <PopularParkLinks locale={locale as Locale} />
            </FeaturedParksSkeleton>
          }
        >
          <FeaturedParksSlot
            locale={locale}
            heading="tile"
            className={`border-border border-t ${STORY_SECTION_Y}`}
          >
            <PopularParkLinks locale={locale as Locale} />
          </FeaturedParksSlot>
        </Suspense>

        {/* The page's only FAQPage markup — FaqSection renders the questions and the JSON-LD from
          one array. */}
        <FaqSection />
      </div>
    </RouteMessages>
  );
}
