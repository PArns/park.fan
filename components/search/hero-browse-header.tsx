'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useBrowseHeading, type HeroBrowseParks } from '@/lib/hooks/use-hero-browse-parks';
import { NEARBY_CHAPTER_ID } from '@/lib/home/hero-search';
import { searchResultHref } from '@/lib/utils/url-utils';
import type { Locale } from '@/i18n/config';

/** The heading row's box: one height in every state, so the list under it never moves. */
const HEADER_CLASS = 'flex h-8 shrink-0 items-end justify-between gap-3 px-4 pb-1';

const LABEL_CLASS =
  'text-muted-foreground/60 truncate text-[10px] font-semibold tracking-wider uppercase';

const LINK_CLASS =
  'text-primary inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold hover:underline';

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
  const label = tCommon('viewAll');

  return (
    <div className={HEADER_CLASS}>
      <span className={LABEL_CLASS}>{heading}</span>
      {browse.inPark ? (
        parkHref && (
          <Link href={parkHref as '/parks'} prefetch={false} className={LINK_CLASS}>
            {label}
            <ArrowRight className="size-3" aria-hidden="true" />
          </Link>
        )
      ) : browse.isFallback ? (
        <Link href="/parks" prefetch={false} className={LINK_CLASS}>
          {label}
          <ArrowRight className="size-3" aria-hidden="true" />
        </Link>
      ) : (
        <a href={`#${NEARBY_CHAPTER_ID}`} className={LINK_CLASS}>
          {label}
          <ArrowDown className="size-3" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
