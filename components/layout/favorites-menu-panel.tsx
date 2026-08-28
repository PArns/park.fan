'use client';

import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { Skeleton } from '@/components/ui/skeleton';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { FavoritesHowTo } from '@/components/parks/favorites-how-to';
import { useFavorites } from '@/lib/hooks/use-favorites';
import { useFavoriteCounts, type FavoriteCounts } from '@/lib/hooks/use-favorite-counts';
import { CROWD_TEXT_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { stripNewPrefix } from '@/lib/utils';
import {
  buildRestaurantUrl,
  buildShowUrl,
  convertApiUrlToFrontendUrl,
} from '@/lib/utils/url-utils';
import type {
  FavoriteAttraction,
  FavoritePark,
  FavoriteRestaurant,
  FavoriteShow,
} from '@/lib/api/favorites';
import type { AttractionStatus, ParkStatus } from '@/lib/api/types';

/**
 * The favorites menu's contents — the same body in the desktop band and in the mobile sheet.
 *
 * Three things it is built around:
 *
 * 1. **It does not fetch until it is opened.** The header renders on every one of ~35,000 pages;
 *    an ungated `useFavorites()` here would put a `/api/favorites` request on all of them for
 *    every visitor who has ever starred anything. `open` is the gate (see the hook), and the query
 *    key is shared with the homepage band, so opening the menu there resolves from cache.
 * 2. **Rows, not cards.** `ParkCard`/`AttractionCard` read the `parks` + `attractions` namespaces,
 *    which the header would then have to carry into the chrome payload of every page — the
 *    homepage band fetches them as a lazy chunk precisely to avoid that. Everything below reads
 *    `favorites`, `common` and `parks.status`, and the last two are already chrome.
 * 3. **The loading state is sized off the cookie.** The ids are known before the names are, so a
 *    visitor with three parks and one ride waits in a box with three park rows and one ride row
 *    in it, not a spinner.
 */

/** Rows per column before the rest collapses into a "+N" line. */
const MAX_ROWS = 5;

function standbyWait(attraction: FavoriteAttraction): number | null {
  const standby = attraction.queues?.find((q) => q.queueType === 'STANDBY');
  return standby?.waitTime ?? null;
}

/** The park page a show or restaurant belongs to, plus the tab hash. Both live on the park page. */
function parkHrefFor(url: string | undefined): string | null {
  if (!url) return null;
  const converted = convertApiUrlToFrontendUrl(url);
  return converted !== '#' && converted.startsWith('/parks/') ? converted : null;
}

function Column({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div data-menu-stagger>
      <div className="text-foreground border-border/60 mb-2 flex items-center justify-between gap-2 border-b pb-1.5 text-xs font-semibold tracking-wide uppercase">
        <span>{title}</span>
        <span className="text-muted-foreground/70 tabular-nums">{count}</span>
      </div>
      <ul className="space-y-px">{children}</ul>
    </div>
  );
}

function Row({
  href,
  title,
  subtitle,
  trailing,
}: {
  href: string;
  title: string;
  subtitle?: string | null;
  trailing?: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        prefetch={false}
        className="hover:bg-muted/60 -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-1.5 transition-colors"
      >
        <span className="min-w-0">
          <span className="text-foreground block truncate text-sm font-medium">{title}</span>
          {subtitle && (
            <span className="text-muted-foreground block truncate text-xs">{subtitle}</span>
          )}
        </span>
        {trailing && <span className="shrink-0 text-right">{trailing}</span>}
      </Link>
    </li>
  );
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: Math.min(count, MAX_ROWS) }).map((_, i) => (
        <li key={i} className="px-2 py-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-1 h-3 w-20" />
        </li>
      ))}
    </>
  );
}

