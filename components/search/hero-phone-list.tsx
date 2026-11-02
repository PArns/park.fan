'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Megaphone, Newspaper } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useMounted } from '@/lib/hooks/use-mounted';
import {
  heroBrowseRows,
  useBrowseHeading,
  useHeroBrowseParks,
  type NearbySearchItem,
} from '@/lib/hooks/use-hero-browse-parks';
import { useHeroReadingRows } from '@/lib/hooks/use-hero-reading';
import { useHeroStatusLabels } from '@/lib/hooks/use-hero-status-labels';
import { useHeroPark } from '@/lib/hooks/use-hero-park';
import { HERO_PARK_ROWS_PHONE } from '@/lib/home/hero-search';
import { HeroParkActions } from '@/components/home/hero-park-actions';
import { searchResultHref } from '@/lib/utils/url-utils';
import { formatDistance } from '@/lib/utils/distance-utils';
import { cn, stripNewPrefix } from '@/lib/utils';
import {
  SearchResultThumb,
  WaitBadge,
  searchResultPlace,
} from '@/components/search/search-result-row-body';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { HeroPhoneSkeleton } from '@/components/search/search-skeleton-list';
import { HeroBrowseHeader, HeroBrowseHeaderSkeleton } from '@/components/search/hero-browse-header';
import { HeroSearchFrame } from '@/components/search/hero-search-field';
import {
  HERO_PHONE_LIST_CLASS,
  HERO_PHONE_PARK_CLASS,
  HERO_PHONE_READING_CLASS,
  HERO_PHONE_READING_ROW_CLASS,
  HERO_PHONE_ROW_CLASS,
  HERO_SEARCH_LIST_BOX_CLASS,
  SEARCH_SECONDARY_TEXT_CLASS,
} from '@/components/search/hero-search-classes';
import type { SearchSession } from '@/lib/analytics/search-session';
import type { HeroReading } from '@/lib/home/hero-search';
import type { Locale } from '@/i18n/config';

/**
 * The status and wait pills on a phone: the badges' look at 18 px instead of 22, with a 10 px icon
 * that sits as far from the left edge as from the top.
 */
const PHONE_PILL_CLASS =
  'h-[18px] gap-1 px-1.5 py-0 text-[10px] [&>svg]:size-2.5 badge-icon:-ml-0.75';

const ROW_LINK_CLASS =
  'hover:bg-primary/10 active:bg-primary/15 flex items-center gap-2.5 rounded-lg px-3 transition-colors';

/**
 * One park or ride on the phone: the name on a line of its own, then the status and the wait as
 * small pills and a park's distance, „[Geöffnet] [Ø 15 Min.] 16.3 km", so the pills never take the
 * width a long name needs. A popular park carries no live data and no distance, so its second
 * line is its place.
 */
function PhoneRow({
  item,
  href,
  onClick,
}: {
  item: NearbySearchItem;
  href: string;
  onClick: () => void;
}) {
  const tSearch = useTranslations('search');
  const tCommon = useTranslations('common');
  const tGeo = useTranslations('geo');
  const open = item.status === 'OPERATING';
  const wait = !open
    ? null
    : item.type === 'park'
      ? item.avgWaitTime
      : (item.waitTime ?? undefined);

  return (
    <Link
      href={href as '/parks'}
      prefetch={false}
      onClick={onClick}
      className={cn(ROW_LINK_CLASS, HERO_PHONE_ROW_CLASS)}
    >
      <SearchResultThumb result={item} className="sm:h-9 sm:w-9 sm:rounded-lg" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm leading-5 font-semibold">
          {stripNewPrefix(item.name)}
        </span>
        {item.status ? (
          <span className="mt-0.5 flex min-w-0 items-center gap-1.5">
            <ParkStatusBadge
              status={item.status}
              label={item.statusLabel}
              className={PHONE_PILL_CLASS}
            />
            {wait != null && (
              <WaitBadge minutes={wait} className={PHONE_PILL_CLASS}>
                {item.type === 'park'
                  ? tSearch('avgWaitShort', { minutes: wait })
                  : `${wait} ${tCommon('min')}`}
              </WaitBadge>
            )}
            {item.type === 'park' && item.distanceM != null && (
              <span
                className={cn(
                  SEARCH_SECONDARY_TEXT_CLASS,
                  'truncate text-[11px] font-medium tabular-nums'
                )}
              >
                {formatDistance(item.distanceM)}
              </span>
            )}
          </span>
        ) : (
          <span className={cn(SEARCH_SECONDARY_TEXT_CLASS, 'block truncate text-xs leading-5')}>
            {searchResultPlace(item, tGeo)}
          </span>
        )}
      </span>
    </Link>
  );
}

