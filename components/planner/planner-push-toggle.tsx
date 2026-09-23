'use client';

import { useTranslations } from 'next-intl';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { usePushSubscription } from '@/lib/planner/use-push-subscription';
import { PlannerShareLink } from './planner-share-link';

interface PlannerPushToggleProps {
  /**
   * `row` is the block this has always been; `icon` is the phone's bell.
   *
   * A variant rather than a second component, and that is forced rather than
   * chosen: {@link usePushSubscription} holds its own state and asks
   * `/api/push` from an effect, so a wrapper that only wanted to know WHICH
   * icon to draw would be a second subscription — two requests, and two
   * answers free to disagree about whether notifications are on.
   *
   * What the icon variant changes is where the body is drawn, never what it
   * says: the same switch, the same topics and the same sentences move into a
   * popover behind a 44 px bell. The three states that render nothing render
   * nothing here too, bell included — a bell that opens a popover explaining
   * that this browser has no push is a control that does nothing.
   */
  variant?: 'row' | 'icon';
}

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
 * has to be said where somebody presses the button, not in a policy page. It
 * also says what switching off does, because switching off DELETES that copy:
 * a hint that described the upload and stopped there would leave a visitor
 * guessing at the only part of this they can still act on.
 *
 * One sentence covers a refused deletion, not one per class. Switching off
 * always switches off — the notifications half owes the server nothing — so
 * what the reader needs is that the plan is still up there and what to press
 * to retry, and the one class carrying a figure worth printing, the limiter's
 * window, does not reach the client at all (PAR-146).
 */
export function PlannerPushToggle({ variant = 'row' }: PlannerPushToggleProps = {}) {
  const t = useTranslations('planner');
  const { state, enable, disable, setTopics, availableTopics, selectedTopics, deleteError } =
    usePushSubscription();

  if (state === 'checking' || state === 'unsupported' || state === 'unavailable') {
    return null;
  }

  if (state === 'denied') {
    const denied = (
      <p
        className={cn(
          'text-muted-foreground flex items-start gap-1.5 px-2 py-1.5 text-[11px]',
          variant === 'icon' && 'max-w-64'
        )}
        data-planner-push="denied"
      >
        <BellOff className="mt-px size-3 shrink-0" aria-hidden="true" />
        <span>{t('push.denied')}</span>
      </p>
    );
    return variant === 'icon' ? (
      <PushPopover label={t('push.denied')} icon={<BellOff className="size-4" />} state="denied">
        {denied}
      </PushPopover>
    ) : (
      denied
    );
  }

  const busy = state === 'working';
  const on = state === 'on';

  const body = (
    <div className="px-2 py-1.5" data-planner-push={on ? 'on' : 'off'}>
      <button
        type="button"
        onClick={() => void (on ? disable() : enable())}
        disabled={busy}
        aria-pressed={on}
        className={cn(
          // `min-h-11`, not `py-2.5`. Padding sizes a box from its content, and
          // the content here is a 14 px icon beside one line of `text-xs` —
          // 10 px top and bottom of it came to 36, not 44. The topic rows
          // below already say `min-h-11`, which is why they measured right and
          // the master switch above them did not.
          'planner-phone:min-h-11 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
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
                    'planner-phone:min-h-11 flex items-center gap-2 rounded-md px-1 py-1 text-xs',
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

      {/* Right under the sentence that says the link is the password, so the
          warning and the button that hands the link out are read together. */}
      {on && <PlannerShareLink />}

      {/* Notifications did stop; the stored plan did not go with them. Said
          out loud because the visible half of the press worked, so nothing
          else on screen suggests the other half is outstanding.

          `alert` rather than `status`: this is mounted in the same commit as
          its text, and a polite region is announced on the text CHANGING
          inside one that was already there — an assertive one is announced on
          insertion, which is what actually happens here. */}
      {deleteError !== null && (
        <p
          className="text-destructive mt-1 px-2 text-[10px] leading-snug"
          role="alert"
          data-planner-push-error="delete"
        >
          {t('push.deleteFailed')}
        </p>
      )}
    </div>
  );

  if (variant === 'row') return body;

  return (
    <PushPopover
      label={on ? t('push.on') : t('push.off')}
      icon={
        busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : on ? (
          <Bell className="text-primary size-4" />
        ) : (
          <BellOff className="size-4" />
        )
      }
      state={on ? 'on' : 'off'}
    >
      {body}
    </PushPopover>
  );
}

/**
 * The bell, and the panel's switch behind it.
 *
 * `z-[80]` like every other popover this panel opens: `SheetContent` is
 * `z-[70]` and both are portalled to `<body>`, so the shared primitive's
 * `z-50` would draw this list behind the sheet that triggered it — a button
 * that opens something nobody can see or reach. The park chooser, the day
 * picker and the party chips all carry the same number for the same reason.
 *
 * `align="end"` because the bell sits at the sheet's right edge; centred on it
 * the panel would hang off the screen at 360 px.
 */
function PushPopover({
  label,
  icon,
  state,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  state: string;
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-planner-push-trigger={state}
          aria-label={label}
          title={label}
          className="text-muted-foreground hover:text-foreground hover:bg-accent planner-phone:size-11 flex size-9 shrink-0 items-center justify-center rounded-md transition-colors"
        >
          {icon}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="z-[80] w-72 p-0">
        {children}
      </PopoverContent>
    </Popover>
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
