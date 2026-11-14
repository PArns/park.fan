import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { buttonLinkProps } from '@/components/ui/button';
import { RegionSceneInView } from '@/components/layout/planner-region-art';
import { SectionMark } from '@/components/analytics/section-mark';
import {
  REGION_CARD,
  REGION_KICKER,
  REGION_PILL,
} from '@/components/trip-regions/region-card-classes';
import { cn } from '@/lib/utils';
import { linkBlockAttributes, linkEntityAttributes } from '@/lib/analytics/internal-link';
import { tripTileAttributes, tripTileLinkAttributes } from '@/lib/analytics/trip-tile';
import { getTripRegionLinks } from '@/lib/trip-regions/api';
import { shortParkName } from '@/lib/trip-regions/hub-data';
import { tripRegionPath } from '@/lib/trip-regions/paths';
import { monthSearchRange } from '@/lib/trip-regions/plan-when';
import { getTripRegionWords } from '@/lib/trip-regions/region-messages';
import { findTripRegion, plannerLinkRel, tripPlannerHref } from '@/lib/trip-regions/trip-links';
import type { TripMonth } from '@/lib/trip-regions/types';

interface TripPlannerTileProps {
  /** The park's locale-free path, `/parks/<continent>/<country>/<city>/<park>`. */
  park: string;
  /** On a crowd calendar month page, that month: the dates the planner searches. */
  month?: TripMonth | null;
  /** The park's today, from which a month is searched. */
  today?: string;
  className?: string;
}

/**
 * The scene's box: on a phone a 2 : 1 banner over the text that fades out at its foot; from `sm`
 * the card's right side at the card's height, 2 : 1 from `lg`, fading into the ground to its left
 * as `ParkBreakPanel`'s picture does. The box is the scene's reservation, so the lazy scene moves
 * nothing when it arrives.
 */
const SCENE_BOX =
  'relative aspect-[2/1] w-full shrink-0 [mask-image:linear-gradient(to_bottom,black_72%,transparent)] sm:aspect-auto sm:w-80 sm:[mask-image:linear-gradient(to_right,transparent,black_38%)] lg:w-[26rem]';

/**
 * A trip region's planner on the pages of one of its parks: the region's Parky scene, "Mehrere
 * Tage in Orlando", what the planner does in one line, „Magic Kingdom einplanen" into the planner
 * with the park chosen (and on a calendar month that month as the dates to search), and the hub by
 * its name (`nav.calendar`, "Orlando Crowd Calendar") as a plain link. The card is the planner's link; the hub's
 * stands above that cover.
 *
 * The plan link carries a state, one of endless URLs that canonical to the hub, so it is
 * `nofollow` and not prefetched, as the hub's own "Plan these dates"; the hub's link is the
 * followed one, with the hub's name as its anchor, so a park page passes the hub a link. Which
 * parks belong is the region route's park list (`getTripRegionLinks`); a park of no live region,
 * or one whose region read did not answer in time, renders nothing, decided before the first byte.
 * The scene loads after the page, once the tile nears the screen (`RegionSceneInView`).
 *
 * Counted three ways: `section_seen` with `trip_tile` once per view when its top comes on screen
 * (`ParkPageShell`'s tracker), `internal_link_clicked` with the block `trip_tile` and the park as
 * entity, and `trip_tile_clicked` with the region and which link (`lib/analytics/trip-tile.ts`).
 */
export async function TripPlannerTile({ park, month, today, className }: TripPlannerTileProps) {
  const found = findTripRegion(await getTripRegionLinks(), [park]);
  if (!found) return null;
  const { region, parks } = found;
  const [t, tTile, tNav, words, locale] = await Promise.all([
    getTranslations('tripHub.band'),
    getTranslations('tripHub.tile'),
    getTranslations('navigation'),
    getTripRegionWords(region.slug),
    getLocale(),
  ]);

  const when = month && today ? monthSearchRange(month, today) : null;
  const href = tripPlannerHref(region.slug, locale, {
    parks: parks.map((one) => one.slug),
    when,
  });
  const headingId = `trip-tile-${region.slug}`;

  return (
    <>
      <SectionMark section="trip_tile" />
      <aside
        data-card=""
        {...tripTileAttributes(region.slug)}
        {...linkBlockAttributes('trip_tile')}
        {...linkEntityAttributes(parks[0].id)}
        aria-labelledby={headingId}
        className={cn(
          REGION_CARD,
          'flex flex-col shadow-lg sm:min-h-44 sm:flex-row-reverse lg:min-h-52',
          className
        )}
      >
        <div aria-hidden="true" className={SCENE_BOX}>
          <RegionSceneInView regionId={region.slug} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 px-4 pb-5 sm:py-6 sm:pr-2 sm:pl-6">
          <p className={REGION_KICKER}>{tNav('tripPlanner')}</p>
          <h2
            id={headingId}
            className="text-foreground text-2xl leading-tight font-bold tracking-tight text-balance sm:text-3xl"
          >
            {t('title', { inRegion: words.inRegion })}
          </h2>
          <p className="text-foreground/80 max-w-prose text-sm leading-relaxed text-pretty">
            {tTile('line', { count: region.parks.length })}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              href={href}
              rel={plannerLinkRel(href)}
              prefetch={false}
              {...tripTileLinkAttributes('plan')}
              {...buttonLinkProps({
                withIcon: true,
                className: cn(
                  REGION_PILL,
                  'h-auto min-h-11 px-4 py-2 whitespace-normal shadow-md after:absolute after:inset-0 sm:min-h-9'
                ),
              })}
            >
              {t('planPark', { park: shortParkName(parks[0].name) })}
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link
              href={tripRegionPath(region.slug, locale)}
              prefetch={false}
              {...tripTileLinkAttributes('calendar')}
              className="text-primary-ink relative z-10 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline sm:min-h-0"
            >
              <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
              {words.calendar}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
