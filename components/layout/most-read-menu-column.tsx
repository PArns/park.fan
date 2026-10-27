'use client';

import { useTranslations } from 'next-intl';
import { MenuSectionHeading } from '@/components/layout/menu-section-heading';
import { useMenuBandOpen } from '@/components/layout/menu-band';
import { MOST_READ_ROW_HEIGHT, MostReadRow } from '@/components/blog/most-read-row';
import { useMostRead } from '@/lib/hooks/use-most-read';
import { useMounted } from '@/lib/hooks/use-mounted';
import {
  MOST_READ_DAYS,
  MOST_READ_LIMIT,
  mostReadShown,
  type MostReadKind,
} from '@/lib/blog/most-read-config';
import { cn } from '@/lib/utils';

/**
 * The guides panel's and the news panel's third column: the five most read posts of the kind in the
 * reader's language, as text rows (`MostReadRow`), so the column stays narrow beside the panel's
 * own covers. Fetched when the band first opens, never rendered into the page: the band ships on
 * every page. A language without enough counted posts draws no column, and the panel keeps its two.
 * See docs/features/most-read.md.
 */
export function MostReadMenuColumn({
  kind,
  className,
}: {
  kind: MostReadKind;
  className?: string;
}) {
  const t = useTranslations('navigation');
  const open = useMenuBandOpen();
  const query = useMostRead(open);
  // The ranking is shared with the badges, which may have fetched it before the header hydrates;
  // until then this renders what the server did.
  const data = useMounted() ? query.data : undefined;
  const posts = mostReadShown(data, kind);
  // Closed and never fetched: nothing in the page's HTML, not even the placeholder.
  if ((!open && !data) || query.isError || (data && posts.length === 0)) return null;

  return (
    <div data-menu-stagger className={cn('flex flex-col', className)}>
      <MenuSectionHeading
        label={t('mostRead')}
        aside={
          <span className="text-muted-foreground/80 text-[11px] font-normal">
            {t('mostReadWindow', { days: MOST_READ_DAYS[kind] })}
          </span>
        }
      />
      <ol className="flex flex-col">
        {data
          ? posts.map((post, index) => (
              <li key={post.key}>
                <MostReadRow post={post} kind={kind} rank={index + 1} />
              </li>
            ))
          : Array.from({ length: MOST_READ_LIMIT }, (_, index) => (
              <li key={index} aria-hidden="true" className={cn('py-1.5', MOST_READ_ROW_HEIGHT)}>
                <span className="bg-muted/70 block h-11 animate-pulse rounded-lg" />
              </li>
            ))}
      </ol>
    </div>
  );
}
