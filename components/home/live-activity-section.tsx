import { getTranslations } from 'next-intl/server';
import { Globe } from 'lucide-react';
import { getGeoStructure } from '@/lib/api/discovery';
import { getGeoLiveStats } from '@/lib/api/analytics';
import { catchNonFatal } from '@/lib/api/client';
import { LiveActivityGrid, type ContinentCard } from '@/components/home/live-activity-grid';
import { ChapterHeading } from '@/components/common/chapter-heading';

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
  const [tHome, tStory, geoData, geoLive] = await Promise.all([
    getTranslations('home'),
    getTranslations('homeStory'),
    catchNonFatal(getGeoStructure()),
    catchNonFatal(getGeoLiveStats()),
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
    <section className="border-border bg-muted/30 border-t px-4 py-16 sm:py-18">
      <div className="container mx-auto">
        {/* `ChapterHeading`, not a bare `text-xl font-bold` h2: this section sits
          in the homepage's chapter ladder, and it was one of the last two places
          on the page still drawing a section header of its own. */}
        <ChapterHeading
          variant="tile"
          icon={Globe}
          kicker={tStory('liveNow.kicker')}
          title={tHome('sections.liveNow')}
          hint={tHome('sections.liveNowIntro')}
          id="parks-weltweit"
        />
        <LiveActivityGrid continents={continents} />
      </div>
    </section>
  );
}
