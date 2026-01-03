import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconContainerProps {
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'muted' | 'success' | 'error' | 'warning';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
};

const iconSizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

const variantClasses = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary-foreground',
  muted: 'bg-muted text-muted-foreground',
  success: 'bg-success/10 text-success',
  error: 'bg-error/10 text-error',
  warning: 'bg-warning/10 text-warning',
};

export function IconContainer({
  icon: Icon,
  size = 'md',
  variant = 'primary',
  className,
}: IconContainerProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-xl',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      <Icon className={iconSizeClasses[size]} />
    </div>
  );
}
