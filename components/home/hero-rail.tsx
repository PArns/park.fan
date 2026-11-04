'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Star, TrendingDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BlogCoverFallback } from '@/components/blog/blog-cover-fallback';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { HeroParkActions } from '@/components/home/hero-park-actions';
import { HomeLocationRow } from '@/components/home/home-location-row';
import { HeroBrowseHeader } from '@/components/search/hero-browse-header';
import { searchResultPlace } from '@/components/search/search-result-row-body';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { useHeroPark } from '@/lib/hooks/use-hero-park';
import { useHeroStatusLabels } from '@/lib/hooks/use-hero-status-labels';
import { HERO_RAIL_CARDS } from '@/lib/home/hero-search';
import {
  heroBrowseRows,
  useHeroBrowseParks,
  type NearbySearchItem,
} from '@/lib/hooks/use-hero-browse-parks';
import { linkBlockAttributes, linkEntityAttributes } from '@/lib/analytics/internal-link';
import {
  CROWD_DOT_CLASS,
  CROWD_TEXT_CLASS,
  waitTimeCrowdTier,
} from '@/lib/utils/crowd-level-styles';
import { formatDistance } from '@/lib/utils/distance-utils';
import { convertApiUrlToFrontendUrl, searchResultHref } from '@/lib/utils/url-utils';
import { cn, stripNewPrefix } from '@/lib/utils';
import type { NearbyParksData, NearbyShortWait } from '@/types/nearby';
import type { Locale } from '@/i18n/config';

/**
 * The rail's row: five columns from a 1024 px page, three from 640 px (the rest wrap out of view
 * behind `RAIL_CARD_ITEM_CLASS`), and on a phone a row that scrolls sideways with the next card in
 * view, running to the screen's edges so a card scrolled in starts where the text above it does.
 * `relative`, so an absolute child of a card (a `sr-only` label) is placed in the row and scrolls
 * with it; placed by an ancestor outside, it made the whole page wider than a phone.
 */
const RAIL_LIST_CLASS =
  'relative -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-5 [&::-webkit-scrollbar]:hidden';

/** One card's place in the row; from 640 to 1023 px only the first three show. */
const RAIL_CARD_ITEM_CLASS =
  'w-[66%] max-w-72 shrink-0 snap-start sm:w-auto sm:max-w-none sm:[&:nth-child(n+4)]:hidden lg:[&:nth-child(n+4)]:block';

/**
 * Every card's boxes have a fixed height, whatever it shows, so a short-wait card, a park card
 * and the skeleton are one size and nothing moves when the answer lands.
 */
const CARD_CLASS =
  'bg-card flex h-full flex-col overflow-hidden rounded-2xl border shadow-lg shadow-black/10';
const PHOTO_CLASS = 'relative block aspect-[2/1] overflow-hidden';
const BODY_CLASS = 'flex flex-col p-4';
const TITLE_CLASS = 'flex h-6 min-w-0 items-center gap-1.5 text-[15px] font-bold tracking-tight';
const SUBTITLE_CLASS = 'text-muted-foreground h-5 truncate text-[13px] leading-5';
const FIGURE_CLASS = 'mt-3 flex h-10 items-baseline gap-1.5';
const NUMBER_CLASS = 'text-4xl leading-10 font-black tracking-tighter tabular-nums';
const FOOT_CLASS = 'mt-2 flex h-7 min-w-0 flex-col justify-end';

/** The card's frame: its photo (the brand cover without one) with a badge on it, and its lines. */
function RailCard({
  href,
  entity,
  image,
  imagePosition,
  coverSlug,
  badge,
  title,
  headliner = false,
  subtitle,
  figure,
  foot,
}: {
  href: string;
  /** The park's or ride's UUID, which a counted click names. */
  entity: string;
  image: string | null | undefined;
  imagePosition?: string;
  /** Picks the brand cover's hue where there is no photo. */
  coverSlug: string;
  badge?: ReactNode;
  title: string;
  headliner?: boolean;
  subtitle: string;
  figure: ReactNode;
  foot: ReactNode;
}) {
  const t = useTranslations('nearby');
  return (
    <Link
      href={href as '/parks'}
      prefetch={false}
      {...linkEntityAttributes(entity)}
      className={cn(
        CARD_CLASS,
        'hover:border-foreground/25 transition-[border-color,translate] duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0'
      )}
    >
      <span className={PHOTO_CLASS}>
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 640px) 66vw, (max-width: 1024px) 33vw, 260px"
            className="object-cover"
            style={imagePosition ? { objectPosition: imagePosition } : undefined}
          />
        ) : (
          <BlogCoverFallback slug={coverSlug} className="absolute inset-0" />
        )}
        {badge}
      </span>
      <span className={BODY_CLASS}>
        <span className={TITLE_CLASS}>
          {headliner && (
            <>
              <Star
                aria-hidden="true"
                className="size-3.5 shrink-0 fill-amber-500 text-amber-500"
              />
              <span className="sr-only">{t('headlinerBadge')}: </span>
            </>
          )}
          <span className="truncate">{title}</span>
        </span>
        <span className={SUBTITLE_CLASS}>{subtitle}</span>
        <span className={FIGURE_CLASS}>{figure}</span>
        <span className={FOOT_CLASS}>{foot}</span>
      </span>
    </Link>
  );
}

