'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { BlogParkCardLive } from './blog-park-card-live';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import type { Locale } from '@/i18n/config';
import {
  PARK_CALENDAR_CANONICAL_SEGMENT,
  PARK_CALENDAR_SEGMENTS,
} from '@/lib/parks/calendar-segments';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { isNotOperating } from '@/lib/blog/live-display';
import { useLiveBlogPark } from '@/lib/blog/use-blog-live';
import type { ResolvedPark } from '@/lib/blog/park-resolver';

/** Compact sizing so the live badges sit nicely inside running prose. */
const INLINE_BADGE = 'h-[18px] gap-0.5 px-1.5 py-0 text-[10px] font-semibold no-underline';

interface BlogParkLinkProps {
  park: ResolvedPark | null;
  /** Fallback label when the slug can't be resolved. */
  fallbackLabel: string;
  /** Slug — used when the resolver failed (no geo data), so we still render a link. */
  slug: string;
  /** Option flags parsed from the `park:slug?flag` href. */
  options?: Set<string>;
  /** Pre-computed background image path, looked up server-side. */
  backgroundImage?: string | null;
  /** That photo's focal point, resolved server-side alongside it. */
  objectPosition?: string;
  children?: React.ReactNode;
}

/**
 * Inline reference to a park inside blog content.
 *
 * The link itself is a real `<Link>` that navigates to the park page. Hover
 * opens a card built from the same `ParkCard` component used on favorites and
 * featured parks, so the experience is identical across the site (background
 * image, status badge, crowd badge, average wait, closing-time strip).
 */
export function BlogParkLink({
  park: resolvedPark,
  fallbackLabel,
  slug: _slug,
  options,
  backgroundImage,
  objectPosition,
  children,
}: BlogParkLinkProps) {
  const tGeo = useTranslations('geo');
  const locale = useLocale();
  // The post is statically generated, so `resolvedPark` carries whatever the park's status was at
  // build time. Refresh it in the browser (see `useLiveBlogPark`).
  const park = useLiveBlogPark(resolvedPark);
  const label = children ?? park?.name ?? fallbackLabel;
  const bare = options?.has('bare') ?? false;

  if (!park) {
    // Geo data unavailable — render the label as plain text rather than a
    // dead link that would 404 on a bare /parks/<slug>.
    return <span className="font-medium">{label}</span>;
  }

  /**
   * `ref:phantasialand?calendar` points at the park's wait-time calendar instead of its
   * wait-times page.
   *
   * A post that argues about WHEN to go — a tips article, a best-time piece, a „wann ist es leer"
   * — was sending readers to the live board, which answers a different question and answers it
   * only for today. The calendar is the page that carries that argument's evidence, and it went
   * live with nothing linking into it from the one place on this site that writes about visit
   * timing at length.
   *
   * Built by appending the localized segment to the park's OWN href, not by reassembling the geo
   * path: `ResolvedPark` carries `city` as the city's NAME („Brühl"), and there is no city slug on
   * it — feeding that to `parkCalendarPath` produces a 404 on every park whose city is spelled
   * with anything but its slug. The href is already the right path; the segment is the only part
   * that is localized (`wartezeiten-kalender`, `calendrier-temps-attente`, …).
   */
  const wantsCalendar = options?.has('calendar') ?? false;
  const href = wantsCalendar
    ? `${park.href}/${PARK_CALENDAR_SEGMENTS[locale as Locale] ?? PARK_CALENDAR_CANONICAL_SEGMENT}`
    : park.href;

  const country = translateGeoSlug(tGeo, 'countries', park.countrySlug, park.country);
  // Default to "City, Country". `?short` collapses to just the city.
  const location = options?.has('short') ? park.city : `${park.city}, ${country}`;
  const closed = isNotOperating(park.status);

  // Inline live badge: crowd-level badge while operating, status badge when
  // the park is shut. Real badge components — not recoloured link text.
  const liveBadge = closed ? (
    park.status ? (
      <ParkStatusBadge status={park.status} className={INLINE_BADGE} />
    ) : null
  ) : park.crowdLevel ? (
    <CrowdLevelBadge level={park.crowdLevel} className={INLINE_BADGE} />
  ) : null;

  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <Link
          href={href as '/'}
          className="text-primary hover:text-primary/80 focus-visible:ring-ring/40 inline rounded-sm font-medium underline decoration-dotted underline-offset-4 transition-colors focus:outline-none focus-visible:ring-2"
        >
          {label}
          {!bare && (
            <span className="ml-1 inline-flex items-baseline gap-1 align-baseline no-underline">
              <span className="text-muted-foreground text-[0.92em] font-normal">({location})</span>
              {liveBadge && (
                <span className="inline-flex translate-y-[1px] align-middle">{liveBadge}</span>
              )}
            </span>
          )}
        </Link>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        className="w-[420px] border-none bg-transparent p-0 shadow-none backdrop-blur-none"
      >
        {/*
          ParkCard uses row-span-3 + grid-template-rows: subgrid so its three
          internal sections (panel-top / image-spacer / panel-bottom) inherit
          row tracks from this parent. Match exactly that shape — auto / 1fr
          / auto — and *don't* pin a height: the card has a `sm:min-h-[220px]`
          spacer in its middle row that opens the 1fr track on its own.
          Using `minmax(220px, 1fr)` here means the card still renders at the
          right height even when there is no background image (i.e. when the
          card's own min-h conditional doesn't fire).
        */}
        <BlogParkCardLive
          park={park}
          backgroundImage={backgroundImage}
          objectPosition={objectPosition}
          className="grid [grid-template-rows:auto_0px_auto] sm:[grid-template-rows:auto_minmax(220px,1fr)_auto]"
        />
      </HoverCardContent>
    </HoverCard>
  );
}
