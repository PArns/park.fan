import { getGeoStructure } from '@/lib/api/discovery';
import { getGeoLiveStats } from '@/lib/api/analytics';
import { catchNonFatal } from '@/lib/api/client';
import { LiveActivityGrid, type ContinentCard } from '@/components/home/live-activity-grid';
import { getSectionHeadingLabels, LiveActivityHeading } from '@/components/home/section-headings';
import { STORY_SECTION_TINTED } from '@/components/home/story/section-chrome';

/**
 * "Parks open now" — per-continent open-park counts, server-rendered into the homepage shell.
 *
 * The continent structure (names + total park counts) comes from the static geo structure; the
 * baked open counts are only an HOURLY SSR seed (the shell revalidates every 3600s to keep ISR
 * writes down) — the live values overlay themselves client-side per card via the shared
 * `useGeoLiveStats` batch call (see LiveContinentOpenCount). Rendered inside <Suspense> so
 * neither fetch blocks the hero; on error the section is omitted.
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
        {/* A chapter heading rather than the bare `text-xl font-bold` h2 this
          section used to draw. In its own file so LiveActivitySkeleton mounts
          the identical node — the heading needs no data, and its height moves
          with how the title wraps. */}
        <LiveActivityHeading labels={headingLabels} />
        <LiveActivityGrid continents={continents} />
      </div>
    </section>
  );
}
