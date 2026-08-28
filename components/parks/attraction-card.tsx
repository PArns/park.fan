import { Suspense } from 'react';
import { Link } from '@/i18n/navigation';
import { CardPhoto, CardPhotoFrame } from '@/components/parks/card-photo';
import { useTranslations } from 'next-intl';
import { Crown, ChartColumn, Clock, MapPin } from 'lucide-react';
import { cn, stripNewPrefix } from '@/lib/utils';
import { roundWaitDeltaTo5, roundWaitTo5 } from '@/lib/utils/wait-time';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { formatDistance } from '@/lib/utils/distance-utils';
import type {
  ParkAttraction,
  AttractionStatus,
  ParkStatus,
  BestVisitSlot,
  RopeDropInfo,
} from '@/lib/api/types';
import type { FavoriteAttraction } from '@/lib/api/favorites';
import { FavoriteStar } from '@/components/common/favorite-star';
import { AttractionCardBestTime } from '@/components/parks/attraction-card-best-time';
import { AttractionCardRopeDrop } from '@/components/parks/attraction-card-rope-drop';
import { Skeleton } from '@/components/ui/skeleton';
import { WaitTimeValue } from '@/components/common/wait-time-value';
import { isEveningBetter, troughWait } from '@/lib/utils/rope-drop';
import { ParkStatusBadge } from './park-status-badge';
import { CrowdLevelBadge } from './crowd-level-badge';
import { RopeDropBadge, RopeDropEveningBadge } from './rope-drop-badge';
import { SeasonalBadge } from './seasonal-badge';
import { QueueTypeBadge } from './queue-type-badge';
import { FastPassBadge } from '@/components/parks/fast-pass-badge';
import { SingleRiderBadge } from '@/components/parks/single-rider-badge';
import { AttractionMetaBadges } from './attraction-meta-badges';
import { WaitTimeSparklineCard } from './wait-time-sparkline-card';
import { TrendPill } from './trend-pill';

interface AttractionCardProps {
  attraction: ParkAttraction | FavoriteAttraction;
  parkPath?: string;
  parkStatus?: ParkStatus;
  backgroundImage?: string | null;
  /**
   * Where the photo is cropped from — the image's focal point, resolved by the
   * SERVER (`enrichAttractionsWithImages` / `getCardObjectPosition`) and handed in.
   * The card cannot look it up itself without importing the media manifest, and it
   * renders inside Client Components. Defaults to the historical top crop.
   */
  objectPosition?: string;
  distance?: number;
  showParkName?: boolean;
  timezone?: string;
}

// ---------- helpers ----------

function getWaitTime(attraction: ParkAttraction | FavoriteAttraction): number | null {
  const standby = attraction.queues?.find((q) => q.queueType === 'STANDBY');
  if (!standby) return null;
  return 'waitTime' in standby ? (standby.waitTime ?? null) : null;
}

