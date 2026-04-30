import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { MapPin, Activity, Clock, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { FavoriteStar } from '@/components/common/favorite-star';
import { ParkTime } from '@/components/common/park-time';
import { cn } from '@/lib/utils';
import { formatDistance } from '@/lib/utils/distance-utils';
import type { ParkStatus, CrowdLevel } from '@/lib/api/types';
import { useTranslations, useLocale } from 'next-intl';
import { getScheduleMessage } from '@/lib/utils/schedule-utils';
import type { ScheduleSummary } from '@/lib/api/types';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';

// Lazily loaded server-side only — avoids bundling `fs` into the client
/* eslint-disable @typescript-eslint/no-require-imports */
const serverAssets =
  typeof window === 'undefined'
    ? (require('@/lib/utils/park-assets') as {
        getParkBackgroundImage: (slug: string) => string | null;
      })
    : null;
/* eslint-enable @typescript-eslint/no-require-imports */

interface ParkCardProps {
  name: string;
  slug: string;
  city: string;
  country: string;
  /** Direct frontend URL. Optional when `url` is provided. */
  href?: string;
  /** API URL (e.g. /v1/parks/…) — auto-converted to a frontend URL. */
  url?: string;
  status?: ParkStatus;
  crowdLevel?: CrowdLevel;
  averageWaitTime?: number;
  /** Analytics object — alternative to averageWaitTime + crowdLevel as direct props. */
  analytics?: {
    avgWaitTime?: number;
    crowdLevel?: string;
    occupancy?: number;
  };
  operatingAttractions?: number;
  totalAttractions?: number;
  variant?: 'compact' | 'detailed' | 'hero';
  showBackground?: boolean;
  /** Distance as a number (meters, auto-formatted) or pre-formatted string. */
  distance?: number | string;
  className?: string;
  /** Park UUID for the favorites star. */
  parkId?: string;
  /** Alias for parkId — accepted for callers using the nearby/favorites data shape. */
  id?: string;
  backgroundImage?: string | null;
  timezone?: string;
  todaySchedule?: ScheduleSummary;
  nextSchedule?: ScheduleSummary;
  hasOperatingSchedule?: boolean;
  /** Show a "Nearest open" badge. Only rendered when the park is OPERATING. */
  highlightAsNearestOpen?: boolean;
  /** Translate the raw country name via geo translations (for nearby/favorites data). */
  translateCountry?: boolean;
  /** Accepted for API-shape compatibility — not used in rendering. */
  continent?: string;
}

export function ParkCard({
  name,
  slug,
  city,
  country,
  href,
  url,
  status,
  crowdLevel,
  averageWaitTime: _averageWaitTime,
  analytics,
  operatingAttractions,
  totalAttractions,
  variant: _variant,
  showBackground = true,
  distance,
  className,
  parkId,
  id,
  backgroundImage: propBackgroundImage,
  timezone,
  todaySchedule,
  nextSchedule,
  hasOperatingSchedule = true,
  highlightAsNearestOpen = false,
  translateCountry = false,
  continent: _continent,
}: ParkCardProps) {
  const tCommon = useTranslations('common');
  const tNearby = useTranslations('nearby');
  const tGeo = useTranslations('geo');
  const tCard = useTranslations('parkCard');
  const locale = useLocale();

  const effectiveHref = href ?? (url ? convertApiUrlToFrontendUrl(url) : '/');
  const effectiveParkId = parkId ?? id;
  const effectiveCrowdLevel = crowdLevel ?? (analytics?.crowdLevel as CrowdLevel | undefined);

  const displayCountry = translateCountry
    ? (() => {
        const normalized = country.toLowerCase().replace(/\s+/g, '-');
        const key = `countries.${normalized}`;
        return tGeo.has(key) ? tGeo(key as string) : country;
      })()
    : country;

  let backgroundImage: string | null = null;
  if (propBackgroundImage !== undefined) {
    backgroundImage = propBackgroundImage;
  } else if (showBackground && serverAssets) {
    backgroundImage = serverAssets.getParkBackgroundImage(slug);
  }

  const isOpen = status === 'OPERATING';
  const isOperatingOrUnknown = status === 'OPERATING' || status === 'UNKNOWN';
  const isInMaintenance =
    !!status && status !== 'OPERATING' && status !== 'CLOSED' && status !== 'UNKNOWN';

  const scheduleInfo = getScheduleMessage(
    todaySchedule,
    nextSchedule,
    timezone,
    status,
    isInMaintenance,
    locale,
    tNearby,
    tCommon,
    hasOperatingSchedule
  );

  // Closing time for open parks: remaining duration only (absolute time rendered
  // by ParkTime). `Date.now()` here is the server render timestamp, which is
  // what we want — this component is server-rendered and the value is fresh
  // on every request.
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const closingRemaining =
    isOpen && todaySchedule?.closingTime
      ? (() => {
          try {
            const diff = new Date(todaySchedule.closingTime).getTime() - nowMs;
            if (diff <= 0) return null;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            return hours > 0 ? `${hours} ${tCommon('hours')}. ${minutes} min.` : `${minutes} min.`;
          } catch {
            return null;
          }
        })()
      : null;

  const hasClosingTime = !!(todaySchedule?.closingTime && timezone && closingRemaining);
  const hasStats = (operatingAttractions != null && totalAttractions != null) || hasClosingTime;

  return (
    <Link
      href={effectiveHref as '/europe/germany/rust/europa-park'}
      prefetch={isOperatingOrUnknown}
      className={cn('row-span-3 grid [grid-template-rows:subgrid]', className)}
    >
      <article
        className={cn(
          'group relative isolate row-span-3 grid cursor-pointer [grid-template-rows:subgrid] overflow-hidden rounded-[20px] border border-black/[0.12] transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-1 dark:border-white/10'
        )}
        style={{
          boxShadow: 'var(--pk-card-shadow)',
        }}
      >
        {/* Photo — z-0, inner div carries the hover scale */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {backgroundImage ? (
            <div className="pk-photo-zoom relative h-full w-full overflow-hidden">
              {/*
                Photo container starts exactly at glass-header bottom (~100px).
                The photo's TOP edge is the seam. The reflection (scaleY-1 around
                the container top = seam) extends upward through the glass area.
              */}
              <div className="absolute inset-x-0 bottom-0" style={{ top: '50px' }}>
                {/* Main photo — top edge at seam, fills downward */}
                <Image
                  src={backgroundImage}
                  alt={name}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  priority={false}
                />
                {/* Reflection — same image flipped around the container top (= seam).
                   Mask applies BEFORE the flip: opaque at element top (= seam after flip)
                   fading to transparent toward the bottom (= top of card after flip). */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    transform: 'scaleY(-1)',
                    transformOrigin: 'center top',
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

        {/* Scrim — z-1 */}
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              'linear-gradient(180deg, var(--pk-scrim-top) 0%, transparent 32%, transparent 56%, var(--pk-scrim-bot) 100%)',
          }}
        />

        {/* Favorite button — z-4 */}
        {effectiveParkId && (
          <div
            className="absolute top-3 right-3 z-[4] h-[34px] w-[34px] rounded-full"
            style={{
              background: 'var(--pk-fav-bg)',
              border: '1px solid var(--pk-fav-border)',
              boxShadow: 'var(--pk-fav-shadow)',
            }}
          >
            <FavoriteStar
              type="park"
              id={effectiveParkId}
              name={name}
              size="md"
              noCircle
              variant="glass"
              className="h-full w-full"
            />
          </div>
        )}

        {/* Top glass panel — z-3 */}
        <div
          className="relative z-[3] -mb-4 overflow-hidden"
          style={{
            padding: '14px 52px 13px 16px',
            background: 'var(--pk-panel-highlight-top), var(--pk-panel)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--pk-panel-border)',
            boxShadow: 'inset 0 1px 0 var(--pk-panel-shine), inset 0 -1px 0 rgba(0,0,0,0.06)',
          }}
        >
          {/* Diagonal shine overlay */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 36%)',
              mixBlendMode: 'overlay',
            }}
          />

          {/* Park name with coaster track icon */}
          <div
            className="relative text-[17px] leading-[1.2] font-extrabold tracking-[-0.022em]"
            style={{ color: 'var(--pk-text-1)' }}
          >
            <span
              className="overflow-hidden"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {name}
            </span>
          </div>

          {/* Location + optional distance */}
          <div
            className="relative mt-[3px] flex items-center gap-1 text-[12px]"
            style={{ color: 'var(--pk-text-2)' }}
          >
            <MapPin
              className="h-[11px] w-[11px] shrink-0"
              style={{ color: 'var(--pk-text-3)' }}
              aria-hidden="true"
            />
            <span>
              {city}, {displayCountry}
            </span>
            {distance != null && (
              <>
                <span style={{ color: 'var(--pk-text-3)' }}>·</span>
                <span>{typeof distance === 'number' ? formatDistance(distance) : distance}</span>
              </>
            )}
          </div>

          {/* Badges row */}
          <div className="relative mt-[9px] flex flex-wrap items-center gap-[6px]">
            {status && <ParkStatusBadge status={status} />}
            {isOpen && effectiveCrowdLevel && <CrowdLevelBadge level={effectiveCrowdLevel} />}
            {highlightAsNearestOpen && isOpen && (
              <Badge className="badge-primary text-xs">{tNearby('nearestOpenBadge')}</Badge>
            )}
          </div>
        </div>

        {/* Photo spacer — the 1fr row resolves to 0 in an intrinsic-height
           container; min-h forces it open when there is a background image. */}
        <div className={cn('relative z-[2]', backgroundImage && 'min-h-[220px]')} />

        {/* Footer glass panel — z-3 */}
        <div
          className="relative z-[3] -mt-4 overflow-hidden"
          style={{
            padding: '13px 16px 14px',
            background: 'var(--pk-panel-highlight-bot), var(--pk-panel)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            borderTop: '1px solid var(--pk-panel-border)',
            boxShadow: 'inset 0 1px 0 var(--pk-panel-shine), inset 0 -1px 0 rgba(0,0,0,0.03)',
          }}
        >
          {/* Diagonal shine overlay */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'linear-gradient(225deg, rgba(255,255,255,0.14) 0%, transparent 40%)',
              mixBlendMode: 'overlay',
            }}
          />

          {isOpen ? (
            /* Open footer — stats strip only */
            hasStats ? (
              <div
                className="relative flex items-center gap-[10px] overflow-hidden text-[11.5px] font-medium"
                style={{
                  color: 'var(--pk-text-2)',
                  whiteSpace: 'nowrap',
                }}
              >
                {operatingAttractions != null && totalAttractions != null && (
                  <span className="flex items-center gap-1">
                    <Activity
                      className="h-[11px] w-[11px] shrink-0"
                      style={{ color: 'var(--pk-text-3)' }}
                      aria-hidden="true"
                    />
                    <b className="font-bold" style={{ color: 'var(--pk-text-1)' }}>
                      {operatingAttractions}
                    </b>
                    /{totalAttractions} {tCommon('operating')}
                  </span>
                )}

                {operatingAttractions != null && hasClosingTime && (
                  <span style={{ color: 'var(--pk-text-3)' }} aria-hidden="true">
                    ·
                  </span>
                )}

                {hasClosingTime && todaySchedule?.closingTime && timezone && (
                  <span className="flex items-center gap-1">
                    <Clock
                      className="h-[11px] w-[11px] shrink-0"
                      style={{ color: 'var(--pk-text-3)' }}
                      aria-hidden="true"
                    />
                    {tCard('until')}{' '}
                    <b className="font-bold" style={{ color: 'var(--pk-text-1)' }}>
                      <ParkTime
                        isoTime={todaySchedule.closingTime}
                        parkTimezone={timezone}
                        locale={locale}
                        showSuffix
                      />
                    </b>
                    <span style={{ color: 'var(--pk-text-3)' }}>
                      ({tCard('closingIn')} {closingRemaining})
                    </span>
                  </span>
                )}
              </div>
            ) : null
          ) : (
            /* Closed footer */
            <div
              className="relative flex items-center gap-[6px] text-[12px]"
              style={{ color: 'var(--pk-text-2)' }}
            >
              <Calendar
                className="h-[13px] w-[13px] shrink-0"
                style={{ color: 'var(--pk-text-3)' }}
                aria-hidden="true"
              />
              <span>
                {scheduleInfo?.icon === 'opening' ? `${tNearby('opens')}: ` : ''}
                {scheduleInfo?.icon === 'offseason' ? (
                  <>
                    <GlossaryTermLink termId="offseason" tooltipOnly>
                      {tNearby('offseason')}
                    </GlossaryTermLink>
                    {scheduleInfo.offseasonDetails}
                  </>
                ) : scheduleInfo?.icon === 'opening' && scheduleInfo.openingTimeISO && timezone ? (
                  <>
                    {scheduleInfo.dayPrefix}
                    <strong className="font-bold" style={{ color: 'var(--pk-text-1)' }}>
                      <ParkTime
                        isoTime={scheduleInfo.openingTimeISO}
                        parkTimezone={timezone}
                        locale={locale}
                        showSuffix
                      />
                    </strong>
                    {scheduleInfo.remainingText && (
                      <span style={{ color: 'var(--pk-text-3)' }}>
                        {' '}
                        ({scheduleInfo.remainingText})
                      </span>
                    )}
                  </>
                ) : (
                  (scheduleInfo?.message ?? tCommon('closed'))
                )}
              </span>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
