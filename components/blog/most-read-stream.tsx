'use client';

import { useTranslations } from 'next-intl';
import { MenuSectionHeading } from '@/components/layout/menu-section-heading';
import { MOST_READ_ROW_HEIGHT, MostReadRow } from '@/components/blog/most-read-row';
import { useAfterLoad } from '@/lib/hooks/use-after-load';
import { useMostRead } from '@/lib/hooks/use-most-read';
import { useMounted } from '@/lib/hooks/use-mounted';
import {
  MOST_READ_DAYS,
  MOST_READ_LIMIT,
  mostReadList,
  mostReadShown,
  type MostReadKind,
} from '@/lib/blog/most-read-config';
import { cn } from '@/lib/utils';

/**
 * The most read guides (30 days) and news (7 days) of the reader's language, as two short numbered
 * lists of light rows (`MostReadRow`): beside each other from `lg` up, one under the other below.
 * A side note to the posts around it, not a third grid of cards. The homepage shows both kinds, a
 * post the kind it is, without itself.
 *
 * Fetched after load from the shared, hour-cached ranking: the homepage shell is a week old and a
 * post page sits at the edge. Until it arrives the block holds its height; a language without
 * enough counted posts yet draws nothing. See docs/features/most-read.md.
 */
export function MostReadStream({
  kinds,
  excludeKey,
  headingAs = 'h3',
  className,
}: {
  kinds: MostReadKind[];
  /** The `translationKey` of the post the reader is on, which its own list leaves out. */
  excludeKey?: string;
  /** `h2` under a post, `h3` inside the homepage's blog chapter. */
  headingAs?: 'h2' | 'h3';
  className?: string;
}) {
  const t = useTranslations('navigation');
  const query = useMostRead(useAfterLoad());
  // The server drew the placeholder; a late hydration with the ranking already cached draws it too.
  const data = useMounted() ? query.data : undefined;

  if (query.isError) return null;
  const groups = kinds
    .map((kind) => ({ kind, posts: data ? mostReadShown(data, kind, excludeKey) : null }))
    .filter((group) => !group.posts || group.posts.length > 0);
  if (groups.length === 0) return null;

  return (
    <div
      aria-hidden={data ? undefined : true}
      className={cn('grid gap-x-10 gap-y-8', groups.length > 1 && 'lg:grid-cols-2', className)}
    >
      {groups.map(({ kind, posts }) => (
        <section key={kind}>
          <MenuSectionHeading
            as={headingAs}
            label={`${t('mostRead')} · ${kind === 'article' ? t('blog') : t('mostReadNews')}`}
            aside={
              <span className="text-muted-foreground/80 text-[11px] font-normal">
                {t('mostReadWindow', { days: MOST_READ_DAYS[kind] })}
              </span>
            }
          />
          <ol className="flex flex-col">
            {posts
              ? posts.map((post) => (
                  <li key={post.key}>
                    {/* Its place in the whole ranking: under the leader's own page the list runs
                        from 2, and no other post takes the leader's flame. */}
                    <MostReadRow
                      post={post}
                      kind={kind}
                      rank={mostReadList(data, kind).indexOf(post) + 1}
                      thumbnail
                    />
                  </li>
                ))
              : Array.from({ length: MOST_READ_LIMIT }, (_, index) => (
                  <li key={index} className={cn('py-1.5', MOST_READ_ROW_HEIGHT)}>
                    <span className="bg-muted/70 block h-11 animate-pulse rounded-lg" />
                  </li>
                ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
