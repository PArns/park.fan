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
  const { state, enable, disable, setTopics, availableTopics, selectedTopics } =
    usePushSubscription();

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
      {/* Which kinds, and only where there is a choice to make. A deploy that
          can send exactly one kind gets a sentence naming it instead of a list
          of one checkbox, which would be the master switch drawn twice.

          The list is the DEPLOY's topics, never a hard-coded set: an id this
          app has no copy for is still offered, by its id, because hiding a
          switch is worse than showing an untranslated word — and the labels for
          the four ids the API is expected to grow into are already written, so
          they appear the day it advertises them. */}
      {on && availableTopics.length > 1 && (
        <fieldset className="mt-1 px-2" data-planner-push-topics="">
          <legend className="text-muted-foreground text-[10px] font-medium">
            {t('push.topics.legend')}
          </legend>
          <div className="mt-1 flex flex-col gap-0.5">
            {availableTopics.map((topic) => {
              const key = `push.topics.${topic}`;
              const checked = selectedTopics === null || selectedTopics.includes(topic);
              // The last one may not be unticked: a subscription with no topics
              // is a switch that reads "on" and receives nothing. Turning all of
              // them off is what the master switch above is for.
              const last = checked && resolvedCount(availableTopics, selectedTopics) === 1;
              return (
                <label
                  key={topic}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-1 py-1 text-xs max-sm:min-h-9',
                    last ? 'opacity-60' : 'hover:bg-accent/50 cursor-pointer'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={last}
                    onChange={(event) => {
                      const next = event.target.checked
                        ? [
                            ...availableTopics.filter(
                              (t2) => t2 === topic || isOn(t2, selectedTopics)
                            ),
                          ]
                        : availableTopics.filter((t2) => t2 !== topic && isOn(t2, selectedTopics));
                      void setTopics(next);
                    }}
                    className="accent-primary size-3.5 shrink-0"
                  />
                  <span className="min-w-0 flex-1">{t.has(key) ? t(key) : topic}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Only while it is on. Before that it is a warning about something that
          has not happened; after, it is the one fact about the feature a
          visitor needs to know they are living with. */}
      {on && availableTopics.length === 1 && t.has(`push.topics.${availableTopics[0]}`) && (
        <p className="text-muted-foreground mt-1 px-2 text-[10px] leading-snug">
          {t('push.topics.only', { kind: t(`push.topics.${availableTopics[0]}`) })}
        </p>
      )}

      {on && (
        <p className="text-muted-foreground mt-1 px-2 text-[10px] leading-snug">
          {t('push.storedHint')}
        </p>
      )}
    </div>
  );
}

/** Is this topic currently wanted? `null` means "everything". */
function isOn(topic: string, selected: readonly string[] | null): boolean {
  return selected === null || selected.includes(topic);
}

/** How many of the deploy's topics are wanted right now. */
function resolvedCount(available: readonly string[], selected: readonly string[] | null): number {
  return available.filter((topic) => isOn(topic, selected)).length;
}