export function FavoritesMenuPanel({
  open,
  variant = 'band',
}: {
  open: boolean;
  /**
   * `band` is the full-width header panel, `sheet` the 300 px burger column.
   *
   * Not cosmetic: every `sm:`/`lg:` below is a VIEWPORT query, and the sheet is 300 px wide at
   * every viewport that shows it — including 640–1023 px, where the burger is still the whole
   * navigation. Left on the band's classes, the three how-to steps and the three favorites
   * columns both went three-across inside 300 px on a tablet.
   */
  variant?: 'band' | 'sheet';
}) {
  const t = useTranslations('favorites');
  const tCommon = useTranslations('common');
  const counts = useFavoriteCounts();
  // `poll: false` — the menu is on screen for seconds. The homepage band is the surface that
  // stays open long enough for a five-minute refresh to mean anything, and it keeps its own.
  const { data, isPending } = useFavorites({ enabled: open && counts.total > 0, poll: false });
  const moreLabel = (hidden: number) => t('more', { count: hidden });

  if (counts.total === 0) {
    return (
      <div data-menu-stagger>
        <p className="text-foreground inline-flex items-center gap-2 text-sm font-semibold">
          <Star className="text-muted-foreground/60 h-4 w-4" aria-hidden="true" />
          {t('empty')}
        </p>
        <FavoritesHowTo className="mt-4" layout={variant === 'sheet' ? 'stack' : 'auto'} />
      </div>
    );
  }

  const loading = isPending || !data;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-4">
        <span className="text-foreground inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
          <Star className="text-primary h-4 w-4" aria-hidden="true" />
          {t('title')}
        </span>
        <Link
          href="/#favorites"
          prefetch={false}
          className="text-primary hover:text-primary/80 text-xs font-medium transition-colors"
        >
          {tCommon('viewAll')}
        </Link>
      </div>

      <div
        className={`grid gap-x-6 gap-y-5 ${
          variant === 'sheet' ? '' : 'sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {counts.parks > 0 && (
          <Column title={t('parks')} count={counts.parks}>
            {loading ? (
              <SkeletonRows count={counts.parks} />
            ) : (
              <ParkRows parks={data.parks} counts={counts} moreLabel={moreLabel} />
            )}
          </Column>
        )}

        {counts.attractions > 0 && (
          <Column title={t('attractions')} count={counts.attractions}>
            {loading ? (
              <SkeletonRows count={counts.attractions} />
            ) : (
              <AttractionRows
                attractions={data.attractions}
                counts={counts}
                minuteLabel={tCommon('minuteShort')}
                moreLabel={moreLabel}
              />
            )}
          </Column>
        )}

        {(counts.shows > 0 || counts.restaurants > 0) && (
          <Column
            title={counts.shows > 0 ? t('shows') : t('restaurants')}
            count={counts.shows + counts.restaurants}
          >
            {loading ? (
              <SkeletonRows count={counts.shows + counts.restaurants} />
            ) : (
              <VenueRows shows={data.shows} restaurants={data.restaurants} />
            )}
          </Column>
        )}
      </div>
    </div>
  );
}

function MoreRow({ hidden, label }: { hidden: number; label: string }) {
  if (hidden <= 0) return null;
  return (
    <li className="px-2 pt-1.5">
      <Link
        href="/#favorites"
        prefetch={false}
        className="text-muted-foreground hover:text-foreground text-xs transition-colors"
      >
        {label}
      </Link>
    </li>
  );
}

function ParkRows({
  parks,
  counts,
  moreLabel,
}: {
  parks: FavoritePark[];
  counts: FavoriteCounts;
  moreLabel: (hidden: number) => string;
}) {
  // The API answers with the country SLUG ("germany"), same as everywhere else — `ParkCard`
  // translates it too. The `geo` namespace is already part of the layout chrome, so this costs
  // the header nothing.
  const tGeo = useTranslations('geo');
  return (
    <>
      {parks.slice(0, MAX_ROWS).map((park) => (
        <Row
          key={park.id}
          href={convertApiUrlToFrontendUrl(park.url)}
          title={stripNewPrefix(park.name)}
          subtitle={[park.city, translateGeoSlug(tGeo, 'countries', park.country, park.country)]
            .filter(Boolean)
            .join(' · ')}
          trailing={
            <ParkStatusBadge
              status={park.status as ParkStatus}
              className="px-1.5 py-0 text-[10px]"
            />
          }
        />
      ))}
      <MoreRow
        hidden={counts.parks - Math.min(parks.length, MAX_ROWS)}
        label={moreLabel(counts.parks - Math.min(parks.length, MAX_ROWS))}
      />
    </>
  );
}

function AttractionRows({
  attractions,
  counts,
  minuteLabel,
  moreLabel,
}: {
  attractions: FavoriteAttraction[];
  counts: FavoriteCounts;
  minuteLabel: string;
  moreLabel: (hidden: number) => string;
}) {
  return (
    <>
      {attractions.slice(0, MAX_ROWS).map((attraction) => {
        const wait = standbyWait(attraction);
        // `effectiveStatus`, never the raw `status`: a ride out of season is closed, and the raw
        // field does not know that. See `docs/api/seasonal-attractions.md`.
        const status = (attraction.effectiveStatus ??
          attraction.status ??
          'CLOSED') as AttractionStatus;
        const open = status === 'OPERATING';
        const rounded = wait !== null ? roundWaitTo5(wait) : null;
        return (
          <Row
            key={attraction.id}
            href={convertApiUrlToFrontendUrl(attraction.url)}
            title={stripNewPrefix(attraction.name)}
            subtitle={attraction.park ? stripNewPrefix(attraction.park.name) : null}
            trailing={
              open && rounded !== null ? (
                <span className="text-sm font-semibold tabular-nums">
                  <span className={CROWD_TEXT_CLASS[waitTimeCrowdTier(rounded)]}>{rounded}</span>
                  <span className="text-muted-foreground ml-1 text-xs font-normal">
                    {minuteLabel}
                  </span>
                </span>
              ) : (
                <ParkStatusBadge status={status} className="px-1.5 py-0 text-[10px]" />
              )
            }
          />
        );
      })}
      <MoreRow
        hidden={counts.attractions - Math.min(attractions.length, MAX_ROWS)}
        label={moreLabel(counts.attractions - Math.min(attractions.length, MAX_ROWS))}
      />
    </>
  );
}

function VenueRows({
  shows,
  restaurants,
}: {
  shows: FavoriteShow[];
  restaurants: FavoriteRestaurant[];
}) {
  const rows = [
    ...shows.map((show) => ({
      id: show.id,
      name: show.name,
      park: show.park?.name,
      href: parkHrefFor(show.url),
      hash: 'show' as const,
    })),
    ...restaurants.map((restaurant) => ({
      id: restaurant.id,
      name: restaurant.name,
      park: restaurant.park?.name,
      href: parkHrefFor(restaurant.url),
      hash: 'restaurant' as const,
    })),
  ];

  return (
    <>
      {rows.slice(0, MAX_ROWS).map((row) => (
        <Row
          key={row.id}
          href={
            row.href
              ? row.hash === 'show'
                ? buildShowUrl(row.href)
                : buildRestaurantUrl(row.href)
              : '/#favorites'
          }
          title={stripNewPrefix(row.name)}
          subtitle={row.park ? stripNewPrefix(row.park) : null}
        />
      ))}
    </>
  );
}
