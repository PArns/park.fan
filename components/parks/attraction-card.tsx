import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Crown, TrendingUp, TrendingDown, ChartColumn, Clock, Star, MapPin } from 'lucide-react';
import { cn, stripNewPrefix } from '@/lib/utils';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import { formatDistance } from '@/lib/utils/distance-utils';
import type { ParkAttraction, AttractionStatus, ParkStatus, BestVisitSlot } from '@/lib/api/types';
import type { ReactNode } from 'react';
import type { FavoriteAttraction } from '@/lib/api/favorites';
import { FavoriteStar } from '@/components/common/favorite-star';
import { ParkTime } from '@/components/common/park-time';
import { ParkStatusBadge } from './park-status-badge';
import { CrowdLevelBadge } from './crowd-level-badge';
import { SeasonalBadge } from './seasonal-badge';
import { QueueTypeBadge } from './queue-type-badge';
import { WaitTimeSparklineCard } from './wait-time-sparkline-card';

interface AttractionCardProps {
  attraction: ParkAttraction | FavoriteAttraction;
  parkPath?: string;
  parkStatus?: ParkStatus;
  backgroundImage?: string | null;
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

function minutesUntil(isoStr: string): number {
  return Math.round((new Date(isoStr).getTime() - Date.now()) / 60_000);
}

// ============================================================================
// Component
// ============================================================================

export function AttractionCard({
  attraction,
  parkPath,
  parkStatus,
  backgroundImage: propBackgroundImage,
  distance,
  showParkName = false,
  timezone,
}: AttractionCardProps) {
  const t = useTranslations('attractions');
  const tGeo = useTranslations('geo');
  const locale = useLocale();

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

  const stats = attraction.statistics;
  const history = stats?.history;

  // Short-term trend: delta between the last two history points (same interval
  // as the sparkline shows). Falls back to null when history is too short.
  const trendDelta = (() => {
    if (!isOperatingOrUnknown || waitTime === null) return null;
    if (!history || history.length < 2) return null;
    const last = history[history.length - 1];
    const prev = history[history.length - 2];
    if (typeof last?.waitTime !== 'number' || typeof prev?.waitTime !== 'number') return null;
    return last.waitTime - prev.waitTime;
  })();

  // Best-visit slot (only for OPERATING)
  const bestSlot = status === 'OPERATING' ? getBestSlot(attraction) : null;
  let bestTimeNode: ReactNode = null;
  if (bestSlot) {
    const mins = minutesUntil(bestSlot.time);
    const timeTag = () => (
      <strong className="font-bold">
        {effectiveTimezone ? (
          <ParkTime
            isoTime={bestSlot.time}
            parkTimezone={effectiveTimezone}
            locale={locale}
            showSuffix
          />
        ) : (
          new Date(bestSlot.time).toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit',
          })
        )}
      </strong>
    );
    if (mins <= 0) {
      bestTimeNode = bestSlot.rating === 'optimal' ? t('bestVisitNow') : t('bestVisitGoodNow');
    } else if (mins < 60) {
      bestTimeNode = t.rich('cardBestTimeInMinutesOnly', { time: timeTag, minutes: mins });
    } else {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      bestTimeNode =
        m === 0
          ? t.rich('cardBestTimeInHoursOnly', { time: timeTag, hours: h })
          : t.rich('cardBestTimeIn', { time: timeTag, hours: h, minutes: m });
    }
  }

  const hasSparkline = !!history && history.length >= 2;

  return (
    <Link
      href={href as '/europe/germany/rust/europa-park'}
      prefetch={false}
      className="group block h-full"
    >
      <article
        className={cn(
          'relative isolate flex h-full cursor-pointer flex-col overflow-hidden rounded-[20px] border border-black/[0.12] transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-1 dark:border-white/10',
          // Tall min-height only when the card has an image. In a CSS grid row
          // where *no* card has an image, no card provides this stretcher — so
          // the row collapses to the natural (short) height of its content.
          // h-full above keeps borders aligned in mixed rows.
          backgroundImage && 'min-h-[420px]'
        )}
        style={{
          boxShadow: 'var(--pk-card-shadow)',
          // Skip rendering/painting when the card is far off-screen.
          // contain-intrinsic-size: auto <height> keeps scrollbar stable
          // without locking the width (which the grid sets).
          contentVisibility: 'auto',
          containIntrinsicSize: backgroundImage ? 'auto 420px' : 'auto 120px',
        }}
      >
        {/* Photo */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {backgroundImage ? (
            <div className="pk-photo-zoom relative h-full w-full overflow-hidden">
              <div className="absolute inset-x-0 bottom-0" style={{ top: '50px' }}>
                <Image
                  src={backgroundImage}
                  alt={stripNewPrefix(attraction.name)}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  priority={false}
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    transform: 'scaleY(-1)',
                    transformOrigin: 'center top',
                    // Mask is applied BEFORE the flip: opaque at element top (= seam after flip)
                    // and fading to transparent toward element bottom (= top of card after flip).
                    maskImage: 'linear-gradient(to bottom, black 0%, transparent 16%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 16%)',
                  }}
                >
                  <Image
                    src={backgroundImage}
                    alt=""
                    aria-hidden="true"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    priority={false}
                  />
                </div>
              </div>
            </div>
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
          className="relative z-[3] shrink-0 overflow-hidden"
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
                  const key = `countries.${rawCountry.toLowerCase().replace(/\s+/g, '-')}`;
                  const translated = tGeo(key);
                  return translated !== key ? translated : rawCountry;
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

          {/* Badges */}
          <div className="relative mt-[9px] flex flex-wrap items-center gap-[6px]">
            <ParkStatusBadge status={status as ParkStatus} />
            {isOperatingOrUnknown && crowdLevel && (
              <CrowdLevelBadge
                level={
                  crowdLevel as 'very_low' | 'low' | 'moderate' | 'high' | 'very_high' | 'extreme'
                }
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

        {/* Photo spacer — gives the image room to breathe when there is one;
           collapses to 0 when there's no image so rows without images shrink. */}
        <div className={cn('relative z-[2] flex-1', backgroundImage && 'min-h-[80px]')} />

        {/* Bottom glass panel — only rendered when we have a live wait time */}
        {isOperatingOrUnknown && waitTime !== null && (
          <div
            className="relative z-[3] shrink-0 overflow-hidden"
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
                {/* Wait-time column */}
                <div className="flex shrink-0 flex-col gap-1" style={{ width: 88 }}>
                  <div className="flex items-baseline gap-1 leading-none">
                    <span
                      className="text-[40px] font-extrabold tracking-[-0.02em] tabular-nums"
                      style={{ color: 'var(--pk-text-1)' }}
                    >
                      {waitTime}
                    </span>
                    <span className="text-[12px] font-medium" style={{ color: 'var(--pk-text-3)' }}>
                      min
                    </span>
                  </div>
                  {trendDelta !== null && trendDelta !== 0 && (
                    <span
                      className={cn(
                        'mt-1 inline-flex w-fit items-center gap-0.5 rounded-full px-1.5 py-[2px] text-[10.5px] leading-none font-semibold',
                        trendDelta > 0
                          ? 'bg-trend-up/20 text-trend-up border-trend-up/35 border'
                          : 'bg-trend-down/20 text-trend-down border-trend-down/35 border'
                      )}
                    >
                      {trendDelta > 0 ? (
                        <TrendingUp className="h-[11px] w-[11px]" />
                      ) : (
                        <TrendingDown className="h-[11px] w-[11px]" />
                      )}
                      {trendDelta > 0 ? '+' : ''}
                      {trendDelta} min
                    </span>
                  )}
                </div>

                {/* Sparkline */}
                {hasSparkline ? (
                  <div className="relative min-w-0 flex-1" style={{ color: 'var(--pk-text-1)' }}>
                    <WaitTimeSparklineCard history={history!} timezone={effectiveTimezone} />
                  </div>
                ) : (
                  <div className="flex-1" />
                )}
              </div>

              {/* Divider + stats rows */}
              {(stats?.peakWaitToday != null || stats?.avgWaitToday != null || bestTimeNode) && (
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
                          <span>{t('cardHigh', { time: stats.peakWaitToday })}</span>
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
                              time: Math.round(stats.avgWaitToday),
                            })}
                          </span>
                        </span>
                      )}
                    </div>
                  )}
                  {bestTimeNode && (
                    <div className="flex items-center gap-1 text-[11.5px] font-medium text-amber-500 dark:text-amber-400">
                      <Star
                        className="h-[11px] w-[11px] shrink-0 fill-current"
                        aria-hidden="true"
                      />
                      <span>{bestTimeNode}</span>
                    </div>
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
