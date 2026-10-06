import { getGeoStructure } from '@/lib/api/discovery';
import { getGeoLiveStats } from '@/lib/api/analytics';
import { catchNonFatal } from '@/lib/api/client';
import { LiveActivityGrid, type ContinentCard } from '@/components/home/live-activity-grid';
import { getSectionHeadingLabels, LiveActivityHeading } from '@/components/home/section-headings';
import { STORY_SECTION_TINTED } from '@/components/home/story/section-chrome';

/**
 * "Parks open now": per-continent open-park counts, server-rendered into the homepage shell. The
 * baked open counts are only a seed; the live values overlay on the client through the shared
 * `useGeoLiveStats` batch call (see LiveContinentOpenCount). Rendered inside <Suspense> so neither
 * fetch blocks the hero; on error the section is omitted.
 */
export async function LiveActivitySection() {
  const [geoData, geoLive, headingLabels] = await Promise.all([
    catchNonFatal(getGeoStructure()),
    catchNonFatal(getGeoLiveStats()),
    getSectionHeadingLabels(),
  ]);

  const continents: ContinentCard[] =
    geoData?.continents.map((continent) => ({
      slug: continent.slug,
      name: continent.name,
      parkCount: continent.parkCount,
      countryCount: continent.countryCount,
      openParkCount: geoLive?.continents.find((c) => c.slug === continent.slug)?.openParkCount ?? 0,
    })) || [];

  if (continents.length === 0) return null;

  return (
    <section className={STORY_SECTION_TINTED}>
      <div className="container mx-auto">
        {/* In its own file so LiveActivitySkeleton mounts the identical node: the heading needs no
            data, and its height moves with how the title wraps. */}
        <LiveActivityHeading labels={headingLabels} />
        <LiveActivityGrid continents={continents} />
      </div>
    </section>
  );
}
