'use client';

import { useTranslations } from 'next-intl';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePushSubscription } from '@/lib/planner/use-push-subscription';

/**
 * The one control that turns notifications on.
 *
 * It renders NOTHING in three of the seven states, and that is the design rather
 * than an omission: `checking` has no answer yet, `unsupported` means this
 * browser has no push, and `unavailable` means this deploy has no VAPID keypair.
 * A disabled switch in any of them would be a promise the site cannot keep, and
 * a visitor cannot tell "not yet" from "never" by looking at one.
 *
 * `denied` does render, and says the browser is the one refusing — it is the
 * only state where the visitor has to go somewhere else to change the answer,
 * and a control that silently did nothing there would be the worst of the lot.
 *
 * The sentence under it is not decoration. Turning this on uploads the plan, and
 * the link to that copy is its only credential — no account, no password. That
 * has to be said where somebody presses the button, not in a policy page.
 */
export function PlannerPushToggle() {
  const t = useTranslations('planner');
  const { state, enable, disable } = usePushSubscription();

  if (state === 'checking' || state === 'unsupported' || state === 'unavailable') {
    return null;
  }

  if (state === 'denied') {
    return (
      <p
        className="text-muted-foreground flex items-start gap-1.5 px-2 py-1.5 text-[11px]"
        data-planner-push="denied"
      >
        <BellOff className="mt-px size-3 shrink-0" aria-hidden="true" />
        <span>{t('push.denied')}</span>
      </p>
    );
  }

  const busy = state === 'working';
  const on = state === 'on';

  return (
    <div className="px-2 py-1.5" data-planner-push={on ? 'on' : 'off'}>
      <button
        type="button"
        onClick={() => void (on ? disable() : enable())}
        disabled={busy}
        aria-pressed={on}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors max-sm:py-2.5',
          'hover:bg-accent disabled:opacity-60',
          on && 'text-foreground'
        )}
      >
        {busy ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
        ) : on ? (
          <Bell className="text-primary size-3.5 shrink-0" aria-hidden="true" />
        ) : (
          <BellOff className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
        )}
        <span className="min-w-0 flex-1">{on ? t('push.on') : t('push.off')}</span>
      </button>
      {/* Only while it is on. Before that it is a warning about something that
          has not happened; after, it is the one fact about the feature a
          visitor needs to know they are living with. */}
      {on && (
        <p className="text-muted-foreground mt-1 px-2 text-[10px] leading-snug">
          {t('push.storedHint')}
        </p>
      )}
    </div>
  );
}
