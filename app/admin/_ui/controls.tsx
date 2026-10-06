'use client';

import { useId, useState, type ComponentProps, type ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/**
 * The form controls the admin edits with, built here because the Radix select, switch, checkbox,
 * label and radio-group are not in the lockfile (dialog, popover and command are, and are used).
 * Every control is keyboard-complete.
 */

/** A labelled field row: label and optional `aside`, the control, then an error or a hint. */
export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  className,
  aside,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
  /** Rendered opposite the label — a diff badge, a reset button. */
  aside?: ReactNode;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center gap-2">
        <label htmlFor={htmlFor} className="text-foreground/80 text-xs font-medium tracking-wide">
          {label}
        </label>
        {aside && <div className="ml-auto flex items-center gap-1">{aside}</div>}
      </div>
      {children}
      {error ? (
        <p className="text-destructive text-xs">{error}</p>
      ) : (
        hint && <p className="text-muted-foreground text-xs leading-snug">{hint}</p>
      )}
    </div>
  );
}

/**
 * The shared look of every field. `text-base` below `sm`: under 16 px iOS Safari zooms in on a
 * focused input and does not zoom back out on blur.
 */
const CONTROL_BASE =
  'border-border/70 bg-background/60 focus-visible:border-primary/60 focus-visible:ring-primary/20 w-full rounded-lg border px-3 text-base outline-none transition-colors focus-visible:ring-2 disabled:opacity-50 sm:text-sm';

/** Field height: a thumb's worth on a phone, the admin's own scale on a desk. */
const CONTROL_HEIGHT = 'h-11 sm:h-9';

/**
 * The same look for a bare `<input>` or `<textarea>`, exported so no call site keeps its own copy.
 * Padded rather than fixed-height, because the textareas carry their own `min-h-*`.
 */
export const FIELD_CLASS = `${CONTROL_BASE} py-2 sm:py-1.5`;

/** Text `<input>` in the admin field style: 44 px high, 16 px text on phones, `h-9` from `sm`. */
export function TextInput({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(CONTROL_BASE, CONTROL_HEIGHT, className)} {...props} />;
}

/** `<textarea>` in the admin field style, at least `min-h-20` tall. */
export function TextArea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea className={cn(CONTROL_BASE, 'min-h-20 py-2 leading-relaxed', className)} {...props} />
  );
}

/**
 * A number input that tells empty from zero: on a curated height, 0 means "no minimum at all" and
 * empty means "no correction, accept upstream".
 */
export function NumberInput({
  value,
  onValueChange,
  className,
  ...props
}: Omit<ComponentProps<'input'>, 'value' | 'onChange'> & {
  value: number | null;
  onValueChange: (value: number | null) => void;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      className={cn(CONTROL_BASE, CONTROL_HEIGHT, className)}
      value={value === null || value === undefined ? '' : String(value)}
      onChange={(event) => {
        const raw = event.target.value;
        if (raw === '') {
          onValueChange(null);
          return;
        }
        const parsed = Number(raw);
        onValueChange(Number.isFinite(parsed) ? parsed : null);
      }}
      {...props}
    />
  );
}

/**
 * A three-state switch (true, false, "nothing said"), because a curated boolean must be able to
 * say `false` and to withdraw the correction without that becoming `false`.
 */
export function TriSwitch({
  value,
  onValueChange,
  labels = { true: 'Ja', false: 'Nein', null: '—' },
  disabled,
}: {
  value: boolean | null;
  onValueChange: (value: boolean | null) => void;
  labels?: { true: string; false: string; null: string };
  disabled?: boolean;
}) {
  const options: Array<{ key: string; value: boolean | null; label: string }> = [
    { key: 'null', value: null, label: labels.null },
    { key: 'false', value: false, label: labels.false },
    { key: 'true', value: true, label: labels.true },
  ];

  return (
    <div
      role="radiogroup"
      className="border-border/70 bg-background/60 inline-flex rounded-lg border p-0.5"
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onValueChange(option.value)}
            className={cn(
              'min-h-9 rounded-md px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 sm:min-h-0',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** The ordinary two-state switch, for UI preferences rather than data. */
export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className="group inline-flex items-center gap-2 disabled:opacity-50"
    >
      {/* Placed from the track's left edge, or the knob lands on the label beside it. A 2 px
          inset, a 16 px knob and a 16 px translate stop inside the 36 px track. */}
      <span
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-muted-foreground/30'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </span>
      {label && <span className="text-sm">{label}</span>}
    </button>
  );
}

/** One option of `Select`. */
export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
}

