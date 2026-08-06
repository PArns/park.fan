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
 * `heavy` is the strongest blur in the set and the only variant that parts from the shared
 * `--background` tint: it stays lighter than the other variants in light mode and goes markedly
 * DARKER in dark mode, so a panel laid over the hero photo (the world map, the search dropdown)
 * reads as one solid pane of glass instead of a washed-out rectangle with the photo bleeding
 * through its text.
 */
export function GlassCard({ children, className, variant = 'medium', ...rest }: GlassCardProps) {
  const variantClasses = {
    light: 'bg-background/40 backdrop-blur-sm',
    medium: 'bg-background/60 backdrop-blur-md',
    strong: 'bg-background/80 backdrop-blur-lg',
    heavy: 'bg-background/75 backdrop-blur-3xl dark:bg-[oklch(0.13_0.02_241_/_0.72)]',
  };

  return (
    <div
      className={cn('rounded-xl border p-6 shadow-sm', variantClasses[variant], className)}
      {...rest}
    >
      {children}
    </div>
  );
}
