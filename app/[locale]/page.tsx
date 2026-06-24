import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternateLanguages, SITE_URL } from '@/i18n/config';
import { buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { Link } from '@/i18n/navigation';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import type { Locale } from '@/i18n/config';
import { Clock, TrendingUp, Map as MapIcon, BookOpen, Tag, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

import nextDynamic from 'next/dynamic';
import { HeroBackground } from '@/components/layout/hero-background';
import { HomepageFAQStructuredData } from '@/components/seo/homepage-faq-structured-data';
import { GlassCard } from '@/components/common/glass-card';
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
import { MLStatsSection } from '@/components/home/ml-stats-section';
import { HeroImageInfoSwitch } from '@/components/layout/hero-image-info-switch';
import { HeroRotationProvider } from '@/components/layout/hero-rotation-context';
import { HeroWithNearby } from '@/components/home/hero-with-nearby';
import { HeroSearchInput } from '@/components/search/hero-search-input';
import { HeroTicker } from '@/components/home/hero-ticker';
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

import type { Metadata } from 'next';

// STATIC SHELL (per-locale build-time prerender — the homepage is only 6 pages, NOT the park/
// attraction catalog, so there is no "ISR shell-write explosion"). The shell is served straight
// from the CDN (fast TTFB → fast LCP, bf-cache eligible) and revalidated stale-while-revalidate
// from the Data Cache TTLs of the section fetches below; each regeneration also re-picks the
// hero's 5-min window. Every live, per-visitor value (nearby, favorites, featured/stats/ticker
// live status) is loaded CLIENT-side via React Query, so the cached HTML never goes stale where
// it matters. No `force-dynamic`: a per-request server render here was the page's biggest cost
// (the `/` → `/{locale}` redirect + dynamic TTFB landing before LCP).

// Regenerate every 5 minutes — set explicitly (rather than inheriting the lowest section-fetch TTL)
// to keep the SSR'd featured-parks seed reasonably fresh; all truly live data is still client-loaded
// on top. (The hero is now the client-only 3D park scene, so it needs no server-side image pick.)
export const revalidate = 300;

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
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
  setRequestLocale(locale);
  const glossaryPath = '/' + GLOSSARY_SEGMENTS[locale as Locale];

  // Only the static, above-the-fold shell needs translations up front. Every
  // data-dependent section fetches its own data (and translations) inside a
  // Suspense boundary below, so the hero renders/streams without waiting on the API.
  const [tHome, tParks] = await Promise.all([getTranslations('home'), getTranslations('parks')]);

  return (
    <div className="flex flex-col">
      {/* No manual logo preload: the big logo is only a branding mark (a tiny SVG), not the LCP
          element — that's the hero background, which next/image already preloads via `priority`.
          The old preload also only covered the light variant, wasting a request on dark theme.
          Letting the logo load eagerly (it's a small SVG) keeps the preload budget for the hero. */}
      <HomepageFAQStructuredData />
      {/* Hero Section – static default; when user is in a park (nearby), shows "Willkommen im [Park]" + park info */}
      <section className="relative isolate -mt-14 overflow-hidden px-6 pt-14 pb-6 sm:pb-8 md:pt-28 md:pb-10 lg:flex lg:min-h-dvh lg:flex-col lg:justify-center lg:pt-16 lg:pb-12">
        <HeroRotationProvider>
          <HeroBackground />
          <div className="relative container mx-auto">
            <div className="flex flex-col">
              {/* Row 1: Logo left + Title/Description right */}
              <GlassCard className="mx-auto flex w-full max-w-5xl flex-col items-center border-white/20 bg-white/25 px-4 py-4 shadow-2xl sm:py-6 lg:flex-row lg:items-center lg:gap-8 lg:py-8 lg:pr-8 lg:pl-4 dark:border-white/10 dark:bg-black/40">
                {/* Logo – light/dark variant based on theme */}
                <div className="relative hidden h-20 w-20 shrink-0 sm:block sm:h-36 sm:w-36 lg:h-64 lg:w-64">
                  {/* SVGs don't benefit from next/image optimization — use <img> directly */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo-big.svg"
                    alt="park.fan"
                    fetchPriority="high"
                    className="h-full w-full object-contain dark:hidden"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo-big-dark.svg"
                    alt="park.fan"
                    className="hidden h-full w-full object-contain dark:block"
                  />
                </div>
                {/* Title + Description + Search + Links */}
                <div className="w-full min-w-0 text-center lg:max-w-none lg:flex-1">
                  <HeroWithNearby
                    searchPlaceholder={tHome('hero.searchPlaceholder')}
                    hideSearch
                    titleSlot={<GlossaryInject noUnderline>{tParks('title')}</GlossaryInject>}
                    introSlot={<GlossaryInject>{tHome('intro')}</GlossaryInject>}
                  />
                  <HeroSearchInput
                    placeholder={tHome('hero.searchPlaceholder')}
                    className="mt-5 w-full"
                  />
                  <div className="mt-4 flex flex-wrap justify-center gap-3">
                    <Button asChild variant="outline" size="sm" className="rounded-full">
                      <Link href="/howto" prefetch={false}>
                        <BookOpen className="h-3.5 w-3.5 shrink-0" />
                        {tHome('hero.howto')}
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="rounded-full">
                      <Link href={glossaryPath} prefetch={false}>
                        <Tag className="h-3.5 w-3.5 shrink-0" />
                        {tHome('hero.glossary')}
                      </Link>
                    </Button>
                  </div>
                </div>
              </GlassCard>

              {/* Compact "from the blog" strip — three latest posts directly
                under the hero main box. Full BlogBottomSections still
                renders further down the page; this is the at-a-glance
                version for visitors who land at the top fold. */}
              <BlogHeroPreview locale={locale as Locale} />
            </div>
          </div>

          {/* Hero image attribution – only when the visitor is inside a real park, where the 3D
              scene is replaced by that park's rotating photos. No caption for the default 3D hero. */}
          <HeroImageInfoSwitch>{null}</HeroImageInfoSwitch>

          {/* Live wait times ticker — streamed in; never blocks the hero (decorative, absolute) */}
          <Suspense fallback={null}>
            <HeroTicker />
          </Suspense>
        </HeroRotationProvider>
      </section>

      {/* Announcement Section */}
      <AnnounceSection locale={locale} />

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
        <MLStatsSection />
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

          <div className="mt-8">
            <Link
              href="/howto"
              prefetch={false}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              {tHome('about.howtoLink')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
