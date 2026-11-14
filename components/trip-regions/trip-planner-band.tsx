import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { SectionMark } from '@/components/analytics/section-mark';
import { SectionSeenTracker } from '@/components/analytics/section-seen-tracker';
import { cn } from '@/lib/utils';
import { linkBlockAttributes } from '@/lib/analytics/internal-link';
import { getTripRegionLinks } from '@/lib/trip-regions/api';
import { shortParkName } from '@/lib/trip-regions/hub-data';
import { tripRegionPath } from '@/lib/trip-regions/paths';
import { getTripRegionWords } from '@/lib/trip-regions/region-messages';
import {
  findTripRegions,
  matchTripRegion,
  plannerLinkRel,
  tripPlannerHref,
  type TripRegionLinkPark,
  type TripRegionLinks,
} from '@/lib/trip-regions/trip-links';

/** Where the band stands, and so what it preselects. A park's own pages have `TripPlannerTile`. */
type TripPlannerBandProps = { className?: string } & (
  | {
      /** The end of a post: the post's parks of each region. */
      variant: 'post';
      /** The post's parks, by id or path. */
      parks: readonly string[];
    }
  | {
      /** A city or country listing: the planner as it opens, on the region's headliners. */
      variant: 'place';
      parks: readonly string[];
    }
  | {
      /** `/search`, for a query that names a region. */
      variant: 'search';
      query: string;
    }
);

/** A region a band is about, and the parks its link preselects. */
interface BandTarget {
  region: TripRegionLinks;
  parks: TripRegionLinkPark[];
}

/**
 * The regions a band is about: under a post and on a listing every region that holds one of its
 * parks, in the registry's order, so the United States page has Orlando and Southern California;
 * on `/search` the one the query names.
 */
function bandTargets(regions: TripRegionLinks[], props: TripPlannerBandProps): BandTarget[] {
  switch (props.variant) {
    case 'post':
      return findTripRegions(regions, props.parks);
    case 'place':
      return findTripRegions(regions, props.parks).map(({ region }) => ({ region, parks: [] }));
    case 'search': {
      const region = matchTripRegion(props.query, regions);
      return region ? [{ region, parks: [] }] : [];
    }
  }
}

/**
 * The way from a page about a trip region's parks into the region's planner, one line per region:
 * „Mehrere Tage in Orlando", „Magic Kingdom einplanen" or „Reiseplaner öffnen", and the hub by its
 * name. Under a post it preselects the post's parks of the region; on a city or country listing
 * and `/search` it opens the planner as it is. The region's name and its preposition are its own
 * words (`tripRegions.<slug>.nav`), never the API's English name. A link that carries a plan is
 * `nofollow` (`plannerLinkRel`), so the hub's name beside it is the followed link. Which parks
 * belong is the region route's park list (`getTripRegionLinks`), never a list here; a page
 * without one, or whose region read did not answer in time, renders nothing. A park's page and
 * crowd calendar have the tile instead (`TripPlannerTile`). A view counts once, when the bands' top
 * comes on screen (`section_seen` with `trip_band`, by a tracker of its own, as these pages have
 * none); a click is `internal_link_clicked` with the block `trip_band`.
 */
export async function TripPlannerBand(props: TripPlannerBandProps) {
  const targets = bandTargets(await getTripRegionLinks(), props);
  if (targets.length === 0) return null;
  const [t, locale] = await Promise.all([getTranslations('tripHub.band'), getLocale()]);
  const bands = await Promise.all(
    targets.map(async (target) => ({
      ...target,
      words: await getTripRegionWords(target.region.slug),
    }))
  );

  return (
    <div className={cn('flex flex-col gap-3', props.className)}>
      <SectionMark section="trip_band" />
      {bands.map(({ region, parks, words }) => {
        const href = tripPlannerHref(region.slug, locale, {
          parks: parks.map((park) => park.slug),
        });
        const rel = plannerLinkRel(href);
        const one = parks.length === 1 ? shortParkName(parks[0].name) : null;
        return (
          <aside
            key={region.slug}
            data-card=""
            data-trip-band={props.variant}
            {...linkBlockAttributes('trip_band')}
            className="border-border/60 bg-background/70 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border px-4 py-3 backdrop-blur-md"
          >
            <CalendarDays aria-hidden className="text-primary size-5 shrink-0" />
            <p className="min-w-0 flex-1 font-medium">{t('title', { inRegion: words.inRegion })}</p>
            <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <Link
                href={href}
                {...(rel ? { rel, prefetch: false } : {})}
                className="text-primary-ink inline-flex min-h-11 items-center text-sm font-semibold underline-offset-4 hover:underline sm:min-h-0"
              >
                {/* One line box, so a label that wraps on a phone keeps the arrow after its last word. */}
                <span>
                  {one ? t('planPark', { park: one }) : t('open')}
                  <ArrowRight aria-hidden className="ms-1 inline-block size-4 align-[-0.1875em]" />
                </span>
              </Link>
              <Link
                href={tripRegionPath(region.slug, locale)}
                prefetch={false}
                className="text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline sm:min-h-0"
              >
                {words.calendar}
              </Link>
            </span>
          </aside>
        );
      })}
      <SectionSeenTracker />
    </div>
  );
}
