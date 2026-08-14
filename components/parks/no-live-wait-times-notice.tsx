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
 * Built on the weather banners' surface (frosted layer + tint under a `rounded-xl`
 * border) rather than a flat tinted box, because it sits among glass cards on a
 * hero photo, where a solid pastel panel reads as a browser alert pasted onto the
 * page. Deliberately quieter than those banners: nothing here is urgent and there
 * is nothing to act on, so it takes a neutral border and the muted body colour
 * instead of a semantic tint.
 */
export function NoLiveWaitTimesNotice({ reason, scope, className }: NoLiveWaitTimesNoticeProps) {
  const t = useTranslations('parks.noLiveWaitTimes');
  if (!reason) return null;

  return (
    <section
      className={cn('border-border/60 relative rounded-xl border p-4 shadow-sm', className)}
      role="note"
    >
      {/* Frosted surface, same as the weather banners: the tints alone are far too sheer
          over the park's hero photo. */}
      <div
        className="bg-background/85 pointer-events-none absolute inset-0 rounded-xl backdrop-blur-md"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-xl bg-sky-500/5 dark:bg-sky-500/10"
        aria-hidden="true"
      />
      <div className="relative flex items-start gap-3">
        <Info
          className="mt-0.5 h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">{t('title')}</h3>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            {t(`reason.${reason}`)} {t(scope)}
          </p>
        </div>
      </div>
    </section>
  );
}
