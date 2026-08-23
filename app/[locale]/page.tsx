import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternateLanguages, SITE_URL } from '@/i18n/config';
import { buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';
import { Clock, TrendingUp, Map as MapIcon, BookOpen, Sparkles } from 'lucide-react';

import nextDynamic from 'next/dynamic';
import { HeroBackground } from '@/components/layout/hero-background';
import { HomepageFAQStructuredData } from '@/components/seo/homepage-faq-structured-data';
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
import { HottestParksSection } from '@/components/home/hottest-parks-section';
import { MLStatsSection } from '@/components/home/ml-stats-section';
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
import { HeroEntranceGate } from '@/components/home/hero-entrance-gate';
import { FeaturedParksSlot } from '@/components/home/featured-parks-slot';
import { GlobalStatsSection } from '@/components/home/global-stats-section';
import { LiveActivitySection } from '@/components/home/live-activity-section';
import {
  GlobalStatsSkeleton,
  FeaturedParksSkeleton,
  MLStatsSkeleton,
  LiveActivitySkeleton,
} from '@/components/home/home-skeletons';
import { LatestBlogSection } from '@/components/home/latest-blog-section';
import { BlogHeroPreview } from '@/components/home/blog-hero-preview';

import { getOgImageUrl } from '@/lib/utils/og-image';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { pickHeroImage } from '@/lib/media/hero';
import { heroBlurDataUrl } from '@/lib/media/hero-lqip';
import { getMediaAltBySrc } from '@/lib/media/text';
import { HERO_3D_ENABLED } from '@/lib/config/features';

import type { Metadata } from 'next';
import { assertServableRoute, isServableRoute } from '@/lib/utils/route-guards';
import { RouteMessages } from '@/i18n/route-messages';

// STATIC SHELL (per-locale build-time prerender — the homepage is only 6 pages, NOT the park/
// attraction catalog). The shell is served straight from the CDN (fast TTFB → fast LCP, bf-cache
// eligible). Every live value (nearby, favorites, ticker, open-park counts, global stats,
// featured-card statuses) is refreshed CLIENT-side via React Query on top of the baked SSR seed —
// the same shell+overlay model as the park/hub pages — so the shell's age is invisible to a JS
// visitor. No `force-dynamic`: a per-request server render here was the page's biggest cost
// (the `/` → `/{locale}` redirect + dynamic TTFB landing before LCP).

// Regenerate HOURLY. Vercel bills every shell regeneration as size-weighted ISR writes (~600 KB
// HTML+RSC ≈ ~75 write units per locale), so the 5-min window this shipped with cost ~50k write
// units/day across 6 locales — the dominant ISR-write driver of Jun 2026. Nothing user-visible
// depends on the shell being younger than an hour (live data is client-refreshed, see above).
// IMPORTANT: every `fetch` in this route's render must use `revalidate ≥ 3600` — the route's
// effective ISR window is the LOWEST fetch revalidate in it (a single 300s fetch pins the whole
// page back to 5 min). Verify with `next build` (revalidate column) after touching section fetches.
export const revalidate = 3600;

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
  const heroImage = pickHeroImage(HERO_TTL_MS);
  const randomHeroImage = heroImage?.src;
  const heroMeta = heroImage?.meta ?? null;

  return (
    <RouteMessages route="/">
      <div className="flex flex-col">
        <HomepageFAQStructuredData />
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

        {/* "From the blog" strip — the first thing under the hero, across the full container
          width. The full LatestBlogSection still renders further down the page. */}
        <section className="px-6 pt-8">
          <div className="container mx-auto">
            <BlogHeroPreview locale={locale as Locale} />
          </div>
        </section>

        {/* Announcement Section */}
        <div className="pk-reveal">
          <AnnounceSection locale={locale} />
        </div>

        {/* Hottest parks heat banner — only renders during a real heat wave (≥ 35 °C in DE/FR/IT/NL/BE);
          fallback is null because the section is absent most of the year (no skeleton flash). */}
        <Suspense fallback={null}>
          <HottestParksSection locale={locale} />
        </Suspense>

        {/* Location banner: not for snippet/indexing (data-nosnippet); show when user has not granted location */}
        <LocationBanner />

        {/* Nearby / In-Park – primary focus: nearest open park or quick park navigation when in park.
          No top padding so the (full-bleed) in-park banner sits flush under the hero. */}
        <section className="px-4 pb-8">
          <div className="container mx-auto">
            <NearbyParksCard />
          </div>
        </section>

        {/* Favorites Section */}
        <FavoritesSection />

        {/* Latest Blog Posts */}
        <LatestBlogSection locale={locale as Locale} />

        {/* Featured Parks – locale-aware, direct park links for SEO (SSR seed + client live data) */}
        <Suspense fallback={<FeaturedParksSkeleton />}>
          <FeaturedParksSlot locale={locale} />
        </Suspense>

        {/* Global Stats + Platform Statistics (single getGlobalStats fetch) */}
        <Suspense fallback={<GlobalStatsSkeleton />}>
          <GlobalStatsSection />
        </Suspense>

        {/* ML / AI Stats — no pk-reveal: its cards are GlassCards, and the reveal's transform
          would flatten their backdrop for the length of the entry range. */}
        <Suspense fallback={<MLStatsSkeleton />}>
          <MLStatsSection linkToFancast />
        </Suspense>

        {/* Live Activity - Parks Open Now — no pk-reveal, same reason as ML stats above. */}
        <Suspense fallback={<LiveActivitySkeleton />}>
          <LiveActivitySection />
        </Suspense>

        {/* Features Section */}
        <section className="pk-reveal bg-muted/30 px-4 py-16">
          <div className="container mx-auto">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="text-primary h-5 w-5" />
              <h2 className="text-xl font-bold">
                <GlossaryInject>{tHome('sections.plan')}</GlossaryInject>
              </h2>
            </div>
            <p className="text-muted-foreground mb-12 text-sm leading-relaxed">
              <GlossaryInject>{tHome('sections.featuresIntro')}</GlossaryInject>
            </p>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="bg-crowd-very-low/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                  <Clock className="text-crowd-very-low h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  <GlossaryInject>{tHome('features.realtime.title')}</GlossaryInject>
                </h3>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{tHome('features.realtime.description')}</GlossaryInject>
                </p>
              </div>
              <div className="text-center">
                <div className="bg-park-primary/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                  <TrendingUp className="text-park-primary h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  <GlossaryInject>{tHome('features.ml.title')}</GlossaryInject>
                </h3>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{tHome('features.ml.description')}</GlossaryInject>
                </p>
              </div>
              <div className="text-center">
                <div className="bg-crowd-moderate/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                  <MapIcon className="text-crowd-moderate h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  <GlossaryInject>{tHome('features.calendar.title')}</GlossaryInject>
                </h3>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{tHome('features.calendar.description')}</GlossaryInject>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About Section – editorial content for SEO word count */}
        <section className="px-4 py-16">
          <div className="container mx-auto">
            <div className="mb-6 flex items-center gap-2">
              <BookOpen className="text-primary h-5 w-5" />
              <h2 className="text-xl font-bold">{tHome('about.title')}</h2>
            </div>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              <GlossaryInject>{tHome('about.p1')}</GlossaryInject>
            </p>
            <p className="text-muted-foreground mb-10 leading-relaxed">
              <GlossaryInject>{tHome('about.p2')}</GlossaryInject>
            </p>

            <h3 className="mb-4 text-xl font-semibold">{tHome('about.coverageTitle')}</h3>
            <p className="text-muted-foreground mb-10 leading-relaxed">
              <GlossaryInject>{tHome('about.p3')}</GlossaryInject>
            </p>

            <h3 className="mb-4 text-xl font-semibold">{tHome('about.howTitle')}</h3>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              <GlossaryInject>{tHome('about.p4')}</GlossaryInject>
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <GlossaryInject>{tHome('about.p5')}</GlossaryInject>
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/howto"
                prefetch={false}
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                {tHome('about.howtoLink')}
              </Link>
              <Link
                href="/fancast"
                prefetch={false}
                className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                {tHome('about.fancastLink')}
              </Link>
            </div>
          </div>
        </section>

        {/* Soft "make park.fan your preferred Google source" prompt — end of the page,
          once the visitor has seen what the site offers. The footer keeps the
          persistent link; this is the higher-visibility spot. */}
        <section className="px-4 pb-16">
          <div className="container mx-auto">
            <PreferredSourcePrompt />
          </div>
        </section>
      </div>
    </RouteMessages>
  );
}
