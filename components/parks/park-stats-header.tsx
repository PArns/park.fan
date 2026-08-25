'use client';

import { BarChart3 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * The statistics chapter's header. Its own file for the same reason
 * `ParkBestDaysHeader` has one: it carries no data — the title is a constant
 * string and only the "aus N Messtagen" line needs the payload — so the
 * loading placeholder renders this very component instead of grey boxes shaped
 * like it, so the title's height — which changes when it wraps — is reserved
 * exactly in every locale and at every breakpoint. Only the hint line is a
 * placeholder, and it holds one line where the settled subtitle can take two on
 * a phone.
 */
export function ParkStatsHeader({
  subtitle,
  hidden = false,
}: {
  /** The data window line. Omitted while the stats query is still out. */
  subtitle?: string;
  /** The guide page and the blog widgets mount the cards without a chapter. */
  hidden?: boolean;
}) {
  const t = useTranslations('parks.stats');
  if (hidden) return null;

  return (
    <ChapterHeading
      icon={BarChart3}
      title={t('title')}
      id="stats-heading"
      frosted
      hint={subtitle ?? <Skeleton as="span" className="block h-4 w-80 max-w-full" />}
    />
  );
}
