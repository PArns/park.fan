import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { GlassNotice } from '@/components/parks/glass-notice';
import type { NoLiveWaitTimesReason } from '@/lib/api/types';

interface NoLiveWaitTimesNoticeProps {
  /** From `noLiveWaitTimesReason(park)`. Renders nothing when null, so callers need no guard. */
  reason: NoLiveWaitTimesReason | null;
  /** Which page is asking — decides what the visitor is told they won't find. */
  scope: 'park' | 'ride';
  className?: string;
}

/**
 * Explains why a park shows no wait times anywhere.
 *
 * Without it the page is unreadable: the API withholds every wait-derived value for these parks,
 * so an open, busy park looks like one nobody knows anything about, and a visitor cannot tell
 * that apart from a broken site. Sits on `GlassNotice`, which carries the frosted surface and the
 * `data-nosnippet`. See docs/rules/parks-we-cannot-read.md.
 */
export function NoLiveWaitTimesNotice({ reason, scope, className }: NoLiveWaitTimesNoticeProps) {
  const t = useTranslations('parks.noLiveWaitTimes');
  if (!reason) return null;

  return (
    <GlassNotice
      icon={Info}
      title={t('title')}
      tintClassName="bg-sky-500/5 dark:bg-sky-500/10"
      iconClassName="text-sky-600 dark:text-sky-400"
      className={className}
    >
      {t(`reason.${reason}`)} {t(scope)}
    </GlassNotice>
  );
}
