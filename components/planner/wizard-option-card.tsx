'use client';

import { createContext, useContext, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WIZARD_CARD_FRAME, WIZARD_CARD_ICON, WizardCheck } from './wizard-toggle';

/** A photo on an option card, resolved by the caller: its source and its curated focal point. */
export interface WizardOptionPhoto {
  src: string;
  /** `object-position` from the photo's focal point. */
  position?: string;
}

/** Whether the group holds a chosen card; without one every card takes Tab. */
const GroupChosen = createContext(true);

/**
 * One answer of several as a card: an icon or a photo, a title, a sentence and the check, the whole
 * card the radio (`role="radio"`, its sentence as `aria-describedby`). The one option card of both
 * assistants and of the plan: hotels, gateways, ticket answers, the free-days question. It sits in a
 * {@link WizardOptionGroup}, which owns the arrow keys; `aside` is the effect on the right
 * ("+2 park days"), `children` what opens under a chosen card. `dashed` draws an answer that leaves
 * the choice to the plan ("Not decided yet"); a disabled card says why in its sentence.
 */
export function WizardOptionCard({
  checked,
  onSelect,
  title,
  hint,
  icon: Icon,
  photo,
  aside,
  dashed = false,
  disabled = false,
  size = 'row',
  children,
  ...data
}: {
  checked: boolean;
  onSelect: () => void;
  title: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  photo?: WizardOptionPhoto | null;
  /** The answer's effect, right of the title: "+2 Parktage", "10 Tage". */
  aside?: ReactNode;
  dashed?: boolean;
  disabled?: boolean;
  /** `row`: icon left of the text; `tile`: icon over the text, for two big cards side by side. */
  size?: 'row' | 'tile';
  /** Drawn under the card while it is chosen. */
  children?: ReactNode;
  [key: `data-${string}`]: string | undefined;
}) {
  const hintId = useId();
  const chosen = useContext(GroupChosen);
  const tile = size === 'tile';
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border transition',
        checked ? WIZARD_CARD_FRAME.on : WIZARD_CARD_FRAME.off,
        dashed && !checked && 'border-dashed',
        disabled && 'opacity-60'
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={checked}
        aria-describedby={hint ? hintId : undefined}
        aria-disabled={disabled || undefined}
        tabIndex={checked || !chosen ? 0 : -1}
        data-wizard-option=""
        onClick={() => {
          if (!disabled) onSelect();
        }}
        className={cn(
          'focus-visible:ring-ring relative flex min-h-11 w-full gap-3 text-left focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
          photo ? 'flex-col' : tile ? 'flex-col p-4' : 'items-start p-3',
          disabled && 'cursor-not-allowed'
        )}
        {...data}
      >
        {photo ? (
          <span className="bg-muted relative block aspect-[2/1] w-full overflow-hidden">
            <Image
              src={photo.src}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, 200px"
              quality={60}
              className={cn('object-cover transition', !checked && 'saturate-50')}
              style={{ objectPosition: photo.position }}
            />
          </span>
        ) : (
          Icon && (
            <span
              className={cn(
                'flex shrink-0 items-center justify-center rounded-lg transition-colors',
                tile ? 'size-10' : 'size-8',
                checked ? WIZARD_CARD_ICON.on : WIZARD_CARD_ICON.off
              )}
            >
              <Icon className={tile ? 'size-5' : 'size-4'} aria-hidden="true" />
            </span>
          )
        )}
        <span className={cn('flex min-w-0 flex-1 flex-col gap-0.5', photo && 'px-3 pb-3')}>
          <span className="flex items-start gap-2">
            <span className={cn('min-w-0 flex-1 font-medium', tile ? 'text-base' : 'text-sm')}>
              {title}
            </span>
            {aside && (
              <span className="text-muted-foreground shrink-0 text-xs leading-5 tabular-nums">
                {aside}
              </span>
            )}
          </span>
          {hint && (
            <span id={hintId} className="text-muted-foreground text-xs leading-relaxed">
              {hint}
            </span>
          )}
        </span>
        <WizardCheck
          checked={checked}
          className={cn(
            photo || tile ? 'absolute top-2.5 right-2.5' : 'mt-0.5',
            photo && !checked && 'bg-background/80'
          )}
        />
      </button>
      {checked && children && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

/**
 * A single choice of {@link WizardOptionCard}s: `role="radiogroup"` named by its question, and the
 * arrow keys move the choice to the next card that is not disabled, as `PlanSegmented` does; Tab
 * enters on the chosen card (the roving tabindex). A group usually has one chosen, the default
 * the plan already uses; with `chosen={false}` every card takes Tab until one is.
 */
export function WizardOptionGroup({
  labelledBy,
  label,
  chosen = true,
  className,
  children,
}: {
  /** The id of the element that asks the question: Parky's bubble or a heading. */
  labelledBy?: string;
  /** The question itself, where no element on screen asks it. */
  label?: string;
  /** Whether one of the cards is chosen. */
  chosen?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const radios = () =>
    [...(ref.current?.querySelectorAll<HTMLElement>('[data-wizard-option]') ?? [])].filter(
      (radio) => radio.closest('[role="radiogroup"]') === ref.current
    );
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;
    if (step === 0) return;
    const all = radios();
    const from = all.indexOf(event.target as HTMLElement);
    if (from === -1) return;
    event.preventDefault();
    for (let i = 1; i <= all.length; i += 1) {
      const next = all[(from + step * i + all.length * i) % all.length];
      if (next.getAttribute('aria-disabled') === 'true') continue;
      next.focus();
      next.click();
      return;
    }
  };
  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      onKeyDown={onKeyDown}
      className={cn('grid gap-2.5', className)}
      data-wizard-options=""
    >
      <GroupChosen value={chosen}>{children}</GroupChosen>
    </div>
  );
}
