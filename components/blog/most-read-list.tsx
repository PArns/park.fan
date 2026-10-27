'use client';

import { useTranslations } from 'next-intl';
import { MenuSectionHeading } from '@/components/layout/menu-section-heading';
import { MOST_READ_ROW_HEIGHT, MostReadRow } from '@/components/blog/most-read-row';
import type { MostReadPost } from '@/lib/blog/most-read';
import { MOST_READ_DAYS, MOST_READ_LIMIT, type MostReadKind } from '@/lib/blog/most-read-config';
import { cn } from '@/lib/utils';

/**
 * One most-read list with its rule, as the header column and the page block both draw it: the
 * label, the window it sums over, and either the ranked rows or, while `shown` is unset,
 * {@link MOST_READ_LIMIT} placeholders of the rows' own fixed height. The API route always sends a
 * full list, so the placeholders hold exactly the room the rows take.
 */
export function MostReadList({
  kind,
  label,
  shown,
  leaderKey,
  thumbnail = false,
  headingAs,
}: {
  kind: MostReadKind;
  label: string;
  /** From `mostReadShown`; unset while the ranking is on its way. */
  shown?: { post: MostReadPost; rank: number }[];
  /** From `mostReadLeader`: the one post drawn with a flame. */
  leaderKey?: string;
  thumbnail?: boolean;
  headingAs?: 'h2' | 'h3';
}) {
  const t = useTranslations('navigation');
  return (
    <>
      <MenuSectionHeading
        as={headingAs}
        label={label}
        aside={
          <span className="text-muted-foreground/80 text-[11px] font-normal">
            {t('mostReadWindow', { days: MOST_READ_DAYS[kind] })}
          </span>
        }
      />
      {shown ? (
        <ol className="flex flex-col">
          {shown.map(({ post, rank }) => (
            // `value`: under the leader's own page the places run from 2, not from 1.
            <li key={post.key} value={rank}>
              <MostReadRow
                post={post}
                kind={kind}
                rank={rank}
                leader={post.key === leaderKey}
                thumbnail={thumbnail}
              />
            </li>
          ))}
        </ol>
      ) : (
        <ol aria-hidden="true" className="flex flex-col">
          {Array.from({ length: MOST_READ_LIMIT }, (_, index) => (
            <li key={index} className={cn('flex items-center', MOST_READ_ROW_HEIGHT)}>
              <span className="bg-muted/70 block h-14 w-full animate-pulse rounded-lg" />
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
