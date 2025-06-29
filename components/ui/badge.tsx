import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        success: 'border-transparent bg-green-600 text-white dark:bg-green-700 dark:text-white',
        warning: 'border-transparent bg-orange-500 text-white dark:bg-orange-600 dark:text-white',
        error: 'border-transparent bg-red-600 text-white dark:bg-red-700 dark:text-white',
        critical: 'border-transparent bg-red-800 text-white dark:bg-red-900 dark:text-white',
        extreme: 'border-transparent bg-purple-700 text-white dark:bg-purple-800 dark:text-white',
        info: 'border-transparent bg-blue-600 text-white dark:bg-blue-700 dark:text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
