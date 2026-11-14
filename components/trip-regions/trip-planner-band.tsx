import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { linkBlockAttributes } from '@/lib/analytics/internal-link';
import { getTripRegionLinks } from '@/lib/trip-regions/api';
import { shortParkName } from '@/lib/trip-regions/hub-data';
import { monthSearchRange } from '@/lib/trip-regions/plan-when';
import {
  findTripRegion,
  matchTripRegion,
  tripPlannerHref,
  type TripRegionLinkPark,
  type TripRegionLinks,
} from '@/lib/trip-regions/trip-links';
import type { TripMonth } from '@/lib/trip-regions/types';

/** Where the band stands, and so what it preselects. */
type TripPlannerBandProps = { className?: string } & (
  | {
      /** A park's page or crowd calendar: that park, and on a calendar month that month. */
      variant: 'park';
      /** The park's locale-free path, `/parks/<continent>/<country>/<city>/<park>`. */
      park: string;
      month?: TripMonth | null;
      /** The park's today, from which a month is searched. */
      today?: string;
    }
  | {
      /** The end of a post: the post's parks of the region. */
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

/** The region a band is about, and the parks its link preselects. */
function bandTarget(
  regions: TripRegionLinks[],
  props: TripPlannerBandProps
): { region: TripRegionLinks; parks: TripRegionLinkPark[] } | null {
  switch (props.variant) {
    case 'park':
      return findTripRegion(regions, [props.park]);
    case 'post':
      return findTripRegion(regions, props.parks);
    case 'place': {
      const found = findTripRegion(regions, props.parks);
      return found && { region: found.region, parks: [] };
    }
    case 'search': {
      const region = matchTripRegion(props.query, regions);
      return region && { region, parks: [] };
    }
  }
}

/**
 * The way from a page about one of a trip region's parks into the region's planner: "Several days
 * in Orlando? Plan Magic Kingdom into your Orlando trip". On a park page or crowd calendar it
 * preselects the park (and a calendar month as the dates to search), under a post the post's
 * parks, and on a city or country listing or `/search` it opens the planner as it is. Which parks
 * belong is the region route's park list (`getTripRegionLinks`), never a list here; a page
 * without one, or whose region read did not answer in time, renders nothing.
 */
export async function TripPlannerBand(props: TripPlannerBandProps) {
  const target = bandTarget(await getTripRegionLinks(), props);
  if (!target) return null;
  const { region, parks } = target;
  const [t, locale] = await Promise.all([getTranslations('tripHub.band'), getLocale()]);

  const when =
    props.variant === 'park' && props.month && props.today
      ? monthSearchRange(props.month, props.today)
      : null;
  const href = tripPlannerHref(region.slug, locale, {
    parks: parks.map((park) => park.slug),
    when,
  });
  const one = parks.length === 1 ? shortParkName(parks[0].name) : null;
  // A plan in the address is one of endless URLs that canonical to the hub, as the hub's own
  // "Plan these dates" links are; the bare chapter stays an ordinary link to the hub.
  const planLink = href.includes('?');

  return (
    <aside
      data-card=""
      data-trip-band={props.variant}
      {...linkBlockAttributes('trip_band')}
      className={cn(
        'border-border/60 bg-background/70 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border px-4 py-3 backdrop-blur-md',
        props.className
      )}
    >
      <CalendarDays aria-hidden className="text-primary size-5 shrink-0" />
      <p className="min-w-0 flex-1 font-medium">{t('title', { region: region.name })}</p>
      <Link
        href={href}
        {...(planLink ? { rel: 'nofollow', prefetch: false } : {})}
        className="text-primary-ink inline-flex min-h-11 items-center text-sm font-semibold underline-offset-4 hover:underline sm:min-h-0"
      >
        {/* One line box, so a label that wraps on a phone keeps the arrow after its last word. */}
        <span>
          {one ? t('planPark', { park: one, region: region.name }) : t('open')}
          <ArrowRight aria-hidden className="ms-1 inline-block size-4 align-[-0.1875em]" />
        </span>
      </Link>
    </aside>
  );
}
