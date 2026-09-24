'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTripId } from '@/lib/planner/trip-sync';
import { sharedTripUrl } from '@/lib/planner/trip-share';

/**
 * "Link zum Plan teilen", under the push switch and only while it is on.
 *
 * Only there because the link points at the server's copy of the plan, and that
 * copy exists only while push is on (PAR-82, option A). With push off there is
 * no trip id and nothing to share, so this renders nothing rather than a button
 * that would first have to upload the plan. The sentence that the link is the
 * password is `push.storedHint`, drawn right above this by the caller.
 *
 * `navigator.share` where the browser has one (phones), the clipboard where it
 * does not. Not `ShareButtons`: that row sends the URL to Facebook's and X's
 * share dialogs, and this URL lets anybody who has it read and edit the plan.
 *
 * The id is read when the button is pressed, not when it is drawn. `syncTrip`
 * replaces it when the server answers 404 for the old one, and a link built at
 * render time would then hand out a dead id.
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
        // The visitor closed the share sheet. Nothing went wrong.
        if (error instanceof DOMException && error.name === 'AbortError') return;
        // Anything else falls through to the clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setResult('copied');
      setTimeout(() => setResult('idle'), 2000);
    } catch {
      // Clipboard refused (permissions, an embedded view). The link is shown so
      // it can be copied by hand, instead of a button that did nothing.
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
