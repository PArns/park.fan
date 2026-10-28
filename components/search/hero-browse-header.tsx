'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useBrowseHeading, type HeroBrowseParks } from '@/lib/hooks/use-hero-browse-parks';
import { NEARBY_CHAPTER_ID } from '@/lib/home/hero-search';
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
 * The link fills the row's height, the row's bottom padding included (`-mb-1 pb-1`), with its text
 * on the label's line.
 */
const LINK_CLASS =
  'text-primary-ink -mb-1 flex shrink-0 items-end self-stretch pb-1 text-[11px] font-semibold hover:underline';

/** The heading row while there is nothing to name yet: the shell and the pending list draw it. */
export function HeroBrowseHeaderSkeleton() {
  return (
    <div aria-hidden="true" className={HEADER_CLASS}>
      <span className="text-[10px]">
        <Skeleton as="span" className="inline-block h-2 w-16 rounded-full" />
      </span>
    </div>
  );
}

/**
 * The heading row over the hero's pre-query list: what the list is („Parks in der Nähe", „Du bist
 * in …", „Beliebte Parks") and a link to more of it. Nearby parks lead to the homepage's nearby
 * chapter, a park's rides to the park's page, the popular parks to `/parks`. Outside the listbox,
 * so the link is a link and not an option.
 */
export function HeroBrowseHeader({ browse }: { browse: HeroBrowseParks }) {
  const heading = useBrowseHeading(browse);
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;

  if (browse.isPending) return <HeroBrowseHeaderSkeleton />;

  const park = browse.inPark ? browse.items.find((item) => item.type === 'park') : undefined;
  const parkHref = park ? searchResultHref(park, locale) : null;
  const label = (Arrow: typeof ArrowRight) => (
    <span className="inline-flex items-center gap-1">
      {tCommon('viewAll')}
      <Arrow className="size-3" aria-hidden="true" />
    </span>
  );

  return (
    <div className={HEADER_CLASS}>
      <span className={LABEL_CLASS}>{heading}</span>
      {browse.inPark ? (
        parkHref && (
          <Link href={parkHref as '/parks'} prefetch={false} className={LINK_CLASS}>
            {label(ArrowRight)}
          </Link>
        )
      ) : browse.isFallback ? (
        <Link href="/parks" prefetch={false} className={LINK_CLASS}>
          {label(ArrowRight)}
        </Link>
      ) : (
        <a href={`#${NEARBY_CHAPTER_ID}`} className={LINK_CLASS}>
          {label(ArrowDown)}
        </a>
      )}
    </div>
  );
}
