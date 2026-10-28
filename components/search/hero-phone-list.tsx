'use client';

import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useMounted } from '@/lib/hooks/use-mounted';
import {
  heroBrowseRows,
  useBrowseHeading,
  useHeroBrowseParks,
} from '@/lib/hooks/use-hero-browse-parks';
import { useSearchSession } from '@/lib/hooks/use-search-session';
import { searchResultHref } from '@/lib/utils/url-utils';
import { SearchResultRowBody } from '@/components/search/search-result-row-body';
import { SearchSkeletonList } from '@/components/search/search-skeleton-list';
import { HeroBrowseHeader, HeroBrowseHeaderSkeleton } from '@/components/search/hero-browse-header';
import { HeroSearchFrame } from '@/components/search/hero-search-field';
import {
  HERO_PHONE_LIST_CLASS,
  HERO_PHONE_ROW_CLASS,
  HERO_SEARCH_LIST_BOX_CLASS,
} from '@/components/search/hero-search-classes';
import type { Locale } from '@/i18n/config';

/**
 * The hero's resting list on a phone, attached under the field like the desktop one: the first
 * rows of the browse list as plain links, so a tap opens the park at once. The field above opens
 * the palette, which is where typing happens on a phone. No cmdk and no posts: the list is short
 * enough to leave the plate's lower edge on screen. A tap is an opening of the `hero` surface.
 */
export function HeroPhoneList({ rows }: { rows: number }) {
  const browse = useHeroBrowseParks();
  const heading = useBrowseHeading(browse);
  const session = useSearchSession('hero');
  const locale = useLocale() as Locale;
  // The skeleton until mount, even with data: the nearby query seeds from `localStorage`, so a
  // returning visitor's first client render would not match the server's skeleton.
  const mounted = useMounted();
  const pending = !mounted || browse.isPending;
  const items = heroBrowseRows(browse).slice(0, rows);

  return (
    <HeroSearchFrame state={pending ? 'pending' : 'settled'}>
      <div className={HERO_SEARCH_LIST_BOX_CLASS}>
        {pending ? <HeroBrowseHeaderSkeleton /> : <HeroBrowseHeader browse={browse} />}
        {pending ? (
          <SearchSkeletonList
            rows={rows}
            headingClassName={null}
            rowClassName={HERO_PHONE_ROW_CLASS}
            className={HERO_PHONE_LIST_CLASS}
          />
        ) : (
          <ul
            aria-label={heading}
            className={HERO_PHONE_LIST_CLASS}
            // Rows of 3.25 rem over the list's 0.375 rem bottom padding, held when fewer arrive.
            style={{ minHeight: `calc(${rows} * 3.25rem + 0.375rem)` }}
          >
            {items.map((item, index) => {
              const href = searchResultHref(item, locale);
              if (!href) return null;
              return (
                <li key={item.id}>
                  <Link
                    href={href as '/parks'}
                    prefetch={false}
                    onClick={() => session.browseClicked(item.browseItem, index)}
                    className="hover:bg-primary/10 active:bg-primary/15 flex h-13 items-center gap-2.5 rounded-lg px-3 transition-colors sm:gap-4"
                  >
                    <SearchResultRowBody result={item} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </HeroSearchFrame>
  );
}
