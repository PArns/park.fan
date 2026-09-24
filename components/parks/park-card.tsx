import { Suspense } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { FavoriteStar } from '@/components/common/favorite-star';
import { ParkCardScheduleFooter } from '@/components/parks/park-card-schedule-footer';
import { CardPhoto, CardPhotoFrame } from '@/components/parks/card-photo';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDistance } from '@/lib/utils/distance-utils';
import type { ParkStatus, CrowdLevel } from '@/lib/api/types';
import { useTranslations } from 'next-intl';
import type { ScheduleSummary } from '@/lib/api/types';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import { translateGeoSlug } from '@/lib/utils/geo-translate';

/** What the phone row paints: a 64 × 40 thumbnail. */
const ROW_THUMB_SIZES = '64px';
/**
 * The card's own photo layers claim the row's 64 px for the phone segment. The card is
 * `display:none` there, and with the default `100vw` both would pick a different srcset
 * candidate than the row beside them: two requests for one picture instead of one.
 */
const CARD_PHOTO_SIZES = '(max-width: 640px) 64px, (max-width: 1024px) 50vw, 33vw';

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
  /**
   * Where the photo is cropped from — the image's focal point, resolved by the
   * SERVER (`enrichParksWithImages` / `getCardObjectPosition`) and handed in. The
   * card cannot look it up itself without importing the media manifest, and this
   * card renders inside Client Components. Defaults to the historical top crop.
   */
  objectPosition?: string;
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
  slug: _slug,
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
  objectPosition: propObjectPosition,
  timezone,
  todaySchedule,
  nextSchedule,
  hasOperatingSchedule = true,
  highlightAsNearestOpen = false,
  translateCountry = false,
  continent: _continent,
}: ParkCardProps) {
  const tNearby = useTranslations('nearby');
  const tGeo = useTranslations('geo');

  const effectiveHref = href ?? (url ? convertApiUrlToFrontendUrl(url) : '/');
  const effectiveParkId = parkId ?? id;
  const effectiveCrowdLevel = crowdLevel ?? (analytics?.crowdLevel as CrowdLevel | undefined);

  const displayCountry = translateCountry
    ? (() => {
        return translateGeoSlug(tGeo, 'countries', country, country);
      })()
    : country;

  // The photo and where to crop it are handed in, never looked up here. This card
  // is rendered by Client Components (the live hub grid, nearby, favorites), and a
  // media-database lookup inside it puts the whole 107 KB catalog in their bundle.
  // Server callers use `getParkBackgroundImage` / `getCardObjectPosition`; the API
  // routes attach both via `enrichParksWithImages`.
  const backgroundImage = showBackground ? (propBackgroundImage ?? null) : null;

  const isOpen = status === 'OPERATING';
  const isOperatingOrUnknown = status === 'OPERATING' || status === 'UNKNOWN';
  const isInMaintenance =
    !!status && status !== 'OPERATING' && status !== 'CLOSED' && status !== 'UNKNOWN';

  const locationLine = (
    <>
      <span className="min-w-0 truncate">
        {city}, {displayCountry}
      </span>
      {distance != null && (
        <>
          <span style={{ color: 'var(--pk-text-3)' }}>·</span>
          <span className="shrink-0">
            {typeof distance === 'number' ? formatDistance(distance) : distance}
          </span>
        </>
      )}
    </>
  );

  const badges = (
    <>
      {status && <ParkStatusBadge status={status} />}
      {isOpen && effectiveCrowdLevel && <CrowdLevelBadge level={effectiveCrowdLevel} />}
    </>
  );
  const showNearestOpen = highlightAsNearestOpen && isOpen;

  const scheduleFooter = (compact: boolean) => (
    <ParkCardScheduleFooter
      isOpen={isOpen}
      operatingAttractions={operatingAttractions}
      totalAttractions={totalAttractions}
      timezone={timezone}
      status={status}
      isInMaintenance={isInMaintenance}
      todaySchedule={todaySchedule}
      nextSchedule={nextSchedule}
      hasOperatingSchedule={hasOperatingSchedule}
      compact={compact}
    />
  );

  return (
    <Link
      href={effectiveHref as '/europe/germany/rust/europa-park'}
      prefetch={false}
      className={cn('row-span-3 grid [grid-template-rows:subgrid]', className)}
    >
      {/* Phones get a row, everything from `sm` up the panelled card — the same split as
          `BlogPostRow` (docs/rules/a-blog-card-is-a-row-on-phones.md). Below `sm` the card
          shows no photo, so it was two glass panels, 146 px, one per row. Two markups rather
          than one responsive tree, because the glass is a block of inline styles that no
          breakpoint can switch off. Inside the same `Link`, so every caller and every grid
          that spans this card over three rows gets the row without a change. */}
      <div
        data-park-card-row
        className="group bg-card hover:bg-accent/30 border-border/60 relative row-span-3 flex items-start gap-3 rounded-xl border p-2 transition-colors sm:hidden"
      >
        {backgroundImage && (
          // The whole thumbnail is the visible box, so the focal point is applied to it
          // directly, and it stays wider than 1.5 (64 × 40 = 1.6) so a 4:3 photo keeps some
          // vertical range for it (docs/rules/card-photos-are-two-layers.md). 64 px wide, not
          // the blog row's 96: at 360 px the badge line needs 228 px for "Geöffnet" and
          // "Sehr niedrig", and a 96 px thumbnail leaves 204.
          <div className="relative mt-0.5 h-10 w-16 shrink-0 overflow-hidden rounded-lg">
            <Image
              src={backgroundImage}
              alt={name}
              fill
              sizes={ROW_THUMB_SIZES}
              className={cn('object-cover', !isOperatingOrUnknown && 'pk-photo-closed')}
              // `top` / `center` are valid CSS as they stand.
              style={{ objectPosition: propObjectPosition ?? 'top' }}
            />
          </div>
        )}
        {/* Four fixed lines: name 18 · 2 · location 16 · 4 · badges 22 · 4 · time 16, so
            98 px with the padding and 100 with the border. The time has a line of its own
            because next to two badges it does not fit at 360 px, and a line that wraps only
            sometimes gives the rows of one list different heights. `ParkCardNearbySkeleton`
            draws the same lines. */}
        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              'text-foreground group-hover:text-primary truncate text-[15px] leading-[18px] font-bold transition-colors',
              effectiveParkId && 'pr-8'
            )}
          >
            {name}
          </h3>
          <div
            className={cn(
              'text-muted-foreground mt-0.5 flex min-w-0 items-center gap-1 text-xs leading-4',
              effectiveParkId && 'pr-8'
            )}
          >
            <MapPin className="h-[11px] w-[11px] shrink-0 opacity-70" aria-hidden="true" />
            {locationLine}
          </div>
          {/* `min-h` is one badge: on the region pages the badges arrive with the client
              batch call, after the row is painted, and must not grow it. */}
          <div className="mt-1 flex min-h-[22px] flex-wrap items-center gap-1.5">{badges}</div>
          {/* "Nearest open" is text on the time line here, not a third badge: three badges
              wrap to a second line at 390 px and the row would outgrow its 100 px. */}
          <div className="mt-1 flex h-4 min-w-0 items-center gap-1.5">
            <Suspense fallback={<Skeleton className="h-4 w-24" />}>{scheduleFooter(true)}</Suspense>
            {showNearestOpen && (
              <span className="text-primary shrink-0 text-xs leading-4 font-semibold">
                · {tNearby('nearestOpenBadge')}
              </span>
            )}
          </div>
        </div>
        {effectiveParkId && (
          <div className="absolute top-1.5 right-1.5 h-7 w-7">
            <FavoriteStar
              type="park"
              id={effectiveParkId}
              name={name}
              size="md"
              noCircle
              className="h-full w-full"
            />
          </div>
        )}
      </div>

      <article
        className={cn(
          'pk-card-fx group relative isolate row-span-3 hidden cursor-pointer [grid-template-rows:subgrid] overflow-hidden rounded-[20px] transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-1 sm:grid'
        )}
        data-card-fx
        style={{
          boxShadow: 'var(--pk-card-shadow)',
        }}
      >
        {/* Photo — z-0, inner div carries the hover scale. `hideOnMobile` is belt and braces:
            the whole card is `display:none` below `sm`, where the row above renders. */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {backgroundImage ? (
            <CardPhoto
              objectPosition={propObjectPosition ?? 'top'}
              src={backgroundImage}
              alt={name}
              closed={!isOperatingOrUnknown}
              hideOnMobile
              sizes={CARD_PHOTO_SIZES}
            />
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
            {badges}
            {showNearestOpen && (
              <Badge className="badge-primary text-xs">{tNearby('nearestOpenBadge')}</Badge>
            )}
          </div>
        </div>

        {/* Photo spacer — the 1fr row resolves to 0 in an intrinsic-height
           container; min-h forces it open when there is a background image.
           It is also the strip of photo the panels leave visible, so the framed
           layer lives in here — see `CardPhotoFrame`. Stays at `z-0` so the scrim
           (z-1) keeps darkening it. */}
        <div className={cn('relative z-0', backgroundImage && 'sm:min-h-[220px]')}>
          {backgroundImage && (
            <CardPhotoFrame
              objectPosition={propObjectPosition ?? 'top'}
              src={backgroundImage}
              closed={!isOperatingOrUnknown}
              hideOnMobile
              sizes={CARD_PHOTO_SIZES}
            />
          )}
        </div>

        {/* Footer glass panel — z-3 */}
        <div
          className="pk-panel-bot relative z-[3] -mt-4 overflow-hidden"
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

          {/* Skeleton reserves the footer's single-line height so the client-rendered
              schedule/countdown swaps in without shifting the card (cacheComponents defers it). */}
          <Suspense fallback={<Skeleton className="h-4 w-32" />}>{scheduleFooter(false)}</Suspense>
        </div>
      </article>
    </Link>
  );
}
