'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useBrowseHeading, type HeroBrowseParks } from '@/lib/hooks/use-hero-browse-parks';
import { PARK_COMPASS_ID, jumpToCompass, useCompassPresent } from '@/lib/home/compass-presence';
import { searchResultHref } from '@/lib/utils/url-utils';
import { SEARCH_SECONDARY_TEXT_CLASS } from '@/components/search/hero-search-classes';
import type { Locale } from '@/i18n/config';

/**
 * The heading row's box: one height in every state, so the list under it never moves. 44 px on a
 * phone, the height of the link's tap target, which fills the row.
 */
const HEADER_CLASS = 'flex h-11 shrink-0 items-end justify-between gap-3 px-4 pb-1 md:h-8';

const LABEL_CLASS = `${SEARCH_SECONDARY_TEXT_CLASS} truncate text-[10px] font-semibold tracking-wider uppercase`;

/**
 * The same row over the hero's card rail (`HeroRail`): flush with the cards' edge, a size up, and
 * 44 px tall at every width, the link's tap target.
 */
const RAIL_HEADER_CLASS = 'mb-2 flex h-11 shrink-0 items-end justify-between gap-3 pb-1.5';

const RAIL_LABEL_CLASS = 'truncate text-xs font-bold tracking-wider uppercase';

/** {@link LINK_CLASS} over the rail, filling its row's bottom padding there. */
const RAIL_LINK_CLASS =
  'text-primary-ink -mb-1.5 flex shrink-0 items-end self-stretch pb-1.5 text-[13px] font-semibold hover:underline';

/**
 * The link fills the row's height, the row's bottom padding included (`-mb-1 pb-1`), with its text
 * on the label's line.
 */
const LINK_CLASS =
  'text-primary-ink -mb-1 flex shrink-0 items-end self-stretch pb-1 text-[11px] font-semibold hover:underline';

/** Which surface the row heads: the search list, or the hero's card rail. */
type HeaderTone = 'list' | 'rail';

/** The heading row while there is nothing to name yet: the shell and the pending list draw it. */
export function HeroBrowseHeaderSkeleton({ tone = 'list' }: { tone?: HeaderTone }) {
  return (
    <div aria-hidden="true" className={tone === 'rail' ? RAIL_HEADER_CLASS : HEADER_CLASS}>
      <span className={tone === 'rail' ? 'text-xs' : 'text-[10px]'}>
        <Skeleton as="span" className="inline-block h-2 w-16 rounded-full" />
      </span>
    </div>
  );
}

/**
 * The heading row over the hero's search list and its card rail: what the rows are („Parks in
 * deiner Nähe", „Du bist in …", „Beliebte Parks", or the rail's own heading) and a link to more of
 * it. A park's rides lead to the park's page, nearby and popular parks to `/parks`. While the
 * in-park compass is under the hero, the link is „Zum Kompass" instead: the row keeps its height in
 * every state, so the link appearing moves nothing, and the park's page is one of the park block's
 * tiles. Outside the listbox, so the link is a link and not an option.
 */
export function HeroBrowseHeader({
  browse,
  tone = 'list',
  heading: headingOverride,
}: {
  browse: HeroBrowseParks;
  tone?: HeaderTone;
  /** What the rows are, where the rail shows something else than the browse list. */
  heading?: string;
}) {
  const browseHeading = useBrowseHeading(browse);
  const heading = headingOverride ?? browseHeading;
  const linkClass = tone === 'rail' ? RAIL_LINK_CLASS : LINK_CLASS;
  const tCommon = useTranslations('common');
  const tCompass = useTranslations('nearby.compass');
  const compass = useCompassPresent();
  const locale = useLocale() as Locale;

  if (browse.isPending) return <HeroBrowseHeaderSkeleton tone={tone} />;

  const park = browse.inPark ? browse.items.find((item) => item.type === 'park') : undefined;
  const parkHref = park ? searchResultHref(park, locale) : null;
  const label = (Arrow: typeof ArrowRight, text = tCommon('viewAll')) => (
    <span className="inline-flex items-center gap-1">
      {text}
      <Arrow className="size-3" aria-hidden="true" />
    </span>
  );

  return (
    <div className={tone === 'rail' ? RAIL_HEADER_CLASS : HEADER_CLASS}>
      <span className={tone === 'rail' ? RAIL_LABEL_CLASS : LABEL_CLASS}>{heading}</span>
      {compass ? (
        <a href={`#${PARK_COMPASS_ID}`} onClick={jumpToCompass} className={linkClass}>
          {label(ArrowDown, tCompass('heroPill'))}
        </a>
      ) : browse.inPark ? (
        parkHref && (
          <Link href={parkHref as '/parks'} prefetch={false} className={linkClass}>
            {label(ArrowRight)}
          </Link>
        )
      ) : (
        <Link href="/parks" prefetch={false} className={linkClass}>
          {label(ArrowRight)}
        </Link>
      )}
    </div>
  );
}
