'use client';

import { useTranslations } from 'next-intl';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { PHONE_TARGET_32 } from '@/lib/planner/touch-target';
import { usePushSubscription } from '@/lib/planner/use-push-subscription';
import { PlannerShareLink } from './planner-share-link';

interface PlannerPushToggleProps {
  /**
   * `row` is the block in the panel; `icon` is the bell in the panel's header. A variant rather
   * than a second component, because {@link usePushSubscription} holds its own state and asks
   * `/api/push`, so a wrapper would be a second subscription. The icon only moves the same body
   * into a popover, and the states that render nothing render no bell either.
   */
  variant?: 'row' | 'icon';
}

/**
 * The one control that turns notifications on. It renders nothing while `checking`, `unsupported`
 * or `unavailable`: a disabled switch would promise what the site cannot keep. `denied` renders and
 * says the browser is refusing.
 *
 * The sentence under it says the link to the uploaded plan is its only credential, and that
 * switching off deletes it, because that has to be said where the button is pressed. One sentence
 * covers a refused deletion: the plan is still up there, and pressing again retries.
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
          // `min-h-11`, not padding: padding around one line of `text-xs` came to 36 px, not 44.
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
      {/* Which kinds, only where there is a choice; one kind gets a sentence naming it. The list is
          the deploy's topics, never a hard-coded set: an id without copy is offered by its id,
          since hiding a switch is worse than an untranslated word. */}
      {on && availableTopics.length > 1 && (
        <fieldset className="mt-1 px-2" data-planner-push-topics="">
          <legend className="text-muted-foreground text-[10px] font-medium">
            {t('push.topics.legend')}
          </legend>
          <div className="mt-1 flex flex-col gap-0.5">
            {availableTopics.map((topic) => {
              const key = `push.topics.${topic}`;
              const checked = selectedTopics === null || selectedTopics.includes(topic);
              // The last one may not be unticked: a subscription with no topics reads "on" and
              // receives nothing. Turning all off is the master switch's job.
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

      {/* Only while it is on: before, it would warn about something that has not happened. */}
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

      {/* Right under the sentence that says the link is the password, so the two are read
          together. */}
      {on && <PlannerShareLink />}

      {/* Notifications did stop, the stored plan did not go with them, and nothing else on screen
          says so. `alert`, not `status`: it is mounted with its text, and only an assertive region
          is announced on insertion. */}
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
 * The bell, and the panel's switch behind it. `z-[80]` above the sheet's `z-[70]`, like every other
 * popover this panel opens; `align="end"`, or at 360 px the popover hangs off the screen.
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
          className={cn(
            'text-muted-foreground hover:text-foreground hover:bg-accent planner-phone:w-8 flex size-7 shrink-0 items-center justify-center rounded-md transition-colors',
            // 32 × 32 drawn beside the phone header's ×, 32 × 44 to a finger, like every control in
            // that row; on the desktop one of the header's 28 px icon buttons.
            PHONE_TARGET_32
          )}
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