/** The card while there is nothing to show yet, box for box. */
function RailCardSkeleton() {
  return (
    <div aria-hidden="true" className={CARD_CLASS}>
      <Skeleton className={cn(PHOTO_CLASS, 'rounded-none')} />
      <div className={BODY_CLASS}>
        <div className={TITLE_CLASS}>
          <Skeleton className="h-4 w-28" />
        </div>
        <div className={SUBTITLE_CLASS}>
          <Skeleton className="mt-1 h-3 w-36" />
        </div>
        <div className={FIGURE_CLASS}>
          <Skeleton className="h-8 w-16 self-center" />
        </div>
        <div className={FOOT_CLASS}>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * A ride whose queue is well below its usual length: how much shorter it is, the wait as the
 * card's biggest figure and a bar of the wait against the usual one, in the wait's crowd colour.
 */
function ShortWaitCard({ ride }: { ride: NearbyShortWait }) {
  const t = useTranslations('nearby');
  const tCommon = useTranslations('common');
  const unit = tCommon('min');
  const tier = waitTimeCrowdTier(ride.waitTime);
  const saved = ride.typicalWait - ride.waitTime;
  const share = ride.typicalWait > 0 ? Math.min(100, (ride.waitTime / ride.typicalWait) * 100) : 0;

  return (
    <RailCard
      href={convertApiUrlToFrontendUrl(ride.url)}
      entity={ride.id}
      image={ride.backgroundImage}
      imagePosition={ride.backgroundPosition}
      coverSlug={ride.slug}
      badge={
        saved > 0 && (
          <Badge className="badge-trend-down absolute top-3 left-3">
            <TrendingDown aria-hidden="true" />
            {t('shortWaits.shorter', { minutes: saved, unit })}
          </Badge>
        )
      }
      title={stripNewPrefix(ride.name)}
      headliner={ride.isHeadliner}
      subtitle={`${stripNewPrefix(ride.park.name)} · ${formatDistance(ride.park.distance)}`}
      figure={
        <>
          <span className={NUMBER_CLASS}>{ride.waitTime}</span>
          <span className="text-muted-foreground text-sm font-semibold">{unit}</span>
        </>
      }
      foot={
        <>
          <span
            aria-hidden="true"
            className="bg-foreground/10 flex h-1.5 overflow-hidden rounded-full"
          >
            <span
              className={cn('rounded-full', CROWD_DOT_CLASS[tier])}
              style={{ width: `${share}%` }}
            />
          </span>
          <span className="text-muted-foreground mt-1.5 flex justify-between gap-2 text-[11px] leading-4 tabular-nums">
            <span aria-hidden="true" className={cn('font-semibold', CROWD_TEXT_CLASS[tier])}>
              {t('shortWaits.now', { minutes: ride.waitTime, unit })}
            </span>
            <span>{t('shortWaits.usually', { minutes: ride.typicalWait, unit })}</span>
          </span>
        </>
      }
    />
  );
}

/**
 * A park near the visitor, a ride of the park they stand in or a popular park: while it is open its
 * wait (a park's average) as the figure and its crowd level (a ride: its status) at the foot; shut,
 * its status as the figure. A popular park carries no live data, so its figure leads to its waits.
 */
function BrowseCard({ item, href }: { item: NearbySearchItem; href: string }) {
  const t = useTranslations('nearby');
  const tCommon = useTranslations('common');
  const tGeo = useTranslations('geo');
  const tStatus = useTranslations('parks.status');
  const open = item.status === 'OPERATING';
  const wait = !open ? null : item.type === 'park' ? item.avgWaitTime : item.waitTime;
  const place =
    item.type === 'park'
      ? searchResultPlace(item, tGeo)
      : stripNewPrefix(item.parentPark?.name ?? '');
  const distance = item.distanceM != null ? formatDistance(item.distanceM) : null;

  return (
    <RailCard
      href={href}
      entity={item.id}
      image={item.imageUrl}
      imagePosition={item.imagePosition}
      coverSlug={item.slug}
      title={stripNewPrefix(item.name)}
      subtitle={[place, distance].filter(Boolean).join(' · ')}
      figure={
        wait != null ? (
          <>
            {item.type === 'park' && (
              <span className="text-muted-foreground text-2xl font-bold">Ø</span>
            )}
            <span className={NUMBER_CLASS}>{wait}</span>
            <span className="text-muted-foreground text-sm font-semibold">{tCommon('min')}</span>
          </>
        ) : item.status ? (
          // Shut or down: how far off the next opening is („Öffnet morgen", „Öffnet in 2:33 Stunden"),
          // which says more at a glance than its date.
          <span
            title={item.statusCountdown ? item.statusLabel : undefined}
            className="text-muted-foreground self-center truncate text-base font-semibold"
          >
            {item.statusCountdown
              ? `${t('opens')} ${item.statusCountdown}`
              : (item.statusLabel ?? tStatus(item.status))}
          </span>
        ) : (
          <span className="text-primary-ink inline-flex items-center gap-1 self-center text-sm font-semibold">
            {t('heroRail.seeWaits')}
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </span>
        )
      }
      foot={
        // One badge, so it never runs out of the card: an open park's crowd level (its average wait
        // above already says it is open), else the status.
        open && (
          <span className="flex min-w-0 items-center overflow-hidden">
            {item.type === 'park' && item.load && item.load !== 'unknown' ? (
              <CrowdLevelBadge level={item.load} />
            ) : (
              <ParkStatusBadge status="OPERATING" />
            )}
          </span>
        )
      }
    />
  );
}

/**
 * The row under the hero's text, which answers its question: the rides near the visitor whose
 * queue is well below its usual length right now (`shortWaits`, the nearby answer's). Where there
 * are none, which is every evening and the whole off-season, the same cards show the parks near
 * the visitor, the rides of the park they stand in or, without a position, the popular parks
 * (`useHeroBrowseParks`), under the heading row the search list uses. Every state has the same
 * card box, so the skeleton becomes the answer without moving anything.
 *
 * Under the cards the location row (`HomeLocationRow`). On a phone a visitor in or next to a park
 * gets the park's block (`HeroParkActions`) under it; from `md` it stands under the headline
 * (`HeroWithNearby`).
 */
export function HeroRail({ className }: { className?: string }) {
  const t = useTranslations('nearby');
  const locale = useLocale() as Locale;
  // The skeleton until mount, even with data: the nearby query seeds from `localStorage`, so a
  // returning visitor's first client render would not match the server's skeleton.
  const mounted = useMounted();
  const browse = useHeroBrowseParks();
  const { data: nearby } = useHomeNearbyParks();
  const heroPark = useHeroPark();
  const withStatusLabels = useHeroStatusLabels();

  const shortWaits =
    nearby?.type === 'nearby_parks'
      ? ((nearby.data as NearbyParksData).shortWaits ?? []).filter((ride) => ride.url)
      : [];
  const pending = !mounted || browse.isPending;
  const showShortWaits = !pending && shortWaits.length > 0;

  let cards: ReactNode[];
  if (pending) {
    cards = Array.from({ length: HERO_RAIL_CARDS }, (_, i) => <RailCardSkeleton key={i} />);
  } else if (showShortWaits) {
    cards = shortWaits
      .slice(0, HERO_RAIL_CARDS)
      .map((ride) => <ShortWaitCard key={ride.id} ride={ride} />);
  } else {
    cards = withStatusLabels(heroBrowseRows(browse))
      .slice(0, HERO_RAIL_CARDS)
      .map((item) => {
        const href = searchResultHref(item, locale);
        return href ? <BrowseCard key={item.id} item={item} href={href} /> : null;
      });
  }

  return (
    <div className={className} {...linkBlockAttributes('nearby')}>
      <HeroBrowseHeader
        browse={browse}
        tone="rail"
        heading={showShortWaits ? t('shortWaits.title') : undefined}
      />
      <ul className={RAIL_LIST_CLASS} aria-busy={pending || undefined}>
        {cards.map((card, index) => (
          <li key={index} className={RAIL_CARD_ITEM_CLASS}>
            {card}
          </li>
        ))}
      </ul>
      {/* Where the visitor turns location on, or back on after a no: the row asks, says it is
          on, or shows how to lift a block, at one height in every state. */}
      <HomeLocationRow className="mt-2" />
      {mounted && heroPark && (
        <HeroParkActions park={heroPark.park} named className="mt-4 md:hidden" />
      )}
    </div>
  );
}
