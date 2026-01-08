import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'light' | 'medium' | 'strong';
}

/**
 * Glassmorphism card component with standardized glass effects
 * Used for headers and content cards with backdrop blur
 */
export function GlassCard({ children, className, variant = 'medium' }: GlassCardProps) {
  const variantClasses = {
    light: 'bg-background/40 backdrop-blur-sm',
    medium: 'bg-background/60 backdrop-blur-md',
    strong: 'bg-background/80 backdrop-blur-lg',
  };

  return (
    <div className={cn('rounded-xl border p-6 shadow-sm', variantClasses[variant], className)}>
      {children}
    </div>
  );
}
