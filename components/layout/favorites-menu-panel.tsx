'use client';

import { Suspense, lazy, useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Bell, Clock, Star } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { FavoritesHowTo } from '@/components/parks/favorites-how-to';
import {
  GroupHeading,
  MAX_ROWS,
  MoreLine,
  Row,
  RowGroupSkeleton,
  RowSkeletons,
} from '@/components/layout/favorites-menu-rows';
import { countPushFollowsLocal } from '@/lib/push/push-follows-store';
import { useLocalPushFollowsValue } from '@/lib/push/use-local-push-follows-value';
import { MAX_CARDS, MAX_CARD_ROWS, VENUE_BASIS, planBand } from '@/lib/utils/favorites-band-plan';
import { useFavorites } from '@/lib/hooks/use-favorites';
import { useFavoriteCounts } from '@/lib/hooks/use-favorite-counts';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useMinuteNowDate } from '@/lib/hooks/use-minute-now';
import { formatDurationShort } from '@/lib/i18n/time';
import { parkDayOf } from '@/lib/utils/park-day';
import { FavoriteStar } from '@/components/common/favorite-star';
import { formatDistance } from '@/lib/utils/distance-utils';
import type { NearbyParksData, ParkWithDistance } from '@/types/nearby';
import { WaitTimeValue } from '@/components/common/wait-time-value';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { cn, stripNewPrefix } from '@/lib/utils';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { convertApiUrlToFrontendUrl, parkChapterUrl } from '@/lib/utils/url-utils';
import type {
  FavoriteAttraction,
  FavoritePark,
  FavoriteRestaurant,
  FavoriteShow,
} from '@/lib/api/favorites';
import type { AttractionStatus, CrowdLevel, ParkStatus, ScheduleSummary } from '@/lib/api/types';

/**
 * The favorites menu's contents: cards in the full-width band, rows in the 300 px burger sheet.
 * It fetches nothing until opened, since the header renders on every page. The picture is optional
 * and the card's box is not, so the grid never reflows on which parks are starred. It reads only
 * namespaces the layout chrome already carries, which is why it does not use
 * `ParkCard`/`AttractionCard`.
 */

/**
 * The alerts group, loaded the first time somebody opens the band with something armed:
 * `lib/push/push-follows` reaches the service worker and the VAPID key, which do not belong in the
 * header's chunk. `lazy` rather than `next/dynamic`, because the `Suspense` fallback at the call
 * site knows how many rows to reserve. The gate is a `localStorage` count, 0 on the server.
 */
const FavoritesMenuAlerts = lazy(() =>
  import('@/components/layout/favorites-menu-alerts').then((m) => ({
    default: m.FavoritesMenuAlerts,
  }))
);

/** Parks offered for one-tap starring while the list is still empty. */
const SUGGESTION_LIMIT = 5;

/** The tint a card without a photo gets, from the park's own crowd level. Full class names. */
const CROWD_FIELD: Record<string, string> = {
  very_low: 'from-crowd-very-low/25',
  low: 'from-crowd-low/25',
  moderate: 'from-crowd-moderate/25',
  high: 'from-crowd-high/25',
  very_high: 'from-crowd-very-high/25',
  extreme: 'from-crowd-extreme/25',
};

function standbyWait(attraction: FavoriteAttraction): number | null {
  const standby = attraction.queues?.find((q) => q.queueType === 'STANDBY');
  return standby?.waitTime ?? null;
}

/** The wait time as the card's headline figure — the reason somebody opened this menu. */
function WaitFigure({ minutes, unit }: { minutes: number; unit: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <WaitTimeValue
        minutes={minutes}
        shadow={false}
        className="text-2xl leading-none font-bold tabular-nums"
      />
      <span className="text-muted-foreground text-[11px]">{unit}</span>
    </span>
  );
}

/**
 * One favorite as a card: picture on top, name and place under it, the figure in the footer. Every
 * card is exactly as tall as every other: the picture has a fixed height rather than an aspect
 * ratio, and the subtitle, figure and schedule each keep their box when empty, so rows stay level
 * whatever the API answered.
 */
