import { Suspense } from 'react';
import nextDynamic from 'next/dynamic';
import { FeaturedParksSlot } from '@/components/home/featured-parks-slot';
import { FeaturedParksSkeleton } from '@/components/home/home-skeletons';

const NearbyParksCard = nextDynamic(
  () =>
    import('@/components/parks/nearby-parks-card').then((m) => ({
      default: m.NearbyParksCard,
    })),
  {
    loading: () => (
      <section className="bg-card min-h-[200px] rounded-xl border py-4">
        <div className="bg-muted mx-4 h-40 animate-pulse rounded-lg" />
      </section>
    ),
    ssr: true,
  }
);

const FavoritesSection = nextDynamic(
  () =>
    import('@/components/parks/favorites-section').then((m) => ({
      default: m.FavoritesSection,
    })),
  { loading: () => null, ssr: true }
);

interface BlogBottomSectionsProps {
  locale: string;
}

/**
 * Shared "context module" rendered below blog listings and post detail pages.
 * Mirrors the same Nearby → Favorites → Featured Parks order used at the
 * bottom of every glossary term page so the experience is consistent across
 * the editorial surfaces of the site.
 *
 * Featured parks stream via FeaturedParksSlot (same pattern as the homepage),
 * so the geo fetch never blocks the post shell from prerendering.
 */
export function BlogBottomSections({ locale }: BlogBottomSectionsProps) {
  return (
    // Frosted backdrop so these sections stay legible where they scroll over the
    // fixed cover image on post/listing pages. backdrop-blur is a no-op over the
    // solid page background elsewhere, so this stays a blog-only visual effect.
    <div className="bg-background/40 backdrop-blur-md">
      <section className="border-b px-4 py-8">
        <div className="container mx-auto">
          <NearbyParksCard />
        </div>
      </section>

      <FavoritesSection />

      <Suspense fallback={<FeaturedParksSkeleton />}>
        <FeaturedParksSlot locale={locale} />
      </Suspense>
    </div>
  );
}