/** The two posts on the phone: an icon for the kind, the kicker, and the title on one line. */
function PhoneReading({ reading, session }: { reading: HeroReading; session: SearchSession }) {
  const rows = useHeroReadingRows(reading);

  return (
    <ul
      className={HERO_PHONE_READING_CLASS}
      // Two rows of 2.75 rem and the box's hairline, held when a post is missing.
      style={{ minHeight: 'calc(2 * 2.75rem + 1px)' }}
    >
      {rows.map(({ post, item, kicker }, index) => {
        const Icon = item === 'news' ? Megaphone : Newspaper;
        return (
          <li key={post.path}>
            <Link
              href={post.path as '/parks'}
              prefetch={false}
              onClick={() => session.browseClicked(item, index)}
              className={cn(ROW_LINK_CLASS, HERO_PHONE_READING_ROW_CLASS)}
            >
              <span className="flex w-9 shrink-0 justify-center">
                <Icon aria-hidden="true" className="text-primary size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-primary-ink block truncate text-[10px] leading-3.5 font-semibold tracking-wide uppercase">
                  {kicker}
                </span>
                <span className="block truncate text-[13px] leading-[18px] font-semibold">
                  {post.title}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The hero's resting list on a phone, attached under the field like the desktop one: the first
 * rows of the browse list as compact links, so a tap opens the park at once, then the hero's two
 * posts. The field above opens the palette, which is where typing happens on a phone. `session`
 * is the field's: the palette and these rows are one surface, so a tap counts in the palette's
 * last opening, or opens one.
 *
 * For a visitor in or next to a park the park's block (`HeroParkActions`) follows the first
 * {@link HERO_PARK_ROWS_PHONE} rows instead, in the room the other rows and the posts had. It
 * arrives with the same answer that settles the list, so it replaces the skeleton and moves
 * nothing; above the field, which the desktop's block would push down, nothing changes.
 */
export function HeroPhoneList({
  rows,
  reading,
  session,
}: {
  rows: number;
  reading?: HeroReading | null;
  session: SearchSession;
}) {
  const browse = useHeroBrowseParks();
  const heading = useBrowseHeading(browse);
  const locale = useLocale() as Locale;
  // The skeleton until mount, even with data: the nearby query seeds from `localStorage`, so a
  // returning visitor's first client render would not match the server's skeleton.
  const mounted = useMounted();
  const pending = !mounted || browse.isPending;
  const withStatusLabels = useHeroStatusLabels();
  const heroPark = useHeroPark();
  const listed = heroPark ? Math.min(rows, HERO_PARK_ROWS_PHONE) : rows;
  const items = withStatusLabels(heroBrowseRows(browse).slice(0, listed));

  return (
    <HeroSearchFrame state={pending ? 'pending' : 'settled'}>
      <div className={HERO_SEARCH_LIST_BOX_CLASS}>
        {pending ? <HeroBrowseHeaderSkeleton /> : <HeroBrowseHeader browse={browse} />}
        {pending ? (
          <HeroPhoneSkeleton rows={rows} reading={!!reading} />
        ) : (
          <>
            <ul
              aria-label={heading}
              className={HERO_PHONE_LIST_CLASS}
              // Rows of 3 rem, held when fewer arrive.
              style={{ minHeight: `calc(${listed} * 3rem)` }}
            >
              {items.map((item, index) => {
                const href = searchResultHref(item, locale);
                if (!href) return null;
                return (
                  <li key={item.id}>
                    <PhoneRow
                      item={item}
                      href={href}
                      onClick={() => session.browseClicked(item.browseItem, index, item.id)}
                    />
                  </li>
                );
              })}
            </ul>
            {heroPark ? (
              <div
                className={HERO_PHONE_PARK_CLASS}
                // The rows it stands in for and the posts' box with its hairline.
                style={{
                  minHeight: `calc(${rows - listed} * 3rem${reading ? ' + 2 * 2.75rem + 1px' : ''})`,
                }}
              >
                <HeroParkActions park={heroPark.park} named />
              </div>
            ) : (
              reading && <PhoneReading reading={reading} session={session} />
            )}
          </>
        )}
      </div>
    </HeroSearchFrame>
  );
}
