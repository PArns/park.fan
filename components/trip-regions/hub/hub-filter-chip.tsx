import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A toggle of the hub's switches (the calendar's resorts, the best-time teaser's parks and trip
 * lengths): a pill that says whether it is pressed, 44 px high on a phone. `check` makes it one of
 * several that can be on at once: a checkbox in front, ticked while on, read as a checkbox.
 */
export function HubFilterChip({
  pressed,
  check = false,
  onClick,
  children,
  ...props
}: {
  pressed: boolean;
  check?: boolean;
  onClick: () => void;
  children: React.ReactNode;
} & Omit<React.ComponentProps<'button'>, 'onClick' | 'children'>) {
  return (
    <button
      type="button"
      {...(check ? { role: 'checkbox', 'aria-checked': pressed } : { 'aria-pressed': pressed })}
      onClick={onClick}
      className={cn(
        'focus-visible:ring-ring inline-flex min-h-11 shrink-0 items-center rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none sm:min-h-9',
        pressed
          ? 'border-primary/50 bg-primary/15 text-foreground'
          : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50'
      )}
      {...props}
    >
      {check && (
        <span
          aria-hidden
          className={cn(
            'mr-2 flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors',
            pressed
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground/50'
          )}
        >
          {pressed && <Check className="size-3" strokeWidth={3} />}
        </span>
      )}
      {children}
    </button>
  );
}
