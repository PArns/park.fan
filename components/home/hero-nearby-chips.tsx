'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { useHeroStatusLabels } from '@/lib/hooks/use-hero-status-labels';
import {
  useBrowseHeading,
  useHeroBrowseParks,
  type NearbySearchItem,
} from '@/lib/hooks/use-hero-browse-parks';
import { nearbyShortWaits } from '@/lib/home/hero-browse';
import { linkBlockAttributes, linkEntityAttributes } from '@/lib/analytics/internal-link';
import { CROWD_DOT_CLASS, isColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import { searchResultHref } from '@/lib/utils/url-utils';
import { cn, stripNewPrefix } from '@/lib/utils';
import type { Locale } from '@/i18n/config';

/** How many parks the row names. */
const HERO_NEARBY_CHIPS = 5;

/**
 * One line that scrolls sideways where the chips do not fit, running to a phone's edges like the
 * card rail under it. `py-1 -my-1` gives the focus ring room inside the scroll box, which clips on
 * both axes once it scrolls on one. The right edge fades, so a cut chip reads as more to scroll.
 */
const ROW_CLASS =
  '-mx-4 -my-1 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 py-1 [mask-image:linear-gradient(to_right,#000_calc(100%-1.5rem),transparent)] [scrollbar-width:none] md:mx-0 md:scroll-px-0 md:px-0 [&::-webkit-scrollbar]:hidden';

/**
 * A chip on the photo: its own glass, since the foot scrim is thin this high up. 28 px on a phone,
 * where the gap it floats in is narrower, 32 px from `md`.
 */
const CHIP_CLASS =
  'border-border/60 bg-background/70 flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs leading-none shadow-sm backdrop-blur-md md:h-8 md:px-3 md:text-[13px]';

/**
 * A park as a chip: a dot in its crowd colour, its name and, while it is open, its average wait;
 * shut, its status, with the next opening as the tooltip. The crowd level is in the text too, for
 * a reader who cannot tell the dots apart.
 */
function ParkChip({ item, href }: { item: NearbySearchItem; href: string }) {
  const tSearch = useTranslations('search');
  const tStatus = useTranslations('parks.status');
  const tCrowd = useTranslations('parks.crowdLevels');
  const open = item.status === 'OPERATING';
  const level = open && item.load && isColoredCrowdLevel(item.load) ? item.load : null;

  return (
    <Link
      href={href as '/parks'}
      prefetch={false}
      {...linkEntityAttributes(item.id)}
      title={!open ? item.statusLabel : undefined}
      className={cn(
        CHIP_CLASS,
        'hover:border-foreground/25 hover:bg-background/90 transition-colors'
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-2 shrink-0 rounded-full',
          level ? CROWD_DOT_CLASS[level] : open ? 'bg-status-operating' : 'bg-muted-foreground/50'
        )}
      />
      <span className={cn('max-w-40 truncate font-semibold', !open && 'text-foreground/80')}>
        {stripNewPrefix(item.name)}
      </span>
      {open && item.avgWaitTime != null ? (
        <span className="font-bold tabular-nums">
          {tSearch('avgWaitShort', { minutes: item.avgWaitTime })}
        </span>
      ) : item.status && !open ? (
        <span className="text-muted-foreground">{tStatus(item.status)}</span>
      ) : null}
      {level && <span className="sr-only">, {tCrowd(level)}</span>}
    </Link>
  );
}

/**
 * The nearest parks as a row of chips under the hero's search field, each with its average wait
 * while it is open: the same list and order as the search's pre-query list (`useHeroBrowseParks`,
 * open parks first, then by distance), so it costs no request of its own. In a park it is that park.
 *
 * Only while the card rail under it shows rides (the short waits, or the rides of the park the
 * visitor stands in): when the rail shows parks itself, the chips would repeat its cards. That is
 * decided by the nearby answer, after load, so the row takes no room: it floats in the gap between
 * the field and the rail, over the empty top of the rail's heading row, and fades in and out
 * without moving anything.
 */
export function HeroNearbyChips() {
  const locale = useLocale() as Locale;
  const mounted = useMounted();
  const browse = useHeroBrowseParks();
  const { data: nearby } = useHomeNearbyParks();
  const heading = useBrowseHeading(browse);
  const withStatusLabels = useHeroStatusLabels();
  // The rail's own test (`HeroRail`): until mount it is a skeleton, after it short waits or rows.
  const pending = !mounted || browse.isPending;
  const railShowsRides = !pending && (browse.inPark || nearbyShortWaits(nearby).length > 0);

  const chips = pending
    ? []
    : withStatusLabels(browse.items.filter((item) => item.type === 'park'))
        .slice(0, HERO_NEARBY_CHIPS)
        .flatMap((item) => {
          const href = searchResultHref(item, locale);
          return href ? [{ item, href }] : [];
        });

  if (chips.length === 0) return null;

  return (
    // `h-0`: the row's room is the gap under the field, which every state of the hero has.
    <div className="relative h-0">
      <nav
        aria-label={heading}
        {...linkBlockAttributes('nearby')}
        className={cn(
          'absolute inset-x-0 top-2 transition-[opacity,visibility] duration-300 md:top-3 starting:opacity-0',
          !railShowsRides && 'invisible opacity-0'
        )}
      >
        <ul className={ROW_CLASS}>
          {chips.map(({ item, href }) => (
            <li key={item.id} className="shrink-0 snap-start">
              <ParkChip item={item} href={href} />
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
