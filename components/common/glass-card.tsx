import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'light' | 'medium' | 'strong' | 'heavy';
}

/**
 * Glassmorphism card component with standardized glass effects
 * Used for headers and content cards with backdrop blur
 *
 * `heavy` is the hero's glass and the only variant that parts from the shared `--background`
 * tint: it stays lighter than the other variants in light mode and goes markedly DARKER in dark
 * mode, so a panel laid over the hero photo (the world map, the search dropdown) reads as one
 * pane of glass rather than a washed-out rectangle with the photo bleeding through its text.
 *
 * It is deliberately NOT the biggest blur available. At 64 px over 75% fill the photo behind it
 * stopped being a photo — an even field of colour, with nothing left of the park behind the
 * panel. 24 px over 62% keeps shapes and light readable through the glass while the text on top
 * still measures far past AA (the hero copy clears 12:1 over the raw photo with no panel at all,
 * so the fill is not what is carrying legibility here). The radius is not a performance lever
 * either — 64 px, 24 px and 12 px all measured the same frame time.
 */
export function GlassCard({
  children,
  className,
  variant = 'medium',
  ref,
  ...rest
}: GlassCardProps & { ref?: React.Ref<HTMLDivElement> }) {
  const variantClasses = {
    light: 'bg-background/40 backdrop-blur-sm',
    medium: 'bg-background/60 backdrop-blur-md',
    strong: 'bg-background/80 backdrop-blur-lg',
    heavy: 'bg-background/62 backdrop-blur-xl dark:bg-[oklch(0.13_0.02_241_/_0.6)]',
  };

  return (
    <div
      ref={ref}
      className={cn('rounded-xl border p-6 shadow-sm', variantClasses[variant], className)}
      {...rest}
    >
      {children}
    </div>
  );
}
