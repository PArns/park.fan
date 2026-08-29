'use client';

import { useId, useState, type ComponentProps, type ReactNode } from 'react';
import { Check, ChevronDown, Minus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/**
 * The form controls the admin edits with.
 *
 * Built here rather than installed, and that is a deliberate trade. The
 * shadcn/Radix pieces this would otherwise need — select, switch, checkbox,
 * label, radio-group — are none of them in this project's lockfile, and adding
 * five packages to render three inputs is a worse deal than sixty lines that
 * behave exactly as the rest of the site already looks. Dialog, popover and
 * command ARE installed and ARE used: those solve focus trapping and layering,
 * which is genuinely hard and not worth re-solving.
 *
 * Everything here is keyboard-complete. The admin is meant to be usable
 * without leaving the keyboard, so a control that can only be operated by
 * mouse is a control that does not belong in it.
 */

// ─── field wrapper ────────────────────────────────────────────────────────────

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
 * The shared look of every field, and the two numbers in it that are responsive.
 *
 * **`text-base` below `sm`, because iOS Safari zooms.** A focused input whose
 * computed font-size is under 16 px makes the browser scale the page up to meet
 * it, and it does not scale back on blur — so tapping the search field on a park
 * page left the whole admin at 1.3× with a horizontal scrollbar, and the only way
 * out was a pinch. `text-sm` is 14. Above `sm` there is a mouse and no zoom
 * behaviour, and 14 px is the density this tool is built around.
 *
 * **`h-11` below `sm`** is 44 px, which is the smallest target a thumb hits
 * reliably. The desk keeps `h-9`, off the button scale in `components/ui/button.tsx`
 * like the rest of the admin's control heights.
 */
const CONTROL_BASE =
  'border-border/70 bg-background/60 focus-visible:border-primary/60 focus-visible:ring-primary/20 w-full rounded-lg border px-3 text-base outline-none transition-colors focus-visible:ring-2 disabled:opacity-50 sm:text-sm';

/** Field height: a thumb's worth on a phone, the admin's own scale on a desk. */
const CONTROL_HEIGHT = 'h-11 sm:h-9';

/**
 * The same look for the places that render a bare `<input>` or `<textarea>`.
 *
 * Three of them existed — the media browser's detail panel, its upload dialog and
 * the walkthrough — each with its own copy of this string and its own idea of the
 * padding and the corner radius. They are the reason this is exported rather than
 * private: a fourth copy is how one field in the admin keeps zooming iOS after the
 * other three were fixed.
 *
 * Padded rather than fixed-height, because two of those call sites put it on a
 * `<textarea>` with its own `min-h-*`, and a height here would fight it.
 */
export const FIELD_CLASS = `${CONTROL_BASE} py-2 sm:py-1.5`;

export function TextInput({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(CONTROL_BASE, CONTROL_HEIGHT, className)} {...props} />;
}

export function TextArea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea className={cn(CONTROL_BASE, 'min-h-20 py-2 leading-relaxed', className)} {...props} />
  );
}

/**
 * A number input that can tell "empty" from "zero".
 *
 * That distinction is load-bearing here rather than pedantic: on a curated
 * height, **0 means "there is no minimum at all"** — an override that replaces
 * upstream's number with nothing — while empty means "no correction, accept
 * upstream". A control that coerces '' to 0 destroys the first, and one that
 * treats 0 as empty destroys the second.
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

// ─── switch ───────────────────────────────────────────────────────────────────

/**
 * A three-state switch: true, false, and "nothing said".
 *
 * Two states would be wrong for every curated boolean in this admin. `may get
 * wet` upstream is null for most rides and occasionally wrong where it is set,
 * so a correction has to be able to say `false` — and clearing the correction
 * has to be able to say "no opinion, use upstream" without that collapsing
 * into `false`. A plain checkbox cannot express the third.
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
      {/* The knob is placed from the track's left edge, not from wherever an
          absolutely positioned element without a `left` happens to land. It
          landed at the track's right edge — measured at x=638 on a 602–638
          track — so the white circle sat on top of the label next to it and
          the switch read as broken before anybody clicked it. Two pixels of
          inset either side, sixteen of knob, and a translate that stops
          exactly inside: 2 + 16 + 16 = 34 of 36. */}
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

export function Checkbox({
  checked,
  indeterminate,
  onCheckedChange,
  label,
  className,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn('inline-flex min-h-11 items-center gap-2 text-sm sm:min-h-0', className)}
    >
      <span
        className={cn(
          'flex h-4 w-4 items-center justify-center rounded border transition-colors',
          checked || indeterminate
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border/70 bg-background/60'
        )}
      >
        {indeterminate ? (
          <Minus className="h-3 w-3" />
        ) : checked ? (
          <Check className="h-3 w-3" />
        ) : null}
      </span>
      {label}
    </button>
  );
}

// ─── select ───────────────────────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
}

/**
 * A select on the installed popover, with an explicit empty option.
 *
 * The empty option is not decoration either: on a curated enum, choosing
 * nothing is how an editor withdraws a correction, and a native `<select>`
 * with no such entry makes that impossible without a separate "clear" button
 * nobody finds.
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

// ─── months ───────────────────────────────────────────────────────────────────

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
 * The twelve months, as a grid.
 *
 * A season is a shape, not a list, and the shape is what an editor is checking:
 * April–October reads as a block at a glance and as `[4,5,6,7,8,9,10]` only
 * after counting. The grid also makes the artefact this data is prone to
 * visible instantly — a ride flagged with `[1,2,3,4,12]` is not seasonal in
 * winter, it is a ride whose recording window started in December.
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
