import { cn } from '@/lib/utils';

/**
 * The hero's pill row, the layout both the nearby bubbles and their skeleton render into. Its
 * height does not depend on its contents, because the two never wrap identically and the hero
 * must not move: below `sm` one row that scrolls sideways, from `sm` exactly two rows, with
 * anything past them clipped.
 */
export function HeroBubbleRow({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex h-9 items-center gap-2.5 overflow-x-auto overflow-y-hidden',
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        'sm:h-[5.375rem] sm:flex-wrap sm:content-start sm:overflow-x-hidden',
        'transition-opacity duration-200',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
