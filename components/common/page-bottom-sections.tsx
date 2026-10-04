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
    // The card's own skeleton, at the same `mt-0` the card is rendered with below. A
    // hand-rolled 200 px box here was a third height for the same slot, on top of the two
    // the card itself goes through.
    loading: () => <NearbyParksCardSkeleton className="mt-0" />,
    ssr: true,
  }
);

// `loading` is a real Suspense fallback: `next/dynamic` is `React.lazy` + `<Suspense>`, so
// `() => null` shipped the whole band inside a `<div hidden id="S:…">` at the end of the
// document and grafted it in afterwards — 232 px landing under the reader on every page
// this module is on. The placeholder is the section's own empty state, which is what
// almost every visitor here ends up with anyway.
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
 * The shared "context module" below an editorial page's own content: Nearby →
 * Favorites → Featured Parks. Used by blog listings, blog posts and glossary
 * term pages, which all previously hand-rolled the identical three sections —
 * so a spacing fix on one silently left the others behind.
 *
 * Each of the three opens with `ChapterHeading`, watermark variant, unnumbered — the variant these
 * pages' own chapters use on the plain page background (the homepage, where the same three stand
 * among `tile` chapters, passes `tile` or `nested` instead). Every placeholder mounts the same
 * heading, so a fallback is as tall as what replaces it.
 *
 * Featured parks stream via FeaturedParksSlot (same pattern as the homepage),
 * so the geo fetch never blocks the host page from prerendering.
 */
export async function PageBottomSections({ locale }: PageBottomSectionsProps) {
  // Resolved here, not in the fallback: a fallback that awaits suspends, and is then no fallback.
  const featuredParksLabels = await getFeaturedParksLabels();

  return (
    <div data-page-bottom="">
      {/* Separated from the page content by a rule and a tint, NOT by whitespace.
          This block used to be pushed down by ~100px of stacked padding (page
          container + section + the card's own hero gap) to make the break read,
          which left a dead hole above "nearest open park". `border-y` +
          `bg-muted/30` states the break outright and continues into
          FavoritesSection's band below, so the tail is one visibly separate
          region — and the padding can stay modest. `mt-0` drops the card's own
          `mt-8`, which exists to clear the homepage hero and has nothing to
          clear here. */}
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
