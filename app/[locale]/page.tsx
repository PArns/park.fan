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

import { HeroBackground } from '@/components/layout/hero-background';
import { HeroImageInfoSwitch } from '@/components/layout/hero-image-info-switch';
import { HeroImageInfo } from '@/components/layout/hero-image-info';
import { HeroRotationProvider } from '@/components/layout/hero-rotation-context';
import { HeadKicker } from '@/components/common/head-kicker';
import { HeroInlineSearch } from '@/components/search/hero-inline-search';
import { HeroEntranceGate } from '@/components/home/hero-entrance-gate';
import { HeroPopularParks } from '@/components/home/hero-popular-parks';
import { HeroParky } from '@/components/home/hero-parky';
import { ParkCompassSlot } from '@/components/home/park-compass-slot';
import { AnnounceSection } from '@/components/home/announce-section';
import { NearbyChapter } from '@/components/home/nearby-chapter';
import { HomeReading } from '@/components/home/home-reading';
import { HomeTools } from '@/components/home/home-tools';
import { FeaturedParksSlot } from '@/components/home/featured-parks-slot';
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

// A static shell per locale, served from the CDN. The live parts (nearby parks, favourites, the
// popular parks' status) are client queries that overlay the shell on mount, so its age is
// invisible to a reader with JavaScript. The route's window is the lowest fetch revalidate in its
// render, `getGeoStructure` under `FeaturedParksSlot` (`CACHE_TTL.geo`, a week); read
// `initialRevalidateSeconds` in `.next/prerender-manifest.json` after touching a fetch here. See
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

  const [tHome, tLanding, featuredParksLabels] = await Promise.all([
    getTranslations('home'),
    getTranslations('landing'),
    getFeaturedParksLabels(),
  ]);
  const heroImage = pickHeroImage(HERO_TTL_MS);
  const randomHeroImage = heroImage?.src;
  const heroMeta = heroImage?.meta ?? null;

  return (
    <RouteMessages route="/">
      <div className="flex flex-col">
        {/* z-10, not `isolate`, which stacked the section below later siblings: the search
          dropdown floats out of this section over the content beneath it. The sticky header is
          z-50, so it still wins. `suppressHydrationWarning` covers `className`: HeroEntranceGate's
          inline script removes `hero-entering`, so on a slow load React hydrates against a class
          list the script already edited. */}
        <section
          id={HOME_HERO_ID}
          suppressHydrationWarning
          className="hero-entering relative z-10 -mt-12 overflow-visible px-4 pt-28 pb-14 md:px-6 md:pt-32 md:pb-20 lg:flex lg:min-h-[78dvh] lg:flex-col lg:justify-center"
        >
          <HeroRotationProvider>
            <HeroBackground
              imageSrc={randomHeroImage}
              blurDataURL={heroBlurDataUrl(randomHeroImage)}
              alt={getMediaAltBySrc(randomHeroImage, locale) ?? undefined}
            />
            {/* The text stands on the photo, as on the landing pages' heads: a theme-aware tint
              that fades into the page carries the contrast, instead of a glass plate that would
              re-filter the moving photo every frame (docs/features/homepage-hero.md). */}
            <div
              aria-hidden="true"
              className="from-background via-background/70 to-background/20 pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t"
            />
            <div
              aria-hidden="true"
              className="from-background/60 pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r to-transparent"
            />
            {/* Closes the entrance window, so content that streams in later does not replay it
              (see HeroEntranceGate). Outside the stagger on purpose: a child there would shift its
              nth-child by one. */}
            <HeroEntranceGate />
            {/* Tailwind's `container` tiers, asked of `@container/page` instead of the window,
              which an open planner makes wider than the page. `z-10` lifts the open search list
              over the image attribution drawn on the photo below it. */}
            <div className="relative z-10 mx-auto w-full @min-[640px]/page:max-w-[640px] @min-[768px]/page:max-w-[768px] @min-[1024px]/page:max-w-[1024px] @min-[1280px]/page:max-w-[1280px] @min-[1536px]/page:max-w-[1536px]">
              {/* grid-cols-1, not a bare `grid`: an implicit column is sized to its content's
                max-content width, and a truncated chip inside is as wide as its whole text. The
                second column is reserved for Parky from 1024 px, so its late arrival moves
                nothing. */}
              <div className="grid grid-cols-1 items-center gap-10 @min-[1024px]/page:grid-cols-[minmax(0,1fr)_17rem] @min-[1280px]/page:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="hero-in-stagger max-w-2xl min-w-0">
                  <HeadKicker>{tHome('hero.kicker')}</HeadKicker>
                  <h1 className="text-4xl font-black tracking-tight text-balance sm:text-6xl">
                    {tHome('hero.title')}
                  </h1>
                  <p className="text-foreground/85 mt-5 max-w-xl text-lg leading-relaxed sm:text-xl">
                    {tHome('hero.lead')}
                  </p>
                  <HeroInlineSearch
                    placeholder={tHome('hero.searchExamples')}
                    label={tHome('hero.searchPlaceholder')}
                    className="mt-7 max-w-xl"
                  />
                  <HeroPopularParks locale={locale} className="mt-4" />
                </div>
                <div className="hidden @min-[1024px]/page:block">
                  <HeroParky prompt={tHome('hero.parkyPrompt')} action={tLanding('parky.action')} />
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

        <HomeReading locale={locale as Locale} />

        <HomeTools locale={locale as Locale} />

        {/* Popular parks per locale: direct park links in the first HTML (SSR seed + client live
          data). */}
        <Suspense
          fallback={
            <FeaturedParksSkeleton
              labels={featuredParksLabels}
              heading="tile"
              className={`border-border border-t ${STORY_SECTION_Y}`}
            />
          }
        >
          <FeaturedParksSlot
            locale={locale}
            heading="tile"
            className={`border-border border-t ${STORY_SECTION_Y}`}
          />
        </Suspense>

        {/* The page's only FAQPage markup — FaqSection renders the questions and the JSON-LD from
          one array. */}
        <FaqSection />
      </div>
    </RouteMessages>
  );
}
