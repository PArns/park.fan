'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTripId } from '@/lib/planner/trip-sync';
import { sharedTripUrl } from '@/lib/planner/trip-share';

/**
 * "Link zum Plan teilen", under the push switch and only while it is on: the link points at the
 * server's copy, which exists only then. `navigator.share` where there is one, the clipboard
 * otherwise; not `ShareButtons`, since this URL lets anybody who has it read and edit the plan. The
 * id is read at the press, because `syncTrip` can replace it.
 */
export function PlannerShareLink() {
  const t = useTranslations('planner.push');
  const locale = useLocale();
  const [result, setResult] = useState<'idle' | 'copied' | { failed: string }>('idle');

  if (getTripId() === null) return null;

  const share = async () => {
    const id = getTripId();
    if (id === null) return;
    const url = sharedTripUrl(window.location.origin, locale, id);

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: t('shareTitle'), url });
        return;
      } catch (error) {
        // The visitor closed the share sheet.
        if (error instanceof DOMException && error.name === 'AbortError') return;
        // Anything else falls through to the clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setResult('copied');
      setTimeout(() => setResult('idle'), 2000);
    } catch {
      // Clipboard refused: the link is shown so it can be copied by hand.
      setResult({ failed: url });
    }
  };

  const copied = result === 'copied';

  return (
    <div className="mt-1" data-planner-share="">
      <button
        type="button"
        onClick={() => void share()}
        className={cn(
          'planner-phone:min-h-11 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
          'hover:bg-accent'
        )}
      >
        {copied ? (
          <Check className="text-crowd-low size-3.5 shrink-0" aria-hidden="true" />
        ) : (
          <Share2 className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
        )}
        <span className="min-w-0 flex-1" aria-live="polite">
          {copied ? t('shareCopied') : t('share')}
        </span>
      </button>
      {typeof result === 'object' && (
        <div className="mt-1 px-2">
          <p className="text-muted-foreground text-[10px] leading-snug">{t('shareManual')}</p>
          <input
            type="text"
            readOnly
            value={result.failed}
            onFocus={(event) => event.currentTarget.select()}
            aria-label={t('share')}
            className="border-border bg-background mt-1 w-full rounded-md border px-2 py-1 font-mono text-[10px]"
          />
        </div>
      )}
    </div>
  );
}
