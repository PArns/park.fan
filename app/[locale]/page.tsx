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

const LocationBanner = nextDynamic(
  () => import('@/components/common/location-banner').then((m) => ({ default: m.LocationBanner })),
  { loading: () => null, ssr: true }
);

// `loading` is a real Suspense fallback — see the note in page-bottom-sections.tsx. With
// `() => null` the band arrived after the first paint and pushed the page tail down.
const FavoritesSection = nextDynamic(
  () =>
    import('@/components/parks/favorites-section').then((m) => ({ default: m.FavoritesSection })),
  { loading: () => <FavoritesEmptyState textHidden />, ssr: true }
);

const NearbyParksCard = nextDynamic(
  () =>
    import('@/components/parks/nearby-parks-card').then((m) => ({ default: m.NearbyParksCard })),
  {
    loading: () => <NearbyParksCardSkeleton />,
    ssr: true,
  }
);
import { AnnounceSection } from '@/components/home/announce-section';
import { HeroImageInfoSwitch } from '@/components/layout/hero-image-info-switch';
import { HeroImageInfo } from '@/components/layout/hero-image-info';
import { HeroRotationProvider } from '@/components/layout/hero-rotation-context';
import { HeroWithNearby } from '@/components/home/hero-with-nearby';
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
import { getSectionHeadingLabels } from '@/components/home/section-headings';

// The homepage story — "what is park.fan", chapter by chapter. Every one of these
// is a Server Component whose copy is read server-side, so ~2 500 words of German
// explanation never reach the client bundle (see the routed-translations rule).
import { BlogTeaserBand } from '@/components/home/story/blog-teaser-band';
import { ThreeSteps } from '@/components/home/story/three-steps';
import { NearbyChapter } from '@/components/home/story/nearby-chapter';
import { ChapterLiveWaits } from '@/components/home/story/chapter-live-waits';
import { ChapterAI } from '@/components/home/story/chapter-ai';
import { ChapterCalendar } from '@/components/home/story/chapter-calendar';
import { ChapterBestTime } from '@/components/home/story/chapter-best-time';
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

// STATIC SHELL (per-locale build-time prerender — the homepage is only 6 pages, NOT the park/
// attraction catalog). The shell is served straight from the CDN (fast TTFB → fast LCP, bf-cache
// eligible). Every live value (nearby, favorites, ticker, open-park counts, global stats,
// featured-card statuses) is refreshed CLIENT-side via React Query on top of the baked SSR seed —
// the same shell+overlay model as the park/hub pages — so the shell's age is invisible to a JS
// visitor. No `force-dynamic`: a per-request server render here was the page's biggest cost
// (the `/` → `/{locale}` redirect + dynamic TTFB landing before LCP).

// Regenerate WEEKLY. Vercel bills every shell regeneration as size-weighted ISR writes (~600 KB
// HTML+RSC ≈ ~75 write units per locale), so the 5-min window this shipped with cost ~50k write
// units/day across 6 locales — the dominant ISR-write driver of Jun 2026. That went to an hour,
// and an hour was still 144 rebuilds a day for numbers no reader ever sees in the shell.
//
// Every live figure on this page is a SEED that a client query overlays on mount: the headline
// counts through `useGlobalStats`, the continent open-counts through `useGeoLiveStats`, both
// no-store and polling every 5 minutes. The seed exists for first paint and for readers without
// JavaScript, and neither is served better by being an hour old rather than a week.
//
// The one section that had no such overlay was the hottest-parks heat banner, which compared a
// weather reading against a threshold — stale there is wrong rather than merely old, so it held
// the whole page to hourly on its own. It rendered nothing outside a real heat wave, which is
// most of the year, and it is gone; `git log` has it if a summer wants it back with a client
// overlay of its own.
//
// IMPORTANT: every `fetch` in this route's render must use `revalidate ≥ 604800` — the route's
// effective ISR window is the LOWEST fetch revalidate in it (a single 300s fetch pins the whole
// page back to 5 min). Verify with `next build` (revalidate column) after touching section fetches.
export const revalidate = 604800;

