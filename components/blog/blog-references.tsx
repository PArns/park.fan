import { getTranslations } from 'next-intl/server';
import { MapPin, Activity } from 'lucide-react';
import { ParkCard } from '@/components/parks/park-card';
import { AttractionCard } from '@/components/parks/attraction-card';
import {
  extractInlineRefs,
  resolveAttraction,
  resolvePark,
  type ResolvedAttraction,
  type ResolvedPark,
} from '@/lib/blog/park-resolver';
import {
  getAttractionBackgroundImage,
  getParkBackgroundImage,
} from '@/lib/utils/park-assets';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { buildAttractionPayload } from '@/lib/blog/attraction-payload';
import type { BlogAttractionRef, BlogPost } from '@/lib/blog/types';

interface BlogReferencesProps {
  post: BlogPost;
}

/**
 * Bottom-of-post section that collects every park and attraction the article
 * mentions — both the inline `[label](park:slug)` / `[label](attraction:..)`
 * references in the body and the explicit `relatedParks` / `relatedAttractions`
 * frontmatter entries — deduplicates them, and renders them as the same
 * ParkCard / AttractionCard tiles used on the favorites grid.
 */
export async function BlogReferences({ post }: BlogReferencesProps) {
  const t = await getTranslations('blog');
  const tGeo = await getTranslations('geo');

  // --- 1. Gather every referenced slug --------------------------------------
  const { parkSlugs: inlineParkSlugs, attractions: inlineAttractionRefs } =
    extractInlineRefs(post.content);

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
  // section is complete even when the body only links the ride.
  for (const ref of attractionRefSet) {
    const [parkSlug] = ref.split('/');
    if (parkSlug) parkSlugSet.add(parkSlug);
  }

  // --- 2. Resolve in parallel ----------------------------------------------
  const parks = (
    await Promise.all([...parkSlugSet].map((slug) => resolvePark(slug)))
  ).filter((p): p is ResolvedPark => p !== null);

  const attractions = (
    await Promise.all(
      [...attractionRefSet].map(async (ref) => {
        const [parkSlug, attractionSlug] = ref.split('/');
        const park = await resolvePark(parkSlug);
        const attraction = await resolveAttraction(parkSlug, attractionSlug);
        if (!park || !attraction) return null;
        return { park, attraction };
      })
    )
  ).filter(
    (a): a is { park: ResolvedPark; attraction: ResolvedAttraction } => a !== null
  );

  if (parks.length === 0 && attractions.length === 0) return null;

  // Stable sort — alphabetical so the listing doesn't reorder between renders.
  parks.sort((a, b) => a.name.localeCompare(b.name));
  attractions.sort((a, b) =>
    a.attraction.attractionName.localeCompare(b.attraction.attractionName)
  );

  return (
    <section className="my-12 space-y-10">
      {parks.length > 0 && (
        <div>
          <div className="mb-5 flex items-center gap-2">
            <MapPin className="text-primary h-5 w-5" aria-hidden="true" />
            <h2 className="text-foreground text-xl font-bold">
              {t('references.parks', { count: parks.length })}
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {parks.map((park) => (
              <div
                key={park.slug}
                className="grid [grid-template-rows:auto_minmax(220px,1fr)_auto]"
              >
                <ParkCard
                  name={park.name}
                  slug={park.slug}
                  parkId={park.id}
                  city={park.city}
                  country={translateGeoSlug(tGeo, 'countries', park.countrySlug, park.country)}
                  href={park.href as '/'}
                  status={park.status}
                  crowdLevel={park.crowdLevel}
                  averageWaitTime={park.avgWaitTime}
                  operatingAttractions={park.operatingAttractions}
                  totalAttractions={park.totalAttractions}
                  timezone={park.timezone}
                  todaySchedule={park.todaySchedule}
                  nextSchedule={park.nextSchedule}
                  hasOperatingSchedule={park.hasOperatingSchedule}
                  backgroundImage={getParkBackgroundImage(park.slug)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {attractions.length > 0 && (
        <div>
          <div className="mb-5 flex items-center gap-2">
            <Activity className="text-primary h-5 w-5" aria-hidden="true" />
            <h2 className="text-foreground text-xl font-bold">
              {t('references.attractions', { count: attractions.length })}
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {attractions.map(({ park, attraction }) => (
              <div
                key={`${park.slug}/${attraction.attractionSlug}`}
                className="grid [grid-template-rows:auto_minmax(220px,1fr)_auto]"
              >
                <AttractionCard
                  attraction={buildAttractionPayload(park, attraction)}
                  parkPath={park.href}
                  parkStatus={park.status}
                  backgroundImage={
                    getAttractionBackgroundImage(park.slug, attraction.attractionSlug) ??
                    getParkBackgroundImage(park.slug) ??
                    undefined
                  }
                  showParkName
                  timezone={park.timezone}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Helper that lets the page check whether `BlogReferences` will render
 * anything before the related-posts section, so we can suppress the
 * surrounding container's spacing when the post mentions no parks/rides.
 */
export function postHasReferences(post: BlogPost): boolean {
  const { parkSlugs, attractions } = extractInlineRefs(post.content);
  if (parkSlugs.size > 0 || attractions.size > 0) return true;
  if ((post.frontmatter.relatedParks?.length ?? 0) > 0) return true;
  if ((post.frontmatter.relatedAttractions?.length ?? 0) > 0) return true;
  return false;
}

// Re-export for ergonomic imports.
export type { BlogAttractionRef };
