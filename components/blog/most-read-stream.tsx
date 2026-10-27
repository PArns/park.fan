'use client';

import { useTranslations } from 'next-intl';
import { MostReadList } from '@/components/blog/most-read-list';
import { useAfterLoad } from '@/lib/hooks/use-after-load';
import { useMostRead } from '@/lib/hooks/use-most-read';
import { mostReadLeader, mostReadShown, type MostReadKind } from '@/lib/blog/most-read-config';
import type { MostRead } from '@/lib/blog/most-read';
import { cn } from '@/lib/utils';

/**
 * The most read guides (30 days) and news (7 days) of the reader's language, as two short numbered
 * lists of light rows (`MostReadList`): beside each other from `lg` up, one under the other below.
 * A side note to the posts around it, not a third grid of cards. The homepage shows both kinds, a
 * post the kind it is, without itself.
 *
 * The server renders `seed`, the ranking as the last build saw it (`getMostReadSeed`), so the HTML
 * carries the links; after load the shared, hour-cached ranking replaces it row for row. Both lists
 * are always full and every row has one fixed height, so the swap moves nothing, and a failed
 * request keeps the seed. See docs/features/most-read.md.
 */
export function MostReadStream({
  kinds,
  seed,
  newsLabel,
  excludeKey,
  headingAs = 'h3',
  className,
}: {
  kinds: MostReadKind[];
  /** `getMostReadSeed(locale)`, cut to `kinds`: what the server draws. */
  seed: MostRead;
  /** Where `kinds` holds news: the news section's label in this locale (`categories.json`). */
  newsLabel?: string;
  /** The `translationKey` of the post the reader is on, which its own list leaves out. */
  excludeKey?: string;
  /** `h2` under a post, `h3` inside the homepage's blog chapter. */
  headingAs?: 'h2' | 'h3';
  className?: string;
}) {
  const t = useTranslations('navigation');
  const lists = useMostRead(useAfterLoad()).data ?? seed;

  return (
    <div className={cn('grid gap-x-10 gap-y-8', kinds.length > 1 && 'lg:grid-cols-2', className)}>
      {kinds.map((kind) => (
        <section key={kind}>
          <MostReadList
            kind={kind}
            label={`${t('mostRead')} · ${kind === 'article' ? t('blog') : newsLabel}`}
            shown={mostReadShown(lists, kind, excludeKey)}
            leaderKey={mostReadLeader(lists, kind)}
            thumbnail
            headingAs={headingAs}
          />
        </section>
      ))}
    </div>
  );
}
