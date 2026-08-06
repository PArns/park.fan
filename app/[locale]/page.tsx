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

const LocationBanner = nextDynamic(
  () => import('@/components/common/location-banner').then((m) => ({ default: m.LocationBanner })),
  { loading: () => null, ssr: true }
);

const FavoritesSection = nextDynamic(
  () =>
    import('@/components/parks/favorites-section').then((m) => ({ default: m.FavoritesSection })),
  { loading: () => null, ssr: true }
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

import { getOgImageUrl } from '@/lib/utils/og-image';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { pickHeroImage } from '@/lib/media/hero';
import { HERO_3D_ENABLED } from '@/lib/config/features';

import type { Metadata } from 'next';
import { assertServableRoute, isServableRoute } from '@/lib/utils/route-guards';

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
    <div className="flex flex-col">
      <HomepageFAQStructuredData />
      {/* Hero Section – live-numbers headline + in-place search on the left, world-map panel on
          the right (xl+ only), nearby-park bubbles below. When the user is in a park (nearby),
          the headline switches to "Willkommen im [Park]" + park info. */}
      <section className="relative isolate -mt-14 overflow-hidden px-6 pt-24 pb-8 md:pb-10 lg:flex lg:min-h-dvh lg:flex-col lg:justify-center lg:pt-20 lg:pb-12">
        <HeroRotationProvider>
          <HeroBackground imageSrc={randomHeroImage} />
          {/* Legibility scrim. The headline and intro now sit directly on the photo (no glass
              card behind them), and the hero photo rotates — a bright ride shot would otherwise
              swallow the text. Anchored left so the photo still reads on the right. */}
          <div
            aria-hidden="true"
            className="from-background/85 via-background/45 pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r to-transparent"
          />
          <div className="relative container mx-auto">
            <div className="grid items-center gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,40rem)] 2xl:gap-14">
              {/* Left: live badge + headline + intro with live counts + in-place search +
                  the nearby-park bubbles */}
              <div className="w-full max-w-2xl">
                <Suspense fallback={<HeroWithNearby initialCounts={null} />}>
                  <HeroStats />
                </Suspense>
                <HeroInlineSearch placeholder={tHome('hero.searchExamples')} className="mt-5" />
                {/* Nearby parks as pill bubbles (GeoIP fallback without location permission) */}
                <HeroNearbyBubbles className="mt-4" />
              </div>

              {/* Right: world-map panel — only rendered when there is room (xl+); the fixed
                  min-height keeps the vertical centering stable while the panel lazy-mounts. */}
              <div className="hidden xl:block xl:min-h-[540px]">
                <Suspense fallback={null}>
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

      {/* Announcement Section */}
      <AnnounceSection locale={locale} />

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

      {/* ML / AI Stats */}
      <Suspense fallback={<MLStatsSkeleton />}>
        <MLStatsSection linkToFancast />
      </Suspense>

      {/* Live Activity - Parks Open Now */}
      <Suspense fallback={<LiveActivitySkeleton />}>
        <LiveActivitySection />
      </Suspense>

      {/* Features Section */}
      <section className="bg-muted/30 px-4 py-16">
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
  );
}
