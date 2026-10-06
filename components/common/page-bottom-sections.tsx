import { Suspense } from 'react';
import nextDynamic from 'next/dynamic';
import { FeaturedParksSlot } from '@/components/home/featured-parks-slot';
import { FeaturedParksSkeleton } from '@/components/home/home-skeletons';
import { getFeaturedParksLabels } from '@/components/home/section-headings';
import { FavoritesEmptyState } from '@/components/parks/favorites-empty-state';
import { NearbyParksCardSkeleton } from '@/components/parks/nearby-parks-card-skeleton';

const NearbyParksCard = nextDynamic(
  () =>
    import('@/components/parks/nearby-parks-card').then((m) => ({
      default: m.NearbyParksCard,
    })),
  {
    // The card's own skeleton at the card's `mt-0`, so the slot has one height.
    loading: () => <NearbyParksCardSkeleton className="mt-0" />,
    ssr: true,
  }
);

// `loading` is a real Suspense fallback (`next/dynamic` is `React.lazy` plus `<Suspense>`), so it
// reserves the band; `() => null` grafted it in afterwards, under the reader. The placeholder is
// the section's own empty state, which almost every visitor ends up with anyway.
const FavoritesSection = nextDynamic(
  () =>
    import('@/components/parks/favorites-section').then((m) => ({
      default: m.FavoritesSection,
    })),
  { loading: () => <FavoritesEmptyState textHidden />, ssr: true }
);

interface PageBottomSectionsProps {
  locale: string;
}

/**
 * The shared context module below an editorial page's own content: nearby, favorites, featured
 * parks. Each opens with an unnumbered watermark `ChapterHeading`, and every placeholder mounts the
 * same heading, so a fallback is as tall as what replaces it. Featured parks stream via
 * `FeaturedParksSlot`, so the geo fetch never blocks the page's prerender.
 */
export async function PageBottomSections({ locale }: PageBottomSectionsProps) {
  // Resolved here, not in the fallback: a fallback that awaits suspends, and is then no fallback.
  const featuredParksLabels = await getFeaturedParksLabels();

  return (
    <div data-page-bottom="">
      {/* Separated from the page content by a rule and a tint, not by whitespace, and continuing
          into FavoritesSection's band below. `mt-0` drops the card's own `mt-8`, which clears the
          homepage hero and has nothing to clear here. */}
      <section className="bg-muted/30 border-y px-4 py-6">
        <div className="container mx-auto">
          <NearbyParksCard className="mt-0" />
        </div>
      </section>

      <FavoritesSection />

      <Suspense fallback={<FeaturedParksSkeleton labels={featuredParksLabels} />}>
        <FeaturedParksSlot locale={locale} />
      </Suspense>
    </div>
  );
}
