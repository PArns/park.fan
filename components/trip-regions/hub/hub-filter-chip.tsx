import { cn } from '@/lib/utils';

/**
 * A toggle of the hub's switches (the calendar's resorts, the best-time teaser's parks and trip
 * lengths): a pill that says whether it is pressed, 44 px high on a phone.
 */
export function HubFilterChip({
  pressed,
  onClick,
  children,
  ...props
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
} & Omit<React.ComponentProps<'button'>, 'onClick' | 'children'>) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'focus-visible:ring-ring inline-flex min-h-11 shrink-0 items-center rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none sm:min-h-9',
        pressed
          ? 'border-primary/50 bg-primary/15 text-foreground'
          : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50'
      )}
      {...props}
    >
      {children}
    </button>
  );
}
