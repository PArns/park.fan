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
   * A control at the far end of the title row — the link to the park's wait-time record.
   *
   * Only the settled section passes one. The skeleton deliberately does not: whether that page
   * exists is the same question as whether these cards render at all, and a link drawn before the
   * answer arrives would be a link to a 404 on 82 of 201 parks.
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