/**
 * A select on the installed popover with an explicit empty option, since choosing nothing is how
 * an editor withdraws a correction on a curated enum.
 */
export function Select({
  value,
  onValueChange,
  options,
  placeholder = '—',
  allowEmpty = true,
  emptyLabel = '— keine Angabe —',
  className,
  disabled,
  id,
}: {
  value: string | null;
  onValueChange: (value: string | null) => void;
  options: SelectOption[];
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            CONTROL_BASE,
            CONTROL_HEIGHT,
            'flex items-center justify-between gap-2 text-left',
            className
          )}
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-1">
        <div className="max-h-64 overflow-y-auto">
          {allowEmpty && (
            <SelectRow
              label={emptyLabel}
              muted
              active={value === null}
              onSelect={() => {
                onValueChange(null);
                setOpen(false);
              }}
            />
          )}
          {options.map((option) => (
            <SelectRow
              key={option.value}
              label={option.label}
              hint={option.hint}
              active={option.value === value}
              onSelect={() => {
                onValueChange(option.value);
                setOpen(false);
              }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SelectRow({
  label,
  hint,
  active,
  muted,
  onSelect,
}: {
  label: string;
  hint?: string;
  active: boolean;
  muted?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
        muted && 'text-muted-foreground'
      )}
    >
      <Check className={cn('h-3.5 w-3.5 shrink-0', active ? 'opacity-100' : 'opacity-0')} />
      <span className="min-w-0 flex-1">
        <span className="block truncate">{label}</span>
        {hint && <span className="text-muted-foreground block truncate text-xs">{hint}</span>}
      </span>
    </button>
  );
}

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mär',
  'Apr',
  'Mai',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Okt',
  'Nov',
  'Dez',
];

/**
 * The twelve months as a grid, because a season is a shape: April to October reads as a block,
 * and an artefact like `[1,2,3,4,12]`, a recording window that began in December, shows at once.
 */
export function MonthPicker({
  value,
  onValueChange,
  reference,
  disabled,
}: {
  value: number[] | null;
  onValueChange: (value: number[] | null) => void;
  /** Shown as a faint outline behind the selection — what upstream says. */
  reference?: number[] | null;
  disabled?: boolean;
}) {
  const selected = new Set(value ?? []);
  const referenced = new Set(reference ?? []);

  function toggle(month: number) {
    const next = new Set(selected);
    if (next.has(month)) next.delete(month);
    else next.add(month);
    const sorted = [...next].sort((a, b) => a - b);
    // Empty means "no correction", never "operates in no month" — that state
    // is what retirement is for, and the API rejects it.
    onValueChange(sorted.length === 0 ? null : sorted);
  }

  return (
    <div className="grid grid-cols-6 gap-1">
      {MONTH_LABELS.map((label, index) => {
        const month = index + 1;
        const active = selected.has(month);
        const inReference = referenced.has(month);
        return (
          <button
            key={month}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            onClick={() => toggle(month)}
            title={inReference && !active ? 'Upstream sagt: aktiv' : undefined}
            className={cn(
              'min-h-10 rounded-md border px-1 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-50 sm:min-h-0',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : inReference
                  ? 'border-primary/40 text-muted-foreground hover:bg-accent border-dashed'
                  : 'border-border/60 text-muted-foreground hover:bg-accent'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** A labelled input id, for the many places a Field wraps one control. */
export function useFieldId(prefix: string): string {
  const id = useId();
  return `${prefix}-${id}`;
}