function Card({
  href,
  title,
  subtitle,
  image,
  imagePosition,
  crowd,
  figure,
  schedule,
  badge,
}: {
  href: string;
  title: string;
  subtitle?: string | null;
  image?: string | null;
  imagePosition?: string;
  crowd?: CrowdLevel | null;
  figure?: React.ReactNode;
  schedule?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const tint = crowd && crowd !== 'unknown' ? CROWD_FIELD[crowd] : null;

  return (
    <li>
      <Link
        href={href}
        prefetch={false}
        className="group border-border/60 bg-card/40 hover:border-primary/40 flex h-full flex-col overflow-hidden rounded-xl border transition-colors"
      >
        <span className="bg-muted relative block h-32 shrink-0 overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              sizes="(min-width: 1280px) 220px, 180px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              style={{ objectPosition: imagePosition }}
            />
          ) : (
            <span
              className={`absolute inset-0 bg-gradient-to-br to-transparent ${tint ?? 'from-primary/15'}`}
              aria-hidden="true"
            />
          )}
          {badge && <span className="absolute top-2 right-2">{badge}</span>}
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-0.5 p-3">
          <span className="text-foreground group-hover:text-primary truncate text-sm font-semibold transition-colors">
            {title}
          </span>
          {/* Empty, not gone: the no-break space keeps the line's box. */}
          <span className="text-muted-foreground truncate text-xs">{subtitle || '\u00A0'}</span>
          {/* `h-6` is `WaitFigure`'s height, so the smaller fallback sits inside it instead of
              making the card shorter. */}
          <span className="mt-1.5 flex h-6 items-center">{figure}</span>
          <span className="mt-1 flex h-4 items-center">{schedule}</span>
        </span>
      </Link>
    </li>
  );
}

/**
 * „Schließt in 3 Std. 12 Min." / „Öffnet in 40 Min." / „Öffnet am Fr., 5. Sept." for a favorite
 * card. Pure: `now` comes from the caller, and `null` before mount gives an empty line whose box
 * already stands. It reads the schedule in the park's zone, not the live `status`: the badge on the
 * picture says one, this line the other.
 */
function scheduleMessage(
  {
    todaySchedule,
    nextSchedule,
    timezone,
  }: {
    todaySchedule?: ScheduleSummary;
    nextSchedule?: ScheduleSummary;
    timezone?: string;
  },
  now: Date | null,
  t: (key: string) => string,
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string,
  locale: string
): string | null {
  if (!now) return null;

  const tz = timezone ? { timeZone: timezone } : {};
  const dayIn = (d: Date) => parkDayOf(d, timezone);

  try {
    if (todaySchedule?.scheduleType === 'OPERATING') {
      const opening = new Date(todaySchedule.openingTime);
      const closing = new Date(todaySchedule.closingTime);
      // The entry is called "today", but it has to be today in the park's zone too: for a park in
      // California, 2 September here can still be 1 September there.
      if (dayIn(opening) === dayIn(now)) {
        if (now < opening) {
          return `${t('opensIn')} ${formatDurationShort(opening.getTime() - now.getTime(), tCommon)}`;
        }
        if (now < closing) {
          return `${t('closesIn')} ${formatDurationShort(closing.getTime() - now.getTime(), tCommon)}`;
        }
      }
    }

    if (nextSchedule?.scheduleType !== 'OPERATING') return null;
    const next = new Date(nextSchedule.openingTime);
    const diff = next.getTime() - now.getTime();
    if (diff <= 0) return null;
    // Under a day the remaining time counts, beyond it the date: "opens in 62 h" helps nobody.
    if (diff < 24 * 60 * 60 * 1000) {
      return `${t('opensIn')} ${formatDurationShort(diff, tCommon)}`;
    }
    return `${t('opensOn')} ${next.toLocaleDateString(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      ...tz,
    })}`;
  } catch {
    return null;
  }
}

/**
 * The schedule line under the figure. `suppressHydrationWarning` because the text depends on the
 * reader's clock; `useMinuteNowDate` is `null` before mount, so the first client render matches the
 * server.
 */
function ScheduleLine({
  todaySchedule,
  nextSchedule,
  timezone,
}: {
  todaySchedule?: ScheduleSummary;
  nextSchedule?: ScheduleSummary;
  timezone?: string;
}) {
  const t = useTranslations('favorites');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const now = useMinuteNowDate();

  const message = scheduleMessage(
    { todaySchedule, nextSchedule, timezone },
    now,
    t,
    tCommon,
    locale
  );
  if (!message) return null;

  return (
    <span
      className="text-muted-foreground flex min-w-0 items-center gap-1 text-[11px]"
      suppressHydrationWarning
    >
      <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span className="truncate">{message}</span>
    </span>
  );
}

