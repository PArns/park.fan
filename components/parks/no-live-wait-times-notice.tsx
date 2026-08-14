import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
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
 * Informational, not a warning: nothing is failing and there is nothing to act on,
 * so it takes the same blue treatment as the calendar's "no official hours" note
 * rather than the amber/red of the weather warnings above it.
 */
export function NoLiveWaitTimesNotice({ reason, scope, className }: NoLiveWaitTimesNoticeProps) {
  const t = useTranslations('parks.noLiveWaitTimes');
  if (!reason) return null;

  return (
    <div
      className={cn(
        'rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/30 dark:bg-blue-950/20',
        className
      )}
    >
      <div className="flex items-start gap-2 text-blue-700 dark:text-blue-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="text-sm">
          <p className="font-medium">{t('title')}</p>
          <p className="mt-1">
            {t(`reason.${reason}`)} {t(scope)}
          </p>
        </div>
      </div>
    </div>
  );
}
