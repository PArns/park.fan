'use client';

import { useId, type ReactNode } from 'react';
import { Check, Minus, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** The planner's focus ring, one string for every control it draws. */
export const PLAN_FOCUS =
  'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none';

/** A select or date field in the planner's panels, 44 px tall like every target in them. */
export const PLAN_FIELD = `border-border bg-background h-11 rounded-md border px-2 text-sm ${PLAN_FOCUS}`;

/** The × in the head of one of the planner's sheets, a 44 px target. */
export function PlanSheetClose({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'hover:bg-accent flex size-11 shrink-0 items-center justify-center rounded-md',
        PLAN_FOCUS
      )}
    >
      <X className="size-5" aria-hidden="true" />
    </button>
  );
}

/**
 * A checkbox with its label and an optional line under it, the whole row the target: at least 44 px
 * on a phone, as the planner's sheet requires of every target (docs/features/trip-planner/phone.md).
 */
export function PlanCheckRow({
  checked,
  onChange,
  label,
  hint,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        'hover:bg-accent/60 flex min-h-11 cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 transition-colors',
        disabled && 'pointer-events-none opacity-60'
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className={cn('accent-primary mt-0.5 size-4 shrink-0', PLAN_FOCUS)}
      />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm leading-5 font-medium">{label}</span>
        {hint && <span className="text-muted-foreground text-xs leading-snug">{hint}</span>}
      </span>
    </label>
  );
}

/**
 * One choice of several, as radio rows: a `fieldset` with its question as the legend, each option a
 * 44 px row with an optional line under it.
 */
export function PlanRadioGroup<T extends string>({
  legend,
  hint,
  value,
  options,
  onChange,
  disabled = false,
}: {
  legend: ReactNode;
  /** One short line under the question, for the whole group. */
  hint?: ReactNode;
  value: T | null;
  options: ReadonlyArray<{ value: T; label: ReactNode; hint?: ReactNode }>;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  const name = useId();
  return (
    <fieldset className="flex flex-col" disabled={disabled}>
      <legend className="mb-1 px-2 text-sm font-semibold">{legend}</legend>
      {hint && <p className="text-muted-foreground mb-1 px-2 text-xs leading-snug">{hint}</p>}
      {options.map((option) => (
        <label
          key={option.value}
          className="hover:bg-accent/60 flex min-h-11 cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 transition-colors"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className={cn('accent-primary mt-0.5 size-4 shrink-0', PLAN_FOCUS)}
          />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm leading-5">{option.label}</span>
            {option.hint && (
              <span className="text-muted-foreground text-xs leading-snug">{option.hint}</span>
            )}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

/**
 * A few short choices side by side, one pressed: the planner's segmented control, as the Dates
 * step's „Ich kenne meine Reisedaten | Beste Reisedaten finden“ draws it, 44 px tall on a phone.
 */
export function PlanSegmented<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
  className,
}: {
  /** What the group chooses, for a screen reader. */
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: ReactNode }>;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('bg-muted/50 grid gap-1 rounded-xl p-1', className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            'min-h-11 truncate rounded-lg px-2 text-sm font-medium transition disabled:opacity-50 lg:min-h-9',
            value === option.value
              ? 'bg-background shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
            PLAN_FOCUS
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * − value +, with 44 px buttons on a phone and 32 px at a desk. The value is an `<output>`, so a
 * screen reader hears the new count after a press.
 */
export function PlanStepper({
  value,
  onDecrement,
  onIncrement,
  canDecrement,
  canIncrement,
  decrementLabel,
  incrementLabel,
  disabled = false,
  valueClassName = 'w-11',
}: {
  value: ReactNode;
  onDecrement: () => void;
  onIncrement: () => void;
  canDecrement: boolean;
  canIncrement: boolean;
  decrementLabel: string;
  incrementLabel: string;
  disabled?: boolean;
  /** The value's width, so a column of steppers lines up: wider for "1–2 days". */
  valueClassName?: string;
}) {
  const button =
    'border-border/70 hover:bg-accent flex size-11 items-center justify-center rounded-full border transition-colors disabled:opacity-30 lg:size-8';
  return (
    <span className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={onDecrement}
        disabled={disabled || !canDecrement}
        aria-label={decrementLabel}
        className={cn(button, PLAN_FOCUS)}
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <output
        aria-live="polite"
        className={cn('text-center text-sm font-semibold tabular-nums', valueClassName)}
      >
        {value}
      </output>
      <button
        type="button"
        onClick={onIncrement}
        disabled={disabled || !canIncrement}
        aria-label={incrementLabel}
        className={cn(button, PLAN_FOCUS)}
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </span>
  );
}

/**
 * A pill to press, on or off (`aria-pressed`, or `aria-expanded` for one that opens more): the When
 * mode's periods, a ticket's days, its hopper and its variant, and the ticket question's two
 * answers. 44 px on a phone, 36 at a desk. `check` adds a check that shows when it is chosen, its
 * room kept either way, so choosing changes neither the size nor the border.
 */
export function PlanChip({
  selected,
  onClick,
  label,
  disabled = false,
  className,
  check = false,
  expanded,
  controls,
  ...data
}: {
  selected: boolean;
  onClick: () => void;
  label: ReactNode;
  disabled?: boolean;
  className?: string;
  check?: boolean;
  /** For a chip that opens a section: `aria-expanded` instead of `aria-pressed`. */
  expanded?: boolean;
  controls?: string;
  [key: `data-${string}`]: string | undefined;
}) {
  return (
    <button
      type="button"
      aria-pressed={expanded === undefined ? selected : undefined}
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'min-h-11 rounded-full border px-3.5 text-sm transition-colors disabled:opacity-40 lg:min-h-9',
        selected
          ? 'border-primary bg-primary/15 text-foreground font-semibold'
          : 'border-border/70 hover:bg-accent/60',
        check && 'inline-flex items-center justify-center gap-1.5',
        PLAN_FOCUS,
        className
      )}
      {...data}
    >
      {check && (
        <Check
          className={cn('text-primary-ink size-4 shrink-0', !selected && 'invisible')}
          aria-hidden="true"
        />
      )}
      {label}
    </button>
  );
}
