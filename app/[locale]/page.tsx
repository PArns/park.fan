import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternateLanguages, SITE_URL } from '@/i18n/config';
import { buildOpenGraphMetadata } from '@/lib/utils/metadata';
import type { Locale } from '@/i18n/config';

import nextDynamic from 'next/dynamic';
import { HeroBackground } from '@/components/layout/hero-background';
import { PreferredSourcePrompt } from '@/components/common/preferred-source-prompt';
import { NearbyParksCardSkeleton } from '@/components/parks/nearby-parks-card-skeleton';
import { FavoritesEmptyState } from '@/components/parks/favorites-empty-state';
import { STORY_SECTION_Y } from '@/components/home/story/section-chrome';

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
    loading: () => <FavoritesEmptyState textHidden heading="tile" className={STORY_SECTION_Y} />,
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
import { AnnounceSection } from '@/components/home/announce-section';
import { HeroImageInfoSwitch } from '@/components/layout/hero-image-info-switch';
import { HeroImageInfo } from '@/components/layout/hero-image-info';
import { HeroRotationProvider } from '@/components/layout/hero-rotation-context';
import { HeroWithNearby } from '@/components/home/hero-with-nearby';
import { ParkCompassSlot } from '@/components/home/park-compass-slot';
import { HeroStats } from '@/components/home/hero-stats';
import { HeroInlineSearch } from '@/components/search/hero-inline-search';
import { HeroNearbyBubbles } from '@/components/home/hero-nearby-bubbles';
import { HeroWorldPanel } from '@/components/home/hero-world-panel';
import { HeroWorldPanelSkeleton } from '@/components/home/hero-skeletons';
import { HeroTextPanel } from '@/components/home/hero-text-panel';
import { HeroParkfan95Pill } from '@/components/home/hero-parkfan95-pill';
import { HeroEntranceGate } from '@/components/home/hero-entrance-gate';
import { FeaturedParksSlot } from '@/components/home/featured-parks-slot';
import { GlobalStatsSection } from '@/components/home/global-stats-section';
import { LiveActivitySection } from '@/components/home/live-activity-section';
import {
  GlobalStatsSkeleton,
  FeaturedParksSkeleton,
  LiveActivitySkeleton,
} from '@/components/home/home-skeletons';
import {
  getFeaturedParksLabels,
  getSectionHeadingLabels,
} from '@/components/home/section-headings';

// The homepage story, chapter by chapter. Every one is a Server Component whose copy is read
// server-side, so it never reaches the client bundle. See
// docs/rules/translations-are-routed-not-bundled.md.
import { BlogTeaserBand } from '@/components/home/story/blog-teaser-band';
import { ThreeSteps } from '@/components/home/story/three-steps';
import { NearbyChapter } from '@/components/home/story/nearby-chapter';
import { ChapterLiveWaits } from '@/components/home/story/chapter-live-waits';
import { ChapterAI } from '@/components/home/story/chapter-ai';
import { ChapterCalendar } from '@/components/home/story/chapter-calendar';
import { ChapterBestTime } from '@/components/home/story/chapter-best-time';
import { ChapterFamilies } from '@/components/home/story/chapter-families';
import { ChapterShowsRestaurants } from '@/components/home/story/chapter-shows-restaurants';
import { ChapterInPark } from '@/components/home/story/chapter-in-park';
import { ChapterDictionary } from '@/components/home/story/chapter-dictionary';
import { WhyParkFan } from '@/components/home/story/why-park-fan';
import { FounderSection } from '@/components/home/story/founder-section';
import { LatestBlogSection } from '@/components/home/latest-blog-section';
import { FaqSection } from '@/components/home/story/faq-section';
import { BlogChapter } from '@/components/home/story/blog-chapter';

import { getOgImageUrl } from '@/lib/utils/og-image';
import { pickHeroImage } from '@/lib/media/hero';
import { heroBlurDataUrl } from '@/lib/media/hero-lqip';
import { getMediaAltBySrc } from '@/lib/media/text';
import { HERO_3D_ENABLED } from '@/lib/config/features';

import type { Metadata } from 'next';
import { assertServableRoute, isServableRoute } from '@/lib/utils/route-guards';
import { RouteMessages } from '@/i18n/route-messages';
import { blogFeedAlternates } from '@/lib/blog/feed';
import { getNewsMenu } from '@/lib/navigation/news-menu';
import { latestNewsFrom } from '@/components/blog/latest-news-chip';

// A static shell per locale, served from the CDN. Every live figure on the page is a seed that a
// client query overlays on mount (`useGlobalStats`, `useGeoLiveStats`, polling every 5 minutes),
// so the shell's age is invisible to a reader with JavaScript, and regenerating it weekly saves
// ISR writes without losing anything a reader sees.
//
// Every `fetch` in this route's render must use `revalidate ≥ 604800`: the route's effective
// window is the lowest fetch revalidate in it. Verify with `next build` after touching section
// fetches. See docs/rules/a-revalidate-at-a-call-site-is-somebody-elses-page.md.
export const revalidate = 604800;