function getStatus(
  attraction: ParkAttraction | FavoriteAttraction,
  parkStatus?: ParkStatus
): AttractionStatus | 'UNKNOWN' {
  if (parkStatus === 'UNKNOWN') return 'UNKNOWN';
  if (parkStatus && parkStatus !== 'OPERATING') return 'CLOSED';
  // Park-aware status from the API — the only source that knows the park has
  // closed. Queue rows keep their last value when a source stops publishing at
  // closing time, so they would still read OPERATING hours later. Cards without
  // a `parkStatus` prop (favorites) depend on this.
  if ('effectiveStatus' in attraction && attraction.effectiveStatus) {
    return attraction.effectiveStatus as AttractionStatus;
  }
  const standby = attraction.queues?.find((q) => q.queueType === 'STANDBY');
  if (standby && 'status' in standby) {
    return (
      (standby.status as AttractionStatus) ?? (attraction.status as AttractionStatus) ?? 'CLOSED'
    );
  }
  return (attraction.status as AttractionStatus) ?? 'CLOSED';
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

// ============================================================================
// Component
// ============================================================================

export function AttractionCard({
  attraction,
  parkPath,
  parkStatus,
  backgroundImage: propBackgroundImage,
  objectPosition: propObjectPosition,
  distance,
  showParkName = false,
  timezone,
}: AttractionCardProps) {
  const t = useTranslations('attractions');
  const tGeo = useTranslations('geo');

  const status = getStatus(attraction, parkStatus);
  const isOperatingOrUnknown = status === 'OPERATING' || status === 'UNKNOWN';
  const waitTime = isOperatingOrUnknown ? getWaitTime(attraction) : null;
  const effectiveTimezone =
    timezone ??
    ('park' in attraction && attraction.park?.timezone ? attraction.park.timezone : undefined);
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

  const stats = attraction.statistics;
  const history = stats?.history;

  // Short-term trend — compares last 2 data points against the 2 before them.
  // Fixed window of 2 prevents comparing against hours-old data when history
  // is sparse (e.g. 8 points over 100 minutes would otherwise show total
  // change rather than recent movement).
  const trend: { direction: 'up' | 'down' | 'stable'; delta: number } | null = (() => {
    if (!isOperatingOrUnknown || waitTime === null) return null;
    if (!history || history.length < 4) return null;
    const WINDOW = 2;
    const recent = history.slice(-WINDOW);
    const prior = history.slice(-WINDOW * 2, -WINDOW);
    const avg = (pts: typeof history) =>
      pts.reduce((s, p) => s + (typeof p.waitTime === 'number' ? p.waitTime : 0), 0) / pts.length;
    // A delta, not a wait time — the signed rounder, or every falling queue
    // reads as "stable" (see `roundWaitDeltaTo5`).
    const delta = roundWaitDeltaTo5(avg(recent) - avg(prior));
    if (delta === 0) {
      return { direction: 'stable', delta: 0 };
    }
    return { direction: delta > 0 ? 'up' : 'down', delta };
  })();

  // Best-visit slot (only for OPERATING). The "in X min" text is time-relative, so it's
  // rendered by the client <AttractionCardBestTime> (cacheComponents-safe).
  const bestSlot = status === 'OPERATING' ? getBestSlot(attraction) : null;

  const ropeDropData = getRopeDrop(attraction);
  const ropeDrop = ropeDropData?.worth ? ropeDropData : null;
  const eveningBetter = ropeDropData !== null && !ropeDrop && isEveningBetter(ropeDropData);

  // The bottom glass panel (wait time + sparkline) only exists when there is a
  // live wait time. Without it row 3 is empty rather than covered, so the photo
  // the visitor sees runs all the way down — and the framed photo layer has to
  // claim that row too, or its lower edge sits exposed mid-card as a crop seam.
  const hasBottomPanel = isOperatingOrUnknown && waitTime !== null;

  return (
    <Link
      href={href as '/europe/germany/rust/europa-park'}
      prefetch={false}
      className="group row-span-3 grid [grid-template-rows:subgrid]"
    >
      <article
        className={cn(
          'pk-card-fx relative isolate row-span-3 grid cursor-pointer [grid-template-rows:subgrid] overflow-hidden rounded-[20px] transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-1'
        )}
        data-card-fx
        style={{
          boxShadow: 'var(--pk-card-shadow)',
        }}
      >
        {/* Photo — hidden below `sm` (cards collapse on phones, matching the `sm:min-h-[220px]`
            spacer below and ParkCard), so only the gradient placeholder shows there. */}
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

        {/* Scrim */}
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              'linear-gradient(180deg, var(--pk-scrim-top) 0%, transparent 32%, transparent 56%, var(--pk-scrim-bot) 100%)',
          }}
        />

        {/* Favorite star */}
        {attraction.id && (
          <div
            className="absolute top-3 right-3 z-[4] h-[34px] w-[34px] rounded-full"
            style={{
              background: 'var(--pk-fav-bg)',
              border: '1px solid var(--pk-fav-border)',
              boxShadow: 'var(--pk-fav-shadow)',
            }}
          >
            <FavoriteStar
              type="attraction"
              id={attraction.id}
              name={stripNewPrefix(attraction.name)}
              size="md"
              noCircle
              variant="glass"
              className="h-full w-full"
            />
          </div>
        )}

        {/* Top glass panel */}
        <div
          className="pk-panel-top relative z-[3] -mb-4 overflow-hidden"
          style={{
            padding: '14px 52px 13px 16px',
            background: 'var(--pk-panel-highlight-top), var(--pk-panel)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--pk-panel-border)',
            boxShadow: 'inset 0 1px 0 var(--pk-panel-shine), inset 0 -1px 0 rgba(0,0,0,0.06)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 36%)',
              mixBlendMode: 'overlay',
            }}
          />

          {/* Attraction name — CSS-only truncate + native title attribute keeps
              this whole card surface server-rendered (no useLayoutEffect, no
              Radix Tooltip hydration × N cards). */}
          {(() => {
            const displayName = stripNewPrefix(attraction.name);
            const isHeadliner = 'isHeadliner' in attraction && attraction.isHeadliner;
            const headlinerHint = `${t('headliner.title')} — ${t('headliner.description')}`;
            return (
              <h3
                className="relative flex items-center gap-1.5 text-[16px] leading-[1.2] font-extrabold tracking-[-0.022em]"
                style={{ color: 'var(--pk-text-1)' }}
              >
                {isHeadliner && (
                  <span title={headlinerHint} aria-label={t('headliner.title')}>
                    <Crown className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                  </span>
                )}
                <span className="block min-w-0 flex-1 truncate" title={displayName}>
                  {displayName}
                </span>
              </h3>
            );
          })()}

          {/* Location line: pin · park · city, country · distance */}
          {(() => {
            const park = 'park' in attraction ? attraction.park : null;
            const parkName =
              showParkName && park && 'name' in park ? stripNewPrefix(park.name) : null;
            const city = park && 'city' in park ? park.city : null;
            const rawCountry = park && 'country' in park ? park.country : null;
            const country = rawCountry
              ? (() => {
                  return translateGeoSlug(tGeo, 'countries', rawCountry, rawCountry);
                })()
              : null;
            const place = [city, country].filter(Boolean).join(', ');
            const pieces = [
              parkName,
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

          {/* Badges — CSS subgrid on the outer grid equalizes header heights
              across all cards in a row; no artificial min-h needed. */}
          <div className="relative mt-[9px] flex flex-wrap items-start gap-[6px]">
            <ParkStatusBadge status={status as ParkStatus} />
            {isOperatingOrUnknown && crowdLevel && (
              <CrowdLevelBadge
                level={
                  crowdLevel as 'very_low' | 'low' | 'moderate' | 'high' | 'very_high' | 'extreme'
                }
              />
            )}
            {/* Rope drop is planning info — shown regardless of live status (it
                matters most before the park opens). */}
            {ropeDrop && <RopeDropBadge strength={ropeDrop.strength} savings={ropeDrop.savings} />}
            {eveningBetter && (
              <RopeDropEveningBadge
                openWait={ropeDropData!.openWait}
                bestSlotWait={troughWait(ropeDropData!)}
              />
            )}
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
        </div>

        {/* Photo spacer — the 1fr row resolves to 0 in an intrinsic-height
           container; min-h forces it open when there is a background image.
           It is also the strip of photo the panels leave visible, so the framed
           layer lives in here: that is what gives `object-position` a box wider
           than the picture and therefore a working Y axis. Stays at `z-0` so the
           scrim (z-1) keeps darkening it. */}
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

        {/* Bottom glass panel — only rendered when we have a live wait time */}
        {hasBottomPanel && (
          <div
            className="pk-panel-bot relative z-[3] -mt-4 overflow-hidden"
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
              {/* Top row: wait time column + sparkline */}
              <div className="flex items-stretch gap-3">
                {/* Wait-time column — always reserves a trend-pill slot so
                    cards with and without live trend data share the same
                    column height (keeps sparkline row heights aligned). */}
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

                {/* Sparkline */}
                {hasBottomPanel ? (
                  <div className="relative min-w-0 flex-1" style={{ color: 'var(--pk-text-1)' }}>
                    <WaitTimeSparklineCard
                      history={history ?? []}
                      timezone={effectiveTimezone}
                      fallbackWaitTime={waitTime}
                    />
                  </div>
                ) : (
                  <div className="flex-1" />
                )}
              </div>

              {/* Divider + stats rows */}
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
                  {/* Skeleton reserves the single-line "best time in X" row so the
                      client-rendered value (needs current time) swaps in without shifting. */}
                  {bestSlot && (
                    <Suspense fallback={<Skeleton className="h-3.5 w-28" />}>
                      <AttractionCardBestTime
                        bestSlot={bestSlot}
                        effectiveTimezone={effectiveTimezone}
                      />
                    </Suspense>
                  )}
                  {ropeDrop && (
                    <Suspense fallback={<Skeleton className="h-3.5 w-28" />}>
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