function CardSkeletons({ count }: { count: number }) {
  return (
    <>
      {/* The same boxes as `Card`, or the band jumps when the data arrives. The count arrives
          capped, because only the band's plan knows how many rows the cards will take. */}
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="border-border/60 overflow-hidden rounded-xl border">
          <Skeleton className="h-32 rounded-none" />
          <div className="p-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-0.5 h-4 w-20" />
            <Skeleton className="mt-1.5 h-6 w-12" />
            <Skeleton className="mt-1 h-4 w-24" />
          </div>
        </li>
      ))}
    </>
  );
}

/**
 * The band's inner width, measured: how many cards fit depends on it, and the planner changes the
 * header's width. A layout effect keyed on `open`, so the measurement lands in the commit that
 * drops `hidden` and the first painted frame is already right.
 */
function useBandWidth(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    const read = () => setWidth(el.getBoundingClientRect().width);
    read();
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, [active]);

  return { ref, width };
}

/**
 * Contents of the header's favourites menu: favourite parks, rides, shows and restaurants as cards
 * in the full-width band or as rows in the phone sheet, the alerts group, and nearby parks to star
 * while the list is empty. Fetches nothing until opened.
 */
export function FavoritesMenuPanel({
  open,
  variant = 'band',
}: {
  open: boolean;
  /**
   * `band` is the full-width header panel, `sheet` the 300 px burger column. Every `sm:`/`lg:`
   * below is a viewport query, and the sheet is 300 px wide at every viewport that shows it.
   */
  variant?: 'band' | 'sheet';
}) {
  const t = useTranslations('favorites');
  const tCommon = useTranslations('common');
  const tGeo = useTranslations('geo');
  const tNav = useTranslations('navigation');
  const tPush = useTranslations('pushAlerts.menu');
  const counts = useFavoriteCounts();
  // `poll: false` — the menu is on screen for seconds. The homepage band is the surface that
  // stays open long enough for a five-minute refresh to mean anything, and it keeps its own.
  const { data, isPending } = useFavorites({ enabled: open && counts.total > 0, poll: false });
  const minuteLabel = tCommon('minuteShort');
  const isSheet = variant === 'sheet';
  // Band only: the sheet is 300 px wide wherever it is shown and has nothing to divide.
  const { ref: bandRef, width: bandWidth } = useBandWidth(open && !isSheet && counts.total > 0);

  /*
   * This browser's alerts, independent of the favourites. The gate is the local mirror, not the
   * server: one `localStorage` read, so a visitor who never set an alert loads neither the chunk
   * nor a request. If the mirror was cleared while the subscription survived, the „Meine Alarme"
   * link in the header row still leads to the full list. Band only.
   */
  const [alertCount] = useLocalPushFollowsValue(0, countPushFollowsLocal, []);
  const showAlerts = !isSheet && open && alertCount > 0;
  const rowGroups = (counts.shows + counts.restaurants > 0 ? 1 : 0) + (showAlerts ? 1 : 0);

  // Suggestions for the empty state, from the query the header already makes for the nearby pill.
  // `useMounted` is required: the hook seeds from `localStorage`, so without the gate the server
  // and the first client render would disagree and React would throw the subtree away.
  const mounted = useMounted();
  const { data: nearbyData } = useHomeNearbyParks();
  const suggestions =
    mounted && nearbyData?.type === 'nearby_parks'
      ? (nearbyData.data as NearbyParksData).parks.slice(0, isSheet ? 3 : SUGGESTION_LIMIT)
      : [];
  const more = (hidden: number) => t('more', { count: hidden });

  if (counts.total === 0) {
    /*
     * In the sheet two lines, in the band the whole guide: the three steps stacked in a 300 px
     * column would take over half the phone's navigation for a state with nothing to show.
     */
    if (isSheet) {
      return (
        <div data-menu-stagger>
          <div className="flex gap-3">
            <Star className="text-muted-foreground/60 mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0">
              <span className="text-foreground block text-sm font-semibold">{t('empty')}</span>
              <span className="text-muted-foreground block text-xs leading-relaxed">
                {t('howTo.starText')}
              </span>
            </span>
          </div>
          {/* `/favorites` only: `MoreMenuLinks` already carries `/alerts` at the foot of this
              sheet, and leaves `/favorites` out because this panel carries it. On its own line,
              since the 252 px column cannot hold it beside the sentences. */}
          <span className="mt-3 flex pl-7">
            <FavoritesPageMenuLink label={t('link')} />
          </span>
        </div>
      );
    }

    /*
     * The empty state is the same panel without content: the same header, the same edges, and the
     * three steps as three columns over the full width rather than a centred island.
     */
    return (
      <div>
        <div
          className={cn(
            'mb-4 flex gap-4',
            // The 300 px sheet cannot hold the title and both links in one row in German or
            // French, so the links wrap under the title.
            isSheet ? 'flex-col items-start gap-2' : 'items-center justify-between'
          )}
        >
          {/* Grey, not gold: the trigger's star is filled once something is starred, and this
              line says the opposite. */}
          <span className="text-foreground inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
            <Star className="text-muted-foreground/60 h-4 w-4" aria-hidden="true" />
            {t('empty')}
          </span>
          {/* The same two links as the filled state, plus „Parks entdecken". */}
          <span className="flex items-center gap-3">
            {/* Independent of favourites: a ride alert or show reminder still needs a way to the
                overview. Not in the sheet, where `MoreMenuLinks` carries it. */}
            {!isSheet && <PushAlertsMenuLink label={tPush('link')} />}
            {/* In the empty state the favourites page is what is missing: it repeats the guide,
                and a bookmark on it is the way back. */}
            <FavoritesPageMenuLink label={t('link')} />
            <Link
              href="/parks"
              prefetch={false}
              className="text-primary hover:text-primary/80 text-xs font-medium transition-colors"
            >
              {tNav('explore')}
            </Link>
          </span>
        </div>

        {/* Above the guide: alerts are something real in the menu, and the starring guide is
            secondary. Full width, since no second group shares the track. */}
        {showAlerts && (
          <Suspense
            fallback={
              <RowGroupSkeleton
                title={tPush('title')}
                count={alertCount}
                max={MAX_CARDS}
                className="mb-5"
              />
            }
          >
            <FavoritesMenuAlerts
              open={open}
              cap={MAX_CARDS}
              expected={alertCount}
              className="mb-5"
            />
          </Suspense>
        )}

        <div data-menu-stagger>
          <FavoritesHowTo cta={false} />
        </div>

        {suggestions.length > 0 && (
          <div data-menu-stagger className="border-border/60 mt-5 border-t pt-4">
            <span className="text-muted-foreground mb-2.5 block text-[11px] font-semibold tracking-wide uppercase">
              {tNav('nearby')}
            </span>
            {/* The star sits beside the link, not inside it: nested, a click would open the park
                page instead of starring it. */}
            <ul className="flex flex-wrap gap-2">
              {suggestions.map((park) => (
                <SuggestionChip key={park.id} park={park} />
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  const loading = isPending || !data;
  const cap = isSheet ? MAX_ROWS : MAX_CARDS;
  /*
   * How many cards a group shows is decided by the band's plan (`planBand`): as many as fit in
   * `MAX_CARD_ROWS` rows of its columns, so the band's height follows the rows, not how much
   * somebody starred. The rest goes to the „+N" line.
   */
  const plan = isSheet ? null : planBand(bandWidth, counts, rowGroups);
  const cardCap = (cols: number | undefined, count: number) =>
    Math.min(count, MAX_CARDS, Math.max(1, cols ?? MAX_CARDS) * MAX_CARD_ROWS);
  const parkCap = isSheet ? MAX_ROWS : cardCap(plan?.parks, counts.parks);
  const attractionCap = isSheet ? MAX_ROWS : cardCap(plan?.attractions, counts.attractions);

  const hiddenVenues = Math.max(0, counts.shows + counts.restaurants - cap);

  const listClass = isSheet ? 'space-y-px' : 'grid gap-3';
  /*
   * Fixed pixel tracks, not `1fr`: the card width is one number for the whole band, and `fr` would
   * derive it per group again. Without a measurement it falls back to `auto-fill` for the one
   * render before the first layout.
   */
  const gridStyle = (cols: number | undefined): React.CSSProperties | undefined => {
    if (isSheet) return undefined;
    if (!plan || !cols) return { gridTemplateColumns: 'repeat(auto-fill, minmax(10.5rem, 1fr))' };
    return { gridTemplateColumns: `repeat(${cols}, ${plan.card}px)` };
  };
  /* A group is as wide as its tracks; its width is a result, not an input. */
  const groupStyle: React.CSSProperties | undefined = isSheet ? undefined : { flex: '0 0 auto' };
  /*
   * Shows and restaurants do not grow with their count: a row only gets longer, not better. A fixed
   * base width that takes the rest only when no other group needs it, and the full width when it
   * is the only group.
   */
  const rowGroupStyle: React.CSSProperties | undefined =
    isSheet || !plan || plan.stacked
      ? undefined
      : { flexGrow: 1, flexShrink: 1, flexBasis: `${VENUE_BASIS}px`, minWidth: 0 };

  return (
    <div ref={bandRef}>
      <div
        className={cn(
          'mb-4 flex gap-4',
          // Same fix as the empty state's header: on the 300 px sheet the links wrap under the
          // title.
          isSheet ? 'flex-col items-start gap-2' : 'items-center justify-between'
        )}
      >
        <span className="text-foreground inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
          {/* Gold like the trigger and every `FavoriteStar`: the same mark, the same colour. */}
          <Star className="h-4 w-4 fill-amber-400 text-amber-500" aria-hidden="true" />
          {t('title')}
        </span>
        <span className="flex items-center gap-3">
          {/* Not in the sheet, where `MoreMenuLinks` carries the same link and it would appear
              twice in one column. In the band it stays: this panel and „Mehr" are never open
              together. */}
          {!isSheet && <PushAlertsMenuLink label={tPush('link')} />}
          <FavoritesPageMenuLink label={t('link')} />
        </span>
      </div>

      {/* `plan.stacked` rather than `lg:flex-row`: the band is as wide as the header, which the
          planner shrinks without the window changing. */}
      <div
        className={
          isSheet ? 'space-y-5' : `flex ${plan && !plan.stacked ? 'gap-8' : 'flex-col gap-6'}`
        }
      >
        {counts.parks > 0 && (
          <div data-menu-stagger className="min-w-0" style={groupStyle}>
            <GroupHeading title={t('parks')} count={counts.parks} />
            <ul className={listClass} style={gridStyle(plan?.parks)}>
              {loading ? (
                isSheet ? (
                  <RowSkeletons count={counts.parks} />
                ) : (
                  <CardSkeletons count={parkCap} />
                )
              ) : (
                <>
                  {data.parks.slice(0, parkCap).map((park) => (
                    <ParkEntry
                      key={park.id}
                      park={park}
                      isSheet={isSheet}
                      minuteLabel={minuteLabel}
                      country={translateGeoSlug(tGeo, 'countries', park.country, park.country)}
                    />
                  ))}
                  <MoreLine
                    hidden={counts.parks - Math.min(data.parks.length, parkCap)}
                    label={more}
                  />
                </>
              )}
            </ul>
          </div>
        )}

        {counts.attractions > 0 && (
          <div data-menu-stagger className="min-w-0" style={groupStyle}>
            <GroupHeading title={t('attractions')} count={counts.attractions} />
            <ul className={listClass} style={gridStyle(plan?.attractions)}>
              {loading ? (
                isSheet ? (
                  <RowSkeletons count={counts.attractions} />
                ) : (
                  <CardSkeletons count={attractionCap} />
                )
              ) : (
                <>
                  {data.attractions.slice(0, attractionCap).map((attraction) => (
                    <AttractionEntry
                      key={attraction.id}
                      attraction={attraction}
                      isSheet={isSheet}
                      minuteLabel={minuteLabel}
                    />
                  ))}
                  <MoreLine
                    hidden={counts.attractions - Math.min(data.attractions.length, attractionCap)}
                    label={more}
                  />
                </>
              )}
            </ul>
          </div>
        )}

        {/* Shows and restaurants are a group in this row like parks and rides, drawn as rows; see
            `venueRows`. */}
        {counts.shows + counts.restaurants > 0 && (
          <div data-menu-stagger className="min-w-0" style={rowGroupStyle}>
            <GroupHeading
              title={counts.shows > 0 ? t('shows') : t('restaurants')}
              count={counts.shows + counts.restaurants}
            />
            <ul className="space-y-px">
              {loading ? (
                <RowSkeletons count={counts.shows + counts.restaurants} max={cap} />
              ) : (
                <>
                  {venueRows(data.shows, data.restaurants)
                    .slice(0, cap)
                    .map((venue) => (
                      <Row
                        key={venue.id}
                        href={venue.href}
                        title={venue.title}
                        subtitle={venue.park}
                      />
                    ))}
                  <MoreLine hidden={hiddenVenues} label={more} />
                </>
              )}
            </ul>
          </div>
        )}

        {/* Last in the row, the one group that is not favourites: an alert hangs on a bell, not a
            star. The same track as shows and restaurants, since both are rows. */}
        {showAlerts && (
          <Suspense
            fallback={
              <RowGroupSkeleton
                title={tPush('title')}
                count={alertCount}
                max={cap}
                style={rowGroupStyle}
              />
            }
          >
            <FavoritesMenuAlerts
              open={open}
              cap={cap}
              expected={alertCount}
              style={rowGroupStyle}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}

/**
 * The link to `/alerts`, beside the panel's title in both states. Unconditional, unlike the alerts
 * group: a browser whose local mirror was cleared while its subscription survived still has
 * alerts, and this link is how it reaches them.
 */
function PushAlertsMenuLink({ label }: { label: string }) {
  return (
    <Link
      href="/alerts"
      prefetch={false}
      className="text-primary hover:text-primary/80 flex items-center gap-1 text-xs font-medium transition-colors"
    >
      <Bell className="size-3" aria-hidden="true" />
      {label}
    </Link>
  );
}

/**
 * The link to `/favorites`, in every state of this panel, the sheet included, where
 * `MoreMenuLinks` leaves it out because this link is here. Whether the page is reachable does not
 * depend on the count; what the cap hides, the „+N" line says.
 */
function FavoritesPageMenuLink({ label }: { label: string }) {
  return (
    <Link
      href="/favorites"
      prefetch={false}
      className="text-primary hover:text-primary/80 flex items-center gap-1 text-xs font-medium transition-colors"
    >
      <Star className="size-3" aria-hidden="true" />
      {label}
    </Link>
  );
}

function ParkEntry({
  park,
  isSheet,
  minuteLabel,
  country,
}: {
  park: FavoritePark;
  isSheet: boolean;
  minuteLabel: string;
  country: string;
}) {
  const href = convertApiUrlToFrontendUrl(park.url);
  const title = stripNewPrefix(park.name);
  const operating = park.status === 'OPERATING';
  // Ø and crowd only for a park that is actually running: a closed one aggregates over an empty
  // set and reports the same thing a park with no wait-time source reports.
  const wait =
    operating && park.analytics?.avgWaitTime != null
      ? roundWaitTo5(park.analytics.avgWaitTime)
      : null;
  const badge = (
    <ParkStatusBadge status={park.status as ParkStatus} className="px-1.5 py-0 text-[10px]" />
  );

  if (isSheet) {
    return (
      <Row
        href={href}
        title={title}
        subtitle={[park.city, country].filter(Boolean).join(' · ')}
        image={park.backgroundImage}
        imagePosition={park.backgroundPosition}
        trailing={
          wait !== null ? (
            <WaitTimeValue
              minutes={wait}
              shadow={false}
              unit={minuteLabel}
              className="text-sm font-semibold tabular-nums"
            />
          ) : (
            badge
          )
        }
      />
    );
  }

  return (
    <Card
      href={href}
      title={title}
      subtitle={[park.city, country].filter(Boolean).join(' · ')}
      image={park.backgroundImage}
      imagePosition={park.backgroundPosition}
      crowd={operating ? park.analytics?.crowdLevel : null}
      badge={badge}
      schedule={
        <ScheduleLine
          todaySchedule={park.todaySchedule}
          nextSchedule={park.nextSchedule}
          timezone={park.timezone}
        />
      }
      figure={
        wait !== null ? (
          <WaitFigure minutes={wait} unit={minuteLabel} />
        ) : (
          <span className="text-muted-foreground text-xs">
            {park.operatingAttractions != null
              ? `${park.operatingAttractions}/${park.totalAttractions}`
              : `${park.totalAttractions}`}
          </span>
        )
      }
    />
  );
}

function AttractionEntry({
  attraction,
  isSheet,
  minuteLabel,
}: {
  attraction: FavoriteAttraction;
  isSheet: boolean;
  minuteLabel: string;
}) {
  const href = convertApiUrlToFrontendUrl(attraction.url);
  const title = stripNewPrefix(attraction.name);
  const parkName = attraction.park ? stripNewPrefix(attraction.park.name) : null;
  // `effectiveStatus`, never the raw `status`: a ride out of season is closed, and the raw field
  // does not know that. See `docs/api/seasonal-attractions.md`.
  const status = (attraction.effectiveStatus ?? attraction.status ?? 'CLOSED') as AttractionStatus;
  const operating = status === 'OPERATING';
  const raw = standbyWait(attraction);
  const wait = operating && raw !== null ? roundWaitTo5(raw) : null;
  const badge = <ParkStatusBadge status={status} className="px-1.5 py-0 text-[10px]" />;

  if (isSheet) {
    return (
      <Row
        href={href}
        title={title}
        subtitle={parkName}
        image={attraction.backgroundImage}
        imagePosition={attraction.backgroundPosition}
        trailing={
          wait !== null ? (
            <WaitTimeValue
              minutes={wait}
              shadow={false}
              unit={minuteLabel}
              className="text-sm font-semibold tabular-nums"
            />
          ) : (
            badge
          )
        }
      />
    );
  }

  return (
    <Card
      href={href}
      title={title}
      subtitle={parkName}
      image={attraction.backgroundImage}
      imagePosition={attraction.backgroundPosition}
      crowd={operating ? attraction.crowdLevel : null}
      badge={badge}
      figure={wait !== null ? <WaitFigure minutes={wait} unit={minuteLabel} /> : null}
    />
  );
}

/**
 * Shows and restaurants as rows in one group. No card: the media database has no image for either
 * and there is no figure, so a card would be an empty field with a name. Neither has a page of its
 * own, so the link goes to the park page's tab.
 */
function venueRows(shows: FavoriteShow[], restaurants: FavoriteRestaurant[]) {
  return [
    ...shows.map((show) => ({
      id: show.id,
      title: stripNewPrefix(show.name),
      park: show.park ? stripNewPrefix(show.park.name) : null,
      chapter: parkChapterUrl(show.url, 'shows'),
    })),
    ...restaurants.map((restaurant) => ({
      id: restaurant.id,
      title: stripNewPrefix(restaurant.name),
      park: restaurant.park ? stripNewPrefix(restaurant.park.name) : null,
      chapter: parkChapterUrl(restaurant.url, 'restaurants'),
    })),
  ].map((v) => ({
    id: v.id,
    title: v.title,
    park: v.park,
    // Without a resolvable park page, the favourites page is the only place the entry still shows.
    href: v.chapter ?? '/favorites',
  }));
}

/**
 * A park suggestion: tap to open, with a star beside it to save. Offering the nearby parks turns
 * the empty state's instructions into an action.
 */
function SuggestionChip({ park }: { park: ParkWithDistance }) {
  return (
    /* Left 1, right 2.5: the pill is `rounded-full`. On the left the round image fills the curve;
       on the right a 16 px star needs more room from the edge. */
    <li className="border-border/70 bg-card/40 hover:border-primary/40 flex items-center gap-1 rounded-full border py-1 pr-2.5 pl-1 transition-colors">
      <Link
        href={convertApiUrlToFrontendUrl(park.url) as '/'}
        prefetch={false}
        className="group flex min-w-0 items-center gap-2 pr-1"
      >
        <span className="bg-muted relative block h-6 w-6 shrink-0 overflow-hidden rounded-full">
          {park.backgroundImage && (
            <Image
              src={park.backgroundImage}
              alt=""
              fill
              sizes="24px"
              className="object-cover"
              style={{ objectPosition: park.backgroundPosition }}
            />
          )}
        </span>
        <span className="text-foreground group-hover:text-primary truncate text-[13px] font-medium transition-colors">
          {stripNewPrefix(park.name)}
        </span>
        <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
          {formatDistance(park.distance)}
        </span>
      </Link>
      <FavoriteStar type="park" id={park.id} name={park.name} size="sm" />
    </li>
  );
}
