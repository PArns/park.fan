'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMenuBandOpen } from '@/components/layout/menu-band';
import { MostReadList } from '@/components/blog/most-read-list';
import { useMostRead } from '@/lib/hooks/use-most-read';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { mostReadLeader, mostReadShown, type MostReadKind } from '@/lib/blog/most-read-config';

/**
 * The guides panel's and the news panel's third column: the five most read posts of the kind in the
 * reader's language, as text rows, so the column stays narrow beside the panel's own covers. Only
 * where the header is 1280 px wide: at the 1024 tier a third column would squeeze the wire's and
 * the guides' rows to half their text. Fetched once its band has been opened, never rendered into
 * the page, since the band ships on every page. See docs/features/most-read.md.
 */
export function MostReadMenuColumn({ kind }: { kind: MostReadKind }) {
  const t = useTranslations('navigation');
  const open = useMenuBandOpen();
  // The window, near enough to the header's own `@min-[1280px]`; at worst a scrollbar's width of
  // windows fetch a column they hide.
  const wide = useMediaQuery('(min-width: 1280px)');
  const [opened, setOpened] = useState(false);
  if (open && wide && !opened) setOpened(true);
  const { data, failed } = useMostRead(opened);
  if (!opened || failed) return null;

  return (
    <div data-menu-stagger className="hidden w-64 shrink-0 flex-col @min-[1280px]:flex">
      <MostReadList
        kind={kind}
        label={t('mostRead')}
        shown={data && mostReadShown(data, kind)}
        leaderKey={mostReadLeader(data, kind)}
      />
    </div>
  );
}
