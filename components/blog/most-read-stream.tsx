'use client';

import { useTranslations } from 'next-intl';
import { MostReadList } from '@/components/blog/most-read-list';
import { useAfterLoad } from '@/lib/hooks/use-after-load';
import { useMostRead } from '@/lib/hooks/use-most-read';
import { mostReadLeader, mostReadShown, type MostReadKind } from '@/lib/blog/most-read-config';
import { cn } from '@/lib/utils';

/**
 * The most read guides (30 days) and news (7 days) of the reader's language, as two short numbered
 * lists of light rows (`MostReadList`): beside each other from `lg` up, one under the other below.
 * A side note to the posts around it, not a third grid of cards. The homepage shows both kinds, a
 * post the kind it is, without itself.
 *
 * Fetched after load from the shared, hour-cached ranking: the homepage shell is a week old and a
 * post page sits at the edge. Until it arrives each list holds its rows' exact height; only a
 * failed request takes the block away. See docs/features/most-read.md.
 */
export function MostReadStream({
  kinds,
  newsLabel,
  excludeKey,
  headingAs = 'h3',
  className,
}: {
  kinds: MostReadKind[];
  /** Where `kinds` holds news: the news section's label in this locale (`categories.json`). */
  newsLabel?: string;
  /** The `translationKey` of the post the reader is on, which its own list leaves out. */
  excludeKey?: string;
  /** `h2` under a post, `h3` inside the homepage's blog chapter. */
  headingAs?: 'h2' | 'h3';
  className?: string;
}) {
  const t = useTranslations('navigation');
  const { data, failed } = useMostRead(useAfterLoad());
  if (failed) return null;

  return (
    <div className={cn('grid gap-x-10 gap-y-8', kinds.length > 1 && 'lg:grid-cols-2', className)}>
      {kinds.map((kind) => (
        <section key={kind}>
          <MostReadList
            kind={kind}
            label={`${t('mostRead')} · ${kind === 'article' ? t('blog') : newsLabel}`}
            shown={data && mostReadShown(data, kind, excludeKey)}
            leaderKey={mostReadLeader(data, kind)}
            thumbnail
            headingAs={headingAs}
          />
        </section>
      ))}
    </div>
  );
}