// Classic hero image: a deterministic pick keyed to the current 5-min window — identical for all
// concurrent requests, and re-picked on each shell regeneration (so the photo effectively rotates
// with the ISR window, ~hourly). Server-rendered for LCP. Only used when HERO_3D_ENABLED is off;
// the 3D hero ignores it.
const HERO_TTL_MS = 5 * 60_000;

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
      // The homepage is where a reader or a crawler looks for a site's feed
      // first, and it is the one page outside /blog that should answer. Park
      // and glossary pages deliberately do not: the spec wants a page's own
      // main feed, and a park page has none.
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
  const headingLabels = await getSectionHeadingLabels();
  const heroImage = pickHeroImage(HERO_TTL_MS);
  const randomHeroImage = heroImage?.src;
  const heroMeta = heroImage?.meta ?? null;

  return (
    <RouteMessages route="/">
      <div className="flex flex-col">
        {/* Hero Section – live-numbers headline + in-place search on the left, world-map panel on
          the right (xl+ only), nearby-park bubbles below. When the user is in a park (nearby),
          the headline switches to "Willkommen im [Park]" + park info. */}
        {/* z-10 (not isolate — that clipped nothing but stacked the section BELOW later siblings):
          the hero search dropdown floats out of this section over the content beneath it, and
          `overflow-hidden` keeps the background photo in. The sticky header is z-50, so it still
          wins. */}
        <section className="hero-entering relative z-10 -mt-12 overflow-visible px-6 pt-24 pb-8 md:pb-10 lg:flex lg:min-h-dvh lg:flex-col lg:justify-center lg:pt-20 lg:pb-12">
          <HeroRotationProvider>
            <HeroBackground
              imageSrc={randomHeroImage}
              blurDataURL={heroBlurDataUrl(randomHeroImage)}
              alt={getMediaAltBySrc(randomHeroImage, locale) ?? undefined}
            />
            {/* Closes the entrance window, so content that streams in later does not replay it —
              see HeroEntranceGate for what that cost in LCP. Outside the plate on purpose: a
              child there would shift the content stagger's nth-child by one. */}
            <HeroEntranceGate />
            {/* No legibility scrim any more. It existed because the left plate carried no
              backdrop-blur, and it was anchored left so the photo still read on the right —
              which meant the two panels ended up blurring different backdrops: the left a
              dimmed one, the right the raw photo. Same 64 px filter, visibly different glass.
              The plate's own blur now does the legibility work for both. */}
            <div className="relative container mx-auto">
              {/* grid-cols-1, not a bare `grid`: an implicit column is sized to its content's
                max-content width, and the horizontally scrollable pill row inside is wider than
                a phone. Tailwind's grid-cols-1 is `minmax(0, 1fr)`, which caps it at the
                container instead — without it the whole hero overflowed the viewport. */}
              <div className="grid grid-cols-1 items-start gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,40rem)] 2xl:gap-14">
                {/* Left: live badge + headline + intro with live counts + in-place search +
                  the nearby-park bubbles */}
                <HeroTextPanel className="hero-in-stagger">
                  <Suspense fallback={<HeroWithNearby initialCounts={null} />}>
                    <HeroStats />
                  </Suspense>
                  <HeroInlineSearch
                    placeholder={tHome('hero.searchExamples')}
                    label={tHome('hero.searchPlaceholder')}
                    className="mt-5"
                  />
                  {/* Nearby parks as pill bubbles (GeoIP fallback without location permission).
                    mt-8 matches the plate's own padding, so the pills sit the same distance from
                    the open dropdown above them as from the plate's bottom edge below — at mt-4
                    they read as glued to the card's footer. */}
                  <HeroNearbyBubbles className="mt-8" />
                  {/* park.fan outranks Parkfan95 for his own name, so part of the German
                    traffic here was looking for Silas. German only — the confusion is a
                    German-search-market one, and the copy lives in the component for that
                    reason (see HeroParkfan95Pill). */}
                  {locale === 'de' && <HeroParkfan95Pill className="mt-4" />}
                </HeroTextPanel>

                {/* Right: world-map panel — only rendered when there is room (xl+).

                  Pushed DOWN while the text column is pulled up (`items-start` + these offsets):
                  the search field sits in the left column and its dropdown is open at rest, so
                  the two columns are staggered to give that list room instead of centring both
                  against each other. */}
                <div className="hero-in-late hidden xl:mt-24 xl:block 2xl:mt-28">
                  <Suspense fallback={<HeroWorldPanelSkeleton />}>
                    <HeroWorldPanel />
                  </Suspense>
                </div>
              </div>
            </div>

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

        {/* The newest post, in the band the park shortcuts used to hold: the first
          thing under the fold, and the only spot on this page that reaches a
          reader who has not decided to scroll yet. Rendered inline, not behind a
          boundary — its data is the synchronous manifest. */}
        <BlogTeaserBand locale={locale as Locale} />

        {/* Announcement Section */}
        <div className="pk-reveal">
          <AnnounceSection locale={locale} />
        </div>

        {/* Location banner: not for snippet/indexing (data-nosnippet); show when user has not granted location */}
        <LocationBanner />

        {/* ── The story ──────────────────────────────────────────────────────
          A first visitor arrives not knowing what this site is, so the page
          answers that before it shows them anything to operate: three steps,
          then one chapter per thing park.fan does, then why it is built the way
          it is, then the proof, then the person.

          The order inside the chapters is by what a stranger needs, not by what
          was easiest to build: live wait times (the daily use), then the
          forecast (the one thing almost nobody else attempts), then the
          calendar and the day curve that plan a visit around it.

          Tinted and untinted bands alternate the whole way down, with one
          deliberate exception: `FavoritesSection` is a shared band (it renders on
          blog and glossary pages too), so its tint is not this page's to flip,
          and it lands next to the tinted live-wait-times chapter. The chapter's
          own `border-t` carries that boundary — which is what the rule is for. */}
        <ThreeSteps />

        {/* Step 1, made real: the visitor's own nearest parks, then their own
          favourites. Both are Client Components that decide late (geolocation,
          a cookie) — hence the dynamic imports at the top of this file and the
          box-reserving fallbacks. */}
        <NearbyChapter>
          <NearbyParksCard />
        </NearbyChapter>
        <FavoritesSection />

        <ChapterLiveWaits locale={locale} />
        <ChapterAI />
        <ChapterCalendar locale={locale} />
        <ChapterBestTime locale={locale} />
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

        {/* The claim, then the evidence. `GlobalStatsSection` is the platform's
          own live counters, so it belongs directly under the six reasons rather
          than between the founder and the blog, where it used to sit. */}
        <WhyParkFan locale={locale as Locale} />
        <Suspense fallback={<GlobalStatsSkeleton labels={headingLabels} />}>
          <GlobalStatsSection />
        </Suspense>

        <FounderSection locale={locale as Locale} />

        {/* Featured Parks – locale-aware, direct park links for SEO (SSR seed + client live data) */}
        <Suspense fallback={<FeaturedParksSkeleton />}>
          <FeaturedParksSlot locale={locale} />
        </Suspense>

        {/* Live Activity - Parks Open Now — no pk-reveal: its cards are GlassCards, and the
          reveal's transform would flatten their backdrop for the length of the entry range. */}
        <Suspense fallback={<LiveActivitySkeleton labels={headingLabels} />}>
          <LiveActivitySection />
        </Suspense>

        {/* The page's only FAQPage markup — FaqSection renders the questions and
          the JSON-LD from one array. */}
        <FaqSection />

        {/* Soft "make park.fan your preferred Google source" prompt — end of the page,
          once the visitor has seen what the site offers. The footer keeps the
          persistent link; this is the higher-visibility spot. */}
        {/* `pt-8` for the same reason as the band above it: without a top padding
          this card's distance to its neighbour is only the neighbour's bottom
          padding, which made the gap between the two closing cards 27 px tighter
          than the ones around them. */}
        <section className="px-4 pt-8 pb-16">
          <div className="container mx-auto">
            <PreferredSourcePrompt />
          </div>
        </section>
      </div>
    </RouteMessages>
  );
}
