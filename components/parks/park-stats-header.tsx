'use client';

import { BarChart3 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * The statistics chapter's header. It carries no data except the subtitle, so the loading
 * placeholder renders this same component and the title's height is reserved exactly in every
 * locale and at every breakpoint. Only the hint line is a placeholder.
 */
export function ParkStatsHeader({
  subtitle,
  hidden = false,
  className,
  action,
}: {
  /** The data window line. Omitted while the stats query is still out. */
  subtitle?: string;
  /** The guide page and the blog widgets mount the cards without a chapter. */
  hidden?: boolean;
  /** Passed to `ChapterHeading` — the section squares off the bottom so the panel underneath can
   *  be glued to it. Skeleton and settled section must pass the same thing. */
  className?: string;
  /**
   * A control at the far end of the title row: the link to the park's wait-time record. The
   * skeleton passes none, because whether that page exists is the same question as whether these
   * cards render, and an early link would 404 on many parks.
   */
  action?: React.ReactNode;
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
      action={action}
      className={className}
    />
  );
}