// The classic hero photo: a deterministic pick per 5-minute window, identical for concurrent
// requests and re-picked on each shell regeneration. Server-rendered for LCP; the 3D hero
// ignores it.
const HERO_TTL_MS = 5 * 60_000;

// On a phone the story chapters trade places with the park lists a returning visitor comes for:
// everything wrapped in this class is drawn after the unwrapped sections below a 768 px page,
// and from 768 px up the source order holds. `order` moves the box, not the DOM, so a screen
// reader and a crawler still read the story where it stands. The tinted band alternation follows
// the source order and is broken on a phone.
const PHONE_LATER = '@max-[768px]/page:order-1';

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

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  assertServableRoute(locale);
  setRequestLocale(locale);

  // Only the static, above-the-fold shell needs translations up front. Every
  // data-dependent section fetches its own data (and translations) inside a
  // Suspense boundary below, so the hero renders/streams without waiting on the API.
  const tHome = await getTranslations('home');
  // Resolved once, here, because the two streamed sections and their fallbacks
  // must mount the SAME heading node — and a fallback that awaits anything
  // suspends, so the skeleton cannot look these up itself.
  const [headingLabels, featuredParksLabels] = await Promise.all([
    getSectionHeadingLabels(),
    getFeaturedParksLabels(),
  ]);
  const heroImage = pickHeroImage(HERO_TTL_MS);
  const randomHeroImage = heroImage?.src;
  const heroMeta = heroImage?.meta ?? null;
  // The newest news post for the chip beside the hero's open-parks badge, out of the same news
  // menu the header draws its chip from. The manifest, read synchronously, so the chip is in the
  // static shell and in the fallback alike.
  const latestNews = latestNewsFrom(getNewsMenu(locale as Locale));

  return (
    <RouteMessages route="/">
      <div className="flex flex-col">
        {/* z-10, not `isolate`, which stacked the section below later siblings: the search
          dropdown floats out of this section over the content beneath it. The sticky header is
          z-50, so it still wins. */}
        {/* `suppressHydrationWarning` covers `className`: HeroEntranceGate's inline script
          removes `hero-entering`, so on a slow load React hydrates against a class list the
          script already edited. React reads the flag one level deep, so a mismatch inside the
          hero still reports. */}
        <section
          suppressHydrationWarning
          className="hero-entering relative z-10 -mt-12 overflow-visible px-6 pt-24 pb-8 md:pb-10 lg:flex lg:min-h-dvh lg:flex-col lg:justify-center lg:pt-20 lg:pb-12"
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
              with the panel shut. */}
            <div className="relative mx-auto w-full @min-[640px]/page:max-w-[640px] @min-[768px]/page:max-w-[768px] @min-[1024px]/page:max-w-[1024px] @min-[1280px]/page:max-w-[1280px] @min-[1536px]/page:max-w-[1536px]">
              {/* grid-cols-1, not a bare `grid`: an implicit column is sized to its content's
                max-content width, and the horizontally scrollable pill row inside is wider than
                a phone. Tailwind's grid-cols-1 is `minmax(0, 1fr)`, which caps it at the
                container instead — without it the whole hero overflowed the viewport. */}
              {/* The two-column split asks the page, not the window, so an open planner does not
                leave the map its full column and the text a sliver. */}
              <div className="grid grid-cols-1 items-start gap-10 @min-[1280px]/page:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] @min-[1536px]/page:grid-cols-[minmax(0,1fr)_minmax(0,40rem)] @min-[1536px]/page:gap-14">
                <HeroTextPanel className="hero-in-stagger">
                  <Suspense
                    fallback={<HeroWithNearby initialCounts={null} latestNews={latestNews} />}
                  >
                    <HeroStats latestNews={latestNews} />
                  </Suspense>
                  <HeroInlineSearch
                    placeholder={tHome('hero.searchExamples')}
                    label={tHome('hero.searchPlaceholder')}
                    className="peer/hero-search mt-5"
                  />
                  {/* GeoIP fallback without location permission. mt-8 matches the plate's own
                    padding. While the search holds focus its dropdown covers the pills and they
                    fade out, since their text would ghost through the glass. `peer-focus-within`
                    because the two are siblings. See
                    docs/rules/no-has-selector-in-the-stylesheet.md. */}
                  <HeroNearbyBubbles className="mt-8 peer-focus-within/hero-search:pointer-events-none peer-focus-within/hero-search:opacity-0" />
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

            {/* park.fan outranks Parkfan95 for his own name, so part of the German traffic here
              was looking for Silas; German only, and the copy lives in the component. Drawn on
              the photo, on the image attribution's baseline where there is room
              (`hero-bottom-line` in app/globals.css holds the measured width and height).
              Elsewhere it stays in flow at the foot of the hero, and `lg:mb-20` reserves the band
              the caption occupies below it. */}
            {locale === 'de' && (
              <div className="hero-bottom-line:absolute hero-bottom-line:inset-x-4 hero-bottom-line:bottom-6 hero-bottom-line:mt-0 hero-bottom-line:mb-0 mt-10 flex justify-center lg:mb-20">
                <HeroParkfan95Pill />
              </div>
            )}

            {/* Hero image attribution. The 3-D hero shows no caption (only the in-park photos that
              replace it do, via the switch); the classic photo hero captions the current image's
              park / city / country. */}
            {HERO_3D_ENABLED ? (
              <HeroImageInfoSwitch>{null}</HeroImageInfoSwitch>
            ) : (
              heroMeta && (
                <HeroImageInfoSwitch>
                  <HeroImageInfo meta={heroMeta} />
                </HeroImageInfoSwitch>
              )
            )}
          </HeroRotationProvider>
        </section>

        {/* Standing in a park: the headliners on a compass ring, straight under the hero that says
          which park it is. Client-only and absent for everybody else — see ParkCompassSlot. */}
        <ParkCompassSlot />

        {/* The newest post, the first thing under the fold: the only spot on this page that
          reaches a reader who has not decided to scroll yet. Inline, not behind a boundary: its
          data is the synchronous manifest. */}
        <BlogTeaserBand locale={locale as Locale} />

        <div className="pk-reveal">
          <AnnounceSection locale={locale} />
        </div>

        <LocationBanner />

        {/* The story: a first visitor does not know what this site is, so the page answers that
          before it shows anything to operate. Three steps, a chapter per thing park.fan does in
          the order a stranger needs them, why it is built this way, the proof, the person.
          Tinted and untinted bands alternate, except where `FavoritesSection`, a shared band,
          meets the tinted live-wait chapter, whose `border-t` carries the boundary. */}
        <div className={PHONE_LATER}>
          <ThreeSteps />
        </div>

        {/* Step 1, made real: the visitor's own nearest parks, then their favourites, Client
          Components that decide late (geolocation, a cookie), hence the dynamic imports and the
          box-reserving fallbacks. The shared bands get the story's padding (`STORY_SECTION_Y`),
          so every band edge in the block has the same gap. */}
        <NearbyChapter>
          <NearbyParksCard nested />
        </NearbyChapter>
        <FavoritesSection heading="tile" className={STORY_SECTION_Y} />

        {/* From here to the FAQ, everything is drawn after the parks on a phone — see
          PHONE_LATER. The wrappers are plain boxes in this flex column; the sections inside
          stay the top-level sections they were. */}
        <div className={PHONE_LATER}>
          <ChapterLiveWaits locale={locale} />
          <ChapterAI />
          <ChapterCalendar locale={locale} />
          <ChapterBestTime locale={locale} />
          <ChapterFamilies locale={locale} />
          <ChapterShowsRestaurants />
          <ChapterInPark />
          <ChapterDictionary locale={locale as Locale} />

          {/* The blog again, and deliberately not the same shape as the band under
            the hero: that one is three cards for a desktop reader passing by, this
            one is the lead post with four beside it for somebody who read this far.
            The frame adds the two evergreen hubs (best travel time, dictionary). */}
          <BlogChapter locale={locale as Locale}>
            <LatestBlogSection locale={locale as Locale} variant="lead" />
          </BlogChapter>

          {/* The claim, then the evidence: `GlobalStatsSection` is the platform's own live
            counters, so it sits directly under the six reasons. */}
          <WhyParkFan locale={locale as Locale} />
          <Suspense fallback={<GlobalStatsSkeleton labels={headingLabels} />}>
            <GlobalStatsSection />
          </Suspense>

          <FounderSection locale={locale as Locale} />
        </div>

        {/* Featured Parks – locale-aware, direct park links for SEO (SSR seed + client live data) */}
        <Suspense
          fallback={
            <FeaturedParksSkeleton
              labels={featuredParksLabels}
              heading="tile"
              className={STORY_SECTION_Y}
            />
          }
        >
          <FeaturedParksSlot locale={locale} heading="tile" className={STORY_SECTION_Y} />
        </Suspense>

        {/* No pk-reveal: its cards are GlassCards, and the reveal's transform would flatten
          their backdrop for the length of the entry range. */}
        <Suspense fallback={<LiveActivitySkeleton labels={headingLabels} />}>
          <LiveActivitySection />
        </Suspense>

        {/* The page's only FAQPage markup — FaqSection renders the questions and
          the JSON-LD from one array. */}
        <div className={PHONE_LATER}>
          <FaqSection />
        </div>

        {/* "Make park.fan your preferred Google source", at the end, once the visitor has seen
          what the site offers; the footer keeps the persistent link. `pt-8`, or the gap to the
          neighbour would be only its bottom padding. */}
        <section className={`px-4 pt-8 pb-16 ${PHONE_LATER}`}>
          <div className="container mx-auto">
            <PreferredSourcePrompt />
          </div>
        </section>
      </div>
    </RouteMessages>
  );
}
