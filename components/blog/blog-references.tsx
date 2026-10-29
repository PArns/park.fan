import { getTranslations } from 'next-intl/server';
import { MapPin, Activity } from 'lucide-react';
import { BlogParkCardLive } from '@/components/blog/blog-park-card-live';
import { BlogAttractionCardLive } from '@/components/blog/blog-attraction-card-live';
import {
  extractInlineRefs,
  resolveAttraction,
  resolvePark,
  type ResolvedAttraction,
  type ResolvedPark,
} from '@/lib/blog/park-resolver';
import {
  getAttractionBackgroundImage,
  getCardObjectPosition,
  getParkBackgroundImage,
} from '@/lib/utils/park-assets';
import { linkBlockAttributes, linkEntityAttributes } from '@/lib/analytics/internal-link';
import { cn } from '@/lib/utils';
import type { BlogAttractionRef, BlogPost } from '@/lib/blog/types';

interface BlogReferencesProps {
  post: BlogPost;
  className?: string;
}

/** The row template on each card's own wrapper, see docs/rules/blog-spotlight-cards.md. */
const CARD_ROWS_CLASS =
  'grid [grid-template-rows:auto_0px_auto] sm:[grid-template-rows:auto_minmax(220px,1fr)_auto]';

/**
 * The parks and rides of a post, right under its text: every park and attraction the article
 * mentions — both the inline `[label](park:slug)` / `[label](attraction:..)` references in the body
 * and the explicit `relatedParks` / `relatedAttractions` frontmatter entries — deduplicated, as the
 * live park and ride cards the post's own links open. A reader who got to the end is shown what
 * the park is doing now, the one thing a post cannot say. The cards share their live requests with
 * the inline links, so a park the text links costs nothing more here.
 */
export async function BlogReferences({ post, className }: BlogReferencesProps) {
  const t = await getTranslations('blog');

  const {
    parkSlugs: inlineParkSlugs,
    attractions: inlineAttractionRefs,
    parkGeoPaths,
    attractionGeoPaths,
  } = extractInlineRefs(post.content);

  const parkSlugSet = new Set<string>(inlineParkSlugs);
  for (const slug of post.frontmatter.relatedParks ?? []) {
    parkSlugSet.add(slug);
  }

  const attractionRefSet = new Set<string>(inlineAttractionRefs);
  for (const ref of post.frontmatter.relatedAttractions ?? []) {
    if (ref?.parkSlug && ref?.slug) {
      attractionRefSet.add(`${ref.parkSlug}/${ref.slug}`);
    }
  }

  // Also surface the parent park of every referenced attraction so the parks
  // section is complete even when the body only links the ride. Inherit the
  // ride's geoPath so a shared park slug (Paris vs. Anaheim) stays correct.
  const parkGeoPathBySlug = new Map<string, string>(parkGeoPaths);
  for (const ref of attractionRefSet) {
    const [parkSlug] = ref.split('/');
    if (!parkSlug) continue;
    parkSlugSet.add(parkSlug);
    const gp = attractionGeoPaths.get(ref);
    if (gp && !parkGeoPathBySlug.has(parkSlug)) parkGeoPathBySlug.set(parkSlug, gp);
  }

  const parks = (
    await Promise.all(
      [...parkSlugSet].map((slug) => resolvePark(slug, parkGeoPathBySlug.get(slug)))
    )
  ).filter((p): p is ResolvedPark => p !== null);

  const attractions = (
    await Promise.all(
      [...attractionRefSet].map(async (ref) => {
        const [parkSlug, attractionSlug] = ref.split('/');
        const gp = attractionGeoPaths.get(ref);
        const park = await resolvePark(parkSlug, gp);
        const attraction = await resolveAttraction(parkSlug, attractionSlug, gp);
        if (!park || !attraction) return null;
        return { park, attraction };
      })
    )
  ).filter((a): a is { park: ResolvedPark; attraction: ResolvedAttraction } => a !== null);

  if (parks.length === 0 && attractions.length === 0) return null;

  // Stable sort — alphabetical so the listing doesn't reorder between renders.
  parks.sort((a, b) => a.name.localeCompare(b.name));
  attractions.sort((a, b) =>
    a.attraction.attractionName.localeCompare(b.attraction.attractionName)
  );

  return (
    <section className={cn('space-y-10', className)}>
      {parks.length > 0 && (
        <div {...linkBlockAttributes('parks')}>
          <div className="mb-5 flex items-center gap-2">
            <MapPin className="text-primary h-5 w-5" aria-hidden="true" />
            <h2 className="text-foreground text-xl font-bold">
              {t('references.parks', { count: parks.length })}
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 @min-[1024px]/page:grid-cols-3">
            {parks.map((park) => (
              <div key={park.slug} className="grid" {...linkEntityAttributes(park.id)}>
                <BlogParkCardLive
                  park={park}
                  backgroundImage={getParkBackgroundImage(park.slug)}
                  objectPosition={getCardObjectPosition(park.slug)}
                  className={CARD_ROWS_CLASS}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {attractions.length > 0 && (
        <div {...linkBlockAttributes('rides')}>
          <div className="mb-5 flex items-center gap-2">
            <Activity className="text-primary h-5 w-5" aria-hidden="true" />
            <h2 className="text-foreground text-xl font-bold">
              {t('references.attractions', { count: attractions.length })}
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 @min-[1024px]/page:grid-cols-3">
            {attractions.map(({ park, attraction }) => (
              <div
                key={`${park.slug}/${attraction.attractionSlug}`}
                className="grid"
                {...linkEntityAttributes(attraction.detail?.id)}
              >
                <BlogAttractionCardLive
                  park={park}
                  attraction={attraction}
                  // No park fallback: a ride without its own photo shows none, rather
                  // than the park's picture captioned with the ride's name.
                  attractionBackgroundImage={getAttractionBackgroundImage(
                    park.slug,
                    attraction.attractionSlug
                  )}
                  objectPosition={getCardObjectPosition(park.slug, attraction.attractionSlug)}
                  className={CARD_ROWS_CLASS}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// Re-export for ergonomic imports.
export type { BlogAttractionRef };
