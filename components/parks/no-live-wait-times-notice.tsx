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
 * Without it the page is not wrong so much as unreadable: the API withholds every
 * wait-derived value for these parks (rides read `UNKNOWN`, crowd levels `unknown`,
 * no forecast), which leaves a park that is open and busy looking like one nobody
 * has any information about — and a visitor with no way to tell that apart from a
 * site that is broken.
 *
 * Sits on `GlassNotice`, which carries the frosted surface and the
 * `data-nosnippet` that keeps these two sentences out of Google's snippet while
 * leaving them indexed — the reasoning for both is over there.
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
