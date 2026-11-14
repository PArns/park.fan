'use client';

import type { ReactNode } from 'react';
import { Check, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** The ground of a chosen card and of one that is not, shared by the assistants' cards. */
export const WIZARD_CARD_FRAME = {
  on: 'border-primary/45 bg-primary/5',
  off: 'border-border/70 bg-card',
} as const;

/** The square an assistant card's icon sits in, chosen and not. */
export const WIZARD_CARD_ICON = {
  on: 'bg-primary text-primary-foreground',
  off: 'bg-muted text-muted-foreground',
} as const;

/**
 * The round check at an assistant card's edge, filled when the card is chosen; its room is kept
 * either way, so choosing moves nothing.
 */
export function WizardCheck({ checked, className }: { checked: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
        checked ? 'bg-primary border-primary text-primary-foreground' : 'border-border',
        className
      )}
      aria-hidden="true"
    >
      {checked && <Check className="size-3" />}
    </span>
  );
}

/**
 * One question with a yes/no answer, as a card the whole of which is the switch: the day planner's
 * setup and the trip planner's assistant. A `<button aria-pressed>` rather than a styled checkbox:
 * the card may hold more controls, and a label cannot wrap interactive children.
 */
export function WizardToggle({
  icon: Icon,
  label,
  hint,
  checked,
  onChange,
  disabled = false,
  children,
}: {
  icon: LucideIcon;
  label: string;
  hint: ReactNode;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** Revealed under the card while it is on: the day planner's height chips. */
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border transition-colors',
        checked ? WIZARD_CARD_FRAME.on : WIZARD_CARD_FRAME.off,
        disabled && 'opacity-60'
      )}
    >
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        disabled={disabled}
        className="focus-visible:ring-ring flex min-h-11 w-full items-start gap-3 rounded-xl p-3 text-left focus-visible:ring-2 focus-visible:outline-none"
      >
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
            checked ? WIZARD_CARD_ICON.on : WIZARD_CARD_ICON.off
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{label}</span>
          <span className="text-muted-foreground mt-0.5 block text-xs leading-relaxed">{hint}</span>
        </span>
        <WizardCheck checked={checked} className="mt-0.5" />
      </button>
      {children && <div className="px-3 pb-3 pl-14">{children}</div>}
    </div>
  );
}
