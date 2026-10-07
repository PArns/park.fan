import { Suspense } from 'react';
import { Link } from '@/i18n/navigation';
import { CardPhoto, CardPhotoFrame } from '@/components/parks/card-photo';
import { useTranslations } from 'next-intl';
import { Crown, ChartColumn, Clock, GripVertical, MapPin } from 'lucide-react';
import { cn, isUuid, stripNewPrefix } from '@/lib/utils';
import { roundWaitTo5, shortTermWaitTrend } from '@/lib/utils/wait-time';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { formatDistance } from '@/lib/utils/distance-utils';
import type { ParkAttraction, ParkStatus, BestVisitSlot, RopeDropInfo } from '@/lib/api/types';
import type { FavoriteAttraction } from '@/lib/api/favorites';
import { FavoriteStar } from '@/components/common/favorite-star';
import {
  GLASS_CIRCLE_HIT_AREA,
  GLASS_CIRCLE_ROW,
  GlassCircle,
} from '@/components/common/glass-circle';
import { RiddenToggle } from './ridden-toggle';
import { RideAlertBell } from '@/components/push/ride-alert-bell';
import { AttractionCardBestTime } from '@/components/parks/attraction-card-best-time';
import { AttractionCardRopeDrop } from '@/components/parks/attraction-card-rope-drop';
import { Skeleton } from '@/components/ui/skeleton';
import { WaitTimeValue } from '@/components/common/wait-time-value';
import { isEveningBetter, ropeDropDisplayWaits } from '@/lib/utils/rope-drop';
import { getLiveAttractionStatus, getStandbyWait } from '@/lib/utils/park-utils';
import { ParkStatusBadge } from './park-status-badge';
import { CrowdLevelBadge } from './crowd-level-badge';
import { RideCrowdScaleTooltip } from './ride-crowd-scale-tooltip';
import { isColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import { RopeDropBadge, RopeDropEveningBadge } from './rope-drop-badge';
import { SeasonalBadge } from './seasonal-badge';
import { WorksPeriodBadge } from './works-period-badge';
import { QueueTypeBadge } from './queue-type-badge';
import { FastPassBadge } from '@/components/parks/fast-pass-badge';
import { SingleRiderBadge } from '@/components/parks/single-rider-badge';
import { VirtualLineBadge } from '@/components/parks/virtual-line-badge';
import { AttractionMetaBadges } from './attraction-meta-badges';
import { TransportSystemBadge } from './transport-system-badge';
import { HalloweenMazeBadge } from './halloween-maze-badge';
import { WaitTimeSparklineCard } from './wait-time-sparkline-card';
import { TrendPill } from './trend-pill';
import { OutageNote } from './outage-note';
import { NotRunTodayNote } from './not-run-today-note';

interface AttractionCardProps {
  attraction: ParkAttraction | FavoriteAttraction;
  parkPath?: string;
  parkStatus?: ParkStatus;
  /**
   * The ride closed for good. Its badge reads „Dauerhaft geschlossen" instead of the live status,
   * and nothing that describes a running ride (wait, crowd level, best time) is drawn. Only the
   * blog's ride references set it: every other card is built from the park payload, which carries
   * no closed ride.
   */
  closedPermanently?: boolean;
  backgroundImage?: string | null;
  /**
   * Where the photo is cropped from — the image's focal point, resolved by the
   * SERVER (`enrichAttractionsWithImages` / `getCardObjectPosition`) and handed in.
   * The card cannot look it up itself without importing the media manifest, and it
   * renders inside Client Components. Defaults to a top crop.
   */
  objectPosition?: string;
  distance?: number;
  showParkName?: boolean;
  timezone?: string;
  /**
   * Today in the PARK's timezone, `YYYY-MM-DD`, from the server render, for the works-period
   * marker. A prop and not a clock read because this card renders on both sides of hydration
   * (see `isWorksPeriodActive`). Cross-park listings have no park day, so the marker stays off.
   */
  todayIso?: string;
  /**
   * The park's name for the ride-alert bell's dialog, not for display. The park page passes it
   * because its attractions carry no nested `park`; cross-park listings fall back to that object.
   */
  parkName?: string;
  /**
   * Below `sm`, lay the card out as one compact row: name and wait time on the first line, the
   * badges on one line under it, no bottom panel. The park page's ride list passes it, so a long
   * list stays short on a phone; what the row drops is on the ride's own page. Every class it
   * adds is `max-sm:`.
   */
  phoneRow?: boolean;
  /**
   * Draw the „ridden" switch in the corner, beside the bell and the star. The park page's ride
   * list passes it. A prop and not a check on the data, because the corner circles' reserved
   * width has to be known to the server render.
   */
  rideLog?: boolean;
}

function getCrowdLevel(attraction: ParkAttraction | FavoriteAttraction): string | undefined {
  if ('crowdLevel' in attraction) return attraction.crowdLevel;
  if ('currentLoad' in attraction && attraction.currentLoad?.crowdLevel) {
    return attraction.currentLoad.crowdLevel;
  }
  return undefined;
}

function getBestSlot(attraction: ParkAttraction | FavoriteAttraction): BestVisitSlot | null {
  if (!('bestVisitTimes' in attraction) || !attraction.bestVisitTimes) return null;
  return (
    attraction.bestVisitTimes.find((s) => s.rating === 'optimal') ??
    attraction.bestVisitTimes.find((s) => s.rating === 'good') ??
    null
  );
}

function getRopeDrop(attraction: ParkAttraction | FavoriteAttraction): RopeDropInfo | null {
  if (!('ropeDrop' in attraction) || !attraction.ropeDrop) return null;
  return attraction.ropeDrop;
}

function getHref(attraction: ParkAttraction | FavoriteAttraction, parkPath?: string): string {
  if ('url' in attraction && attraction.url) {
    const converted = convertApiUrlToFrontendUrl(attraction.url);
    if (converted && converted !== '#') return converted;
  }
  if (parkPath) {
    return `${parkPath}/${attraction.slug}` as '/europe/germany/rust/europa-park/blue-fire';
  }
  return '#';
}

/** The upper sheet catching the light. Not part of the seam below it — see `panelSeat`. */
const PANEL_SHINE = 'inset 0 1px 0 var(--pk-panel-shine)';

/** A ride's card: photo, status and badges, and the live wait with its sparkline. */
export function AttractionCard({
  attraction,
  parkPath,
  parkStatus,
  closedPermanently = false,
  backgroundImage: propBackgroundImage,
  objectPosition: propObjectPosition,
  distance,
  showParkName = false,
  timezone,
  todayIso,
  parkName: parkNameProp,
  phoneRow = false,
  rideLog = false,
}: AttractionCardProps) {
  const t = useTranslations('attractions');
  const tGeo = useTranslations('geo');

  const status = closedPermanently ? 'RETIRED' : getLiveAttractionStatus(attraction, parkStatus);
  const isOperatingOrUnknown = status === 'OPERATING' || status === 'UNKNOWN';
  const waitTime = isOperatingOrUnknown ? getStandbyWait(attraction) : null;
  const effectiveTimezone =
    timezone ??
    ('park' in attraction && attraction.park?.timezone ? attraction.park.timezone : undefined);
  const parkName =
    parkNameProp ??
    ('park' in attraction && attraction.park?.name
      ? stripNewPrefix(attraction.park.name)
      : undefined);
  const crowdLevel = getCrowdLevel(attraction);
  const href = getHref(attraction, parkPath);
  const backgroundImage =
    propBackgroundImage ?? ('backgroundImage' in attraction ? attraction.backgroundImage : null);
  // Attached alongside the path by `enrichAttractionsWithImages`, so the focal point
  // survives the trip through an API route without the card importing the manifest.
  const objectPosition =
    propObjectPosition ??
    ('backgroundPosition' in attraction && typeof attraction.backgroundPosition === 'string'
      ? attraction.backgroundPosition
      : 'top');

  // 40 px per corner circle (34 px and a 6 px gap), a pair at the least.
  const cornerReserve = (parkName ? 92 : 52) + (rideLog ? 40 : 0);

  const stats = attraction.statistics;
  const history = stats?.history;

  const trend = isOperatingOrUnknown && waitTime !== null ? shortTermWaitTrend(history) : null;

  // The "in X min" text is time-relative, so the client <AttractionCardBestTime> renders it.
  const bestSlot = status === 'OPERATING' ? getBestSlot(attraction) : null;

  const ropeDropData = getRopeDrop(attraction);
  const ropeDrop = ropeDropData?.worth ? ropeDropData : null;
  const eveningBetter = ropeDropData !== null && !ropeDrop && isEveningBetter(ropeDropData);
  // Gates above read the raw block; what the badges print is the five-minute figure the card shows.
  const ropeDropShown = ropeDropData ? ropeDropDisplayWaits(ropeDropData) : null;

  // The bottom glass panel (wait time + sparkline) only exists when there is a
  // live wait time. Without it row 3 is empty rather than covered, so the photo
  // the visitor sees runs all the way down — and the framed photo layer has to
  // claim that row too, or its lower edge sits exposed mid-card as a crop seam.
  const hasBottomPanel = isOperatingOrUnknown && waitTime !== null;

  // What the top panel's lower edge (the seam between the upper glass and what is under it) sits
  // on. With no bottom panel and no photo there is only the flat placeholder, so no seam is drawn.
  // `photo` is its own case because the picture is `hidden sm:block`; that breakpoint lives in
  // `.pk-panel-seam-sm`, since an inline box-shadow cannot be switched off by a class.
  const panelSeat: 'panel' | 'photo' | 'none' = hasBottomPanel
    ? 'panel'
    : backgroundImage
      ? 'photo'
      : 'none';
  // A phone row drops the bottom panel, so below `sm` its seam has nothing to
  // sit on either. `.pk-panel-seam-sm` draws the same border and shadow as the
  // inline `panel` style from `sm` up, and only the shine below it.
  const seamOnClass = panelSeat === 'photo' || (phoneRow && panelSeat === 'panel');
  const seamStyle = seamOnClass
    ? {}
    : panelSeat === 'panel'
      ? {
          borderBottom: '1px solid var(--pk-panel-border)',
          boxShadow: `${PANEL_SHINE}, inset 0 -1px 0 rgba(0,0,0,0.06)`,
        }
      : { boxShadow: PANEL_SHINE };

  return (
    <Link
      href={href as '/europe/germany/rust/europa-park'}
      prefetch={false}
      // `PlannerLauncher` sets `data-planner-open` on the document element while the panel is
      // out, so the cursor changes in CSS and no card re-renders when it opens. `sm:` because a
      // coarse pointer has no drag and drop. A phone row is `block` below `sm`: it has no
      // neighbour to share row heights with, and the subgrid's gaps would sit inside the row.
      className={cn(
        'group row-span-3 grid [grid-template-rows:subgrid] sm:[html[data-planner-open]_&]:cursor-grab sm:[html[data-planner-open]_&]:active:cursor-grabbing',
        phoneRow && 'max-sm:block'
      )}
      // Read by the trip planner while a drag is in flight (`lib/planner/use-ride-drag-source.ts`).
      // Attributes rather than a handler, because this card is a Server Component and a wrapper
      // element between it and its parent grid would break the subgrid chain.
      data-planner-ride={attraction.slug}
      data-planner-ride-name={stripNewPrefix(attraction.name)}
    >
      <article
        className={cn(
          'pk-card-fx relative isolate row-span-3 grid cursor-pointer [grid-template-rows:subgrid] overflow-hidden rounded-[20px] transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-1',
          phoneRow && 'max-sm:block max-sm:rounded-[16px]'
        )}
        data-card-fx
        style={{
          boxShadow: 'var(--pk-card-shadow)',
        }}
      >
        {/* The card is a drag source while the planner is out, and a cursor change alone is
            only found by somebody who already suspects the gesture. Inert without
            `html[data-planner-open]`, hidden below `sm` (no drag and drop on a coarse pointer).
            Centred on the photo and shown on hover, so it never covers the ride's name; the
            panel's coach mark reaches the reader who is not hovering. */}
        <span
          data-planner-drag-hint=""
          className="bg-primary/90 text-primary-foreground ring-primary-foreground/20 pointer-events-none absolute top-1/2 left-1/2 z-30 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium opacity-0 shadow-sm ring-1 backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100 sm:[html[data-planner-open]_&]:flex"
        >
          <GripVertical className="size-3 shrink-0" aria-hidden="true" />
          {t('planner.dragIn')}
        </span>
        {/* Hidden below `sm`, where cards collapse onto their panels (as the `sm:min-h-[220px]`
            spacer below and ParkCard do), so only the gradient placeholder shows there. */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {backgroundImage ? (
            <CardPhoto
              objectPosition={objectPosition}
              src={backgroundImage}
              alt={stripNewPrefix(attraction.name)}
              closed={!isOperatingOrUnknown}
              hideOnMobile
            />
          ) : (
            <div className="from-muted to-card h-full w-full bg-gradient-to-br" />
          )}
        </div>

        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              'linear-gradient(180deg, var(--pk-scrim-top) 0%, transparent 32%, transparent 56%, var(--pk-scrim-bot) 100%)',
          }}
        />

        {/* The bell brings its own `GlassCircle` because it hides where the queue is too short
            for an alert, and a circle drawn here would stay behind empty. The star is the last
            child, so it keeps the far-right spot. In a phone row the circles centre on the
            first line, and the star sits as far from the right edge as from the top. */}
        {attraction.id && (
          <div
            className={cn(
              'absolute top-3 right-3 z-[4]',
              GLASS_CIRCLE_ROW,
              phoneRow && 'max-sm:top-[8px] max-sm:right-[8px]'
            )}
          >
            {/* On a blog fallback card `attraction.id` is the slug, not a UUID, and
                `POST /push/ride-alerts` 400s on that. `FavoriteStar` only needs a local key. */}
            {parkName && isUuid(attraction.id) && (
              <RideAlertBell
                attractionId={attraction.id}
                attractionName={stripNewPrefix(attraction.name)}
                parkName={parkName}
                backgroundImage={backgroundImage}
                objectPosition={objectPosition}
                currentWaitTime={waitTime}
                status={status}
              />
            )}
            {rideLog && isUuid(attraction.id) && (
              <GlassCircle>
                <RiddenToggle id={attraction.id} />
              </GlassCircle>
            )}
            <GlassCircle>
              <FavoriteStar
                type="attraction"
                id={attraction.id}
                name={stripNewPrefix(attraction.name)}
                size="md"
                noCircle
                variant="glass"
                className={cn('h-full w-full', GLASS_CIRCLE_HIT_AREA)}
              />
            </GlassCircle>
          </div>
        )}

        {/* The right padding reserves the corner circles: 52px for one, 92px for two. It keys
            on `parkName`, not on the bell actually drawn, because whether the bell renders
            depends on a localStorage read, and a client-only preference may not decide
            server-rendered markup. A phone row overrides it below `sm` (hence the `!`): the
            reservation moves onto the first line, the badge line runs the full width, and the
            sides and the bottom take the 8 px the star keeps from the card's edge. */}
        <div
          className={cn(
            'pk-panel-top relative z-[3] -mb-4 overflow-hidden',
            seamOnClass && 'pk-panel-seam-sm',
            phoneRow && 'max-sm:mb-0 max-sm:pt-[10px]! max-sm:pr-2! max-sm:pb-2! max-sm:pl-2!'
          )}
          style={{
            padding: `14px ${cornerReserve}px 13px 16px`,
            background: 'var(--pk-panel-highlight-top), var(--pk-panel)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            ...seamStyle,
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 36%)',
              mixBlendMode: 'overlay',
            }}
          />

          {/* CSS truncate and a native `title` keep the card server-rendered: no layout effect,
              no Radix tooltip to hydrate per card. */}
          {(() => {
            const displayName = stripNewPrefix(attraction.name);
            const isHeadliner = 'isHeadliner' in attraction && attraction.isHeadliner;
            const headlinerHint = `${t('headliner.title')} — ${t('headliner.description')}`;
            const heading = (
              <h3
                className={cn(
                  'relative flex items-center gap-1.5 text-[16px] leading-[1.2] font-extrabold tracking-[-0.022em]',
                  phoneRow && 'max-sm:min-w-0 max-sm:flex-1'
                )}
                style={{ color: 'var(--pk-text-1)' }}
              >
                {isHeadliner && (
                  // Not in a phone row: the headliners have a section of their own there, and the
                  // row's first line is the name's.
                  <span
                    title={headlinerHint}
                    aria-label={t('headliner.title')}
                    className={phoneRow ? 'max-sm:hidden' : undefined}
                  >
                    <Crown className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                  </span>
                )}
                <span className="block min-w-0 flex-1 truncate" title={displayName}>
                  {displayName}
                </span>
              </h3>
            );
            if (!phoneRow) return heading;
            // A phone row's first line: name, wait time, then the room the corner circles take
            // (30 px per circle and 3 px between them, 8 px from the card's edge, plus an 8 px gap;
            // the panel's own 8 px padding already covers part of it). The wait time sits
            // outside the <h3> so the heading stays the ride's name. Its unit is left to screen
            // readers: the width goes to the name, and the figure is a wait time on every card.
            return (
              <div
                className={cn(
                  'relative max-sm:flex max-sm:min-h-[26px] max-sm:items-center max-sm:gap-2',
                  parkName ? 'max-sm:pr-[71px]' : 'max-sm:pr-[38px]',
                  rideLog && (parkName ? 'max-sm:pr-[104px]' : 'max-sm:pr-[71px]')
                )}
              >
                {heading}
                {hasBottomPanel && (
                  <span className="flex shrink-0 leading-none sm:hidden">
                    <WaitTimeValue
                      minutes={roundWaitTo5(waitTime)}
                      className="text-[26px] font-extrabold tracking-[-0.02em] tabular-nums"
                    />
                    <span className="sr-only">min</span>
                  </span>
                )}
              </div>
            );
          })()}

          {(() => {
            const park = 'park' in attraction ? attraction.park : null;
            const shownParkName =
              showParkName && park && 'name' in park ? stripNewPrefix(park.name) : null;
            const city = park && 'city' in park ? park.city : null;
            const rawCountry = park && 'country' in park ? park.country : null;
            const country = rawCountry
              ? translateGeoSlug(tGeo, 'countries', rawCountry, rawCountry)
              : null;
            const place = [city, country].filter(Boolean).join(', ');
            const pieces = [
              shownParkName,
              place || null,
              distance != null ? formatDistance(distance) : null,
            ].filter(Boolean);
            if (pieces.length === 0) return null;
            return (
              <p
                className="relative mt-[3px] flex items-center gap-1 truncate text-[12px]"
                style={{ color: 'var(--pk-text-2)' }}
              >
                <MapPin
                  className="h-[11px] w-[11px] shrink-0"
                  style={{ color: 'var(--pk-text-3)' }}
                  aria-hidden="true"
                />
                <span className="truncate">{pieces.join(' · ')}</span>
              </p>
            );
          })()}

          {/* The outer subgrid equalises header heights across a row, so no min-h. In a phone
              row the badges keep to one line and fade out rather than wrap; the full set is on
              the ride's page. The status badge leaves that line while a wait time stands beside
              the name, which already says the ride is running; `min-h` keeps the row at its
              72 px when nothing else is left on the line. `*:flex` because a badge wrapped in a
              `<span>` (a tooltip, a glossary link) otherwise sits on a 24 px text line, and the
              row grows to 74 px; it outranks a child's own `max-sm:hidden`, hence the `!`. */}
          <div
            className={cn(
              'relative mt-[9px] flex flex-wrap items-start gap-[6px]',
              phoneRow &&
                'max-sm:mt-[6px] max-sm:min-h-[22px] max-sm:flex-nowrap max-sm:overflow-hidden max-sm:[mask-image:linear-gradient(to_right,black_85%,transparent)] max-sm:*:flex max-sm:*:shrink-0'
            )}
          >
            <ParkStatusBadge
              status={status}
              className={phoneRow && hasBottomPanel ? 'max-sm:hidden!' : undefined}
            />
            {isOperatingOrUnknown && crowdLevel && (
              // The scale is this ride's own, in minutes, and only where the API sent the
              // baseline it rated against — without one the badge stands alone.
              <RideCrowdScaleTooltip
                level={isColoredCrowdLevel(crowdLevel) ? crowdLevel : null}
                baseline={attraction.baseline}
              >
                <CrowdLevelBadge
                  level={
                    crowdLevel as 'very_low' | 'low' | 'moderate' | 'high' | 'very_high' | 'extreme'
                  }
                />
              </RideCrowdScaleTooltip>
            )}
            {/* Right after the crowd level, because it qualifies exactly that
                number: on a station the queue is people waiting for the next
                departure, so a high reading says the train is due rather than
                that the ride is popular. */}
            <TransportSystemBadge attractionKind={attraction.attractionKind} />
            <HalloweenMazeBadge attractionKind={attraction.attractionKind} />
            {/* Rope drop is planning info — shown regardless of live status (it
                matters most before the park opens). */}
            {ropeDrop && (
              <RopeDropBadge strength={ropeDrop.strength} savings={ropeDropShown!.savings} />
            )}
            {eveningBetter && (
              <RopeDropEveningBadge
                openWait={ropeDropShown!.openWait}
                bestSlotWait={ropeDropShown!.trough}
              />
            )}
            {/* Beside the season badge, never instead of it: a ride can be out of season AND
                behind hoardings, and the status badge above says `CLOSED` for both. */}
            <WorksPeriodBadge
              worksPeriod={'worksPeriod' in attraction ? attraction.worksPeriod : null}
              todayIso={todayIso}
            />
            {'isSeasonal' in attraction && attraction.isSeasonal && (
              <SeasonalBadge
                seasonMonths={'seasonMonths' in attraction ? attraction.seasonMonths : null}
                isCurrentlyInSeason={
                  'isCurrentlyInSeason' in attraction ? attraction.isCurrentlyInSeason : null
                }
              />
            )}
            <AttractionMetaBadges
              minimumHeight={'minimumHeight' in attraction ? attraction.minimumHeight : null}
              mayGetWet={'mayGetWet' in attraction ? attraction.mayGetWet : null}
              compact
            />
            {/* `insideLink`: the whole card is an anchor, so the glossary link
                degrades to a tooltip rather than nesting an <a> inside one. */}
            <SingleRiderBadge
              hasSingleRider={'hasSingleRider' in attraction ? attraction.hasSingleRider : null}
              insideLink
            />
            <VirtualLineBadge
              hasVirtualLine={'hasVirtualLine' in attraction ? attraction.hasVirtualLine : null}
              insideLink
            />
            <FastPassBadge
              fastPass={'fastPass' in attraction ? attraction.fastPass : null}
              insideLink
            />
            {isOperatingOrUnknown &&
              attraction.queues
                ?.filter((q) => {
                  if (q.queueType === 'STANDBY') return false;
                  if (q.queueType === 'SINGLE_RIDER') {
                    if (!('waitTime' in q)) return false;
                    const wt = q.waitTime;
                    return wt !== null && wt !== undefined && typeof wt === 'number' && wt > 0;
                  }
                  return true;
                })
                .map((queue, i) => (
                  <QueueTypeBadge
                    key={`${queue.queueType}-${i}`}
                    queue={queue as import('@/lib/api/types').QueueDataItem}
                    timezone={effectiveTimezone}
                  />
                ))}
          </div>
          {/* A block of its own under the badges, never in the badge wrap: a sentence whose
              position depends on how many badges are present makes the card height
              unpredictable. The negative margin runs it past the right padding, which is only
              there for the corner circles. Compact form, because the probability sentence would
              wrap on a phone and the row shares its height through the subgrid. */}
          <div
            className={cn(
              'relative mt-[9px] empty:hidden',
              parkName
                ? rideLog
                  ? 'mr-[-116px]'
                  : 'mr-[-76px]'
                : rideLog
                  ? 'mr-[-76px]'
                  : 'mr-[-36px]',
              phoneRow && 'max-sm:mt-2 max-sm:mr-0'
            )}
          >
            <OutageNote
              outage={'outage' in attraction ? attraction.outage : undefined}
              timezone={effectiveTimezone}
              variant="compact"
            />
            {/* The neutral sibling, for a ride that has not run since the park last
                closed. Never beside an outage line, which says more, and only under
                a CLOSED badge — see `NotRunTodayNote`. */}
            {status === 'CLOSED' && !('outage' in attraction && attraction.outage) && (
              <NotRunTodayNote
                notRunToday={'notRunToday' in attraction ? attraction.notRunToday : undefined}
                timezone={effectiveTimezone}
                variant="compact"
              />
            )}
          </div>
        </div>

        {/* The 1fr row resolves to 0 in an intrinsic-height container, so min-h forces it open
           when there is a photo. It is also the strip the panels leave visible, so the framed
           layer lives here (docs/rules/card-photos-are-two-layers.md). `z-0` keeps it under the
           scrim. */}
        <div
          className={cn(
            'relative z-0',
            !hasBottomPanel && 'row-span-2',
            backgroundImage && 'sm:min-h-[220px]'
          )}
        >
          {backgroundImage && (
            <CardPhotoFrame
              objectPosition={objectPosition}
              src={backgroundImage}
              closed={!isOperatingOrUnknown}
              hideOnMobile
            />
          )}
        </div>

        {/* A phone row shows the wait time on its first line instead. */}
        {hasBottomPanel && (
          <div
            className={cn(
              'pk-panel-bot relative z-[3] -mt-4 overflow-hidden',
              phoneRow && 'max-sm:hidden'
            )}
            style={{
              padding: '12px 14px 13px',
              background: 'var(--pk-panel-highlight-bot), var(--pk-panel)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              borderTop: '1px solid var(--pk-panel-border)',
              boxShadow: 'inset 0 1px 0 var(--pk-panel-shine), inset 0 -1px 0 rgba(0,0,0,0.03)',
            }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: 'linear-gradient(225deg, rgba(255,255,255,0.14) 0%, transparent 40%)',
                mixBlendMode: 'overlay',
              }}
            />

            <div className="relative flex flex-col gap-2">
              <div className="flex items-stretch gap-3">
                {/* Always reserves a trend-pill slot, so cards with and without a trend keep their
                    sparkline rows aligned. */}
                <div className="flex shrink-0 flex-col gap-1" style={{ width: 88 }}>
                  <div className="flex items-baseline gap-1 leading-none">
                    <WaitTimeValue
                      minutes={roundWaitTo5(waitTime)}
                      className="text-[40px] font-extrabold tracking-[-0.02em] tabular-nums"
                    />
                    <span className="text-[12px] font-medium" style={{ color: 'var(--pk-text-3)' }}>
                      min
                    </span>
                  </div>
                  <div className="mt-1 min-h-[24px]">
                    {(() => {
                      const t = trend ?? { direction: 'stable' as const, delta: 0 };
                      return <TrendPill direction={t.direction} delta={t.delta} />;
                    })()}
                  </div>
                </div>

                <div className="relative min-w-0 flex-1" style={{ color: 'var(--pk-text-1)' }}>
                  <WaitTimeSparklineCard
                    history={history ?? []}
                    timezone={effectiveTimezone}
                    fallbackWaitTime={waitTime}
                  />
                </div>
              </div>

              {(stats?.peakWaitToday != null ||
                stats?.avgWaitToday != null ||
                bestSlot ||
                ropeDrop) && (
                <>
                  <div className="h-px w-full" style={{ background: 'var(--pk-panel-border)' }} />
                  {(stats?.peakWaitToday != null || stats?.avgWaitToday != null) && (
                    <div
                      className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] font-medium"
                      style={{ color: 'var(--pk-text-2)' }}
                    >
                      {stats?.peakWaitToday != null && (
                        <span className="flex items-center gap-1">
                          <ChartColumn
                            className="h-[11px] w-[11px] shrink-0"
                            style={{ color: 'var(--pk-text-3)' }}
                            aria-hidden="true"
                          />
                          <span>{t('cardHigh', { time: roundWaitTo5(stats.peakWaitToday) })}</span>
                        </span>
                      )}
                      {stats?.peakWaitToday != null && stats?.avgWaitToday != null && (
                        <span style={{ color: 'var(--pk-text-3)' }} aria-hidden="true">
                          ·
                        </span>
                      )}
                      {stats?.avgWaitToday != null && (
                        <span className="flex items-center gap-1">
                          <Clock
                            className="h-[11px] w-[11px] shrink-0"
                            style={{ color: 'var(--pk-text-3)' }}
                            aria-hidden="true"
                          />
                          <span>
                            {t('cardAvgToday', {
                              time: roundWaitTo5(stats.avgWaitToday),
                            })}
                          </span>
                        </span>
                      )}
                    </div>
                  )}
                  {/* Reserves the one-line row, so the client-rendered value (it needs the current
                      time) swaps in without a shift. `h-4` is that row's `text-xs` line. */}
                  {bestSlot && (
                    <Suspense fallback={<Skeleton className="h-4 w-28" />}>
                      <AttractionCardBestTime
                        bestSlot={bestSlot}
                        effectiveTimezone={effectiveTimezone}
                      />
                    </Suspense>
                  )}
                  {ropeDrop && (
                    <Suspense fallback={<Skeleton className="h-4 w-28" />}>
                      <AttractionCardRopeDrop
                        ropeDrop={ropeDrop}
                        effectiveTimezone={effectiveTimezone}
                      />
                    </Suspense>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </article>
    </Link>
  );
}
